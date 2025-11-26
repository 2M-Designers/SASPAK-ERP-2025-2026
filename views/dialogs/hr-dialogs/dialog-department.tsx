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
  departmentId: z.number().optional(),
  companyId: z.number().optional(), // Taken from localStorage, default 1
  departmentName: z.string().min(1, "Department Name is required"),
  departmentCode: z.string().optional(), // Auto-generated at backend, send 0
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

interface DepartmentDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function DepartmentDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: DepartmentDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentId: defaultState.departmentId || undefined,
      companyId: defaultState.companyId || 1, // Default to 1
      departmentName: defaultState.departmentName || "",
      departmentCode: defaultState.departmentCode || "",
      description: defaultState.description || "",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  // Reset form when dialog opens/closes or when type changes
  useEffect(() => {
    if (open) {
      // Get company ID from localStorage or default to 1
      const user = localStorage.getItem("user");
      let companyId = 1; // Default to 1 as per requirement

      if (user) {
        try {
          const u = JSON.parse(user);
          companyId = u?.companyId || 1;
        } catch (error) {
          console.error("Error parsing user JSON:", error);
        }
      }

      form.reset({
        departmentId: defaultState.departmentId || undefined,
        companyId: companyId, // Set from localStorage with default 1
        departmentName: defaultState.departmentName || "",
        departmentCode: defaultState.departmentCode || "",
        description: defaultState.description || "",
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        version: defaultState.version || 0,
      });
    }
  }, [open, type, defaultState, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 0;
    let companyId = 1; // Default to 1 as per requirement

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
      departmentName: values.departmentName,
      description: values.description || "",
      isActive: values.isActive,
      version: values.version,
    };

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage with default 1
      payload.departmentCode = "0"; // Send 0 for auto-generation at backend
    } else {
      // For edit operation - include the ID and use received version
      payload.departmentId = values.departmentId;
      payload.companyId = values.companyId;
      payload.departmentCode = values.departmentCode;
      // Use the version as received from backend (no increment)
    }

    // Add user tracking if needed
    // if (isUpdate) {
    //   payload.updatedBy = userID;
    // } else {
    //   payload.createdBy = userID;
    // }

    console.log("Department Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "Department",
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

      // Prepare the response data to include in handleAddEdit
      const responseItem = {
        ...values,
        ...jsonData,
        // For add operations, include the generated departmentCode from backend
        ...(isUpdate
          ? {}
          : { departmentCode: jsonData?.departmentCode || "AUTO" }),
      };

      handleAddEdit(responseItem);

      toast({
        title: `Department ${
          type === "edit" ? "updated" : "added"
        } successfully.`,
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
            Add Department
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update department information."
              : "Add a new department to the system. Department Code will be auto-generated."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Display Company Info (read-only) */}
            <div className='p-3 bg-gray-50 rounded-md'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

                {/* Display Department Code for edit, show auto-generated message for add */}
                <div>
                  <FormLabel className='text-sm font-medium text-gray-600'>
                    Department Code
                  </FormLabel>
                  <div className='mt-1 text-sm text-gray-900'>
                    {type === "edit" ? (
                      form.watch("departmentCode") || "Not available"
                    ) : (
                      <span className='text-blue-600'>
                        Auto-generated by system
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Department Name */}
            <FormField
              control={form.control}
              name='departmentName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter department name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter department description...'
                      {...field}
                      rows={3}
                    />
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
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
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

            {/* Hidden fields */}
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
              {type === "edit" && (
                <FormField
                  control={form.control}
                  name='departmentId'
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
                {type === "edit" ? "Update Department" : "Add Department"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
