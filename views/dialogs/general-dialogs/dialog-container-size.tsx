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
  containerSizeId: z.number().optional(),
  sizeCode: z.string().min(1, "Size Code is required"),
  description: z.string().optional(),
  lengthFeet: z.number().min(0.01, "Length must be greater than 0"),
  heightFeet: z.number().min(0.01, "Height must be greater than 0"),
  widthFeet: z.number().min(0.01, "Width must be greater than 0"),
  isActive: z.boolean().default(true),
  companyId: z.number().optional(),
  version: z.number().optional(),
});

interface ContainerSizeDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function ContainerSizeDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: ContainerSizeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      containerSizeId: defaultState.containerSizeId || undefined,
      sizeCode: defaultState.sizeCode || "",
      description: defaultState.description || "",
      lengthFeet: defaultState.lengthFeet || 0,
      heightFeet: defaultState.heightFeet || 0,
      widthFeet: defaultState.widthFeet || 0,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      companyId: defaultState.companyId || 0,
      version: defaultState.version || 0,
    },
  });

  // Reset form when dialog opens/closes or when type changes
  useEffect(() => {
    if (open) {
      // Get company ID from localStorage or default to 0
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

      form.reset({
        containerSizeId: defaultState.containerSizeId || undefined,
        sizeCode: defaultState.sizeCode || "",
        description: defaultState.description || "",
        lengthFeet: defaultState.lengthFeet
          ? parseFloat(defaultState.lengthFeet)
          : 0,
        heightFeet: defaultState.heightFeet
          ? parseFloat(defaultState.heightFeet)
          : 0,
        widthFeet: defaultState.widthFeet
          ? parseFloat(defaultState.widthFeet)
          : 0,
        isActive:
          defaultState.isActive !== undefined
            ? Boolean(defaultState.isActive)
            : true,
        companyId:
          type === "add" ? companyId : defaultState.companyId || companyId,
        version: defaultState.version || 0,
      });
    }
  }, [open, type, defaultState, form]);

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
      sizeCode: values.sizeCode,
      description: values.description || "",
      lengthFeet: values.lengthFeet,
      heightFeet: values.heightFeet,
      widthFeet: values.widthFeet,
      isActive: values.isActive,
      version: values.version || 0,
    };

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage
    } else {
      // For edit operation - include the ID and companyId
      payload.containerSizeId = values.containerSizeId;
      payload.companyId = values.companyId;
      // Increment version for edit
      payload.version = values.version || 0;
    }

    // Add user tracking if needed
    // if (isUpdate) {
    //   payload.updatedBy = userID;
    // } else {
    //   payload.createdBy = userID;
    // }

    console.log("Container Size Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "SetupContainerSize",
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
        // For edit operations, use incremented version
        ...(isUpdate ? { version: payload.version } : {}),
      };

      handleAddEdit(responseItem);

      toast({
        title: `Container size ${
          type === "edit" ? "updated" : "added"
        } successfully.`,
      });
    } catch (error: any) {
      console.error("API Error Details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to process container size operation",
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
            Add Container Size
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Container Size" : "Add New Container Size"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update container size information."
              : "Add a new container size to the system."}
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
              {/* Size Code */}
              <FormField
                control={form.control}
                name='sizeCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter size code (e.g., 20FT, 40FT)'
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

              {/* Description */}
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter description (e.g., Standard 20-foot container)'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Length (Feet) */}
              <FormField
                control={form.control}
                name='lengthFeet'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (Feet) *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter length'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        min={0.01}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Height (Feet) */}
              <FormField
                control={form.control}
                name='heightFeet'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (Feet) *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter height'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        min={0.01}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Width (Feet) */}
              <FormField
                control={form.control}
                name='widthFeet'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (Feet) *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter width'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        min={0.01}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

              {/* Display dimensions summary */}
              <div className='text-sm text-gray-600 text-right'>
                <p className='font-medium'>
                  Dimensions: {form.watch("lengthFeet") || 0}ft ×{" "}
                  {form.watch("heightFeet") || 0}ft ×{" "}
                  {form.watch("widthFeet") || 0}ft
                </p>
                <p className='text-xs text-gray-500'>
                  Volume:{" "}
                  {(
                    form.watch("lengthFeet") *
                      form.watch("heightFeet") *
                      form.watch("widthFeet") || 0
                  ).toFixed(2)}{" "}
                  cubic feet
                </p>
              </div>
            </div>

            {/* Version info for edit mode 
            {type === "edit" && (
              <div className='p-3 bg-blue-50 rounded-md'>
                <div className='flex items-center justify-between'>
                  <div>
                    <FormLabel className='text-sm font-medium text-blue-600'>
                      Version Information
                    </FormLabel>
                    <p className='text-sm text-blue-700'>
                      Current version: {form.watch("version") || 0}
                    </p>
                  </div>
                  <div className='text-sm text-blue-600'>
                    <p>Version will be incremented on update</p>
                  </div>
                </div>
              </div>
            )}*/}

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
                  name='containerSizeId'
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
                {type === "edit"
                  ? "Update Container Size"
                  : "Add Container Size"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
