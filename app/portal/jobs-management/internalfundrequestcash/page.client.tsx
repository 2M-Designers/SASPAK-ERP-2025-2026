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
  FiDollarSign,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiList,
  FiAlertCircle,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import { useToast } from "@/hooks/use-toast";
import InternalFundRequestForm from "@/views/forms/internal-fund-request/InternalFundRequestForm_MasterDetail";
import InternalFundRequestApprovalForm from "@/views/forms/internal-fund-request/InternalFundRequestForm_Approval";

// ─── Types ────────────────────────────────────────────────────────────────────

type InternalFundRequestPageProps = {
  initialData?: CashFundRequest[];
};

type CashFundRequest = {
  cashFundRequestId: number;
  cashHeadId?: number | null;
  cashHeadName?: string;
  requestorUserId?: number;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  approvalStatus: string;
  approvedBy?: number | null;
  approvedOn?: string | null;
  requestedTo?: number | null;
  createdOn: string;
  createdBy?: number;
  version: number;
  internalCashFundsRequests: DetailLineItem[];
};

type DetailLineItem = {
  internalFundsRequestCashId: number;
  jobId: number | null;
  jobNumber?: string;
  customerName?: string;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount: string;
  beneficiary: string;
  requestedAmount: number;
  approvedAmount: number;
  cashFundRequestMasterId: number;
  chargesId: number;
  onAccountOfId?: number | null;
  subRequestStatus?: string;
  remarks?: string;
  version: number;
};

type StatusOption = {
  key: string;
  label: string;
};

type ApiResponse<T> = T[];

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = "100";
const DEFAULT_CURRENCY = "PKR";

// ─── Utility Functions ────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(amount);
};

const formatCompactCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    notation: "compact",
  }).format(amount);
};

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternalFundRequestPage({
  initialData,
}: InternalFundRequestPageProps) {
  const [data, setData] = useState<CashFundRequest[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<CashFundRequest | null>(null);
  const [selectedRequestForApproval, setSelectedRequestForApproval] =
    useState<CashFundRequest | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_REQUESTS");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<CashFundRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [pendingStatus, setPendingStatus] = useState("Pending");
  const [approvedStatus, setApprovedStatus] = useState("Approved");
  const [rejectedStatus, setRejectedStatus] = useState("Rejected");

  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ── Fetch status options ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL;
        if (!base) {
          throw new Error("API base URL not configured");
        }

        const res = await fetch(
          `${base}General/GetTypeValues?typeName=FundRequest_Detail_Status`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: abortControllerRef.current?.signal,
          },
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch status options: ${res.status}`);
        }

        const raw: Record<string, string> = await res.json();
        const opts: StatusOption[] = Object.entries(raw).map(
          ([key, label]) => ({ key, label }),
        );

        setStatusOptions(opts);

        const p = opts.find((o) => o.key.toLowerCase() === "pending");
        const a = opts.find((o) => o.key.toLowerCase() === "approved");
        const r = opts.find((o) => o.key.toLowerCase() === "rejected");

        if (p) setPendingStatus(p.key);
        if (a) setApprovedStatus(a.key);
        if (r) setRejectedStatus(r.key);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error("Status fetch error:", e);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Using default status values",
        });
      }
    };

    fetchStatuses();
  }, [toast]);

  // ── Status filter options ───────────────────────────────────────────────────
  const statusFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      { value: pendingStatus, label: pendingStatus },
      { value: approvedStatus, label: approvedStatus },
      { value: rejectedStatus, label: rejectedStatus },
      { value: "Paid", label: "Paid" },
    ],
    [pendingStatus, approvedStatus, rejectedStatus],
  );

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchFundRequests = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        throw new Error("API base URL not configured");
      }

      const response = await fetch(
        `${baseUrl}InternalCashFundsRequest/GetList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "cashFundRequestId,TotalRequestedAmount,TotalApprovedAmount,ApprovalStatus,ApprovedBy,ApprovedOn,RequestedTo,CreatedOn,CreatedBy,version,CashHeadId,RequestorUserId",
            where: "",
            sortOn: "cashFundRequestId DESC",
            page: "1",
            pageSize: PAGE_SIZE,
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const requestData: ApiResponse<any> = await response.json();

      const processedData: CashFundRequest[] = requestData.map((item: any) => ({
        ...item,
        internalCashFundsRequests: Array.isArray(item.internalCashFundsRequests)
          ? item.internalCashFundsRequests
          : [],
        totalRequestedAmount: Number(item.totalRequestedAmount) || 0,
        totalApprovedAmount: Number(item.totalApprovedAmount) || 0,
        cashHeadId: item.cashHeadId || null,
      }));

      setData(processedData);
      toast({
        title: "Success",
        description: `Loaded ${processedData.length} fund request(s)`,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      console.error("Fetch error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load fund requests",
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load fund requests",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Fetch single record ─────────────────────────────────────────────────────
  const fetchRequestDetails = useCallback(
    async (id: number): Promise<CashFundRequest | null> => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
          throw new Error("API base URL not configured");
        }

        const response = await fetch(
          `${baseUrl}InternalCashFundsRequest/${id}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!response.ok) {
          throw new Error(`${response.status}`);
        }

        const fullData = await response.json();

        // Ensure internalCashFundsRequests is always an array
        return {
          ...fullData,
          internalCashFundsRequests: Array.isArray(
            fullData.internalCashFundsRequests,
          )
            ? fullData.internalCashFundsRequests
            : [],
          totalRequestedAmount: Number(fullData.totalRequestedAmount) || 0,
          totalApprovedAmount: Number(fullData.totalApprovedAmount) || 0,
        };
      } catch (error) {
        console.error("Detail fetch error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load request details",
        });
        return null;
      }
    },
    [toast],
  );

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) {
      fetchFundRequests();
    } else {
      const processed = initialData.map((item: any) => ({
        ...item,
        internalCashFundsRequests: Array.isArray(item.internalCashFundsRequests)
          ? item.internalCashFundsRequests
          : [],
        totalRequestedAmount: Number(item.totalRequestedAmount) || 0,
        totalApprovedAmount: Number(item.totalApprovedAmount) || 0,
        cashHeadId: item.cashHeadId || null,
      }));
      setData(processed);
    }
  }, [initialData, fetchFundRequests]);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const searchInItem = useCallback(
    (item: CashFundRequest, term: string): boolean => {
      if (!term) return true;

      const q = term.toLowerCase();
      const fields = [
        item.approvalStatus,
        item.totalRequestedAmount?.toString(),
        item.cashFundRequestId?.toString(),
        item.cashHeadName,
        ...(item.internalCashFundsRequests || []).flatMap((d) => [
          d.headOfAccount,
          d.beneficiary,
          d.customerName,
          d.jobNumber,
          d.subRequestStatus,
          d.remarks,
        ]),
      ].filter(Boolean) as string[];

      return fields.some((f) => f.toLowerCase().includes(q));
    },
    [],
  );

  const getCurrentTabData = useMemo(() => {
    let tabData = data;

    // Apply tab filter
    switch (activeTab) {
      case "PENDING":
        tabData = data.filter((i) => i.approvalStatus === pendingStatus);
        break;
      case "APPROVED":
        tabData = data.filter((i) => i.approvalStatus === approvedStatus);
        break;
      case "REJECTED":
        tabData = data.filter((i) => i.approvalStatus === rejectedStatus);
        break;
      case "PAID":
        tabData = data.filter((i) => i.approvalStatus === "Paid");
        break;
      case "ALL_REQUESTS":
      default:
        // No additional filtering
        break;
    }

    // Apply status filter (only for ALL_REQUESTS tab)
    if (activeTab === "ALL_REQUESTS" && statusFilter !== "ALL") {
      tabData = tabData.filter((i) => i.approvalStatus === statusFilter);
    }

    // Apply search filter
    if (searchText) {
      tabData = tabData.filter((i) => searchInItem(i, searchText));
    }

    return tabData;
  }, [
    data,
    activeTab,
    statusFilter,
    searchText,
    pendingStatus,
    approvedStatus,
    rejectedStatus,
    searchInItem,
  ]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const getRequestStats = useMemo(
    () => ({
      totalRequests: data.length,
      pendingRequests: data.filter((i) => i.approvalStatus === pendingStatus)
        .length,
      approvedRequests: data.filter((i) => i.approvalStatus === approvedStatus)
        .length,
      rejectedRequests: data.filter((i) => i.approvalStatus === rejectedStatus)
        .length,
      paidRequests: data.filter((i) => i.approvalStatus === "Paid").length,
      totalRequestedAmount: data.reduce(
        (s, i) => s + (i.totalRequestedAmount || 0),
        0,
      ),
      totalApprovedAmount: data.reduce(
        (s, i) => s + (i.totalApprovedAmount || 0),
        0,
      ),
      totalLineItems: data.reduce(
        (s, i) => s + (i.internalCashFundsRequests?.length || 0),
        0,
      ),
    }),
    [data, pendingStatus, approvedStatus, rejectedStatus],
  );

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleAddEditComplete = useCallback(() => {
    setShowForm(false);
    setSelectedRequest(null);
    fetchFundRequests();
  }, [fetchFundRequests]);

  const handleApprovalComplete = useCallback(() => {
    setShowApprovalForm(false);
    setSelectedRequestForApproval(null);
    fetchFundRequests();
  }, [fetchFundRequests]);

  const handleDelete = useCallback(
    async (item: CashFundRequest) => {
      const count = item.internalCashFundsRequests?.length || 0;
      if (
        !confirm(
          `Delete fund request #${item.cashFundRequestId}? This will remove the master record and all ${count} line item(s).`,
        )
      ) {
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
          throw new Error("API base URL not configured");
        }

        const response = await fetch(
          `${baseUrl}InternalCashFundsRequest/${item.cashFundRequestId}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error("Delete failed");
        }

        setData((prev) =>
          prev.filter((r) => r.cashFundRequestId !== item.cashFundRequestId),
        );

        toast({
          title: "Success",
          description: `Fund request deleted (${count} line items removed)`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete fund request",
        });
      }
    },
    [toast],
  );

  const handleViewDetails = useCallback(
    async (request: CashFundRequest) => {
      if (!request.internalCashFundsRequests?.length) {
        setIsLoading(true);
        const full = await fetchRequestDetails(request.cashFundRequestId);
        setIsLoading(false);

        if (full) {
          setSelectedRequestDetails(full);
          setData((prev) =>
            prev.map((i) =>
              i.cashFundRequestId === full.cashFundRequestId
                ? {
                    ...i,
                    internalCashFundsRequests:
                      full.internalCashFundsRequests || [],
                  }
                : i,
            ),
          );
        } else {
          setSelectedRequestDetails(request);
        }
      } else {
        setSelectedRequestDetails(request);
      }
      setViewDialogOpen(true);
    },
    [fetchRequestDetails],
  );

  const handleApproveClick = useCallback(
    async (request: CashFundRequest) => {
      setIsLoading(true);
      const full = await fetchRequestDetails(request.cashFundRequestId);
      setIsLoading(false);

      if (full) {
        setSelectedRequestForApproval(full);
        setShowApprovalForm(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load request details for approval",
        });
      }
    },
    [fetchRequestDetails, toast],
  );

  const handleEditClick = useCallback(
    async (request: CashFundRequest) => {
      setIsLoading(true);
      const full = await fetchRequestDetails(request.cashFundRequestId);
      setIsLoading(false);

      if (full) {
        setSelectedRequest(full);
        setShowForm(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load request details for editing",
        });
      }
    },
    [fetchRequestDetails, toast],
  );

  // ── Exports ─────────────────────────────────────────────────────────────────
  const downloadExcelWithData = useCallback(
    async (rows: CashFundRequest[], tabName: string) => {
      if (!rows?.length) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No data to export",
        });
        return;
      }

      setIsExporting(true);

      try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(tabName);

        ws.addRow([
          "Request ID",
          "Cash Head",
          "Line Items",
          "Total Requested",
          "Total Approved",
          "Status",
          "Created On",
        ]);

        rows.forEach((r) =>
          ws.addRow([
            r.cashFundRequestId || "",
            r.cashHeadName || "-",
            r.internalCashFundsRequests?.length || 0,
            r.totalRequestedAmount || 0,
            r.totalApprovedAmount || 0,
            r.approvalStatus || "",
            formatDate(r.createdOn),
          ]),
        );

        ws.columns.forEach((c) => {
          c.width = 18;
        });

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer]),
          `${tabName}_FundRequests_${moment().format("YYYY-MM-DD")}.xlsx`,
        );

        toast({
          title: "Success",
          description: "Excel downloaded successfully",
        });
      } catch (e) {
        console.error("Excel export error:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate Excel file",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [toast],
  );

  const downloadPDFWithData = useCallback(
    (rows: CashFundRequest[], tabName: string) => {
      if (!rows?.length) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No data to export",
        });
        return;
      }

      setIsExporting(true);

      try {
        const doc = new jsPDF("landscape");
        doc.setFontSize(16);
        doc.setTextColor(40, 116, 166);
        doc.text(`${tabName} - Internal Cash Fund Requests`, 20, 20);

        autoTable(doc, {
          head: [
            [
              "Request ID",
              "Cash Head",
              "Items",
              "Requested (PKR)",
              "Approved (PKR)",
              "Status",
              "Created On",
            ],
          ],
          body: rows.map((i) => [
            i.cashFundRequestId?.toString() || "N/A",
            i.cashHeadName || "-",
            i.internalCashFundsRequests?.length?.toString() || "0",
            new Intl.NumberFormat("en-US").format(i.totalRequestedAmount || 0),
            new Intl.NumberFormat("en-US").format(i.totalApprovedAmount || 0),
            i.approvalStatus || "N/A",
            formatDate(i.createdOn),
          ]),
          startY: 30,
          theme: "striped",
          headStyles: {
            fillColor: [40, 116, 166],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
        });

        doc.save(
          `${tabName}_FundRequests_${moment().format("YYYY-MM-DD")}.pdf`,
        );
        toast({
          title: "Success",
          description: "PDF downloaded successfully",
        });
      } catch (e) {
        console.error("PDF export error:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate PDF file",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [toast],
  );

  // ── Status badge styling ────────────────────────────────────────────────────
  const getStatusBadge = useCallback(
    (status: string): string => {
      const s = status?.toLowerCase();
      if (s === approvedStatus.toLowerCase())
        return "bg-green-50 text-green-700 border-green-200";
      if (s === rejectedStatus.toLowerCase())
        return "bg-red-50 text-red-700 border-red-200";
      if (s === pendingStatus.toLowerCase())
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      if (s === "paid") return "bg-blue-50 text-blue-700 border-blue-200";
      return "bg-gray-100 text-gray-800 border-gray-200";
    },
    [approvedStatus, rejectedStatus, pendingStatus],
  );

  const getStatusIcon = useCallback(
    (status: string) => {
      const s = status?.toLowerCase();
      if (s === approvedStatus.toLowerCase() || s === "paid") {
        return <FiCheckCircle className='mr-1 h-3 w-3' />;
      }
      if (s === rejectedStatus.toLowerCase()) {
        return <FiXCircle className='mr-1 h-3 w-3' />;
      }
      return <FiClock className='mr-1 h-3 w-3' />;
    },
    [approvedStatus, rejectedStatus],
  );

  // ── Table columns ───────────────────────────────────────────────────────────
  const columns: ColumnDef<CashFundRequest>[] = useMemo(
    () => [
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className='flex gap-1.5'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors'
                    onClick={() => handleViewDetails(row.original)}
                    aria-label='View details'
                  >
                    <FiEye size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>View Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {row.original.approvalStatus === pendingStatus && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className='p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors'
                      onClick={() => handleApproveClick(row.original)}
                      aria-label='Approve or reject'
                    >
                      <FiCheckCircle size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>Approve / Reject</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors'
                    onClick={() => handleEditClick(row.original)}
                    aria-label='Edit request'
                  >
                    <FiEdit size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>Edit Request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors'
                    onClick={() => handleDelete(row.original)}
                    aria-label='Delete request'
                  >
                    <FiTrash2 size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>Delete Request</p>
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
        accessorKey: "cashFundRequestId",
        header: "Request ID",
        cell: ({ row }) => (
          <div className='font-semibold text-sm text-blue-700'>
            #{row.original.cashFundRequestId}
          </div>
        ),
      },
      {
        accessorKey: "cashHeadName",
        header: "Cash Account",
        cell: ({ row }) => (
          <div
            className='text-sm text-gray-700 max-w-[160px] truncate'
            title={row.original.cashHeadName || "-"}
          >
            {row.original.cashHeadName || "-"}
          </div>
        ),
      },
      {
        id: "lineItems",
        header: "Line Items",
        cell: ({ row }) => {
          const details = row.original.internalCashFundsRequests || [];
          const count = details.length;
          const approved = details.filter(
            (d) => d.subRequestStatus === approvedStatus,
          ).length;
          const rejected = details.filter(
            (d) => d.subRequestStatus === rejectedStatus,
          ).length;

          return (
            <div className='flex flex-col gap-0.5'>
              <Badge
                variant='outline'
                className='flex items-center gap-1 w-fit'
              >
                <FiList className='h-3 w-3' />
                {count} item{count !== 1 ? "s" : ""}
              </Badge>
              {count > 0 && (
                <span className='text-xs text-gray-500'>
                  <span className='text-green-600'>{approved}✓</span>{" "}
                  <span className='text-red-600'>{rejected}✗</span>
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "totalRequestedAmount",
        header: "Total Requested",
        cell: ({ row }) => (
          <div className='text-sm font-medium text-gray-900'>
            {formatCurrency(row.original.totalRequestedAmount)}
          </div>
        ),
      },
      {
        accessorKey: "totalApprovedAmount",
        header: "Total Approved",
        cell: ({ row }) => (
          <div className='text-sm font-medium text-green-700'>
            {row.original.totalApprovedAmount
              ? formatCurrency(row.original.totalApprovedAmount)
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "approvalStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.approvalStatus;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(status)}`}
            >
              {getStatusIcon(status)}
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdOn",
        header: "Created On",
        cell: ({ row }) => (
          <div className='text-xs text-gray-600'>
            {formatDate(row.original.createdOn)}
          </div>
        ),
      },
    ],
    [
      pendingStatus,
      approvedStatus,
      rejectedStatus,
      handleViewDetails,
      handleApproveClick,
      handleEditClick,
      handleDelete,
      getStatusBadge,
      getStatusIcon,
    ],
  );

  // ── View Details Dialog ─────────────────────────────────────────────────────
  const ViewRequestDialog = useCallback(() => {
    if (!selectedRequestDetails) return null;

    return (
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' />
              Fund Request Details
            </DialogTitle>
            <DialogDescription>
              Request ID: #{selectedRequestDetails.cashFundRequestId}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Master info */}
            <Card>
              <CardHeader className='py-3 px-4 bg-blue-50'>
                <CardTitle className='text-sm font-medium flex items-center gap-2'>
                  <Badge variant='default' className='bg-blue-600'>
                    Master
                  </Badge>
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-3 px-4 pb-3'>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Request ID:</span>
                    <span className='font-medium'>
                      #{selectedRequestDetails.cashFundRequestId}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Cash Account:</span>
                    <span className='font-medium'>
                      {selectedRequestDetails.cashHeadName || "-"}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Total Requested:</span>
                    <span className='font-medium text-blue-700'>
                      {formatCurrency(
                        selectedRequestDetails.totalRequestedAmount,
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Total Approved:</span>
                    <span className='font-medium text-green-700'>
                      {selectedRequestDetails.totalApprovedAmount
                        ? formatCurrency(
                            selectedRequestDetails.totalApprovedAmount,
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <span
                      className={`font-medium inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStatusBadge(selectedRequestDetails.approvalStatus)}`}
                    >
                      {getStatusIcon(selectedRequestDetails.approvalStatus)}
                      {selectedRequestDetails.approvalStatus}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Line Items:</span>
                    <span className='font-medium'>
                      {selectedRequestDetails.internalCashFundsRequests
                        ?.length || 0}{" "}
                      items
                    </span>
                  </div>
                  {selectedRequestDetails.approvedOn && (
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Approved On:</span>
                      <span className='font-medium'>
                        {formatDate(selectedRequestDetails.approvedOn)}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Created On:</span>
                    <span className='font-medium'>
                      {formatDate(selectedRequestDetails.createdOn)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detail lines */}
            <Card>
              <CardHeader className='py-3 px-4 bg-gray-50'>
                <CardTitle className='text-sm font-medium flex items-center gap-2'>
                  <Badge variant='outline' className='bg-white'>
                    Details
                  </Badge>
                  Line Items (
                  {selectedRequestDetails.internalCashFundsRequests?.length ||
                    0}
                  )
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-3 px-4 pb-3'>
                {selectedRequestDetails.internalCashFundsRequests?.length ? (
                  <div className='border rounded-lg overflow-hidden overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-gray-50'>
                          <TableHead className='w-[40px]'>#</TableHead>
                          <TableHead>Job Number</TableHead>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Head of Account</TableHead>
                          <TableHead>Beneficiary</TableHead>
                          <TableHead className='text-right'>
                            Requested
                          </TableHead>
                          <TableHead className='text-right'>Approved</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequestDetails.internalCashFundsRequests.map(
                          (detail, index) => (
                            <TableRow
                              key={detail.internalFundsRequestCashId || index}
                            >
                              <TableCell className='font-medium text-xs'>
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                {detail.jobId ? (
                                  <Badge
                                    variant='outline'
                                    className='bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs'
                                  >
                                    {detail.jobNumber || `#${detail.jobId}`}
                                  </Badge>
                                ) : (
                                  <span className='text-xs text-gray-400'>
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className='text-xs text-gray-700'>
                                {detail.customerName || "—"}
                              </TableCell>
                              <TableCell className='text-sm'>
                                {detail.headOfAccount || "-"}
                              </TableCell>
                              <TableCell className='text-sm'>
                                {detail.beneficiary || "-"}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-right'>
                                {formatCurrency(detail.requestedAmount)}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-green-700 text-right'>
                                {detail.approvedAmount
                                  ? formatCurrency(detail.approvedAmount)
                                  : "-"}
                              </TableCell>
                              <TableCell className='text-xs text-gray-600 max-w-[120px] truncate'>
                                {detail.remarks || "—"}
                              </TableCell>
                              <TableCell>
                                {detail.subRequestStatus && (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(detail.subRequestStatus)}`}
                                  >
                                    {getStatusIcon(detail.subRequestStatus)}
                                    {detail.subRequestStatus}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className='text-sm text-gray-500 text-center py-4'>
                    No line items available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }, [viewDialogOpen, selectedRequestDetails, getStatusBadge, getStatusIcon]);

  // ── Statistics tab ──────────────────────────────────────────────────────────
  const RequestStatsPage = useCallback(() => {
    const stats = getRequestStats;

    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Fund Request Statistics
          </h2>
          <Button
            onClick={() => downloadPDFWithData(data, "Statistics")}
            size='sm'
            className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'
            disabled={isExporting || !data.length}
          >
            <FiDownload size={14} />
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          {[
            {
              label: "Total Requests",
              value: stats.totalRequests,
              sub: `${stats.totalLineItems} line items · ${stats.pendingRequests} pending`,
              color: "blue",
            },
            {
              label: "Total Requested",
              value: formatCompactCurrency(stats.totalRequestedAmount),
              sub: "Sum of all requests",
              color: "green",
            },
            {
              label: "Total Approved",
              value: formatCompactCurrency(stats.totalApprovedAmount),
              sub: "Approved amount",
              color: "purple",
            },
            {
              label: approvedStatus,
              value: stats.approvedRequests,
              sub: "Fully approved",
              color: "green",
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
                <div
                  className={`text-2xl font-bold text-${card.color}-900 mt-1`}
                >
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
  }, [getRequestStats, data, isExporting, approvedStatus, downloadPDFWithData]);

  // ── Route: Approval Form ────────────────────────────────────────────────────
  if (showApprovalForm && selectedRequestForApproval) {
    return (
      <div className='p-4 bg-gray-50 min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setShowApprovalForm(false);
              setSelectedRequestForApproval(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Request List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <InternalFundRequestApprovalForm
              requestData={selectedRequestForApproval}
              onApprovalComplete={handleApprovalComplete}
              onCancel={() => {
                setShowApprovalForm(false);
                setSelectedRequestForApproval(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Route: Add/Edit Form ────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className='p-4 bg-gray-50 min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setShowForm(false);
              setSelectedRequest(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Request List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <InternalFundRequestForm
              type={selectedRequest ? "edit" : "add"}
              defaultState={selectedRequest}
              handleAddEdit={handleAddEditComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main List View ──────────────────────────────────────────────────────────
  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Page header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Internal Fund Request Management (Cash)
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Master-detail fund requests with per-line approval tracking
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={fetchFundRequests}
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
                setSelectedRequest(null);
                setShowForm(true);
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' /> Add New Request
            </Button>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <FiAlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search / filter / export bar */}
        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='flex items-center gap-2 flex-1 w-full md:w-auto'>
              <div className='relative flex-1 max-w-md'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by account, beneficiary, customer...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-9 pr-9 py-1.5 text-sm h-9'
                  aria-label='Search fund requests'
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText("")}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    aria-label='Clear search'
                  >
                    <FiX className='h-4 w-4' />
                  </button>
                )}
              </div>
              {activeTab === "ALL_REQUESTS" && (
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
                onClick={() =>
                  downloadPDFWithData(getCurrentTabData, activeTab)
                }
                size='sm'
                className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs'
                disabled={isExporting || !getCurrentTabData.length}
              >
                <FiFilePlus className='h-3.5 w-3.5' />
                {isExporting ? "Exporting..." : "Export PDF"}
              </Button>
              <Button
                onClick={() =>
                  downloadExcelWithData(getCurrentTabData, activeTab)
                }
                size='sm'
                className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                disabled={isExporting || !getCurrentTabData.length}
              >
                <FiDownload className='h-3.5 w-3.5' />
                {isExporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue='ALL_REQUESTS'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='grid w-full grid-cols-6 gap-1 bg-transparent h-auto p-0'>
              <TabsTrigger
                value='ALL_REQUESTS'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiDollarSign className='w-3.5 h-3.5 mr-1.5' /> All (
                {data.length})
              </TabsTrigger>
              <TabsTrigger
                value='PENDING'
                className='text-xs py-2 px-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiClock className='w-3.5 h-3.5 mr-1.5' /> {pendingStatus} (
                {getRequestStats.pendingRequests})
              </TabsTrigger>
              <TabsTrigger
                value='APPROVED'
                className='text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />{" "}
                {approvedStatus} ({getRequestStats.approvedRequests})
              </TabsTrigger>
              <TabsTrigger
                value='REJECTED'
                className='text-xs py-2 px-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiXCircle className='w-3.5 h-3.5 mr-1.5' /> {rejectedStatus} (
                {getRequestStats.rejectedRequests})
              </TabsTrigger>
              <TabsTrigger
                value='PAID'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' /> Paid (
                {getRequestStats.paidRequests})
              </TabsTrigger>
              <TabsTrigger
                value='STATISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiFilePlus className='w-3.5 h-3.5 mr-1.5' /> Statistics
              </TabsTrigger>
            </TabsList>
          </div>

          {["ALL_REQUESTS", "PENDING", "APPROVED", "REJECTED", "PAID"].map(
            (tab) => (
              <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
                <div className='bg-white rounded-lg shadow-sm border'>
                  {getCurrentTabData.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16'>
                      <FiDollarSign className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                      <h3 className='text-base font-medium text-gray-900'>
                        No fund requests found
                      </h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        {searchText || statusFilter !== "ALL"
                          ? "Try adjusting your search or filter terms"
                          : "Add your first fund request using the button above"}
                      </p>
                    </div>
                  ) : (
                    <AppDataTable
                      data={getCurrentTabData}
                      loading={isLoading}
                      columns={columns}
                      searchText={searchText}
                      isPage
                      isMultiSearch
                    />
                  )}
                </div>
              </TabsContent>
            ),
          )}

          <TabsContent value='STATISTICS' className='space-y-3 mt-3'>
            <div className='bg-white rounded-lg shadow-sm border p-4'>
              <RequestStatsPage />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isLoading && <AppLoader />}
      <ViewRequestDialog />
    </div>
  );
}
