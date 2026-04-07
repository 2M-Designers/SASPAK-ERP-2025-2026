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
  Receipt,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
import { version } from "os";

// ─── Schema ───────────────────────────────────────────────────────────────────
const partyChargeSchema = z.object({
  partyWiseChargesId: z.number().optional(),
  chargesId: z.number(),
  isActive: z.boolean().default(true),
});

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
    isBondedCarrier: z.boolean().default(false),
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
    // ── Party Charges ──
    partyCharges: z.array(partyChargeSchema).default([]),
    version: z.number().default(0),
  })
  .refine(
    (data) => {
      if (data.isCustomerVendor) return !data.isCustomer && !data.isVendor;
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
      if (data.isCustomer) return !data.isVendor && !data.isCustomerVendor;
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
      if (data.isVendor) return !data.isCustomer && !data.isCustomerVendor;
      return true;
    },
    {
      message:
        "Cannot select Customer or Customer/Vendor when Vendor is selected",
      path: ["isVendor"],
    },
  );

// ─── Charge interface ─────────────────────────────────────────────────────────
interface AvailableCharge {
  chargeId: number;
  chargeCode: string;
  chargeName: string;
  chargeType: string;
  isActive: boolean;
}

// ─── Steps config ─────────────────────────────────────────────────────────────
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
    title: "Charges",
    fullTitle: "Party Charges",
    icon: Receipt,
    description: "Assign applicable charges",
  },
  {
    id: 8,
    title: "Review",
    fullTitle: "Review & Submit",
    icon: CheckCircle,
    description: "Review and submit party details",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
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

  // Dropdown data
  const [unLocations, setUnLocations] = useState<any[]>([]);
  const [glAccounts, setGlAccounts] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [docsReps, setDocsReps] = useState<any[]>([]);
  const [accountsReps, setAccountsReps] = useState<any[]>([]);
  const [availableCharges, setAvailableCharges] = useState<AvailableCharge[]>(
    [],
  );

  const [loadingUnlocations, setLoadingUnlocations] = useState(false);
  const [loadingGlAccounts, setLoadingGlAccounts] = useState(false);
  const [loadingSalesReps, setLoadingSalesReps] = useState(false);
  const [loadingDocsReps, setLoadingDocsReps] = useState(false);
  const [loadingAccountsReps, setLoadingAccountsReps] = useState(false);
  const [loadingCharges, setLoadingCharges] = useState(false);

  // Charge search
  const [chargeSearch, setChargeSearch] = useState("");

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchUnlocations = async () => {
    setLoadingUnlocations(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}UnLocation/GetList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "UnlocationId,LocationName,Uncode,IsCountry,IsCity,IsSeaPort,IsDryPort",
            where: "IsActive == true",
            sortOn: "LocationName",
            page: "1",
            pageSize: "100",
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setUnLocations(
          data.map((l: any) => ({
            value: l.unlocationId,
            label: `${l.uncode} - ${l.locationName}`,
          })),
        );
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load UN locations",
      });
    } finally {
      setLoadingUnlocations(false);
    }
  };

  const fetchGlAccounts = async () => {
    setLoadingGlAccounts(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}GlAccount/GetList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "AccountId,AccountCode,AccountName",
            where:
              "IsHeader==true && ParentAccountId != null && IsActive == true",
            sortOn: "AccountCode",
            page: "",
            pageSize: "",
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setGlAccounts(
          data.map((a: any) => ({
            value: a.accountId,
            label: `${a.accountCode} - ${a.accountName}`,
          })),
        );
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load GL accounts",
      });
    } finally {
      setLoadingGlAccounts(false);
    }
  };

  const fetchEmployees = async (setter: any, setLoader: any, label: string) => {
    setLoader(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}Employee/GetList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "EmployeeId,FirstName,LastName,EmployeeCode",
            where: "IsActive == true",
            sortOn: "FirstName",
            page: "1",
            pageSize: "100",
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setter(
          data.map((e: any) => ({
            value: e.employeeId,
            label: `${e.employeeCode} - ${e.firstName} ${e.lastName}`,
          })),
        );
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load ${label}`,
      });
    } finally {
      setLoader(false);
    }
  };

  const fetchCharges = async () => {
    setLoadingCharges(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}ChargesMaster/GetList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "ChargeId,ChargeCode,ChargeName,ChargeType,IsActive",
            where: "IsActive == true",
            sortOn: "ChargeName",
            page: "1",
            pageSize: "500",
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableCharges(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load charges list",
      });
    } finally {
      setLoadingCharges(false);
    }
  };

  useEffect(() => {
    fetchUnlocations();
    fetchGlAccounts();
    fetchEmployees(setSalesReps, setLoadingSalesReps, "sales representatives");
    fetchEmployees(setDocsReps, setLoadingDocsReps, "docs representatives");
    fetchEmployees(
      setAccountsReps,
      setLoadingAccountsReps,
      "accounts representatives",
    );
    fetchCharges();
  }, []);

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // ── IDs ──
      partyId: defaultState?.partyId ?? undefined,
      companyId: defaultState?.companyId ?? 1,

      // ── Basic ──
      partyCode: defaultState?.partyCode ?? "",
      partyName: defaultState?.partyName ?? "",
      partyShortName: defaultState?.partyShortName ?? "",
      isActive: defaultState?.isActive ?? true,
      unLocationId: defaultState?.unlocationId ?? undefined,

      // ── Classification ──
      isGLLinked: defaultState?.isGllinked ?? false,
      isCustomer: defaultState?.isCustomer ?? false,
      isVendor: defaultState?.isVendor ?? false,
      isCustomerVendor: defaultState?.isCustomerVendor ?? false,
      isAgent: defaultState?.isAgent ?? false,
      isOverseasAgent: defaultState?.isOverseasAgent ?? false,
      isShippingLine: defaultState?.isShippingLine ?? false,
      isTransporter: defaultState?.isTransporter ?? false,
      isConsignee: defaultState?.isConsignee ?? false,
      isShipper: defaultState?.isShipper ?? false,
      isPrincipal: defaultState?.isPrincipal ?? false,
      isTerminal: defaultState?.isTerminal ?? false,
      isBondedCarrier: defaultState?.isBondedCarier ?? false, // API typo: single r
      isNonGLParty: defaultState?.isNonGlparty ?? false,
      isInSeaImport: defaultState?.isInSeaImport ?? false,
      isInSeaExport: defaultState?.isInSeaExport ?? false,
      isInAirImport: defaultState?.isInAirImport ?? false,
      isInAirExport: defaultState?.isInAirExport ?? false,
      isInLogistics: defaultState?.isInLogistics ?? false,

      // ── Contact ──
      addressLine1: defaultState?.addressLine1 ?? "",
      addressLine2: defaultState?.addressLine2 ?? "",
      postalCode: defaultState?.postalCode ?? "",
      phone: defaultState?.phone ?? "",
      fax: defaultState?.fax ?? "",
      email: defaultState?.email ?? "",
      website: defaultState?.website ?? "",
      contactPersonName: defaultState?.contactPersonName ?? "",
      contactPersonDesignation: defaultState?.contactPersonDesignation ?? "",
      contactPersonEmail: defaultState?.contactPersonEmail ?? "",
      contactPersonPhone: defaultState?.contactPersonPhone ?? "",

      // ── Financial ──
      ntnNumber: defaultState?.ntnnumber ?? "",
      strnNumber: defaultState?.strnnumber ?? "",
      bankName: defaultState?.bankName ?? "",
      bankAccountNumber: defaultState?.bankAccountNumber ?? "",
      ibanNumber: defaultState?.ibannumber ?? "",
      creditLimitLC: defaultState?.creditLimitLc
        ? Number(defaultState.creditLimitLc)
        : 0,
      creditLimitFC: defaultState?.creditLimitFc
        ? Number(defaultState.creditLimitFc)
        : 0,
      allowedCreditDays: defaultState?.allowedCreditDays
        ? Number(defaultState.allowedCreditDays)
        : 0,
      paymentTerms: defaultState?.paymentTerms ?? "",

      // ── GL ──
      glParentAccountId: defaultState?.glparentAccountId ?? undefined,

      // ── Settings ──
      trackIdAllowed: defaultState?.trackIdAllowed ?? false,
      idPasswordAllowed: defaultState?.idPasswordAllowed ?? false,
      sendEmail: defaultState?.sendEmail ?? false,
      canSeeBills: defaultState?.canSeeBills ?? false,
      canSeeLedger: defaultState?.canSeeLedger ?? false,
      isProcessOwner: defaultState?.isProcessOwner ?? false,
      clearanceByOps: defaultState?.clearanceByOps ?? false,
      clearanceByAcm: defaultState?.clearanceByAcm ?? false,
      atTradeForGDInsustrial: defaultState?.attradeForGdinsustrial ?? false,
      atTradeForGDCommercial: defaultState?.attradeForGdcommercial ?? false,
      benificiaryNameOfPO: defaultState?.benificiaryNameOfPo ?? "",

      // ── Reps ──
      salesRepId: defaultState?.salesRepId ?? undefined,
      docsRepId: defaultState?.docsRepId ?? undefined,
      accountsRepId: defaultState?.accountsRepId ?? undefined,

      // ── Charges ──
      partyCharges: (defaultState?.partyCharges ?? []).map((pc: any) => ({
        partyWiseChargesId: pc.partyWiseChargesId ?? undefined,
        chargesId: pc.chargesId,
        isActive: pc.isActive ?? true,
      })),

      version: defaultState?.version ?? 0,
    },
  });

  const isNonGLParty = form.watch("isNonGLParty");
  const isGLLinked = form.watch("isGLLinked");
  const isCustomer = form.watch("isCustomer");
  const isVendor = form.watch("isVendor");
  const isCustomerVendor = form.watch("isCustomerVendor");
  const formValues = form.watch();
  const partyCharges = form.watch("partyCharges");

  // ── Charge helpers ────────────────────────────────────────────────────────
  const selectedChargeIds = useMemo(
    () => new Set(partyCharges.map((pc) => pc.chargesId)),
    [partyCharges],
  );

  const filteredCharges = useMemo(
    () =>
      availableCharges.filter(
        (c) =>
          c.chargeName.toLowerCase().includes(chargeSearch.toLowerCase()) ||
          c.chargeCode.toLowerCase().includes(chargeSearch.toLowerCase()) ||
          (c.chargeType ?? "")
            .toLowerCase()
            .includes(chargeSearch.toLowerCase()),
      ),
    [availableCharges, chargeSearch],
  );

  const addCharge = (charge: AvailableCharge) => {
    if (selectedChargeIds.has(charge.chargeId)) return;
    const current = form.getValues("partyCharges");
    form.setValue("partyCharges", [
      ...current,
      { chargesId: charge.chargeId, isActive: true },
    ]);
  };

  const removeCharge = (chargesId: number) => {
    const current = form.getValues("partyCharges");
    form.setValue(
      "partyCharges",
      current.filter((pc) => pc.chargesId !== chargesId),
    );
  };

  const toggleChargeActive = (chargesId: number, value: boolean) => {
    const current = form.getValues("partyCharges");
    form.setValue(
      "partyCharges",
      current.map((pc) =>
        pc.chargesId === chargesId ? { ...pc, isActive: value } : pc,
      ),
    );
  };

  const getChargeName = (chargesId: number) => {
    const c = availableCharges.find((a) => a.chargeId === chargesId);
    return c ? `${c.chargeCode} – ${c.chargeName}` : `Charge #${chargesId}`;
  };

  const getChargeType = (chargesId: number) => {
    return (
      availableCharges.find((a) => a.chargeId === chargesId)?.chargeType ?? ""
    );
  };

  // ── Toggle logic ──────────────────────────────────────────────────────────
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
    } else {
      form.setValue("isGLLinked", true);
    }
  };

  const handleGLLinkedToggle = (value: boolean) => {
    if (value) form.setValue("isNonGLParty", false);
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const validateCurrentStep = async () => {
    let isValid = true;
    const errors: string[] = [];
    switch (currentStep) {
      case 1:
        if (!formValues.partyName?.trim()) {
          errors.push("Party Name is required");
          isValid = false;
        }
        break;
      case 2:
        if (
          !formValues.isCustomer &&
          !formValues.isVendor &&
          !formValues.isCustomerVendor
        ) {
          errors.push(
            "Please select at least one: Customer, Vendor, or Customer/Vendor",
          );
          isValid = false;
        }
        break;
      case 3:
        if (!formValues.addressLine1?.trim()) {
          errors.push("Address Line 1 is required");
          isValid = false;
        }
        if (!formValues.phone?.trim()) {
          errors.push("Phone is required");
          isValid = false;
        }
        if (!formValues.email?.trim()) {
          errors.push("Email is required");
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
          errors.push("Invalid email address");
          isValid = false;
        }
        if (!formValues.contactPersonEmail?.trim()) {
          errors.push("Contact Person Email is required");
          isValid = false;
        } else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.contactPersonEmail)
        ) {
          errors.push("Invalid contact person email");
          isValid = false;
        }
        if (!formValues.contactPersonPhone?.trim()) {
          errors.push("Contact Person Phone is required");
          isValid = false;
        }
        break;
      case 5:
        if (
          !formValues.isNonGLParty &&
          formValues.isGLLinked &&
          !formValues.glParentAccountId
        ) {
          errors.push(
            "GL Parent Account is required when GL Linkage is enabled",
          );
          isValid = false;
        }
        break;
      case 6:
        if (!formValues.benificiaryNameOfPO?.trim()) {
          errors.push("Beneficiary Name of PO is required");
          isValid = false;
        }
        break;
      // Step 7 (Charges) has no mandatory fields
    }
    if (!isValid)
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: errors.join(", "),
      });
    return isValid;
  };

  // ── Per-step error map (used by Review + step nav indicator) ────────────
  const getStepErrors = (): Record<number, string[]> => {
    const v = form.getValues();
    const errs: Record<number, string[]> = {};

    const add = (step: number, msg: string) => {
      if (!errs[step]) errs[step] = [];
      errs[step].push(msg);
    };

    // Step 1
    if (!v.partyName?.trim()) add(1, "Party Name is required");

    // Step 2
    if (!v.isCustomer && !v.isVendor && !v.isCustomerVendor)
      add(2, "Select at least one: Customer, Vendor, or Customer/Vendor");

    // Step 3
    if (!v.addressLine1?.trim()) add(3, "Address Line 1 is required");
    if (!v.phone?.trim()) add(3, "Phone is required");
    if (!v.email?.trim()) add(3, "Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
      add(3, "Invalid email address");
    if (!v.contactPersonEmail?.trim())
      add(3, "Contact Person Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contactPersonEmail))
      add(3, "Invalid contact person email");
    if (!v.contactPersonPhone?.trim())
      add(3, "Contact Person Phone is required");

    // Step 4 — no mandatory fields

    // Step 5
    if (!v.isNonGLParty && v.isGLLinked && !v.glParentAccountId)
      add(5, "GL Parent Account is required when GL Linkage is enabled");

    // Step 6
    if (!v.benificiaryNameOfPO?.trim())
      add(6, "Beneficiary Name of PO is required");

    return errs;
  };

  const nextStep = async () => {
    if (await validateCurrentStep()) {
      if (!completedSteps.includes(currentStep))
        setCompletedSteps([...completedSteps, currentStep]);
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const isUpdate = type === "edit";

      // Build payload with exact API field names (from the swagger schema)
      // Note: several field names differ from the form's internal camelCase
      const payload: any = {
        // Basic
        partyCode: values.partyCode || "",
        partyName: values.partyName,
        partyShortName: values.partyShortName || "",
        companyId: values.companyId,
        isActive: values.isActive,

        // Location
        unlocationId: values.unLocationId ?? null,
        addressLine1: values.addressLine1 || "",
        addressLine2: values.addressLine2 || "",
        postalCode: values.postalCode || "",

        // Contact
        phone: values.phone || "",
        fax: values.fax || "",
        email: values.email || "",
        website: values.website || "",
        contactPersonName: values.contactPersonName || "",
        contactPersonDesignation: values.contactPersonDesignation || "",
        contactPersonEmail: values.contactPersonEmail || "",
        contactPersonPhone: values.contactPersonPhone || "",

        // Classification — API uses lowercase 'l' in GL-related flags
        isGllinked: values.isGLLinked,
        isCustomer: values.isCustomer,
        isVendor: values.isVendor,
        isCustomerVendor: values.isCustomerVendor,
        isAgent: values.isAgent,
        isOverseasAgent: values.isOverseasAgent,
        isShippingLine: values.isShippingLine,
        isTransporter: values.isTransporter,
        isConsignee: values.isConsignee,
        isShipper: values.isShipper,
        isPrincipal: values.isPrincipal,
        isTerminal: values.isTerminal,
        isBondedCarier: values.isBondedCarrier, // API has single 'r' (typo in schema)
        isNonGlparty: values.isNonGLParty,
        isInSeaImport: values.isInSeaImport,
        isInSeaExport: values.isInSeaExport,
        isInAirImport: values.isInAirImport,
        isInAirExport: values.isInAirExport,
        isInLogistics: values.isInLogistics,

        // Financial — API uses lowercase acronyms (ntnnumber, ibannumber, creditLimitLc, etc.)
        ntnnumber: values.ntnNumber || "",
        strnnumber: values.strnNumber || "",
        bankName: values.bankName || "",
        bankAccountNumber: values.bankAccountNumber || "",
        ibannumber: values.ibanNumber || "",
        creditLimitLc: values.creditLimitLC ?? 0,
        creditLimitFc: values.creditLimitFC ?? 0,
        allowedCreditDays: values.allowedCreditDays ?? 0,
        paymentTerms: values.paymentTerms || "",

        // GL
        glparentAccountId: values.glParentAccountId ?? null,

        // Portal & operational settings
        trackIdAllowed: values.trackIdAllowed,
        idPasswordAllowed: values.idPasswordAllowed,
        sendEmail: values.sendEmail,
        canSeeBills: values.canSeeBills,
        canSeeLedger: values.canSeeLedger,
        isProcessOwner: values.isProcessOwner,
        clearanceByOps: values.clearanceByOps,
        clearanceByAcm: values.clearanceByAcm,
        attradeForGdinsustrial: values.atTradeForGDInsustrial,
        attradeForGdcommercial: values.atTradeForGDCommercial,
        benificiaryNameOfPo: values.benificiaryNameOfPO || "",

        // Representatives
        salesRepId: values.salesRepId ?? null,
        docsRepId: values.docsRepId ?? null,
        accountsRepId: values.accountsRepId ?? null,

        // Charges
        partyCharges: values.partyCharges.map((pc) => {
          const item: any = { chargesId: pc.chargesId, isActive: pc.isActive };
          if (isUpdate && pc.partyWiseChargesId) {
            item.partyWiseChargesId = pc.partyWiseChargesId;
            item.partyId = values.partyId;
          }
          return item;
        }),
      };

      // For edit include partyId
      if (isUpdate) payload.partyId = values.partyId;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl)
        throw new Error("Configuration error: BASE_URL is not defined");

      const response = await fetch(`${baseUrl}Party`, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const e = await response.json();
          if (e?.errors)
            errMsg = (Object.values(e.errors).flat() as string[]).join("\n");
          else errMsg = e?.message || e?.title || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      toast({
        title: "Success!",
        description: `Party ${type === "edit" ? "updated" : "created"} successfully`,
      });
      handleAddEdit(result);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Submission failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── ToggleField ───────────────────────────────────────────────────────────
  const ToggleField = ({
    name,
    label,
    description = "",
    disabled = false,
    onChange,
    highlight = false,
  }: {
    name: keyof z.infer<typeof formSchema>;
    label: string;
    description?: string;
    disabled?: boolean;
    onChange?: (v: boolean) => void;
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
            disabled && "opacity-50 cursor-not-allowed",
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
              onCheckedChange={(v) => {
                field.onChange(v);
                onChange?.(v);
              }}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );

  const progress = Math.round(
    ((currentStep - 1) / (formSteps.length - 1)) * 100,
  );

  // ── Step rendering ────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      // ── STEP 1: Basic Info ──────────────────────────────────────────────
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
                      Party Code{" "}
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
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='partyName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                      Party Name{" "}
                      <span className='text-red-500 text-base'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter full party name'
                        {...field}
                        value={field.value ?? ""}
                        className='font-medium h-10 text-sm border-gray-300 focus:border-blue-500'
                      />
                    </FormControl>
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
                        value={field.value ?? ""}
                        className='h-10 text-sm border-gray-300'
                      />
                    </FormControl>
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
                        value={unLocations.find((o) => o.value === field.value)}
                        onChange={(v) => field.onChange(v?.value)}
                        placeholder={
                          loadingUnlocations
                            ? "Loading..."
                            : "Select UN Location"
                        }
                        isLoading={loadingUnlocations}
                        isDisabled={loadingUnlocations}
                        styles={{
                          control: (b) => ({
                            ...b,
                            minHeight: "40px",
                            fontSize: "14px",
                            borderColor: "#d1d5db",
                          }),
                          menu: (b) => ({ ...b, zIndex: 50 }),
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className='md:col-span-2'>
                <ToggleField
                  name='isActive'
                  label='Active Party'
                  description='Enable to make this party active and visible in the system'
                  highlight
                />
              </div>
            </CardContent>
          </Card>
        );

      // ── STEP 2: Classification ──────────────────────────────────────────
      case 2:
        return (
          <>
            {(isCustomer && (isVendor || isCustomerVendor)) ||
            (isVendor && (isCustomer || isCustomerVendor)) ||
            (isCustomerVendor && (isCustomer || isVendor)) ? (
              <Alert
                variant='destructive'
                className='mb-4 border-red-300 bg-red-50'
              >
                <AlertCircle className='h-4 w-4 text-red-600' />
                <AlertTitle className='font-semibold text-sm text-red-900'>
                  Invalid Selection
                </AlertTitle>
                <AlertDescription className='mt-1 text-xs text-red-800'>
                  A party cannot be both Customer and Vendor simultaneously.
                </AlertDescription>
              </Alert>
            ) : null}
            {!isCustomer && !isVendor && !isCustomerVendor ? (
              <Alert
                variant='destructive'
                className='mb-4 border-orange-300 bg-orange-50'
              >
                <AlertCircle className='h-4 w-4 text-orange-600' />
                <AlertTitle className='font-semibold text-sm text-orange-900'>
                  Selection Required
                </AlertTitle>
                <AlertDescription className='mt-1 text-xs text-orange-800'>
                  Please select at least one: Customer, Vendor, or
                  Customer/Vendor.
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
                      Define the type and operational scope
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-5 pb-4 px-5 space-y-5'>
                <div className='bg-amber-50 p-4 rounded-lg border border-amber-200'>
                  <div className='flex gap-2 mb-3'>
                    <Info className='h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <h4 className='text-xs font-semibold text-amber-900'>
                        Customer/Vendor Relationship{" "}
                        <span className='text-red-500 text-sm'>*</span>
                      </h4>
                      <p className='text-xs text-amber-700 mt-0.5'>
                        Select at least one (required)
                      </p>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mt-3'>
                    <ToggleField
                      name='isCustomer'
                      label='Customer'
                      description='Party purchases from us'
                      disabled={isVendor || isCustomerVendor}
                      onChange={(v) =>
                        handleCustomerVendorToggle("isCustomer", v)
                      }
                      highlight={isCustomer}
                    />
                    <ToggleField
                      name='isVendor'
                      label='Vendor'
                      description='We purchase from party'
                      disabled={isCustomer || isCustomerVendor}
                      onChange={(v) =>
                        handleCustomerVendorToggle("isVendor", v)
                      }
                      highlight={isVendor}
                    />
                    <ToggleField
                      name='isCustomerVendor'
                      label='Customer/Vendor'
                      description='Both relationships'
                      disabled={isCustomer || isVendor}
                      onChange={(v) =>
                        handleCustomerVendorToggle("isCustomerVendor", v)
                      }
                      highlight={isCustomerVendor}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className='text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    Party Roles
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                    <ToggleField
                      name='isAgent'
                      label='Local Agent'
                      description='Acts as intermediary'
                    />
                    <ToggleField
                      name='isOverseasAgent'
                      label='Origin Agent'
                      description='International representative'
                    />
                    <ToggleField
                      name='isShippingLine'
                      label='Carrier'
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
                      name='isTerminal'
                      label='Terminal'
                      description='Terminal operator'
                    />
                    <ToggleField
                      name='isBondedCarrier'
                      label='Bonded Carrier'
                      description='Bonded carrier operator'
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
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
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

      // ── STEP 3: Contact ─────────────────────────────────────────────────
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
                      General contact information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 pb-4 px-5'>
                {[
                  {
                    name: "addressLine1" as const,
                    label: "Address Line 1",
                    req: true,
                    placeholder: "Street address, building name",
                  },
                  {
                    name: "addressLine2" as const,
                    label: "Address Line 2",
                    req: false,
                    placeholder: "Apartment, suite, unit, floor",
                  },
                  {
                    name: "postalCode" as const,
                    label: "Postal Code",
                    req: false,
                    placeholder: "ZIP/Postal code",
                  },
                  {
                    name: "phone" as const,
                    label: "Phone",
                    req: true,
                    placeholder: "+92 XXX XXXXXXX",
                  },
                  {
                    name: "fax" as const,
                    label: "Fax",
                    req: false,
                    placeholder: "Fax number",
                  },
                  {
                    name: "email" as const,
                    label: "Email",
                    req: true,
                    placeholder: "company@example.com",
                    type: "email",
                  },
                  {
                    name: "website" as const,
                    label: "Website",
                    req: false,
                    placeholder: "https://www.example.com",
                  },
                ].map(({ name, label, req, placeholder, type }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                          {label}
                          {req && (
                            <span className='text-red-500 text-base'>*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={type || "text"}
                            placeholder={placeholder}
                            {...field}
                            value={field.value ?? ""}
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                ))}
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
                      Primary point of contact
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 pb-4 px-5'>
                {[
                  {
                    name: "contactPersonName" as const,
                    label: "Full Name",
                    req: false,
                    placeholder: "John Doe",
                  },
                  {
                    name: "contactPersonDesignation" as const,
                    label: "Designation",
                    req: false,
                    placeholder: "Manager, Director…",
                  },
                  {
                    name: "contactPersonEmail" as const,
                    label: "Contact Email",
                    req: true,
                    placeholder: "contact@example.com",
                    type: "email",
                  },
                  {
                    name: "contactPersonPhone" as const,
                    label: "Contact Phone",
                    req: true,
                    placeholder: "+92 XXX XXXXXXX",
                  },
                ].map(({ name, label, req, placeholder, type }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                          {label}
                          {req && (
                            <span className='text-red-500 text-base'>*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={type || "text"}
                            placeholder={placeholder}
                            {...field}
                            value={field.value ?? ""}
                            className='h-10 text-sm border-gray-300 focus:border-blue-500'
                          />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        );

      // ── STEP 4: Financial ───────────────────────────────────────────────
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
                    Banking and tax details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-5 pb-4 px-5 space-y-5'>
              <div>
                <h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
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
                            value={field.value ?? ""}
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
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
                            value={field.value ?? ""}
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
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
                            value={field.value ?? ""}
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='bankAccountNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Account Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Account number'
                            {...field}
                            value={field.value ?? ""}
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
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
                            value={field.value ?? ""}
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Separator />
              <div>
                <h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
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
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Local currency
                        </FormDescription>
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
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Foreign currency
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='allowedCreditDays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Credit Days
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0'
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className='h-10 text-sm border-gray-300'
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Payment period
                        </FormDescription>
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
                          className='min-h-[90px] text-sm border-gray-300 resize-none'
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      // ── STEP 5: GL Setup ────────────────────────────────────────────────
      case 5:
        return isNonGLParty ? (
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
                  This party is marked as a <strong>Non-GL Party</strong>. To
                  enable GL integration, go back to Step 2 and turn off Non-GL
                  Party.
                </AlertDescription>
              </Alert>
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
                    Link this party to your General Ledger
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-5 pb-4 px-5 space-y-5'>
              <ToggleField
                name='isGLLinked'
                label='Enable GL Linkage'
                description='Connect this party to your General Ledger for automatic accounting'
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
                        <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                          GL Parent Account{" "}
                          <span className='text-red-500 text-base'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            options={glAccounts}
                            value={glAccounts.find(
                              (o) => o.value === field.value,
                            )}
                            onChange={(v) => field.onChange(v?.value)}
                            placeholder={
                              loadingGlAccounts
                                ? "Loading..."
                                : "Select GL Account"
                            }
                            isLoading={loadingGlAccounts}
                            isDisabled={loadingGlAccounts}
                            styles={{
                              control: (b) => ({
                                ...b,
                                minHeight: "40px",
                                fontSize: "14px",
                                borderColor: "#d1d5db",
                              }),
                              menu: (b) => ({ ...b, zIndex: 50 }),
                            }}
                          />
                        </FormControl>
                        <FormDescription className='text-xs text-gray-500'>
                          Parent account under which this party's transactions
                          will be recorded
                        </FormDescription>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>
        );

      // ── STEP 6: Settings ────────────────────────────────────────────────
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
                  <h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
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
                  <h4 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                    <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
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
                      label='Clearance By Ops'
                      description='Ops team clearance'
                    />
                    <ToggleField
                      name='clearanceByAcm'
                      label='Clearance By ACM'
                      description='ACM team clearance'
                    />
                    <ToggleField
                      name='atTradeForGDInsustrial'
                      label='AT Trade – Industrial'
                      description='Industrial GD trade'
                    />
                    <ToggleField
                      name='atTradeForGDCommercial'
                      label='AT Trade – Commercial'
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
                        Beneficiary Name for Purchase Orders{" "}
                        <span className='text-red-500'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter beneficiary name'
                          {...field}
                          value={field.value ?? ""}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Representatives */}
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
                {[
                  {
                    name: "salesRepId" as const,
                    label: "Sales Representative",
                    options: salesReps,
                    loading: loadingSalesReps,
                    placeholder: "Select Sales Rep",
                  },
                  {
                    name: "docsRepId" as const,
                    label: "Documentation Rep",
                    options: docsReps,
                    loading: loadingDocsReps,
                    placeholder: "Select Docs Rep",
                  },
                  {
                    name: "accountsRepId" as const,
                    label: "Accounts Representative",
                    options: accountsReps,
                    loading: loadingAccountsReps,
                    placeholder: "Select Accounts Rep",
                  },
                ].map(({ name, label, options, loading, placeholder }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          {label}
                        </FormLabel>
                        <FormControl>
                          <Select
                            options={options}
                            value={options.find(
                              (o: any) => o.value === field.value,
                            )}
                            onChange={(v: any) => field.onChange(v?.value)}
                            placeholder={loading ? "Loading..." : placeholder}
                            isLoading={loading}
                            isDisabled={loading}
                            styles={{
                              control: (b) => ({
                                ...b,
                                minHeight: "40px",
                                fontSize: "14px",
                                borderColor: "#d1d5db",
                              }),
                              menu: (b) => ({ ...b, zIndex: 50 }),
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        );

      // ── STEP 7: Party Charges ────────────────────────────────────────────
      case 7:
        return (
          <div className='space-y-4'>
            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-emerald-50 to-teal-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-emerald-600 rounded-lg shadow-sm'>
                    <Receipt className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      Party Charges
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      Select the charges applicable to this party
                    </CardDescription>
                  </div>
                </div>
                {/* Summary badge */}
                {partyCharges.length > 0 && (
                  <div className='mt-3'>
                    <Badge className='bg-emerald-100 text-emerald-800 border-emerald-300 text-xs'>
                      {partyCharges.length} charge
                      {partyCharges.length !== 1 ? "s" : ""} selected
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className='pt-5 pb-4 px-5'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                  {/* ── Left: Available charges ── */}
                  <div className='flex flex-col gap-3'>
                    <div className='flex items-center justify-between'>
                      <h4 className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                        <span className='h-1.5 w-1.5 rounded-full bg-emerald-600' />
                        Available Charges
                      </h4>
                      {loadingCharges && (
                        <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
                      )}
                    </div>

                    {/* Search */}
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                      <Input
                        placeholder='Search by name, code or type…'
                        value={chargeSearch}
                        onChange={(e) => setChargeSearch(e.target.value)}
                        className='pl-9 h-9 text-sm border-gray-200 focus:border-emerald-400'
                      />
                    </div>

                    {/* Charge list */}
                    <div className='border rounded-xl overflow-hidden'>
                      {loadingCharges ? (
                        <div className='flex items-center justify-center py-10 text-slate-400 text-sm gap-2'>
                          <Loader2 className='h-4 w-4 animate-spin' /> Loading
                          charges…
                        </div>
                      ) : filteredCharges.length === 0 ? (
                        <div className='py-10 text-center text-sm text-slate-400'>
                          {chargeSearch
                            ? "No charges match your search"
                            : "No charges available"}
                        </div>
                      ) : (
                        <div className='max-h-[360px] overflow-y-auto divide-y divide-slate-100'>
                          {filteredCharges.map((charge) => {
                            const alreadyAdded = selectedChargeIds.has(
                              charge.chargeId,
                            );
                            return (
                              <div
                                key={charge.chargeId}
                                className={cn(
                                  "flex items-center justify-between px-4 py-3 transition-colors",
                                  alreadyAdded
                                    ? "bg-emerald-50"
                                    : "hover:bg-slate-50",
                                )}
                              >
                                <div className='min-w-0'>
                                  <p className='text-sm font-medium text-slate-800 truncate'>
                                    {charge.chargeName}
                                  </p>
                                  <p className='text-xs text-slate-400 mt-0.5'>
                                    {charge.chargeCode}
                                    {charge.chargeType
                                      ? ` · ${charge.chargeType}`
                                      : ""}
                                  </p>
                                </div>
                                <button
                                  type='button'
                                  onClick={() =>
                                    !alreadyAdded && addCharge(charge)
                                  }
                                  disabled={alreadyAdded}
                                  className={cn(
                                    "ml-3 flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    alreadyAdded
                                      ? "bg-emerald-100 text-emerald-700 cursor-default"
                                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow",
                                  )}
                                >
                                  {alreadyAdded ? (
                                    <>
                                      <CheckCircle className='h-3.5 w-3.5' />{" "}
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className='h-3.5 w-3.5' /> Add
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Right: Selected charges ── */}
                  <div className='flex flex-col gap-3'>
                    <h4 className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                      <span className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                      Selected Charges
                    </h4>

                    {partyCharges.length === 0 ? (
                      <div className='border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center py-14 text-slate-400'>
                        <Receipt className='h-8 w-8 mb-2 opacity-40' />
                        <p className='text-sm'>No charges selected yet</p>
                        <p className='text-xs mt-1'>
                          Add charges from the list on the left
                        </p>
                      </div>
                    ) : (
                      <div className='border rounded-xl overflow-hidden'>
                        <div className='max-h-[360px] overflow-y-auto divide-y divide-slate-100'>
                          {partyCharges.map((pc, idx) => (
                            <div
                              key={pc.chargesId}
                              className='flex items-center gap-3 px-4 py-3'
                            >
                              {/* Index */}
                              <span className='flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-medium'>
                                {idx + 1}
                              </span>

                              {/* Name + type */}
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium text-slate-800 truncate'>
                                  {getChargeName(pc.chargesId)}
                                </p>
                                {getChargeType(pc.chargesId) && (
                                  <p className='text-xs text-slate-400 mt-0.5'>
                                    {getChargeType(pc.chargesId)}
                                  </p>
                                )}
                              </div>

                              {/* Active toggle */}
                              <div className='flex items-center gap-1.5 flex-shrink-0'>
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    pc.isActive
                                      ? "text-emerald-600"
                                      : "text-slate-400",
                                  )}
                                >
                                  {pc.isActive ? "Active" : "Inactive"}
                                </span>
                                <Switch
                                  checked={pc.isActive}
                                  onCheckedChange={(v) =>
                                    toggleChargeActive(pc.chargesId, v)
                                  }
                                  className='scale-90'
                                />
                              </div>

                              {/* Remove */}
                              <button
                                type='button'
                                onClick={() => removeCharge(pc.chargesId)}
                                className='flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                                title='Remove charge'
                              >
                                <Trash2 className='h-4 w-4' />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Footer summary */}
                        <div className='border-t bg-slate-50 px-4 py-2.5 flex items-center justify-between'>
                          <span className='text-xs text-slate-500'>
                            {partyCharges.filter((pc) => pc.isActive).length}{" "}
                            active / {partyCharges.length} total
                          </span>
                          <button
                            type='button'
                            onClick={() => form.setValue("partyCharges", [])}
                            className='text-xs text-red-500 hover:text-red-700 font-medium'
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className='border-blue-200 bg-blue-50'>
              <Info className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-blue-800 text-xs'>
                Party charges are optional. You can add, remove, or toggle
                active status for each charge. These charges will be available
                for use in shipment jobs for this party.
              </AlertDescription>
            </Alert>
          </div>
        );

      // ── STEP 8: Review ──────────────────────────────────────────────────
      case 8: {
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
              {/* Per-step error breakdown — far more useful than a generic message */}
              {(() => {
                const stepErrs = getStepErrors();
                const totalErrors = Object.values(stepErrs).flat().length;
                if (totalErrors === 0)
                  return (
                    <Alert className='border-green-200 bg-green-50'>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <AlertTitle className='text-sm font-semibold text-green-900'>
                        All sections complete
                      </AlertTitle>
                      <AlertDescription className='text-green-800 text-xs'>
                        Everything looks good — you can submit the form.
                      </AlertDescription>
                    </Alert>
                  );
                return (
                  <Alert
                    variant='destructive'
                    className='border-red-300 bg-red-50'
                  >
                    <AlertCircle className='h-4 w-4 text-red-600' />
                    <AlertTitle className='text-sm font-semibold text-red-900'>
                      {totalErrors} required field{totalErrors !== 1 ? "s" : ""}{" "}
                      still missing
                    </AlertTitle>
                    <AlertDescription className='text-red-800 text-xs mt-2 space-y-2'>
                      {Object.entries(stepErrs).map(([stepId, msgs]) => {
                        const step = formSteps.find(
                          (s) => s.id === Number(stepId),
                        );
                        return (
                          <div key={stepId} className='flex flex-col gap-0.5'>
                            <button
                              type='button'
                              onClick={() => goToStep(Number(stepId))}
                              className='font-semibold text-red-900 underline underline-offset-2 text-left hover:text-red-700 w-fit'
                            >
                              Step {stepId}: {step?.fullTitle}
                            </button>
                            <ul className='ml-3 list-disc space-y-0.5'>
                              {(msgs as string[]).map((msg) => (
                                <li key={msg}>{msg}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </AlertDescription>
                  </Alert>
                );
              })()}
              <Alert className='border-blue-200 bg-blue-50'>
                <Info className='h-4 w-4 text-blue-600' />
                <AlertDescription className='text-blue-900 text-xs'>
                  Click any step name above (or the step pills at the top) to
                  jump directly to the section that needs attention.
                </AlertDescription>
              </Alert>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Basic */}
                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <Building className='h-4 w-4 text-blue-600' />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Party Name:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.partyName || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Short Name:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.partyShortName || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Status:
                      </span>
                      <Badge
                        variant={formValues.isActive ? "default" : "secondary"}
                        className='text-[10px]'
                      >
                        {formValues.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Party type */}
                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <User className='h-4 w-4 text-purple-600' />
                      Party Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Customer:
                      </span>
                      <Badge
                        variant={formValues.isCustomer ? "default" : "outline"}
                        className='text-[10px]'
                      >
                        {formValues.isCustomer ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Vendor:
                      </span>
                      <Badge
                        variant={formValues.isVendor ? "default" : "outline"}
                        className='text-[10px]'
                      >
                        {formValues.isVendor ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Non-GL Party:
                      </span>
                      <Badge
                        variant={
                          formValues.isNonGLParty ? "default" : "outline"
                        }
                        className='text-[10px]'
                      >
                        {formValues.isNonGLParty ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact */}
                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <Contact className='h-4 w-4 text-green-600' />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Phone:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.phone || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Email:
                      </span>
                      <span className='font-semibold text-xs truncate max-w-[200px] text-gray-900'>
                        {formValues.email || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Contact Person:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.contactPersonName || "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial */}
                <Card className='border shadow-sm bg-white'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <Banknote className='h-4 w-4 text-yellow-600' />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2.5 pb-3 px-4 pt-3'>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        NTN:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.ntnNumber || "—"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Credit Limit (LC):
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.creditLimitLC}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-gray-600 font-medium'>
                        Credit Days:
                      </span>
                      <span className='font-semibold text-xs text-gray-900'>
                        {formValues.allowedCreditDays}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Charges summary */}
                <Card className='border shadow-sm bg-white md:col-span-2'>
                  <CardHeader className='pb-2 pt-3 px-4 bg-gray-50 border-b'>
                    <CardTitle className='text-sm flex items-center gap-2 font-semibold text-gray-900'>
                      <Receipt className='h-4 w-4 text-emerald-600' />
                      Party Charges ({partyCharges.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pb-3 px-4 pt-3'>
                    {partyCharges.length === 0 ? (
                      <p className='text-xs text-gray-400 italic'>
                        No charges selected
                      </p>
                    ) : (
                      <div className='flex flex-wrap gap-2'>
                        {partyCharges.map((pc) => (
                          <Badge
                            key={pc.chargesId}
                            variant='outline'
                            className={cn(
                              "text-[11px] px-2 py-0.5 gap-1",
                              pc.isActive
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                : "border-gray-200 text-gray-400",
                            )}
                          >
                            {getChargeName(pc.chargesId)}
                            {!pc.isActive && (
                              <span className='ml-1 text-[9px] text-gray-400'>
                                (inactive)
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Step completion summary — shows green tick OR red errors per step */}
              {(() => {
                const stepErrs = getStepErrors();
                return (
                  <div className='rounded-xl border overflow-hidden'>
                    <div className='bg-slate-50 border-b px-4 py-2.5'>
                      <h4 className='font-semibold text-slate-800 flex items-center gap-2 text-sm'>
                        <CheckCircle className='h-4 w-4 text-slate-500' />
                        Section Checklist
                      </h4>
                    </div>
                    <ul className='divide-y divide-slate-100'>
                      {formSteps.slice(0, -1).map((step) => {
                        const Icon = step.icon;
                        const errs = stepErrs[step.id] ?? [];
                        const hasError = errs.length > 0;
                        return (
                          <li key={step.id} className='px-4 py-3'>
                            <div className='flex items-start gap-3'>
                              {/* Status icon */}
                              <div
                                className={cn(
                                  "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mt-0.5",
                                  hasError
                                    ? "bg-red-100 text-red-600"
                                    : "bg-green-100 text-green-700",
                                )}
                              >
                                {hasError ? (
                                  <AlertCircle className='h-4 w-4' />
                                ) : (
                                  <CheckCircle className='h-4 w-4' />
                                )}
                              </div>

                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between gap-2'>
                                  <span
                                    className={cn(
                                      "text-sm font-semibold",
                                      hasError
                                        ? "text-red-700"
                                        : "text-green-800",
                                    )}
                                  >
                                    Step {step.id}: {step.fullTitle}
                                  </span>
                                  {hasError && (
                                    <button
                                      type='button'
                                      onClick={() => goToStep(step.id)}
                                      className='flex-shrink-0 text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md transition-colors'
                                    >
                                      Fix →
                                    </button>
                                  )}
                                </div>

                                {hasError && (
                                  <ul className='mt-1.5 space-y-0.5'>
                                    {errs.map((err) => (
                                      <li
                                        key={err}
                                        className='flex items-start gap-1.5 text-xs text-red-600'
                                      >
                                        <span className='mt-0.5 flex-shrink-0'>
                                          •
                                        </span>
                                        {err}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        );
      }

      default:
        return null;
    }
  };

  // ── Main render ───────────────────────────────────────────────────────────
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
            <X className='h-4 w-4 mr-1.5' /> Cancel
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

        {/* Step Navigation — 8 steps, wrap gracefully */}
        <div className='mb-5'>
          <div className='grid grid-cols-4 md:grid-cols-8 gap-2'>
            {formSteps.map((step) => {
              const Icon = step.icon;
              const stepErrs = getStepErrors();
              const isCompleted =
                completedSteps.includes(step.id) || currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const hasStepError =
                isCompleted &&
                !isCurrent &&
                (stepErrs[step.id]?.length ?? 0) > 0;
              return (
                <button
                  key={step.id}
                  type='button'
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "relative flex flex-col items-center p-2.5 rounded-xl transition-all duration-200 border-2 shadow-sm hover:shadow-md",
                    isCurrent &&
                      "bg-blue-600 text-white shadow-lg scale-105 border-blue-600",
                    isCompleted &&
                      !isCurrent &&
                      !hasStepError &&
                      "bg-green-50 text-green-700 border-green-300 hover:bg-green-100",
                    isCompleted &&
                      !isCurrent &&
                      hasStepError &&
                      "bg-red-50 text-red-700 border-red-300 hover:bg-red-100",
                    !isCurrent &&
                      !isCompleted &&
                      "bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300",
                  )}
                >
                  {/* Error dot */}
                  {hasStepError && !isCurrent && (
                    <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white' />
                  )}
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full mb-1.5 transition-colors",
                      isCurrent && "bg-white text-blue-600",
                      isCompleted &&
                        !isCurrent &&
                        !hasStepError &&
                        "bg-green-600 text-white",
                      isCompleted &&
                        !isCurrent &&
                        hasStepError &&
                        "bg-red-500 text-white",
                      !isCurrent && !isCompleted && "bg-gray-100 text-gray-600",
                    )}
                  >
                    {isCompleted && !isCurrent && !hasStepError ? (
                      <CheckCircle className='h-4 w-4' />
                    ) : isCompleted && !isCurrent && hasStepError ? (
                      <AlertCircle className='h-4 w-4' />
                    ) : (
                      <Icon className='h-4 w-4' />
                    )}
                  </div>
                  <span className='text-[9px] text-center font-semibold leading-tight'>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {/* Hidden fields */}
            <FormField
              control={form.control}
              name='partyId'
              render={({ field }) => (
                <FormItem className='hidden'>
                  <FormControl>
                    <Input type='hidden' {...field} value={field.value ?? ""} />
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
                    <Input type='hidden' {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className='animate-in fade-in-50 duration-500 mb-6'>
              {renderStepContent()}
            </div>

            {/* Navigation */}
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
                        className='gap-2 h-10 px-5 border-gray-300 hover:bg-gray-50 transition-all'
                        size='sm'
                      >
                        <ChevronLeft className='h-4 w-4' /> Previous
                      </Button>
                    )}
                  </div>

                  <div className='flex items-center gap-3 px-4 text-center'>
                    <div>
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
                        className='gap-2 h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all'
                        size='sm'
                      >
                        Next Step <ChevronRight className='h-4 w-4' />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant='outline'
                          type='button'
                          onClick={() => setCurrentStep(1)}
                          disabled={isSubmitting}
                          size='sm'
                          className='h-10 px-4 border-gray-300'
                        >
                          Edit Details
                        </Button>
                        <Button
                          type='submit'
                          onClick={form.handleSubmit(onSubmit)}
                          disabled={
                            isSubmitting ||
                            Object.keys(getStepErrors()).length > 0
                          }
                          className='gap-2 min-w-[140px] h-10 px-6 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all disabled:opacity-50'
                          size='sm'
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Submitting…
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
