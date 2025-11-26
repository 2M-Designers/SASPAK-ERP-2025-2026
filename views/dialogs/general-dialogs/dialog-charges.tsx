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
  chargeId: z.number().optional(),
  companyId: z.number().optional(), // Taken from localStorage, default 1
  chargeCode: z.string().min(1, "Charge Code is required"),
  chargeName: z.string().min(1, "Charge Name is required"),
  chargeType: z.string().min(1, "Charge Type is required"),
  chargeGroup: z.string().min(1, "Charge Group is required"),
  revenueGLAccountId: z.number().min(1, "Revenue GL Account is required"),
  costGLAccountId: z.number().min(1, "Cost GL Account is required"),
  isTaxable: z.boolean().default(false),
  defaultTaxPercentage: z
    .number()
    .min(0, "Tax percentage cannot be negative")
    .max(100, "Tax percentage cannot exceed 100")
    .optional(),
  isReimbursable: z.boolean().default(false),
  isActive: z.boolean().default(true),
  remarks: z.string().optional(),
  version: z.number().default(0),
});

// Dummy GL Accounts data
const dummyGLAccounts = [
  { id: 1, name: "Revenue Account 1", code: "REV001" },
  { id: 2, name: "Revenue Account 2", code: "REV002" },
  { id: 3, name: "Cost Account 1", code: "COS001" },
  { id: 4, name: "Cost Account 2", code: "COS002" },
  { id: 5, name: "Revenue Account 3", code: "REV003" },
  { id: 6, name: "Cost Account 3", code: "COS003" },
];

// Charge Types
const chargeTypes = [
  "Freight",
  "Handling",
  "Customs",
  "Insurance",
  "Storage",
  "Documentation",
  "Other",
];

interface ChargesDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function ChargesDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: ChargesDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chargeId: defaultState.chargeId || undefined,
      companyId: defaultState.companyId || 1,
      chargeCode: defaultState.chargeCode || "",
      chargeName: defaultState.chargeName || "",
      chargeType: defaultState.chargeType || "",
      chargeGroup: defaultState.chargeGroup || "",
      revenueGLAccountId: defaultState.revenueGLAccountId || 0,
      costGLAccountId: defaultState.costGLAccountId || 0,
      isTaxable:
        defaultState.isTaxable !== undefined ? defaultState.isTaxable : false,
      defaultTaxPercentage: defaultState.defaultTaxPercentage || 0,
      isReimbursable:
        defaultState.isReimbursable !== undefined
          ? defaultState.isReimbursable
          : false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      remarks: defaultState.remarks || "",
      version: defaultState.version || 0,
    },
  });

  // Watch isTaxable to conditionally show tax percentage
  const isTaxable = form.watch("isTaxable");

  // Reset form when dialog opens/closes or defaultState changes
  useEffect(() => {
    if (open) {
      // Get company ID from localStorage
      const user = localStorage.getItem("user");
      let companyId = 1; // Default value

      if (user) {
        try {
          const u = JSON.parse(user);
          companyId = u?.companyId || 1;
        } catch (error) {
          console.error("Error parsing user JSON:", error);
        }
      }

      form.reset({
        chargeId: defaultState.chargeId || undefined,
        companyId: companyId, // Set from localStorage
        chargeCode: defaultState.chargeCode || "",
        chargeName: defaultState.chargeName || "",
        chargeType: defaultState.chargeType || "",
        chargeGroup: defaultState.chargeGroup || "",
        revenueGLAccountId: defaultState.revenueGLAccountId || 0,
        costGLAccountId: defaultState.costGLAccountId || 0,
        isTaxable:
          defaultState.isTaxable !== undefined ? defaultState.isTaxable : false,
        defaultTaxPercentage: defaultState.defaultTaxPercentage || 0,
        isReimbursable:
          defaultState.isReimbursable !== undefined
            ? defaultState.isReimbursable
            : false,
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        remarks: defaultState.remarks || "",
        version: defaultState.version || 0,
      });
    }
  }, [open, defaultState, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 0;
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Prepare payload according to requirements
    const payload: any = {
      chargeCode: values.chargeCode,
      chargeName: values.chargeName,
      chargeType: values.chargeType,
      chargeGroup: values.chargeGroup,
      revenueGLAccountId: values.revenueGLAccountId,
      costGLAccountId: values.costGLAccountId,
      isTaxable: values.isTaxable,
      defaultTaxPercentage: values.defaultTaxPercentage || 0,
      isReimbursable: values.isReimbursable,
      isActive: values.isActive,
      remarks: values.remarks || "",
      version: values.version || 0,
    };

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage
    } else {
      // For edit operation - include the ID
      payload.chargeId = values.chargeId;
      payload.companyId = values.companyId;
    }

    // Add user tracking if needed
    // if (isUpdate) {
    //   payload.updatedBy = userID;
    // } else {
    //   payload.createdBy = userID;
    // }

    console.log("Charges Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "ChargesMaster",
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

      // Call the parent handler with the response data
      handleAddEdit(jsonData || values);

      toast({
        title: `Charge ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("API Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process charge operation",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add Charge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Charge" : "Add New Charge"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update charge information."
              : "Add a new charge to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Display Company Info (read-only) */}
            <div className='p-3 bg-gray-50 rounded-md'>
              <div>
                <FormLabel className='text-sm font-medium text-gray-600'>
                  Company
                </FormLabel>
                <div className='mt-1 text-sm text-gray-900'>
                  {(() => {
                    const user = localStorage.getItem("user");
                    if (user) {
                      try {
                        const u = JSON.parse(user);
                        return u?.companyName || "SASPAK CARGO";
                      } catch (error) {
                        return "SASPAK CARGO";
                      }
                    }
                    return "SASPAK CARGO";
                  })()}
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Charge Code */}
              <FormField
                control={form.control}
                name='chargeCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter charge code'
                        {...field}
                        className='uppercase'
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Charge Name */}
              <FormField
                control={form.control}
                name='chargeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter charge name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Charge Type */}
              <FormField
                control={form.control}
                name='chargeType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Type *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || ""}
                        onChange={field.onChange}
                      >
                        <option value=''>Select Charge Type</option>
                        {chargeTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Charge Group */}
              <FormField
                control={form.control}
                name='chargeGroup'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Group *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter charge group' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Revenue GL Account */}
              <FormField
                control={form.control}
                name='revenueGLAccountId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue GL Account *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      >
                        <option value={0}>Select Revenue Account</option>
                        {dummyGLAccounts
                          .filter((account) => account.code.startsWith("REV"))
                          .map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost GL Account */}
              <FormField
                control={form.control}
                name='costGLAccountId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost GL Account *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      >
                        <option value={0}>Select Cost Account</option>
                        {dummyGLAccounts
                          .filter((account) => account.code.startsWith("COS"))
                          .map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Is Taxable */}
              <FormField
                control={form.control}
                name='isTaxable'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Taxable</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        Charge is taxable
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Reimbursable */}
              <FormField
                control={form.control}
                name='isReimbursable'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Reimbursable</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        Charge is reimbursable
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active */}
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Status</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        {field.value ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Default Tax Percentage (conditionally shown) */}
            {isTaxable && (
              <FormField
                control={form.control}
                name='defaultTaxPercentage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tax Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter tax percentage'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        min={0}
                        max={100}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Remarks */}
            <FormField
              control={form.control}
              name='remarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any remarks...'
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields */}
            <div className='hidden'>
              <FormField
                control={form.control}
                name='chargeId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='companyId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='version'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

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
                {type === "edit" ? "Update Charge" : "Add Charge"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
