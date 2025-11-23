"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  hsCodeId: z.number().optional(),
  parentHsCodeId: z.number().optional(),
  code: z.string().min(1, "HS Code is required"),
  description: z.string().min(1, "Description is required"),
  chapter: z.string().min(1, "Chapter is required"),
  heading: z.string().min(1, "Heading is required"),
  customsDutyRate: z
    .number()
    .min(0, "Customs duty rate cannot be negative")
    .default(0),
  salesTaxRate: z
    .number()
    .min(0, "Sales tax rate cannot be negative")
    .default(0),
  regulatoryDutyRate: z
    .number()
    .min(0, "Regulatory duty rate cannot be negative")
    .default(0),
  additionalDutyRate: z
    .number()
    .min(0, "Additional duty rate cannot be negative")
    .default(0),
  uoM: z.string().min(1, "Unit of measure is required"),
  isActive: z.boolean().default(true),
  remarks: z.string().optional(),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  validTill: z.string().optional(),
  version: z.number().optional(),
});

interface HSCode {
  hsCodeId: number;
  parentHsCodeId: number;
  code: string;
  description: string;
  chapter: string;
  heading: string;
  customsDutyRate: number;
  salesTaxRate: number;
  regulatoryDutyRate: number;
  additionalDutyRate: number;
  uoM: string;
  isActive: boolean;
  remarks: string;
  effectiveFrom: string;
  validTill: string;
  version: number;
}

interface HSCodeDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function HSCodeDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: HSCodeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parentHSCodes, setParentHSCodes] = useState<HSCode[]>([]);
  const [loadingParentHSCodes, setLoadingParentHSCodes] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hsCodeId: defaultState.hsCodeId || undefined,
      parentHsCodeId: defaultState.parentHsCodeId || 0,
      code: defaultState.code || "",
      description: defaultState.description || "",
      chapter: defaultState.chapter || "",
      heading: defaultState.heading || "",
      customsDutyRate: defaultState.customsDutyRate || 0,
      salesTaxRate: defaultState.salesTaxRate || 0,
      regulatoryDutyRate: defaultState.regulatoryDutyRate || 0,
      additionalDutyRate: defaultState.additionalDutyRate || 0,
      uoM: defaultState.uoM || "",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      remarks: defaultState.remarks || "",
      effectiveFrom: defaultState.effectiveFrom || "",
      validTill: defaultState.validTill || "",
      version: defaultState.version || 0,
    },
  });

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Fetch parent HS Codes when dialog opens
  useEffect(() => {
    if (open) {
      fetchParentHSCodes();
    }
  }, [open]);

  const fetchParentHSCodes = async () => {
    setLoadingParentHSCodes(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}HSCode/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "HsCodeId, Code, Description, Chapter, Heading",
          where: "IsActive == true",
          sortOn: "Code",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setParentHSCodes(data);
      } else {
        throw new Error("Failed to fetch parent HS Codes");
      }
    } catch (error) {
      console.error("Error fetching parent HS Codes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load parent HS Codes list",
      });
    } finally {
      setLoadingParentHSCodes(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 0;

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Create payload - handle optional parentHsCodeId and validTill
    const payload = {
      ...values,
      parentHsCodeId:
        values.parentHsCodeId === 0 ? null : values.parentHsCodeId,
      validTill: values.validTill || null,
      //...(isUpdate ? { UpdatedBy: userID } : { CreatedBy: userID }),
    };

    console.log("HS Code Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "HSCode",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const responseData = await response.text();
      const jsonData = responseData ? JSON.parse(responseData) : null;

      if (jsonData?.statusCode >= 400) {
        throw new Error(jsonData.message || "Unknown error occurred");
      }

      setOpen(false);

      handleAddEdit({
        ...values,
        ...jsonData,
      });

      toast({
        title: `HS Code ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add HS Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit HS Code" : "Add New HS Code"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update HS Code information."
              : "Add a new HS Code to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Parent HS Code Dropdown */}
              <FormField
                control={form.control}
                name='parentHsCodeId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent HS Code</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || 0}
                        onChange={(e) => {
                          const value =
                            e.target.value === "0"
                              ? 0
                              : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={loadingParentHSCodes}
                      >
                        <option value={0}>No Parent HS Code</option>
                        {parentHSCodes
                          .filter((hscode) =>
                            type === "edit"
                              ? hscode.hsCodeId !== defaultState.hsCodeId
                              : true
                          )
                          .map((hscode) => (
                            <option
                              key={hscode.hsCodeId}
                              value={hscode.hsCodeId}
                            >
                              {hscode.code} - {hscode.description}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    {loadingParentHSCodes && (
                      <p className='text-sm text-gray-500'>
                        Loading parent HS Codes...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* HS Code (Normal Input Field) */}
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HS Code *</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., 0101.21.10' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter HS Code description'
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Chapter */}
              <FormField
                control={form.control}
                name='chapter'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter *</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., 01' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Heading */}
              <FormField
                control={form.control}
                name='heading'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heading *</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., 0101' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duty Rates */}
            <div className='space-y-4'>
              <FormLabel>Duty Rates (%)</FormLabel>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {/* Customs Duty Rate */}
                <FormField
                  control={form.control}
                  name='customsDutyRate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customs Duty</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min='0'
                          placeholder='0.00'
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sales Tax Rate */}
                <FormField
                  control={form.control}
                  name='salesTaxRate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Tax</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min='0'
                          placeholder='0.00'
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Regulatory Duty Rate */}
                <FormField
                  control={form.control}
                  name='regulatoryDutyRate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regulatory Duty</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min='0'
                          placeholder='0.00'
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Additional Duty Rate */}
                <FormField
                  control={form.control}
                  name='additionalDutyRate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Duty</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min='0'
                          placeholder='0.00'
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Unit of Measure */}
              <FormField
                control={form.control}
                name='uoM'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure *</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., KG, LTR, Number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2 pt-2'>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          className='w-4 h-4'
                        />
                        <span className='text-sm font-medium'>
                          {field.value ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Effective From */}
              <FormField
                control={form.control}
                name='effectiveFrom'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From *</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valid Till */}
              <FormField
                control={form.control}
                name='validTill'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Till</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Remarks */}
            <FormField
              control={form.control}
              name='remarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any remarks or notes...'
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {type === "edit" ? "Update HS Code" : "Add HS Code"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
