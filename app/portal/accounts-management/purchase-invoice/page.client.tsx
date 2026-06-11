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
  FiDownload,
  FiPlus,
  FiMinus,
  FiCheckCircle,
  FiLoader,
  FiFileText,
} from "react-icons/fi";
import { AlertCircle, ShoppingCart } from "lucide-react";
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
type Job = { jobId: number; jobNumber: string };
type ChargeMaster = {
  chargesMasterId: number;
  chargesCode: string;
  chargesName: string;
};
type GlAccount = {
  accountId: number;
  accountCode: string;
  accountName: string;
};
type CostCenter = {
  costCenterId: number;
  costCenterCode: string;
  costCenterName: string;
};

type InvoiceDetail = {
  glinvoiceDetailId: number;
  glinvoiceId: number;
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

type Invoice = {
  glinvoiceId: number;
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
  billingPartyId: number;
  invoiceStatus: string;
  invoiceDescription: string;
  dueDays: number;
  glVoucherId: number | null;
  version: number;
  glinvoiceDetails: InvoiceDetail[];
  billingParty?: { partyId: number; partyName: string; partyCode: string };
  currency?: { currencyId: number; currencyCode: string };
  job?: { jobId: number; jobNumber: string };
};

// Detail row used in the form (inputs only; computed fields derived on-the-fly)
type DetailRow = {
  _key: string;
  glinvoiceDetailId: number;
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
};

type MasterForm = {
  invoiceDate: string;
  invoiceNumber: string;
  jobId: number | null;
  billingPartyId: number | null;
  currencyId: number | null;
  exchangeRate: number;
  invoiceStatus: string;
  invoiceDescription: string;
  dueDays: number;
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
  glinvoiceDetailId: 0,
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

const mapInvoice = (it: any): Invoice => ({
  glinvoiceId: it.glinvoiceId ?? it.GlinvoiceId ?? 0,
  invoiceDate: it.invoiceDate ?? it.InvoiceDate ?? "",
  invoiceNumber: it.invoiceNumber ?? it.InvoiceNumber ?? "",
  jobId: it.jobId ?? it.JobId ?? null,
  invoiceType: it.invoiceType ?? it.InvoiceType ?? 2,
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
  billingPartyId: it.billingPartyId ?? it.BillingPartyId ?? 0,
  invoiceStatus: it.invoiceStatus ?? it.InvoiceStatus ?? "",
  invoiceDescription: it.invoiceDescription ?? it.InvoiceDescription ?? "",
  dueDays: it.dueDays ?? it.DueDays ?? 0,
  glVoucherId: it.glVoucherId ?? it.GlVoucherId ?? null,
  version: it.version ?? it.Version ?? 1,
  glinvoiceDetails: [],
  billingParty: it.billingParty ?? undefined,
  currency: it.currency ?? undefined,
  job: it.job ?? undefined,
});

const mapDetail = (d: any): InvoiceDetail => ({
  glinvoiceDetailId: d.glinvoiceDetailId ?? d.GlinvoiceDetailId ?? 0,
  glinvoiceId: d.glinvoiceId ?? d.GlinvoiceId ?? 0,
  chargesId: d.chargesId ?? d.ChargesId ?? 0,
  cost: d.cost ?? d.Cost ?? 0,
  amount: d.amount ?? d.Amount ?? 0,
  qty: d.qty ?? d.Qty ?? 1,
  exchangeRate: d.exchangeRate ?? d.ExchangeRate ?? 1,
  currencyId: d.currencyId ?? d.CurrencyId ?? 0,
  costLc: d.costLc ?? d.CostLc ?? d.CostLC ?? 0,
  amountLc: d.amountLc ?? d.AmountLc ?? d.AmountLC ?? 0,
  tax: d.tax ?? d.Tax ?? 0,
  taxFc: d.taxFc ?? d.TaxFc ?? d.TaxFC ?? 0,
  discount: d.discount ?? d.Discount ?? 0,
  discountFc: d.discountFc ?? d.DiscountFc ?? d.DiscountFC ?? 0,
  netAmount: d.netAmount ?? d.NetAmount ?? 0,
  netAmountFc: d.netAmountFc ?? d.NetAmountFc ?? d.NetAmountFC ?? 0,
  fromCoaId: d.fromCoaId ?? d.FromCoaId ?? d.FromCoAId ?? 0,
  toCoaId: d.toCoaId ?? d.ToCoaId ?? d.ToCoAId ?? 0,
  costCenterId: d.costCenterId ?? d.CostCenterId ?? null,
  version: d.version ?? d.Version ?? 1,
});

const STATUSES = ["Draft", "Processed", "Pending", "Cancelled"];

const statusClass = (s: string) => {
  const v = (s || "").toLowerCase();
  if (v === "processed") return "bg-green-50 text-green-700 border-green-200";
  if (v === "draft") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (v === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  if (v === "pending") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurchaseInvoiceClient() {
  // ── List state ─────────────────────────────────────────────────────────────
  const [data, setData] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // ── Lookup state ───────────────────────────────────────────────────────────
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [charges, setCharges] = useState<ChargeMaster[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [lookupReady, setLookupReady] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [masterForm, setMasterForm] = useState<MasterForm>({
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    jobId: null,
    billingPartyId: null,
    currencyId: null,
    exchangeRate: 1,
    invoiceStatus: "Draft",
    invoiceDescription: "",
    dueDays: 0,
    partialPayment: 0,
  });
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [viewOpen, setViewOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Inline search for big dropdowns ───────────────────────────────────────
  const [partySearch, setPartySearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  const { toast } = useToast();

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const postList = async (endpoint: string, select: string, where = "", sort = "") => {
    const res = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        select,
        where,
        search: "",
        sortOn: sort,
        page: "1",
        pageSize: "500",
      }),
    });
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
  };

  // ── Fetch invoice list ─────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await postList(
        "GLInvoice/GetList",
        "GlinvoiceId, InvoiceDate, InvoiceNumber, JobId, InvoiceType, BillingPartyId, InvoiceAmount, TotalTax, DiscountTotal, TotalAmount, TotalAmountFC, InvoiceStatus, CurrencyId, ExchangeRate, InvoiceDescription, DueDays, PartialPayment, GlVoucherId, Version",
        "InvoiceType == 2",
        "GlinvoiceId DESC",
      );
      setData(rows.map(mapInvoice));
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load invoices." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // eslint-disable-line

  // ── Fetch single invoice (full) ────────────────────────────────────────────
  const fetchById = useCallback(async (id: number): Promise<Invoice | null> => {
    try {
      const res = await fetch(`${getBaseUrl()}GLInvoice/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const raw = await res.json();
      return {
        ...mapInvoice(raw),
        glinvoiceDetails: (raw.glinvoiceDetails ?? raw.GlinvoiceDetails ?? []).map(mapDetail),
      };
    } catch {
      return null;
    }
  }, []);

  // ── Fetch all lookup data in parallel ─────────────────────────────────────
  const fetchLookups = useCallback(async () => {
    try {
      const [currRaw, partyRaw, jobRaw, chargeRaw, acctRaw, ccRaw] =
        await Promise.all([
          postList("SetupCurrency/GetList", "CurrencyId, CurrencyCode, CurrencyName, Symbol, IsDefault", "", "CurrencyCode ASC"),
          postList("Party/GetList", "PartyId, PartyCode, PartyName", "", "PartyName ASC"),
          postList("Job/GetList", "JobId, JobNumber", "", "JobId DESC"),
          postList("ChargesMaster/GetList", "ChargesMasterId, ChargesCode, ChargesName", "", "ChargesName ASC"),
          postList("GlAccount/GetList", "AccountId, AccountCode, AccountName", "", "AccountCode ASC"),
          postList("CostCenter/GetList", "CostCenterId, CostCenterCode, CostCenterName", "", "CostCenterCode ASC"),
        ]);

      const curr: Currency[] = currRaw.map((c: any) => ({
        currencyId: c.currencyId ?? c.CurrencyId ?? 0,
        currencyCode: c.currencyCode ?? c.CurrencyCode ?? "",
        currencyName: c.currencyName ?? c.CurrencyName ?? "",
        symbol: c.symbol ?? c.Symbol ?? "",
        isDefault: c.isDefault ?? c.IsDefault ?? false,
      }));
      setCurrencies(curr);
      setParties(partyRaw.map((p: any) => ({
        partyId: p.partyId ?? p.PartyId ?? 0,
        partyCode: p.partyCode ?? p.PartyCode ?? "",
        partyName: p.partyName ?? p.PartyName ?? "",
      })));
      setJobs(jobRaw.map((j: any) => ({
        jobId: j.jobId ?? j.JobId ?? 0,
        jobNumber: j.jobNumber ?? j.JobNumber ?? "",
      })));
      setCharges(chargeRaw.map((ch: any) => ({
        chargesMasterId: ch.chargesMasterId ?? ch.ChargesMasterId ?? ch.chargesId ?? ch.ChargesId ?? 0,
        chargesCode: ch.chargesCode ?? ch.ChargesCode ?? "",
        chargesName: ch.chargesName ?? ch.ChargesName ?? ch.chargeName ?? ch.ChargeName ?? "",
      })));
      setAccounts(acctRaw.map((a: any) => ({
        accountId: a.accountId ?? a.AccountId ?? 0,
        accountCode: a.accountCode ?? a.AccountCode ?? "",
        accountName: a.accountName ?? a.AccountName ?? "",
      })));
      setCostCenters(ccRaw.map((cc: any) => ({
        costCenterId: cc.costCenterId ?? cc.CostCenterId ?? 0,
        costCenterCode: cc.costCenterCode ?? cc.CostCenterCode ?? "",
        costCenterName: cc.costCenterName ?? cc.CostCenterName ?? "",
      })));

      // Auto-set default currency in form
      const def = curr.find((c) => c.isDefault);
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
    fetchInvoices();
    fetchLookups();
  }, [fetchInvoices, fetchLookups]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchText) return data;
    const q = searchText.toLowerCase();
    return data.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.invoiceStatus || "").toLowerCase().includes(q) ||
        (inv.invoiceDescription || "").toLowerCase().includes(q) ||
        String(inv.glinvoiceId).includes(q) ||
        String(inv.billingPartyId).includes(q) ||
        (inv.billingParty?.partyName || "").toLowerCase().includes(q),
    );
  }, [data, searchText]);

  // ── Computed rows (derived from detailRows for totals/display) ─────────────
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

  // ── Filtered dropdowns for searchable selects ──────────────────────────────
  const filteredParties = useMemo(() => {
    if (!partySearch) return parties.slice(0, 150);
    const q = partySearch.toLowerCase();
    return parties
      .filter((p) => p.partyName.toLowerCase().includes(q) || p.partyCode.toLowerCase().includes(q))
      .slice(0, 150);
  }, [parties, partySearch]);

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobs.slice(0, 150);
    const q = jobSearch.toLowerCase();
    return jobs.filter((j) => j.jobNumber.toLowerCase().includes(q)).slice(0, 150);
  }, [jobs, jobSearch]);

  // ── Open add form ──────────────────────────────────────────────────────────
  const openAdd = () => {
    const def = currencies.find((c) => c.isDefault) ?? currencies[0];
    setEditingInvoice(null);
    setMasterForm({
      invoiceDate: new Date().toISOString().slice(0, 10),
      invoiceNumber: "",
      jobId: null,
      billingPartyId: null,
      currencyId: def?.currencyId ?? null,
      exchangeRate: 1,
      invoiceStatus: "Draft",
      invoiceDescription: "",
      dueDays: 0,
      partialPayment: 0,
    });
    setDetailRows([blankRow(1, def?.currencyId ?? 0)]);
    setPartySearch("");
    setJobSearch("");
    setShowForm(true);
  };

  // ── Open edit form ─────────────────────────────────────────────────────────
  const openEdit = async (inv: Invoice) => {
    setIsLoading(true);
    const full = await fetchById(inv.glinvoiceId);
    setIsLoading(false);
    if (!full) {
      toast({ variant: "destructive", title: "Error", description: "Could not load invoice." });
      return;
    }
    setEditingInvoice(full);
    setMasterForm({
      invoiceDate: full.invoiceDate?.slice(0, 10) ?? "",
      invoiceNumber: full.invoiceNumber,
      jobId: full.jobId,
      billingPartyId: full.billingPartyId,
      currencyId: full.currencyId,
      exchangeRate: full.exchangeRate,
      invoiceStatus: full.invoiceStatus,
      invoiceDescription: full.invoiceDescription ?? "",
      dueDays: full.dueDays ?? 0,
      partialPayment: full.partialPayment ?? 0,
    });
    setDetailRows(
      full.glinvoiceDetails.map((d) => ({
        _key: Math.random().toString(36).slice(2),
        glinvoiceDetailId: d.glinvoiceDetailId,
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
    setShowForm(true);
  };

  // ── Save (create / update) ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!masterForm.billingPartyId) {
      toast({ variant: "destructive", title: "Validation", description: "Billing Party is required." });
      return;
    }
    if (!masterForm.currencyId) {
      toast({ variant: "destructive", title: "Validation", description: "Currency is required." });
      return;
    }
    if (detailRows.length === 0) {
      toast({ variant: "destructive", title: "Validation", description: "At least one invoice line is required." });
      return;
    }
    if (detailRows.some((r) => !r.chargesId || !r.fromCoaId || !r.toCoaId)) {
      toast({ variant: "destructive", title: "Validation", description: "Each line needs Charge, From CoA and To CoA." });
      return;
    }

    const { invoiceAmount, totalTax, discountTotal, totalAmount } = masterTotals;
    const exRate = masterForm.exchangeRate;
    const isEdit = !!editingInvoice;

    const payload = {
      glinvoiceId: editingInvoice?.glinvoiceId ?? 0,
      invoiceDate: masterForm.invoiceDate,
      invoiceNumber: masterForm.invoiceNumber,
      jobId: masterForm.jobId,
      invoiceType: 2,
      invoiceAmount,
      invoiceAmountFc: invoiceAmount * exRate,
      exchangeRate: exRate,
      currencyId: masterForm.currencyId,
      totalTax,
      totalTaxFc: totalTax * exRate,
      discountTotal,
      discountTotalFc: discountTotal * exRate,
      partialPayment: masterForm.partialPayment,
      totalAmount,
      totalAmountFc: totalAmount * exRate,
      billingPartyId: masterForm.billingPartyId,
      invoiceStatus: masterForm.invoiceStatus,
      invoiceDescription: masterForm.invoiceDescription,
      dueDays: masterForm.dueDays,
      glVoucherId: editingInvoice?.glVoucherId ?? null,
      version: editingInvoice?.version ?? 1,
      glinvoiceDetails: computedRows.map((r) => ({
        glinvoiceDetailId: r.glinvoiceDetailId,
        glinvoiceId: editingInvoice?.glinvoiceId ?? 0,
        chargesId: r.chargesId,
        cost: r.cost,
        amount: r.amount,
        qty: r.qty,
        exchangeRate: r.exchangeRate,
        currencyId: r.currencyId,
        costLc: r.costLc,
        amountLc: r.amountLc,
        tax: r.tax,
        taxFc: r.taxFc,
        discount: r.discount,
        discountFc: r.discountFc,
        netAmount: r.netAmount,
        netAmountFc: r.netAmountFc,
        fromCoaId: r.fromCoaId,
        toCoaId: r.toCoaId,
        costCenterId: r.costCenterId,
        version: r.version,
      })),
    };

    setIsSaving(true);
    try {
      const res = await fetch(`${getBaseUrl()}GLInvoice`, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = `Failed (${res.status})`;
        try {
          const p = JSON.parse(txt);
          if (p.title) msg = p.title;
          else if (p.message) msg = p.message;
          else if (Array.isArray(p)) msg = p.join(", ");
          else msg = txt || msg;
        } catch { msg = txt || msg; }
        throw new Error(msg);
      }
      toast({
        title: isEdit ? "Invoice Updated" : "Invoice Created",
        description: `${masterForm.invoiceNumber || "Invoice"} saved successfully.`,
      });
      setShowForm(false);
      setEditingInvoice(null);
      fetchInvoices();
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
      const res = await fetch(`${getBaseUrl()}GLInvoice/${deleteTarget.glinvoiceId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setData((prev) => prev.filter((i) => i.glinvoiceId !== deleteTarget.glinvoiceId));
      toast({ title: "Deleted", description: `Invoice ${deleteTarget.invoiceNumber} removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete invoice." });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── View ───────────────────────────────────────────────────────────────────
  const handleView = async (inv: Invoice) => {
    setIsLoading(true);
    const full = await fetchById(inv.glinvoiceId);
    setIsLoading(false);
    setViewInvoice(full ?? inv);
    setViewOpen(true);
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const handlePDF = useCallback(
    (inv: Invoice) => {
      try {
        const doc = new jsPDF("portrait", "mm", "a4");
        const W = doc.internal.pageSize.getWidth();

        // Header bar
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, W, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(17);
        doc.setFont("helvetica", "bold");
        doc.text("PURCHASE INVOICE", 14, 13);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Printed: ${moment().format("DD MMM YYYY, HH:mm")}`, W - 14, 13, { align: "right" });

        // Status pill
        const sv = (inv.invoiceStatus || "").toLowerCase();
        const sc: [number, number, number] =
          sv === "processed" ? [22, 163, 74] : sv === "cancelled" ? [220, 38, 38] : [202, 138, 4];
        doc.setFillColor(...sc);
        doc.roundedRect(W - 54, 17, 40, 8, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(inv.invoiceStatus || "—", W - 34, 22.5, { align: "center" });

        // Info rows
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
        info("Invoice Number", inv.invoiceNumber || "—", 14, y);
        info("Invoice Date", inv.invoiceDate ? moment(inv.invoiceDate).format("DD MMM YYYY") : "—", 75, y);
        info("Status", inv.invoiceStatus || "—", 140, y);
        y += 14;
        info(
          "Billing Party",
          inv.billingParty?.partyName || `Party #${inv.billingPartyId}`,
          14,
          y,
        );
        info("Job", inv.job?.jobNumber || (inv.jobId ? `#${inv.jobId}` : "—"), 75, y);
        info("Due Days", String(inv.dueDays || 0), 140, y);
        y += 14;

        if (inv.invoiceDescription) {
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text("DESCRIPTION", 14, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(20, 20, 20);
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(inv.invoiceDescription, W - 28);
          doc.text(lines, 14, y + 5);
          y += 5 + lines.length * 5;
        }

        y += 4;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(14, y, W - 14, y);
        y += 6;

        // Detail table
        const details = inv.glinvoiceDetails || [];
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

        // Summary box
        const fy = (doc as any).lastAutoTable.finalY + 6;
        const rows: [string, string, boolean][] = [
          ["Invoice Amount", fmt(inv.invoiceAmount), false],
          ["Total Tax", fmt(inv.totalTax), false],
          ["Discount Total", `(${fmt(inv.discountTotal)})`, false],
          ["Partial Payment", fmt(inv.partialPayment), false],
          ["TOTAL AMOUNT", fmt(inv.totalAmount), true],
        ];
        let sy = fy;
        rows.forEach(([label, value, bold]) => {
          if (bold) {
            doc.setFillColor(30, 64, 175);
            doc.rect(W - 80, sy - 4, 66, 9, "F");
            doc.setTextColor(255, 255, 255);
          } else {
            doc.setTextColor(60, 60, 60);
          }
          doc.setFontSize(bold ? 9 : 8);
          doc.setFont("helvetica", bold ? "bold" : "normal");
          doc.text(label + ":", W - 78, sy + 1);
          doc.text(value, W - 14, sy + 1, { align: "right" });
          sy += 9;
        });

        // Signature area
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

        // Footer
        const pH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text("System generated document.", 14, pH - 8);
        doc.text(`Generated: ${moment().format("DD MMM YYYY HH:mm")}`, W - 14, pH - 8, { align: "right" });

        doc.save(`Invoice_${inv.invoiceNumber || inv.glinvoiceId}_${moment().format("YYYYMMDD")}.pdf`);
        toast({ title: "PDF Downloaded", description: inv.invoiceNumber || `#${inv.glinvoiceId}` });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
      }
    },
    [charges, toast],
  );

  const handlePrintFromList = useCallback(
    async (inv: Invoice) => {
      setIsLoading(true);
      const full = await fetchById(inv.glinvoiceId);
      setIsLoading(false);
      handlePDF(full ?? inv);
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
                onClick={() => { setShowForm(false); setEditingInvoice(null); }}
                className='gap-1.5'
              >
                <FiArrowLeft className='h-3.5 w-3.5' /> Back
              </Button>
              <div>
                <h1 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <ShoppingCart className='h-5 w-5 text-blue-600' />
                  {editingInvoice ? "Edit Purchase Invoice" : "New Purchase Invoice"}
                </h1>
                <p className='text-xs text-gray-500 mt-0.5'>Invoice Type: Purchase (2)</p>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={() => { setShowForm(false); setEditingInvoice(null); }}>
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
                  <><FiCheckCircle className='h-3.5 w-3.5' /> {editingInvoice ? "Update" : "Create"} Invoice</>
                )}
              </Button>
            </div>
          </div>

          {/* Master Card */}
          <Card>
            <CardHeader className='py-3 px-4 bg-blue-50 border-b border-blue-100'>
              <CardTitle className='text-sm font-semibold text-blue-900 flex items-center gap-2'>
                <Badge className='bg-blue-600 text-white'>Master</Badge>
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>

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
                    type='text'
                    placeholder='e.g. PINV-26/00001'
                    value={masterForm.invoiceNumber}
                    onChange={(e) => setMasterForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Invoice Status */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Invoice Status *</Label>
                  <Select
                    value={masterForm.invoiceStatus}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, invoiceStatus: v }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing Party */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Billing Party *</Label>
                  <Select
                    value={masterForm.billingPartyId?.toString() ?? ""}
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, billingPartyId: v ? parseInt(v, 10) : null }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue placeholder='Select party...' />
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
                    onValueChange={(v) => setMasterForm((p) => ({ ...p, jobId: v ? parseInt(v, 10) : null }))}
                  >
                    <SelectTrigger className='h-9 text-sm bg-white'>
                      <SelectValue placeholder='Select job (optional)...' />
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
                      <SelectValue placeholder='Select currency...' />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.currencyId} value={c.currencyId.toString()}>
                          {c.currencyCode} — {c.currencyName}
                          {c.isDefault && <span className='ml-1 text-xs text-blue-500'>(default)</span>}
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

                {/* Due Days */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Due Days</Label>
                  <Input
                    type='number'
                    min='0'
                    value={masterForm.dueDays}
                    onChange={(e) => setMasterForm((p) => ({ ...p, dueDays: parseInt(e.target.value) || 0 }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Partial Payment */}
                <div>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Partial Payment</Label>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    value={masterForm.partialPayment}
                    onChange={(e) => setMasterForm((p) => ({ ...p, partialPayment: parseFloat(e.target.value) || 0 }))}
                    className='h-9 text-sm'
                  />
                </div>

                {/* Description */}
                <div className='md:col-span-3'>
                  <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>Invoice Description</Label>
                  <Textarea
                    value={masterForm.invoiceDescription}
                    onChange={(e) => setMasterForm((p) => ({ ...p, invoiceDescription: e.target.value }))}
                    className='min-h-[64px] text-sm resize-none'
                    placeholder='Add description...'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail Lines */}
          <Card>
            <CardHeader className='py-3 px-4 bg-gray-50 border-b'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-semibold text-gray-800'>
                  Invoice Lines
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
                        <th
                          key={label}
                          className={`px-3 py-2 font-semibold text-gray-600 text-left ${cls}`}
                        >
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
                                  <SelectValue placeholder='Select charge...' />
                                </SelectTrigger>
                                <SelectContent className='max-h-[200px]'>
                                  {charges.map((ch) => (
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
                                  <SelectValue placeholder='From CoA...' />
                                </SelectTrigger>
                                <SelectContent className='max-h-[220px] w-[280px]'>
                                  {accounts.map((a) => (
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
                                  <SelectValue placeholder='To CoA...' />
                                </SelectTrigger>
                                <SelectContent className='max-h-[220px] w-[280px]'>
                                  {accounts.map((a) => (
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
                                  <SelectValue placeholder='CCY' />
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
                                  <SelectValue placeholder='Optional' />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value=''>— None —</SelectItem>
                                  {costCenters.map((cc) => (
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

                  {/* Table footer totals */}
                  {detailRows.length > 0 && (
                    <tfoot>
                      <tr className='bg-blue-50 border-t-2 border-blue-200'>
                        <td colSpan={4} className='px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wide'>
                          Totals
                        </td>
                        <td className='px-3 py-2 text-right text-sm font-bold text-gray-800'>
                          {fmt(masterTotals.invoiceAmount)}
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
                    ["Invoice Amount", fmt(masterTotals.invoiceAmount), "text-gray-700"],
                    ["Total Tax", fmt(masterTotals.totalTax), "text-amber-700"],
                    ["Discount Total", `(${fmt(masterTotals.discountTotal)})`, "text-red-600"],
                    ["Partial Payment", fmt(masterForm.partialPayment), "text-gray-600"],
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
                <Button variant='outline' onClick={() => { setShowForm(false); setEditingInvoice(null); }}>
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
                    <><FiCheckCircle className='h-4 w-4' /> {editingInvoice ? "Update" : "Create"} Invoice</>
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
              <ShoppingCart className='h-6 w-6 text-blue-600' />
              Purchase Invoices
            </h1>
            <p className='text-sm text-gray-500 mt-0.5'>GL Invoices — Type: Purchase (2)</p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={fetchInvoices} disabled={isLoading} className='gap-1.5'>
              <FiRefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              size='sm'
              onClick={openAdd}
              disabled={!lookupReady}
              className='bg-blue-600 hover:bg-blue-700 text-white gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' /> New Invoice
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {[
            { label: "Total Invoices", value: data.length, cls: "text-blue-700" },
            { label: "Processed", value: data.filter((i) => i.invoiceStatus === "Processed").length, cls: "text-green-700" },
            { label: "Draft / Pending", value: data.filter((i) => i.invoiceStatus === "Draft" || i.invoiceStatus === "Pending").length, cls: "text-yellow-700" },
            { label: "Grand Total", value: fmt(data.reduce((s, i) => s + i.totalAmount, 0)), cls: "text-purple-700" },
          ].map((card) => (
            <Card key={card.label} className='shadow-sm'>
              <CardContent className='p-3'>
                <p className='text-xs text-gray-500'>{card.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${card.cls}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className='shadow-sm'>
          <CardHeader className='py-3 px-4 bg-gray-50 border-b'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                <FiFileText className='h-4 w-4 text-blue-600' />
                Invoice List
                <Badge variant='outline' className='text-xs'>{filtered.length}</Badge>
              </CardTitle>
              <div className='relative w-72'>
                <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                <Input
                  placeholder='Search invoice no, party, status...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-7 h-8 text-sm'
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
          </CardHeader>

          <CardContent className='p-0'>
            {filtered.length === 0 && !isLoading ? (
              <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
                <AlertCircle className='h-10 w-10 mb-3 text-gray-300' />
                <p className='text-sm font-medium'>No purchase invoices found</p>
                <p className='text-xs mt-1'>
                  {searchText
                    ? "Try adjusting your search."
                    : "Click 'New Invoice' to create one."}
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-8 text-xs text-center'>#</TableHead>
                      <TableHead className='text-xs'>Actions</TableHead>
                      <TableHead className='text-xs min-w-[120px]'>Invoice No</TableHead>
                      <TableHead className='text-xs min-w-[100px]'>Date</TableHead>
                      <TableHead className='text-xs min-w-[180px]'>Billing Party</TableHead>
                      <TableHead className='text-xs min-w-[100px]'>Job</TableHead>
                      <TableHead className='text-xs text-right min-w-[110px]'>Invoice Amt</TableHead>
                      <TableHead className='text-xs text-right min-w-[90px]'>Tax</TableHead>
                      <TableHead className='text-xs text-right min-w-[90px]'>Discount</TableHead>
                      <TableHead className='text-xs text-right min-w-[110px]'>Total Amount</TableHead>
                      <TableHead className='text-xs min-w-[100px]'>Status</TableHead>
                      <TableHead className='text-xs min-w-[70px]'>Due Days</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={12} className='text-center py-12 text-gray-400'>
                          <FiLoader className='animate-spin inline h-5 w-5 mr-2' />
                          Loading invoices...
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((inv, idx) => (
                        <TableRow key={inv.glinvoiceId} className='hover:bg-gray-50 transition-colors'>
                          <TableCell className='text-center text-xs text-gray-400'>{idx + 1}</TableCell>

                          <TableCell>
                            <div className='flex gap-1'>
                              <button
                                onClick={() => handleView(inv)}
                                className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
                                title='View Details'
                              >
                                <FiEye size={13} />
                              </button>
                              <button
                                onClick={() => openEdit(inv)}
                                className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors'
                                title='Edit Invoice'
                              >
                                <FiEdit size={13} />
                              </button>
                              <button
                                onClick={() => handlePrintFromList(inv)}
                                className='p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors'
                                title='Download PDF'
                              >
                                <FiPrinter size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(inv)}
                                className='p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors'
                                title='Delete Invoice'
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </TableCell>

                          <TableCell className='text-xs font-medium text-blue-700'>
                            {inv.invoiceNumber || <span className='text-gray-400 italic'>—</span>}
                          </TableCell>

                          <TableCell className='text-xs text-gray-700'>
                            {inv.invoiceDate
                              ? moment(inv.invoiceDate).format("DD MMM YYYY")
                              : "—"}
                          </TableCell>

                          <TableCell className='text-xs text-gray-700'>
                            {inv.billingParty?.partyName ||
                              (inv.billingPartyId ? `Party #${inv.billingPartyId}` : "—")}
                          </TableCell>

                          <TableCell className='text-xs text-gray-600'>
                            {inv.job?.jobNumber ||
                              (inv.jobId ? `#${inv.jobId}` : <span className='text-gray-300'>—</span>)}
                          </TableCell>

                          <TableCell className='text-xs text-right text-gray-700'>
                            {fmt(inv.invoiceAmount)}
                          </TableCell>
                          <TableCell className='text-xs text-right text-amber-700'>
                            {fmt(inv.totalTax)}
                          </TableCell>
                          <TableCell className='text-xs text-right text-red-600'>
                            {fmt(inv.discountTotal)}
                          </TableCell>
                          <TableCell className='text-xs text-right font-semibold text-blue-800'>
                            {fmt(inv.totalAmount)}
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusClass(inv.invoiceStatus)}`}
                            >
                              {inv.invoiceStatus || "—"}
                            </span>
                          </TableCell>

                          <TableCell className='text-xs text-gray-600'>
                            {inv.dueDays || <span className='text-gray-300'>—</span>}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading && !data.length && <AppLoader />}

      {/* ── View Dialog ── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className='max-w-5xl max-h-[92vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' /> Invoice Details
            </DialogTitle>
            <DialogDescription>
              {viewInvoice?.invoiceNumber || `Invoice #${viewInvoice?.glinvoiceId}`}
              {viewInvoice?.invoiceDate && ` | ${moment(viewInvoice.invoiceDate).format("DD MMM YYYY")}`}
            </DialogDescription>
          </DialogHeader>

          {viewInvoice && (
            <div className='space-y-4'>
              {/* Master info */}
              <Card>
                <CardHeader className='py-2 px-4 bg-blue-50'>
                  <CardTitle className='text-sm font-medium flex items-center gap-2'>
                    <Badge className='bg-blue-600 text-white'>Master</Badge>
                    Invoice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm'>
                    {[
                      ["Invoice ID", `#${viewInvoice.glinvoiceId}`],
                      ["Invoice Number", viewInvoice.invoiceNumber || "—"],
                      ["Invoice Date", viewInvoice.invoiceDate ? moment(viewInvoice.invoiceDate).format("DD MMM YYYY") : "—"],
                      ["Billing Party", viewInvoice.billingParty?.partyName || `Party #${viewInvoice.billingPartyId}`],
                      ["Job", viewInvoice.job?.jobNumber || (viewInvoice.jobId ? `#${viewInvoice.jobId}` : "—")],
                      ["Currency", viewInvoice.currency?.currencyCode || `Currency #${viewInvoice.currencyId}`],
                      ["Exchange Rate", String(viewInvoice.exchangeRate)],
                      ["Due Days", String(viewInvoice.dueDays || 0)],
                      ["Invoice Amount", fmt(viewInvoice.invoiceAmount)],
                      ["Total Tax", fmt(viewInvoice.totalTax)],
                      ["Discount Total", fmt(viewInvoice.discountTotal)],
                      ["Partial Payment", fmt(viewInvoice.partialPayment)],
                      ["Total Amount", fmt(viewInvoice.totalAmount)],
                      ["GL Voucher", viewInvoice.glVoucherId ? `#${viewInvoice.glVoucherId}` : "—"],
                    ].map(([label, value]) => (
                      <div key={label} className='flex justify-between border-b border-gray-50 pb-1'>
                        <span className='text-gray-500 text-xs'>{label}:</span>
                        <span className='font-medium text-gray-800 text-xs'>{value}</span>
                      </div>
                    ))}
                    <div className='flex justify-between border-b border-gray-50 pb-1'>
                      <span className='text-gray-500 text-xs'>Status:</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusClass(viewInvoice.invoiceStatus)}`}>
                        {viewInvoice.invoiceStatus || "—"}
                      </span>
                    </div>
                    {viewInvoice.invoiceDescription && (
                      <div className='col-span-2 flex justify-between border-b border-gray-50 pb-1'>
                        <span className='text-gray-500 text-xs'>Description:</span>
                        <span className='font-medium text-gray-800 text-xs text-right max-w-[60%]'>
                          {viewInvoice.invoiceDescription}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detail lines */}
              <Card>
                <CardHeader className='py-2 px-4 bg-gray-50'>
                  <CardTitle className='text-sm font-medium flex items-center gap-2'>
                    <Badge variant='outline'>Details</Badge>
                    Invoice Lines ({viewInvoice.glinvoiceDetails?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  {viewInvoice.glinvoiceDetails?.length ? (
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
                          {viewInvoice.glinvoiceDetails.map((d, i) => {
                            const ch = charges.find((c) => c.chargesMasterId === d.chargesId);
                            const fromAcc = accounts.find((a) => a.accountId === d.fromCoaId);
                            const toAcc = accounts.find((a) => a.accountId === d.toCoaId);
                            return (
                              <TableRow key={d.glinvoiceDetailId || i}>
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
                              {fmt(viewInvoice.glinvoiceDetails.reduce((s, d) => s + d.amount, 0))}
                            </td>
                            <td className='px-4 py-2 text-right text-amber-700'>
                              {fmt(viewInvoice.glinvoiceDetails.reduce((s, d) => s + d.tax, 0))}
                            </td>
                            <td className='px-4 py-2 text-right text-red-600'>
                              {fmt(viewInvoice.glinvoiceDetails.reduce((s, d) => s + d.discount, 0))}
                            </td>
                            <td className='px-4 py-2 text-right text-blue-800 font-bold'>
                              {fmt(viewInvoice.glinvoiceDetails.reduce((s, d) => s + d.netAmount, 0))}
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
              onClick={() => { if (viewInvoice) handlePDF(viewInvoice); }}
            >
              <FiDownload className='h-4 w-4' /> Download PDF
            </Button>
            <Button
              variant='outline'
              className='gap-2 text-green-700 border-green-200 hover:bg-green-50'
              onClick={() => { if (viewInvoice) { setViewOpen(false); openEdit(viewInvoice); } }}
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
              <FiTrash2 className='h-5 w-5' /> Delete Invoice
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice{" "}
              <strong>{deleteTarget?.invoiceNumber || `#${deleteTarget?.glinvoiceId}`}</strong>?
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
    </div>
  );
}
