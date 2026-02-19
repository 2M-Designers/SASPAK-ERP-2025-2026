"use client";

import { Button } from "@/components/ui/button";
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
import Select from "react-select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  Building,
  Contact,
  Banknote,
  Settings,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define validation schema
const formSchema = z
  .object({
    partyId: z.number().optional(),
    companyId: z.number().default(1),
    partyCode: z.string().optional(),
    partyName: z.string().min(1, "Party Name is required"),
    partyShortName: z.string().optional(),
    isActive: z.boolean().default(true),
    isGLLinked: z.boolean().default(false),
    isCustomer: z.boolean().default(false),
    isVendor: z.boolean().default(false),
    isCustomerVendor: z.boolean().default(false),
    isAgent: z.boolean().default(false),
    isOverseasAgent: z.boolean().default(false),
    isShippingLine: z.boolean().default(false),
    isTransporter: z.boolean().default(false),
    isConsignee: z.boolean().default(false),
    isShipper: z.boolean().default(false),
    isPrincipal: z.boolean().default(false),
    isTerminal: z.boolean().default(false),
    isBoundedCarrier: z.boolean().default(false),
    isNonGLParty: z.boolean().default(false),
    isInSeaImport: z.boolean().default(false),
    isInSeaExport: z.boolean().default(false),
    isInAirImport: z.boolean().default(false),
    isInAirExport: z.boolean().default(false),
    isInLogistics: z.boolean().default(false),
    unLocationId: z.number().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    website: z.string().optional(),
    contactPersonName: z.string().optional(),
    contactPersonDesignation: z.string().optional(),
    contactPersonEmail: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    contactPersonPhone: z.string().optional(),
    ntnNumber: z.string().optional(),
    strnNumber: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    ibanNumber: z.string().optional(),
    creditLimitLC: z.number().default(0),
    creditLimitFC: z.number().default(0),
    allowedCreditDays: z.number().default(0),
    paymentTerms: z.string().optional(),
    glParentAccountId: z.number().optional(),
    glAccountId: z.string().optional(),
    trackIdAllowed: z.boolean().default(false),
    idPasswordAllowed: z.boolean().default(false),
    sendEmail: z.boolean().default(false),
    canSeeBills: z.boolean().default(false),
    canSeeLedger: z.boolean().default(false),
    isProcessOwner: z.boolean().default(false),
    clearanceByOps: z.boolean().default(false),
    clearanceByAcm: z.boolean().default(false),
    atTradeForGDInsustrial: z.boolean().default(false),
    atTradeForGDCommercial: z.boolean().default(false),
    benificiaryNameOfPO: z.string().optional(),
    salesRepId: z.number().optional(),
    docsRepId: z.number().optional(),
    accountsRepId: z.number().optional(),
  })
  .refine(
    (data) => {
      // Customer-Vendor validation: Cannot be both Customer and Vendor if Customer/Vendor is selected
      if (data.isCustomerVendor) {
        return !data.isCustomer && !data.isVendor;
      }
      return true;
    },
    {
      message:
        "Cannot select Customer or Vendor separately when Customer/Vendor is selected",
      path: ["isCustomerVendor"],
    },
  )
  .refine(
    (data) => {
      // Customer validation: Cannot be Customer if Vendor or Customer/Vendor is selected
      if (data.isCustomer) {
        return !data.isVendor && !data.isCustomerVendor;
      }
      return true;
    },
    {
      message:
        "Cannot select Vendor or Customer/Vendor when Customer is selected",
      path: ["isCustomer"],
    },
  )
  .refine(
    (data) => {
      // Vendor validation: Cannot be Vendor if Customer or Customer/Vendor is selected
      if (data.isVendor) {
        return !data.isCustomer && !data.isCustomerVendor;
      }
      return true;
    },
    {
      message:
        "Cannot select Customer or Customer/Vendor when Vendor is selected",
      path: ["isVendor"],
    },
  );

export default function PartiesForm({
  type,
  defaultState,
  handleAddEdit,
}: {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: any;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unLocations, setUnLocations] = useState<any[]>([]);
  const [glAccounts, setGlAccounts] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [docsReps, setDocsReps] = useState<any[]>([]);
  const [accountsReps, setAccountsReps] = useState<any[]>([]);

  const [loadingUnlocations, setLoadingUnlocations] = useState(false);
  const [loadingGlAccounts, setLoadingGlAccounts] = useState(false);
  const [loadingSalesReps, setLoadingSalesReps] = useState(false);
  const [loadingDocsReps, setLoadingDocsReps] = useState(false);
  const [loadingAccountsReps, setLoadingAccountsReps] = useState(false);

  // Fetch data functions (same as before)
  const fetchUnlocations = async () => {
    setLoadingUnlocations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}UnLocation/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select:
            "UnlocationId,LocationName,Uncode,IsCountry,IsCity,IsSeaPort,IsDryPort",
          where: "IsActive == true",
          sortOn: "LocationName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnLocations(
          data.map((location: any) => ({
            value: location.unlocationId,
            label: `${location.uncode} - ${location.locationName}`,
          })),
        );
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

  const fetchGlAccounts = async () => {
    setLoadingGlAccounts(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}GlAccount/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "AccountId,AccountCode,AccountName",
          where: "IsActive == true",
          sortOn: "AccountCode",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGlAccounts(
          data.map((account: any) => ({
            value: account.accountId,
            label: `${account.accountCode} - ${account.accountName}`,
          })),
        );
      } else {
        throw new Error("Failed to fetch GL accounts");
      }
    } catch (error) {
      console.error("Error fetching GL accounts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load GL accounts list",
      });
    } finally {
      setLoadingGlAccounts(false);
    }
  };

  const fetchSalesReps = async () => {
    setLoadingSalesReps(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Employee/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "EmployeeId,FirstName,LastName,EmployeeCode",
          where: "IsActive == true",
          sortOn: "FirstName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSalesReps(
          data.map((emp: any) => ({
            value: emp.employeeId,
            label: `${emp.employeeCode} - ${emp.firstName} ${emp.lastName}`,
          })),
        );
      } else {
        throw new Error("Failed to fetch sales representatives");
      }
    } catch (error) {
      console.error("Error fetching sales representatives:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sales representatives list",
      });
    } finally {
      setLoadingSalesReps(false);
    }
  };

  const fetchDocsReps = async () => {
    setLoadingDocsReps(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Employee/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "EmployeeId,FirstName,LastName,EmployeeCode",
          where: "IsActive == true",
          sortOn: "FirstName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocsReps(
          data.map((emp: any) => ({
            value: emp.employeeId,
            label: `${emp.employeeCode} - ${emp.firstName} ${emp.lastName}`,
          })),
        );
      } else {
        throw new Error("Failed to fetch documentation representatives");
      }
    } catch (error) {
      console.error("Error fetching documentation representatives:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documentation representatives list",
      });
    } finally {
      setLoadingDocsReps(false);
    }
  };

  const fetchAccountsReps = async () => {
    setLoadingAccountsReps(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Employee/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "EmployeeId,FirstName,LastName,EmployeeCode",
          where: "IsActive == true",
          sortOn: "FirstName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccountsReps(
          data.map((emp: any) => ({
            value: emp.employeeId,
            label: `${emp.employeeCode} - ${emp.firstName} ${emp.lastName}`,
          })),
        );
      } else {
        throw new Error("Failed to fetch accounts representatives");
      }
    } catch (error) {
      console.error("Error fetching accounts representatives:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load accounts representatives list",
      });
    } finally {
      setLoadingAccountsReps(false);
    }
  };

  useEffect(() => {
    fetchUnlocations();
    fetchGlAccounts();
    fetchSalesReps();
    fetchDocsReps();
    fetchAccountsReps();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: 1,
      isActive: true,
      ...defaultState,
      creditLimitLC: defaultState.creditLimitLC
        ? Number(defaultState.creditLimitLC)
        : 0,
      creditLimitFC: defaultState.creditLimitFC
        ? Number(defaultState.creditLimitFC)
        : 0,
      allowedCreditDays: defaultState.allowedCreditDays
        ? Number(defaultState.allowedCreditDays)
        : 0,
    },
  });

  // Watch important fields for conditional rendering
  const isNonGLParty = form.watch("isNonGLParty");
  const isGLLinked = form.watch("isGLLinked");
  const isCustomer = form.watch("isCustomer");
  const isVendor = form.watch("isVendor");
  const isCustomerVendor = form.watch("isCustomerVendor");

  // Handle toggle logic for mutually exclusive fields
  const handleCustomerVendorToggle = (field: string, value: boolean) => {
    if (field === "isCustomerVendor" && value) {
      // If Customer/Vendor is enabled, disable Customer and Vendor
      form.setValue("isCustomer", false);
      form.setValue("isVendor", false);
    } else if (field === "isCustomer" && value) {
      // If Customer is enabled, disable Vendor and Customer/Vendor
      form.setValue("isVendor", false);
      form.setValue("isCustomerVendor", false);
    } else if (field === "isVendor" && value) {
      // If Vendor is enabled, disable Customer and Customer/Vendor
      form.setValue("isCustomer", false);
      form.setValue("isCustomerVendor", false);
    }
  };

  // Handle Non-GL Party toggle
  const handleNonGLPartyToggle = (value: boolean) => {
    if (value) {
      // If Non-GL Party is enabled, disable GL Linked and clear GL fields
      form.setValue("isGLLinked", false);
      form.setValue("glParentAccountId", undefined);
      form.setValue("glAccountId", "");
    }
  };

  // Handle GL Linked toggle
  const handleGLLinkedToggle = (value: boolean) => {
    if (value) {
      // If GL Linked is enabled, disable Non-GL Party
      form.setValue("isNonGLParty", false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const user = localStorage.getItem("user");
      let userID = 0;
      if (user) {
        try {
          const u = JSON.parse(user);
          userID = u?.userID || 0;
        } catch (error) {
          console.error("User parse error:", error);
        }
      }

      const payload = {
        ...values,
        enteredBy: userID,
      };

      const endpoint = type === "edit" ? "Parties/update" : "Parties/create";
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      if (!baseUrl) {
        throw new Error("Configuration error: BASE_URL is not defined");
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Request failed");
      }

      const result = await response.json();
      toast({
        title: "Success!",
        description: `Party ${
          type === "edit" ? "updated" : "created"
        } successfully`,
      });
      handleAddEdit(result);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Submission failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ToggleField = ({
    name,
    label,
    description,
    disabled = false,
    onChange,
  }: {
    name: keyof z.infer<typeof formSchema>;
    label: string;
    description?: string;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
          <div className='space-y-0.5'>
            <FormLabel className='text-base'>{label}</FormLabel>
            {description && (
              <p className='text-sm text-muted-foreground'>{description}</p>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value as boolean}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                if (onChange) {
                  onChange(checked);
                }
              }}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold tracking-tight'>
          {type === "edit" ? "Edit Party" : "Create New Party"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {/* Hidden Fields */}
          <FormField
            control={form.control}
            name='partyId'
            render={({ field }) => (
              <FormItem className='hidden'>
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
              <FormItem className='hidden'>
                <FormControl>
                  <Input type='hidden' {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Customer/Vendor Relationship Alert */}
          {(isCustomer && (isVendor || isCustomerVendor)) ||
          (isVendor && (isCustomer || isCustomerVendor)) ||
          (isCustomerVendor && (isCustomer || isVendor)) ? (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Invalid selection: A party cannot be both Customer and Vendor
                simultaneously. Please select only one of: Customer, Vendor, or
                Customer/Vendor.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building className='h-5 w-5' />
                <Badge variant='outline' className='px-2 py-1'>
                  Basic Information
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <FormField
                control={form.control}
                name='partyCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Auto-generated'
                        {...field}
                        disabled
                        className='bg-gray-50'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='partyName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter party name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='partyShortName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter short name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='unLocationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UN Location</FormLabel>
                    <FormControl>
                      <Select
                        options={unLocations}
                        value={unLocations.find(
                          (option) => option.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        placeholder={
                          loadingUnlocations ? "Loading..." : "Select Location"
                        }
                        className='react-select-container'
                        classNamePrefix='react-select'
                        isLoading={loadingUnlocations}
                        isDisabled={loadingUnlocations}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='md:col-span-2 lg:col-span-3'>
                <ToggleField
                  name='isActive'
                  label='Active Party'
                  description='Enable to make this party active in the system'
                />
              </div>
            </CardContent>
          </Card>

          {/* Party Type Classification Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                <Badge variant='outline' className='px-2 py-1'>
                  Party Type Classification
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='mb-4'>
                <h4 className='text-sm font-medium mb-2 text-muted-foreground'>
                  Customer/Vendor Relationship (Select Only One)
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <ToggleField
                    name='isCustomer'
                    label='Customer'
                    description='Party is a customer'
                    disabled={isVendor || isCustomerVendor}
                    onChange={(checked) =>
                      handleCustomerVendorToggle("isCustomer", checked)
                    }
                  />
                  <ToggleField
                    name='isVendor'
                    label='Vendor'
                    description='Party is a vendor'
                    disabled={isCustomer || isCustomerVendor}
                    onChange={(checked) =>
                      handleCustomerVendorToggle("isVendor", checked)
                    }
                  />
                  <ToggleField
                    name='isCustomerVendor'
                    label='Customer/Vendor'
                    description='Party is both customer and vendor'
                    disabled={isCustomer || isVendor}
                    onChange={(checked) =>
                      handleCustomerVendorToggle("isCustomerVendor", checked)
                    }
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <ToggleField name='isAgent' label='Local Agent' />
                <ToggleField name='isOverseasAgent' label='Origin Agent' />
                <ToggleField name='isShippingLine' label='Carrier' />
                <ToggleField name='isTransporter' label='Transporter' />
                <ToggleField name='isConsignee' label='Consignee' />
                <ToggleField name='isShipper' label='Shipper' />
                <ToggleField name='isPrincipal' label='Principal' />
                <ToggleField name='isTerminal' label='Terminal' />
                <ToggleField name='isBoundedCarrier' label='Bounded Carrier' />
                <ToggleField
                  name='isNonGLParty'
                  label='Non-GL Party'
                  description='Party is not linked to General Ledger'
                  onChange={handleNonGLPartyToggle}
                />
              </div>

              <div className='mt-6'>
                <h4 className='text-sm font-medium mb-4'>
                  Business Operations
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <ToggleField name='isInSeaImport' label='Sea Import' />
                  <ToggleField name='isInSeaExport' label='Sea Export' />
                  <ToggleField name='isInAirImport' label='Air Import' />
                  <ToggleField name='isInAirExport' label='Air Export' />
                  <ToggleField name='isInLogistics' label='Logistics' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Contact className='h-5 w-5' />
                <Badge variant='outline' className='px-2 py-1'>
                  Contact Information
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='addressLine1'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder='Street address' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='addressLine2'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder='Apartment, suite, etc.' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='postalCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder='Postal code' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder='Phone number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='fax'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fax</FormLabel>
                    <FormControl>
                      <Input placeholder='Fax number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Email address'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='website'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder='Website URL' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Person Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                <Badge variant='outline' className='px-2 py-1'>
                  Contact Person Details
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='contactPersonName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Full name' {...field} />
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
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder='Job title' {...field} />
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
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Contact email'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='contactPersonPhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder='Contact phone' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Financial Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Banknote className='h-5 w-5' />
                <Badge variant='outline' className='px-2 py-1'>
                  Financial Information
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='ntnNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NTN Number</FormLabel>
                    <FormControl>
                      <Input placeholder='NTN number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='strnNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STRN Number</FormLabel>
                    <FormControl>
                      <Input placeholder='STRN number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='bankName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Bank name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='bankAccountNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder='Account number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='ibanNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IBAN Number</FormLabel>
                    <FormControl>
                      <Input placeholder='IBAN' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='creditLimitLC'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (LC)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0.00'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='creditLimitFC'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (FC)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0.00'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='allowedCreditDays'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed Credit Days</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='paymentTerms'
                render={({ field }) => (
                  <FormItem className='md:col-span-2'>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Payment terms and conditions'
                        className='min-h-[80px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* GL Integration Section - Conditionally Rendered */}
          {!isNonGLParty && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  <Badge variant='outline' className='px-2 py-1'>
                    GL Integration
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <ToggleField
                  name='isGLLinked'
                  label='GL Linked'
                  description='Link this party to General Ledger'
                  onChange={handleGLLinkedToggle}
                  disabled={isNonGLParty}
                />

                {isGLLinked && (
                  <>
                    <FormField
                      control={form.control}
                      name='glParentAccountId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GL Parent Account</FormLabel>
                          <FormControl>
                            <Select
                              options={glAccounts}
                              value={glAccounts.find(
                                (option) => option.value === field.value,
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingGlAccounts
                                  ? "Loading..."
                                  : "Select GL Account"
                              }
                              className='react-select-container'
                              classNamePrefix='react-select'
                              isLoading={loadingGlAccounts}
                              isDisabled={loadingGlAccounts}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='glAccountId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GL Account ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='GL Account identifier'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* System Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                <Badge variant='outline' className='px-2 py-1'>
                  System Settings & Permissions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <ToggleField name='trackIdAllowed' label='Track ID Allowed' />
                <ToggleField
                  name='idPasswordAllowed'
                  label='ID Password Allowed'
                />
                <ToggleField name='sendEmail' label='Send Email' />
                <ToggleField name='canSeeBills' label='Can See Bills' />
                <ToggleField name='canSeeLedger' label='Can See Ledger' />
                <ToggleField name='isProcessOwner' label='Process Owner' />
                <ToggleField name='clearanceByOps' label='Clearance By Ops' />
                <ToggleField name='clearanceByAcm' label='Clearance By ACM' />
                <ToggleField
                  name='atTradeForGDInsustrial'
                  label='AT Trade GD Industrial'
                />
                <ToggleField
                  name='atTradeForGDCommercial'
                  label='AT Trade GD Commercial'
                />
              </div>

              <FormField
                control={form.control}
                name='benificiaryNameOfPO'
                render={({ field }) => (
                  <FormItem className='mt-6'>
                    <FormLabel>Beneficiary Name of PO</FormLabel>
                    <FormControl>
                      <Input placeholder='Beneficiary name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Representatives Section */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                <Badge variant='outline' className='px-2 py-1'>
                  Representatives
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <FormField
                control={form.control}
                name='salesRepId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Representative</FormLabel>
                    <FormControl>
                      <Select
                        options={salesReps}
                        value={salesReps.find(
                          (option) => option.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        placeholder={
                          loadingSalesReps ? "Loading..." : "Select Sales Rep"
                        }
                        className='react-select-container'
                        classNamePrefix='react-select'
                        isLoading={loadingSalesReps}
                        isDisabled={loadingSalesReps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='docsRepId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documentation Representative</FormLabel>
                    <FormControl>
                      <Select
                        options={docsReps}
                        value={docsReps.find(
                          (option) => option.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        placeholder={
                          loadingDocsReps ? "Loading..." : "Select Docs Rep"
                        }
                        className='react-select-container'
                        classNamePrefix='react-select'
                        isLoading={loadingDocsReps}
                        isDisabled={loadingDocsReps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='accountsRepId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accounts Representative</FormLabel>
                    <FormControl>
                      <Select
                        options={accountsReps}
                        value={accountsReps.find(
                          (option) => option.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        placeholder={
                          loadingAccountsReps
                            ? "Loading..."
                            : "Select Accounts Rep"
                        }
                        className='react-select-container'
                        classNamePrefix='react-select'
                        isLoading={loadingAccountsReps}
                        isDisabled={loadingAccountsReps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className='flex justify-end gap-4 bottom-4 bg-background p-4 rounded-lg border shadow-sm'>
            <Button
              variant='outline'
              type='button'
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              <Save className='mr-2 h-4 w-4' />
              {type === "edit" ? "Update Party" : "Create Party"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
