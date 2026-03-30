"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import AppLoader from "@/components/app-loader";
import {
  FiTrash2,
  FiDownload,
  FiEdit,
  FiArrowLeft,
  FiFilePlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiList,
  FiFileText,
  FiPrinter,
} from "react-icons/fi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import { useToast } from "@/hooks/use-toast";
import VoucherForm from "@/views/forms/voucher/VoucherForm";

// ─── Props ────────────────────────────────────────────────────────────────────

type VoucherPageProps = {
  initialData?: any[];
};

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountingPeriod = {
  accountingPeriodId: number;
  fiscalYearId: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: string;
  version: number;
};

type Account = {
  accountId: number;
  companyId: number;
  parentAccountId: number;
  accountCode: string;
  accountName: string;
  description: string;
  accountLevel: number;
  accountType: string;
  accountNature: string;
  isHeader: boolean;
  isActive: boolean;
  version: number;
};

type CostCenter = {
  costCenterId: number;
  companyId: number;
  costCenterCode: string;
  costCenterName: string;
  description: string;
  isActive: boolean;
  version: number;
};

type VoucherDetail = {
  voucherDetailId: number;
  voucherId: number;
  accountId: number;
  debitAmount: number;
  creditAmount: number;
  description: string;
  costCenterId: number;
  account: Account;
  costCenter: CostCenter;
  version: number;
};

type Voucher = {
  voucherId: number;
  companyId: number;
  branchId: number;
  voucherTypeId: number;
  voucherNumber: string;
  voucherDate: string;
  accountingPeriodId: number;
  narration: string;
  referenceNumber: string;
  status: string;
  postedBy: number;
  postedAt: string;
  accountingPeriod: AccountingPeriod;
  voucherDetails: VoucherDetail[];
  version: number;
};

type StatusOption = { key: string; label: string };

// ─── Print styles (injected once) ────────────────────────────────────────────
// ── 1. Fix print styles — use display:none approach ──────────────────────────
const PRINT_STYLES = `
  @media print {
    body > *:not(#voucher-print-root) { display: none !important; }
    #voucher-print-root {
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      background: white !important;
    }
    #voucher-print-area {
      display: block !important;
      padding: 20px !important;
    }
    .print\\:hidden { display: none !important; }
    @page { margin: 1cm; size: A4 portrait; }
  }
`;
// ─── Component ────────────────────────────────────────────────────────────────

export default function VoucherClientPage({ initialData }: VoucherPageProps) {
  const [data, setData] = useState<Voucher[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedVoucherDetails, setSelectedVoucherDetails] =
    useState<Voucher | null>(null);
  const [voucherToPrint, setVoucherToPrint] = useState<Voucher | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // ── Inject print styles once ──────────────────────────────────────────────
  useEffect(() => {
    const id = "voucher-print-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = PRINT_STYLES;
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  // ── Fetch status options ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL;
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
        }
      } catch (e) {
        console.error("Status fetch error:", e);
      }
    };
    fetchStatuses();
  }, []);

  const statusFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      ...statusOptions.map((o) => ({ value: o.key, label: o.label })),
    ],
    [statusOptions],
  );

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}GLVoucher/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "VoucherId, CompanyId, BranchId, VoucherTypeId, VoucherNumber, VoucherDate, AccountingPeriodId, Narration, ReferenceNumber, Status, PostedBy, PostedAt, Version",
          where: "",
          sortOn: "VoucherId DESC",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const result = await response.json();
        const processed: Voucher[] = result.map((item: any) => ({
          ...item,
          voucherDetails: item.voucherDetails || [],
        }));
        setData(processed);
        toast({
          title: "Success",
          description: `Loaded ${processed.length} voucher(s)`,
        });
      } else {
        throw new Error(`${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vouchers",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Fetch single voucher ──────────────────────────────────────────────────
  const fetchVoucherById = async (id: number): Promise<Voucher | null> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}GLVoucher/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) return await response.json();
      throw new Error(`${response.status}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load voucher details",
      });
      return null;
    }
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) {
      fetchVouchers();
    } else {
      setData(
        initialData.map((item: any) => ({
          ...item,
          voucherDetails: item.voucherDetails || [],
        })),
      );
    }
  }, [initialData, fetchVouchers]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const searchInItem = (item: Voucher, term: string) => {
    if (!term) return true;
    const q = term.toLowerCase();
    const fields = [
      item.voucherNumber,
      item.narration,
      item.referenceNumber,
      item.status,
      item.voucherId?.toString(),
      item.accountingPeriod?.periodName,
      ...(item.voucherDetails || []).flatMap((d) => [
        d.account?.accountName,
        d.account?.accountCode,
        d.costCenter?.costCenterName,
        d.description,
      ]),
    ].filter(Boolean) as string[];
    return fields.some((f) => f.toLowerCase().includes(q));
  };

  const getCurrentTabData = () => {
    let tabData = data;
    if (activeTab !== "ALL") {
      tabData = data.filter(
        (i) => (i.status || "").toLowerCase() === activeTab.toLowerCase(),
      );
    }
    tabData = tabData.filter((i) => searchInItem(i, searchText));
    if (activeTab === "ALL" && statusFilter !== "ALL") {
      tabData = tabData.filter((i) => i.status === statusFilter);
    }
    return tabData;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalDebit = data.reduce(
      (s, v) =>
        s +
        (v.voucherDetails || []).reduce(
          (sd, d) => sd + (d.debitAmount || 0),
          0,
        ),
      0,
    );
    const totalCredit = data.reduce(
      (s, v) =>
        s +
        (v.voucherDetails || []).reduce(
          (sc, d) => sc + (d.creditAmount || 0),
          0,
        ),
      0,
    );
    const statusCounts: Record<string, number> = {};
    data.forEach((v) => {
      const s = v.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    return {
      total: data.length,
      totalDebit,
      totalCredit,
      statusCounts,
      totalDetails: data.reduce(
        (s, v) => s + (v.voucherDetails?.length || 0),
        0,
      ),
    };
  }, [data]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleAddEditComplete = () => {
    setShowForm(false);
    setSelectedVoucher(null);
    fetchVouchers();
  };

  const handleDelete = async (item: Voucher) => {
    if (
      !confirm(
        `Delete voucher #${item.voucherNumber || item.voucherId}? This will remove all ${item.voucherDetails?.length || 0} detail line(s).`,
      )
    )
      return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}GLVoucher/${item.voucherId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setData((prev) => prev.filter((v) => v.voucherId !== item.voucherId));
        toast({
          title: "Success",
          description: "Voucher deleted successfully",
        });
      } else throw new Error("Delete failed");
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete voucher",
      });
    }
  };

  const handleViewDetails = async (voucher: Voucher) => {
    if (!voucher.voucherDetails?.length) {
      setIsLoading(true);
      const full = await fetchVoucherById(voucher.voucherId);
      setIsLoading(false);
      setSelectedVoucherDetails(full || voucher);
      if (full) {
        setData((prev) =>
          prev.map((v) =>
            v.voucherId === full.voucherId
              ? { ...v, voucherDetails: full.voucherDetails || [] }
              : v,
          ),
        );
      }
    } else {
      setSelectedVoucherDetails(voucher);
    }
    setViewDialogOpen(true);
  };

  // ── Fix 1+2+3: handlePrintClick with robust field mapping ────────────────────
  const handlePrintClick = async (voucher: Voucher) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // ── Step 1: Fetch the full voucher ────────────────────────────────────────
      const voucherRes = await fetch(
        `${baseUrl}GLVoucher/${voucher.voucherId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!voucherRes.ok)
        throw new Error(`Voucher fetch failed: ${voucherRes.status}`);
      const raw = await voucherRes.json();

      const rawDetails: any[] = raw.voucherDetails || [];

      // ── Step 2: Collect unique accountIds and costCenterIds from details ──────
      const accountIds = [
        ...new Set(rawDetails.map((d: any) => d.accountId).filter(Boolean)),
      ];
      const costCenterIds = [
        ...new Set(rawDetails.map((d: any) => d.costCenterId).filter(Boolean)),
      ];

      // ── Step 3: Fetch accounts by ID (parallel) ───────────────────────────────
      const accountMap: Record<number, Account> = {};
      await Promise.all(
        accountIds.map(async (id) => {
          try {
            const res = await fetch(`${baseUrl}GlAccount/${id}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
              const acc = await res.json();
              accountMap[id] = {
                accountId: acc.accountId ?? id,
                companyId: acc.companyId ?? 0,
                parentAccountId: acc.parentAccountId ?? 0,
                accountCode: acc.accountCode ?? "",
                accountName: acc.accountName ?? "",
                description: acc.description ?? "",
                accountLevel: acc.accountLevel ?? 0,
                accountType: acc.accountType ?? "",
                accountNature: acc.accountNature ?? "",
                isHeader: acc.isHeader ?? false,
                isActive: acc.isActive ?? true,
                version: acc.version ?? 0,
              };
            }
          } catch (e) {
            console.error(`Account fetch failed for id ${id}:`, e);
          }
        }),
      );

      // ── Step 4: Fetch cost centers by ID (parallel) ───────────────────────────
      const costCenterMap: Record<number, CostCenter> = {};
      await Promise.all(
        costCenterIds.map(async (id) => {
          try {
            const res = await fetch(`${baseUrl}CostCenter/${id}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
              const cc = await res.json();
              costCenterMap[id] = {
                costCenterId: cc.costCenterId ?? id,
                companyId: cc.companyId ?? 0,
                costCenterCode: cc.costCenterCode ?? "",
                costCenterName: cc.costCenterName ?? "",
                description: cc.description ?? "",
                isActive: cc.isActive ?? true,
                version: cc.version ?? 0,
              };
            }
          } catch (e) {
            console.error(`CostCenter fetch failed for id ${id}:`, e);
          }
        }),
      );

      console.log("📦 accountMap:", accountMap);
      console.log("📦 costCenterMap:", costCenterMap);

      // ── Step 5: Build normalized details with joined account/costCenter ────────
      const normalizedDetails: VoucherDetail[] = rawDetails.map((d: any) => ({
        voucherDetailId: d.voucherDetailId ?? 0,
        voucherId: d.voucherId ?? raw.voucherId ?? 0,
        accountId: d.accountId ?? 0,
        debitAmount: d.debitAmount ?? 0,
        creditAmount: d.creditAmount ?? 0,
        description: d.description ?? "",
        costCenterId: d.costCenterId ?? 0,
        version: d.version ?? 0,
        // Join from maps — this is where account/costCenter come from
        account: accountMap[d.accountId] ?? {
          accountId: d.accountId,
          accountCode: "",
          accountName: `Account #${d.accountId}`,
          companyId: 0,
          parentAccountId: 0,
          description: "",
          accountLevel: 0,
          accountType: "",
          accountNature: "",
          isHeader: false,
          isActive: true,
          version: 0,
        },
        costCenter: costCenterMap[d.costCenterId] ?? {
          costCenterId: d.costCenterId,
          costCenterCode: "",
          costCenterName: d.costCenterId ? `CC #${d.costCenterId}` : "",
          companyId: 0,
          description: "",
          isActive: true,
          version: 0,
        },
      }));

      // ── Step 6: Build normalized period ──────────────────────────────────────
      const ap = raw.accountingPeriod ?? null;
      const normalizedPeriod: AccountingPeriod = ap
        ? {
            accountingPeriodId: ap.accountingPeriodId ?? 0,
            fiscalYearId: ap.fiscalYearId ?? 0,
            periodName: ap.periodName ?? "",
            startDate: ap.startDate ?? "",
            endDate: ap.endDate ?? "",
            status: ap.status ?? "",
            version: ap.version ?? 0,
          }
        : (voucher.accountingPeriod ?? {
            accountingPeriodId: 0,
            fiscalYearId: 0,
            periodName: "",
            startDate: "",
            endDate: "",
            status: "",
            version: 0,
          });

      // ── Step 7: Assemble full voucher ─────────────────────────────────────────
      const full: Voucher = {
        voucherId: raw.voucherId ?? voucher.voucherId,
        companyId: raw.companyId ?? 0,
        branchId: raw.branchId ?? 0,
        voucherTypeId: raw.voucherTypeId ?? 0,
        voucherNumber: raw.voucherNumber ?? voucher.voucherNumber ?? "",
        voucherDate: raw.voucherDate ?? voucher.voucherDate ?? "",
        accountingPeriodId: raw.accountingPeriodId ?? 0,
        narration: raw.narration ?? "",
        referenceNumber: raw.referenceNumber ?? "",
        status: raw.status ?? voucher.status ?? "",
        postedBy: raw.postedBy ?? 0,
        postedAt: raw.postedAt ?? "",
        accountingPeriod: normalizedPeriod,
        voucherDetails: normalizedDetails,
        version: raw.version ?? 0,
      };

      console.log("✅ Full voucher for print:", full);

      // Update local cache
      setData((prev) =>
        prev.map((v) =>
          v.voucherId === full.voucherId ? { ...v, ...full } : v,
        ),
      );
      setVoucherToPrint(full);
      setPrintDialogOpen(true);
    } catch (err) {
      console.error("Print fetch error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load voucher details for printing",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Browser print ─────────────────────────────────────────────────────────
  // ── Replace handleBrowserPrint ────────────────────────────────────────────────
  const handleBrowserPrint = () => {
    const printArea = document.getElementById("voucher-print-area");
    if (!printArea) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Popup blocked",
        description: "Please allow popups for this site to use browser print.",
      });
      return;
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Voucher Print</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a1a; background: white; padding: 24px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1e3a8a; }
          .doc-title { font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
          .doc-sub { font-size: 11px; color: #9ca3af; margin-top: 4px; }
          .status-badge { display: inline-flex; align-items: center; padding: 3px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; border: 2px solid; }
          .status-draft { background: #fefce8; color: #a16207; border-color: #fde047; }
          .status-posted { background: #f0fdf4; color: #15803d; border-color: #86efac; }
          .status-cancelled { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
          .print-time { font-size: 11px; color: #9ca3af; margin-top: 6px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .info-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 3px; }
          .info-value { font-size: 13px; font-weight: 600; color: #1e293b; }
          .info-span3 { grid-column: span 3; }
          .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          thead tr { background: #1e3a8a; color: white; }
          thead th { padding: 8px 10px; text-align: left; font-weight: 700; font-size: 10px; }
          thead th.right { text-align: right; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          tbody td.right { text-align: right; }
          tbody td.mono { font-family: 'Courier New', monospace; font-weight: 700; color: #1d4ed8; }
          tfoot tr { background: #f1f5f9; border-top: 2px solid #cbd5e1; }
          tfoot td { padding: 8px 10px; font-weight: 700; font-size: 12px; }
          .dr { color: #1d4ed8; }
          .cr { color: #15803d; }
          .balance-ok { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 10px 14px; color: #15803d; font-weight: 600; font-size: 11px; margin: 16px 0; }
          .balance-fail { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 10px 14px; color: #dc2626; font-weight: 600; font-size: 11px; margin: 16px 0; }
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
          .sig-line { border-bottom: 1px solid #9ca3af; height: 32px; margin-bottom: 6px; }
          .sig-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; text-align: center; }
          .footer { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 9px; color: #cbd5e1; }
          @page { margin: 1cm; size: A4 portrait; }
        </style>
      </head>
      <body>
        ${printArea.innerHTML}
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // ── PDF download for list of vouchers ───────────────────────────────────
  const downloadPDF = (vouchers: Voucher[], tabName: string) => {
    try {
      const doc = new jsPDF("portrait", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();

      // ── Header ──
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageW, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("VOUCHER LIST - " + tabName, 14, 12);

      // ── Table data ──
      const tableData = vouchers.map((v) => [
        v.voucherId,
        v.voucherNumber || "—",
        v.voucherDate ? moment(v.voucherDate).format("DD MMM YYYY") : "—",
        v.referenceNumber || "—",
        v.narration || "—",
        v.status || "—",
        v.voucherDetails?.length || 0,
      ]);

      autoTable(doc, {
        startY: 24,
        head: [
          [
            "ID",
            "Voucher No",
            "Date",
            "Reference",
            "Narration",
            "Status",
            "Lines",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 24 },
          2: { cellWidth: 22 },
          3: { cellWidth: 28 },
          4: { cellWidth: 50 },
          5: { cellWidth: 18 },
          6: { cellWidth: 14, halign: "center" },
        },
        margin: { left: 14, right: 14 },
      });

      doc.save(`Voucher_List_${tabName}_${moment().format("YYYYMMDD")}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: `Exported ${vouchers.length} voucher(s)`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      });
    }
  };

  // ── Excel download for list of vouchers ───────────────────────────────────
  const downloadExcel = async (vouchers: Voucher[], tabName: string) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Vouchers");

      worksheet.columns = [
        { header: "Voucher ID", key: "voucherId", width: 12 },
        { header: "Voucher No", key: "voucherNumber", width: 16 },
        { header: "Date", key: "voucherDate", width: 14 },
        { header: "Reference No", key: "referenceNumber", width: 16 },
        { header: "Narration", key: "narration", width: 32 },
        { header: "Status", key: "status", width: 12 },
        { header: "Lines", key: "lineCount", width: 8 },
        { header: "Period", key: "period", width: 16 },
      ];

      vouchers.forEach((v) => {
        worksheet.addRow({
          voucherId: v.voucherId,
          voucherNumber: v.voucherNumber || "—",
          voucherDate: v.voucherDate
            ? moment(v.voucherDate).format("DD MMM YYYY")
            : "—",
          referenceNumber: v.referenceNumber || "—",
          narration: v.narration || "—",
          status: v.status || "—",
          lineCount: v.voucherDetails?.length || 0,
          period: v.accountingPeriod?.periodName || "—",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `Voucher_List_${tabName}_${moment().format("YYYYMMDD")}.xlsx`,
      );
      toast({
        title: "Excel Downloaded",
        description: `Exported ${vouchers.length} voucher(s)`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate Excel file",
      });
    }
  };

  // ── PDF download for single voucher ──────────────────────────────────────
  const handleVoucherPDF = (voucher: Voucher) => {
    try {
      const doc = new jsPDF("portrait", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();

      // ── Header bar ──
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("ACCOUNTING VOUCHER", 14, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Printed: ${moment().format("DD MMM YYYY, HH:mm")}`,
        pageW - 14,
        12,
        { align: "right" },
      );

      // ── Status badge area ──
      const statusColor = (() => {
        const s = (voucher.status || "").toLowerCase();
        if (s === "posted") return [22, 163, 74] as [number, number, number];
        if (s === "cancelled") return [220, 38, 38] as [number, number, number];
        return [202, 138, 4] as [number, number, number];
      })();
      doc.setFillColor(...statusColor);
      doc.roundedRect(pageW - 50, 15, 36, 8, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(voucher.status || "—", pageW - 32, 20.5, { align: "center" });

      // ── Master info grid ──
      doc.setTextColor(30, 30, 30);
      let y = 36;

      const drawInfoRow = (
        label: string,
        value: string,
        x: number,
        colY: number,
      ) => {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(label.toUpperCase(), x, colY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(9);
        doc.text(value || "—", x, colY + 5);
      };

      const col1 = 14,
        col2 = 75,
        col3 = 136;

      drawInfoRow("Voucher Number", voucher.voucherNumber || "—", col1, y);
      drawInfoRow(
        "Voucher Date",
        voucher.voucherDate
          ? moment(voucher.voucherDate).format("DD MMM YYYY")
          : "—",
        col2,
        y,
      );
      drawInfoRow(
        "Accounting Period",
        voucher.accountingPeriod?.periodName || "—",
        col3,
        y,
      );
      y += 14;
      drawInfoRow("Reference Number", voucher.referenceNumber || "—", col1, y);
      drawInfoRow(
        "Posted At",
        voucher.postedAt ? moment(voucher.postedAt).format("DD MMM YYYY") : "—",
        col2,
        y,
      );
      drawInfoRow("Voucher ID", `#${voucher.voucherId}`, col3, y);
      y += 14;

      if (voucher.narration) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("NARRATION", col1, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(9);
        const narLines = doc.splitTextToSize(voucher.narration, pageW - 28);
        doc.text(narLines, col1, y + 5);
        y += 5 + narLines.length * 5;
      }

      // ── Divider ──
      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(14, y, pageW - 14, y);
      y += 6;

      // ── Details table ──
      const details = voucher.voucherDetails || [];
      const totalDR = details.reduce((s, d) => s + (d.debitAmount || 0), 0);
      const totalCR = details.reduce((s, d) => s + (d.creditAmount || 0), 0);

      autoTable(doc, {
        startY: y,
        head: [
          [
            "#",
            "Account Code",
            "Account Name",
            "Cost Center",
            "Description",
            "Debit (DR)",
            "Credit (CR)",
          ],
        ],
        body: details.map((d, i) => [
          (i + 1).toString(),
          d.account?.accountCode || "—",
          d.account?.accountName || "—",
          d.costCenter?.costCenterName || "—",
          d.description || "—",
          d.debitAmount
            ? new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
              }).format(d.debitAmount)
            : "—",
          d.creditAmount
            ? new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
              }).format(d.creditAmount)
            : "—",
        ]),
        foot: [
          [
            "",
            "",
            "",
            "",
            {
              content: "TOTALS",
              styles: { fontStyle: "bold", halign: "right" },
            },
            {
              content: new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
              }).format(totalDR),
              styles: { fontStyle: "bold", textColor: [30, 64, 175] },
            },
            {
              content: new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
              }).format(totalCR),
              styles: { fontStyle: "bold", textColor: [22, 163, 74] },
            },
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: 3,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          fontSize: 8.5,
          cellPadding: 3,
        },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 24, font: "courier" },
          2: { cellWidth: 42 },
          3: { cellWidth: 28 },
          4: { cellWidth: 36 },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 22, halign: "right" },
        },
        margin: { left: 14, right: 14 },
      });

      // ── Balance indicator ──
      const finalY = (doc as any).lastAutoTable.finalY + 8;
      const balanced = Math.abs(totalDR - totalCR) < 0.01;
      doc.setFillColor(
        balanced ? 240 : 254,
        balanced ? 253 : 226,
        balanced ? 244 : 226,
      );
      doc.setDrawColor(
        balanced ? 134 : 239,
        balanced ? 239 : 68,
        balanced ? 172 : 68,
      );
      doc.setLineWidth(0.4);
      doc.roundedRect(14, finalY, pageW - 28, 10, 2, 2, "FD");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(
        balanced ? 126 : 185,
        balanced ? 34 : 28,
        balanced ? 206 : 28,
      );
      doc.text(
        balanced
          ? `✓  Voucher is balanced  |  Total DR = Total CR = ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(totalDR)}`
          : `⚠  Voucher is NOT balanced  |  Difference: ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(Math.abs(totalDR - totalCR))}`,
        pageW / 2,
        finalY + 6.5,
        { align: "center" },
      );

      // ── Footer ──
      const pgH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("This is a system-generated document.", 14, pgH - 8);
      doc.text(
        `Generated on ${moment().format("DD MMM YYYY HH:mm")}`,
        pageW - 14,
        pgH - 8,
        { align: "right" },
      );

      doc.save(
        `Voucher_${voucher.voucherNumber || voucher.voucherId}_${moment().format("YYYYMMDD")}.pdf`,
      );
      toast({
        title: "PDF Downloaded",
        description: `Voucher ${voucher.voucherNumber || voucher.voucherId}`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      });
    }
  };

  // ── Status styling ────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "posted") return "bg-green-50 text-green-700 border-green-200";
    if (s === "draft") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (s === "cancelled" || s === "voided")
      return "bg-red-50 text-red-700 border-red-200";
    if (s === "approved") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "posted" || s === "approved")
      return <FiCheckCircle className='mr-1 h-3 w-3' />;
    if (s === "cancelled" || s === "voided")
      return <FiXCircle className='mr-1 h-3 w-3' />;
    return <FiClock className='mr-1 h-3 w-3' />;
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<Voucher>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-1.5'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors'
                  onClick={() => handleViewDetails(row.original)}
                >
                  <FiEye size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>View Details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* ── Print button ── */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors'
                  onClick={() => handlePrintClick(row.original)}
                >
                  <FiPrinter size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Print / Download PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors'
                  onClick={async () => {
                    const full = await fetchVoucherById(row.original.voucherId);
                    if (full) {
                      setSelectedVoucher(full);
                      setShowForm(true);
                    }
                  }}
                >
                  <FiEdit size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Edit Voucher</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors'
                  onClick={() => handleDelete(row.original)}
                >
                  <FiTrash2 size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Delete Voucher</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
    },
    {
      accessorKey: "row",
      header: "#",
      cell: ({ row }) => (
        <span className='text-xs text-gray-600'>{parseInt(row.id) + 1}</span>
      ),
    },
    {
      accessorKey: "voucherId",
      header: "Voucher ID",
      cell: ({ row }) => (
        <div className='font-semibold text-sm text-blue-700'>
          #{row.original.voucherId}
        </div>
      ),
    },
    {
      accessorKey: "voucherNumber",
      header: "Voucher No",
      cell: ({ row }) => (
        <div className='text-sm font-medium text-gray-900'>
          {row.original.voucherNumber || "-"}
        </div>
      ),
    },
    {
      accessorKey: "voucherDate",
      header: "Voucher Date",
      cell: ({ row }) => (
        <div className='text-xs text-gray-700'>
          {row.original.voucherDate
            ? new Date(row.original.voucherDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "referenceNumber",
      header: "Reference No",
      cell: ({ row }) => (
        <div className='text-sm text-gray-700'>
          {row.original.referenceNumber || "-"}
        </div>
      ),
    },
    {
      accessorKey: "narration",
      header: "Narration",
      cell: ({ row }) => (
        <div
          className='text-xs text-gray-600 max-w-[180px] truncate'
          title={row.original.narration}
        >
          {row.original.narration || "-"}
        </div>
      ),
    },
    {
      accessorKey: "voucherDetails",
      header: "Lines",
      cell: ({ row }) => {
        const count = row.original.voucherDetails?.length || 0;
        return (
          <Badge variant='outline' className='flex items-center gap-1 w-fit'>
            <FiList className='h-3 w-3' />
            {count} line{count !== 1 ? "s" : ""}
          </Badge>
        );
      },
    },
    {
      accessorKey: "accountingPeriod",
      header: "Period",
      cell: ({ row }) => (
        <div className='text-xs text-gray-600'>
          {row.original.accountingPeriod?.periodName || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "";
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(status)}`}
          >
            {getStatusIcon(status)}
            {status || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "postedAt",
      header: "Posted At",
      cell: ({ row }) => (
        <div className='text-xs text-gray-600'>
          {row.original.postedAt
            ? new Date(row.original.postedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "-"}
        </div>
      ),
    },
  ];

  // ── View Details Dialog ───────────────────────────────────────────────────
  const ViewVoucherDialog = () => (
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FiEye className='h-5 w-5' /> Voucher Details
          </DialogTitle>
          <DialogDescription>
            Voucher No: {selectedVoucherDetails?.voucherNumber || "-"} | Period:{" "}
            {selectedVoucherDetails?.accountingPeriod?.periodName || "-"}
          </DialogDescription>
        </DialogHeader>

        {selectedVoucherDetails && (
          <div className='space-y-4'>
            <Card>
              <CardHeader className='py-3 px-4 bg-blue-50'>
                <CardTitle className='text-sm font-medium flex items-center gap-2'>
                  <Badge variant='default' className='bg-blue-600'>
                    Master
                  </Badge>
                  Voucher Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-3 px-4 pb-3'>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  {[
                    ["Voucher ID", `#${selectedVoucherDetails.voucherId}`],
                    [
                      "Voucher Number",
                      selectedVoucherDetails.voucherNumber || "-",
                    ],
                    [
                      "Voucher Date",
                      selectedVoucherDetails.voucherDate
                        ? new Date(
                            selectedVoucherDetails.voucherDate,
                          ).toLocaleDateString()
                        : "-",
                    ],
                    [
                      "Reference No",
                      selectedVoucherDetails.referenceNumber || "-",
                    ],
                    ["Narration", selectedVoucherDetails.narration || "-"],
                    [
                      "Period",
                      selectedVoucherDetails.accountingPeriod?.periodName ||
                        "-",
                    ],
                    [
                      "Posted At",
                      selectedVoucherDetails.postedAt
                        ? new Date(
                            selectedVoucherDetails.postedAt,
                          ).toLocaleDateString()
                        : "-",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className='flex justify-between'>
                      <span className='text-gray-600'>{label}:</span>
                      <span className='font-medium'>{value}</span>
                    </div>
                  ))}
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <span
                      className={`font-medium inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStatusBadge(selectedVoucherDetails.status)}`}
                    >
                      {getStatusIcon(selectedVoucherDetails.status)}
                      {selectedVoucherDetails.status || "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='py-3 px-4 bg-gray-50'>
                <CardTitle className='text-sm font-medium flex items-center gap-2'>
                  <Badge variant='outline' className='bg-white'>
                    Details
                  </Badge>
                  Voucher Lines (
                  {selectedVoucherDetails.voucherDetails?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-3 px-4 pb-3'>
                {selectedVoucherDetails.voucherDetails?.length ? (
                  <div className='border rounded-lg overflow-hidden overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-gray-50'>
                          <TableHead className='w-[40px]'>#</TableHead>
                          <TableHead>Account Code</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead>Cost Center</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className='text-right'>Debit</TableHead>
                          <TableHead className='text-right'>Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedVoucherDetails.voucherDetails.map(
                          (detail, index) => (
                            <TableRow key={detail.voucherDetailId || index}>
                              <TableCell className='font-medium text-xs'>
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant='outline'
                                  className='bg-blue-50 text-blue-700 border-blue-300 font-mono text-xs'
                                >
                                  {detail.account?.accountCode || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className='text-sm text-gray-800'>
                                {detail.account?.accountName || "-"}
                              </TableCell>
                              <TableCell className='text-xs text-gray-600'>
                                {detail.costCenter?.costCenterName || "—"}
                              </TableCell>
                              <TableCell className='text-xs text-gray-600 max-w-[140px] truncate'>
                                {detail.description || "—"}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-right text-blue-700'>
                                {detail.debitAmount
                                  ? new Intl.NumberFormat("en-US").format(
                                      detail.debitAmount,
                                    )
                                  : "-"}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-right text-green-700'>
                                {detail.creditAmount
                                  ? new Intl.NumberFormat("en-US").format(
                                      detail.creditAmount,
                                    )
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                      <tfoot>
                        <tr className='bg-gray-50 border-t font-semibold text-sm'>
                          <td
                            colSpan={5}
                            className='px-4 py-2 text-right text-gray-700'
                          >
                            Totals:
                          </td>
                          <td className='px-4 py-2 text-right text-blue-700'>
                            {new Intl.NumberFormat("en-US").format(
                              selectedVoucherDetails.voucherDetails.reduce(
                                (s, d) => s + (d.debitAmount || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className='px-4 py-2 text-right text-green-700'>
                            {new Intl.NumberFormat("en-US").format(
                              selectedVoucherDetails.voucherDetails.reduce(
                                (s, d) => s + (d.creditAmount || 0),
                                0,
                              ),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                ) : (
                  <p className='text-sm text-gray-500 text-center py-4'>
                    No detail lines available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button
            variant='outline'
            className='gap-2'
            onClick={() => {
              setViewDialogOpen(false);
              if (selectedVoucherDetails)
                handlePrintClick(selectedVoucherDetails);
            }}
          >
            <FiPrinter className='h-4 w-4' /> Print
          </Button>
          <Button
            variant='outline'
            className='gap-2 text-red-600 border-red-200 hover:bg-red-50'
            onClick={() => {
              if (selectedVoucherDetails)
                handleVoucherPDF(selectedVoucherDetails);
            }}
          >
            <FiDownload className='h-4 w-4' /> Download PDF
          </Button>
          <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ── Fix 1: PrintVoucherDialog — add DialogHeader+DialogTitle (accessibility) ──
  const PrintVoucherDialog = () => {
    if (!voucherToPrint) return null;
    const v = voucherToPrint;
    const details = v.voucherDetails || [];
    const totalDR = details.reduce((s, d) => s + (d.debitAmount || 0), 0);
    const totalCR = details.reduce((s, d) => s + (d.creditAmount || 0), 0);
    const balanced = Math.abs(totalDR - totalCR) < 0.01;
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n);

    return (
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[95vh] overflow-y-auto p-0'>
          {/* ── Fix 1: DialogHeader satisfies Radix accessibility requirement ── */}
          <DialogHeader className='sr-only'>
            <DialogTitle>
              Print Voucher — {v.voucherNumber || `#${v.voucherId}`}
            </DialogTitle>
            <DialogDescription>
              Print preview for voucher {v.voucherNumber || v.voucherId}
            </DialogDescription>
          </DialogHeader>

          {/* Visible toolbar */}
          <div className='flex items-center justify-between px-6 py-3 border-b bg-gray-50 sticky top-0 z-10'>
            <h2 className='font-semibold text-gray-800 flex items-center gap-2'>
              <FiPrinter className='h-4 w-4 text-purple-600' /> Print Preview
            </h2>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='gap-1.5 text-red-600 border-red-200 hover:bg-red-50'
                onClick={() => handleVoucherPDF(v)}
              >
                <FiDownload className='h-3.5 w-3.5' /> Download PDF
              </Button>
              <Button
                size='sm'
                className='gap-1.5 bg-purple-600 hover:bg-purple-700 text-white'
                onClick={handleBrowserPrint}
              >
                <FiPrinter className='h-3.5 w-3.5' /> Print
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setPrintDialogOpen(false)}
              >
                <FiX className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* ── Printable area ── */}
          <div
            id='voucher-print-area'
            ref={printAreaRef}
            className='p-8 bg-white text-sm font-sans'
          >
            {/* Document header */}
            <div className='flex items-start justify-between mb-6 pb-5 border-b-2 border-blue-800'>
              <div>
                <div className='text-2xl font-extrabold text-blue-800 tracking-tight'>
                  ACCOUNTING VOUCHER
                </div>
                <div className='text-xs text-gray-400 mt-1'>
                  System Generated Document
                </div>
              </div>
              <div className='text-right'>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadge(v.status)}`}
                >
                  {v.status || "—"}
                </span>
                <div className='text-xs text-gray-400 mt-2'>
                  Printed: {moment().format("DD MMM YYYY, HH:mm")}
                </div>
              </div>
            </div>

            {/* Master info grid */}
            <div className='grid grid-cols-3 gap-x-8 gap-y-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200'>
              {(
                [
                  ["Voucher Number", v.voucherNumber || "—"],
                  [
                    "Voucher Date",
                    v.voucherDate
                      ? moment(v.voucherDate).format("DD MMM YYYY")
                      : "—",
                  ],
                  ["Accounting Period", v.accountingPeriod?.periodName || "—"],
                  ["Reference Number", v.referenceNumber || "—"],
                  [
                    "Posted At",
                    v.postedAt ? moment(v.postedAt).format("DD MMM YYYY") : "—",
                  ],
                  ["Voucher ID", `#${v.voucherId}`],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label}>
                  <div className='text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5'>
                    {label}
                  </div>
                  <div className='text-sm font-semibold text-gray-800'>
                    {value}
                  </div>
                </div>
              ))}
              {v.narration && (
                <div className='col-span-3 pt-2 border-t border-slate-200'>
                  <div className='text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5'>
                    Narration
                  </div>
                  <div className='text-sm text-gray-800'>{v.narration}</div>
                </div>
              )}
            </div>

            {/* Lines table */}
            <div className='text-xs font-bold text-gray-500 uppercase tracking-widest mb-2'>
              Voucher Lines
            </div>
            <table
              className='w-full border-collapse mb-4'
              style={{ fontSize: "12px" }}
            >
              <thead>
                <tr style={{ background: "#1e3a8a", color: "white" }}>
                  <th className='px-3 py-2 text-left' style={{ width: "28px" }}>
                    #
                  </th>
                  <th className='px-3 py-2 text-left' style={{ width: "90px" }}>
                    Account Code
                  </th>
                  <th className='px-3 py-2 text-left'>Account Name</th>
                  <th
                    className='px-3 py-2 text-left'
                    style={{ width: "110px" }}
                  >
                    Cost Center
                  </th>
                  <th
                    className='px-3 py-2 text-left'
                    style={{ width: "120px" }}
                  >
                    Description
                  </th>
                  <th
                    className='px-3 py-2 text-right'
                    style={{ width: "110px" }}
                  >
                    Debit (DR)
                  </th>
                  <th
                    className='px-3 py-2 text-right'
                    style={{ width: "110px" }}
                  >
                    Credit (CR)
                  </th>
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-gray-400 italic'
                    >
                      No detail lines found
                    </td>
                  </tr>
                ) : (
                  details.map((d, i) => (
                    <tr
                      key={d.voucherDetailId || i}
                      style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}
                    >
                      <td className='px-3 py-2 text-gray-500 text-center'>
                        {i + 1}
                      </td>
                      <td className='px-3 py-2 font-mono font-semibold text-blue-700'>
                        {d.account?.accountCode || (
                          <span className='text-gray-300'>—</span>
                        )}
                      </td>
                      <td className='px-3 py-2 text-gray-800'>
                        {d.account?.accountName || (
                          <span className='text-gray-300'>—</span>
                        )}
                      </td>
                      <td className='px-3 py-2 text-gray-600'>
                        {d.costCenter?.costCenterName || (
                          <span className='text-gray-300'>—</span>
                        )}
                      </td>
                      <td className='px-3 py-2 text-gray-600'>
                        {d.description || "—"}
                      </td>
                      <td className='px-3 py-2 text-right font-semibold text-blue-700'>
                        {d.debitAmount ? (
                          fmt(d.debitAmount)
                        ) : (
                          <span className='text-gray-300'>—</span>
                        )}
                      </td>
                      <td className='px-3 py-2 text-right font-semibold text-green-700'>
                        {d.creditAmount ? (
                          fmt(d.creditAmount)
                        ) : (
                          <span className='text-gray-300'>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: "#f1f5f9",
                    borderTop: "2px solid #cbd5e1",
                  }}
                >
                  <td
                    colSpan={5}
                    className='px-3 py-2.5 text-right font-bold text-gray-700 text-xs uppercase tracking-wide'
                  >
                    Totals
                  </td>
                  <td className='px-3 py-2.5 text-right font-bold text-blue-800'>
                    {fmt(totalDR)}
                  </td>
                  <td className='px-3 py-2.5 text-right font-bold text-green-800'>
                    {fmt(totalCR)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Balance indicator */}
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold mb-8 ${
                balanced
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-red-50 border-red-300 text-red-700"
              }`}
            >
              {balanced ? (
                <>
                  <FiCheckCircle className='h-4 w-4 flex-shrink-0' /> Voucher is
                  balanced — Total DR = Total CR = {fmt(totalDR)}
                </>
              ) : (
                <>
                  <FiXCircle className='h-4 w-4 flex-shrink-0' /> Voucher is NOT
                  balanced — Difference: {fmt(Math.abs(totalDR - totalCR))}
                </>
              )}
            </div>

            {/* Signature section */}
            <div className='grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-gray-200'>
              {["Prepared By", "Reviewed By", "Approved By"].map((label) => (
                <div key={label} className='text-center'>
                  <div className='border-b border-gray-400 h-10 mb-2' />
                  <div className='text-[10px] font-bold uppercase tracking-widest text-gray-400'>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className='flex justify-between mt-6 pt-3 border-t border-gray-100 text-[9px] text-gray-300'>
              <span>
                This is a system-generated document. No signature required if
                digitally authorized.
              </span>
              <span>Generated: {moment().format("DD MMM YYYY HH:mm:ss")}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ── Statistics Tab ────────────────────────────────────────────────────────
  const StatisticsTab = () => (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Voucher Statistics
        </h2>
        <Button
          onClick={() => downloadPDF(data, "Statistics")}
          size='sm'
          className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'
        >
          <FiDownload size={14} /> Export Report
        </Button>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
        {[
          {
            label: "Total Vouchers",
            value: stats.total,
            sub: `${stats.totalDetails} detail line(s)`,
            color: "blue",
          },
          {
            label: "Total Debit",
            value: new Intl.NumberFormat("en-US", {
              notation: "compact",
            }).format(stats.totalDebit),
            sub: "Sum of all debit amounts",
            color: "indigo",
          },
          {
            label: "Total Credit",
            value: new Intl.NumberFormat("en-US", {
              notation: "compact",
            }).format(stats.totalCredit),
            sub: "Sum of all credit amounts",
            color: "green",
          },
          {
            label: "Status Breakdown",
            value: Object.keys(stats.statusCounts).length,
            sub: Object.entries(stats.statusCounts)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · "),
            color: "purple",
          },
        ].map((card) => (
          <Card
            key={card.label}
            className={`border border-${card.color}-200 shadow-sm`}
          >
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle
                className={`text-xs font-medium text-${card.color}-700 uppercase tracking-wide`}
              >
                {card.label}
              </CardTitle>
              <div className={`text-2xl font-bold text-${card.color}-900 mt-1`}>
                {card.value}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>{card.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // ── Route: Add/Edit Form ──────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className='p-4 bg-gray-50 min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setShowForm(false);
              setSelectedVoucher(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Voucher List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <VoucherForm
              type={selectedVoucher ? "edit" : "add"}
              defaultState={selectedVoucher || {}}
              handleAddEdit={handleAddEditComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main List View ────────────────────────────────────────────────────────
  const currentTabData = getCurrentTabData();
  const uniqueStatuses = [
    ...new Set(data.map((v) => v.status).filter(Boolean)),
  ];

  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Voucher Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Manage accounting vouchers with debit/credit detail lines
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={fetchVouchers}
              variant='outline'
              size='sm'
              className='flex items-center gap-1.5'
              disabled={isLoading}
            >
              <FiRefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setSelectedVoucher(null);
                setShowForm(true);
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' /> Add New Voucher
            </Button>
          </div>
        </div>

        {/* Search + Export bar */}
        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='flex items-center gap-2 flex-1 w-full md:w-auto'>
              <div className='relative flex-1 max-w-md'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by Voucher No, Narration, Reference, Account...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-9 pr-9 py-1.5 text-sm h-9'
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText("")}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    <FiX className='h-4 w-4' />
                  </button>
                )}
              </div>
              {activeTab === "ALL" && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-[160px] h-9 text-sm'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    {statusFilterOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={() => downloadPDF(currentTabData, activeTab)}
                size='sm'
                className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs'
                disabled={!currentTabData?.length}
              >
                <FiFilePlus className='h-3.5 w-3.5' /> Export PDF
              </Button>
              <Button
                onClick={() => downloadExcel(currentTabData, activeTab)}
                size='sm'
                className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                disabled={!currentTabData?.length}
              >
                <FiDownload className='h-3.5 w-3.5' /> Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue='ALL'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='flex flex-wrap gap-1 bg-transparent h-auto p-0'>
              <TabsTrigger
                value='ALL'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiFileText className='w-3.5 h-3.5 mr-1.5' /> All ({data.length}
                )
              </TabsTrigger>
              {uniqueStatuses.map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className='text-xs py-2 px-3 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-md'
                >
                  {getStatusIcon(status)}
                  {status} ({data.filter((v) => v.status === status).length})
                </TabsTrigger>
              ))}
              <TabsTrigger
                value='STATISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiList className='w-3.5 h-3.5 mr-1.5' /> Statistics
              </TabsTrigger>
            </TabsList>
          </div>

          {["ALL", ...uniqueStatuses].map((tab) => (
            <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
              <div className='bg-white rounded-lg shadow-sm border'>
                {currentTabData.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16'>
                    <FiFileText className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                    <h3 className='text-base font-medium text-gray-900'>
                      No vouchers found
                    </h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      {searchText || statusFilter !== "ALL"
                        ? "Try adjusting your search or filter terms"
                        : "Add your first voucher using the button above"}
                    </p>
                  </div>
                ) : (
                  <AppDataTable
                    data={currentTabData}
                    loading={isLoading}
                    columns={columns}
                    searchText={searchText}
                    isPage
                    isMultiSearch
                  />
                )}
              </div>
            </TabsContent>
          ))}

          <TabsContent value='STATISTICS' className='space-y-3 mt-3'>
            <div className='bg-white rounded-lg shadow-sm border p-4'>
              <StatisticsTab />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isLoading && <AppLoader />}
      <ViewVoucherDialog />
      <PrintVoucherDialog />
    </div>
  );
}
