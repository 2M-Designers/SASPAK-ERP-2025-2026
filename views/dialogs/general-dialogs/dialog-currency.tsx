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

// Validation Schema matching your API fields (PascalCase)
const formSchema = z.object({
  currencyId: z.number().optional(),
  currencyCode: z
    .string()
    .min(1, "Currency Code is required")
    .max(3, "Currency Code must be 3 characters")
    .regex(/^[A-Z]+$/, "Currency Code must contain only uppercase letters"),
  currencyName: z.string().min(1, "Currency Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  version: z.number().default(0),
});

interface CurrencyDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function CurrencyDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: CurrencyDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currencyId: defaultState.currencyId || undefined,
      currencyCode: defaultState.currencyCode || "",
      currencyName: defaultState.currencyName || "",
      symbol: defaultState.symbol || "",
      isDefault:
        defaultState.isDefault !== undefined ? defaultState.isDefault : false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  // Reset form when dialog opens/closes or defaultState changes
  useEffect(() => {
    if (open) {
      form.reset({
        currencyId: defaultState.currencyId || undefined,
        currencyCode: defaultState.currencyCode || "",
        currencyName: defaultState.currencyName || "",
        symbol: defaultState.symbol || "",
        isDefault:
          defaultState.isDefault !== undefined ? defaultState.isDefault : false,
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        version: defaultState.version || 0,
      });
    }
  }, [open, defaultState, form]);

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

    // Create payload with proper structure for add vs edit
    const payload: any = {
      currencyCode: values.currencyCode,
      currencyName: values.currencyName,
      symbol: values.symbol,
      isDefault: values.isDefault,
      isActive: values.isActive,
      version: values.version || 0,
    };

    // For add operation - don't include currencyId and add CreatedBy
    if (!isUpdate) {
      payload.createdBy = userID;
    } else {
      // For edit operation - include currencyId and add UpdatedBy
      payload.currencyId = values.currencyId;
      payload.updatedBy = userID;
    }

    console.log("Currency Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "SetupCurrency",
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
        title: `Currency ${
          type === "edit" ? "updated" : "added"
        } successfully.`,
      });
    } catch (error: any) {
      console.error("API Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process currency operation",
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
            Add Currency
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Currency" : "Add New Currency"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update currency information."
              : "Add a new currency to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Currency Code */}
              <FormField
                control={form.control}
                name='currencyCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter currency code (e.g., USD)'
                        {...field}
                        maxLength={3}
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

              {/* Currency Name */}
              <FormField
                control={form.control}
                name='currencyName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter currency name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Symbol */}
            <FormField
              control={form.control}
              name='symbol'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter currency symbol' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Is Default */}
              <FormField
                control={form.control}
                name='isDefault'
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
                      <FormLabel>Default Currency</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        Set as default currency for the system
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
                        {field.value ? "Active currency" : "Inactive currency"}
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hidden fields */}
            <div className='hidden'>
              <FormField
                control={form.control}
                name='currencyId'
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
                {type === "edit" ? "Update Currency" : "Add Currency"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
