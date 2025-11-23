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

// Validation Schema
const formSchema = z.object({
  branchId: z.number().optional(),
  companyId: z.number().optional(), // Taken from localStorage, default 1
  branchName: z.string().min(1, "Branch Name is required"),
  branchCode: z.string().optional(), // Auto-generated at backend, send 0
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  cityId: z.number().min(1, "City is required"),
  postalCode: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  isHeadOffice: z.boolean().default(false),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

interface City {
  unlocationId: number;
  locationName: string;
}

interface BranchDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function BranchDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: BranchDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchId: defaultState.branchId || undefined,
      companyId: defaultState.companyId || 1, // Default to 1
      branchName: defaultState.branchName || "",
      branchCode: defaultState.branchCode || "",
      addressLine1: defaultState.addressLine1 || "",
      addressLine2: defaultState.addressLine2 || "",
      cityId: defaultState.cityId || 0,
      postalCode: defaultState.postalCode || "",
      phone: defaultState.phone || "",
      email: defaultState.email || "",
      isHeadOffice:
        defaultState.isHeadOffice !== undefined
          ? defaultState.isHeadOffice
          : false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  // Reset form when dialog opens/closes or when type changes
  useEffect(() => {
    if (open) {
      fetchCities();

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
        branchId: defaultState.branchId || undefined,
        companyId: companyId, // Set from localStorage with default 1
        branchName: defaultState.branchName || "",
        branchCode: defaultState.branchCode || "",
        addressLine1: defaultState.addressLine1 || "",
        addressLine2: defaultState.addressLine2 || "",
        cityId: defaultState.cityId || 0,
        postalCode: defaultState.postalCode || "",
        phone: defaultState.phone || "",
        email: defaultState.email || "",
        isHeadOffice:
          defaultState.isHeadOffice !== undefined
            ? defaultState.isHeadOffice
            : false,
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        version: defaultState.version || 0,
      });
    }
  }, [open, type, defaultState, form]);

  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Unlocation/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "UnLocationId, LocationName",
          where: "IsCity == true && IsCountry == false",
          sortOn: "LocationName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCities(data);
      } else {
        throw new Error("Failed to fetch cities");
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cities list",
      });
    } finally {
      setLoadingCities(false);
    }
  };

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
      branchName: values.branchName,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2 || "",
      cityId: values.cityId,
      postalCode: values.postalCode || "",
      phone: values.phone,
      email: values.email || "",
      isHeadOffice: values.isHeadOffice,
      isActive: values.isActive,
      version: values.version,
    };

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage with default 1
      payload.branchCode = "0"; // Send 0 for auto-generation at backend
    } else {
      // For edit operation - include the ID and use received version
      payload.branchId = values.branchId;
      payload.companyId = values.companyId;
      payload.branchCode = values.branchCode;
      // Use the version as received from backend (no increment)
    }

    // Add user tracking if needed
    // if (isUpdate) {
    //   payload.updatedBy = userID;
    // } else {
    //   payload.createdBy = userID;
    // }

    console.log("Branch Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "Branch",
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
        // For add operations, include the generated branchCode from backend
        ...(isUpdate ? {} : { branchCode: jsonData?.branchCode || "AUTO" }),
      };

      handleAddEdit(responseItem);

      toast({
        title: `Branch ${type === "edit" ? "updated" : "added"} successfully.`,
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
            Add Branch
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Branch" : "Add New Branch"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update branch information."
              : "Add a new branch to the system. Branch Code will be auto-generated."}
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
                          return u?.companyName || "Company 1";
                        } catch (error) {
                          return "Company 1";
                        }
                      }
                      return "Company 1";
                    })()}
                  </div>
                </div>

                {/* Display Branch Code for edit, show auto-generated message for add */}
                <div>
                  <FormLabel className='text-sm font-medium text-gray-600'>
                    Branch Code
                  </FormLabel>
                  <div className='mt-1 text-sm text-gray-900'>
                    {type === "edit" ? (
                      form.watch("branchCode") || "Not available"
                    ) : (
                      <span className='text-blue-600'>
                        Auto-generated by system
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Branch Name */}
            <FormField
              control={form.control}
              name='branchName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter branch name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* City Dropdown */}
              <FormField
                control={form.control}
                name='cityId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
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
                        disabled={loadingCities}
                      >
                        <option value={0}>Select City</option>
                        {cities.map((city) => (
                          <option
                            key={city.unlocationId}
                            value={city.unlocationId}
                          >
                            {city.locationName}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingCities && (
                      <p className='text-sm text-gray-500'>Loading cities...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter phone number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Line 1 */}
            <FormField
              control={form.control}
              name='addressLine1'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter address line 1' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Line 2 */}
            <FormField
              control={form.control}
              name='addressLine2'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter address line 2' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Postal Code */}
              <FormField
                control={form.control}
                name='postalCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter postal code' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Enter email address'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Is Head Office */}
              <FormField
                control={form.control}
                name='isHeadOffice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Office</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm font-medium'>
                          This is head office
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active */}
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
            </div>

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
                  name='branchId'
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
                {type === "edit" ? "Update Branch" : "Add Branch"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
