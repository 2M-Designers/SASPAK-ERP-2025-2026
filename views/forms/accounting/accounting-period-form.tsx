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
  accountingPeriodId: z.number().optional(),
  fiscalYearId: z.number().min(1, "Fiscal Year is required"),
  periodName: z.string().min(1, "Period Name is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  status: z.string().min(1, "Status is required"),
  version: z.number().optional(),
});

interface FiscalYear {
  fiscalYearId: number;
  fiscalYearName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface AccountingPeriodFormProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  onCancel: () => void;
}

export default function AccountingPeriodForm({
  type,
  defaultState,
  handleAddEdit,
  onCancel,
}: AccountingPeriodFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loadingFiscalYears, setLoadingFiscalYears] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountingPeriodId: defaultState.accountingPeriodId || undefined,
      fiscalYearId: defaultState.fiscalYearId || 0,
      periodName: defaultState.periodName || "",
      startDate: defaultState.startDate || "",
      endDate: defaultState.endDate || "",
      status: defaultState.status || "Open",
      version: defaultState.version || 0,
    },
  });

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    fetchFiscalYears();
    
    // Reset form when defaultState changes
    if (type === "edit" && defaultState) {
      form.reset({
        accountingPeriodId: defaultState.accountingPeriodId,
        fiscalYearId: defaultState.fiscalYearId || 0,
        periodName: defaultState.periodName || "",
        startDate: defaultState.startDate || "",
        endDate: defaultState.endDate || "",
        status: defaultState.status || "Open",
        version: defaultState.version || 0,
      });
    } else if (type === "add") {
      form.reset({
        accountingPeriodId: undefined,
        fiscalYearId: 0,
        periodName: "",
        startDate: "",
        endDate: "",
        status: "Open",
        version: 0,
      });
    }
  }, [type, defaultState, form]);

  const fetchFiscalYears = async () => {
    setLoadingFiscalYears(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}FiscalYear/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "FiscalYearId,FiscalYearName,StartDate,EndDate,IsActive",
          where: "IsActive == true",
          sortOn: "fiscalYearName",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setFiscalYears(data);
      } else {
        throw new Error("Failed to fetch fiscal years");
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to load fiscal years list" 
      });
    } finally {
      setLoadingFiscalYears(false);
    }
  };

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
    }
    return true;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate date range
    if (!validateDates(values.startDate, values.endDate)) {
      return;
    }

    const isUpdate = type === "edit";

    const payload: any = {
      fiscalYearId: values.fiscalYearId,
      periodName: values.periodName,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      status: values.status,
      version: values.version || 0,
    };

    if (isUpdate) {
      payload.accountingPeriodId = values.accountingPeriodId;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}AccountingPeriod`, {
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
      };

      toast({
        title: `Accounting Period ${type === "edit" ? "updated" : "added"} successfully.`,
      });

      handleAddEdit(responseItem);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save accounting period",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Watch start date to auto-generate period name (optional feature)
  const watchStartDate = form.watch("startDate");
  const watchFiscalYearId = form.watch("fiscalYearId");

  useEffect(() => {
    // Auto-generate period name based on start date (optional)
    if (type === "add" && watchStartDate && !form.getValues("periodName")) {
      const date = new Date(watchStartDate);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      form.setValue("periodName", `${month}-${year}`);
    }
  }, [watchStartDate, type, form]);

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
            {type === "edit" ? "Edit Accounting Period" : "Add New Accounting Period"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {type === "edit"
              ? "Update accounting period information."
              : "Add a new accounting period to the system."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Accounting Period Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Accounting Period Information</h3>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="fiscalYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0" ? 0 : parseInt(e.target.value)
                          )
                        }
                        disabled={loadingFiscalYears}
                      >
                        <option value={0}>Select Fiscal Year</option>
                        {fiscalYears.map((fiscalYear) => (
                          <option key={fiscalYear.fiscalYearId} value={fiscalYear.fiscalYearId}>
                            {fiscalYear.fiscalYearName} 
                            {fiscalYear.startDate && fiscalYear.endDate && 
                              ` (${new Date(fiscalYear.startDate).getFullYear()} - ${new Date(fiscalYear.endDate).getFullYear()})`
                            }
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingFiscalYears && (
                      <p className="text-sm text-gray-500">Loading fiscal years...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Jan-2024, Q1-2024" 
                        {...field} 
                      />
                    </FormControl>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || ""}
                        onChange={field.onChange}
                      >
                        <option value="">Select Status</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Date Range Validation Info */}
          {(form.watch("startDate") && form.watch("endDate")) && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Period Duration:</strong> {new Date(form.watch("startDate")).toLocaleDateString()} to {new Date(form.watch("endDate")).toLocaleDateString()}
              </p>
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
            {type === "edit" && (
              <FormField 
                control={form.control} 
                name="accountingPeriodId" 
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
              {type === "edit" ? "Update Accounting Period" : "Add Accounting Period"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}