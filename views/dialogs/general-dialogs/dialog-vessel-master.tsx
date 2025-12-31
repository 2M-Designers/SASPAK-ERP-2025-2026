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

// Validation Schema for VesselMaster
const formSchema = z.object({
  vesselId: z.number().optional(),
  vesselCode: z.string().min(1, "Vessel Code is required"),
  vesselName: z.string().min(1, "Vessel Name is required"),
  imonumber: z.string().min(1, "IMO Number is required"),
  mmsinumber: z.string().optional(),
  callSign: z.string().optional(),
  vesselType: z.string().min(1, "Vessel Type is required"),
  flagCountryCode: z.string().min(1, "Flag Country is required"),
  builtYear: z
    .number()
    .min(1900, "Built year must be 1900 or later")
    .max(new Date().getFullYear(), "Built year cannot be in the future")
    .optional()
    .or(z.literal("")),
  deadWeightTonnage: z
    .number()
    .min(0, "DWT must be positive")
    .optional()
    .or(z.literal("")),
  grossTonnage: z
    .number()
    .min(0, "GT must be positive")
    .optional()
    .or(z.literal("")),
  netTonnage: z
    .number()
    .min(0, "NT must be positive")
    .optional()
    .or(z.literal("")),
  operatorName: z.string().optional(),
  ownerName: z.string().optional(),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

interface VesselMasterDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

// Vessel types for dropdown
const VESSEL_TYPES = [
  "Container Ship",
  "Bulk Carrier",
  "Tanker",
  "Ro-Ro",
  "General Cargo",
  "Refrigerated Cargo",
  "LNG Carrier",
  "LPG Carrier",
  "Chemical Tanker",
  "Passenger Ship",
  "Ferry",
  "Offshore Vessel",
  "Tug Boat",
  "Dredger",
  "Research Vessel",
  "Fishing Vessel",
  "Yacht",
  "Barge",
  "Pilot Boat",
  "Other",
];

// Flag countries for dropdown
const FLAG_COUNTRIES = [
  { code: "SG", name: "Singapore" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "GR", name: "Greece" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "SE", name: "Sweden" },
  { code: "FI", name: "Finland" },
  { code: "RU", name: "Russia" },
  { code: "IN", name: "India" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "PA", name: "Panama" },
  { code: "LR", name: "Liberia" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MT", name: "Malta" },
  { code: "CY", name: "Cyprus" },
  { code: "BS", name: "Bahamas" },
  { code: "BM", name: "Bermuda" },
  { code: "KY", name: "Cayman Islands" },
  { code: "VG", name: "British Virgin Islands" },
];

export default function VesselMasterDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: VesselMasterDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vesselId: defaultState.vesselId || undefined,
      vesselCode: defaultState.vesselCode || "",
      vesselName: defaultState.vesselName || "",
      imonumber: defaultState.imonumber || "",
      mmsinumber: defaultState.mmsinumber || "",
      callSign: defaultState.callSign || "",
      vesselType: defaultState.vesselType || "",
      flagCountryCode: defaultState.flagCountryCode || "",
      builtYear: defaultState.builtYear || "",
      deadWeightTonnage: defaultState.deadWeightTonnage || "",
      grossTonnage: defaultState.grossTonnage || "",
      netTonnage: defaultState.netTonnage || "",
      operatorName: defaultState.operatorName || "",
      ownerName: defaultState.ownerName || "",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
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

      // Parse numeric values
      const parseNumeric = (value: any) => {
        if (value === null || value === undefined || value === "") return "";
        const num = parseFloat(value);
        return isNaN(num) ? "" : num;
      };

      form.reset({
        vesselId: defaultState.vesselId || undefined,
        vesselCode: defaultState.vesselCode || "",
        vesselName: defaultState.vesselName || "",
        imonumber: defaultState.imonumber || "",
        mmsinumber: defaultState.mmsinumber || "",
        callSign: defaultState.callSign || "",
        vesselType: defaultState.vesselType || "",
        flagCountryCode: defaultState.flagCountryCode || "",
        builtYear: parseNumeric(defaultState.builtYear),
        deadWeightTonnage: parseNumeric(defaultState.deadWeightTonnage),
        grossTonnage: parseNumeric(defaultState.grossTonnage),
        netTonnage: parseNumeric(defaultState.netTonnage),
        operatorName: defaultState.operatorName || "",
        ownerName: defaultState.ownerName || "",
        isActive:
          defaultState.isActive !== undefined
            ? Boolean(defaultState.isActive)
            : true,
        version: defaultState.version || 0,
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

    // Prepare payload with proper numeric conversions
    const payload: any = {
      vesselCode: values.vesselCode.toUpperCase(),
      vesselName: values.vesselName,
      imonumber: values.imonumber,
      mmsinumber: values.mmsinumber || "",
      callSign: values.callSign || "",
      vesselType: values.vesselType,
      flagCountryCode: values.flagCountryCode,
      builtYear: values.builtYear ? parseInt(String(values.builtYear)) : 0,
      deadWeightTonnage: values.deadWeightTonnage
        ? parseFloat(String(values.deadWeightTonnage))
        : 0,
      grossTonnage: values.grossTonnage
        ? parseFloat(String(values.grossTonnage))
        : 0,
      netTonnage: values.netTonnage ? parseFloat(String(values.netTonnage)) : 0,
      operatorName: values.operatorName || "",
      ownerName: values.ownerName || "",
      isActive: values.isActive,
      companyId: companyId,
      version: values.version || 0,
    };

    // For edit operation - include the ID
    if (isUpdate) {
      payload.vesselId = values.vesselId;
      // Increment version for edit
      payload.version = values.version || 0;
    }

    // Add user tracking
    /*if (isUpdate) {
      payload.updatedBy = userID;
    } else {
      payload.createdBy = userID;
    }*/

    console.log("Vessel Master Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "VesselMaster",
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
        companyId: companyId,
        // For edit operations, use incremented version
        ...(isUpdate ? { version: payload.version } : { version: 0 }),
      };

      handleAddEdit(responseItem);

      toast({
        title: `Vessel ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("API Error Details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process vessel operation",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };

  // Format tonnage for display
  const formatTonnage = (value: number | string) => {
    if (!value) return "0";
    const num = typeof value === "number" ? value : parseFloat(value);
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add Vessel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Vessel" : "Add New Vessel"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update vessel information."
              : "Add a new vessel to the system."}
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
              {/* Vessel Code */}
              <FormField
                control={form.control}
                name='vesselCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter vessel code (e.g., VS001)'
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

              {/* Vessel Name */}
              <FormField
                control={form.control}
                name='vesselName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter vessel name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* IMO Number */}
              <FormField
                control={form.control}
                name='imonumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMO Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter IMO number'
                        {...field}
                        onChange={(e) => {
                          // Allow only digits
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MMSI Number */}
              <FormField
                control={form.control}
                name='mmsinumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MMSI Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter MMSI number'
                        {...field}
                        onChange={(e) => {
                          // Allow only digits
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Call Sign */}
              <FormField
                control={form.control}
                name='callSign'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Sign</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter call sign'
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
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Vessel Type */}
              <FormField
                control={form.control}
                name='vesselType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vessel Type *</FormLabel>
                    <FormControl>
                      <select
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value=''>Select Vessel Type</option>
                        {VESSEL_TYPES.map((type) => (
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

              {/* Flag Country */}
              <FormField
                control={form.control}
                name='flagCountryCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag Country *</FormLabel>
                    <FormControl>
                      <select
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value=''>Select Flag Country</option>
                        {FLAG_COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name} ({country.code})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {/* Built Year */}
              <FormField
                control={form.control}
                name='builtYear'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Built Year</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='YYYY'
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange("");
                          } else {
                            const year = parseInt(value);
                            if (
                              year >= 1900 &&
                              year <= new Date().getFullYear()
                            ) {
                              field.onChange(year);
                            }
                          }
                        }}
                        min={1900}
                        max={new Date().getFullYear()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dead Weight Tonnage */}
              <FormField
                control={form.control}
                name='deadWeightTonnage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dead Weight (DWT)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter DWT'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0
                          )
                        }
                        min={0}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gross Tonnage */}
              <FormField
                control={form.control}
                name='grossTonnage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Tonnage (GT)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter GT'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0
                          )
                        }
                        min={0}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Net Tonnage */}
              <FormField
                control={form.control}
                name='netTonnage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Tonnage (NT)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter NT'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value) || 0
                          )
                        }
                        min={0}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Operator Name */}
              <FormField
                control={form.control}
                name='operatorName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter operator name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Owner Name */}
              <FormField
                control={form.control}
                name='ownerName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter owner name' {...field} />
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

              {/* Display tonnage summary 
              <div className='text-sm text-gray-600 text-right'>
                <p className='font-medium'>Tonnage Summary:</p>
                <p className='text-xs text-gray-500'>
                  DWT: {formatTonnage(form.watch("deadWeightTonnage"))} | GT:{" "}
                  {formatTonnage(form.watch("grossTonnage"))} | NT:{" "}
                  {formatTonnage(form.watch("netTonnage"))}
                </p>
              </div>*/}
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
              {type === "edit" && (
                <FormField
                  control={form.control}
                  name='vesselId'
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
                {type === "edit" ? "Update Vessel" : "Add Vessel"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
