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

// Validation Schema for Bank
const formSchema = z.object({
  bankId: z.number().optional(),
  bankCode: z.string().min(1, "Bank Code is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  swiftCode: z
    .string()
    .min(1, "SWIFT Code is required")
    .max(11, "SWIFT Code must be 8 or 11 characters")
    .regex(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/, "Invalid SWIFT Code format"),
  countryId: z.number().min(1, "Country is required"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

interface BankDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function BankDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: BankDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankId: defaultState.bankId || undefined,
      bankCode: defaultState.bankCode || "",
      bankName: defaultState.bankName || "",
      swiftCode: defaultState.swiftCode || "",
      countryId: defaultState.countryId || "",
      website: defaultState.website || "",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  // Fetch countries from API on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Unlocation/GetList`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            select: "UnlocationId, LocationName",
            where: "IsCountry = true", // Filter for countries only
            sortOn: "LocationName",
            page: "1",
            pageSize: "250",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data)) {
            // Map the data to match our expected structure
            const mappedCountries = data.map((item: any) => ({
              countryId: item.unlocationId,
              countryName: item.locationName,
              // Extract country code from location name if possible
              countryCode: extractCountryCode(item.locationName),
            }));
            setCountries(mappedCountries);
            console.log("Fetched countries:", mappedCountries.length);
          }
        } else {
          console.error("Failed to fetch countries:", response.status);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load countries list",
        });
      } finally {
        setLoadingCountries(false);
      }
    };

    // Only fetch countries if dialog is open
    if (open) {
      fetchCountries();
    }
  }, [open, toast]);

  // Helper function to extract country code from location name
  const extractCountryCode = (locationName: string): string => {
    // Simple mapping for common countries
    const countryCodeMap: { [key: string]: string } = {
      "United States": "US",
      "United Kingdom": "GB",
      Germany: "DE",
      France: "FR",
      Italy: "IT",
      Spain: "ES",
      Netherlands: "NL",
      Switzerland: "CH",
      Singapore: "SG",
      Japan: "JP",
      China: "CN",
      India: "IN",
      Australia: "AU",
      Canada: "CA",
      Brazil: "BR",
      Mexico: "MX",
      Russia: "RU",
      "South Korea": "KR",
      // Add more mappings as needed
    };

    // Try to find exact match
    if (countryCodeMap[locationName]) {
      return countryCodeMap[locationName];
    }

    // Try to extract from parentheses
    const match = locationName.match(/\(([A-Z]{2})\)$/);
    if (match) {
      return match[1];
    }

    // Generate initials from first two words if available
    const words = locationName.split(" ");
    if (words.length >= 2) {
      return words[0].charAt(0) + words[1].charAt(0);
    }

    // Use first two letters of the country name
    return locationName.substring(0, 2).toUpperCase();
  };

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
        bankId: defaultState.bankId || undefined,
        bankCode: defaultState.bankCode || "",
        bankName: defaultState.bankName || "",
        swiftCode: defaultState.swiftCode || "",
        countryId: parseNumeric(defaultState.countryId),
        website: defaultState.website || "",
        isActive:
          defaultState.isActive !== undefined
            ? Boolean(defaultState.isActive)
            : true,
        version: defaultState.version || 0,
      });
    }
  }, [open, type, defaultState, form]);

  // Format SWIFT code to uppercase and validate
  const formatSwiftCode = (value: string) => {
    // Remove any spaces and convert to uppercase
    const formatted = value.replace(/\s/g, "").toUpperCase();
    return formatted;
  };

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

    // Format SWIFT code
    const formattedSwiftCode = formatSwiftCode(values.swiftCode);

    // Validate SWIFT code length
    if (formattedSwiftCode.length !== 8 && formattedSwiftCode.length !== 11) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "SWIFT Code must be 8 or 11 characters",
      });
      return;
    }

    // Prepare payload - exactly matching the expected fields
    const payload: any = {
      BankId: values.bankId || 0,
      BankCode: values.bankCode.toUpperCase(),
      BankName: values.bankName,
      SwiftCode: formattedSwiftCode,
      CountryId: values.countryId,
      Website: values.website || "",
      IsActive: values.isActive,
      CompanyId: companyId,
      Version: values.version || 0,
      CreatedBy: userID,
      UpdatedBy: userID,
    };

    // For edit operation - ensure we have the ID
    if (isUpdate && values.bankId) {
      payload.BankId = values.bankId;
      // Increment version for edit
      payload.Version = values.version || 0;
    } else {
      // For create, set ID to 0
      payload.BankId = 0;
      payload.Version = 0;
    }

    console.log("Bank Payload:", payload);
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const endpoint = isUpdate ? "Banks" : "Banks";
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

      // Find selected country name for the response
      const selectedCountry = countries.find(
        (c) => c.countryId === payload.CountryId,
      );

      // Prepare the response data to include in handleAddEdit
      const responseItem = {
        bankId: jsonData?.bankId || jsonData?.BankId || payload.BankId,
        bankCode: payload.BankCode,
        bankName: payload.BankName,
        swiftCode: payload.SwiftCode,
        countryId: payload.CountryId,
        countryName: selectedCountry?.countryName || "",
        website: payload.Website,
        isActive: payload.IsActive,
        companyId: payload.CompanyId,
        version: payload.Version,
        createdBy: payload.CreatedBy,
        updatedBy: payload.UpdatedBy,
      };

      handleAddEdit(responseItem);

      toast({
        title: `Bank ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("API Error Details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process bank operation",
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
            Add Bank
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Bank" : "Add New Bank"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update bank information."
              : "Add a new bank to the system."}
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
              {/* Bank Code */}
              <FormField
                control={form.control}
                name='bankCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter bank code (e.g., BNK001)'
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

              {/* Bank Name */}
              <FormField
                control={form.control}
                name='bankName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter bank name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* SWIFT Code */}
              <FormField
                control={form.control}
                name='swiftCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SWIFT Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter SWIFT/BIC code (e.g., CITIUS33)'
                        {...field}
                        className='uppercase'
                        onChange={(e) => {
                          const formatted = formatSwiftCode(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={11}
                      />
                    </FormControl>
                    <div className='text-xs text-gray-500'>
                      Must be 8 or 11 characters. Example: CITIUS33 or
                      CITIUS33XXX
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name='countryId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <select
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || "")
                        }
                        disabled={loadingCountries}
                      >
                        <option value=''>
                          {loadingCountries
                            ? "Loading countries..."
                            : "Select Country"}
                        </option>
                        {countries.map((country) => (
                          <option
                            key={country.countryId}
                            value={country.countryId}
                          >
                            {country.countryName}
                            {country.countryCode && ` (${country.countryCode})`}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingCountries && (
                      <div className='text-xs text-gray-500'>
                        Loading countries...
                      </div>
                    )}
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
                      placeholder='https://www.example.com'
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Add https:// if not present and not empty
                        if (
                          value &&
                          !value.startsWith("http://") &&
                          !value.startsWith("https://")
                        ) {
                          value = "https://" + value;
                        }
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <div className='text-xs text-gray-500'>
                    Optional. Include http:// or https://
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
                  name='bankId'
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
                disabled={isLoading || loadingCountries}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading || loadingCountries}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {type === "edit" ? "Update Bank" : "Add Bank"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
