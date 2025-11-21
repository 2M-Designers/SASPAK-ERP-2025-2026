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
  companyId: z.number().min(1, "Company is required"),
  branchName: z.string().min(1, "Branch Name is required"),
  branchCode: z.string().min(1, "Branch Code is required"),
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

// Commented out hardcoded city data
/*
const cities = [
  { unLocationId: 30, locationName: "Karachi" },
  { unLocationId: 31, locationName: "Lahore" },
  { unLocationId: 32, locationName: "Islamabad" },
  { unLocationId: 33, locationName: "New York" },
  { unLocationId: 34, locationName: "Los Angeles" },
  { unLocationId: 35, locationName: "Dubai" },
  { unLocationId: 36, locationName: "Abu Dhabi" },
  { unLocationId: 37, locationName: "Shanghai" },
  { unLocationId: 38, locationName: "Hong Kong" },
];
*/

interface Company {
  companyId: number;
  companyName: string;
  companyCode: string;
}

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchId: defaultState.branchId || undefined,
      companyId: defaultState.companyId || 0,
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

  // Fetch companies and cities when dialog opens
  useEffect(() => {
    if (open) {
      fetchCompanies();
      fetchCities();
    }
  }, [open]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Company/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "CompanyId,CompanyName,CompanyCode",
          where: "",
          sortOn: "companyName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        throw new Error("Failed to fetch companies");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load companies list",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

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

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Create payload
    const payload = {
      ...values,
      //...(isUpdate ? { UpdatedBy: userID } : { CreatedBy: userID }),
    };

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

      handleAddEdit({
        ...values,
        ...jsonData,
      });

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
              : "Add a new branch to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Company Dropdown */}
              <FormField
                control={form.control}
                name='companyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
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
                        disabled={loadingCompanies}
                      >
                        <option value={0}>Select Company</option>
                        {companies.map((company) => (
                          <option
                            key={company.companyId}
                            value={company.companyId}
                          >
                            {company.companyName} ({company.companyCode})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingCompanies && (
                      <p className='text-sm text-gray-500'>
                        Loading companies...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City Dropdown - Using API data */}
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
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

              {/* Branch Code */}
              <FormField
                control={form.control}
                name='branchCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Code *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter branch code' {...field} />
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
                          className='w-4 h-4'
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
