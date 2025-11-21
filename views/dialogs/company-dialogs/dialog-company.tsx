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
  companyId: z.number().optional(),
  companyName: z.string().min(1, "Company Name is required"),
  companyCode: z.string().min(1, "Company Code is required"),
  legalName: z.string().min(1, "Legal Name is required"),
  taxIdnumber: z.string().min(1, "Tax Number is required"),
  currencyId: z.number().min(1, "Currency is required"),
  fiscalYearStartMonth: z.number().min(1).max(12, "Invalid month"),
  fiscalYearEndMonth: z.number().min(1).max(12, "Invalid month"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  cityId: z.number().min(1, "City is required"),
  postalCode: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().optional(),
  logoUrl: z.any().optional(),
  existingLogoUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface Currency {
  currencyId: number;
  currencyCode: string;
}

interface City {
  unlocationId: number;
  locationName: string;
}

interface CompanyDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function CompanyDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: CompanyDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: defaultState.companyId || undefined,
      companyName: defaultState.companyName || "",
      companyCode: defaultState.companyCode || "",
      legalName: defaultState.legalName || "",
      taxIdnumber: defaultState.taxIdnumber || "",
      currencyId: defaultState.currencyId || 0,
      fiscalYearStartMonth: defaultState.fiscalYearStartMonth || 1,
      fiscalYearEndMonth: defaultState.fiscalYearEndMonth || 12,
      addressLine1: defaultState.addressLine1 || "",
      addressLine2: defaultState.addressLine2 || "",
      cityId: defaultState.cityId || 0,
      postalCode: defaultState.postalCode || "",
      phone: defaultState.phone || "",
      email: defaultState.email || "",
      website: defaultState.website || "",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
      existingLogoUrl: defaultState.logoUrl || "",
    },
  });

  useEffect(() => {
    if (defaultState.logoUrl) {
      setPreviewLogo(`${defaultState.logoUrl}`);
    }
  }, [defaultState.logoUrl]);

  // Fetch currencies and cities when dialog opens
  useEffect(() => {
    if (open) {
      fetchCurrencies();
      fetchCities();
    }
  }, [open]);

  const fetchCurrencies = async () => {
    setLoadingCurrencies(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}SetupCurrency/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "CurrencyId,CurrencyCode",
          where: "",
          sortOn: "",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrencies(data);
      } else {
        throw new Error("Failed to fetch currencies");
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load currencies list",
      });
    } finally {
      setLoadingCurrencies(false);
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
          select: "unlocationId, LocationName",
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

    // Create FormData Object
    const formData = new FormData();

    // Append all form fields
    formData.append("CompanyName", values.companyName);
    formData.append("CompanyCode", values.companyCode);
    formData.append("LegalName", values.legalName);
    formData.append("TaxIdnumber", values.taxIdnumber);
    formData.append("CurrencyId", values.currencyId.toString());
    formData.append(
      "FiscalYearStartMonth",
      values.fiscalYearStartMonth.toString()
    );
    formData.append("FiscalYearEndMonth", values.fiscalYearEndMonth.toString());
    formData.append("AddressLine1", values.addressLine1);
    formData.append("AddressLine2", values.addressLine2 || "");
    formData.append("CityId", values.cityId.toString());
    formData.append("PostalCode", values.postalCode || "");
    formData.append("Phone", values.phone);
    formData.append("Email", values.email);
    formData.append("Website", values.website || "");
    formData.append("IsActive", values.isActive.toString());

    if (values.logoUrl instanceof File) {
      formData.append("Files", values.logoUrl);
    }

    if (isUpdate) {
      formData.append("CompanyId", values.companyId?.toString() || "");
      formData.append("EditBy", userID.toString());
    } else {
      formData.append("EnteredBy", userID.toString());
    }

    console.log("Company Form Data:", Object.fromEntries(formData.entries()));
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "Company",
        {
          method: isUpdate ? "PUT" : "POST",
          body: formData,
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
        logoUrl: jsonData?.logoUrl || defaultState.logoUrl,
      });

      toast({
        title: `Company ${type === "edit" ? "updated" : "added"} successfully.`,
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

  // Handle logo preview
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("logoUrl", file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
            Add Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Company" : "Add New Company"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update company information."
              : "Add a new company to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Company Logo */}
            <FormField
              control={form.control}
              name='logoUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Logo</FormLabel>
                  <FormControl>
                    <div className='flex flex-col items-center gap-4'>
                      {/* Logo Preview */}
                      {(previewLogo || defaultState.logoUrl) && (
                        <div className='w-32 h-32 border rounded-lg overflow-hidden'>
                          <img
                            src={previewLogo || defaultState.logoUrl}
                            alt='Company Logo Preview'
                            className='w-full h-full object-cover'
                          />
                        </div>
                      )}
                      {/* File Upload */}
                      <div className='w-full'>
                        <Input
                          type='file'
                          accept='image/*'
                          onChange={handleLogoChange}
                          className='cursor-pointer'
                        />
                      </div>
                      <p className='text-sm text-gray-500'>
                        Upload company logo (JPEG, PNG, GIF - Max 5MB)
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Company Name */}
              <FormField
                control={form.control}
                name='companyName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter company name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Code */}
              <FormField
                control={form.control}
                name='companyCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Code *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter company code' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Legal Name */}
            <FormField
              control={form.control}
              name='legalName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter legal name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Tax Number */}
              <FormField
                control={form.control}
                name='taxIdnumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Number *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter tax number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency */}
              <FormField
                control={form.control}
                name='currencyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
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
                        disabled={loadingCurrencies}
                      >
                        <option value={0}>Select Currency</option>
                        {currencies.map((currency) => (
                          <option
                            key={currency.currencyId}
                            value={currency.currencyId}
                          >
                            {currency.currencyCode}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingCurrencies && (
                      <p className='text-sm text-gray-500'>
                        Loading currencies...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Fiscal Year Start Month */}
              <FormField
                control={form.control}
                name='fiscalYearStartMonth'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year Start Month *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fiscal Year End Month */}
              <FormField
                control={form.control}
                name='fiscalYearEndMonth'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year End Month *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
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
              {/* City */}
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
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
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

            {/* Website */}
            <FormField
              control={form.control}
              name='website'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type='url'
                      placeholder='Enter website URL'
                      {...field}
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
                {type === "edit" ? "Update Company" : "Add Company"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
