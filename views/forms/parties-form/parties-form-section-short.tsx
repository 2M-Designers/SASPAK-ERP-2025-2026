"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Info,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      if (data.isCustomerVendor) {
        return !data.isCustomer && !data.isVendor;
      }
      return true;
    },
    {
      message:
        "Cannot select Customer or Vendor separately when Customer/Vendor is selected",
      path: ["isCustomerVendor"],
    }
  )
  .refine(
    (data) => {
      if (data.isCustomer) {
        return !data.isVendor && !data.isCustomerVendor;
      }
      return true;
    },
    {
      message:
        "Cannot select Vendor or Customer/Vendor when Customer is selected",
      path: ["isCustomer"],
    }
  )
  .refine(
    (data) => {
      if (data.isVendor) {
        return !data.isCustomer && !data.isCustomerVendor;
      }
      return true;
    },
    {
      message:
        "Cannot select Customer or Customer/Vendor when Vendor is selected",
      path: ["isVendor"],
    }
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
  const [activeTab, setActiveTab] = useState("basic");
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

  // Fetch data functions
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
          }))
        );
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
          where:
            "IsHeader==true && ParentAccountId != null && IsActive == true",
          sortOn: "AccountCode",
          page: "",
          pageSize: "",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGlAccounts(
          data.map((account: any) => ({
            value: account.accountId,
            label: `${account.accountCode} - ${account.accountName}`,
          }))
        );
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

  const fetchEmployees = async (
    setter: any,
    setLoader: any,
    repType: string
  ) => {
    setLoader(true);
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
        setter(
          data.map((emp: any) => ({
            value: emp.employeeId,
            label: `${emp.employeeCode} - ${emp.firstName} ${emp.lastName}`,
          }))
        );
      }
    } catch (error) {
      console.error(`Error fetching ${repType}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load ${repType} list`,
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    fetchUnlocations();
    fetchGlAccounts();
    fetchEmployees(setSalesReps, setLoadingSalesReps, "sales representatives");
    fetchEmployees(
      setDocsReps,
      setLoadingDocsReps,
      "documentation representatives"
    );
    fetchEmployees(
      setAccountsReps,
      setLoadingAccountsReps,
      "accounts representatives"
    );
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: 1,
      isActive: true,
      ...defaultState,
      creditLimitLC: defaultState?.creditLimitLC
        ? Number(defaultState.creditLimitLC)
        : 0,
      creditLimitFC: defaultState?.creditLimitFC
        ? Number(defaultState.creditLimitFC)
        : 0,
      allowedCreditDays: defaultState?.allowedCreditDays
        ? Number(defaultState.allowedCreditDays)
        : 0,
    },
  });

  // Watch important fields
  const isNonGLParty = form.watch("isNonGLParty");
  const isGLLinked = form.watch("isGLLinked");
  const isCustomer = form.watch("isCustomer");
  const isVendor = form.watch("isVendor");
  const isCustomerVendor = form.watch("isCustomerVendor");
  const formValues = form.watch();

  // Handle toggle logic
  const handleCustomerVendorToggle = (field: string, value: boolean) => {
    if (field === "isCustomerVendor" && value) {
      form.setValue("isCustomer", false);
      form.setValue("isVendor", false);
    } else if (field === "isCustomer" && value) {
      form.setValue("isVendor", false);
      form.setValue("isCustomerVendor", false);
    } else if (field === "isVendor" && value) {
      form.setValue("isCustomer", false);
      form.setValue("isCustomerVendor", false);
    }
  };

  const handleNonGLPartyToggle = (value: boolean) => {
    if (value) {
      form.setValue("isGLLinked", false);
      form.setValue("glParentAccountId", undefined);
    }
  };

  const handleGLLinkedToggle = (value: boolean) => {
    if (value) {
      form.setValue("isNonGLParty", false);
    }
  };

  const validateForm = () => {
    const errors = form.formState.errors;
    if (!formValues.partyName) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Party Name is required",
      });
      setActiveTab("basic");
      return false;
    }
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!validateForm()) return;

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
      };

      const endpoint = "Party";
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
    highlight = false,
  }: {
    name: keyof z.infer<typeof formSchema>;
    label: string;
    description?: string;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
    highlight?: boolean;
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-center justify-between rounded-lg border p-4 transition-all hover:shadow-md",
            highlight && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className='space-y-0.5 flex-1'>
            <FormLabel className='text-base font-medium'>{label}</FormLabel>
            {description && (
              <FormDescription className='text-sm'>
                {description}
              </FormDescription>
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

  const tabs = [
    { id: "basic", label: "Basic", icon: Building },
    { id: "classification", label: "Classification", icon: User },
    { id: "contact", label: "Contact", icon: Contact },
    { id: "financial", label: "Financial", icon: Banknote },
    { id: "gl", label: "GL Setup", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-muted/20'>
      {/* Fixed Header */}
      <div className='sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b'>
        <div className='px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                {type === "edit" ? "Edit Party" : "Create New Party"}
              </h1>
              <p className='text-muted-foreground mt-1'>
                {type === "edit"
                  ? "Update party information"
                  : "Add a new party to the system"}
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                <X className='h-4 w-4 mr-2' />
                Cancel
              </Button>
              <Button
                type='submit'
                form='party-form'
                disabled={isSubmitting}
                className='min-w-[140px]'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    {type === "edit" ? "Update Party" : "Create Party"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className='mt-6'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-6 h-12'>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className='flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                    >
                      <Icon className='h-4 w-4' />
                      <span className='hidden sm:inline'>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className='px-6 py-6 max-w-full'>
        <Form {...form}>
          <form
            id='party-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6'
          >
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

            {/* Tab Content */}
            <Tabs value={activeTab} className='w-full'>
              {/* Basic Info Tab */}
              <TabsContent value='basic' className='space-y-6 mt-0'>
                {(isCustomer && (isVendor || isCustomerVendor)) ||
                (isVendor && (isCustomer || isCustomerVendor)) ||
                (isCustomerVendor && (isCustomer || isVendor)) ? (
                  <Alert
                    variant='destructive'
                    className='mb-6 animate-in fade-in-50'
                  >
                    <AlertCircle className='h-5 w-5' />
                    <AlertTitle className='font-semibold'>
                      Invalid Selection
                    </AlertTitle>
                    <AlertDescription className='mt-2'>
                      A party cannot be both Customer and Vendor simultaneously.
                      Please select only one of: Customer, Vendor, or
                      Customer/Vendor.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Left Column */}
                  <Card className='border-2 h-fit'>
                    <CardHeader className='pb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <Building className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>
                            Basic Information
                          </CardTitle>
                          <CardDescription>
                            Enter fundamental party details
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='partyCode'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center gap-2'>
                              Party Code
                              <Badge variant='secondary' className='text-xs'>
                                Auto-generated
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Will be generated automatically'
                                {...field}
                                disabled
                                className='bg-muted'
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
                            <FormLabel className='flex items-center gap-2'>
                              Party Name
                              <Badge variant='destructive' className='text-xs'>
                                Required
                              </Badge>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Enter full party name'
                                {...field}
                                className='font-medium'
                              />
                            </FormControl>
                            <FormDescription>
                              Official registered name
                            </FormDescription>
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
                              <Input
                                placeholder='Enter abbreviated name'
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              For display purposes
                            </FormDescription>
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
                                  (option) => option.value === field.value
                                )}
                                onChange={(val) => field.onChange(val?.value)}
                                placeholder={
                                  loadingUnlocations
                                    ? "Loading locations..."
                                    : "Select UN Location"
                                }
                                className='react-select-container'
                                classNamePrefix='react-select'
                                isLoading={loadingUnlocations}
                                isDisabled={loadingUnlocations}
                              />
                            </FormControl>
                            <FormDescription>Primary location</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Right Column - Customer/Vendor Section */}
                  <Card className='border-2 h-fit'>
                    <CardHeader className='pb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <User className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>Party Type</CardTitle>
                          <CardDescription>
                            Define party relationship
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      <div className='bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800'>
                        <div className='flex gap-2 mb-3'>
                          <Info className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
                          <div>
                            <h4 className='text-sm font-semibold text-amber-900 dark:text-amber-100'>
                              Customer/Vendor Relationship
                            </h4>
                            <p className='text-sm text-amber-700 dark:text-amber-300'>
                              Select only one option
                            </p>
                          </div>
                        </div>
                        <div className='grid grid-cols-1 gap-4 mt-4'>
                          <ToggleField
                            name='isCustomer'
                            label='Customer'
                            description='Party purchases from us'
                            disabled={isVendor || isCustomerVendor}
                            onChange={(checked) =>
                              handleCustomerVendorToggle("isCustomer", checked)
                            }
                            highlight={isCustomer}
                          />
                          <ToggleField
                            name='isVendor'
                            label='Vendor'
                            description='We purchase from party'
                            disabled={isCustomer || isCustomerVendor}
                            onChange={(checked) =>
                              handleCustomerVendorToggle("isVendor", checked)
                            }
                            highlight={isVendor}
                          />
                          <ToggleField
                            name='isCustomerVendor'
                            label='Customer/Vendor'
                            description='Both relationships exist'
                            disabled={isCustomer || isVendor}
                            onChange={(checked) =>
                              handleCustomerVendorToggle(
                                "isCustomerVendor",
                                checked
                              )
                            }
                            highlight={isCustomerVendor}
                          />
                        </div>
                      </div>

                      <ToggleField
                        name='isActive'
                        label='Active Party'
                        description='Make this party active in the system'
                        highlight={true}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Classification Tab */}
              <TabsContent value='classification' className='space-y-6 mt-0'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Party Roles */}
                  <Card className='border-2'>
                    <CardHeader>
                      <CardTitle className='text-xl'>Party Roles</CardTitle>
                      <CardDescription>
                        Define additional roles for this party
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <ToggleField
                        name='isAgent'
                        label='Agent'
                        description='Acts as intermediary'
                      />
                      <ToggleField
                        name='isOverseasAgent'
                        label='Overseas Agent'
                        description='International representative'
                      />
                      <ToggleField
                        name='isShippingLine'
                        label='Shipping Line'
                        description='Vessel operator'
                      />
                      <ToggleField
                        name='isTransporter'
                        label='Transporter'
                        description='Ground transportation'
                      />
                      <ToggleField
                        name='isConsignee'
                        label='Consignee'
                        description='Cargo receiver'
                      />
                      <ToggleField
                        name='isShipper'
                        label='Shipper'
                        description='Cargo sender'
                      />
                      <ToggleField
                        name='isPrincipal'
                        label='Principal'
                        description='Primary party'
                      />
                      <ToggleField
                        name='isNonGLParty'
                        label='Non-GL Party'
                        description='Excluded from General Ledger'
                        onChange={handleNonGLPartyToggle}
                        highlight={isNonGLParty}
                      />
                    </CardContent>
                  </Card>

                  {/* Business Operations */}
                  <Card className='border-2'>
                    <CardHeader>
                      <CardTitle className='text-xl'>
                        Business Operations
                      </CardTitle>
                      <CardDescription>
                        Select applicable business areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 gap-4'>
                        <ToggleField
                          name='isInSeaImport'
                          label='Sea Import'
                          description='Handles sea import operations'
                        />
                        <ToggleField
                          name='isInSeaExport'
                          label='Sea Export'
                          description='Handles sea export operations'
                        />
                        <ToggleField
                          name='isInAirImport'
                          label='Air Import'
                          description='Handles air import operations'
                        />
                        <ToggleField
                          name='isInAirExport'
                          label='Air Export'
                          description='Handles air export operations'
                        />
                        <ToggleField
                          name='isInLogistics'
                          label='Logistics'
                          description='Handles logistics operations'
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value='contact' className='space-y-6 mt-0'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Company Contact */}
                  <Card className='border-2'>
                    <CardHeader>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <Building className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>
                            Company Contact
                          </CardTitle>
                          <CardDescription>
                            General company information
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 gap-4'>
                        <FormField
                          control={form.control}
                          name='addressLine1'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Street address, building name'
                                  {...field}
                                />
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
                                <Input
                                  placeholder='Apartment, suite, unit, floor'
                                  {...field}
                                />
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
                                <Input
                                  placeholder='ZIP/Postal code'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <FormField
                            control={form.control}
                            name='phone'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='+92 XXX XXXXXXX'
                                    {...field}
                                  />
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
                        </div>

                        <FormField
                          control={form.control}
                          name='email'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Email</FormLabel>
                              <FormControl>
                                <Input
                                  type='email'
                                  placeholder='company@example.com'
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
                                <Input
                                  placeholder='https://www.example.com'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Person */}
                  <Card className='border-2'>
                    <CardHeader>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <User className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>
                            Contact Person
                          </CardTitle>
                          <CardDescription>
                            Primary point of contact
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 gap-4'>
                        <FormField
                          control={form.control}
                          name='contactPersonName'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder='John Doe' {...field} />
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
                                <Input
                                  placeholder='Manager, Director, etc.'
                                  {...field}
                                />
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
                                  placeholder='contact@example.com'
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
                                <Input
                                  placeholder='+92 XXX XXXXXXX'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value='financial' className='space-y-6 mt-0'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Tax & Banking */}
                  <Card className='border-2'>
                    <CardHeader>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <Banknote className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>
                            Tax & Banking
                          </CardTitle>
                          <CardDescription>
                            Tax registration and bank details
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 gap-4'>
                        <FormField
                          control={form.control}
                          name='ntnNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NTN Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='National Tax Number'
                                  {...field}
                                />
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
                                <Input
                                  placeholder='Sales Tax Registration Number'
                                  {...field}
                                />
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
                                <Input
                                  placeholder='Enter bank name'
                                  {...field}
                                />
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
                                <Input
                                  placeholder='Account number'
                                  {...field}
                                />
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
                                <Input
                                  placeholder='PK XX XXXX XXXX XXXX XXXX XXXX XXXX'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Credit Terms */}
                  <Card className='border-2'>
                    <CardHeader>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <FileText className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>
                            Credit Terms
                          </CardTitle>
                          <CardDescription>
                            Set credit limits and payment terms
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 gap-4'>
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
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>Local currency</FormDescription>
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
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Foreign currency
                              </FormDescription>
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
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>Payment period</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='paymentTerms'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Terms</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='Enter detailed payment terms and conditions...'
                                  className='min-h-[100px]'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* GL Setup Tab */}
              <TabsContent value='gl' className='space-y-6 mt-0'>
                <Card className='border-2 max-w-2xl mx-auto'>
                  <CardHeader>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-primary rounded-lg'>
                        <FileText className='h-5 w-5 text-primary-foreground' />
                      </div>
                      <div>
                        <CardTitle className='text-xl'>
                          GL Integration
                        </CardTitle>
                        <CardDescription>
                          Link this party to your General Ledger
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {isNonGLParty ? (
                      <Alert className='border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800'>
                        <AlertCircle className='h-5 w-5 text-yellow-600' />
                        <AlertTitle className='text-yellow-900 dark:text-yellow-100 font-semibold'>
                          GL Integration Not Available
                        </AlertTitle>
                        <AlertDescription className='text-yellow-800 dark:text-yellow-200 mt-2'>
                          This party is marked as a{" "}
                          <strong>Non-GL Party</strong>. To enable GL
                          integration, go to the Classification tab and turn off
                          the Non-GL Party option.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <ToggleField
                          name='isGLLinked'
                          label='Enable GL Linkage'
                          description='Connect this party to your General Ledger system for automatic accounting'
                          onChange={handleGLLinkedToggle}
                          disabled={isNonGLParty}
                          highlight={isGLLinked}
                        />

                        {isGLLinked && (
                          <>
                            <Separator />
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
                                        (option) => option.value === field.value
                                      )}
                                      onChange={(val) =>
                                        field.onChange(val?.value)
                                      }
                                      placeholder={
                                        loadingGlAccounts
                                          ? "Loading GL accounts..."
                                          : "Select GL Account"
                                      }
                                      className='react-select-container'
                                      classNamePrefix='react-select'
                                      isLoading={loadingGlAccounts}
                                      isDisabled={loadingGlAccounts}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Parent account for this parties transactions
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value='settings' className='space-y-6 mt-0'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* System Settings */}
                  <Card className='border-2'>
                    <CardHeader>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <Settings className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>
                            System Settings
                          </CardTitle>
                          <CardDescription>
                            Configure system permissions
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 gap-4'>
                        <ToggleField
                          name='trackIdAllowed'
                          label='Track ID Allowed'
                          description='Enable shipment tracking'
                        />
                        <ToggleField
                          name='idPasswordAllowed'
                          label='ID Password Allowed'
                          description='Portal login access'
                        />
                        <ToggleField
                          name='sendEmail'
                          label='Send Email Notifications'
                          description='Automated email alerts'
                        />
                        <ToggleField
                          name='canSeeBills'
                          label='Can View Bills'
                          description='Access to billing information'
                        />
                        <ToggleField
                          name='canSeeLedger'
                          label='Can View Ledger'
                          description='Access to ledger data'
                        />
                        <ToggleField
                          name='isProcessOwner'
                          label='Process Owner'
                          description='Primary process responsibility'
                        />
                        <ToggleField
                          name='clearanceByOps'
                          label='Clearance By Operations'
                          description='Ops team clearance'
                        />
                        <ToggleField
                          name='clearanceByAcm'
                          label='Clearance By ACM'
                          description='ACM team clearance'
                        />
                        <ToggleField
                          name='atTradeForGDInsustrial'
                          label='AT Trade - Industrial'
                          description='Industrial GD trade'
                        />
                        <ToggleField
                          name='atTradeForGDCommercial'
                          label='AT Trade - Commercial'
                          description='Commercial GD trade'
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Representatives */}
                  <Card className='border-2'>
                    <CardHeader>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary rounded-lg'>
                          <User className='h-5 w-5 text-primary-foreground' />
                        </div>
                        <div>
                          <CardTitle className='text-xl'>
                            Assign Representatives
                          </CardTitle>
                          <CardDescription>
                            Assign employees to handle this party
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 gap-4'>
                        <FormField
                          control={form.control}
                          name='benificiaryNameOfPO'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Beneficiary Name for Purchase Orders
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Enter beneficiary name'
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Name used in purchase orders
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                    (option) => option.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  placeholder={
                                    loadingSalesReps
                                      ? "Loading..."
                                      : "Select Sales Rep"
                                  }
                                  className='react-select-container'
                                  classNamePrefix='react-select'
                                  isLoading={loadingSalesReps}
                                  isDisabled={loadingSalesReps}
                                />
                              </FormControl>
                              <FormDescription>
                                Handles sales activities
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='docsRepId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Documentation Rep</FormLabel>
                              <FormControl>
                                <Select
                                  options={docsReps}
                                  value={docsReps.find(
                                    (option) => option.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  placeholder={
                                    loadingDocsReps
                                      ? "Loading..."
                                      : "Select Docs Rep"
                                  }
                                  className='react-select-container'
                                  classNamePrefix='react-select'
                                  isLoading={loadingDocsReps}
                                  isDisabled={loadingDocsReps}
                                />
                              </FormControl>
                              <FormDescription>
                                Handles documentation
                              </FormDescription>
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
                                    (option) => option.value === field.value
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
                              <FormDescription>
                                Handles accounting
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}
