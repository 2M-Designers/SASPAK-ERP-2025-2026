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
import { Loader2, Plus, Search, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// ─── Validation Schema ──────────────────────────────────────────────────────
const formSchema = z.object({
  chargeId: z.number().optional(),
  companyId: z.number().optional(),
  chargeCode: z.string().min(1, "Charge Code is required"),
  chargeName: z.string().min(1, "Charge Name is required"),
  chargeType: z.string().min(1, "Charge Type is required"),
  chargeGroup: z.string().min(1, "Charge Group is required"),
  revenueGLAccountId: z.number().min(1, "Revenue GL Account is required"),
  costGLAccountId: z.number().min(1, "Cost GL Account is required"),
  isTaxable: z.boolean().default(false),
  defaultTaxPercentage: z
    .union([
      z
        .number()
        .min(0, "Tax percentage cannot be negative")
        .max(100, "Tax percentage cannot exceed 100"),
      z.nan(),
    ])
    .optional()
    .transform((val) => (isNaN(val as number) ? 0 : val)),
  isReimbursable: z.boolean().default(false),
  paymentMode: z.string().min(1, "Payment Mode is required"),
  calculationType: z.string().min(1, "Calculation Type is required"),
  chargesNature: z.string().min(1, "Charges Nature is required"),
  isActive: z.boolean().default(true),
  remarks: z.string().optional(),
  version: z.number().default(0),
});

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface GLAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  isActive?: boolean;
}

interface TypeValue {
  value: string;
  displayName: string;
}

interface ChargesDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const chargeTypes = [
  "Freight",
  "Handling",
  "Customs",
  "Insurance",
  "Storage",
  "Documentation",
  "Other",
];

const API_BASE =
  "http://188.245.83.20:9002/api/General/GetTypeValues?typeName=";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseErrorMessage = (error: any): string => {
  if (!error) return "An unknown error occurred";
  if (typeof error === "string") return error;
  if (Array.isArray(error)) {
    const messages = error.filter((msg) => msg && typeof msg === "string");
    if (messages.length === 0) return "Validation failed";
    return messages.length === 1
      ? messages[0]
      : messages.map((msg, i) => `${i + 1}. ${msg}`).join("\n");
  }
  if (typeof error === "object") {
    if (error.message) return error.message;
    if (error.error) return error.error;
    if (error.title) return error.title;
    if (error.errors) {
      const msgs: string[] = [];
      Object.keys(error.errors).forEach((key) => {
        if (Array.isArray(error.errors[key])) msgs.push(...error.errors[key]);
        else if (typeof error.errors[key] === "string")
          msgs.push(error.errors[key]);
      });
      if (msgs.length) return msgs.join("\n");
    }
    try {
      const s = JSON.stringify(error);
      if (s !== "{}") return s;
    } catch {}
  }
  return "An unexpected error occurred. Please try again.";
};

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ label }: { label: string }) => (
  <div className='flex items-center gap-3 mb-1'>
    <span className='text-xs font-semibold uppercase tracking-widest text-slate-400'>
      {label}
    </span>
    <div className='flex-1 h-px bg-slate-100' />
  </div>
);

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const ToggleSwitch = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) => (
  <button
    type='button'
    onClick={() => !disabled && onChange(!checked)}
    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left
      ${
        checked
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-slate-50 border-slate-200 hover:border-slate-300"
      }
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <div>
      <p
        className={`text-sm font-medium ${checked ? "text-blue-700" : "text-slate-700"}`}
      >
        {label}
      </p>
      {description && (
        <p className='text-xs text-slate-400 mt-0.5'>{description}</p>
      )}
    </div>
    {/* pill track */}
    <div
      className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200
        ${checked ? "bg-blue-500" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
  </button>
);

// ─── Simple Native Select ─────────────────────────────────────────────────────
const StyledSelect = ({
  value,
  onChange,
  options,
  placeholder,
  isLoading,
  disabled,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: TypeValue[];
  placeholder: string;
  isLoading?: boolean;
  disabled?: boolean;
  error?: boolean;
}) => (
  <div className='relative'>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      className={`w-full appearance-none px-3 py-2 pr-9 border rounded-lg text-sm bg-white transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
        ${error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}
        ${disabled || isLoading ? "opacity-60 bg-slate-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <option value=''>{isLoading ? "Loading…" : placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.displayName}
        </option>
      ))}
    </select>
    <div className='pointer-events-none absolute inset-y-0 right-2.5 flex items-center'>
      {isLoading ? (
        <Loader2 className='h-4 w-4 animate-spin text-slate-400' />
      ) : (
        <ChevronDown className='h-4 w-4 text-slate-400' />
      )}
    </div>
  </div>
);

// ─── Searchable GL Account Select ─────────────────────────────────────────────
interface SearchableSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: GLAccount[];
  placeholder: string;
  isLoading?: boolean;
  disabled?: boolean;
  error?: boolean;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder,
  isLoading = false,
  disabled = false,
  error = false,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredOptions = options.filter(
    (o) =>
      o.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.accountName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedOption = options.find((o) => o.accountId === value);

  const handleDropdownToggle = () => {
    if (!disabled && !isLoading) {
      setIsOpen((prev) => {
        if (prev) setSearchTerm("");
        return !prev;
      });
    }
  };

  const handleSelect = (accountId: number) => {
    onChange(accountId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
  };

  return (
    <div className='relative' ref={dropdownRef}>
      <div
        onClick={handleDropdownToggle}
        className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between gap-2 text-sm transition-colors
          ${error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 bg-white"}
          ${disabled || isLoading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}
          ${isOpen ? "border-blue-400 ring-2 ring-blue-500/20" : ""}`}
      >
        <span
          className={`truncate ${selectedOption ? "text-slate-800" : "text-slate-400"}`}
        >
          {selectedOption
            ? `${selectedOption.accountCode} – ${selectedOption.accountName}`
            : placeholder}
        </span>
        <div className='flex items-center gap-1 flex-shrink-0'>
          {value !== 0 && !disabled && !isLoading && (
            <X
              className='h-3.5 w-3.5 text-slate-400 hover:text-slate-600'
              onClick={clearSelection}
            />
          )}
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin text-slate-400' />
          ) : (
            <Search className='h-4 w-4 text-slate-400' />
          )}
        </div>
      </div>

      {isOpen && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 flex flex-col overflow-hidden'>
          {/* Search */}
          <div className='p-2 border-b border-slate-100 bg-slate-50'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400' />
              <input
                ref={searchInputRef}
                type='text'
                placeholder='Search by code or name…'
                className='w-full pl-8 pr-7 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <X
                  className='absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-pointer'
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
          </div>

          {/* Options */}
          <div className='overflow-y-auto'>
            {filteredOptions.length === 0 ? (
              <div className='px-3 py-4 text-sm text-slate-400 text-center'>
                No accounts found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.accountId}
                  onClick={() => handleSelect(option.accountId)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-slate-50
                    ${value === option.accountId ? "bg-blue-50" : ""}`}
                >
                  <span
                    className={`font-medium ${value === option.accountId ? "text-blue-600" : "text-slate-700"}`}
                  >
                    {option.accountCode}
                  </span>
                  <span className='text-slate-400 ml-2 truncate'>
                    {option.accountName}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Dialog Component ────────────────────────────────────────────────────
export default function ChargesDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: ChargesDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [isLoadingGLAccounts, setIsLoadingGLAccounts] = useState(false);

  // Dropdown lists from API
  const [paymentModes, setPaymentModes] = useState<TypeValue[]>([]);
  const [calculationTypes, setCalculationTypes] = useState<TypeValue[]>([]);
  const [chargesNatures, setChargesNatures] = useState<TypeValue[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  // ── Company info from localStorage (client-only) ──
  const [companyName, setCompanyName] = useState("—");
  const [storedCompanyId, setStoredCompanyId] = useState(1);
  const [storedUserId, setStoredUserId] = useState(0);
  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setCompanyName(parsed?.companyName || "—");
        setStoredCompanyId(parsed?.companyId || 1);
        setStoredUserId(parsed?.userID || 0);
      }
    } catch {}
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chargeId: defaultState.chargeId || undefined,
      companyId: defaultState.companyId || 1,
      chargeCode: defaultState.chargeCode || "",
      chargeName: defaultState.chargeName || "",
      chargeType: defaultState.chargeType || "",
      chargeGroup: defaultState.chargeGroup || "",
      revenueGLAccountId:
        defaultState.revenueGLAccountId || defaultState.revenueGlaccountId || 0,
      costGLAccountId:
        defaultState.costGLAccountId || defaultState.costGlaccountId || 0,
      isTaxable: defaultState.isTaxable ?? false,
      defaultTaxPercentage: defaultState.defaultTaxPercentage || 0,
      isReimbursable: defaultState.isReimbursable ?? false,
      paymentMode: defaultState.paymentMode || "",
      calculationType: defaultState.calculationType || "",
      chargesNature: defaultState.chargesNature || "",
      isActive: defaultState.isActive ?? true,
      remarks: defaultState.remarks || "",
      version: defaultState.version || 0,
    },
  });

  const isTaxable = form.watch("isTaxable");

  // ── Fetch GL Accounts ──
  useEffect(() => {
    if (!open) return;
    const fetchGLAccounts = async () => {
      setIsLoadingGLAccounts(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}GlAccount/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "AccountId,AccountCode,AccountName",
            where: "",
            sortOn: "AccountCode",
            page: "1",
            pageSize: "100",
          }),
        });
        if (!response.ok)
          throw new Error(`Failed to fetch GL accounts: ${response.status}`);
        const data = await response.json();
        setGlAccounts(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Error fetching GL accounts:", error);
        setGlAccounts([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(error),
        });
      } finally {
        setIsLoadingGLAccounts(false);
      }
    };
    fetchGLAccounts();
  }, [open, toast]);

  // ── Fetch Dropdown Values from API ──
  useEffect(() => {
    if (!open) return;
    const fetchDropdowns = async () => {
      setIsLoadingDropdowns(true);
      try {
        const [pmRes, ctRes, cnRes] = await Promise.all([
          fetch(`${API_BASE}Charges_PaymentMode`),
          fetch(`${API_BASE}Charges_PaymentCalculation`),
          fetch(`${API_BASE}Charges_NatureType`),
        ]);

        const parseResponse = async (res: Response): Promise<TypeValue[]> => {
          if (!res.ok) return [];
          const raw = await res.json();
          // API returns {"Cash":"Cash","Payorder":"Payorder",...}
          if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            return Object.entries(raw).map(([key, val]) => ({
              value: key,
              displayName: String(val),
            }));
          }
          // Fallback: array-of-strings or array-of-objects
          if (Array.isArray(raw)) {
            return raw.map((item: any) =>
              typeof item === "string"
                ? { value: item, displayName: item }
                : {
                    value: item.value ?? item.name ?? item,
                    displayName:
                      item.displayName ?? item.name ?? item.value ?? item,
                  },
            );
          }
          return [];
        };

        const [pm, ct, cn] = await Promise.all([
          parseResponse(pmRes),
          parseResponse(ctRes),
          parseResponse(cnRes),
        ]);

        setPaymentModes(pm);
        setCalculationTypes(ct);
        setChargesNatures(cn);
      } catch (error) {
        console.error("Error fetching dropdown values:", error);
        // Fallback to static values from the schema image
        setPaymentModes([
          { value: "Cash", displayName: "Cash" },
          { value: "Payorder", displayName: "Payorder" },
          { value: "Both", displayName: "Both" },
        ]);
        setCalculationTypes([
          { value: "Fixed", displayName: "Fixed" },
          { value: "Variable", displayName: "Variable" },
        ]);
        setChargesNatures([
          { value: "Operational", displayName: "Operational" },
          { value: "Non-Operational", displayName: "Non-Operational" },
        ]);
      } finally {
        setIsLoadingDropdowns(false);
      }
    };
    fetchDropdowns();
  }, [open]);

  // ── Reset form on open ──
  useEffect(() => {
    if (!open) return;
    form.reset({
      chargeId: defaultState.chargeId || undefined,
      companyId: defaultState.companyId || storedCompanyId,
      chargeCode: defaultState.chargeCode || "",
      chargeName: defaultState.chargeName || "",
      chargeType: defaultState.chargeType || "",
      chargeGroup: defaultState.chargeGroup || "",
      revenueGLAccountId:
        defaultState.revenueGLAccountId || defaultState.revenueGlaccountId || 0,
      costGLAccountId:
        defaultState.costGLAccountId || defaultState.costGlaccountId || 0,
      isTaxable: defaultState.isTaxable ?? false,
      defaultTaxPercentage: defaultState.defaultTaxPercentage || 0,
      isReimbursable: defaultState.isReimbursable ?? false,
      paymentMode: defaultState.paymentMode || "",
      calculationType: defaultState.calculationType || "",
      chargesNature: defaultState.chargesNature || "",
      isActive: defaultState.isActive ?? true,
      remarks: defaultState.remarks || "",
      version: defaultState.version || 0,
    });
  }, [open, defaultState, form, storedCompanyId]);

  // ── Submit ──
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isUpdate = type === "edit";

    // API expects camelCase keys matching the schema
    const payload: any = {
      chargeCode: values.chargeCode,
      chargeName: values.chargeName,
      chargeType: values.chargeType,
      chargeGroup: values.chargeGroup,
      revenueGlaccountId: values.revenueGLAccountId,
      costGlaccountId: values.costGLAccountId,
      isTaxable: values.isTaxable,
      defaultTaxPercentage: values.isTaxable
        ? values.defaultTaxPercentage || 0
        : 0,
      isReimbursable: values.isReimbursable,
      paymentMode: values.paymentMode,
      calculationType: values.calculationType,
      chargesNature: values.chargesNature,
      isActive: values.isActive,
      remarks: values.remarks || "",
      version: values.version || 0,
    };

    if (!isUpdate) {
      // POST: new record
      payload.companyId = storedCompanyId;
      payload.createdBy = storedUserId;
    } else {
      // PUT: existing record
      payload.chargeId = values.chargeId;
      payload.companyId = values.companyId || storedCompanyId;
      payload.updatedBy = storedUserId;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "ChargesMaster",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const t = await response.text();
          throw new Error(`HTTP ${response.status}: ${t || "Unknown error"}`);
        }
        throw new Error(parseErrorMessage(errorData));
      }

      const responseData = await response.text();
      let jsonData: any = { success: true };
      if (responseData) {
        try {
          jsonData = JSON.parse(responseData);
          if (jsonData?.statusCode >= 400)
            throw new Error(parseErrorMessage(jsonData.message || jsonData));
        } catch {}
      }

      setOpen(false);
      handleAddEdit(
        jsonData || {
          ...payload,
          chargeId: jsonData?.chargeId || values.chargeId,
        },
      );
      toast({
        title: `Charge ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      const msg = error.message || "Failed to process charge";
      if (msg.includes("Charge Code is already exist")) {
        form.setError("chargeCode", {
          type: "manual",
          message: "This charge code already exists.",
        });
      }
      if (msg.includes("Charge Name is already exist")) {
        form.setError("chargeName", {
          type: "manual",
          message: "This charge name already exists.",
        });
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.clearErrors();
  };

  const anyLoading = isLoading || isLoadingGLAccounts || isLoadingDropdowns;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm'>
            <Plus size={15} />
            Add Charge
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200 shadow-2xl'>
        {/* ── Header ── */}
        <div className='sticky top-0 z-10 bg-white border-b border-slate-100 px-7 py-5 rounded-t-2xl'>
          <DialogHeader>
            <DialogTitle className='text-lg font-semibold text-slate-800'>
              {type === "edit" ? "Edit Charge" : "Add New Charge"}
            </DialogTitle>
            <DialogDescription className='text-sm text-slate-400 mt-0.5'>
              {type === "edit"
                ? "Update the charge information below."
                : "Fill in the details to create a new charge."}
            </DialogDescription>
          </DialogHeader>

          {/* Company badge 
          <div className='mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg'>
            <span className='text-xs text-slate-400 font-medium'>Company</span>
            <span className='text-xs font-semibold text-slate-700'>
              {companyName}
            </span>
          </div>*/}
        </div>

        {/* ── Form body ── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='px-7 py-6 flex flex-col gap-6'
          >
            {/* ── Basic Info ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Basic Information' />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Charge Code */}
                <FormField
                  control={form.control}
                  name='chargeCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Charge Code <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. FRE001'
                          {...field}
                          className='uppercase rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                            if (
                              form.formState.errors.chargeCode?.type ===
                              "manual"
                            )
                              form.clearErrors("chargeCode");
                          }}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Charge Name */}
                <FormField
                  control={form.control}
                  name='chargeName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Charge Name <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Freight Charge'
                          {...field}
                          className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (
                              form.formState.errors.chargeName?.type ===
                              "manual"
                            )
                              form.clearErrors("chargeName");
                          }}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Charge Type */}
                <FormField
                  control={form.control}
                  name='chargeType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Charge Type <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <StyledSelect
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={chargeTypes.map((t) => ({
                            value: t,
                            displayName: t,
                          }))}
                          placeholder='Select Charge Type'
                          error={!!form.formState.errors.chargeType}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Charge Group */}
                <FormField
                  control={form.control}
                  name='chargeGroup'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Charge Group <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Transportation'
                          {...field}
                          className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── GL Accounts ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='GL Accounts' />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='revenueGLAccountId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Revenue GL Account{" "}
                        <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value || 0}
                          onChange={field.onChange}
                          options={glAccounts}
                          placeholder='Select Revenue Account'
                          isLoading={isLoadingGLAccounts}
                          disabled={isLoading}
                          error={!!form.formState.errors.revenueGLAccountId}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='costGLAccountId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Cost GL Account <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value || 0}
                          onChange={field.onChange}
                          options={glAccounts}
                          placeholder='Select Cost Account'
                          isLoading={isLoadingGLAccounts}
                          disabled={isLoading}
                          error={!!form.formState.errors.costGLAccountId}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Charge Classification ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Charge Classification' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Payment Mode */}
                <FormField
                  control={form.control}
                  name='paymentMode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Payment Mode <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <StyledSelect
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={paymentModes}
                          placeholder='Select Mode'
                          isLoading={isLoadingDropdowns}
                          disabled={isLoading}
                          error={!!form.formState.errors.paymentMode}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Calculation Type */}
                <FormField
                  control={form.control}
                  name='calculationType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Calculation Type <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <StyledSelect
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={calculationTypes}
                          placeholder='Select Type'
                          isLoading={isLoadingDropdowns}
                          disabled={isLoading}
                          error={!!form.formState.errors.calculationType}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Charges Nature */}
                <FormField
                  control={form.control}
                  name='chargesNature'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Charges Nature <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <StyledSelect
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={chargesNatures}
                          placeholder='Select Nature'
                          isLoading={isLoadingDropdowns}
                          disabled={isLoading}
                          error={!!form.formState.errors.chargesNature}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Tax & Flags ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Tax & Flags' />

              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {/* Taxable toggle */}
                <FormField
                  control={form.control}
                  name='isTaxable'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleSwitch
                          checked={field.value}
                          onChange={field.onChange}
                          label='Taxable'
                          description='Subject to tax'
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Reimbursable toggle */}
                <FormField
                  control={form.control}
                  name='isReimbursable'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleSwitch
                          checked={field.value}
                          onChange={field.onChange}
                          label='Reimbursable'
                          description='Can be reimbursed'
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Active toggle */}
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleSwitch
                          checked={field.value}
                          onChange={field.onChange}
                          label='Active'
                          description={
                            field.value
                              ? "Currently active"
                              : "Currently inactive"
                          }
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Default Tax Percentage (conditional) */}
              {isTaxable && (
                <FormField
                  control={form.control}
                  name='defaultTaxPercentage'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Default Tax Percentage (%)
                      </FormLabel>
                      <FormControl>
                        <div className='relative max-w-xs'>
                          <Input
                            type='number'
                            placeholder='0.00'
                            value={field.value || ""}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              field.onChange(isNaN(v) ? 0 : v);
                            }}
                            min={0}
                            max={100}
                            step={0.01}
                            disabled={isLoading}
                            className='pr-8 rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                          />
                          <span className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none'>
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* ── Remarks ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Additional Notes' />
              <FormField
                control={form.control}
                name='remarks'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder='Enter any remarks or additional details…'
                        {...field}
                        rows={3}
                        disabled={isLoading}
                        className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20 resize-none text-sm'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Hidden fields ── */}
            <div className='hidden'>
              {(["chargeId", "companyId", "version"] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type='hidden' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* ── Footer ── */}
            <div className='sticky bottom-0 bg-white border-t border-slate-100 -mx-7 -mb-6 px-7 py-4 flex items-center justify-between gap-3 rounded-b-2xl mt-2'>
              <p className='text-xs text-slate-400'>
                Fields marked{" "}
                <span className='text-red-400 font-medium'>*</span> are required
              </p>
              <div className='flex gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                  disabled={anyLoading}
                  className='rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={anyLoading}
                  className='rounded-lg bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Saving…
                    </>
                  ) : type === "edit" ? (
                    "Update Charge"
                  ) : (
                    "Add Charge"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
