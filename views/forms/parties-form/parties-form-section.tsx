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
    benificiaryNameOfPO: z
      .string()
      .min(1, "Beneficiary Name of PO is required"),
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
      // If Non-GL Party is enabled, disable GL Linkage
      form.setValue("isGLLinked", false);
      form.setValue("glParentAccountId", undefined);
    } else {
      // If Non-GL Party is disabled, auto-enable GL Linkage
      form.setValue("isGLLinked", true);
    }
  };

  const handleGLLinkedToggle = (value: boolean) => {
    if (value) {
      // If GL Linkage is enabled, disable Non-GL Party
      form.setValue("isNonGLParty", false);
    }
  };

  // Validation function for each step
  const validateCurrentStep = async () => {
    let isValid = true;
    const errors: string[] = [];

    switch (currentStep) {
      case 1:
        if (!formValues.partyName || formValues.partyName.trim() === "") {
          errors.push("Party Name is required");
          isValid = false;
        }
        break;

      case 2:
        // Check if at least one of Customer, Vendor, or Customer/Vendor is selected
        if (
          !formValues.isCustomer &&
          !formValues.isVendor &&
          !formValues.isCustomerVendor
        ) {
          errors.push(
            "Please select at least one: Customer, Vendor, or Customer/Vendor"
          );
          isValid = false;
        }
        break;

      case 3:
        if (!formValues.addressLine1 || formValues.addressLine1.trim() === "") {
          errors.push("Address Line 1 is required");
          isValid = false;
        }
        if (!formValues.phone || formValues.phone.trim() === "") {
          errors.push("Phone is required");
          isValid = false;
        }
        if (!formValues.email || formValues.email.trim() === "") {
          errors.push("Email is required");
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
          errors.push("Invalid email address");
          isValid = false;
        }
        if (
          !formValues.contactPersonEmail ||
          formValues.contactPersonEmail.trim() === ""
        ) {
          errors.push("Contact Person Email is required");
          isValid = false;
        } else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.contactPersonEmail)
        ) {
          errors.push("Invalid contact person email address");
          isValid = false;
        }
        if (
          !formValues.contactPersonPhone ||
          formValues.contactPersonPhone.trim() === ""
        ) {
          errors.push("Contact Person Phone is required");
          isValid = false;
        }
        break;

      case 4:
        // No mandatory fields in step 4
        break;

      case 5:
        // If not a Non-GL Party and GL Linked, then GL Parent Account is required
        if (
          !formValues.isNonGLParty &&
          formValues.isGLLinked &&
          !formValues.glParentAccountId
        ) {
          errors.push(
            "GL Parent Account is required when GL Linkage is enabled"
          );
          isValid = false;
        }
        break;

      case 6:
        if (
          !formValues.benificiaryNameOfPO ||
          formValues.benificiaryNameOfPO.trim() === ""
        ) {
          errors.push("Beneficiary Name of PO is required");
          isValid = false;
        }
        break;

      default:
        break;
    }

    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: errors.join(", "),
      });
    }

    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();

    if (isValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < formSteps.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
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
            "flex flex-row items-center justify-between rounded-lg border p-3 transition-all hover:shadow-sm hover:border-blue-300",
            highlight && "border-blue-500 bg-blue-50 shadow-sm",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className='space-y-0.5 flex-1'>
            <FormLabel className='text-sm font-medium'>{label}</FormLabel>
            {description && (
              <FormDescription className='text-xs text-gray-600'>
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

  const progress = Math.round(
    ((currentStep - 1) / (formSteps.length - 1)) * 100
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className='border shadow-sm'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 py-4 px-5 border-b'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-600 rounded-lg shadow-sm'>
                  <Building className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-semibold text-gray-900'>
                    Basic Information
                  </CardTitle>
                  <CardDescription className='text-xs text-gray-600'>
                    Enter the fundamental details of the party
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 pb-4 px-5'>
              <FormField
                control={form.control}
                name='partyCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                      Party Code
                      <Badge
                        variant='secondary'
                        className='text-[10px] px-1.5 py-0.5'
                      >
                        Auto
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Auto-generated'
                        {...field}
                        value={field.value || ""}
                        disabled
                        className='bg-gray-100 h-10 text-sm border-gray-200'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='partyName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                      Party Name
                      <span className='text-red-500 text-base'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter full party name'
                        {...field}
                        className='font-medium h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      />
                    </FormControl>
                    <FormDescription className='text-xs text-gray-500'>
                      Official registered name of the party
                    </FormDescription>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='partyShortName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Short Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter abbreviated name'
                        {...field}
                        className='h-10 text-sm border-gray-300 focus:border-blue-500'
                      />
                    </FormControl>
                    <FormDescription className='text-xs text-gray-500'>
                      A shorter version for display purposes
                    </FormDescription>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='unLocationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      UN Location
                    </FormLabel>
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
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "40px",
                            fontSize: "14px",
                            borderColor: "#d1d5db",
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 50,
                          }),
                        }}
                      />
                    </FormControl>
                    <FormDescription className='text-xs text-gray-500'>
                      Primary location for this party
                    </FormDescription>
                    <FormMessage className='text-xs' />
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
                className='mb-4 animate-in fade-in-50 border-red-300 bg-red-50'
              >
                <AlertCircle className='h-4 w-4 text-red-600' />
                <AlertTitle className='font-semibold text-sm text-red-900'>
                  Invalid Selection
                </AlertTitle>
                <AlertDescription className='mt-1 text-xs text-red-800'>
                  A party cannot be both Customer and Vendor simultaneously.
                  Please select only one of: Customer, Vendor, or
                  Customer/Vendor.
                </AlertDescription>
              </Alert>
            ) : null}

            {!isCustomer && !isVendor && !isCustomerVendor ? (
              <Alert
                variant='destructive'
                className='mb-4 animate-in fade-in-50 border-orange-300 bg-orange-50'
              >
                <AlertCircle className='h-4 w-4 text-orange-600' />
                <AlertTitle className='font-semibold text-sm text-orange-900'>
                  Selection Required
                </AlertTitle>
                <AlertDescription className='mt-1 text-xs text-orange-800'>
                  Please select at least one option: Customer, Vendor, or
                  Customer/Vendor to proceed to the next step.
                </AlertDescription>
              </Alert>
            ) : null}

            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-purple-50 to-pink-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-purple-600 rounded-lg shadow-sm'>
                    <User className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      Party Classification
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      Define the type and operational scope of the party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-5 pb-4 px-5 space-y-5'>
                <div className='bg-amber-50 p-4 rounded-lg border border-amber-200'>
                  <div className='flex gap-2 mb-3'>
                    <Info className='h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <h4 className='text-xs font-semibold text-amber-900 flex items-center gap-1.5'>
                        Customer/Vendor Relationship
                        <span className='text-red-500 text-sm'>*</span>
                      </h4>
                      <p className='text-xs text-amber-700 mt-0.5'>
                        Select at least one option from the three below
                        (required)
                      </p>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mt-3'>
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
                  <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600'></span>
                    Party Roles
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
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
                  <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600'></span>
                    Business Operations
                  </h4>
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
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
          <div className='space-y-4'>
            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-green-50 to-teal-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-green-600 rounded-lg shadow-sm'>
                    <Contact className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      Company Contact
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      General contact information for the party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 pb-4 px-5'>
                <FormField
                  control={form.control}
                  name='addressLine1'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                        Address Line 1
                        <span className='text-red-500 text-base'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Street address, building name'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='addressLine2'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Address Line 2
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Apartment, suite, unit, floor'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='postalCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Postal Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='ZIP/Postal code'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                        Phone
                        <span className='text-red-500 text-base'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='+92 XXX XXXXXXX'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Include country code
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='fax'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>Fax</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Fax number'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                        Email
                        <span className='text-red-500 text-base'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='company@example.com'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Primary company email
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='website'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://www.example.com'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-cyan-50 to-blue-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-cyan-600 rounded-lg shadow-sm'>
                    <User className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      Contact Person
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      Primary point of contact for this party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 pb-4 px-5'>
                <FormField
                  control={form.control}
                  name='contactPersonName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='John Doe'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='contactPersonDesignation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Designation
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Manager, Director, etc.'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='contactPersonEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                        Contact Email
                        <span className='text-red-500 text-base'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='contact@example.com'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Direct email of contact person
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='contactPersonPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                        Contact Phone
                        <span className='text-red-500 text-base'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='+92 XXX XXXXXXX'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Direct phone of contact person
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <Card className='border shadow-sm'>
            <CardHeader className='bg-gradient-to-r from-yellow-50 to-orange-50 py-4 px-5 border-b'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-yellow-600 rounded-lg shadow-sm'>
                  <Banknote className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-semibold text-gray-900'>
                    Financial Information
                  </CardTitle>
                  <CardDescription className='text-xs text-gray-600'>
                    Banking and tax details for the party
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-5 pb-4 px-5 space-y-5'>
              <div>
                <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                  <span className='h-1.5 w-1.5 rounded-full bg-blue-600'></span>
                  Tax Information
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <FormField
                    control={form.control}
                    name='ntnNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          NTN Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='National Tax Number'
                            {...field}
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Tax registration number
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='strnNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          STRN Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Sales Tax Registration Number'
                            {...field}
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Sales tax number
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                  <span className='h-1.5 w-1.5 rounded-full bg-blue-600'></span>
                  Banking Details
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <FormField
                    control={form.control}
                    name='bankName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Bank Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter bank name'
                            {...field}
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='bankAccountNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Bank Account Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Account number'
                            {...field}
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='ibanNumber'
                    render={({ field }) => (
                      <FormItem className='md:col-span-2'>
                        <FormLabel className='text-sm font-medium'>
                          IBAN Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='PK XX XXXX XXXX XXXX XXXX XXXX XXXX'
                            {...field}
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          International Bank Account Number
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                  <span className='h-1.5 w-1.5 rounded-full bg-blue-600'></span>
                  Credit Terms
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                  <FormField
                    control={form.control}
                    name='creditLimitLC'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Credit Limit (LC)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0.00'
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Local currency
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='creditLimitFC'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Credit Limit (FC)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0.00'
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Foreign currency
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='allowedCreditDays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Allowed Credit Days
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0'
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Payment period
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='paymentTerms'
                  render={({ field }) => (
                    <FormItem className='mt-5'>
                      <FormLabel className='text-sm font-medium'>
                        Payment Terms
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter detailed payment terms and conditions...'
                          className='min-h-[90px] text-sm border-gray-300 focus:border-blue-500'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Additional payment terms or conditions
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return !isNonGLParty ? (
          <Card className='border shadow-sm'>
            <CardHeader className='bg-gradient-to-r from-indigo-50 to-purple-50 py-4 px-5 border-b'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-indigo-600 rounded-lg shadow-sm'>
                  <FileText className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-semibold text-gray-900'>
                    GL Integration
                  </CardTitle>
                  <CardDescription className='text-xs text-gray-600'>
                    Link this party to your General Ledger
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-5 pb-4 px-5 space-y-5'>
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
                  <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                    <div className='flex gap-2 mb-2'>
                      <Info className='h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5' />
                      <div>
                        <h4 className='text-xs font-semibold text-blue-900'>
                          GL Account Selection
                        </h4>
                        <p className='text-xs text-blue-700 mt-0.5'>
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
                        <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                          GL Parent Account
                          <span className='text-red-500 text-base'>*</span>
                        </FormLabel>
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
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: "40px",
                                fontSize: "14px",
                                borderColor: "#d1d5db",
                              }),
                              menu: (base) => ({
                                ...base,
                                zIndex: 50,
                              }),
                            }}
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          The parent account under which this party transactions
                          will be recorded (Required)
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className='border shadow-sm'>
            <CardHeader className='bg-gradient-to-r from-indigo-50 to-purple-50 py-4 px-5 border-b'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-indigo-600 rounded-lg shadow-sm'>
                  <FileText className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-semibold text-gray-900'>
                    GL Integration
                  </CardTitle>
                  <CardDescription className='text-xs text-gray-600'>
                    Configure General Ledger linkage
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-5 pb-4 px-5'>
              <Alert className='border-yellow-200 bg-yellow-50'>
                <AlertCircle className='h-4 w-4 text-yellow-600' />
                <AlertTitle className='text-yellow-900 font-semibold text-sm'>
                  GL Integration Not Available
                </AlertTitle>
                <AlertDescription className='text-yellow-800 mt-1 text-xs'>
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
          <div className='space-y-4'>
            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-rose-50 to-pink-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-rose-600 rounded-lg shadow-sm'>
                    <Settings className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      System Settings
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      Configure system permissions and access
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-5 pb-4 px-5 space-y-5'>
                <div>
                  <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600'></span>
                    Portal Access
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
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
                  <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600'></span>
                    Operational Settings
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
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
                      <FormLabel className='text-sm font-medium'>
                        Beneficiary Name for Purchase Orders
                        <span className='text-red-500 text-base'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter beneficiary name'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Name to be used as beneficiary in purchase orders
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-violet-50 to-purple-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-violet-600 rounded-lg shadow-sm'>
                    <User className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      Assign Representatives
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      Assign employees to handle this party
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 pb-4 px-5'>
                <FormField
                  control={form.control}
                  name='salesRepId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Sales Representative
                      </FormLabel>
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
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 50,
                            }),
                          }}
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Handles sales activities
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='docsRepId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Documentation Rep
                      </FormLabel>
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
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 50,
                            }),
                          }}
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Handles documentation
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='accountsRepId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium'>
                        Accounts Representative
                      </FormLabel>
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
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 50,
                            }),
                          }}
                        />
                      </FormControl>
                      <FormDescription className='text-xs text-gray-500'>
                        Handles accounting
                      </FormDescription>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 7:
        const isFormValid =
          formValues.partyName &&
          formValues.addressLine1 &&
          formValues.phone &&
          formValues.email &&
          formValues.contactPersonEmail &&
          formValues.contactPersonPhone &&
          (!isGLLinked || (isGLLinked && formValues.glParentAccountId)) &&
          (!formValues.isNonGLParty || !isNonGLParty) &&
          formValues.benificiaryNameOfPO;

        return (
          <Card className='border shadow-sm'>
            <CardHeader className='bg-gradient-to-r from-green-50 to-emerald-50 py-4 px-5 border-b'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-600 rounded-lg shadow-sm'>
                  <CheckCircle className='h-5 w-5 text-white' />
                </div>
                <div>
                  <CardTitle className='text-lg font-semibold text-gray-900'>
                    Review & Submit
                  </CardTitle>
                  <CardDescription className='text-xs text-gray-600'>
                    Review all information before submitting
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-5 pb-4 px-5 space-y-5'>
              {!isFormValid && (
                <Alert
                  variant='destructive'
                  className='border-red-300 bg-red-50'
                >
                  <AlertCircle className='h-4 w-4 text-red-600' />
                  <AlertTitle className='text-sm font-semibold text-red-900'>
                    Incomplete Information
                  </AlertTitle>
                  <AlertDescription className='text-xs text-red-800'>
                    Please ensure all required fields are filled correctly
                    before submitting.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className='border-blue-200 bg-blue-50'>
                <Info className='h-4 w-4 text-blue-600' />
                <AlertDescription className='text-blue-900 text-xs'>
                  Review all the information below. You can go back to any step
                  to make changes.
                </AlertDescription>
              </Alert>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <Building className='h-4 w-4 text-blue-600' />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Party Name:
                      </span>
                      <span className='font-semibold text-xs text-right text-gray-900'>
                        {formValues.partyName || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Short Name:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.partyShortName || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Status:
                      </span>
                      <Badge
                        variant={formValues.isActive ? "default" : "secondary"}
                        className='text-[10px] px-2 py-0.5'
                      >
                        {formValues.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <User className='h-4 w-4 text-purple-600' />
                      Party Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Customer:
                      </span>
                      <Badge
                        variant={formValues.isCustomer ? "default" : "outline"}
                        className='text-[10px] px-2 py-0.5'
                      >
                        {formValues.isCustomer ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Vendor:
                      </span>
                      <Badge
                        variant={formValues.isVendor ? "default" : "outline"}
                        className='text-[10px] px-2 py-0.5'
                      >
                        {formValues.isVendor ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Non-GL Party:
                      </span>
                      <Badge
                        variant={
                          formValues.isNonGLParty ? "default" : "outline"
                        }
                        className='text-[10px] px-2 py-0.5'
                      >
                        {formValues.isNonGLParty ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <Contact className='h-4 w-4 text-green-600' />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Phone:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.phone || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Email:
                      </span>
                      <span className='font-semibold text-xs truncate max-w-[200px] text-gray-900'>
                        {formValues.email || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Contact Person:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.contactPersonName || "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <Banknote className='h-4 w-4 text-yellow-600' />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        NTN:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.ntnNumber || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Credit Limit (LC):
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.creditLimitLC}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Credit Days:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.allowedCreditDays}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200'>
                <h4 className='font-semibold mb-3 text-green-900 flex items-center gap-2 text-sm'>
                  <CheckCircle className='h-4 w-4' />
                  Completion Summary
                </h4>
                <ul className='space-y-2'>
                  {formSteps.slice(0, -1).map((step) => {
                    const Icon = step.icon;
                    const isCompleted =
                      completedSteps.includes(step.id) || currentStep > step.id;
                    return (
                      <li key={step.id} className='flex items-center gap-2.5'>
                        <div
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                            isCompleted
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-600"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className='h-3.5 w-3.5' />
                          ) : (
                            <Icon className='h-3.5 w-3.5' />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-xs",
                            isCompleted
                              ? "text-green-900 font-semibold"
                              : "text-gray-600"
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
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
      <div className='container mx-auto px-4 py-5 max-w-7xl'>
        {/* Header */}
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
              {type === "edit" ? "Edit Party" : "Create New Party"}
            </h1>
            <p className='text-muted-foreground mt-1 text-xs'>
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
            className='h-9 hover:bg-red-50 hover:text-red-600'
          >
            <X className='h-4 w-4 mr-1.5' />
            Cancel
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className='mb-5 border shadow-sm bg-white'>
          <CardContent className='pt-4 pb-4 px-5'>
            <div className='flex justify-between mb-2.5'>
              <div>
                <span className='text-sm font-semibold text-gray-900'>
                  Step {currentStep} of {formSteps.length}
                </span>
                <p className='text-[11px] text-gray-600 mt-0.5'>
                  {formSteps[currentStep - 1].description}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold text-blue-600'>
                  {progress}%
                </span>
                <Badge variant='secondary' className='text-[10px] px-2 py-0.5'>
                  Complete
                </Badge>
              </div>
            </div>
            <Progress value={progress} className='h-2.5' />
          </CardContent>
        </Card>

        {/* Step Navigation */}
        <div className='mb-5'>
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
                    "flex flex-col items-center p-3 rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md",
                    isCurrent &&
                      "bg-blue-600 text-white shadow-lg scale-105 border-blue-600",
                    isCompleted &&
                      !isCurrent &&
                      "bg-green-50 text-green-700 border-green-300 hover:bg-green-100",
                    !isCurrent &&
                      !isCompleted &&
                      "bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors",
                      isCurrent && "bg-white text-blue-600",
                      isCompleted && !isCurrent && "bg-green-600 text-white",
                      !isCurrent && !isCompleted && "bg-gray-100 text-gray-600"
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
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
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
            <div className='animate-in fade-in-50 duration-500 mb-6'>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <Card className='border shadow-lg bg-white mt-6'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center'>
                  <div className='min-w-[120px]'>
                    {currentStep > 1 && (
                      <Button
                        variant='outline'
                        type='button'
                        onClick={prevStep}
                        disabled={isSubmitting}
                        className='gap-2 h-10 px-5 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all'
                        size='sm'
                      >
                        <ChevronLeft className='h-4 w-4' />
                        Previous
                      </Button>
                    )}
                  </div>

                  <div className='flex items-center gap-3 px-4'>
                    <div className='text-center'>
                      <span className='text-sm text-gray-700 font-semibold block'>
                        {formSteps[currentStep - 1].fullTitle}
                      </span>
                      <span className='text-[11px] text-gray-500'>
                        Step {currentStep} of {formSteps.length}
                      </span>
                    </div>
                  </div>

                  <div className='flex gap-3 min-w-[120px] justify-end'>
                    {currentStep < formSteps.length ? (
                      <Button
                        type='button'
                        onClick={nextStep}
                        className='gap-2 h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all'
                        size='sm'
                      >
                        Next Step
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant='outline'
                          type='button'
                          onClick={() => setCurrentStep(1)}
                          disabled={isSubmitting}
                          size='sm'
                          className='h-10 px-4 border-gray-300 hover:bg-gray-50'
                        >
                          Edit Details
                        </Button>
                        <Button
                          type='submit'
                          onClick={form.handleSubmit(onSubmit)}
                          disabled={
                            isSubmitting ||
                            !formValues.partyName ||
                            !formValues.addressLine1 ||
                            !formValues.phone ||
                            !formValues.email ||
                            !formValues.contactPersonEmail ||
                            !formValues.contactPersonPhone ||
                            (isGLLinked && !formValues.glParentAccountId) ||
                            (formValues.isNonGLParty && isNonGLParty) ||
                            !formValues.benificiaryNameOfPO
                          }
                          className='gap-2 min-w-[140px] h-10 px-6 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                          size='sm'
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Save className='h-4 w-4' />
                              {type === "edit"
                                ? "Update Party"
                                : "Create Party"}
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
    </div>
  );
}
