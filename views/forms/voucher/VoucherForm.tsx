"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
  FiSearch,
  FiFileText,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

type VoucherFormProps = {
  type: "add" | "edit";
  defaultState?: any;
  handleAddEdit: (data: any) => void;
};

type VoucherDetailLine = {
  id: string;
  voucherDetailId?: number;
  accountId: number | null;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  costCenterId: number | null;
  costCenterName: string;
  version: number;
};

type GlAccount = {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountNature: string;
};

type CostCenter = {
  costCenterId: number;
  costCenterCode: string;
  costCenterName: string;
};

type AccountingPeriod = {
  accountingPeriodId: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: string;
  fiscalYearId: number;
};

type VoucherType = {
  voucherTypeId: number;
  voucherCode: string;
  voucherName: string;
  description?: string;
  isSystemDefined?: boolean;
  isActive?: boolean;
};

type StatusOption = { key: string; label: string };

// ─── UUID ─────────────────────────────────────────────────────────────────────

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ─── VoucherNo auto-generation ────────────────────────────────────────────────

const generateVoucherNumber = (voucherCode: string): string => {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const prefix = voucherCode ? voucherCode.toUpperCase() : "VCH";
  return `${prefix}-${yy}${mm}${dd}-${rand}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function VoucherForm({
  type,
  defaultState,
  handleAddEdit,
}: VoucherFormProps) {
  // ── Master state ──────────────────────────────────────────────────────────────
  const [voucherNumber, setVoucherNumber] = useState<string>("");
  const [voucherDate, setVoucherDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [narration, setNarration] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedVoucherTypeId, setSelectedVoucherTypeId] = useState<
    number | null
  >(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [periodSearch, setPeriodSearch] = useState<string>("");
  const [voucherTypeSearch, setVoucherTypeSearch] = useState<string>("");

  // ── Reference data ────────────────────────────────────────────────────────────
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [accountingPeriods, setAccountingPeriods] = useState<
    AccountingPeriod[]
  >([]);
  const [filteredPeriods, setFilteredPeriods] = useState<AccountingPeriod[]>(
    [],
  );
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
  const [filteredVoucherTypes, setFilteredVoucherTypes] = useState<
    VoucherType[]
  >([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);

  // ── Per-row search state ──────────────────────────────────────────────────────
  const [rowAccountSearch, setRowAccountSearch] = useState<
    Record<string, string>
  >({});
  const [rowCostCenterSearch, setRowCostCenterSearch] = useState<
    Record<string, string>
  >({});

  // ── Detail lines ──────────────────────────────────────────────────────────────
  const emptyLine = (): VoucherDetailLine => ({
    id: generateUUID(),
    accountId: null,
    accountCode: "",
    accountName: "",
    debitAmount: 0,
    creditAmount: 0,
    description: "",
    costCenterId: null,
    costCenterName: "",
    version: 0,
  });

  const [lineItems, setLineItems] = useState<VoucherDetailLine[]>([
    emptyLine(),
    emptyLine(),
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const debitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const creditInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Totals ────────────────────────────────────────────────────────────────────
  const totalDebit = lineItems.reduce((s, l) => s + (l.debitAmount || 0), 0);
  const totalCredit = lineItems.reduce((s, l) => s + (l.creditAmount || 0), 0);
  const difference = totalDebit - totalCredit;
  const balanced = Math.abs(difference) < 0.01;

  // ── Derived display labels (used in triggers) ─────────────────────────────────
  const selectedVoucherType = voucherTypes.find(
    (v) => v.voucherTypeId === selectedVoucherTypeId,
  );
  const selectedPeriod = accountingPeriods.find(
    (p) => p.accountingPeriodId === selectedPeriodId,
  );

  // ── Fetch reference data ──────────────────────────────────────────────────────
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL;

    const fetchGlAccounts = async () => {
      try {
        const res = await fetch(`${base}GlAccount/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "AccountId,AccountCode,AccountName,AccountType,AccountNature",
            where: "IsHeader==false && IsActive==true",
            sortOn: "AccountCode ASC",
            page: "1",
            pageSize: "1000",
          }),
        });
        if (res.ok) setGlAccounts(await res.json());
      } catch (e) {
        console.error("GL accounts:", e);
      }
    };

    const fetchCostCenters = async () => {
      try {
        const res = await fetch(`${base}CostCenter/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "CostCenterId,CostCenterCode,CostCenterName",
            where: "IsActive==true",
            sortOn: "CostCenterName ASC",
            page: "1",
            pageSize: "500",
          }),
        });
        if (res.ok) setCostCenters(await res.json());
      } catch (e) {
        console.error("Cost centers:", e);
      }
    };

    const fetchAccountingPeriods = async () => {
      try {
        const res = await fetch(`${base}AccountingPeriod/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "AccountingPeriodId,PeriodName,StartDate,EndDate,Status,FiscalYearId",
            where: "",
            sortOn: "StartDate DESC",
            page: "1",
            pageSize: "100",
          }),
        });
        if (res.ok) {
          const d: AccountingPeriod[] = await res.json();
          setAccountingPeriods(d);
          setFilteredPeriods(d);
          // Auto-select current period
          if (type === "add") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const current = d.find((p) => {
              const start = new Date(p.startDate);
              const end = new Date(p.endDate);
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
              return today >= start && today <= end;
            });
            if (current) setSelectedPeriodId(current.accountingPeriodId);
          }
        }
      } catch (e) {
        console.error("Accounting periods:", e);
      }
    };

    const fetchVoucherTypes = async () => {
      try {
        const res = await fetch(`${base}VoucherType/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "VoucherTypeId, VoucherCode, VoucherName, Description, IsSystemDefined, IsActive",
            where: "",
            sortOn: "",
            page: "1",
            pageSize: "500",
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setVoucherTypes(d);
          setFilteredVoucherTypes(d);
        }
      } catch (e) {
        console.error("Voucher types:", e);
      }
    };

    const fetchStatusOptions = async () => {
      try {
        const res = await fetch(
          `${base}General/GetTypeValues?typeName=Voucher_Status`,
          { method: "GET", headers: { "Content-Type": "application/json" } },
        );
        if (res.ok) {
          const raw: Record<string, string> = await res.json();
          const opts: StatusOption[] = Object.entries(raw).map(
            ([key, label]) => ({ key, label }),
          );
          setStatusOptions(opts);
          if (type === "add" && opts.length > 0) setSelectedStatus(opts[0].key);
        } else throw new Error("failed");
      } catch {
        const fallback: StatusOption[] = [
          { key: "Draft", label: "Draft" },
          { key: "Posted", label: "Posted" },
          { key: "Cancelled", label: "Cancelled" },
        ];
        setStatusOptions(fallback);
        if (type === "add") setSelectedStatus("Draft");
      }
    };

    setIsLoading(true);
    Promise.all([
      fetchGlAccounts(),
      fetchCostCenters(),
      fetchAccountingPeriods(),
      fetchVoucherTypes(),
      fetchStatusOptions(),
    ]).finally(() => setIsLoading(false));
  }, [type]);

  // ── Auto-generate VoucherNo ───────────────────────────────────────────────────
  useEffect(() => {
    if (type !== "add") return;
    const vt = voucherTypes.find(
      (v) => v.voucherTypeId === selectedVoucherTypeId,
    );
    setVoucherNumber(generateVoucherNumber(vt?.voucherCode || "VCH"));
  }, [selectedVoucherTypeId, voucherTypes, type]);

  useEffect(() => {
    if (type === "add") setVoucherNumber(generateVoucherNumber("VCH"));
  }, [type]);

  // ── Search filters ────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = periodSearch.toLowerCase();
    setFilteredPeriods(
      q
        ? accountingPeriods.filter((p) =>
            p.periodName.toLowerCase().includes(q),
          )
        : accountingPeriods,
    );
  }, [periodSearch, accountingPeriods]);

  useEffect(() => {
    const q = voucherTypeSearch.toLowerCase();
    setFilteredVoucherTypes(
      q
        ? voucherTypes.filter(
            (v) =>
              v.voucherName.toLowerCase().includes(q) ||
              v.voucherCode.toLowerCase().includes(q),
          )
        : voucherTypes,
    );
  }, [voucherTypeSearch, voucherTypes]);

  const getFilteredAccountsForRow = (lineId: string): GlAccount[] => {
    const q = (rowAccountSearch[lineId] || "").toLowerCase();
    return q
      ? glAccounts.filter(
          (a) =>
            a.accountName.toLowerCase().includes(q) ||
            a.accountCode.toLowerCase().includes(q),
        )
      : glAccounts;
  };

  const getFilteredCostCentersForRow = (lineId: string): CostCenter[] => {
    const q = (rowCostCenterSearch[lineId] || "").toLowerCase();
    return q
      ? costCenters.filter(
          (c) =>
            c.costCenterName.toLowerCase().includes(q) ||
            c.costCenterCode.toLowerCase().includes(q),
        )
      : costCenters;
  };

  // ── Pre-populate for edit ─────────────────────────────────────────────────────
  useEffect(() => {
    if (type !== "edit" || !defaultState) return;
    setVoucherNumber(defaultState.voucherNumber || "");
    setVoucherDate(
      defaultState.voucherDate
        ? defaultState.voucherDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setNarration(defaultState.narration || "");
    setReferenceNumber(defaultState.referenceNumber || "");
    setSelectedStatus(defaultState.status || "");
    if (defaultState.voucherTypeId)
      setSelectedVoucherTypeId(defaultState.voucherTypeId);
    if (defaultState.accountingPeriodId)
      setSelectedPeriodId(defaultState.accountingPeriodId);
    const details =
      defaultState.voucherDetails || defaultState.VoucherDetails || [];
    if (details.length > 0) {
      const mapped: VoucherDetailLine[] = details.map((d: any) => {
        const acc = glAccounts.find(
          (a) => a.accountId === (d.accountId || d.AccountId),
        );
        const cc = costCenters.find(
          (c) => c.costCenterId === (d.costCenterId || d.CostCenterId),
        );
        return {
          id: generateUUID(),
          voucherDetailId: d.voucherDetailId || d.VoucherDetailId,
          accountId: d.accountId || d.AccountId || null,
          accountCode: acc?.accountCode || d.account?.accountCode || "",
          accountName: acc?.accountName || d.account?.accountName || "",
          debitAmount: d.debitAmount || d.DebitAmount || 0,
          creditAmount: d.creditAmount || d.CreditAmount || 0,
          description: d.description || d.Description || "",
          costCenterId: d.costCenterId || d.CostCenterId || null,
          costCenterName:
            cc?.costCenterName || d.costCenter?.costCenterName || "",
          version: d.version || 0,
        };
      });
      setLineItems(mapped);
    }
  }, [type, defaultState, glAccounts, costCenters]);

  // ── Line item helpers ─────────────────────────────────────────────────────────
  const updateLineItem = (id: string, field: string, value: any) =>
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const handleAccountChange = (lineId: string, accountIdStr: string) => {
    const acc = glAccounts.find((a) => a.accountId.toString() === accountIdStr);
    if (!acc) return;
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              accountId: acc.accountId,
              accountCode: acc.accountCode,
              accountName: acc.accountName,
            }
          : item,
      ),
    );
  };

  const handleCostCenterChange = (lineId: string, ccIdStr: string) => {
    if (!ccIdStr || ccIdStr === "none") {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === lineId
            ? { ...item, costCenterId: null, costCenterName: "" }
            : item,
        ),
      );
      return;
    }
    const cc = costCenters.find((c) => c.costCenterId.toString() === ccIdStr);
    if (!cc) return;
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              costCenterId: cc.costCenterId,
              costCenterName: cc.costCenterName,
            }
          : item,
      ),
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, emptyLine()]);
    setTimeout(() => {
      debitInputRefs.current[lineItems.length]?.focus();
    }, 100);
  };

  const removeLineItem = (id: string, index: number) => {
    if (lineItems.length > 2) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
      if (index > 0)
        setTimeout(() => {
          debitInputRefs.current[index - 1]?.focus();
        }, 100);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least two line items are required",
      });
    }
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  const handleAmountKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
    amountType: "debit" | "credit",
  ) => {
    if (
      e.key === "Enter" ||
      (e.key === "ArrowDown" && amountType === "credit")
    ) {
      e.preventDefault();
      if (index === lineItems.length - 1) addLineItem();
      else debitInputRefs.current[index + 1]?.focus();
    }
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      debitInputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const btn = document.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        if (btn && !btn.disabled) btn.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!selectedVoucherTypeId) errors.push("Voucher Type is required");
    if (!voucherDate) errors.push("Voucher Date is required");
    if (!selectedPeriodId) errors.push("Accounting Period is required");
    if (!selectedStatus) errors.push("Status is required");
    lineItems.forEach((item, i) => {
      if (!item.accountId) errors.push(`Line ${i + 1}: Account is required`);
      const hasDebit = item.debitAmount > 0;
      const hasCredit = item.creditAmount > 0;
      if (!hasDebit && !hasCredit)
        errors.push(`Line ${i + 1}: Debit or Credit amount is required`);
      if (hasDebit && hasCredit)
        errors.push(`Line ${i + 1}: Cannot have both Debit and Credit`);
    });
    if (!balanced)
      errors.push(
        `Voucher not balanced. Difference: ${Math.abs(difference).toFixed(2)}`,
      );
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          errors.slice(0, 3).join(" | ") + (errors.length > 3 ? "..." : ""),
      });
      return false;
    }
    return true;
  };

  // ── Submit — updated to match full GLVoucher POST/PUT schema ─────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    const base = process.env.NEXT_PUBLIC_BASE_URL;

    try {
      // Read context from localStorage (set during login)
      const userId = parseInt(localStorage.getItem("userId") || "0", 10);
      const companyId = parseInt(localStorage.getItem("companyId") || "0", 10);
      const branchId = parseInt(localStorage.getItem("branchId") || "0", 10);

      const now = new Date().toISOString();

      // ── Build detail line ──────────────────────────────────────────────────────
      const buildDetail = (item: VoucherDetailLine): any => {
        const base: any = {
          // audit fields
          createdAt: now,
          updatedAt: now,
          createLog: "",
          updateLog: "",
          version: item.version || 0,

          // FK back to master (0 on POST — server fills it; real id on PUT)
          voucherId: type === "edit" ? (defaultState?.voucherId ?? 0) : 0,

          // line fields
          accountId: item.accountId,
          debitAmount: item.debitAmount || 0,
          creditAmount: item.creditAmount || 0,
          description: item.description || "",
          costCenterId: item.costCenterId || null,

          // null-out navigation objects so the API doesn't try to upsert them
          account: null,
          costCenter: null,
        };

        // on PUT — include the existing PK so the server knows to UPDATE not INSERT
        if (type === "edit" && item.voucherDetailId) {
          base.voucherDetailId = item.voucherDetailId;
        }

        return base;
      };

      // ── Master payload ─────────────────────────────────────────────────────────
      const payload: any = {
        // audit
        createdAt: type === "edit" ? (defaultState?.createdAt ?? now) : now,
        updatedAt: now,
        createLog: "",
        updateLog: "",
        version: type === "edit" ? (defaultState?.version ?? 0) : 0,

        // context
        companyId,
        branchId,
        createdBy:
          type === "edit" ? (defaultState?.createdBy ?? userId) : userId,

        // master fields
        voucherTypeId: selectedVoucherTypeId,
        voucherNumber: voucherNumber || "",
        voucherDate: new Date(voucherDate).toISOString(),
        accountingPeriodId: selectedPeriodId,
        narration: narration || "",
        referenceNumber: referenceNumber || "",
        status: selectedStatus,

        // posted-by (keep existing value on edit, current user on new)
        postedBy: type === "edit" ? (defaultState?.postedBy ?? userId) : userId,
        postedAt: type === "edit" ? (defaultState?.postedAt ?? now) : now,

        // null-out navigation objects — server must not try to upsert nested data
        accountingPeriod: null,
        branch: null,
        postedByNavigation: null,
        voucherType: null,

        // detail lines
        voucherDetails: lineItems.map(buildDetail),
      };

      // on PUT — include the master PK
      if (type === "edit" && defaultState?.voucherId) {
        payload.voucherId = defaultState.voucherId;
      }

      const method = type === "edit" ? "PUT" : "POST";
      const endpoint = `${base}GLVoucher`;
      console.log(`📡 ${method} ${endpoint}`, JSON.stringify(payload, null, 2));

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let userMessage = `Request failed (${response.status})`;
        try {
          const parsed = JSON.parse(errorText);
          if (Array.isArray(parsed)) userMessage = parsed.join("\n");
          else if (parsed.errors)
            userMessage = Object.values(parsed.errors).flat().join(", ");
          else if (parsed.title) userMessage = parsed.title;
          else if (typeof parsed === "string") userMessage = parsed;
        } catch {
          userMessage = errorText || userMessage;
        }
        throw new Error(userMessage);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Voucher ${type === "edit" ? "updated" : "created"} — ${lineItems.length} line(s) | DR: ${new Intl.NumberFormat("en-US").format(totalDebit)} | CR: ${new Intl.NumberFormat("en-US").format(totalCredit)}`,
      });
      handleAddEdit(result);
    } catch (error) {
      console.error("💥", error);
      toast({
        variant: "destructive",
        title: type === "edit" ? "Update Failed" : "Create Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Status badge styling ──────────────────────────────────────────────────────
  const getStatusStyle = (status: string): string => {
    const s = (status || "").toLowerCase();
    if (s === "posted") return "bg-green-50 text-green-700 border-green-300";
    if (s === "cancelled" || s === "voided")
      return "bg-red-50 text-red-700 border-red-300";
    return "bg-yellow-50 text-yellow-700 border-yellow-300";
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-4'
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) e.preventDefault();
      }}
    >
      <style>{`
        .voucher-table-wrapper::-webkit-scrollbar { width: 14px; height: 14px; }
        .voucher-table-wrapper::-webkit-scrollbar-track { background: #e5e7eb; border-radius: 7px; border: 1px solid #d1d5db; }
        .voucher-table-wrapper::-webkit-scrollbar-thumb { background: #6b7280; border-radius: 7px; border: 2px solid #e5e7eb; }
        .voucher-table-wrapper::-webkit-scrollbar-thumb:hover { background: #4b5563; }
        .voucher-table-wrapper { scrollbar-width: auto; scrollbar-color: #6b7280 #e5e7eb; }
      `}</style>

      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg flex items-center gap-2'>
              <FiFileText className='h-5 w-5 text-blue-600' />
              {type === "edit" ? "Edit Voucher" : "New Voucher"}
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className={`font-semibold border ${getStatusStyle(selectedStatus)}`}
              >
                {selectedStatus || "Draft"}
              </Badge>
              <Badge variant='outline' className='bg-white'>
                {lineItems.length} Line(s)
              </Badge>
              <Badge
                variant='outline'
                className={
                  balanced
                    ? "bg-green-50 text-green-700 border-green-300"
                    : "bg-red-50 text-red-700 border-red-300"
                }
              >
                {balanced ? "✓ Balanced" : "✗ Unbalanced"}
              </Badge>
            </div>
          </div>
          <CardDescription className='pt-2'>
            Each line must have either a Debit or Credit — not both. Total
            Debits must equal Total Credits.
          </CardDescription>
        </CardHeader>

        <CardContent className='p-4'>
          {/* Info Banner */}
          <div className='bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
              <p className='text-xs text-blue-700'>
                • <strong>Double-Entry</strong> — Debits must equal Credits
                &nbsp;•&nbsp; A line cannot have both DR and CR &nbsp;•&nbsp;
                Voucher No is auto-generated &nbsp;•&nbsp;{" "}
                <kbd className='px-1 bg-gray-100 border rounded'>
                  Ctrl+Enter
                </kbd>{" "}
                to submit
              </p>
            </div>
          </div>

          {/* ── MASTER FIELDS ──────────────────────────────────────────────────────── */}
          <div className='mb-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50'>
            <h3 className='text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2'>
              <Badge variant='default' className='bg-blue-600'>
                Master
              </Badge>
              Voucher Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* ── Voucher Type ── Fix: textValue on SelectItem for trigger display */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Voucher Type <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={selectedVoucherTypeId?.toString() || ""}
                  onValueChange={(v) => {
                    const vt = voucherTypes.find(
                      (t) => t.voucherTypeId.toString() === v,
                    );
                    if (vt) {
                      setSelectedVoucherTypeId(vt.voucherTypeId);
                      if (type === "add")
                        setVoucherNumber(generateVoucherNumber(vt.voucherCode));
                    }
                  }}
                >
                  <SelectTrigger className='w-full h-10 bg-white'>
                    <SelectValue placeholder='Select Voucher Type'>
                      {/* ── KEY FIX: render selected label explicitly in trigger ── */}
                      {selectedVoucherType
                        ? `${selectedVoucherType.voucherName} (${selectedVoucherType.voucherCode})`
                        : "Select Voucher Type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className='max-h-[300px] w-[320px]'
                    position='popper'
                    sideOffset={5}
                  >
                    <div className='sticky top-0 bg-white p-2 border-b z-50'>
                      <div className='relative'>
                        <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                        <Input
                          placeholder='Search types...'
                          value={voucherTypeSearch}
                          onChange={(e) => setVoucherTypeSearch(e.target.value)}
                          className='pl-8 h-8'
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className='max-h-[250px] overflow-y-auto'>
                      {filteredVoucherTypes.length === 0 ? (
                        <div className='p-4 text-center text-gray-500 text-sm'>
                          No voucher types found
                        </div>
                      ) : (
                        filteredVoucherTypes.map((vt) => (
                          <SelectItem
                            key={vt.voucherTypeId}
                            value={vt.voucherTypeId.toString()}
                          >
                            <div className='flex flex-col py-0.5'>
                              <span className='font-medium text-sm'>
                                {vt.voucherName}
                              </span>
                              <span className='text-xs text-gray-500'>
                                {vt.voucherCode}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Voucher Number ── */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Voucher Number
                  <span className='ml-2 text-xs text-blue-500 font-normal'>
                    (auto-generated)
                  </span>
                </Label>
                <div className='relative'>
                  <Input
                    type='text'
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    placeholder='Auto-generated'
                    className='h-10 pr-20 bg-white'
                  />
                  {type === "add" && (
                    <button
                      type='button'
                      onClick={() => {
                        const vt = voucherTypes.find(
                          (v) => v.voucherTypeId === selectedVoucherTypeId,
                        );
                        setVoucherNumber(
                          generateVoucherNumber(vt?.voucherCode || "VCH"),
                        );
                      }}
                      className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors'
                    >
                      ↺ Regen
                    </button>
                  )}
                </div>
              </div>

              {/* ── Voucher Date ── */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Voucher Date <span className='text-red-500'>*</span>
                </Label>
                <Input
                  type='date'
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  className='h-10 bg-white'
                />
              </div>

              {/* ── Accounting Period ── Fix: explicit trigger label + textValue */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Accounting Period <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={selectedPeriodId?.toString() || ""}
                  onValueChange={(v) => {
                    const period = accountingPeriods.find(
                      (p) => p.accountingPeriodId.toString() === v,
                    );
                    if (period) setSelectedPeriodId(period.accountingPeriodId);
                  }}
                >
                  <SelectTrigger className='w-full h-10 bg-white'>
                    <SelectValue placeholder='Select Period'>
                      {selectedPeriod
                        ? selectedPeriod.periodName
                        : "Select Period"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className='max-h-[300px] w-[320px]'
                    position='popper'
                    sideOffset={5}
                  >
                    <div className='sticky top-0 bg-white p-2 border-b z-50'>
                      <div className='relative'>
                        <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                        <Input
                          placeholder='Search periods...'
                          value={periodSearch}
                          onChange={(e) => setPeriodSearch(e.target.value)}
                          className='pl-8 h-8'
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className='max-h-[250px] overflow-y-auto'>
                      {filteredPeriods.length === 0 ? (
                        <div className='p-4 text-center text-gray-500 text-sm'>
                          No periods found
                        </div>
                      ) : (
                        filteredPeriods.map((p) => (
                          <SelectItem
                            key={p.accountingPeriodId}
                            value={p.accountingPeriodId.toString()}
                          >
                            <div className='flex flex-col py-0.5'>
                              <span className='font-medium text-sm'>
                                {p.periodName}
                              </span>
                              <span className='text-xs text-gray-500'>
                                {new Date(p.startDate).toLocaleDateString()} —{" "}
                                {new Date(p.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Reference Number ── */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Reference Number
                </Label>
                <Input
                  type='text'
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder='e.g. INV-001, CHQ-123'
                  className='h-10 bg-white'
                />
              </div>

              {/* ── Status ── Fix: explicit trigger label */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Status <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className='w-full h-10 bg-white'>
                    <SelectValue placeholder='Select Status'>
                      {statusOptions.find((o) => o.key === selectedStatus)
                        ?.label ||
                        selectedStatus ||
                        "Select Status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.length > 0 ? (
                      statusOptions.map((opt) => (
                        <SelectItem key={opt.key} value={opt.key}>
                          {opt.label}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value='Draft'>Draft</SelectItem>
                        <SelectItem value='Posted'>Posted</SelectItem>
                        <SelectItem value='Cancelled'>Cancelled</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Narration ── */}
              <div className='md:col-span-3'>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Narration
                </Label>
                <Textarea
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder='Enter narration / description for this voucher...'
                  className='resize-none h-16 text-sm bg-white'
                />
              </div>
            </div>
          </div>

          {/* ── DETAIL TABLE ──────────────────────────────────────────────────────────── */}
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                <Badge variant='outline' className='bg-gray-100'>
                  Details
                </Badge>
                Voucher Lines
              </h3>
            </div>

            <div className='border rounded-lg overflow-hidden shadow-sm'>
              <div
                className='overflow-x-auto voucher-table-wrapper'
                style={{ maxHeight: "520px" }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-[40px] sticky left-0 bg-gray-50 z-20 border-r'>
                        #
                      </TableHead>
                      <TableHead className='min-w-[260px]'>
                        Account <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[180px]'>
                        Cost Center
                      </TableHead>
                      <TableHead className='min-w-[140px]'>
                        Debit{" "}
                        <span className='text-blue-600 font-bold'>DR</span>
                      </TableHead>
                      <TableHead className='min-w-[140px]'>
                        Credit{" "}
                        <span className='text-green-600 font-bold'>CR</span>
                      </TableHead>
                      <TableHead className='min-w-[200px]'>
                        Description
                      </TableHead>
                      <TableHead className='w-[50px] sticky right-0 bg-gray-50 z-20 border-l'>
                        Del
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => {
                      const hasDebit = item.debitAmount > 0;
                      const hasCredit = item.creditAmount > 0;
                      // Derived display labels for row dropdowns
                      const selectedAcc = glAccounts.find(
                        (a) => a.accountId === item.accountId,
                      );
                      const selectedCC = costCenters.find(
                        (c) => c.costCenterId === item.costCenterId,
                      );

                      return (
                        <TableRow key={item.id} className='group'>
                          <TableCell className='font-medium sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r text-center text-xs'>
                            {index + 1}
                          </TableCell>

                          {/* ── Account ── Fix: explicit trigger label + textValue */}
                          <TableCell>
                            <Select
                              value={item.accountId?.toString() || ""}
                              onValueChange={(v) =>
                                handleAccountChange(item.id, v)
                              }
                            >
                              <SelectTrigger className='h-9 text-sm bg-white'>
                                <SelectValue placeholder='Select Account'>
                                  {selectedAcc
                                    ? `${selectedAcc.accountCode} - ${selectedAcc.accountName}`
                                    : "Select Account"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent
                                className='max-h-[300px] w-[400px]'
                                position='popper'
                                sideOffset={5}
                              >
                                <div className='sticky top-0 bg-white p-2 border-b z-50'>
                                  <div className='relative'>
                                    <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                                    <Input
                                      placeholder='Search accounts...'
                                      value={rowAccountSearch[item.id] || ""}
                                      onChange={(e) =>
                                        setRowAccountSearch((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      className='pl-8 h-8'
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className='max-h-[250px] overflow-y-auto'>
                                  {getFilteredAccountsForRow(item.id).length ===
                                  0 ? (
                                    <div className='p-4 text-center text-gray-500 text-sm'>
                                      No accounts found
                                    </div>
                                  ) : (
                                    getFilteredAccountsForRow(item.id).map(
                                      (acc) => (
                                        <SelectItem
                                          key={acc.accountId}
                                          value={acc.accountId.toString()}
                                        >
                                          <div className='flex flex-col py-0.5'>
                                            <span className='font-mono text-xs font-semibold text-blue-700'>
                                              {acc.accountCode}
                                            </span>
                                            <span className='text-xs text-gray-600'>
                                              {acc.accountName}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ),
                                    )
                                  )}
                                </div>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* ── Cost Center ── Fix: explicit trigger label + textValue */}
                          <TableCell>
                            <Select
                              value={item.costCenterId?.toString() || "none"}
                              onValueChange={(v) =>
                                handleCostCenterChange(item.id, v)
                              }
                            >
                              <SelectTrigger className='h-9 text-sm bg-white'>
                                <SelectValue placeholder='Optional'>
                                  {selectedCC
                                    ? selectedCC.costCenterName
                                    : "Optional"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent
                                className='max-h-[300px] w-[260px]'
                                position='popper'
                                sideOffset={5}
                              >
                                <div className='sticky top-0 bg-white p-2 border-b z-50'>
                                  <div className='relative'>
                                    <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                                    <Input
                                      placeholder='Search cost centers...'
                                      value={rowCostCenterSearch[item.id] || ""}
                                      onChange={(e) =>
                                        setRowCostCenterSearch((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      className='pl-8 h-8'
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className='max-h-[250px] overflow-y-auto'>
                                  <SelectItem value='none'>
                                    <span className='text-gray-400 text-xs'>
                                      — None —
                                    </span>
                                  </SelectItem>
                                  {getFilteredCostCentersForRow(item.id).map(
                                    (cc) => (
                                      <SelectItem
                                        key={cc.costCenterId}
                                        value={cc.costCenterId.toString()}
                                      >
                                        <div className='flex flex-col py-0.5'>
                                          <span className='font-medium text-sm'>
                                            {cc.costCenterName}
                                          </span>
                                          <span className='text-xs text-gray-500'>
                                            {cc.costCenterCode}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ),
                                  )}
                                </div>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* ── Debit ── */}
                          <TableCell>
                            <div className='relative'>
                              <span className='absolute left-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-semibold select-none'>
                                DR
                              </span>
                              <Input
                                ref={(el) => {
                                  debitInputRefs.current[index] = el;
                                }}
                                type='number'
                                min='0'
                                step='0.01'
                                value={item.debitAmount || ""}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateLineItem(item.id, "debitAmount", val);
                                  if (val > 0)
                                    updateLineItem(item.id, "creditAmount", 0);
                                }}
                                onKeyDown={(e) =>
                                  handleAmountKeyDown(e, index, "debit")
                                }
                                className={`h-9 text-sm pl-9 ${hasCredit ? "opacity-40 cursor-not-allowed bg-gray-50" : "bg-white"}`}
                                placeholder='0.00'
                                disabled={hasCredit}
                              />
                            </div>
                          </TableCell>

                          {/* ── Credit ── */}
                          <TableCell>
                            <div className='relative'>
                              <span className='absolute left-2 top-1/2 -translate-y-1/2 text-xs text-green-600 font-semibold select-none'>
                                CR
                              </span>
                              <Input
                                ref={(el) => {
                                  creditInputRefs.current[index] = el;
                                }}
                                type='number'
                                min='0'
                                step='0.01'
                                value={item.creditAmount || ""}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateLineItem(item.id, "creditAmount", val);
                                  if (val > 0)
                                    updateLineItem(item.id, "debitAmount", 0);
                                }}
                                onKeyDown={(e) =>
                                  handleAmountKeyDown(e, index, "credit")
                                }
                                className={`h-9 text-sm pl-9 ${hasDebit ? "opacity-40 cursor-not-allowed bg-gray-50" : "bg-white"}`}
                                placeholder='0.00'
                                disabled={hasDebit}
                              />
                            </div>
                          </TableCell>

                          {/* ── Description ── */}
                          <TableCell>
                            <Input
                              type='text'
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className='h-9 text-sm bg-white'
                              placeholder='Optional line note...'
                            />
                          </TableCell>

                          {/* ── Delete ── */}
                          <TableCell className='sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => removeLineItem(item.id, index)}
                              className='h-8 w-8 p-0 text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity'
                            >
                              <FiTrash2 className='h-4 w-4' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>

                  {/* Totals footer */}
                  <tfoot>
                    <tr className='bg-gray-50 border-t-2 border-gray-300 font-semibold text-sm'>
                      <td
                        colSpan={3}
                        className='px-4 py-2 text-right text-gray-700'
                      >
                        Totals:
                      </td>
                      <td className='px-4 py-2 text-blue-700'>
                        {new Intl.NumberFormat("en-US").format(totalDebit)}
                      </td>
                      <td className='px-4 py-2 text-green-700'>
                        {new Intl.NumberFormat("en-US").format(totalCredit)}
                      </td>
                      <td colSpan={2} className='px-4 py-2'>
                        {!balanced && (
                          <span className='text-xs text-red-600 font-medium'>
                            Diff:{" "}
                            {new Intl.NumberFormat("en-US").format(
                              Math.abs(difference),
                            )}{" "}
                            ({difference > 0 ? "DR>" : "CR>"})
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </div>

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addLineItem}
              className='flex items-center gap-2 mt-3'
            >
              <FiPlus className='h-4 w-4' /> Add Line
            </Button>
          </div>

          {/* ── SUMMARY ──────────────────────────────────────────────────────────────── */}
          <div
            className={`border rounded-lg p-4 ${balanced ? "bg-gradient-to-r from-blue-50 to-green-50 border-blue-200" : "bg-red-50 border-red-300"}`}
          >
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600'>Total Lines</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {lineItems.length}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-blue-600 font-semibold'>
                  Total Debit (DR)
                </p>
                <p className='text-lg font-bold text-blue-700'>
                  {new Intl.NumberFormat("en-US").format(totalDebit)}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-green-600 font-semibold'>
                  Total Credit (CR)
                </p>
                <p className='text-lg font-bold text-green-700'>
                  {new Intl.NumberFormat("en-US").format(totalCredit)}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600'>Difference</p>
                <p
                  className={`text-lg font-bold ${balanced ? "text-green-700" : "text-red-600"}`}
                >
                  {new Intl.NumberFormat("en-US").format(Math.abs(difference))}
                  {balanced ? (
                    <span className='text-xs ml-1'>✓</span>
                  ) : (
                    <span className='text-xs ml-1 text-red-500'>
                      ({difference > 0 ? "DR>" : "CR>"})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!balanced && (
              <div className='mt-3 pt-3 border-t border-red-300'>
                <p className='text-xs text-red-700 font-medium'>
                  ⚠ Voucher is not balanced. Adjust Debit or Credit amounts
                  before saving.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => handleAddEdit(null)}
          disabled={isSubmitting}
          className='gap-2'
        >
          <FiX className='h-4 w-4' /> Cancel
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting || lineItems.length === 0}
          className='bg-blue-600 hover:bg-blue-700 gap-2'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />{" "}
              Submitting...
            </>
          ) : (
            <>
              <FiSave className='h-4 w-4' />
              {type === "edit" ? "Update Voucher" : "Post Voucher"}
              <kbd className='ml-2 px-1.5 py-0.5 text-xs bg-blue-800 text-white rounded'>
                Ctrl+Enter
              </kbd>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
