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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema for GD Cleared Under Section
const formSchema = z.object({
  gdclearedUnderSectionId: z.number().optional(),
  sectionCode: z.string().min(1, "Section Code is required"),
  sectionName: z.string().min(1, "Section Name is required"),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

interface GDClearedUnderSectionDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function GDClearedUnderSectionDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: GDClearedUnderSectionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gdclearedUnderSectionId:
        defaultState.gdclearedUnderSectionId || undefined,
      sectionCode: defaultState.sectionCode || "",
      sectionName: defaultState.sectionName || "",
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
        gdclearedUnderSectionId:
          defaultState.gdclearedUnderSectionId || undefined,
        sectionCode: defaultState.sectionCode || "",
        sectionName: defaultState.sectionName || "",
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
      gdclearedUnderSectionId: values.gdclearedUnderSectionId || 0,
      SectionCode: values.sectionCode.toUpperCase(),
      SectionName: values.sectionName,
      IsActive: values.isActive,
      CompanyId: companyId,
      Version: values.version || 0,
      CreatedBy: userID,
      UpdatedBy: userID,
    };

    // For edit operation - ensure we have the ID
    if (isUpdate && values.gdclearedUnderSectionId) {
      payload.gdclearedUnderSectionId = values.gdclearedUnderSectionId;
      // Increment version for edit
      payload.Version = values.version || 0;
    } else {
      // For create, set ID to 0
      payload.gdclearedUnderSectionId = 0;
      payload.Version = 0;
    }

    console.log("GD Cleared Under Section Payload:", payload);
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const endpoint = "SetupGdclearedUnderSection";
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
        gdClearedUnderSectionId:
          jsonData?.gdclearedUnderSectionId ||
          jsonData?.gdclearedUnderSectionId ||
          payload.gdclearedUnderSectionId,
        sectionCode: payload.SectionCode,
        sectionName: payload.SectionName,
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
        title: `GD Cleared Under Section ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("API Error Details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message ||
          "Failed to process GD Cleared Under Section operation",
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
            Add Section
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit"
              ? "Edit GD Cleared Under Section"
              : "Add New GD Cleared Under Section"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update GD cleared under section information."
              : "Add a new GD cleared under section to the system."}
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
              {/* Section Code */}
              <FormField
                control={form.control}
                name='sectionCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter section code (e.g., SEC001)'
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

              {/* Section Name */}
              <FormField
                control={form.control}
                name='sectionName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter section name' {...field} />
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
                  name='gdclearedUnderSectionId'
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
                {type === "edit" ? "Update Section" : "Add Section"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
