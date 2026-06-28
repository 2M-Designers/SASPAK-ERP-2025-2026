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
  FiPlus,
  FiMinus,
  FiCheckCircle,
  FiLoader,
  FiFileText,
  FiList,
} from "react-icons/fi";
import { AlertCircle, Receipt } from "lucide-react";
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
type TypeOption = { value: string; label: string };

type GlInvoiceDetail = {
  glInvoiceDetailId: number;
  glInvoiceId: number;
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
  version: number;
};

type GlInvoice = {
  glInvoiceId: number;
  invoiceDate: string;
  invoiceNumber: string;
  jobId: number | null;
  invoiceType: number;
  invoiceAmount: number;
  invoiceAmountFc: number;
  exchangeRate: number;
  currencyId: number;
  totalTax: number;
  totalTaxFc: number;
  discountTotal: number;
  discountTotalFc: number;
  partialPayment: number;
  totalAmount: number;
  totalAmountFc: number;
  payToPartyId: number;
  invoiceStatus: string;
  invoiceDescription: string;
  dueDays: number;
  glVoucherId: number | null;
  vendorInvoiceDate: string;
  vendorInvoiceNumber: string;
  version: number;
  glInvoiceDetails: GlInvoiceDetail[];
  payToParty?: { partyId: number; partyName: string; partyCode: string };
  currency?: { currencyId: number; currencyCode: string };
  job?: { jobId: number; jobNumber: string };
};

type DetailRow = {
  _key: string;
  glInvoiceDetailId: number;
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
  version: number;
  _autoFilled?: boolean;
};

type MasterForm = {
  invoiceDate: string;
  invoiceNumber: string;
  jobId: number | null;
  payToPartyId: number | null;
  invoiceType: number;
  currencyId: number | null;
  exchangeRate: number;
  invoiceStatus: string;
  invoiceDescription: string;
  dueDays: number;
  vendorInvoiceDate: string;
  vendorInvoiceNumber: string;
  partialPayment: number;
};

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
  glInvoiceDetailId: 0,
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
  version: 1,
});

const mapInvoice = (it: any): GlInvoice => ({
  glInvoiceId: it.glInvoiceId ?? it.GlInvoiceId ?? 0,
  invoiceDate: it.invoiceDate ?? it.InvoiceDate ?? "",
  invoiceNumber: it.invoiceNumber ?? it.InvoiceNumber ?? "",
  jobId: it.jobId ?? it.JobId ?? null,
  invoiceType: it.invoiceType ?? it.InvoiceType ?? 1,
  invoiceAmount: it.invoiceAmount ?? it.InvoiceAmount ?? 0,
  invoiceAmountFc: it.invoiceAmountFc ?? it.InvoiceAmountFc ?? 0,
  exchangeRate: it.exchangeRate ?? it.ExchangeRate ?? 1,
  currencyId: it.currencyId ?? it.CurrencyId ?? 0,
  totalTax: it.totalTax ?? it.TotalTax ?? 0,
  totalTaxFc: it.totalTaxFc ?? it.TotalTaxFc ?? 0,
  discountTotal: it.discountTotal ?? it.DiscountTotal ?? 0,
  discountTotalFc: it.discountTotalFc ?? it.DiscountTotalFc ?? 0,
  partialPayment: it.partialPayment ?? it.PartialPayment ?? 0,
  totalAmount: it.totalAmount ?? it.TotalAmount ?? 0,
  totalAmountFc: it.totalAmountFc ?? it.TotalAmountFc ?? 0,
  payToPartyId: it.payToPartyId ?? it.PayToPartyId ?? 0,
  invoiceStatus: it.invoiceStatus ?? it.InvoiceStatus ?? "",
  invoiceDescription: it.invoiceDescription ?? it.InvoiceDescription ?? "",
  dueDays: it.dueDays ?? it.DueDays ?? 0,
  glVoucherId: it.glVoucherId ?? it.GlVoucherId ?? null,
  vendorInvoiceDate: it.vendorInvoiceDate ?? it.VendorInvoiceDate ?? "",
  vendorInvoiceNumber: it.vendorInvoiceNumber ?? it.VendorInvoiceNumber ?? "",
  version: it.version ?? it.Version ?? 1,
  glInvoiceDetails: [],
  payToParty: it.payToParty ?? undefined,
  currency: it.currency ?? undefined,
  job: it.job ?? undefined,
});

const mapDetail = (d: any): GlInvoiceDetail => ({
  glInvoiceDetailId: d.glInvoiceDetailId ?? d.GlInvoiceDetailId ?? 0,
  glInvoiceId: d.glInvoiceId ?? d.GlInvoiceId ?? 0,
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
  version: d.version ?? d.Version ?? 1,
});

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
    // fall through
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

const isAlreadyProcessed = (status: string) =>
  ["approved", "done", "processed"].includes((status || "").toLowerCase());

// ─── Component ────────────────────────────────────────────────────────────────

export default function GLInvoiceClient({ initialData }: { initialData: any[] }) {
  // ── List state ─────────────────────────────────────────────────────────────
  const [data, setData] = useState<GlInvoice[]>(() => (initialData ?? []).map(mapInvoice));
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // ── Lookup state ───────────────────────────────────────────────────────────
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [charges, setCharges] = useState<ChargeMaster[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [lookupReady, setLookupReady] = useState(false);

  // ── Type options ───────────────────────────────────────────────────────────
  const [statusOptions, setStatusOptions] = useState<TypeOption[]>([]);
  const [invoiceTypeOptions, setInvoiceTypeOptions] = useState<TypeOption[]>([]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GlInvoice | null>(null);
  const [masterForm, setMasterForm] = useState<MasterForm>({
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    jobId: null,
    payToPartyId: null,
    invoiceType: 1,
    currencyId: null,
    exchangeRate: 1,
    invoiceStatus: "Draft",
    invoiceDescription: "",
    dueDays: 0,
    vendorInvoiceDate: new Date().toISOString().slice(0, 10),
    vendorInvoiceNumber: "",
    partialPayment: 0,
  });
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<GlInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlInvoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Process Invoice state ─────────────────────────────────────────────────────
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ── Search for big dropdowns ───────────────────────────────────────────────
  const [partySearch, setPartySearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [detailSearches, setDetailSearches] = useState<Record<string, string>>({});

  const { toast } = useToast();

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const postList = async (
    endpoint: string,
    select: string,
    where = "",
    sort = "",
    pageSize = "2000",
  ) => {
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
        "GLInvoice/GetList",
        "GlInvoiceId, InvoiceDate, InvoiceNumber, JobId, InvoiceType, InvoiceAmount, TotalAmount, PayToPartyId, InvoiceStatus, InvoiceDescription, CurrencyId, ExchangeRate, GlVoucherId, Version",
        "",
        "GlInvoiceId DESC",
      );
      setData(rows.map(mapInvoice));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load records." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // eslint-disable-line

  // ── Fetch single record ────────────────────────────────────────────────────
  const fetchById = useCallback(async (id: number): Promise<GlInvoice | null> => {
    try {
      const res = await fetch(`${getBaseUrl()}GLInvoice/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const raw = await res.json();
      return {
        ...mapInvoice(raw),
        glInvoiceDetails: (raw.glInvoiceDetails ?? raw.GlInvoiceDetails ?? []).map(mapDetail),
      };
    } catch {
      return null;
    }
  }, []);

  // ── Fetch all lookups ──────────────────────────────────────────────────────
  const fetchLookups = useCallback(async () => {
    try {
      const [currRaw, partyRaw, jobRaw, chargeRaw, acctRaw, ccRaw, statusRaw, invoiceTypeRaw] =
        await Promise.all([
          postList("SetupCurrency/GetList", "CurrencyId, CurrencyCode, CurrencyName, Symbol, IsDefault", "", "CurrencyCode ASC"),
          postList("Party/GetList", "PartyId, PartyCode, PartyName", "", "PartyName ASC"),
          postList("Job/GetList", "JobId, JobNumber, TerminalPartyId, PrincipalId, ConsigneePartyId, JobInvoiceExchRate", "", "JobId DESC"),
          postList("ChargesMaster/GetList", "ChargeId, ChargeCode, ChargeName", "", "ChargeName ASC"),
          postList("GlAccount/GetList", "AccountId, AccountCode, AccountName, IsHeader", "", "AccountCode ASC", "9999"),
          postList("CostCenter/GetList", "CostCenterId, CostCenterCode, CostCenterName", "", "CostCenterCode ASC"),
          getTypeValues("Invoice_Status"),
          getTypeValues("Invoice_Types"),
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
      if (invoiceTypeRaw.length) setInvoiceTypeOptions(invoiceTypeRaw);

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

  // ── Auto-fill from Job Order (Cash + Bank Fund Request details) ──────────────
  const autoFillFromJob = useCallback(
    async (jobId: number) => {
      if (!jobId) return;
      setIsAutoFilling(true);
      try {
        const exRate = masterForm.exchangeRate || 1;
        const currId = masterForm.currencyId ?? currencies.find((c) => c.isDefault)?.currencyId ?? 0;

        // Default billing party = job's consignee; fall back to shipper (principalId).
        const currentJob = jobs.find((j) => j.jobId === jobId);
        const defaultBillingPartyId =
          currentJob?.consigneePartyId ?? currentJob?.principalId ?? 0;

        const [cashDetails, bankDetails] = await Promise.all([
          postList(
            "InternalCashFundsRequestDetail/GetList",
            "InternalFundsRequestCashId, JobId, ChargesId, ApprovedAmount, HeadCoaId, BeneficiaryCoaId, OnAccountOfId, CostCenterId, SubRequestStatus, CashFundRequestMasterId",
            `JobId == ${jobId}`,
            "InternalFundsRequestCashId ASC",
            "5000",
          ),
          postList(
            "InternalBankFundsRequestDetail/GetList",
            "InternalFundsRequestBankId, JobId, ChargesId, ApprovedAmount, HeadCoaId, BeneficiaryCoaId, OnAccountOfId, CostCenterId, SubRequestStatus, BankFundRequestMasterId",
            `JobId == ${jobId}`,
            "InternalFundsRequestBankId ASC",
            "5000",
          ),
        ]);

        // Map a detail line to a GL Invoice DetailRow.
        // fromCoaId = consignee (default) or shipper from job
        // toCoaId   = GL expense/head account (HeadCoaId)
        const toDetailRow = (item: any): DetailRow => ({
          _key: Math.random().toString(36).slice(2),
          glInvoiceDetailId: 0,
          chargesId: item.chargesId ?? item.ChargesId ?? 0,
          cost: item.approvedAmount ?? item.ApprovedAmount ?? 0,
          qty: 1,
          exchangeRate: exRate,
          currencyId: currId,
          tax: 0,
          discount: 0,
          fromCoaId: defaultBillingPartyId || (item.onAccountOfId ?? item.OnAccountOfId ?? 0),
          toCoaId: item.headCoaId ?? item.HeadCoaId ?? 0,
          costCenterId: item.costCenterId ?? item.CostCenterId ?? null,
          version: 1,
          _autoFilled: true,
        });

        const autoRows = [
          ...cashDetails.map(toDetailRow),
          ...bankDetails.map(toDetailRow),
        ].filter((r) => r.chargesId > 0 && r.cost > 0);

        if (autoRows.length === 0) {
          toast({
            title: "No Approved Charges Found",
            description: "No Cash or Bank Fund Request lines with approved amounts were found for this job. You can add charges manually.",
          });
          return;
        }

        setDetailRows((prev) => {
          const manualRows = prev.filter((r) => !r._autoFilled);
          return [...autoRows, ...manualRows];
        });

        toast({
          title: "Charges Auto-Filled",
          description: `${autoRows.length} approved charge line(s) loaded from Fund Requests.`,
        });
      } catch (err) {
        console.error("Auto-fill error:", err);
        toast({
          variant: "destructive",
          title: "Auto-Fill Failed",
          description: "Could not load fund request charges for this job.",
        });
      } finally {
        setIsAutoFilling(false);
      }
    },
    [masterForm.exchangeRate, masterForm.currencyId, currencies, jobs, toast], // eslint-disable-line
  );

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchText) return data;
    const q = searchText.toLowerCase();
    return data.filter(
      (r) =>
        (r.invoiceNumber || "").toLowerCase().includes(q) ||
        (r.invoiceStatus || "").toLowerCase().includes(q) ||
        (r.invoiceDescription || "").toLowerCase().includes(q) ||
        String(r.glInvoiceId).includes(q) ||
        (r.vendorInvoiceNumber || "").toLowerCase().includes(q) ||
        (r.payToParty?.partyName || "").toLowerCase().includes(q),
    );
  }, [data, searchText]);

  // ── Computed rows ──────────────────────────────────────────────────────────
  const computedRows = useMemo(() => detailRows.map((r) => ({ ...r, ...computeRow(r) })), [detailRows]);

  const masterTotals = useMemo(() => {
    const invoiceAmount = computedRows.reduce((s, r) => s + r.amount, 0);
    const totalTax = computedRows.reduce((s, r) => s + r.tax, 0);
    const discountTotal = computedRows.reduce((s, r) => s + r.discount, 0);
    return {
      invoiceAmount,
      totalTax,
      discountTotal,
      totalAmount: invoiceAmount + totalTax - discountTotal,
    };
  }, [computedRows]);

  // ── Filtered dropdowns ─────────────────────────────────────────────────────
  const filteredParties = useMemo(() => {
    const q = partySearch.toLowerCase();
    const base = partySearch
      ? parties.filter((p) => p.partyName.toLowerCase().includes(q) || p.partyCode.toLowerCase().includes(q))
      : parties;
    const sliced = base.slice(0, 150);
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
    if (masterForm.jobId) {
      const sel = jobs.find((j) => j.jobId === masterForm.jobId);
      if (sel && !sliced.find((j) => j.jobId === sel.jobId)) sliced.push(sel);
    }
    return sliced;
  }, [jobs, jobSearch, masterForm.jobId]);

  const transactionalAccounts = useMemo(
    () => accounts.filter((a) => !a.isHeader),
    [accounts],
  );

  // Billing Party options for detail rows — only Shipper (principalId) and
  // Consignee (consigneePartyId) from the selected job.
  // Falls back to all parties when no job is selected or no matches found.
  const jobParties = useMemo(() => {
    if (!masterForm.jobId) return parties;
    const job = jobs.find((j) => j.jobId === masterForm.jobId);
    if (!job) return parties;
    const ids = new Set(
      [job.principalId, job.consigneePartyId].filter(
        (id): id is number => id != null && id > 0,
      ),
    );
    const filtered = parties.filter((p) => ids.has(p.partyId));
    return filtered.length > 0 ? filtered : parties;
  }, [masterForm.jobId, jobs, parties]);

  // ── Open add form ──────────────────────────────────────────────────────────
  const openAdd = () => {
    const def =
      currencies.find((c) => c.currencyCode === "PKR") ??
      currencies.find((c) => c.isDefault) ??
      currencies[0];
    const defaultStatus = statusOptions.length ? statusOptions[0].value : "Draft";
    setEditingRecord(null);
    setMasterForm({
      invoiceDate: new Date().toISOString().slice(0, 10),
      invoiceNumber: "",
      jobId: null,
      payToPartyId: null,
      invoiceType: 1,
      currencyId: def?.currencyId ?? null,
      exchangeRate: 1,
      invoiceStatus: defaultStatus,
      invoiceDescription: "",
      dueDays: 0,
      vendorInvoiceDate: new Date().toISOString().slice(0, 10),
      vendorInvoiceNumber: "",
      partialPayment: 0,
    });
    setDetailRows([blankRow(1, def?.currencyId ?? 0)]);
    setPartySearch("");
    setJobSearch("");
    setDetailSearches({});
    setShowForm(true);
  };

  // ── Open edit form ─────────────────────────────────────────────────────────
  const openEdit = async (rec: GlInvoice) => {
    setIsLoading(true);
    const full = await fetchById(rec.glInvoiceId);
    setIsLoading(false);
    if (!full) {
      toast({ variant: "destructive", title: "Error", description: "Could not load record." });
      return;
    }
    setEditingRecord(full);
    setMasterForm({
      invoiceDate: full.invoiceDate?.slice(0, 10) ?? "",
      invoiceNumber: full.invoiceNumber,
      jobId: full.jobId,
      payToPartyId: full.payToPartyId,
      invoiceType: full.invoiceType,
      currencyId: full.currencyId,
      exchangeRate: full.exchangeRate,
      invoiceStatus: full.invoiceStatus,
      invoiceDescription: full.invoiceDescription ?? "",
      dueDays: full.dueDays ?? 0,
      vendorInvoiceDate: full.vendorInvoiceDate?.slice(0, 10) ?? "",
      vendorInvoiceNumber: full.vendorInvoiceNumber ?? "",
      partialPayment: full.partialPayment ?? 0,
    });
    setDetailRows(
      full.glInvoiceDetails.map((d) => ({
        _key: Math.random().toString(36).slice(2),
        glInvoiceDetailId: d.glInvoiceDetailId,
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
      toast({ variant: "destructive", title: "Validation", description: "At least one charge line is required." });
      return;
    }
    if (detailRows.some((r) => !r.chargesId || !r.fromCoaId || !r.toCoaId)) {
      toast({ variant: "destructive", title: "Validation", description: "Each line needs Charge, From CoA and To CoA." });
      return;
    }

    const { invoiceAmount, totalTax, discountTotal, totalAmount } = masterTotals;
    const exRate = masterForm.exchangeRate || 1;
    const isEdit = !!editingRecord;

    const payload = {
      GlInvoiceId: editingRecord?.glInvoiceId ?? 0,
      InvoiceDate: masterForm.invoiceDate,
      InvoiceNumber: masterForm.invoiceNumber ?? "",
      JobId: masterForm.jobId || null,
      InvoiceType: masterForm.invoiceType,
      InvoiceAmount: invoiceAmount,
      InvoiceAmountFc: invoiceAmount * exRate,
      ExchangeRate: exRate,
      CurrencyId: masterForm.currencyId ?? 0,
      TotalTax: totalTax,
      TotalTaxFc: totalTax * exRate,
      DiscountTotal: discountTotal,
      DiscountTotalFc: discountTotal * exRate,
      PartialPayment: masterForm.partialPayment,
      TotalAmount: totalAmount,
      TotalAmountFc: totalAmount * exRate,
      PayToPartyId: masterForm.payToPartyId ?? 0,
      InvoiceStatus: masterForm.invoiceStatus,
      InvoiceDescription: masterForm.invoiceDescription ?? "",
      DueDays: masterForm.dueDays ?? 0,
      GlVoucherId: editingRecord?.glVoucherId || null,
      VendorInvoiceDate: masterForm.vendorInvoiceDate || new Date().toISOString(),
      VendorInvoiceNumber: masterForm.vendorInvoiceNumber ?? "",
      Version: editingRecord?.version ?? 1,
      GlInvoiceDetails: computedRows.map((r) => ({
        GlInvoiceDetailId: r.glInvoiceDetailId,
        GlInvoiceId: editingRecord?.glInvoiceId ?? 0,
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
        Version: r.version,
      })),
    };

    setIsSaving(true);
    console.debug("[GLInvoice] Submitting payload:", JSON.stringify(payload, null, 2));
    try {
      let res: Response;
      try {
        res = await fetch(`${getBaseUrl()}GLInvoice`, {
          method: isEdit ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      } catch (networkErr) {
        console.error("[GLInvoice] Network/CORS error:", networkErr, "Payload was:", payload);
        throw new Error(
          "Server returned an error and the browser could not read the response (CORS). " +
            "Open DevTools → Network tab → find the failed request to GLInvoice → " +
            "check the response body there for the actual server error.",
        );
      }

      console.debug("[GLInvoice] Response:", res.status, res.statusText);

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const txt = await res.text();
          console.debug("[GLInvoice] Error body:", txt);
          if (txt) {
            const p = JSON.parse(txt);
            if (p.errors) {
              msg = Object.values(p.errors as Record<string, string[]>).flat().join(", ");
            } else if (p.title) { msg = p.title; }
            else if (p.message) { msg = p.message; }
            else if (p.detail) { msg = p.detail; }
            else if (Array.isArray(p)) { msg = p.join(", "); }
            else if (typeof p === "string") { msg = p; }
            else { msg = txt || msg; }
          }
        } catch { /* keep default */ }
        throw new Error(msg);
      }

      toast({
        title: isEdit ? "Invoice Updated" : "Invoice Created",
        description: `${masterForm.invoiceNumber || "Bill"} saved successfully.`,
      });
      setShowForm(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (err) {
      console.error("[GLInvoice] Save failed:", err);
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
      const res = await fetch(`${getBaseUrl()}GLInvoice/${deleteTarget.glInvoiceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setData((prev) => prev.filter((r) => r.glInvoiceId !== deleteTarget.glInvoiceId));
      toast({ title: "Deleted", description: `${deleteTarget.invoiceNumber || `Invoice #${deleteTarget.glInvoiceId}`} removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete invoice." });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── View ───────────────────────────────────────────────────────────────────
  const handleView = async (rec: GlInvoice) => {
    setIsLoading(true);
    const full = await fetchById(rec.glInvoiceId);
    setIsLoading(false);
    setViewRecord(full ?? rec);
    setViewOpen(true);
  };

  // ── Process Invoice ───────────────────────────────────────────────────────────
  const handleProcessInvoice = async (rec: GlInvoice) => {
    setProcessingId(rec.glInvoiceId);
    try {
      const res = await fetch(
        `${getBaseUrl()}GLInvoice/ProcessInvoice?invoiceId=${rec.glInvoiceId}`,
        { method: "PUT", headers: getAuthHeaders() },
      );
      if (!res.ok) {
        let msg = `Process failed (${res.status})`;
        try {
          const txt = await res.text();
          if (txt) {
            const p = JSON.parse(txt);
            if (p.message) msg = p.message;
            else if (p.title) msg = p.title;
            else if (typeof p === "string") msg = p;
          }
        } catch { /* keep */ }
        throw new Error(msg);
      }
      toast({ title: "Bill Processed", description: `${rec.invoiceNumber || `#${rec.glInvoiceId}`} has been processed.` });
      fetchRecords();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Process Failed",
        description: err instanceof Error ? err.message : "Could not process invoice.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const handlePDF = useCallback(
    (rec: GlInvoice) => {
      try {
        const doc = new jsPDF("portrait", "mm", "a4");
        const W = doc.internal.pageSize.getWidth();

        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, W, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(17);
        doc.setFont("helvetica", "bold");
        doc.text("GL INVOICE", 14, 13);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Printed: ${moment().format("DD MMM YYYY, HH:mm")}`, W - 14, 13, { align: "right" });

        const sv = (rec.invoiceStatus || "").toLowerCase();
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
        doc.text(rec.invoiceStatus || "—", W - 34, 22.5, { align: "center" });

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

        info("Invoice Number", rec.invoiceNumber || "—", 14, y);
        info("Invoice Date", rec.invoiceDate ? moment(rec.invoiceDate).format("DD MMM YYYY") : "—", 75, y);
        info("Due Days", String(rec.dueDays || 0), 140, y);
        y += 14;

        const party = parties.find((p) => p.partyId === rec.payToPartyId);
        info("Pay To Party", party?.partyName || `Party #${rec.payToPartyId}`, 14, y);
        const job = jobs.find((j) => j.jobId === rec.jobId);
        info("Job", job?.jobNumber || (rec.jobId ? `#${rec.jobId}` : "—"), 75, y);
        info("Vendor Invoice No", rec.vendorInvoiceNumber || "—", 140, y);
        y += 14;

        if (rec.invoiceDescription) {
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text("DESCRIPTION", 14, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(20, 20, 20);
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(rec.invoiceDescription, W - 28);
          doc.text(lines, 14, y + 5);
          y += 5 + lines.length * 5;
        }

        y += 4;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(14, y, W - 14, y);
        y += 6;

        const details = rec.glInvoiceDetails || [];
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
          ["Bill Amount", fmt(rec.invoiceAmount), false],
          ["Total Tax", fmt(rec.totalTax), false],
          ["Discount Total", `(${fmt(rec.discountTotal)})`, false],
          ["Partial Payment", fmt(rec.partialPayment), false],
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

        doc.save(`GLInvoice_${rec.invoiceNumber || rec.glInvoiceId}_${moment().format("YYYYMMDD")}.pdf`);
        toast({ title: "PDF Downloaded", description: rec.invoiceNumber || `#${rec.glInvoiceId}` });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
      }
    },
    [charges, parties, jobs, toast],
  );

  const handlePrintFromList = useCallback(
    async (rec: GlInvoice) => {
      setIsLoading(true);
      const full = await fetchById(rec.glInvoiceId);
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
                  <Receipt className='h-5 w-5 text-indigo-600' />
                  {editingRecord ? "Edit GL Invoice" : "New GL Invoice"}
                </h1>
                <p className='text-xs text-gray-500 mt-0.5'>Customer Invoice for Job Orders</p>
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
                className='bg-indigo-600 hover:bg-indigo-700 text-white gap-2'
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
            <CardHeader className='py-3 px-4 bg-indigo-50 border-b border-indigo-100'>
              <CardTitle className='text-sm font-semibold text-indigo-900 flex items-center gap-2'>
                <Badge className='bg-indigo-600 text-white'>Master</Badge>
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>

                {/* Invoice Date */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Invoice Date *</Label>
                  <Input
                    type='date'
                    value={masterForm.invoiceDate}
                    onChange={(e) => setMasterForm((p) => ({ ...p, invoiceDate: e.target.value }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Invoice Number</Label>
                  <Input
                    value={masterForm.invoiceNumber}
                    onChange={(e) => setMasterForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
                    placeholder='Auto-generated'
                    className='h-9 text-sm'
                  />
                </div>

                {/* Job Order */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Job Order</Label>
                  <Select
                    value={masterForm.jobId ? String(masterForm.jobId) : ""}
                    onValueChange={(v) => {
                      const sel = v ? jobs.find((j) => j.jobId === Number(v)) : null;
                      setMasterForm((p) => ({
                        ...p,
                        jobId: sel?.jobId ?? null,
                        exchangeRate: sel?.jobInvoiceExchRate || p.exchangeRate || 1,
                        payToPartyId: sel?.terminalPartyId ?? sel?.principalId ?? sel?.consigneePartyId ?? p.payToPartyId,
                      }));
                      if (sel?.jobId) autoFillFromJob(sel.jobId);
                    }}
                  >
                    <SelectTrigger className='h-9 text-sm'>
                      <SelectValue>
                        {masterForm.jobId
                          ? (jobs.find((j) => j.jobId === masterForm.jobId)?.jobNumber ?? `Job #${masterForm.jobId}`)
                          : "Select Job..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='max-h-[260px]'>
                      <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                        <Input
                          placeholder='Search job...'
                          value={jobSearch}
                          onChange={(e) => setJobSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className='h-6 text-xs'
                        />
                      </div>
                      {filteredJobs.map((j) => (
                        <SelectItem key={j.jobId} value={String(j.jobId)}>
                          {j.jobNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isAutoFilling && (
                    <p className='text-xs text-indigo-600 mt-1 flex items-center gap-1'>
                      <FiLoader className='animate-spin h-3 w-3' /> Loading fund request charges...
                    </p>
                  )}
                </div>

                {/* Invoice Type */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Invoice Type *</Label>
                  <Select
                    value={String(masterForm.invoiceType)}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, invoiceType: Number(v) }))}
                  >
                    <SelectTrigger className='h-9 text-sm'>
                      <SelectValue>
                        {invoiceTypeOptions.find((o) => o.value === String(masterForm.invoiceType))?.label
                          ?? ({ 1: "Standard", 2: "Credit", 3: "Debit" } as Record<number, string>)[masterForm.invoiceType]
                          ?? "Select type..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {invoiceTypeOptions.length > 0 ? (
                        invoiceTypeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value='1'>Standard</SelectItem>
                          <SelectItem value='2'>Credit</SelectItem>
                          <SelectItem value='3'>Debit</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pay To Party */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Pay To Party *</Label>
                  <Select
                    value={masterForm.payToPartyId ? String(masterForm.payToPartyId) : ""}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, payToPartyId: Number(v) }))}
                  >
                    <SelectTrigger className='h-9 text-sm'>
                      <SelectValue>
                        {masterForm.payToPartyId
                          ? (parties.find((p) => p.partyId === masterForm.payToPartyId)?.partyName ?? `Party #${masterForm.payToPartyId}`)
                          : "Select party..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='max-h-[260px]'>
                      <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                        <Input
                          placeholder='Search party...'
                          value={partySearch}
                          onChange={(e) => setPartySearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className='h-6 text-xs'
                        />
                      </div>
                      {filteredParties.map((p) => (
                        <SelectItem key={p.partyId} value={String(p.partyId)}>
                          {p.partyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Currency *</Label>
                  <Select
                    value={masterForm.currencyId ? String(masterForm.currencyId) : ""}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, currencyId: Number(v) }))}
                  >
                    <SelectTrigger className='h-9 text-sm'>
                      <SelectValue>
                        {masterForm.currencyId
                          ? (currencies.find((c) => c.currencyId === masterForm.currencyId)
                              ? `${currencies.find((c) => c.currencyId === masterForm.currencyId)!.currencyCode} – ${currencies.find((c) => c.currencyId === masterForm.currencyId)!.currencyName}`
                              : `Currency #${masterForm.currencyId}`)
                          : "Select currency..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.currencyId} value={String(c.currencyId)}>
                          {c.currencyCode} – {c.currencyName}
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
                    min='0'
                    step='0.0001'
                    value={masterForm.exchangeRate}
                    onChange={(e) => setMasterForm((p) => ({ ...p, exchangeRate: parseFloat(e.target.value) || 1 }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Invoice Status */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Status</Label>
                  <Select
                    value={masterForm.invoiceStatus}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, invoiceStatus: v }))}
                  >
                    <SelectTrigger className='h-9 text-sm'>
                      <SelectValue>
                        {statusOptions.find((o) => o.value === masterForm.invoiceStatus)?.label ?? masterForm.invoiceStatus ?? "Select status..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.length > 0 ? (
                        statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value='Draft'>Draft</SelectItem>
                          <SelectItem value='Pending'>Pending</SelectItem>
                          <SelectItem value='Processed'>Processed</SelectItem>
                          <SelectItem value='Cancelled'>Cancelled</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className='md:col-span-3 lg:col-span-4'>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Invoice Description</Label>
                  <Textarea
                    value={masterForm.invoiceDescription}
                    onChange={(e) => setMasterForm((p) => ({ ...p, invoiceDescription: e.target.value }))}
                    placeholder='Enter invoice description...'
                    rows={2}
                    className='text-sm resize-none'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {[
              { label: "Bill Amount", value: masterTotals.invoiceAmount },
              { label: "Total Tax", value: masterTotals.totalTax },
              { label: "Discount Total", value: masterTotals.discountTotal },
              { label: "Net Total", value: masterTotals.totalAmount },
            ].map(({ label, value }) => (
              <Card key={label} className='border border-indigo-100'>
                <CardContent className='py-2 px-3'>
                  <p className='text-xs text-gray-500'>{label}</p>
                  <p className='text-base font-bold text-indigo-700 font-mono'>{fmt(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail Lines */}
          <Card>
            <CardHeader className='py-3 px-4 bg-indigo-50 border-b border-indigo-100 flex flex-row items-center justify-between'>
              <CardTitle className='text-sm font-semibold text-indigo-900 flex items-center gap-2'>
                <Badge className='bg-indigo-600 text-white'>Details</Badge>
                Charge Lines
                {masterForm.jobId && (
                  <span className='text-xs text-indigo-500 font-normal ml-1'>
                    (auto-filled from fund requests)
                  </span>
                )}
              </CardTitle>
              <Button
                size='sm'
                variant='outline'
                onClick={addRow}
                className='h-7 gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50'
              >
                <FiPlus className='h-3 w-3' /> Add Row
              </Button>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50 text-xs'>
                      <TableHead className='w-8'>#</TableHead>
                      <TableHead className='min-w-[160px]'>Charge *</TableHead>
                      <TableHead className='min-w-[90px]'>Cost</TableHead>
                      <TableHead className='min-w-[60px]'>Qty</TableHead>
                      <TableHead className='min-w-[90px] text-right'>Net Amount</TableHead>
                      <TableHead className='min-w-[160px]'>Billing Party *</TableHead>
                      <TableHead className='min-w-[160px]'>GL Account *</TableHead>
                      <TableHead className='min-w-[140px]'>Cost Center</TableHead>
                      <TableHead className='w-8'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computedRows.map((row, idx) => {
                      const chargeSearch = detailSearches[`${row._key}_charge`] ?? "";
                      const fromCoaSearch = detailSearches[`${row._key}_fromCoa`] ?? "";
                      const toCoaSearch = detailSearches[`${row._key}_toCoa`] ?? "";
                      const ccSearch = detailSearches[`${row._key}_cc`] ?? "";
                      const qCharge = chargeSearch.toLowerCase();
                      const qFrom = fromCoaSearch.toLowerCase();
                      const qTo = toCoaSearch.toLowerCase();
                      const qCC = ccSearch.toLowerCase();

                      // Always include the currently selected item so SelectValue
                      // can display its label even when the list is filtered.
                      const filteredCharges = (() => {
                        const base = qCharge
                          ? charges.filter(c =>
                              c.chargesName.toLowerCase().includes(qCharge) ||
                              c.chargesCode.toLowerCase().includes(qCharge))
                          : charges;
                        const sel = charges.find(c => c.chargesMasterId === row.chargesId);
                        if (sel && !base.find(c => c.chargesMasterId === sel.chargesMasterId))
                          return [sel, ...base];
                        return base;
                      })();

                      // Billing Party — scoped to the job's shipper/consignee/terminal.
                      // jobParties already contains only those parties (or all if no job).
                      const filteredFromCoa = (() => {
                        const base = qFrom
                          ? jobParties.filter(p =>
                              p.partyName.toLowerCase().includes(qFrom) ||
                              p.partyCode.toLowerCase().includes(qFrom))
                          : jobParties;
                        const sel = parties.find(p => p.partyId === row.fromCoaId);
                        if (sel && !base.find(p => p.partyId === sel.partyId))
                          return [sel, ...base];
                        return base;
                      })();

                      // To CoA — use ALL accounts; BeneficiaryCoaId is the
                      // customer's GL Account ID.
                      const filteredToCoa = (() => {
                        const base = qTo
                          ? accounts.filter(a =>
                              a.accountName.toLowerCase().includes(qTo) ||
                              a.accountCode.toLowerCase().includes(qTo))
                          : accounts;
                        const sel = accounts.find(a => a.accountId === row.toCoaId);
                        if (sel && !base.find(a => a.accountId === sel.accountId))
                          return [sel, ...base];
                        return base;
                      })();

                      const filteredCC = (() => {
                        const base = qCC
                          ? costCenters.filter(c =>
                              c.costCenterName.toLowerCase().includes(qCC) ||
                              c.costCenterCode.toLowerCase().includes(qCC))
                          : costCenters;
                        const sel = costCenters.find(c => c.costCenterId === row.costCenterId);
                        if (sel && !base.find(c => c.costCenterId === sel.costCenterId))
                          return [sel, ...base];
                        return base;
                      })();

                      return (
                        <TableRow key={row._key} className={row._autoFilled ? "bg-indigo-50/40" : ""}>
                          <TableCell className='text-xs text-gray-500 text-center'>
                            {idx + 1}
                          </TableCell>

                          {/* Charge */}
                          <TableCell>
                            <Select
                              value={row.chargesId ? String(row.chargesId) : ""}
                              onValueChange={(v) => updateRow(row._key, { chargesId: Number(v) })}
                            >
                              <SelectTrigger className='h-7 text-xs'>
                                <SelectValue>
                                  {row.chargesId
                                    ? (charges.find((c) => c.chargesMasterId === row.chargesId)?.chargesName ?? `#${row.chargesId}`)
                                    : "Charge..."}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className='max-h-[260px]'>
                                <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                  <Input
                                    placeholder='Search charge...'
                                    value={chargeSearch}
                                    onChange={(e) =>
                                      setDetailSearches((p) => ({ ...p, [`${row._key}_charge`]: e.target.value }))
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className='h-6 text-xs'
                                  />
                                </div>
                                {filteredCharges.map((ch) => (
                                  <SelectItem key={ch.chargesMasterId} value={String(ch.chargesMasterId)}>
                                    {ch.chargesName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Cost */}
                          <TableCell>
                            <Input
                              type='number'
                              min='0'
                              step='0.01'
                              value={row.cost}
                              onChange={(e) => updateRow(row._key, { cost: parseFloat(e.target.value) || 0 })}
                              className='h-7 text-xs w-24'
                            />
                          </TableCell>

                          {/* Qty */}
                          <TableCell>
                            <Input
                              type='number'
                              min='1'
                              value={row.qty}
                              onChange={(e) => updateRow(row._key, { qty: parseFloat(e.target.value) || 1 })}
                              className='h-7 text-xs w-16'
                            />
                          </TableCell>

                          {/* Net Amount (computed) */}
                          <TableCell className='text-xs text-right font-mono font-semibold text-indigo-700'>
                            {fmt(row.netAmount)}
                          </TableCell>

                          {/* From CoA — Billing Party */}
                          <TableCell>
                            <Select
                              value={row.fromCoaId ? String(row.fromCoaId) : ""}
                              onValueChange={(v) => updateRow(row._key, { fromCoaId: Number(v) })}
                            >
                              <SelectTrigger className='h-7 text-xs'>
                                <SelectValue>
                                  {row.fromCoaId
                                    ? (parties.find((p) => p.partyId === row.fromCoaId)?.partyName ?? `#${row.fromCoaId}`)
                                    : "Billing Party..."}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className='max-h-[260px]'>
                                <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                  <Input
                                    placeholder='Search party...'
                                    value={fromCoaSearch}
                                    onChange={(e) =>
                                      setDetailSearches((p) => ({ ...p, [`${row._key}_fromCoa`]: e.target.value }))
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className='h-6 text-xs'
                                  />
                                </div>
                                {filteredFromCoa.map((p) => (
                                  <SelectItem key={p.partyId} value={String(p.partyId)}>
                                    {p.partyName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* To CoA — GL Account */}
                          <TableCell>
                            <Select
                              value={row.toCoaId ? String(row.toCoaId) : ""}
                              onValueChange={(v) => updateRow(row._key, { toCoaId: Number(v) })}
                            >
                              <SelectTrigger className='h-7 text-xs'>
                                <SelectValue>
                                  {row.toCoaId
                                    ? (accounts.find((a) => a.accountId === row.toCoaId)?.accountName ?? `#${row.toCoaId}`)
                                    : "GL Account..."}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className='max-h-[260px]'>
                                <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                  <Input
                                    placeholder='Search account...'
                                    value={toCoaSearch}
                                    onChange={(e) =>
                                      setDetailSearches((p) => ({ ...p, [`${row._key}_toCoa`]: e.target.value }))
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className='h-6 text-xs'
                                  />
                                </div>
                                {filteredToCoa.map((a) => (
                                  <SelectItem key={a.accountId} value={String(a.accountId)}>
                                    {a.accountCode} – {a.accountName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Cost Center */}
                          <TableCell>
                            <Select
                              value={row.costCenterId ? String(row.costCenterId) : "none"}
                              onValueChange={(v) => updateRow(row._key, { costCenterId: v === "none" ? null : Number(v) })}
                            >
                              <SelectTrigger className='h-7 text-xs'>
                                <SelectValue>
                                  {row.costCenterId
                                    ? (costCenters.find((c) => c.costCenterId === row.costCenterId)?.costCenterName ?? `#${row.costCenterId}`)
                                    : "None"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className='max-h-[260px]'>
                                <div className='p-1.5 border-b sticky top-0 bg-white z-10'>
                                  <Input
                                    placeholder='Search cost center...'
                                    value={ccSearch}
                                    onChange={(e) =>
                                      setDetailSearches((p) => ({ ...p, [`${row._key}_cc`]: e.target.value }))
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className='h-6 text-xs'
                                  />
                                </div>
                                <SelectItem value='none'>None</SelectItem>
                                {filteredCC.map((cc) => (
                                  <SelectItem key={cc.costCenterId} value={String(cc.costCenterId)}>
                                    {cc.costCenterCode} – {cc.costCenterName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Remove */}
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50'
                              onClick={() => removeRow(row._key)}
                            >
                              <FiMinus className='h-3 w-3' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {detailRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className='text-center py-8 text-gray-400 text-sm'>
                          No charge lines. Select a Job Order to auto-fill, or click "Add Row".
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
      {(isLoading && !showForm) && <AppLoader />}

      <div className='max-w-[1440px] mx-auto space-y-4'>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
              <Receipt className='h-6 w-6 text-indigo-600' />
              GL Invoices
            </h1>
            <p className='text-sm text-gray-500 mt-0.5'>Billing management for Job Orders</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={fetchRecords}
              disabled={isLoading}
              className='gap-1.5'
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              size='sm'
              onClick={openAdd}
              disabled={!lookupReady}
              className='bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' /> New Invoice
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {[
            { label: "Total Invoices", value: data.length, color: "text-gray-900" },
            {
              label: "Draft",
              value: data.filter((r) => (r.invoiceStatus || "").toLowerCase() === "draft").length,
              color: "text-yellow-700",
            },
            {
              label: "Processed",
              value: data.filter((r) => isAlreadyProcessed(r.invoiceStatus)).length,
              color: "text-green-700",
            },
            {
              label: "Total Amount",
              value: `PKR ${fmt(data.reduce((s, r) => s + r.totalAmount, 0))}`,
              color: "text-indigo-700",
            },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className='py-3 px-4'>
                <p className='text-xs text-gray-500 mb-0.5'>{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className='relative'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='Search bills by number, status, vendor invoice, party...'
            className='pl-9 h-9 text-sm'
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50 text-xs'>
                    <TableHead className='w-12'>#</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Pay To</TableHead>
                    <TableHead>Vendor Invoice No.</TableHead>
                    <TableHead className='text-right'>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right w-52'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className='text-center py-12 text-gray-400'>
                        <FiFileText className='h-8 w-8 mx-auto mb-2 opacity-40' />
                        <p className='text-sm'>No invoices found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((rec, idx) => {
                      const job = jobs.find((j) => j.jobId === rec.jobId);
                      const party = parties.find((p) => p.partyId === rec.payToPartyId);
                      const processed = isAlreadyProcessed(rec.invoiceStatus);
                      const isProcessingThis = processingId === rec.glInvoiceId;
                      return (
                        <TableRow key={rec.glInvoiceId} className='hover:bg-gray-50/80 text-sm'>
                          <TableCell className='text-gray-400 text-xs'>{idx + 1}</TableCell>
                          <TableCell className='font-medium'>{rec.invoiceNumber || `#${rec.glInvoiceId}`}</TableCell>
                          <TableCell className='text-xs'>
                            {rec.invoiceDate ? moment(rec.invoiceDate).format("DD MMM YYYY") : "—"}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {job?.jobNumber || (rec.jobId ? `#${rec.jobId}` : "—")}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {party?.partyName || (rec.payToPartyId ? `#${rec.payToPartyId}` : "—")}
                          </TableCell>
                          <TableCell className='text-xs'>{rec.vendorInvoiceNumber || "—"}</TableCell>
                          <TableCell className='text-right font-mono font-semibold'>
                            {fmt(rec.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className={`text-xs ${statusClass(rec.invoiceStatus)}`}>
                              {rec.invoiceStatus || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-gray-500 hover:text-indigo-700'
                                title='View'
                                onClick={() => handleView(rec)}
                              >
                                <FiEye className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-gray-500 hover:text-indigo-700'
                                title='Edit'
                                onClick={() => openEdit(rec)}
                                disabled={processed}
                              >
                                <FiEdit className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-gray-500 hover:text-green-700'
                                title='Process Invoice'
                                onClick={() => handleProcessInvoice(rec)}
                                disabled={processed || isProcessingThis}
                              >
                                {isProcessingThis ? (
                                  <FiLoader className='h-3.5 w-3.5 animate-spin' />
                                ) : (
                                  <FiCheckCircle className='h-3.5 w-3.5' />
                                )}
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-gray-500 hover:text-gray-900'
                                title='Download PDF'
                                onClick={() => handlePrintFromList(rec)}
                              >
                                <FiPrinter className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7 text-gray-500 hover:text-red-600'
                                title='Delete'
                                onClick={() => setDeleteTarget(rec)}
                                disabled={processed}
                              >
                                <FiTrash2 className='h-3.5 w-3.5' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Receipt className='h-5 w-5 text-indigo-600' />
              GL Invoice — {viewRecord?.invoiceNumber || `#${viewRecord?.glInvoiceId}`}
            </DialogTitle>
            <DialogDescription>
              {viewRecord?.invoiceDate ? moment(viewRecord.invoiceDate).format("DD MMM YYYY") : ""}
            </DialogDescription>
          </DialogHeader>

          {viewRecord && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                {[
                  ["Invoice Number", viewRecord.invoiceNumber || "—"],
                  ["Invoice Date", viewRecord.invoiceDate ? moment(viewRecord.invoiceDate).format("DD MMM YYYY") : "—"],
                  ["Job", jobs.find((j) => j.jobId === viewRecord.jobId)?.jobNumber || (viewRecord.jobId ? `#${viewRecord.jobId}` : "—")],
                  ["Pay To Party", parties.find((p) => p.partyId === viewRecord.payToPartyId)?.partyName || `#${viewRecord.payToPartyId}`],
                  ["Status", viewRecord.invoiceStatus || "—"],
                  ["Currency", currencies.find((c) => c.currencyId === viewRecord.currencyId)?.currencyCode || "—"],
                  ["Exchange Rate", String(viewRecord.exchangeRate)],
                  ["Due Days", String(viewRecord.dueDays || 0)],
                  ["Vendor Invoice No.", viewRecord.vendorInvoiceNumber || "—"],
                  ["Vendor Invoice Date", viewRecord.vendorInvoiceDate ? moment(viewRecord.vendorInvoiceDate).format("DD MMM YYYY") : "—"],
                  ["Bill Amount", fmt(viewRecord.invoiceAmount)],
                  ["Total Amount", fmt(viewRecord.totalAmount)],
                ].map(([label, value]) => (
                  <div key={label} className='bg-gray-50 rounded p-2.5'>
                    <p className='text-xs text-gray-500 mb-0.5'>{label}</p>
                    <p className='font-medium text-gray-900'>{value}</p>
                  </div>
                ))}
              </div>

              {viewRecord.invoiceDescription && (
                <div className='bg-gray-50 rounded p-2.5'>
                  <p className='text-xs text-gray-500 mb-0.5'>Description</p>
                  <p className='text-sm text-gray-900'>{viewRecord.invoiceDescription}</p>
                </div>
              )}

              {viewRecord.glInvoiceDetails?.length > 0 && (
                <div>
                  <p className='text-sm font-semibold text-gray-700 mb-2'>Charge Lines</p>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-gray-50 text-xs'>
                          <TableHead>#</TableHead>
                          <TableHead>Charge</TableHead>
                          <TableHead className='text-right'>Cost</TableHead>
                          <TableHead className='text-right'>Qty</TableHead>
                          <TableHead className='text-right'>Amount</TableHead>
                          <TableHead className='text-right'>Tax</TableHead>
                          <TableHead className='text-right'>Discount</TableHead>
                          <TableHead className='text-right'>Net Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewRecord.glInvoiceDetails.map((d, i) => {
                          const ch = charges.find((c) => c.chargesMasterId === d.chargesId);
                          return (
                            <TableRow key={d.glInvoiceDetailId} className='text-sm'>
                              <TableCell className='text-xs text-gray-400'>{i + 1}</TableCell>
                              <TableCell>{ch?.chargesName || `#${d.chargesId}`}</TableCell>
                              <TableCell className='text-right font-mono'>{fmt(d.cost)}</TableCell>
                              <TableCell className='text-right'>{d.qty}</TableCell>
                              <TableCell className='text-right font-mono'>{fmt(d.amount)}</TableCell>
                              <TableCell className='text-right font-mono'>{fmt(d.tax)}</TableCell>
                              <TableCell className='text-right font-mono'>{fmt(d.discount)}</TableCell>
                              <TableCell className='text-right font-mono font-semibold text-indigo-700'>
                                {fmt(d.netAmount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className='flex justify-end gap-3 pt-2 border-t'>
                <div className='text-right'>
                  <p className='text-xs text-gray-500'>Total Tax</p>
                  <p className='font-semibold font-mono'>{fmt(viewRecord.totalTax)}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-gray-500'>Discount</p>
                  <p className='font-semibold font-mono'>({fmt(viewRecord.discountTotal)})</p>
                </div>
                <div className='text-right bg-indigo-50 rounded px-3 py-1'>
                  <p className='text-xs text-indigo-500'>Total Amount</p>
                  <p className='text-lg font-bold text-indigo-700 font-mono'>{fmt(viewRecord.totalAmount)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setViewOpen(false)}>Close</Button>
            {viewRecord && (
              <Button
                onClick={() => { handlePDF(viewRecord); }}
                className='gap-1.5'
              >
                <FiPrinter className='h-3.5 w-3.5' /> Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertCircle className='h-5 w-5' /> Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice{" "}
              <strong>{deleteTarget?.invoiceNumber || `#${deleteTarget?.glInvoiceId}`}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDelete} disabled={isDeleting} className='gap-1.5'>
              {isDeleting ? <FiLoader className='h-3.5 w-3.5 animate-spin' /> : <FiTrash2 className='h-3.5 w-3.5' />}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
