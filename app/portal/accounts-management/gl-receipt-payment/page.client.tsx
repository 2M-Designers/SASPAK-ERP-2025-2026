"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAuthHeaders, getBaseUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AppLoader from "@/components/app-loader";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FiArrowLeft,
  FiFilePlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiDownload,
  FiPlus,
  FiMinus,
  FiCheckCircle,
  FiLoader,
  FiFileText,
  FiSend,
  FiList,
} from "react-icons/fi";
import { AlertCircle, CreditCard } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

// ─── Types ────────────────────────────────────────────────────────────────────

type Currency = {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  isDefault: boolean;
};

type Party = { partyId: number; partyCode: string; partyName: string };
type Job = {
  jobId: number;
  jobNumber: string;
  terminalPartyId: number | null;
  principalId: number | null;
  consigneePartyId: number | null;
  jobInvoiceExchRate: number | null;
};
type ChargeMaster = {
  chargesMasterId: number;
  chargesCode: string;
  chargesName: string;
};
type GlAccount = {
  accountId: number;
  accountCode: string;
  accountName: string;
  isHeader: boolean;
};
type CostCenter = {
  costCenterId: number;
  costCenterCode: string;
  costCenterName: string;
};

type ReceiptPaymentDetail = {
  glreceiptPaymentDetailId: number;
  glreceiptPaymentId: number;
  chargesId: number;
  cost: number;
  amount: number;
  qty: number;
  exchangeRate: number;
  currencyId: number;
  costLc: number;
  amountLc: number;
  tax: number;
  taxFc: number;
  discount: number;
  discountFc: number;
  netAmount: number;
  netAmountFc: number;
  fromCoaId: number;
  toCoaId: number;
  costCenterId: number | null;
  glInvoiceId: number | null;
  glbillId: number | null;
  version: number;
};

type ReceiptPayment = {
  glreceiptPaymentId: number;
  receiptPaymentDate: string;
  receiptPaymentNumber: string;
  jobId: number | null;
  receiptPaymentType: number;
  receiptPaymentAmount: number;
  receiptPaymentAmountFc: number;
  exchangeRate: number;
  currencyId: number;
  totalTax: number;
  totalTaxFc: number;
  discountTotal: number;
  discountTotalFc: number;
  partialReceiptPayment: number;
  totalAmount: number;
  totalAmountFc: number;
  payToPartyId: number;
  receiptPaymentStatus: string;
  receiptPaymentDescription: string;
  glVoucherId: number | null;
  version: number;
  glreceiptPaymentDetails: ReceiptPaymentDetail[];
  payToParty?: { partyId: number; partyName: string; partyCode: string };
  currency?: { currencyId: number; currencyCode: string };
  job?: { jobId: number; jobNumber: string };
  glVoucher?: { glvoucherId: number; voucherNumber?: string } | null;
};

type DetailRow = {
  _key: string;
  glreceiptPaymentDetailId: number;
  chargesId: number;
  cost: number;
  qty: number;
  exchangeRate: number;
  currencyId: number;
  tax: number;
  discount: number;
  fromCoaId: number;
  toCoaId: number;
  costCenterId: number | null;
  glInvoiceId: number | null;
  glbillId: number | null;
  version: number;
};

type MasterForm = {
  receiptPaymentDate: string;
  receiptPaymentNumber: string;
  jobId: number | null;
  payToPartyId: number | null;
  receiptPaymentType: number;
  currencyId: number | null;
  exchangeRate: number;
  receiptPaymentStatus: string;
  receiptPaymentDescription: string;
  partialReceiptPayment: number;
};

type TypeOption = { value: string; label: string };
type GlVoucherLookup = { voucherId: number; voucherNumber: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const computeRow = (row: DetailRow) => {
  const amount = row.cost * row.qty;
  const costLc = row.cost * row.exchangeRate;
  const amountLc = amount * row.exchangeRate;
  const netAmount = amount + row.tax - row.discount;
  const netAmountFc = netAmount * row.exchangeRate;
  return {
    amount,
    costLc,
    amountLc,
    taxFc: row.tax * row.exchangeRate,
    discountFc: row.discount * row.exchangeRate,
    netAmount,
    netAmountFc,
  };
};

const blankRow = (exRate: number, currencyId: number): DetailRow => ({
  _key: Math.random().toString(36).slice(2),
  glreceiptPaymentDetailId: 0,
  chargesId: 0,
  cost: 0,
  qty: 1,
  exchangeRate: exRate,
  currencyId,
  tax: 0,
  discount: 0,
  fromCoaId: 0,
  toCoaId: 0,
  costCenterId: null,
  glInvoiceId: null,
  glbillId: null,
  version: 1,
});

const mapRecord = (it: any): ReceiptPayment => ({
  glreceiptPaymentId: it.glreceiptPaymentId ?? it.GlreceiptPaymentId ?? 0,
  receiptPaymentDate: it.receiptPaymentDate ?? it.ReceiptPaymentDate ?? "",
  receiptPaymentNumber: it.receiptPaymentNumber ?? it.ReceiptPaymentNumber ?? "",
  jobId: it.jobId ?? it.JobId ?? null,
  receiptPaymentType: it.receiptPaymentType ?? it.ReceiptPaymentType ?? 1,
  receiptPaymentAmount: it.receiptPaymentAmount ?? it.ReceiptPaymentAmount ?? 0,
  receiptPaymentAmountFc: it.receiptPaymentAmountFc ?? it.ReceiptPaymentAmountFc ?? 0,
  exchangeRate: it.exchangeRate ?? it.ExchangeRate ?? 1,
  currencyId: it.currencyId ?? it.CurrencyId ?? 0,
  totalTax: it.totalTax ?? it.TotalTax ?? 0,
  totalTaxFc: it.totalTaxFc ?? it.TotalTaxFc ?? 0,
  discountTotal: it.discountTotal ?? it.DiscountTotal ?? 0,
  discountTotalFc: it.discountTotalFc ?? it.DiscountTotalFc ?? 0,
  partialReceiptPayment: it.partialReceiptPayment ?? it.PartialReceiptPayment ?? 0,
  totalAmount: it.totalAmount ?? it.TotalAmount ?? 0,
  totalAmountFc: it.totalAmountFc ?? it.TotalAmountFc ?? 0,
  payToPartyId: it.payToPartyId ?? it.PayToPartyId ?? 0,
  receiptPaymentStatus: it.receiptPaymentStatus ?? it.ReceiptPaymentStatus ?? "",
  receiptPaymentDescription: it.receiptPaymentDescription ?? it.ReceiptPaymentDescription ?? "",
  glVoucherId: it.glVoucherId ?? it.GlVoucherId ?? null,
  version: it.version ?? it.Version ?? 1,
  glreceiptPaymentDetails: [],
  payToParty: it.payToParty ?? undefined,
  currency: it.currency ?? undefined,
  job: it.job ?? undefined,
  glVoucher: it.glVoucher ?? it.GlVoucher ?? null,
});

const mapDetail = (d: any): ReceiptPaymentDetail => ({
  glreceiptPaymentDetailId: d.glreceiptPaymentDetailId ?? d.GlreceiptPaymentDetailId ?? 0,
  glreceiptPaymentId: d.glreceiptPaymentId ?? d.GlreceiptPaymentId ?? 0,
  chargesId: d.chargesId ?? d.ChargesId ?? 0,
  cost: d.cost ?? d.Cost ?? 0,
  amount: d.amount ?? d.Amount ?? 0,
  qty: d.qty ?? d.Qty ?? 1,
  exchangeRate: d.exchangeRate ?? d.ExchangeRate ?? 1,
  currencyId: d.currencyId ?? d.CurrencyId ?? 0,
  costLc: d.costLc ?? d.CostLc ?? 0,
  amountLc: d.amountLc ?? d.AmountLc ?? 0,
  tax: d.tax ?? d.Tax ?? 0,
  taxFc: d.taxFc ?? d.TaxFc ?? 0,
  discount: d.discount ?? d.Discount ?? 0,
  discountFc: d.discountFc ?? d.DiscountFc ?? 0,
  netAmount: d.netAmount ?? d.NetAmount ?? 0,
  netAmountFc: d.netAmountFc ?? d.NetAmountFc ?? 0,
  fromCoaId: d.fromCoaId ?? d.FromCoaId ?? d.FromCoAId ?? 0,
  toCoaId: d.toCoaId ?? d.ToCoaId ?? d.ToCoAId ?? 0,
  costCenterId: d.costCenterId ?? d.CostCenterId ?? null,
  glInvoiceId: d.glInvoiceId ?? d.GlInvoiceId ?? null,
  glbillId: d.glbillId ?? d.GlbillId ?? null,
  version: d.version ?? d.Version ?? 1,
});

// ── GetTypeValues helper ──────────────────────────────────────────────────────

const getTypeValues = async (typeName: string): Promise<TypeOption[]> => {
  try {
    const res = await fetch(
      `${getBaseUrl()}General/GetTypeValues?typeName=${typeName}`,
      { headers: { "Content-Type": "application/json" } },
    );
    if (!res.ok) return [];
    const raw = await res.json();
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return Object.entries(raw)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([key, value]) => ({ value: key, label: value as string }));
    }
    if (Array.isArray(raw)) {
      return raw.map((item: any) => ({
        value: item.value ?? item.code ?? item.name,
        label: item.label ?? item.name ?? item.value,
      }));
    }
  } catch {
    // silently fall back to empty
  }
  return [];
};

const statusClass = (s: string) => {
  const v = (s || "").toLowerCase();
  if (v === "processed" || v === "approved") return "bg-green-50 text-green-700 border-green-200";
  if (v === "draft") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (v === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  if (v === "pending") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const typeClass = (t: number) =>
  t === 1
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-violet-50 text-violet-700 border-violet-200";

const isAlreadyApproved = (status: string) =>
  ["approved", "done", "processed"].includes((status || "").toLowerCase());

// ─── Component ────────────────────────────────────────────────────────────────

export default function GLReceiptPaymentClient({ initialData }: { initialData: any[] }) {
  // ── List state ─────────────────────────────────────────────────────────────
  const [data, setData] = useState<ReceiptPayment[]>(() => (initialData ?? []).map(mapRecord));
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // ── Lookup state ───────────────────────────────────────────────────────────
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [charges, setCharges] = useState<ChargeMaster[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [glVouchers, setGlVouchers] = useState<GlVoucherLookup[]>([]);
  const [lookupReady, setLookupReady] = useState(false);

  // ── Dynamic type-value options (from General/GetTypeValues) ────────────────
  const [statusOptions, setStatusOptions] = useState<TypeOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<TypeOption[]>([]);
  const [modeOptions, setModeOptions] = useState<TypeOption[]>([]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReceiptPayment | null>(null);
  const [masterForm, setMasterForm] = useState<MasterForm>({
    receiptPaymentDate: new Date().toISOString().slice(0, 10),
    receiptPaymentNumber: "",
    jobId: null,
    payToPartyId: null,
    receiptPaymentType: 1,
    currencyId: null,
    exchangeRate: 1,
    receiptPaymentStatus: "Draft",
    receiptPaymentDescription: "",
    partialReceiptPayment: 0,
  });
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<ReceiptPayment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReceiptPayment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Approve / BulkPost state ───────────────────────────────────────────────
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [bulkPostOpen, setBulkPostOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<number[]>([]);
  const [bulkRemarks, setBulkRemarks] = useState("");
  const [isBulkPosting, setIsBulkPosting] = useState(false);

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"all" | "receipt" | "payment">("all");

  // ── Inline search for big dropdowns ───────────────────────────────────────
  const [partySearch, setPartySearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [detailSearches, setDetailSearches] = useState<Record<string, string>>({});

  const { toast } = useToast();

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const postList = async (endpoint: string, select: string, where = "", sort = "", pageSize = "2000") => {
    try {
      const res = await fetch(`${getBaseUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ select, where, search: "", sortOn: sort, page: "1", pageSize }),
      });
      if (!res.ok) return [];
      const text = await res.text();
      if (!text) return [];
      const d = JSON.parse(text);
      return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
    } catch {
      return [];
    }
  };

  // ── Fetch list ─────────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await postList(
        "GLReceiptPayment/GetList",
        "GlreceiptPaymentId, ReceiptPaymentDate, ReceiptPaymentNumber, JobId, ReceiptPaymentType, ReceiptPaymentAmount, TotalAmount, PayToPartyId, ReceiptPaymentStatus, ReceiptPaymentDescription, CurrencyId, ExchangeRate, GlVoucherId, Version",
        "",
        "GlreceiptPaymentId DESC",
      );
      setData(rows.map(mapRecord));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load records." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // eslint-disable-line

  // ── Fetch single record ────────────────────────────────────────────────────
  const fetchById = useCallback(async (id: number): Promise<ReceiptPayment | null> => {
    try {
      const res = await fetch(`${getBaseUrl()}GLReceiptPayment/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const raw = await res.json();
      return {
        ...mapRecord(raw),
        glreceiptPaymentDetails: (
          raw.glreceiptPaymentDetails ?? raw.GlreceiptPaymentDetails ?? []
        ).map(mapDetail),
      };
    } catch {
      return null;
    }
  }, []);

  // ── Fetch all lookups ──────────────────────────────────────────────────────
  const fetchLookups = useCallback(async () => {
    try {
      const [currRaw, partyRaw, jobRaw, chargeRaw, acctRaw, ccRaw, statusRaw, typeRaw, voucherRaw, modeRaw] =
        await Promise.all([
          postList("SetupCurrency/GetList", "CurrencyId, CurrencyCode, CurrencyName, Symbol, IsDefault", "", "CurrencyCode ASC"),
          postList("Party/GetList", "PartyId, PartyCode, PartyName", "", "PartyName ASC"),
          postList("Job/GetList", "JobId, JobNumber, TerminalPartyId, PrincipalId, ConsigneePartyId, JobInvoiceExchRate", "", "JobId DESC"),
          postList("ChargesMaster/GetList", "ChargeId, ChargeCode, ChargeName", "", "ChargeName ASC"),
          postList("GlAccount/GetList", "AccountId, AccountCode, AccountName, IsHeader", "", "AccountCode ASC", "9999"),
          postList("CostCenter/GetList", "CostCenterId, CostCenterCode, CostCenterName", "", "CostCenterCode ASC"),
          getTypeValues("Payment_Status"),
          getTypeValues("ReceiptPayment_Type_Ids"),
          postList("GLVoucher/GetList", "VoucherId, VoucherNumber", "", "VoucherId DESC"),
          getTypeValues("ReceiptPayment_Mode_Description"),
        ]);

      const curr: Currency[] = currRaw.map((c: any) => ({
        currencyId: c.currencyId ?? c.CurrencyId ?? 0,
        currencyCode: c.currencyCode ?? c.CurrencyCode ?? "",
        currencyName: c.currencyName ?? c.CurrencyName ?? "",
        symbol: c.symbol ?? c.Symbol ?? "",
        isDefault: c.isDefault ?? c.IsDefault ?? false,
      }));
      setCurrencies(curr);
      setParties(
        partyRaw.map((p: any) => ({
          partyId: p.partyId ?? p.PartyId ?? 0,
          partyCode: p.partyCode ?? p.PartyCode ?? "",
          partyName: p.partyName ?? p.PartyName ?? "",
        })),
      );
      setJobs(
        jobRaw.map((j: any) => ({
          jobId: j.jobId ?? j.JobId ?? 0,
          jobNumber: j.jobNumber ?? j.JobNumber ?? "",
          terminalPartyId: j.terminalPartyId ?? j.TerminalPartyId ?? null,
          principalId: j.principalId ?? j.PrincipalId ?? null,
          consigneePartyId: j.consigneePartyId ?? j.ConsigneePartyId ?? null,
          jobInvoiceExchRate: j.jobInvoiceExchRate ?? j.JobInvoiceExchRate ?? null,
        })),
      );
      setCharges(
        chargeRaw.map((ch: any) => ({
          chargesMasterId: ch.chargeId ?? ch.ChargeId ?? ch.chargesMasterId ?? ch.ChargesMasterId ?? 0,
          chargesCode: ch.chargeCode ?? ch.ChargeCode ?? ch.chargesCode ?? ch.ChargesCode ?? "",
          chargesName: ch.chargeName ?? ch.ChargeName ?? ch.chargesName ?? ch.ChargesName ?? "",
        })),
      );
      setAccounts(
        acctRaw.map((a: any) => ({
          accountId: a.accountId ?? a.AccountId ?? 0,
          accountCode: a.accountCode ?? a.AccountCode ?? "",
          accountName: a.accountName ?? a.AccountName ?? "",
          isHeader: a.isHeader ?? a.IsHeader ?? false,
        })),
      );
      setCostCenters(
        ccRaw.map((cc: any) => ({
          costCenterId: cc.costCenterId ?? cc.CostCenterId ?? 0,
          costCenterCode: cc.costCenterCode ?? cc.CostCenterCode ?? "",
          costCenterName: cc.costCenterName ?? cc.CostCenterName ?? "",
        })),
      );

      if (statusRaw.length) setStatusOptions(statusRaw);
      if (typeRaw.length) setTypeOptions(typeRaw);
      if (modeRaw.length) setModeOptions(modeRaw);
      setGlVouchers(
        voucherRaw.map((v: any) => ({
          voucherId: v.voucherId ?? v.VoucherId ?? 0,
          voucherNumber: v.voucherNumber ?? v.VoucherNumber ?? "",
        })),
      );

      const def =
        curr.find((c) => c.currencyCode === "PKR") ??
        curr.find((c) => c.isDefault) ??
        curr[0];
      if (def) {
        setMasterForm((prev) =>
          prev.currencyId === null ? { ...prev, currencyId: def.currencyId } : prev,
        );
      }
    } catch (err) {
      console.error("Lookup fetch error:", err);
    } finally {
      setLookupReady(true);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchText) return data;
    const q = searchText.toLowerCase();
    return data.filter(
      (r) =>
        (r.receiptPaymentNumber || "").toLowerCase().includes(q) ||
        (r.receiptPaymentStatus || "").toLowerCase().includes(q) ||
        (r.receiptPaymentDescription || "").toLowerCase().includes(q) ||
        String(r.glreceiptPaymentId).includes(q) ||
        String(r.payToPartyId).includes(q) ||
        (r.payToParty?.partyName || "").toLowerCase().includes(q) ||
        (typeLabel(r.receiptPaymentType) || "").toLowerCase().includes(q),
    );
  }, [data, searchText]);

  // ── Tab-filtered list ──────────────────────────────────────────────────────
  const tabFiltered = useMemo(() => {
    if (activeTab === "receipt") return filtered.filter((r) => r.receiptPaymentType === 1);
    if (activeTab === "payment") return filtered.filter((r) => r.receiptPaymentType === 2);
    return filtered;
  }, [filtered, activeTab]);

  // ── Computed rows ──────────────────────────────────────────────────────────
  const computedRows = useMemo(() => detailRows.map((r) => ({ ...r, ...computeRow(r) })), [detailRows]);

  const masterTotals = useMemo(() => {
    const receiptPaymentAmount = computedRows.reduce((s, r) => s + r.amount, 0);
    const totalTax = computedRows.reduce((s, r) => s + r.tax, 0);
    const discountTotal = computedRows.reduce((s, r) => s + r.discount, 0);
    return {
      receiptPaymentAmount,
      totalTax,
      discountTotal,
      totalAmount: receiptPaymentAmount + totalTax - discountTotal,
    };
  }, [computedRows]);

  // ── Filtered dropdowns ─────────────────────────────────────────────────────
  const filteredParties = useMemo(() => {
    const q = partySearch.toLowerCase();
    const base = partySearch
      ? parties.filter((p) => p.partyName.toLowerCase().includes(q) || p.partyCode.toLowerCase().includes(q))
      : parties;
    const sliced = base.slice(0, 150);
    // Always include the currently selected party so SelectValue can display it
    if (masterForm.payToPartyId) {
      const sel = parties.find((p) => p.partyId === masterForm.payToPartyId);
      if (sel && !sliced.find((p) => p.partyId === sel.partyId)) sliced.push(sel);
    }
    return sliced;
  }, [parties, partySearch, masterForm.payToPartyId]);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.toLowerCase();
    const base = jobSearch
      ? jobs.filter((j) => j.jobNumber.toLowerCase().includes(q))
      : jobs;
    const sliced = base.slice(0, 150);
    // Always include the currently selected job so SelectValue can display it
    if (masterForm.jobId) {
      const sel = jobs.find((j) => j.jobId === masterForm.jobId);
      if (sel && !sliced.find((j) => j.jobId === sel.jobId)) sliced.push(sel);
    }
    return sliced;
  }, [jobs, jobSearch, masterForm.jobId]);

  // Transactional accounts only (isHeader = false) for From/To CoA dropdowns
  const transactionalAccounts = useMemo(
    () => accounts.filter((a) => !a.isHeader),
    [accounts],
  );

  // ── Resolved type label (int → string) using API-fetched options ───────────
  const typeLabel = useCallback(
    (typeInt: number): string => {
      // API returns either { "Receipt": "1", ... } or { "1": "Receipt", ... }
      // Check by value first (key is numeric string), then by label parse
      const byKey = typeOptions.find((o) => parseInt(o.value, 10) === typeInt);
      if (byKey) return byKey.label;
      const byLabel = typeOptions.find((o) => parseInt(o.label, 10) === typeInt);
      if (byLabel) return byLabel.value;
      return typeInt === 1 ? "Receipt" : typeInt === 2 ? "Payment" : String(typeInt);
    },
    [typeOptions],
  );

  // ── Open add form ──────────────────────────────────────────────────────────
  const openAdd = () => {
    const def =
      currencies.find((c) => c.currencyCode === "PKR") ??
      currencies.find((c) => c.isDefault) ??
      currencies[0];
    const defaultStatus =
      statusOptions.length ? statusOptions[0].value : "Pending";
    setEditingRecord(null);
    setMasterForm({
      receiptPaymentDate: new Date().toISOString().slice(0, 10),
      receiptPaymentNumber: "",
      jobId: null,
      payToPartyId: null,
      receiptPaymentType: 1,
      currencyId: def?.currencyId ?? null,
      exchangeRate: 1,
      receiptPaymentStatus: defaultStatus,
      receiptPaymentDescription: "",
      partialReceiptPayment: 0,
    });
    setDetailRows([blankRow(1, def?.currencyId ?? 0)]);
    setPartySearch("");
    setJobSearch("");
    setDetailSearches({});
    setShowForm(true);
  };

  // ── Open edit form ─────────────────────────────────────────────────────────
  const openEdit = async (rec: ReceiptPayment) => {
    setIsLoading(true);
    const full = await fetchById(rec.glreceiptPaymentId);
    setIsLoading(false);
    if (!full) {
      toast({ variant: "destructive", title: "Error", description: "Could not load record." });
      return;
    }
    setEditingRecord(full);
    setMasterForm({
      receiptPaymentDate: full.receiptPaymentDate?.slice(0, 10) ?? "",
      receiptPaymentNumber: full.receiptPaymentNumber,
      jobId: full.jobId,
      payToPartyId: full.payToPartyId,
      receiptPaymentType: full.receiptPaymentType,
      currencyId: full.currencyId,
      exchangeRate: full.exchangeRate,
      receiptPaymentStatus: full.receiptPaymentStatus,
      receiptPaymentDescription: full.receiptPaymentDescription ?? "",
      partialReceiptPayment: full.partialReceiptPayment ?? 0,
    });
    setDetailRows(
      full.glreceiptPaymentDetails.map((d) => ({
        _key: Math.random().toString(36).slice(2),
        glreceiptPaymentDetailId: d.glreceiptPaymentDetailId,
        chargesId: d.chargesId,
        cost: d.cost,
        qty: d.qty,
        exchangeRate: d.exchangeRate,
        currencyId: d.currencyId,
        tax: d.tax,
        discount: d.discount,
        fromCoaId: d.fromCoaId,
        toCoaId: d.toCoaId,
        costCenterId: d.costCenterId,
        glInvoiceId: d.glInvoiceId,
        glbillId: d.glbillId,
        version: d.version,
      })),
    );
    setPartySearch("");
    setJobSearch("");
    setDetailSearches({});
    setShowForm(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!masterForm.payToPartyId) {
      toast({ variant: "destructive", title: "Validation", description: "Pay To Party is required." });
      return;
    }
    if (!masterForm.currencyId) {
      toast({ variant: "destructive", title: "Validation", description: "Currency is required." });
      return;
    }
    if (detailRows.length === 0) {
      toast({ variant: "destructive", title: "Validation", description: "At least one line is required." });
      return;
    }
    if (detailRows.some((r) => !r.chargesId || !r.fromCoaId || !r.toCoaId)) {
      toast({ variant: "destructive", title: "Validation", description: "Each line needs Charge, From CoA and To CoA." });
      return;
    }

    const { receiptPaymentAmount, totalTax, discountTotal, totalAmount } = masterTotals;
    const exRate = masterForm.exchangeRate;
    const isEdit = !!editingRecord;

    const payload = {
      GlreceiptPaymentId: editingRecord?.glreceiptPaymentId ?? 0,
      ReceiptPaymentDate: masterForm.receiptPaymentDate,
      ReceiptPaymentNumber: masterForm.receiptPaymentNumber ?? "",
      JobId: masterForm.jobId || null,
      ReceiptPaymentType: masterForm.receiptPaymentType,
      ReceiptPaymentAmount: receiptPaymentAmount,
      ReceiptPaymentAmountFc: receiptPaymentAmount * exRate,
      ExchangeRate: exRate,
      CurrencyId: masterForm.currencyId ?? 0,
      TotalTax: totalTax,
      TotalTaxFc: totalTax * exRate,
      DiscountTotal: discountTotal,
      DiscountTotalFc: discountTotal * exRate,
      PartialReceiptPayment: masterForm.partialReceiptPayment,
      TotalAmount: totalAmount,
      TotalAmountFc: totalAmount * exRate,
      PayToPartyId: masterForm.payToPartyId ?? 0,
      ReceiptPaymentStatus: masterForm.receiptPaymentStatus,
      ReceiptPaymentDescription: masterForm.receiptPaymentDescription ?? "",
      GlVoucherId: editingRecord?.glVoucherId || null,
      Version: editingRecord?.version ?? 1,
      GlreceiptPaymentDetails: computedRows.map((r) => ({
        GlreceiptPaymentDetailId: r.glreceiptPaymentDetailId,
        GlreceiptPaymentId: editingRecord?.glreceiptPaymentId ?? 0,
        ChargesId: r.chargesId,
        Cost: r.cost,
        Amount: r.amount,
        Qty: r.qty,
        ExchangeRate: r.exchangeRate,
        CurrencyId: r.currencyId,
        CostLc: r.costLc,
        AmountLc: r.amountLc,
        Tax: r.tax,
        TaxFc: r.taxFc,
        Discount: r.discount,
        DiscountFc: r.discountFc,
        NetAmount: r.netAmount,
        NetAmountFc: r.netAmountFc,
        FromCoaId: r.fromCoaId,
        ToCoaId: r.toCoaId,
        CostCenterId: r.costCenterId || null,
        GlInvoiceId: r.glInvoiceId || null,
        GlbillId: r.glbillId || null,
        Version: r.version,
      })),
    };

    setIsSaving(true);
    try {
      const res = await fetch(`${getBaseUrl()}GLReceiptPayment`, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const txt = await res.text();
          if (txt) {
            const p = JSON.parse(txt);
            if (p.errors) {
              msg = Object.values(p.errors as Record<string, string[]>).flat().join(", ");
            } else if (p.title) {
              msg = p.title;
            } else if (p.message) {
              msg = p.message;
            } else if (p.detail) {
              msg = p.detail;
            } else if (Array.isArray(p)) {
              msg = p.join(", ");
            } else if (typeof p === "string") {
              msg = p;
            } else {
              msg = txt || msg;
            }
          }
        } catch { /* keep default message */ }
        throw new Error(msg);
      }
      toast({
        title: isEdit ? "Record Updated" : "Record Created",
        description: `${masterForm.receiptPaymentNumber || "Record"} saved successfully.`,
      });
      setShowForm(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${getBaseUrl()}GLReceiptPayment/${deleteTarget.glreceiptPaymentId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setData((prev) => prev.filter((r) => r.glreceiptPaymentId !== deleteTarget.glreceiptPaymentId));
      toast({ title: "Deleted", description: `${deleteTarget.receiptPaymentNumber || `Record #${deleteTarget.glreceiptPaymentId}`} removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete record." });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── View ───────────────────────────────────────────────────────────────────
  const handleView = async (rec: ReceiptPayment) => {
    setIsLoading(true);
    const full = await fetchById(rec.glreceiptPaymentId);
    setIsLoading(false);
    setViewRecord(full ?? rec);
    setViewOpen(true);
  };

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (rec: ReceiptPayment) => {
    setApprovingId(rec.glreceiptPaymentId);
    try {
      const res = await fetch(
        `${getBaseUrl()}GLReceiptPayment/Approve?TransactionId=${rec.glreceiptPaymentId}`,
        { method: "PUT", headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      toast({ title: "Approved", description: `${rec.receiptPaymentNumber || `#${rec.glreceiptPaymentId}`} approved.` });
      fetchRecords();
    } catch {
      toast({ variant: "destructive", title: "Approve Failed", description: "Could not approve record." });
    } finally {
      setApprovingId(null);
    }
  };

  // ── Bulk Post ──────────────────────────────────────────────────────────────
  const openBulkPost = () => {
    setBulkSelectedIds(
      data
        .filter((r) => (r.receiptPaymentStatus || "").toLowerCase() !== "processed")
        .map((r) => r.glreceiptPaymentId),
    );
    setBulkRemarks("");
    setBulkPostOpen(true);
  };

  const handleBulkPost = async () => {
    if (bulkSelectedIds.length === 0) {
      toast({ variant: "destructive", title: "Validation", description: "Select at least one record." });
      return;
    }
    setIsBulkPosting(true);
    try {
      const res = await fetch(`${getBaseUrl()}GLReceiptPayment/BulkPostReceiptPayment`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bulkIds: bulkSelectedIds,
          status: "Processed",
          anyId1: 0,
          anyId: 0,
          anyString: "",
          remarks: bulkRemarks,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      toast({ title: "Bulk Post Successful", description: `${bulkSelectedIds.length} record(s) posted.` });
      setBulkPostOpen(false);
      fetchRecords();
    } catch {
      toast({ variant: "destructive", title: "Bulk Post Failed", description: "Could not post records." });
    } finally {
      setIsBulkPosting(false);
    }
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const handlePDF = useCallback(
    (rec: ReceiptPayment) => {
      try {
        const doc = new jsPDF("portrait", "mm", "a4");
        const W = doc.internal.pageSize.getWidth();
        const typeName = typeLabel(rec.receiptPaymentType);

        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, W, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(17);
        doc.setFont("helvetica", "bold");
        doc.text(`GL ${typeName.toUpperCase()}`, 14, 13);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Printed: ${moment().format("DD MMM YYYY, HH:mm")}`, W - 14, 13, { align: "right" });

        const sv = (rec.receiptPaymentStatus || "").toLowerCase();
        const sc: [number, number, number] =
          sv === "processed" || sv === "approved"
            ? [22, 163, 74]
            : sv === "cancelled"
            ? [220, 38, 38]
            : [202, 138, 4];
        doc.setFillColor(...sc);
        doc.roundedRect(W - 54, 17, 40, 8, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(rec.receiptPaymentStatus || "—", W - 34, 22.5, { align: "center" });

        doc.setTextColor(20, 20, 20);
        let y = 38;
        const info = (label: string, value: string, x: number, cy: number) => {
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text(label.toUpperCase(), x, cy);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(20, 20, 20);
          doc.setFontSize(9);
          doc.text(value || "—", x, cy + 5);
        };
        info("Receipt/Payment No", rec.receiptPaymentNumber || "—", 14, y);
        info("Date", rec.receiptPaymentDate ? moment(rec.receiptPaymentDate).format("DD MMM YYYY") : "—", 75, y);
        info("Type", typeName, 140, y);
        y += 14;
        const party = parties.find((p) => p.partyId === rec.payToPartyId);
        info("Pay To Party", party?.partyName || `Party #${rec.payToPartyId}`, 14, y);
        const job = jobs.find((j) => j.jobId === rec.jobId);
        info("Job", job?.jobNumber || (rec.jobId ? `#${rec.jobId}` : "—"), 75, y);
        info("Status", rec.receiptPaymentStatus || "—", 140, y);
        y += 14;

        if (rec.receiptPaymentDescription) {
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text("DESCRIPTION", 14, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(20, 20, 20);
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(rec.receiptPaymentDescription, W - 28);
          doc.text(lines, 14, y + 5);
          y += 5 + lines.length * 5;
        }

        y += 4;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(14, y, W - 14, y);
        y += 6;

        const details = rec.glreceiptPaymentDetails || [];
        autoTable(doc, {
          startY: y,
          head: [["#", "Charge", "Cost", "Qty", "Amount", "Tax", "Discount", "Net Amount"]],
          body: details.map((d, i) => {
            const ch = charges.find((c) => c.chargesMasterId === d.chargesId);
            return [
              i + 1,
              ch?.chargesName || `Charge #${d.chargesId}`,
              fmt(d.cost),
              d.qty,
              fmt(d.amount),
              fmt(d.tax),
              fmt(d.discount),
              fmt(d.netAmount),
            ];
          }),
          foot: [
            [
              "",
              "",
              "",
              { content: "TOTALS", styles: { fontStyle: "bold", halign: "right" } },
              fmt(details.reduce((s, d) => s + d.amount, 0)),
              fmt(details.reduce((s, d) => s + d.tax, 0)),
              fmt(details.reduce((s, d) => s + d.discount, 0)),
              {
                content: fmt(details.reduce((s, d) => s + d.netAmount, 0)),
                styles: { fontStyle: "bold", textColor: [30, 64, 175] },
              },
            ],
          ],
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, cellPadding: 3 },
          footStyles: { fillColor: [241, 245, 249], fontSize: 8, cellPadding: 3 },
          bodyStyles: { fontSize: 8, cellPadding: 2.5 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            1: { cellWidth: 45 },
            2: { cellWidth: 22, halign: "right" },
            3: { cellWidth: 12, halign: "center" },
            4: { cellWidth: 25, halign: "right" },
            5: { cellWidth: 20, halign: "right" },
            6: { cellWidth: 22, halign: "right" },
            7: { cellWidth: 25, halign: "right" },
          },
          margin: { left: 14, right: 14 },
        });

        const fy = (doc as any).lastAutoTable.finalY + 6;
        const summaryRows: [string, string, boolean][] = [
          [`${typeName} Amount`, fmt(rec.receiptPaymentAmount), false],
          ["Total Tax", fmt(rec.totalTax), false],
          ["Discount Total", `(${fmt(rec.discountTotal)})`, false],
          ["Partial Receipt Payment", fmt(rec.partialReceiptPayment), false],
          ["TOTAL AMOUNT", fmt(rec.totalAmount), true],
        ];
        let sy = fy;
        summaryRows.forEach(([label, value, bold]) => {
          if (bold) {
            doc.setFillColor(30, 64, 175);
            doc.rect(W - 90, sy - 4, 76, 9, "F");
            doc.setTextColor(255, 255, 255);
          } else {
            doc.setTextColor(60, 60, 60);
          }
          doc.setFontSize(bold ? 9 : 8);
          doc.setFont("helvetica", bold ? "bold" : "normal");
          doc.text(label + ":", W - 88, sy + 1);
          doc.text(value, W - 14, sy + 1, { align: "right" });
          sy += 9;
        });

        const sigY = sy + 14;
        ["Prepared By", "Checked By", "Approved By"].forEach((label, i) => {
          const sx = 14 + i * 62;
          doc.setDrawColor(150, 150, 150);
          doc.setLineWidth(0.3);
          doc.line(sx, sigY + 14, sx + 52, sigY + 14);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text(label.toUpperCase(), sx + 26, sigY + 20, { align: "center" });
        });

        const pH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text("System generated document.", 14, pH - 8);
        doc.text(`Generated: ${moment().format("DD MMM YYYY HH:mm")}`, W - 14, pH - 8, { align: "right" });

        doc.save(`${typeName}_${rec.receiptPaymentNumber || rec.glreceiptPaymentId}_${moment().format("YYYYMMDD")}.pdf`);
        toast({ title: "PDF Downloaded", description: rec.receiptPaymentNumber || `#${rec.glreceiptPaymentId}` });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
      }
    },
    [charges, parties, jobs, toast],
  );

  const handlePrintFromList = useCallback(
    async (rec: ReceiptPayment) => {
      setIsLoading(true);
      const full = await fetchById(rec.glreceiptPaymentId);
      setIsLoading(false);
      handlePDF(full ?? rec);
    },
    [fetchById, handlePDF],
  );

  // ── Row mutation helpers ───────────────────────────────────────────────────
  const addRow = () => {
    const cid = masterForm.currencyId ?? currencies.find((c) => c.isDefault)?.currencyId ?? 0;
    setDetailRows((p) => [...p, blankRow(masterForm.exchangeRate, cid)]);
  };
  const removeRow = (key: string) => setDetailRows((p) => p.filter((r) => r._key !== key));
  const updateRow = (key: string, patch: Partial<DetailRow>) =>
    setDetailRows((p) => p.map((r) => (r._key === key ? { ...r, ...patch } : r)));

  // ─── FORM VIEW ─────────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className='p-4 bg-gray-50 min-h-screen'>
        <div className='max-w-[1440px] mx-auto space-y-4'>

          {/* Header */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => { setShowForm(false); setEditingRecord(null); }}
                className='gap-1.5'
              >
                <FiArrowLeft className='h-3.5 w-3.5' /> Back
              </Button>
              <div>
                <h1 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <CreditCard className='h-5 w-5 text-blue-600' />
                  {editingRecord ? "Edit GL Receipt/Payment" : "New GL Receipt/Payment"}
                </h1>
                <p className='text-xs text-gray-500 mt-0.5'>
                  Type: {typeLabel(masterForm.receiptPaymentType)}
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => { setShowForm(false); setEditingRecord(null); }}
              >
                Cancel
              </Button>
              <Button
                size='sm'
                onClick={handleSave}
                disabled={isSaving}
                className='bg-blue-600 hover:bg-blue-700 text-white gap-2'
              >
                {isSaving ? (
                  <><FiLoader className='h-3.5 w-3.5 animate-spin' /> Saving...</>
                ) : (
                  <><FiCheckCircle className='h-3.5 w-3.5' /> {editingRecord ? "Update" : "Create"}</>
                )}
              </Button>
            </div>
          </div>

          {/* Master Card */}
          <Card>
            <CardHeader className='py-3 px-4 bg-blue-50 border-b border-blue-100'>
              <CardTitle className='text-sm font-semibold text-blue-900 flex items-center gap-2'>
                <Badge className='bg-blue-600 text-white'>Master</Badge>
                Receipt / Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>

                {/* Date */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Date *</Label>
                  <Input
                    type='date'
                    value={masterForm.receiptPaymentDate}
                    onChange={(e) => setMasterForm((p) => ({ ...p, receiptPaymentDate: e.target.value }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Number — auto-generated by backend */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>
                    Receipt/Payment Number
                    <span className='ml-1.5 text-[10px] text-blue-500 font-normal'>(auto-generated)</span>
                  </Label>
                  <Input
                    type='text'
                    readOnly
                    disabled
                    value={masterForm.receiptPaymentNumber || ""}
                    placeholder={editingRecord ? "—" : "Generated on save"}
                    className='h-9 text-sm bg-gray-50 text-gray-400 cursor-not-allowed'
                  />
                </div>

                {/* Type */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Type *</Label>
                  <Select
                    value={masterForm.receiptPaymentType.toString()}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, receiptPaymentType: parseInt(v, 10) }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue>{typeLabel(masterForm.receiptPaymentType)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1'>{typeLabel(1)}</SelectItem>
                      <SelectItem value='2'>{typeLabel(2)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Status *</Label>
                  <Select
                    value={masterForm.receiptPaymentStatus}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, receiptPaymentStatus: v }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue>
                        {(statusOptions.find((o) => o.value === masterForm.receiptPaymentStatus)?.label) ??
                          (masterForm.receiptPaymentStatus || "Select status...")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(statusOptions.length
                        ? statusOptions
                        : [
                            { value: "Pending", label: "Pending" },
                            { value: "Approved", label: "Approved" },
                            { value: "Done", label: "Done" },
                          ]
                      ).map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pay To Party */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Pay To Party *</Label>
                  <Select
                    value={masterForm.payToPartyId?.toString() ?? ""}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, payToPartyId: v ? parseInt(v, 10) : null }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue>
                        {masterForm.payToPartyId
                          ? (parties.find((p) => p.partyId === masterForm.payToPartyId)?.partyName ?? `Party #${masterForm.payToPartyId}`)
                          : "Select party..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='max-h-[300px] w-[340px]'>
                      <div className='sticky top-0 bg-white p-2 border-b z-50'>
                        <div className='relative'>
                          <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                          <Input
                            placeholder='Search party...'
                            value={partySearch}
                            onChange={(e) => setPartySearch(e.target.value)}
                            className='pl-7 h-7 text-sm'
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className='max-h-[240px] overflow-y-auto'>
                        {filteredParties.map((p) => (
                          <SelectItem key={p.partyId} value={p.partyId.toString()}>
                            <span className='font-medium'>{p.partyName}</span>
                            <span className='ml-1.5 text-xs text-gray-400'>{p.partyCode}</span>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Job */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Job</Label>
                  <Select
                    value={masterForm.jobId?.toString() ?? ""}
                    onValueChange={(v) => {
                      const sel = v ? jobs.find((j) => j.jobId === parseInt(v, 10)) : null;
                      setMasterForm((p) => ({
                        ...p,
                        jobId: sel?.jobId ?? null,
                        payToPartyId:
                          sel?.terminalPartyId ?? sel?.principalId ?? sel?.consigneePartyId ?? p.payToPartyId,
                        exchangeRate: sel?.jobInvoiceExchRate ? sel.jobInvoiceExchRate : p.exchangeRate,
                      }));
                    }}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue>
                        {masterForm.jobId
                          ? (jobs.find((j) => j.jobId === masterForm.jobId)?.jobNumber ?? `Job #${masterForm.jobId}`)
                          : "Select job (optional)..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='max-h-[300px] w-[280px]'>
                      <div className='sticky top-0 bg-white p-2 border-b z-50'>
                        <div className='relative'>
                          <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                          <Input
                            placeholder='Search job...'
                            value={jobSearch}
                            onChange={(e) => setJobSearch(e.target.value)}
                            className='pl-7 h-7 text-sm'
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className='max-h-[240px] overflow-y-auto'>
                        <SelectItem value=''>— No Job —</SelectItem>
                        {filteredJobs.map((j) => (
                          <SelectItem key={j.jobId} value={j.jobId.toString()}>{j.jobNumber}</SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Currency *</Label>
                  <Select
                    value={masterForm.currencyId?.toString() ?? ""}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, currencyId: v ? parseInt(v, 10) : null }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue>
                        {masterForm.currencyId
                          ? (() => {
                              const c = currencies.find((c) => c.currencyId === masterForm.currencyId);
                              return c ? `${c.currencyCode} — ${c.currencyName}` : `Currency #${masterForm.currencyId}`;
                            })()
                          : "Select currency..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.currencyId} value={c.currencyId.toString()}>
                          {c.currencyCode} — {c.currencyName}
                          {c.currencyCode === "PKR" && <span className='ml-1 text-xs text-blue-500'>(default)</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exchange Rate */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Exchange Rate</Label>
                  <Input
                    type='number'
                    step='0.0001'
                    min='0'
                    value={masterForm.exchangeRate}
                    onChange={(e) => setMasterForm((p) => ({ ...p, exchangeRate: parseFloat(e.target.value) || 1 }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Partial Receipt Payment */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Partial Receipt Payment</Label>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    value={masterForm.partialReceiptPayment}
                    onChange={(e) => setMasterForm((p) => ({ ...p, partialReceiptPayment: parseFloat(e.target.value) || 0 }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Description / Mode */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Description / Mode *</Label>
                  <Select
                    value={masterForm.receiptPaymentDescription}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, receiptPaymentDescription: v }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue>
                        {masterForm.receiptPaymentDescription
                          ? (modeOptions.find((o) => o.value === masterForm.receiptPaymentDescription)?.label ??
                             modeOptions.find((o) => o.label === masterForm.receiptPaymentDescription)?.value ??
                             masterForm.receiptPaymentDescription)
                          : "Select mode..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(modeOptions.length
                        ? modeOptions
                        : [
                            { value: "Cash", label: "Cash" },
                            { value: "Cheque", label: "Cheque" },
                            { value: "BankTransfer", label: "Bank Transfer" },
                            { value: "Payorder", label: "Pay Order" },
                            { value: "Adjustment", label: "Adjustment" },
                          ]
                      ).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail Lines */}
          <Card>
            <CardHeader className='py-3 px-4 bg-gray-50 border-b'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-semibold text-gray-800'>
                  Line Items
                  <Badge variant='outline' className='ml-2 text-xs'>{detailRows.length}</Badge>
                </CardTitle>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={addRow}
                  className='gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50'
                >
                  <FiPlus className='h-3.5 w-3.5' /> Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full text-xs border-collapse' style={{ minWidth: "1480px" }}>
                  <thead>
                    <tr className='bg-gray-100 border-b border-gray-200'>
                      {[
                        ["#", "w-8 text-center"],
                        ["Charge *", "min-w-[180px]"],
                        ["Cost *", "min-w-[100px] text-right"],
                        ["Qty *", "w-16 text-right"],
                        ["Amount", "min-w-[100px] text-right bg-blue-50/50"],
                        ["Tax (Amt)", "min-w-[90px] text-right"],
                        ["Discount", "min-w-[90px] text-right"],
                        ["Net Amount", "min-w-[110px] text-right bg-blue-50/50"],
                        ["From CoA *", "min-w-[160px]"],
                        ["To CoA *", "min-w-[160px]"],
                        ["Currency", "min-w-[110px]"],
                        ["Ex. Rate", "w-20 text-right"],
                        ["Cost Center", "min-w-[130px]"],
                        ["", "w-8"],
                      ].map(([label, cls]) => (
                        <th key={label} className={`px-3 py-2 font-semibold text-gray-600 text-left ${cls}`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.length === 0 ? (
                      <tr>
                        <td colSpan={14} className='px-4 py-10 text-center text-gray-400 italic text-sm'>
                          No lines added. Click "Add Line" to start.
                        </td>
                      </tr>
                    ) : (
                      detailRows.map((row, idx) => {
                        const c = computeRow(row);
                        return (
                          <tr key={row._key} className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                            <td className='px-3 py-1.5 text-center text-gray-400'>{idx + 1}</td>

                            {/* Charge */}
                            <td className='px-1.5 py-1'>
                              <Select
                                value={row.chargesId ? row.chargesId.toString() : ""}
                                onValueChange={(v) => updateRow(row._key, { chargesId: parseInt(v, 10) })}
                              >
                                <SelectTrigger className='h-7 text-xs bg-white'>
                                  <SelectValue>
                                    {row.chargesId
                                      ? (charges.find((ch) => ch.chargesMasterId === row.chargesId)?.chargesName ?? `Charge #${row.chargesId}`)
                                      : "Select charge..."}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className='max-h-[260px]'>
                                  <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                    <Input
                                      placeholder='Search charge...'
                                      value={detailSearches[`${row._key}_charge`] ?? ""}
                                      onChange={(e) => setDetailSearches((p) => ({ ...p, [`${row._key}_charge`]: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className='h-6 text-xs'
                                    />
                                  </div>
                                  {charges
                                    .filter((ch) => {
                                      const q = (detailSearches[`${row._key}_charge`] ?? "").toLowerCase();
                                      return !q || ch.chargesName.toLowerCase().includes(q) || ch.chargesCode.toLowerCase().includes(q);
                                    })
                                    .map((ch) => (
                                      <SelectItem key={ch.chargesMasterId} value={ch.chargesMasterId.toString()}>
                                        {ch.chargesName}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Cost */}
                            <td className='px-1.5 py-1'>
                              <Input
                                type='number'
                                step='0.01'
                                min='0'
                                value={row.cost || ""}
                                placeholder='0.00'
                                onChange={(e) => updateRow(row._key, { cost: parseFloat(e.target.value) || 0 })}
                                className='h-7 text-xs text-right'
                              />
                            </td>

                            {/* Qty */}
                            <td className='px-1.5 py-1'>
                              <Input
                                type='number'
                                min='1'
                                step='1'
                                value={row.qty || ""}
                                onChange={(e) => updateRow(row._key, { qty: parseInt(e.target.value) || 1 })}
                                className='h-7 text-xs text-right'
                              />
                            </td>

                            {/* Amount (computed) */}
                            <td className='px-3 py-1.5 text-right font-semibold text-gray-800 bg-blue-50/30'>
                              {fmt(c.amount)}
                            </td>

                            {/* Tax */}
                            <td className='px-1.5 py-1'>
                              <Input
                                type='number'
                                step='0.01'
                                min='0'
                                value={row.tax || ""}
                                placeholder='0.00'
                                onChange={(e) => updateRow(row._key, { tax: parseFloat(e.target.value) || 0 })}
                                className='h-7 text-xs text-right'
                              />
                            </td>

                            {/* Discount */}
                            <td className='px-1.5 py-1'>
                              <Input
                                type='number'
                                step='0.01'
                                min='0'
                                value={row.discount || ""}
                                placeholder='0.00'
                                onChange={(e) => updateRow(row._key, { discount: parseFloat(e.target.value) || 0 })}
                                className='h-7 text-xs text-right'
                              />
                            </td>

                            {/* Net Amount (computed) */}
                            <td className='px-3 py-1.5 text-right font-bold text-blue-700 bg-blue-50/30'>
                              {fmt(c.netAmount)}
                            </td>

                            {/* From CoA */}
                            <td className='px-1.5 py-1'>
                              <Select
                                value={row.fromCoaId ? row.fromCoaId.toString() : ""}
                                onValueChange={(v) => updateRow(row._key, { fromCoaId: parseInt(v, 10) })}
                              >
                                <SelectTrigger className='h-7 text-xs bg-white'>
                                  <SelectValue>
                                    {row.fromCoaId
                                      ? (() => {
                                          const a = accounts.find((a) => a.accountId === row.fromCoaId);
                                          return a ? `${a.accountCode} — ${a.accountName}` : `#${row.fromCoaId}`;
                                        })()
                                      : "From CoA..."}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className='max-h-[280px] w-[320px]'>
                                  <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                    <Input
                                      placeholder='Search account...'
                                      value={detailSearches[`${row._key}_fromCoa`] ?? ""}
                                      onChange={(e) => setDetailSearches((p) => ({ ...p, [`${row._key}_fromCoa`]: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className='h-6 text-xs'
                                    />
                                  </div>
                                  {transactionalAccounts
                                    .filter((a) => {
                                      const q = (detailSearches[`${row._key}_fromCoa`] ?? "").toLowerCase();
                                      return !q || a.accountCode.toLowerCase().includes(q) || a.accountName.toLowerCase().includes(q);
                                    })
                                    .map((a) => (
                                      <SelectItem key={a.accountId} value={a.accountId.toString()}>
                                        <span className='font-mono text-blue-600 mr-1.5 text-[11px]'>{a.accountCode}</span>
                                        {a.accountName}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* To CoA */}
                            <td className='px-1.5 py-1'>
                              <Select
                                value={row.toCoaId ? row.toCoaId.toString() : ""}
                                onValueChange={(v) => updateRow(row._key, { toCoaId: parseInt(v, 10) })}
                              >
                                <SelectTrigger className='h-7 text-xs bg-white'>
                                  <SelectValue>
                                    {row.toCoaId
                                      ? (() => {
                                          const a = accounts.find((a) => a.accountId === row.toCoaId);
                                          return a ? `${a.accountCode} — ${a.accountName}` : `#${row.toCoaId}`;
                                        })()
                                      : "To CoA..."}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className='max-h-[280px] w-[320px]'>
                                  <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                    <Input
                                      placeholder='Search account...'
                                      value={detailSearches[`${row._key}_toCoa`] ?? ""}
                                      onChange={(e) => setDetailSearches((p) => ({ ...p, [`${row._key}_toCoa`]: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className='h-6 text-xs'
                                    />
                                  </div>
                                  {transactionalAccounts
                                    .filter((a) => {
                                      const q = (detailSearches[`${row._key}_toCoa`] ?? "").toLowerCase();
                                      return !q || a.accountCode.toLowerCase().includes(q) || a.accountName.toLowerCase().includes(q);
                                    })
                                    .map((a) => (
                                      <SelectItem key={a.accountId} value={a.accountId.toString()}>
                                        <span className='font-mono text-blue-600 mr-1.5 text-[11px]'>{a.accountCode}</span>
                                        {a.accountName}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Currency */}
                            <td className='px-1.5 py-1'>
                              <Select
                                value={row.currencyId ? row.currencyId.toString() : ""}
                                onValueChange={(v) => updateRow(row._key, { currencyId: parseInt(v, 10) })}
                              >
                                <SelectTrigger className='h-7 text-xs bg-white'>
                                  <SelectValue>
                                    {row.currencyId
                                      ? (currencies.find((c) => c.currencyId === row.currencyId)?.currencyCode ?? `#${row.currencyId}`)
                                      : "CCY"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((c) => (
                                    <SelectItem key={c.currencyId} value={c.currencyId.toString()}>
                                      {c.currencyCode}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Exchange Rate */}
                            <td className='px-1.5 py-1'>
                              <Input
                                type='number'
                                step='0.0001'
                                min='0'
                                value={row.exchangeRate || ""}
                                onChange={(e) => updateRow(row._key, { exchangeRate: parseFloat(e.target.value) || 1 })}
                                className='h-7 text-xs text-right'
                              />
                            </td>

                            {/* Cost Center */}
                            <td className='px-1.5 py-1'>
                              <Select
                                value={row.costCenterId?.toString() ?? ""}
                                onValueChange={(v) => updateRow(row._key, { costCenterId: v ? parseInt(v, 10) : null })}
                              >
                                <SelectTrigger className='h-7 text-xs bg-white'>
                                  <SelectValue>
                                    {row.costCenterId
                                      ? (costCenters.find((cc) => cc.costCenterId === row.costCenterId)?.costCenterName ?? `#${row.costCenterId}`)
                                      : "— None —"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className='max-h-[260px]'>
                                  <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                    <Input
                                      placeholder='Search cost center...'
                                      value={detailSearches[`${row._key}_cc`] ?? ""}
                                      onChange={(e) => setDetailSearches((p) => ({ ...p, [`${row._key}_cc`]: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className='h-6 text-xs'
                                    />
                                  </div>
                                  <SelectItem value=''>— None —</SelectItem>
                                  {costCenters
                                    .filter((cc) => {
                                      const q = (detailSearches[`${row._key}_cc`] ?? "").toLowerCase();
                                      return !q || cc.costCenterName.toLowerCase().includes(q) || cc.costCenterCode.toLowerCase().includes(q);
                                    })
                                    .map((cc) => (
                                      <SelectItem key={cc.costCenterId} value={cc.costCenterId.toString()}>
                                        {cc.costCenterName}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Remove */}
                            <td className='px-2 py-1 text-center'>
                              <button
                                onClick={() => removeRow(row._key)}
                                className='p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors'
                                title='Remove line'
                              >
                                <FiMinus className='h-3.5 w-3.5' />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {detailRows.length > 0 && (
                    <tfoot>
                      <tr className='bg-blue-50 border-t-2 border-blue-200'>
                        <td colSpan={4} className='px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wide'>
                          Totals
                        </td>
                        <td className='px-3 py-2 text-right text-sm font-bold text-gray-800'>
                          {fmt(masterTotals.receiptPaymentAmount)}
                        </td>
                        <td className='px-3 py-2 text-right text-sm font-semibold text-amber-700'>
                          {fmt(masterTotals.totalTax)}
                        </td>
                        <td className='px-3 py-2 text-right text-sm font-semibold text-red-600'>
                          {fmt(masterTotals.discountTotal)}
                        </td>
                        <td className='px-3 py-2 text-right text-sm font-bold text-blue-800'>
                          {fmt(masterTotals.totalAmount)}
                        </td>
                        <td colSpan={6}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary + actions */}
          <Card className='border-blue-200'>
            <CardContent className='p-4'>
              <div className='flex items-end justify-between gap-4'>
                <div className='flex-1' />
                <div className='w-72 space-y-1.5 text-sm'>
                  {[
                    ["Amount", fmt(masterTotals.receiptPaymentAmount), "text-gray-700"],
                    ["Total Tax", fmt(masterTotals.totalTax), "text-amber-700"],
                    ["Discount Total", `(${fmt(masterTotals.discountTotal)})`, "text-red-600"],
                    ["Partial Receipt Payment", fmt(masterForm.partialReceiptPayment), "text-gray-600"],
                  ].map(([label, value, cls]) => (
                    <div key={label} className='flex justify-between text-gray-500'>
                      <span>{label}</span><span className={cls}>{value}</span>
                    </div>
                  ))}
                  <div className='flex justify-between pt-2 border-t border-blue-200 text-base font-bold'>
                    <span className='text-blue-800'>Total Amount</span>
                    <span className='text-blue-800'>{fmt(masterTotals.totalAmount)}</span>
                  </div>
                </div>
              </div>
              <div className='flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100'>
                <Button variant='outline' onClick={() => { setShowForm(false); setEditingRecord(null); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className='bg-blue-600 hover:bg-blue-700 text-white gap-2'
                >
                  {isSaving ? (
                    <><FiLoader className='h-4 w-4 animate-spin' /> Saving...</>
                  ) : (
                    <><FiCheckCircle className='h-4 w-4' /> {editingRecord ? "Update" : "Create"}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto space-y-4'>

        {/* Page header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
              <CreditCard className='h-6 w-6 text-blue-600' />
              GL Receipt & Payment
            </h1>
            <p className='text-sm text-gray-500 mt-0.5'>Manage receipts and payments</p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={fetchRecords} disabled={isLoading} className='gap-1.5'>
              <FiRefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant='outline' size='sm' onClick={openBulkPost} className='gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50'>
              <FiList className='h-3.5 w-3.5' /> Bulk Post
            </Button>
            <Button
              size='sm'
              onClick={openAdd}
              disabled={!lookupReady}
              className='bg-blue-600 hover:bg-blue-700 text-white gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' /> New
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className='flex items-center justify-between'>
            <TabsList className='h-10 gap-1 bg-gray-100 p-1 rounded-lg'>
              <TabsTrigger
                value='all'
                className='gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm px-4'
              >
                All
                <Badge variant='outline' className='text-xs h-5 px-1.5 font-semibold'>
                  {data.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value='receipt'
                className='gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm px-4'
              >
                Receipt
                <Badge
                  className='text-xs h-5 px-1.5 font-semibold bg-emerald-100 text-emerald-700 data-[state=active]:bg-emerald-500 data-[state=active]:text-white border-0'
                  variant='outline'
                >
                  {data.filter((r) => r.receiptPaymentType === 1).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value='payment'
                className='gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm px-4'
              >
                Payment
                <Badge
                  className='text-xs h-5 px-1.5 font-semibold bg-violet-100 text-violet-700 border-0'
                  variant='outline'
                >
                  {data.filter((r) => r.receiptPaymentType === 2).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Search (always visible) */}
            <div className='relative w-72'>
              <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
              <Input
                placeholder='Search number, party, status...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='pl-7 h-9 text-sm'
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  <FiX className='h-3.5 w-3.5' />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {activeTab === "all" && (
              <>
                <Card className='shadow-sm'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Total Records</p>
                    <p className='text-xl font-bold mt-0.5 text-blue-700'>{tabFiltered.length}</p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Receipts</p>
                    <p className='text-xl font-bold mt-0.5 text-emerald-700'>
                      {tabFiltered.filter((r) => r.receiptPaymentType === 1).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Payments</p>
                    <p className='text-xl font-bold mt-0.5 text-violet-700'>
                      {tabFiltered.filter((r) => r.receiptPaymentType === 2).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Grand Total</p>
                    <p className='text-xl font-bold mt-0.5 text-purple-700'>
                      {fmt(tabFiltered.reduce((s, r) => s + r.totalAmount, 0))}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            {activeTab === "receipt" && (
              <>
                <Card className='shadow-sm border-emerald-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Total Receipts</p>
                    <p className='text-xl font-bold mt-0.5 text-emerald-700'>{tabFiltered.length}</p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm border-emerald-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Total Receipt Amount</p>
                    <p className='text-xl font-bold mt-0.5 text-emerald-700'>
                      {fmt(tabFiltered.reduce((s, r) => s + r.totalAmount, 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm border-emerald-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Approved</p>
                    <p className='text-xl font-bold mt-0.5 text-green-700'>
                      {tabFiltered.filter((r) => isAlreadyApproved(r.receiptPaymentStatus)).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm border-emerald-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Pending</p>
                    <p className='text-xl font-bold mt-0.5 text-amber-600'>
                      {tabFiltered.filter((r) => !isAlreadyApproved(r.receiptPaymentStatus)).length}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            {activeTab === "payment" && (
              <>
                <Card className='shadow-sm border-violet-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Total Payments</p>
                    <p className='text-xl font-bold mt-0.5 text-violet-700'>{tabFiltered.length}</p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm border-violet-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Total Payment Amount</p>
                    <p className='text-xl font-bold mt-0.5 text-violet-700'>
                      {fmt(tabFiltered.reduce((s, r) => s + r.totalAmount, 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm border-violet-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Approved</p>
                    <p className='text-xl font-bold mt-0.5 text-green-700'>
                      {tabFiltered.filter((r) => isAlreadyApproved(r.receiptPaymentStatus)).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className='shadow-sm border-violet-100'>
                  <CardContent className='p-3'>
                    <p className='text-xs text-gray-500'>Pending</p>
                    <p className='text-xl font-bold mt-0.5 text-amber-600'>
                      {tabFiltered.filter((r) => !isAlreadyApproved(r.receiptPaymentStatus)).length}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Table */}
          <Card className='shadow-sm'>
            <CardHeader className='py-3 px-4 bg-gray-50 border-b'>
              <CardTitle className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                <FiFileText className='h-4 w-4 text-blue-600' />
                {activeTab === "receipt" ? "Receipts" : activeTab === "payment" ? "Payments" : "Records"}
                <Badge variant='outline' className='text-xs'>{tabFiltered.length}</Badge>
              </CardTitle>
            </CardHeader>

          <CardContent className='p-0'>
            {tabFiltered.length === 0 && !isLoading ? (
              <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
                <AlertCircle className='h-10 w-10 mb-3 text-gray-300' />
                <p className='text-sm font-medium'>No records found</p>
                <p className='text-xs mt-1'>
                  {searchText ? "Try adjusting your search." : "Click 'New' to create a record."}
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-8 text-xs text-center'>#</TableHead>
                      <TableHead className='text-xs'>Actions</TableHead>
                      <TableHead className='text-xs min-w-[130px]'>Number</TableHead>
                      <TableHead className='text-xs min-w-[100px]'>Date</TableHead>
                      {activeTab === "all" && <TableHead className='text-xs min-w-[90px]'>Type</TableHead>}
                      <TableHead className='text-xs min-w-[180px]'>Party</TableHead>
                      <TableHead className='text-xs min-w-[100px]'>Job Order No.</TableHead>
                      <TableHead className='text-xs text-right min-w-[110px]'>Amount</TableHead>
                      <TableHead className='text-xs text-right min-w-[110px]'>Total Amount</TableHead>
                      <TableHead className='text-xs min-w-[100px]'>Status</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className='text-center py-12 text-gray-400'>
                          <FiLoader className='animate-spin inline h-5 w-5 mr-2' />
                          Loading records...
                        </TableCell>
                      </TableRow>
                    ) : (
                      tabFiltered.map((rec, idx) => {
                        const party = parties.find((p) => p.partyId === rec.payToPartyId);
                        const job = jobs.find((j) => j.jobId === rec.jobId);
                        const isApproving = approvingId === rec.glreceiptPaymentId;
                        return (
                          <TableRow key={rec.glreceiptPaymentId} className='hover:bg-gray-50 transition-colors'>
                            <TableCell className='text-center text-xs text-gray-400'>{idx + 1}</TableCell>

                            <TableCell>
                              <div className='flex gap-1'>
                                <button
                                  onClick={() => handleView(rec)}
                                  className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
                                  title='View Details'
                                >
                                  <FiEye size={13} />
                                </button>
                                <button
                                  onClick={() => openEdit(rec)}
                                  className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors'
                                  title='Edit'
                                >
                                  <FiEdit size={13} />
                                </button>
                                <button
                                  onClick={() => handlePrintFromList(rec)}
                                  className='p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors'
                                  title='Download PDF'
                                >
                                  <FiPrinter size={13} />
                                </button>
                                {!isAlreadyApproved(rec.receiptPaymentStatus) && (
                                  <button
                                    onClick={() => handleApprove(rec)}
                                    disabled={isApproving}
                                    className='p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50'
                                    title='Approve'
                                  >
                                    {isApproving ? (
                                      <FiLoader size={13} className='animate-spin' />
                                    ) : (
                                      <FiSend size={13} />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteTarget(rec)}
                                  className='p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors'
                                  title='Delete'
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </div>
                            </TableCell>

                            <TableCell className='text-xs font-medium text-blue-700'>
                              {rec.receiptPaymentNumber || <span className='text-gray-400 italic'>—</span>}
                            </TableCell>

                            <TableCell className='text-xs text-gray-700'>
                              {rec.receiptPaymentDate
                                ? moment(rec.receiptPaymentDate).format("DD MMM YYYY")
                                : "—"}
                            </TableCell>

                            {activeTab === "all" && (
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${typeClass(rec.receiptPaymentType)}`}>
                                  {typeLabel(rec.receiptPaymentType)}
                                </span>
                              </TableCell>
                            )}

                            <TableCell className='text-xs text-gray-700'>
                              {party?.partyName || rec.payToParty?.partyName ||
                                (rec.payToPartyId ? `Party #${rec.payToPartyId}` : "—")}
                            </TableCell>

                            <TableCell className='text-xs text-gray-600'>
                              {job?.jobNumber || rec.job?.jobNumber || (rec.jobId ? `#${rec.jobId}` : <span className='text-gray-300'>—</span>)}
                            </TableCell>

                            <TableCell className='text-xs text-right text-gray-700'>
                              {fmt(rec.receiptPaymentAmount)}
                            </TableCell>
                            <TableCell className='text-xs text-right font-semibold text-blue-800'>
                              {fmt(rec.totalAmount)}
                            </TableCell>

                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusClass(rec.receiptPaymentStatus)}`}>
                                {rec.receiptPaymentStatus || "—"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          </Card>
        </Tabs>
      </div>

      {isLoading && !data.length && <AppLoader />}

      {/* ── View Dialog ── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className='max-w-5xl max-h-[92vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' /> Receipt/Payment Details
            </DialogTitle>
            <DialogDescription>
              {viewRecord?.receiptPaymentNumber || `Record #${viewRecord?.glreceiptPaymentId}`}
              {viewRecord?.receiptPaymentDate && ` | ${moment(viewRecord.receiptPaymentDate).format("DD MMM YYYY")}`}
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <div className='space-y-4'>
              <Card>
                <CardHeader className='py-3 px-4 bg-blue-50 border-b border-blue-100'>
                  <div className='flex items-start justify-between'>
                    <CardTitle className='text-sm font-medium flex items-center gap-2'>
                      <Badge className='bg-blue-600 text-white'>Master</Badge>
                      Receipt/Payment Information
                    </CardTitle>
                    <div className='text-right'>
                      <p className='text-[10px] font-semibold text-blue-500 uppercase tracking-widest'>
                        {viewRecord.receiptPaymentType === 1 ? "Receipt No." : "Payment No."}
                      </p>
                      <p className='text-xl font-bold text-blue-800 leading-tight'>
                        {viewRecord.receiptPaymentNumber || "—"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm'>
                    {(() => {
                      const partyLabel = viewRecord.receiptPaymentType === 1 ? "Received From" : "Paid To";
                      const partyName =
                        viewRecord.payToParty?.partyName ??
                        parties.find((p) => p.partyId === viewRecord.payToPartyId)?.partyName ??
                        (viewRecord.payToPartyId ? `Party #${viewRecord.payToPartyId}` : "—");
                      const jobNum =
                        viewRecord.job?.jobNumber ??
                        jobs.find((j) => j.jobId === viewRecord.jobId)?.jobNumber ??
                        (viewRecord.jobId ? `Job #${viewRecord.jobId}` : "—");
                      const voucherNum =
                        viewRecord.glVoucher?.voucherNumber ??
                        glVouchers.find((v) => v.voucherId === viewRecord.glVoucherId)?.voucherNumber ??
                        (viewRecord.glVoucherId ? `GV-${viewRecord.glVoucherId}` : "—");
                      const currCode =
                        viewRecord.currency?.currencyCode ??
                        currencies.find((c) => c.currencyId === viewRecord.currencyId)?.currencyCode ??
                        (viewRecord.currencyId ? `#${viewRecord.currencyId}` : "—");
                      return [
                        ["Date", viewRecord.receiptPaymentDate ? moment(viewRecord.receiptPaymentDate).format("DD MMM YYYY") : "—"],
                        ["Type", typeLabel(viewRecord.receiptPaymentType)],
                        [partyLabel, partyName],
                        ["Job Order No.", jobNum],
                        ["Currency", currCode],
                        ["Exchange Rate", String(viewRecord.exchangeRate)],
                        ["Amount", fmt(viewRecord.receiptPaymentAmount)],
                        ["Total Tax", fmt(viewRecord.totalTax)],
                        ["Discount Total", fmt(viewRecord.discountTotal)],
                        ["Partial Receipt Payment", fmt(viewRecord.partialReceiptPayment)],
                        ["Total Amount", fmt(viewRecord.totalAmount)],
                        ["GL Voucher No.", voucherNum],
                      ] as [string, string][];
                    })().map(([label, value]) => (
                      <div key={label} className='flex justify-between border-b border-gray-50 pb-1'>
                        <span className='text-gray-500 text-xs'>{label}:</span>
                        <span className='font-medium text-gray-800 text-xs'>{value}</span>
                      </div>
                    ))}
                    <div className='flex justify-between border-b border-gray-50 pb-1'>
                      <span className='text-gray-500 text-xs'>Status:</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusClass(viewRecord.receiptPaymentStatus)}`}>
                        {viewRecord.receiptPaymentStatus || "—"}
                      </span>
                    </div>
                    {viewRecord.receiptPaymentDescription && (
                      <div className='flex justify-between border-b border-gray-50 pb-1'>
                        <span className='text-gray-500 text-xs'>Description / Mode:</span>
                        <span className='font-medium text-gray-800 text-xs'>
                          {modeOptions.find((o) => o.value === viewRecord.receiptPaymentDescription)?.label ??
                           modeOptions.find((o) => o.label === viewRecord.receiptPaymentDescription)?.value ??
                           viewRecord.receiptPaymentDescription}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='py-2 px-4 bg-gray-50'>
                  <CardTitle className='text-sm font-medium flex items-center gap-2'>
                    <Badge variant='outline'>Details</Badge>
                    Line Items ({viewRecord.glreceiptPaymentDetails?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  {viewRecord.glreceiptPaymentDetails?.length ? (
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow className='bg-gray-50'>
                            <TableHead className='text-xs w-8'>#</TableHead>
                            <TableHead className='text-xs'>Charge</TableHead>
                            <TableHead className='text-xs text-right'>Cost</TableHead>
                            <TableHead className='text-xs text-center'>Qty</TableHead>
                            <TableHead className='text-xs text-right'>Amount</TableHead>
                            <TableHead className='text-xs text-right'>Tax</TableHead>
                            <TableHead className='text-xs text-right'>Discount</TableHead>
                            <TableHead className='text-xs text-right'>Net Amount</TableHead>
                            <TableHead className='text-xs'>From CoA</TableHead>
                            <TableHead className='text-xs'>To CoA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewRecord.glreceiptPaymentDetails.map((d, i) => {
                            const ch = charges.find((c) => c.chargesMasterId === d.chargesId);
                            const fromAcc = accounts.find((a) => a.accountId === d.fromCoaId);
                            const toAcc = accounts.find((a) => a.accountId === d.toCoaId);
                            return (
                              <TableRow key={d.glreceiptPaymentDetailId || i}>
                                <TableCell className='text-xs text-gray-400'>{i + 1}</TableCell>
                                <TableCell className='text-xs font-medium text-gray-800'>
                                  {ch?.chargesName || `Charge #${d.chargesId}`}
                                </TableCell>
                                <TableCell className='text-xs text-right text-gray-700'>{fmt(d.cost)}</TableCell>
                                <TableCell className='text-xs text-center text-gray-600'>{d.qty}</TableCell>
                                <TableCell className='text-xs text-right text-gray-700'>{fmt(d.amount)}</TableCell>
                                <TableCell className='text-xs text-right text-amber-600'>{fmt(d.tax)}</TableCell>
                                <TableCell className='text-xs text-right text-red-500'>{fmt(d.discount)}</TableCell>
                                <TableCell className='text-xs text-right font-semibold text-blue-700'>{fmt(d.netAmount)}</TableCell>
                                <TableCell className='text-xs text-gray-600'>
                                  {fromAcc
                                    ? <><span className='font-mono text-blue-600 text-[10px]'>{fromAcc.accountCode}</span> {fromAcc.accountName}</>
                                    : `#${d.fromCoaId}`}
                                </TableCell>
                                <TableCell className='text-xs text-gray-600'>
                                  {toAcc
                                    ? <><span className='font-mono text-blue-600 text-[10px]'>{toAcc.accountCode}</span> {toAcc.accountName}</>
                                    : `#${d.toCoaId}`}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <tfoot>
                          <tr className='bg-gray-50 border-t font-semibold text-xs'>
                            <td colSpan={4} className='px-4 py-2 text-right text-gray-600'>Totals:</td>
                            <td className='px-4 py-2 text-right text-gray-800'>
                              {fmt(viewRecord.glreceiptPaymentDetails.reduce((s, d) => s + d.amount, 0))}
                            </td>
                            <td className='px-4 py-2 text-right text-amber-700'>
                              {fmt(viewRecord.glreceiptPaymentDetails.reduce((s, d) => s + d.tax, 0))}
                            </td>
                            <td className='px-4 py-2 text-right text-red-600'>
                              {fmt(viewRecord.glreceiptPaymentDetails.reduce((s, d) => s + d.discount, 0))}
                            </td>
                            <td className='px-4 py-2 text-right text-blue-800 font-bold'>
                              {fmt(viewRecord.glreceiptPaymentDetails.reduce((s, d) => s + d.netAmount, 0))}
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-400 text-center py-6'>No detail lines available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              className='gap-2'
              onClick={() => { if (viewRecord) handlePDF(viewRecord); }}
            >
              <FiDownload className='h-4 w-4' /> Download PDF
            </Button>
            {viewRecord && !isAlreadyApproved(viewRecord.receiptPaymentStatus) && (
              <Button
                variant='outline'
                className='gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                onClick={() => { if (viewRecord) handleApprove(viewRecord); }}
                disabled={approvingId === viewRecord.glreceiptPaymentId}
              >
                {approvingId === viewRecord.glreceiptPaymentId ? (
                  <FiLoader className='h-4 w-4 animate-spin' />
                ) : (
                  <FiSend className='h-4 w-4' />
                )}
                Approve
              </Button>
            )}
            <Button
              variant='outline'
              className='gap-2 text-green-700 border-green-200 hover:bg-green-50'
              onClick={() => { if (viewRecord) { setViewOpen(false); openEdit(viewRecord); } }}
            >
              <FiEdit className='h-4 w-4' /> Edit
            </Button>
            <Button variant='outline' onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <FiTrash2 className='h-5 w-5' /> Delete Record
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.receiptPaymentNumber || `#${deleteTarget?.glreceiptPaymentId}`}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDelete}
              disabled={isDeleting}
              className='gap-2'
            >
              {isDeleting ? <><FiLoader className='h-4 w-4 animate-spin' /> Deleting...</> : <><FiTrash2 className='h-4 w-4' /> Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Post Dialog ── */}
      <Dialog open={bulkPostOpen} onOpenChange={(o) => { if (!o) setBulkPostOpen(false); }}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiList className='h-5 w-5 text-purple-600' /> Bulk Post Receipt/Payment
            </DialogTitle>
            <DialogDescription>
              Select records to post. All selected records will be marked as Processed.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setBulkSelectedIds(data.map((r) => r.glreceiptPaymentId))}
              >
                Select All
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setBulkSelectedIds([])}
              >
                Clear
              </Button>
              <span className='text-xs text-gray-500'>{bulkSelectedIds.length} selected</span>
            </div>

            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='w-10'>
                      <input
                        type='checkbox'
                        checked={bulkSelectedIds.length === data.length && data.length > 0}
                        onChange={(e) =>
                          setBulkSelectedIds(e.target.checked ? data.map((r) => r.glreceiptPaymentId) : [])
                        }
                        className='rounded'
                      />
                    </TableHead>
                    <TableHead className='text-xs'>Number</TableHead>
                    <TableHead className='text-xs'>Date</TableHead>
                    <TableHead className='text-xs'>Type</TableHead>
                    <TableHead className='text-xs text-right'>Total Amount</TableHead>
                    <TableHead className='text-xs'>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((rec) => (
                    <TableRow key={rec.glreceiptPaymentId} className='hover:bg-gray-50'>
                      <TableCell>
                        <input
                          type='checkbox'
                          checked={bulkSelectedIds.includes(rec.glreceiptPaymentId)}
                          onChange={(e) =>
                            setBulkSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, rec.glreceiptPaymentId]
                                : prev.filter((id) => id !== rec.glreceiptPaymentId),
                            )
                          }
                          className='rounded'
                        />
                      </TableCell>
                      <TableCell className='text-xs font-medium text-blue-700'>
                        {rec.receiptPaymentNumber || `#${rec.glreceiptPaymentId}`}
                      </TableCell>
                      <TableCell className='text-xs text-gray-600'>
                        {rec.receiptPaymentDate ? moment(rec.receiptPaymentDate).format("DD MMM YYYY") : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded border ${typeClass(rec.receiptPaymentType)}`}>
                          {typeLabel(rec.receiptPaymentType)}
                        </span>
                      </TableCell>
                      <TableCell className='text-xs text-right font-semibold text-blue-800'>
                        {fmt(rec.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded border ${statusClass(rec.receiptPaymentStatus)}`}>
                          {rec.receiptPaymentStatus || "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Remarks</Label>
              <Textarea
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                placeholder='Optional remarks for bulk post...'
                className='min-h-[60px] text-sm resize-none'
              />
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setBulkPostOpen(false)} disabled={isBulkPosting}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkPost}
              disabled={isBulkPosting || bulkSelectedIds.length === 0}
              className='bg-purple-600 hover:bg-purple-700 text-white gap-2'
            >
              {isBulkPosting ? (
                <><FiLoader className='h-4 w-4 animate-spin' /> Posting...</>
              ) : (
                <><FiCheckCircle className='h-4 w-4' /> Post {bulkSelectedIds.length} Record{bulkSelectedIds.length !== 1 ? "s" : ""}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
