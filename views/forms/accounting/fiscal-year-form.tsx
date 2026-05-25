"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  fiscalYearId: z.number().optional(),
  companyId: z.number().optional(),
  fiscalYearName: z.string().min(1, "Fiscal Year Name is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

interface FiscalYearFormProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  onCancel: () => void;
}

export default function FiscalYearForm({
  type,
  defaultState,
  handleAddEdit,
  onCancel,
}: FiscalYearFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fiscalYearId: defaultState.fiscalYearId || undefined,
      companyId: defaultState.companyId || 0,
      fiscalYearName: defaultState.fiscalYearName || "",
      startDate: defaultState.startDate || "",
      endDate: defaultState.endDate || "",
      isActive: defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    // Get companyId from localStorage
    const user = localStorage.getItem("user");
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    // Reset form when defaultState changes
    if (type === "edit" && defaultState) {
      form.reset({
        fiscalYearId: defaultState.fiscalYearId,
        companyId: defaultState.companyId || companyId,
        fiscalYearName: defaultState.fiscalYearName || "",
        startDate: defaultState.startDate || "",
        endDate: defaultState.endDate || "",
        isActive: defaultState.isActive !== undefined ? defaultState.isActive : true,
        version: defaultState.version || 0,
      });
    } else if (type === "add") {
      form.reset({
        fiscalYearId: undefined,
        companyId: companyId,
        fiscalYearName: "",
        startDate: "",
        endDate: "",
        isActive: true,
        version: 0,
      });
    }
  }, [type, defaultState, form]);

  // Validate that end date is after start date
  const validateDates = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        toast({
          variant: "destructive",
          title: "Invalid Date Range",
          description: "End date must be after start date",
        });
        return false;
      }
      
      // Optional: Validate that fiscal year doesn't exceed 12 months
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 366) {
        toast({
          variant: "destructive",
          title: "Invalid Date Range",
          description: "Fiscal year cannot exceed 12 months",
        });
        return false;
      }
    }
    return true;
  };

  // Auto-generate fiscal year name based on dates
  const generateFiscalYearName = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();
      
      if (startYear === endYear) {
        return `${startYear}`;
      } else {
        return `${startYear}-${endYear}`;
      }
    }
    return "";
  };

  // Watch dates to auto-generate fiscal year name
  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");

  useEffect(() => {
    if (type === "add" && watchStartDate && watchEndDate) {
      const generatedName = generateFiscalYearName(watchStartDate, watchEndDate);
      if (generatedName && !form.getValues("fiscalYearName")) {
        form.setValue("fiscalYearName", generatedName);
      }
    }
  }, [watchStartDate, watchEndDate, type, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate date range
    if (!validateDates(values.startDate, values.endDate)) {
      return;
    }

    const isUpdate = type === "edit";

    const payload: any = {
      fiscalYearName: values.fiscalYearName,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      isActive: values.isActive,
      version: values.version || 0,
    };

    // Add companyId from form or localStorage
    const user = localStorage.getItem("user");
    let companyId = values.companyId;

    if (!companyId || companyId === 0) {
      if (user) {
        try {
          const u = JSON.parse(user);
          companyId = u?.companyId || 1;
        } catch (error) {
          console.error("Error parsing user JSON:", error);
          companyId = 1;
        }
      } else {
        companyId = 1;
      }
    }
    payload.companyId = companyId;

    if (isUpdate) {
      payload.fiscalYearId = values.fiscalYearId;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}FiscalYear`, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const responseData = await response.text();
      const jsonData = responseData ? JSON.parse(responseData) : null;

      if (jsonData?.statusCode >= 400) {
        throw new Error(jsonData.message || "Unknown error occurred");
      }

      const responseItem = {
        ...values,
        ...jsonData,
        companyId: companyId,
      };

      toast({
        title: `Fiscal Year ${type === "edit" ? "updated" : "added"} successfully.`,
      });

      handleAddEdit(responseItem);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save fiscal year",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const companyName = (() => {
    if (typeof window === "undefined") return "SASPAK CARGO";
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const u = JSON.parse(user);
        return u?.companyName || "SASPAK CARGO";
      } catch {
        return "SASPAK CARGO";
      }
    }
    return "SASPAK CARGO";
  })();

  return (
    <div className="p-6 bg-white shadow-md rounded-md max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {type === "edit" ? "Edit Fiscal Year" : "Add New Fiscal Year"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {type === "edit"
              ? "Update fiscal year information."
              : "Add a new fiscal year to the system."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Company Information */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <FormLabel className="text-sm font-medium text-gray-600">
                  Company
                </FormLabel>
                <div className="mt-1 text-sm text-gray-900">{companyName}</div>
              </div>
            </div>
          </div>

          {/* Fiscal Year Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Fiscal Year Information</h3>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="fiscalYearName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 2024 or 2024-2025" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      {type === "add" && "Will be auto-generated based on selected dates"}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={formatDateForInput(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={formatDateForInput(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">
                          {field.value ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Date Range Information Display */}
          {(form.watch("startDate") && form.watch("endDate")) && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Fiscal Year Duration:</strong> {new Date(form.watch("startDate")).toLocaleDateString()} to {new Date(form.watch("endDate")).toLocaleDateString()}
              </p>
              {form.watch("startDate") && form.watch("endDate") && (
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Duration:</strong>{' '}
                  {Math.ceil(
                    (new Date(form.watch("endDate")).getTime() - new Date(form.watch("startDate")).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </p>
              )}
            </div>
          )}

          {/* Hidden fields */}
          <div className="hidden">
            <FormField 
              control={form.control} 
              name="version" 
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )} 
            />
            <FormField 
              control={form.control} 
              name="companyId" 
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )} 
            />
            {type === "edit" && (
              <FormField 
                control={form.control} 
                name="fiscalYearId" 
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )} 
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === "edit" ? "Update Fiscal Year" : "Add Fiscal Year"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}