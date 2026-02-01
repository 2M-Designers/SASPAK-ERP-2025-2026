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

// Validation Schema for Security Type
const formSchema = z.object({
  securityTypeId: z.number().optional(),
  securityTypeCode: z.string().min(1, "Security Type Code is required"),
  securityTypeName: z.string().min(1, "Security Type Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

interface SecurityTypeDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function SecurityTypeDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: SecurityTypeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      securityTypeId: defaultState.securityTypeId || undefined,
      securityTypeCode: defaultState.securityTypeCode || "",
      securityTypeName: defaultState.securityTypeName || "",
      description: defaultState.description || "",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  // Reset form when dialog opens/closes or when type changes
  useEffect(() => {
    if (open) {
      // Parse numeric values
      const parseNumeric = (value: any) => {
        if (value === null || value === undefined || value === "")
          return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      form.reset({
        securityTypeId: defaultState.securityTypeId || undefined,
        securityTypeCode: defaultState.securityTypeCode || "",
        securityTypeName: defaultState.securityTypeName || "",
        description: defaultState.description || "",
        isActive:
          defaultState.isActive !== undefined
            ? Boolean(defaultState.isActive)
            : true,
        version: parseNumeric(defaultState.version),
      });
    }
  }, [open, type, defaultState, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 5;
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 5;
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Prepare payload - exactly matching the expected fields
    const payload: any = {
      SecurityTypeId: values.securityTypeId || 0,
      SecurityTypeCode: values.securityTypeCode.toUpperCase(),
      SecurityTypeName: values.securityTypeName,
      Description: values.description || "",
      IsActive: values.isActive,
      CompanyId: companyId,
      Version: values.version || 0,
      CreatedBy: userID,
      UpdatedBy: userID,
    };

    // For edit operation - ensure we have the ID
    if (isUpdate && values.securityTypeId) {
      payload.SecurityTypeId = values.securityTypeId;
      // Increment version for edit
      payload.Version = values.version || 0;
    } else {
      // For create, set ID to 0
      payload.SecurityTypeId = 0;
      payload.Version = 0;
    }

    console.log("Security Type Payload:", payload);
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const endpoint = "SetupSecurityType";
      const method = isUpdate ? "PUT" : "POST";

      console.log("Calling API:", `${baseUrl}${endpoint}`, method);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      // First read the response as text to handle empty responses
      const responseText = await response.text();
      console.log("Response text:", responseText);

      let jsonData: any = null;
      if (responseText && responseText.trim() !== "") {
        try {
          jsonData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          throw new Error("Server returned invalid JSON response");
        }
      }

      if (!response.ok) {
        throw new Error(jsonData?.message || `HTTP Error: ${response.status}`);
      }

      if (jsonData?.statusCode >= 400) {
        throw new Error(jsonData.message || "Unknown error occurred");
      }

      setOpen(false);

      // Prepare the response data to include in handleAddEdit
      const responseItem = {
        securityTypeId:
          jsonData?.securityTypeId ||
          jsonData?.SecurityTypeId ||
          payload.SecurityTypeId,
        securityTypeCode: payload.SecurityTypeCode,
        securityTypeName: payload.SecurityTypeName,
        description: payload.Description,
        isActive: payload.IsActive,
        companyId: payload.CompanyId,
        version: payload.Version,
        createdBy: payload.CreatedBy,
        updatedBy: payload.UpdatedBy,
        createdAt: defaultState.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      handleAddEdit(responseItem);

      toast({
        title: `Security Type ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("API Error Details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to process security type operation",
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
            Add Security Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Security Type" : "Add New Security Type"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update security type information."
              : "Add a new security type to the system."}
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

            <div className='grid grid-cols-1 gap-4'>
              {/* Security Type Code */}
              <FormField
                control={form.control}
                name='securityTypeCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Type Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter security type code (e.g., SEC001)'
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

              {/* Security Type Name */}
              <FormField
                control={form.control}
                name='securityTypeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Type Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter security type name'
                        {...field}
                      />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter description (optional)'
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <div className='text-xs text-gray-500'>
                    Optional. Provide additional details about this security
                    type.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-between p-4 border rounded-md bg-gray-50'>
              <div className='flex items-center space-x-3'>
                {/* Is Active */}
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
                      <FormControl>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
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

              {/* Version info for edit mode */}
              {type === "edit" && (
                <div className='text-sm text-gray-600 text-right'>
                  <p className='font-medium'>
                    Version: {form.watch("version") || 0}
                  </p>
                  <p className='text-xs text-gray-500'>
                    Version will be incremented on update
                  </p>
                </div>
              )}
            </div>

            {/* Hidden fields for version tracking and IDs */}
            <div className='hidden'>
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
              {type === "edit" && (
                <FormField
                  control={form.control}
                  name='securityTypeId'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type='hidden' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
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
                {type === "edit" ? "Update Security Type" : "Add Security Type"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
