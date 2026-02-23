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

const formSchema = z.object({
  partyLocationId: z.number().optional(),
  partyId: z.number().min(1, "Party is required"),
  unlocationId: z.number().min(1, "UN Location is required"),
  locationCode: z.string().optional(),
  locationName: z.string().min(1, "Location Name is required"),
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  fax: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPersonName: z.string().min(1, "Contact Person Name is required"),
  contactPersonDesignation: z.string().optional(),
  contactPersonPhone: z.string().optional(),
  contactPersonEmail: z
    .string()
    .email("Invalid contact email address")
    .optional()
    .or(z.literal("")),
  isHeadOffice: z.boolean().default(false),
  isActive: z.boolean().default(true),
  remarks: z.string().optional(),
  version: z.number().optional(),
});

interface Party {
  partyId: number;
  partyName: string;
  partyCode: string;
}

interface UNLocation {
  unlocationId: number;
  locationName: string;
  uncode: string;
  isCountry: boolean;
  isCity: boolean;
  isSeaPort: boolean;
  isDryPort: boolean;
}

interface PartyLocationDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function PartyLocationDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: PartyLocationDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [unlocations, setUnlocations] = useState<UNLocation[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingUnlocations, setLoadingUnlocations] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partyLocationId: defaultState.partyLocationId ?? undefined,
      partyId: defaultState.partyId || 0,
      unlocationId: defaultState.unlocationId || 0,
      locationCode: defaultState.locationCode || "",
      locationName: defaultState.locationName || "",
      addressLine1: defaultState.addressLine1 || "",
      addressLine2: defaultState.addressLine2 || "",
      postalCode: defaultState.postalCode || "",
      phone: defaultState.phone || "",
      fax: defaultState.fax || "",
      email: defaultState.email || "",
      contactPersonName: defaultState.contactPersonName || "",
      contactPersonDesignation: defaultState.contactPersonDesignation || "",
      contactPersonPhone: defaultState.contactPersonPhone || "",
      contactPersonEmail: defaultState.contactPersonEmail || "",
      isHeadOffice:
        defaultState.isHeadOffice !== undefined
          ? defaultState.isHeadOffice
          : false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      remarks: defaultState.remarks || "",
      version:
        typeof defaultState.version === "number" ? defaultState.version : 0,
    },
  });

  useEffect(() => {
    if (open) {
      fetchParties();
      fetchUnlocations();
    }
  }, [open]);

  const fetchParties = async () => {
    setLoadingParties(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Party/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "PartyId,PartyName,PartyCode",
          where: "IsActive == true",
          sortOn: "partyName",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setParties(data);
      } else {
        throw new Error("Failed to fetch parties");
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load parties list",
      });
    } finally {
      setLoadingParties(false);
    }
  };

  const fetchUnlocations = async () => {
    setLoadingUnlocations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}UNLocation/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "UnlocationId,LocationName,Uncode,IsCountry,IsCity,IsSeaPort,IsDryPort",
          where: "IsActive == true",
          sortOn: "locationName",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setUnlocations(data);
      } else {
        throw new Error("Failed to fetch UN locations");
      }
    } catch (error) {
      console.error("Error fetching UN locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load UN locations list",
      });
    } finally {
      setLoadingUnlocations(false);
    }
  };

  const getLocationType = (location: UNLocation) => {
    const types = [];
    if (location.isCountry) types.push("Country");
    if (location.isCity) types.push("City");
    if (location.isSeaPort) types.push("Sea Port");
    if (location.isDryPort) types.push("Dry Port");
    return types.length > 0 ? ` (${types.join(", ")})` : "";
  };

  // Fires when Zod validation FAILS — shows exactly which fields are blocking submit
  const onInvalid = (errors: any) => {
    console.group("❌ Form Validation Failed (Zod blocked submit)");
    console.log("Fix these fields before the API call can be made:", errors);
    console.groupEnd();
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

    const payload = {
      ...(isUpdate && values.partyLocationId !== undefined
        ? { partyLocationId: Number(values.partyLocationId) }
        : {}),
      partyId: Number(values.partyId),
      unlocationId: Number(values.unlocationId),
      locationCode: isUpdate ? values.locationCode || "" : "",
      locationName: values.locationName,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2 || "",
      postalCode: values.postalCode || "",
      phone: values.phone,
      fax: values.fax || "",
      email: values.email || "",
      contactPersonName: values.contactPersonName,
      contactPersonDesignation: values.contactPersonDesignation || "",
      contactPersonPhone: values.contactPersonPhone || "",
      contactPersonEmail: values.contactPersonEmail || "",
      isHeadOffice: values.isHeadOffice,
      isActive: values.isActive,
      remarks: values.remarks || "",
      version: Number(values.version ?? 0),
      ...(isUpdate ? { updatedBy: userID } : { createdBy: userID }),
    };

    // ── DEBUG: LOG EVERYTHING BEFORE SENDING ───────────────────────────────────
    console.group(`🚀 PartyLocation ${isUpdate ? "PUT" : "POST"}`);
    console.log("📋 Operation   :", isUpdate ? "PUT (Update)" : "POST (Add)");
    console.log("👤 UserID      :", userID);
    console.log("🔑 User in LS  :", localStorage.getItem("user"));
    console.log("📦 Form values :", values);
    console.log("📤 Payload     :", JSON.stringify(payload, null, 2));
    console.log(
      "🌐 URL         :",
      process.env.NEXT_PUBLIC_BASE_URL + "PartyLocation",
    );
    console.groupEnd();
    // ──────────────────────────────────────────────────────────────────────────

    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "PartyLocation",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      // Read body ONCE as text so we can log it before parsing
      const responseData = await response.text();

      // ── DEBUG: LOG RAW RESPONSE ─────────────────────────────────────────────
      console.group("📥 API Response");
      console.log("🔢 Status      :", response.status, response.statusText);
      console.log("✅ OK          :", response.ok);
      console.log("📄 Raw body    :", responseData);
      // ────────────────────────────────────────────────────────────────────────

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseData);
        } catch {
          errorData = {
            message: responseData || `HTTP Error: ${response.status}`,
          };
        }
        console.error("❌ Error body  :", errorData);
        console.groupEnd();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const jsonData = responseData ? JSON.parse(responseData) : null;
      console.log("✅ Parsed data :", jsonData);
      console.groupEnd();
      // ── END DEBUG ────────────────────────────────────────────────────────────

      if (jsonData?.statusCode >= 400) {
        throw new Error(jsonData.message || "Unknown error occurred");
      }

      setOpen(false);
      handleAddEdit({ ...values, ...jsonData });
      toast({
        title: `Party Location ${
          type === "edit" ? "updated" : "added"
        } successfully.`,
      });
    } catch (error: any) {
      console.error("💥 Caught error:", error);
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
            Add Party Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Party Location" : "Add New Party Location"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update party location information."
              : "Add a new party location to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {/* onInvalid catches Zod validation failures and logs them */}
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className='flex flex-col gap-4'
          >
            {/* Location Code Display */}
            <div className='p-3 bg-gray-50 rounded-md'>
              <FormLabel className='text-sm font-medium text-gray-600'>
                Location Code
              </FormLabel>
              <div className='mt-1 text-sm text-gray-900'>
                {type === "edit" ? (
                  form.watch("locationCode") || "Not available"
                ) : (
                  <span className='text-blue-600'>
                    Auto-generated by system
                  </span>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Party Dropdown */}
              <FormField
                control={form.control}
                name='partyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party *</FormLabel>
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
                        disabled={loadingParties}
                      >
                        <option value={0}>Select Party</option>
                        {parties.map((party) => (
                          <option key={party.partyId} value={party.partyId}>
                            {party.partyName} ({party.partyCode})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingParties && (
                      <p className='text-sm text-gray-500'>
                        Loading parties...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* UN Location Dropdown */}
              <FormField
                control={form.control}
                name='unlocationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UN Location *</FormLabel>
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
                        disabled={loadingUnlocations}
                      >
                        <option value={0}>Select UN Location</option>
                        {unlocations.map((location) => (
                          <option
                            key={location.unlocationId}
                            value={location.unlocationId}
                          >
                            {location.locationName} ({location.uncode})
                            {getLocationType(location)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingUnlocations && (
                      <p className='text-sm text-gray-500'>
                        Loading UN locations...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Name */}
            <FormField
              control={form.control}
              name='locationName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter location name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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

              {/* Fax */}
              <FormField
                control={form.control}
                name='fax'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fax</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter fax number' {...field} />
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

            {/* Contact Person Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>
                Contact Person Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='contactPersonName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter contact person name'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='contactPersonDesignation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Designation</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter designation' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='contactPersonPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter contact phone' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='contactPersonEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Email</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='Enter contact email'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status Settings */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='isHeadOffice'
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
                      <FormLabel>Head Office</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        Set as head office location
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {field.value ? "Active location" : "Inactive location"}
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Remarks */}
            <FormField
              control={form.control}
              name='remarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any remarks or notes...'
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields — partyLocationId uses setValueAs to return undefined
                (not NaN) when empty on ADD, which satisfies Zod's optional number type.
                version falls back to 0 instead of NaN for the same reason. */}
            <input
              type='hidden'
              {...form.register("partyLocationId", {
                setValueAs: (v) =>
                  v === "" || v === undefined || isNaN(Number(v))
                    ? undefined
                    : Number(v),
              })}
            />
            <input type='hidden' {...form.register("locationCode")} />
            <input
              type='hidden'
              {...form.register("version", {
                setValueAs: (v) =>
                  v === "" || v === undefined || isNaN(Number(v))
                    ? 0
                    : Number(v),
              })}
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
                {type === "edit" ? "Update Location" : "Add Location"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
