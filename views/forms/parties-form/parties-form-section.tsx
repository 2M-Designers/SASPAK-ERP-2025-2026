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
    addressLine1: z.string().min(1, "Address Line 1 is required"),
    addressLine2: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().min(1, "Phone is required"),
    fax: z.string().optional(),
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "Email is required"),
    website: z.string().optional(),
    contactPersonName: z.string().optional(),
    contactPersonDesignation: z.string().optional(),
    contactPersonEmail: z
      .string()
      .email("Invalid email address")
      .min(1, "Contact Person Email is required"),
    contactPersonPhone: z.string().min(1, "Contact Person Phone is required"),
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

// Define form steps
const formSteps = [
  {
    id: 1,
    title: "Basic Info",
    fullTitle: "Basic Information",
    icon: Building,
    description: "Enter basic party details",
  },
  {
    id: 2,
    title: "Classification",
    fullTitle: "Party Classification",
    icon: User,
    description: "Define party type and operations",
  },
  {
    id: 3,
    title: "Contact",
    fullTitle: "Contact Details",
    icon: Contact,
    description: "Add contact information",
  },
  {
    id: 4,
    title: "Financial",
    fullTitle: "Financial Information",
    icon: Banknote,
    description: "Add financial and banking details",
  },
  {
    id: 5,
    title: "GL Setup",
    fullTitle: "GL Integration",
    icon: FileText,
    description: "Configure GL linkage",
  },
  {
    id: 6,
    title: "Settings",
    fullTitle: "System Settings",
    icon: Settings,
    description: "Configure system permissions",
  },
  {
    id: 7,
    title: "Review",
    fullTitle: "Review & Submit",
    icon: CheckCircle,
    description: "Review and submit party details",
  },
];

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
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
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

  // Navigation with validation
  const validateCurrentStep = () => {
    const errors = form.formState.errors;

    switch (currentStep) {
      case 1:
        return !errors.partyName && formValues.partyName;
      case 2:
        return true;
      case 3:
        return !errors.email && !errors.contactPersonEmail;
      case 4:
        return !errors.creditLimitLC && !errors.creditLimitFC;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < formSteps.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          "Please fix the errors before proceeding to the next step.",
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const progress = ((currentStep - 1) / (formSteps.length - 1)) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className='border-2'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-primary rounded-lg'>
                  <Building className='h-6 w-6 text-primary-foreground' />
                </div>
                <div>
                  <CardTitle className='text-2xl'>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the fundamental details of the party
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-6'>
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
                      Official registered name of the party
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
                      <Input placeholder='Enter abbreviated name' {...field} />
                    </FormControl>
                    <FormDescription>
                      A shorter version for display purposes
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
                    <FormDescription>
                      Primary location for this party
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='md:col-span-2'>
                <ToggleField
                  name='isActive'
                  label='Active Party'
                  description='Enable to make this party active and visible in the system'
                  highlight={true}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <>
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

            <Card className='border-2'>
              <CardHeader className='bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <User className='h-6 w-6 text-primary-foreground' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>
                      Party Classification
                    </CardTitle>
                    <CardDescription>
                      Define the type and operational scope of the party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-6 space-y-6'>
                <div className='bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800'>
                  <div className='flex gap-2 mb-3'>
                    <Info className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <h4 className='text-sm font-semibold text-amber-900 dark:text-amber-100'>
                        Customer/Vendor Relationship
                      </h4>
                      <p className='text-sm text-amber-700 dark:text-amber-300'>
                        Select only one option from the three below
                      </p>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
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
                        handleCustomerVendorToggle("isCustomerVendor", checked)
                      }
                      highlight={isCustomerVendor}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                    <span className='h-1 w-1 rounded-full bg-primary'></span>
                    Party Roles
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
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
                      description='Excluded from GL'
                      onChange={handleNonGLPartyToggle}
                      highlight={isNonGLParty}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                    <span className='h-1 w-1 rounded-full bg-primary'></span>
                    Business Operations
                  </h4>
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                    <ToggleField name='isInSeaImport' label='Sea Import' />
                    <ToggleField name='isInSeaExport' label='Sea Export' />
                    <ToggleField name='isInAirImport' label='Air Import' />
                    <ToggleField name='isInAirExport' label='Air Export' />
                    <ToggleField name='isInLogistics' label='Logistics' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        );

      case 3:
        return (
          <div className='space-y-6'>
            <Card className='border-2'>
              <CardHeader className='bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <Contact className='h-6 w-6 text-primary-foreground' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>Company Contact</CardTitle>
                    <CardDescription>
                      General contact information for the party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-6'>
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
                        <Input placeholder='ZIP/Postal code' {...field} />
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
                        <Input placeholder='+92 XXX XXXXXXX' {...field} />
                      </FormControl>
                      <FormDescription>Include country code</FormDescription>
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
                          placeholder='company@example.com'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Primary company email</FormDescription>
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
              </CardContent>
            </Card>

            <Card className='border-2'>
              <CardHeader className='bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <User className='h-6 w-6 text-primary-foreground' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>Contact Person</CardTitle>
                    <CardDescription>
                      Primary point of contact for this party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-6'>
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
                      <FormDescription>
                        Direct email of contact person
                      </FormDescription>
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
                        <Input placeholder='+92 XXX XXXXXXX' {...field} />
                      </FormControl>
                      <FormDescription>
                        Direct phone of contact person
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <Card className='border-2'>
            <CardHeader className='bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-primary rounded-lg'>
                  <Banknote className='h-6 w-6 text-primary-foreground' />
                </div>
                <div>
                  <CardTitle className='text-2xl'>
                    Financial Information
                  </CardTitle>
                  <CardDescription>
                    Banking and tax details for the party
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-6 space-y-6'>
              <div>
                <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                  <span className='h-1 w-1 rounded-full bg-primary'></span>
                  Tax Information
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='ntnNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NTN Number</FormLabel>
                        <FormControl>
                          <Input placeholder='National Tax Number' {...field} />
                        </FormControl>
                        <FormDescription>
                          Tax registration number
                        </FormDescription>
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
                        <FormDescription>Sales tax number</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                  <span className='h-1 w-1 rounded-full bg-primary'></span>
                  Banking Details
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='bankName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Enter bank name' {...field} />
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
                      <FormItem className='md:col-span-2'>
                        <FormLabel>IBAN Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='PK XX XXXX XXXX XXXX XXXX XXXX XXXX'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          International Bank Account Number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                  <span className='h-1 w-1 rounded-full bg-primary'></span>
                  Credit Terms
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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
                        <FormDescription>Foreign currency</FormDescription>
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
                </div>

                <FormField
                  control={form.control}
                  name='paymentTerms'
                  render={({ field }) => (
                    <FormItem className='mt-6'>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter detailed payment terms and conditions...'
                          className='min-h-[100px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional payment terms or conditions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return !isNonGLParty ? (
          <Card className='border-2'>
            <CardHeader className='bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-primary rounded-lg'>
                  <FileText className='h-6 w-6 text-primary-foreground' />
                </div>
                <div>
                  <CardTitle className='text-2xl'>GL Integration</CardTitle>
                  <CardDescription>
                    Link this party to your General Ledger
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-6 space-y-6'>
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
                  <div className='bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800'>
                    <div className='flex gap-2 mb-3'>
                      <Info className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
                      <div>
                        <h4 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
                          GL Account Selection
                        </h4>
                        <p className='text-sm text-blue-700 dark:text-blue-300'>
                          Select the parent GL account for this party
                        </p>
                      </div>
                    </div>
                  </div>

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
                            onChange={(val) => field.onChange(val?.value)}
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
                          The parent account under which this partys
                          transactions will be recorded
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className='border-2'>
            <CardHeader className='bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-primary rounded-lg'>
                  <FileText className='h-6 w-6 text-primary-foreground' />
                </div>
                <div>
                  <CardTitle className='text-2xl'>GL Integration</CardTitle>
                  <CardDescription>
                    Configure General Ledger linkage
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-6'>
              <Alert className='border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800'>
                <AlertCircle className='h-5 w-5 text-yellow-600' />
                <AlertTitle className='text-yellow-900 dark:text-yellow-100 font-semibold'>
                  GL Integration Not Available
                </AlertTitle>
                <AlertDescription className='text-yellow-800 dark:text-yellow-200 mt-2'>
                  This party is marked as a <strong>Non-GL Party</strong>, which
                  means GL linking options are disabled. To enable GL
                  integration, go back to Step 2 (Party Classification) and turn
                  off the Non-GL Party option.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <div className='space-y-6'>
            <Card className='border-2'>
              <CardHeader className='bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <Settings className='h-6 w-6 text-primary-foreground' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>System Settings</CardTitle>
                    <CardDescription>
                      Configure system permissions and access
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-6 space-y-6'>
                <div>
                  <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                    <span className='h-1 w-1 rounded-full bg-primary'></span>
                    Portal Access
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className='text-sm font-semibold mb-4 flex items-center gap-2'>
                    <span className='h-1 w-1 rounded-full bg-primary'></span>
                    Operational Settings
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                </div>

                <Separator />

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
                        Name to be used as beneficiary in purchase orders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className='border-2'>
              <CardHeader className='bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <User className='h-6 w-6 text-primary-foreground' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>
                      Assign Representatives
                    </CardTitle>
                    <CardDescription>
                      Assign employees to handle this party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6 pt-6'>
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
                            loadingSalesReps ? "Loading..." : "Select Sales Rep"
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
                            loadingDocsReps ? "Loading..." : "Select Docs Rep"
                          }
                          className='react-select-container'
                          classNamePrefix='react-select'
                          isLoading={loadingDocsReps}
                          isDisabled={loadingDocsReps}
                        />
                      </FormControl>
                      <FormDescription>Handles documentation</FormDescription>
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
                      <FormDescription>Handles accounting</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 7:
        const isFormValid = formValues.partyName && validateCurrentStep();

        return (
          <Card className='border-2'>
            <CardHeader className='bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-600 rounded-lg'>
                  <CheckCircle className='h-6 w-6 text-white' />
                </div>
                <div>
                  <CardTitle className='text-2xl'>Review & Submit</CardTitle>
                  <CardDescription>
                    Review all information before submitting
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-6 space-y-6'>
              {!isFormValid && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Incomplete Information</AlertTitle>
                  <AlertDescription>
                    Please ensure all required fields are filled correctly
                    before submitting.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className='border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800'>
                <Info className='h-4 w-4 text-blue-600' />
                <AlertDescription className='text-blue-900 dark:text-blue-100'>
                  Review all the information below. You can go back to any step
                  to make changes.
                </AlertDescription>
              </Alert>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card className='border shadow-sm'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <Building className='h-4 w-4' />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Party Name:
                      </span>
                      <span className='font-medium text-sm text-right'>
                        {formValues.partyName || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Short Name:
                      </span>
                      <span className='font-medium text-sm'>
                        {formValues.partyShortName || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Status:
                      </span>
                      <Badge
                        variant={formValues.isActive ? "default" : "secondary"}
                        className='text-xs'
                      >
                        {formValues.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border shadow-sm'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      Party Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Customer:
                      </span>
                      <Badge
                        variant={formValues.isCustomer ? "default" : "outline"}
                        className='text-xs'
                      >
                        {formValues.isCustomer ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Vendor:
                      </span>
                      <Badge
                        variant={formValues.isVendor ? "default" : "outline"}
                        className='text-xs'
                      >
                        {formValues.isVendor ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Non-GL Party:
                      </span>
                      <Badge
                        variant={
                          formValues.isNonGLParty ? "default" : "outline"
                        }
                        className='text-xs'
                      >
                        {formValues.isNonGLParty ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border shadow-sm'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <Contact className='h-4 w-4' />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Phone:
                      </span>
                      <span className='font-medium text-sm'>
                        {formValues.phone || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Email:
                      </span>
                      <span className='font-medium text-sm truncate max-w-[200px]'>
                        {formValues.email || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Contact Person:
                      </span>
                      <span className='font-medium text-sm'>
                        {formValues.contactPersonName || "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border shadow-sm'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <Banknote className='h-4 w-4' />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        NTN:
                      </span>
                      <span className='font-medium text-sm'>
                        {formValues.ntnNumber || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Credit Limit (LC):
                      </span>
                      <span className='font-medium text-sm'>
                        {formValues.creditLimitLC}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-muted-foreground'>
                        Credit Days:
                      </span>
                      <span className='font-medium text-sm'>
                        {formValues.allowedCreditDays}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className='bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 rounded-lg border-2 border-green-200 dark:border-green-800'>
                <h4 className='font-semibold mb-3 text-green-900 dark:text-green-100 flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5' />
                  Completion Summary
                </h4>
                <ul className='space-y-2'>
                  {formSteps.slice(0, -1).map((step) => {
                    const Icon = step.icon;
                    const isCompleted =
                      completedSteps.includes(step.id) || currentStep > step.id;
                    return (
                      <li key={step.id} className='flex items-center gap-3'>
                        <div
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full",
                            isCompleted
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className='h-4 w-4' />
                          ) : (
                            <Icon className='h-4 w-4' />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm",
                            isCompleted
                              ? "text-green-900 dark:text-green-100 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {step.fullTitle}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className='container mx-auto px-4 py-6 max-w-7xl'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {type === "edit" ? "Edit Party" : "Create New Party"}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {type === "edit"
              ? "Update party information"
              : "Add a new party to the system"}
          </p>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <X className='h-4 w-4 mr-2' />
          Cancel
        </Button>
      </div>

      {/* Progress Bar */}
      <Card className='mb-6 border-2'>
        <CardContent className='pt-6'>
          <div className='flex justify-between mb-3'>
            <div>
              <span className='text-sm font-medium'>
                Step {currentStep} of {formSteps.length}
              </span>
              <p className='text-xs text-muted-foreground mt-1'>
                {formSteps[currentStep - 1].description}
              </p>
            </div>
            <span className='text-sm font-bold text-primary'>
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className='h-3' />
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className='mb-6'>
        <div className='grid grid-cols-7 gap-2'>
          {formSteps.map((step) => {
            const Icon = step.icon;
            const isCompleted =
              completedSteps.includes(step.id) || currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type='button'
                onClick={() => goToStep(step.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all duration-200 border-2",
                  isCurrent &&
                    "bg-primary text-primary-foreground shadow-lg scale-105 border-primary",
                  isCompleted &&
                    !isCurrent &&
                    "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
                  !isCurrent &&
                    !isCompleted &&
                    "bg-background hover:bg-muted border-border hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors",
                    isCurrent && "bg-primary-foreground text-primary",
                    isCompleted &&
                      !isCurrent &&
                      "bg-primary text-primary-foreground",
                    !isCurrent && !isCompleted && "bg-muted"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <CheckCircle className='h-5 w-5' />
                  ) : (
                    <Icon className='h-5 w-5' />
                  )}
                </div>
                <span className='text-[10px] text-center font-semibold leading-tight'>
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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

          {/* Current Step Content */}
          <div className='min-h-[600px] animate-in fade-in-50 duration-500'>
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <Card className='sticky bottom-4 border-2 shadow-lg'>
            <CardContent className='p-4'>
              <div className='flex justify-between items-center gap-4'>
                <div>
                  {currentStep > 1 && (
                    <Button
                      variant='outline'
                      type='button'
                      onClick={prevStep}
                      disabled={isSubmitting}
                      className='gap-2'
                      size='lg'
                    >
                      <ChevronLeft className='h-5 w-5' />
                      Previous
                    </Button>
                  )}
                </div>

                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground hidden md:block'>
                    {formSteps[currentStep - 1].fullTitle}
                  </span>
                </div>

                <div className='flex gap-3'>
                  {currentStep < formSteps.length ? (
                    <Button
                      type='button'
                      onClick={nextStep}
                      className='gap-2'
                      size='lg'
                    >
                      Next
                      <ChevronRight className='h-5 w-5' />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant='outline'
                        type='button'
                        onClick={() => setCurrentStep(1)}
                        disabled={isSubmitting}
                        size='lg'
                      >
                        Edit Details
                      </Button>
                      <Button
                        type='submit'
                        disabled={isSubmitting || !formValues.partyName}
                        className='gap-2 min-w-[140px]'
                        size='lg'
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className='h-5 w-5 animate-spin' />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Save className='h-5 w-5' />
                            {type === "edit" ? "Update Party" : "Create Party"}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
