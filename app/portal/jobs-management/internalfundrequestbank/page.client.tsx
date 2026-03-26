"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import InternalBankFundRequestForm from "@/views/forms/internal-bank-fund-request/InternalBankFundRequestForm_MasterDetail";
import InternalBankFundRequestApprovalForm from "@/views/forms/internal-bank-fund-request/InternalBankFundRequestForm_Approval";

type InternalBankFundRequestPageProps = {
  initialData?: any[];
};

// ─── Types ────────────────────────────────────────────────────────────────────

type BankFundRequest = {
  bankFundRequestId: number;
  bankId: number;
  bankName?: string;
  requestorUserId?: number;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  approvalStatus: string; // "Approved" | "Rejected" | "Pending" from API
  approvedBy?: string;
  approvedOn?: string;
  requestedTo?: number;
  createdOn: string;
  version: number;
  internalBankFundsRequests: BankDetailLineItem[];
};

type BankDetailLineItem = {
  internalFundsRequestBankId: number;
  jobId: number | null;
  jobNumber?: string;
  customerName?: string;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount: string;
  beneficiary: string;
  accountNo: string;
  onAccountOfId?: number | null;
  requestedAmount: number;
  approvedAmount: number;
  requestedTo?: number;
  subRequestStatus?: string;
  remarks?: string;
  createdOn: string;
  bankFundRequestMasterId: number;
  chargesId: number;
  version: number;
};

type StatusOption = { key: string; label: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternalBankFundRequestPage({
  initialData,
}: InternalBankFundRequestPageProps) {
  const [data, setData] = useState<BankFundRequest[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<BankFundRequest | null>(null);
  const [selectedRequestForApproval, setSelectedRequestForApproval] =
    useState<BankFundRequest | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_REQUESTS");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<BankFundRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Status values from API
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [pendingStatus, setPendingStatus] = useState("Pending");
  const [approvedStatus, setApprovedStatus] = useState("Approved");
  const [rejectedStatus, setRejectedStatus] = useState("Rejected");

  const { toast } = useToast();

  // ── Fetch status options ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL;
        const res = await fetch(
          `${base}General/GetTypeValues?typeName=FundRequest_Detail_Status`,
          { method: "GET", headers: { "Content-Type": "application/json" } },
        );
        if (res.ok) {
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
        }
      } catch (e) {
        console.error("Status fetch:", e);
      }
    };
    fetchStatuses();
  }, []);

  // Status filter options — built from API values
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
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(
        `${baseUrl}InternalBankFundsRequest/GetList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "BankFundRequestId,BankId,TotalRequestedAmount,TotalApprovedAmount,ApprovalStatus,ApprovedBy,ApprovedOn,RequestedTo,CreatedOn,Version,RequestorUserId",
            where: "",
            sortOn: "BankFundRequestId DESC",
            page: "1",
            pageSize: "100",
          }),
        },
      );

      if (response.ok) {
        const requestData = await response.json();
        const processedData: BankFundRequest[] = requestData.map(
          (item: any) => ({
            ...item,
            bankName: item.bank?.bankName || item.bankName || "-",
            internalBankFundsRequests: item.internalBankFundsRequests || [],
            totalRequestedAmount: Number(item.totalRequestedAmount) || 0,
            totalApprovedAmount: Number(item.totalApprovedAmount) || 0,
          }),
        );
        setData(processedData);
        toast({
          title: "Success",
          description: `Loaded ${processedData.length} bank fund request(s)`,
        });
      } else {
        throw new Error(`${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bank fund requests",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Fetch single record ─────────────────────────────────────────────────────
  const fetchRequestDetails = async (
    id: number,
  ): Promise<BankFundRequest | null> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}InternalBankFundsRequest/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const fullData = await response.json();
        if (fullData.bank?.bankName && !fullData.bankName)
          fullData.bankName = fullData.bank.bankName;
        return fullData;
      }
      throw new Error(`${response.status}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load request details",
      });
      return null;
    }
  };

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) {
      fetchFundRequests();
    } else {
      setData(
        initialData.map((item: any) => ({
          ...item,
          bankName: item.bank?.bankName || item.bankName || "-",
          internalBankFundsRequests: item.internalBankFundsRequests || [],
          totalRequestedAmount: Number(item.totalRequestedAmount) || 0,
          totalApprovedAmount: Number(item.totalApprovedAmount) || 0,
        })),
      );
    }
  }, [initialData, fetchFundRequests]);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const searchInItem = (item: BankFundRequest, term: string) => {
    if (!term) return true;
    const q = term.toLowerCase();
    const fields = [
      item.bankName,
      item.approvalStatus,
      item.totalRequestedAmount?.toString(),
      item.bankFundRequestId?.toString(),
      ...(item.internalBankFundsRequests || []).flatMap((d) => [
        d.headOfAccount,
        d.beneficiary,
        d.accountNo,
        d.jobNumber,
        d.customerName,
        d.subRequestStatus,
        d.remarks,
      ]),
    ].filter(Boolean) as string[];
    return fields.some((f) => f.toLowerCase().includes(q));
  };

  const getCurrentTabData = () => {
    let tabData = data;
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
    }
    tabData = tabData.filter((i) => searchInItem(i, searchText));
    if (activeTab === "ALL_REQUESTS" && statusFilter !== "ALL")
      tabData = tabData.filter((i) => i.approvalStatus === statusFilter);
    return tabData;
  };

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
        (s, i) => s + (i.internalBankFundsRequests?.length || 0),
        0,
      ),
    }),
    [data, pendingStatus, approvedStatus, rejectedStatus],
  );

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleAddEditComplete = () => {
    setShowForm(false);
    setSelectedRequest(null);
    fetchFundRequests();
  };
  const handleApprovalComplete = () => {
    setShowApprovalForm(false);
    setSelectedRequestForApproval(null);
    fetchFundRequests();
  };

  const handleDelete = async (item: BankFundRequest) => {
    const count = item.internalBankFundsRequests?.length || 0;
    if (
      !confirm(
        `Delete bank fund request #${item.bankFundRequestId}? This will remove the master record and all ${count} line item(s).`,
      )
    )
      return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(
        `${baseUrl}InternalBankFundsRequest/${item.bankFundRequestId}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setData((prev) =>
          prev.filter((r) => r.bankFundRequestId !== item.bankFundRequestId),
        );
        toast({
          title: "Success",
          description: `Bank fund request deleted (${count} line items removed)`,
        });
      } else throw new Error("Delete failed");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete bank fund request",
      });
    }
  };

  const handleViewDetails = async (request: BankFundRequest) => {
    if (!request.internalBankFundsRequests?.length) {
      setIsLoading(true);
      const full = await fetchRequestDetails(request.bankFundRequestId);
      setIsLoading(false);
      setSelectedRequestDetails(full || request);
      if (full) {
        setData((prev) =>
          prev.map((i) =>
            i.bankFundRequestId === full.bankFundRequestId
              ? {
                  ...i,
                  internalBankFundsRequests:
                    full.internalBankFundsRequests || [],
                }
              : i,
          ),
        );
      }
    } else {
      setSelectedRequestDetails(request);
    }
    setViewDialogOpen(true);
  };

  const handleApproveClick = async (request: BankFundRequest) => {
    const full = await fetchRequestDetails(request.bankFundRequestId);
    if (full) {
      setSelectedRequestForApproval(full);
      setShowApprovalForm(true);
    } else
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load request details for approval",
      });
  };

  // ── Exports ─────────────────────────────────────────────────────────────────
  const downloadExcelWithData = (rows: BankFundRequest[], tabName: string) => {
    if (!rows?.length) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No data to export",
      });
      return;
    }
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(tabName);
      ws.addRow([
        "Request ID",
        "Bank",
        "Line Items",
        "Total Requested",
        "Total Approved",
        "Status",
        "Created On",
      ]);
      rows.forEach((r) =>
        ws.addRow([
          r.bankFundRequestId || "",
          r.bankName || "-",
          r.internalBankFundsRequests?.length || 0,
          r.totalRequestedAmount || 0,
          r.totalApprovedAmount || 0,
          r.approvalStatus || "",
          r.createdOn ? new Date(r.createdOn).toLocaleDateString() : "",
        ]),
      );
      ws.columns.forEach((c) => {
        c.width = 18;
      });
      wb.xlsx
        .writeBuffer()
        .then((buf) =>
          saveAs(
            new Blob([buf]),
            `${tabName}_BankFundRequests_${moment().format("YYYY-MM-DD")}.xlsx`,
          ),
        );
      toast({ title: "Success", description: "Excel downloaded" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate Excel",
      });
    }
  };

  const downloadPDFWithData = (rows: BankFundRequest[], tabName: string) => {
    if (!rows?.length) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No data to export",
      });
      return;
    }
    try {
      const doc = new jsPDF("landscape");
      doc.setFontSize(16);
      doc.setTextColor(40, 116, 166);
      doc.text(`${tabName} - Internal Bank Fund Requests`, 20, 20);
      autoTable(doc, {
        head: [
          [
            "Request ID",
            "Bank",
            "Items",
            "Requested (PKR)",
            "Approved (PKR)",
            "Status",
            "Created On",
          ],
        ],
        body: rows.map((i) => [
          i.bankFundRequestId?.toString() || "N/A",
          i.bankName || "-",
          i.internalBankFundsRequests?.length?.toString() || "0",
          new Intl.NumberFormat("en-US").format(i.totalRequestedAmount || 0),
          new Intl.NumberFormat("en-US").format(i.totalApprovedAmount || 0),
          i.approvalStatus || "N/A",
          i.createdOn ? new Date(i.createdOn).toLocaleDateString() : "-",
        ]),
        startY: 30,
        theme: "striped",
        headStyles: {
          fillColor: [40, 116, 166],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: { fontSize: 8, cellPadding: 3 },
      });
      doc.save(
        `${tabName}_BankFundRequests_${moment().format("YYYY-MM-DD")}.pdf`,
      );
      toast({ title: "Success", description: "PDF downloaded" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      });
    }
  };

  // ── Status styling (case-insensitive, matches API values) ────────────────────
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "bg-green-50 text-green-700 border-green-200";
    if (s === "rejected") return "bg-red-50 text-red-700 border-red-200";
    if (s === "pending")
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (s === "paid") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "paid")
      return <FiCheckCircle className='mr-1 h-3 w-3' />;
    if (s === "rejected") return <FiXCircle className='mr-1 h-3 w-3' />;
    return <FiClock className='mr-1 h-3 w-3' />;
  };

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns: ColumnDef<BankFundRequest>[] = [
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

          {/* Approve — show for pendingStatus requests */}
          {row.original.approvalStatus === pendingStatus && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors'
                    onClick={() => handleApproveClick(row.original)}
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
                  onClick={async () => {
                    const full = await fetchRequestDetails(
                      row.original.bankFundRequestId,
                    );
                    if (full) {
                      setSelectedRequest(full);
                      setShowForm(true);
                    }
                  }}
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
      accessorKey: "bankFundRequestId",
      header: "Request ID",
      cell: ({ row }) => (
        <div className='font-semibold text-sm text-blue-700'>
          #{row.original.bankFundRequestId}
        </div>
      ),
    },
    {
      accessorKey: "bankName",
      header: "Bank",
      cell: ({ row }) => (
        <div className='text-sm font-medium text-gray-900'>
          {row.original.bankName || "-"}
        </div>
      ),
    },
    {
      accessorKey: "lineItems",
      header: "Line Items",
      cell: ({ row }) => {
        const details = row.original.internalBankFundsRequests || [];
        const count = details.length;
        const approved = details.filter(
          (d) => d.subRequestStatus === approvedStatus,
        ).length;
        const rejected = details.filter(
          (d) => d.subRequestStatus === rejectedStatus,
        ).length;
        return (
          <div className='flex flex-col gap-0.5'>
            <Badge variant='outline' className='flex items-center gap-1 w-fit'>
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
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "PKR",
          }).format(row.getValue("totalRequestedAmount") || 0)}
        </div>
      ),
    },
    {
      accessorKey: "totalApprovedAmount",
      header: "Total Approved",
      cell: ({ row }) => (
        <div className='text-sm font-medium text-green-700'>
          {row.original.totalApprovedAmount
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
              }).format(row.original.totalApprovedAmount)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "approvalStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("approvalStatus") as string;
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
          {row.original.createdOn
            ? new Date(row.original.createdOn).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "-"}
        </div>
      ),
    },
  ];

  // ── View Details Dialog ──────────────────────────────────────────────────────
  const ViewRequestDialog = () => (
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FiEye className='h-5 w-5' /> Bank Fund Request Details
          </DialogTitle>
          <DialogDescription>
            Request ID: #{selectedRequestDetails?.bankFundRequestId} | Bank:{" "}
            {selectedRequestDetails?.bankName || "-"}
          </DialogDescription>
        </DialogHeader>

        {selectedRequestDetails && (
          <div className='space-y-4'>
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
                  {[
                    [
                      "Request ID",
                      `#${selectedRequestDetails.bankFundRequestId}`,
                    ],
                    ["Bank", selectedRequestDetails.bankName || "-"],
                    [
                      "Total Requested",
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PKR",
                      }).format(
                        selectedRequestDetails.totalRequestedAmount || 0,
                      ),
                    ],
                    [
                      "Total Approved",
                      selectedRequestDetails.totalApprovedAmount
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "PKR",
                          }).format(selectedRequestDetails.totalApprovedAmount)
                        : "-",
                    ],
                    [
                      "Line Items",
                      `${selectedRequestDetails.internalBankFundsRequests?.length || 0} items`,
                    ],
                    [
                      "Created On",
                      new Date(
                        selectedRequestDetails.createdOn,
                      ).toLocaleDateString(),
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
                      className={`font-medium inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStatusBadge(selectedRequestDetails.approvalStatus)}`}
                    >
                      {getStatusIcon(selectedRequestDetails.approvalStatus)}
                      {selectedRequestDetails.approvalStatus}
                    </span>
                  </div>
                  {selectedRequestDetails.approvedOn && (
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Approved On:</span>
                      <span className='font-medium'>
                        {new Date(
                          selectedRequestDetails.approvedOn,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='py-3 px-4 bg-gray-50'>
                <CardTitle className='text-sm font-medium flex items-center gap-2'>
                  <Badge variant='outline' className='bg-white'>
                    Details
                  </Badge>
                  Line Items (
                  {selectedRequestDetails.internalBankFundsRequests?.length ||
                    0}
                  )
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-3 px-4 pb-3'>
                {selectedRequestDetails.internalBankFundsRequests?.length ? (
                  <div className='border rounded-lg overflow-hidden overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-gray-50'>
                          <TableHead className='w-[40px]'>#</TableHead>
                          <TableHead>Job Number</TableHead>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Head of Account</TableHead>
                          <TableHead>Beneficiary</TableHead>
                          <TableHead>Account No</TableHead>
                          <TableHead className='text-right'>
                            Requested
                          </TableHead>
                          <TableHead className='text-right'>Approved</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequestDetails.internalBankFundsRequests.map(
                          (detail, index) => (
                            <TableRow
                              key={detail.internalFundsRequestBankId || index}
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
                              <TableCell className='text-sm font-mono text-gray-600'>
                                {detail.accountNo || "-"}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-right'>
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "PKR",
                                }).format(detail.requestedAmount || 0)}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-green-700 text-right'>
                                {detail.approvedAmount
                                  ? new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "PKR",
                                    }).format(detail.approvedAmount)
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
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ── Statistics tab ───────────────────────────────────────────────────────────
  const RequestStatsPage = () => {
    const stats = getRequestStats;
    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Bank Fund Request Statistics
          </h2>
          <Button
            onClick={() => downloadPDFWithData(data, "Statistics")}
            size='sm'
            className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'
          >
            <FiDownload size={14} /> Export Report
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
              value: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
                notation: "compact",
              }).format(stats.totalRequestedAmount),
              sub: "Sum of all requests",
              color: "green",
            },
            {
              label: "Total Approved",
              value: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
                notation: "compact",
              }).format(stats.totalApprovedAmount),
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
  };

  // ── Route: Approval Form ─────────────────────────────────────────────────────
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
            <InternalBankFundRequestApprovalForm
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

  // ── Route: Add/Edit Form ─────────────────────────────────────────────────────
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
            <InternalBankFundRequestForm
              type={selectedRequest ? "edit" : "add"}
              defaultState={selectedRequest || {}}
              handleAddEdit={handleAddEditComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main List View ───────────────────────────────────────────────────────────
  const currentTabData = getCurrentTabData();

  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Internal Fund Request Management (Bank)
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Master-detail bank fund requests with per-line approval tracking
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

        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='flex items-center gap-2 flex-1 w-full md:w-auto'>
              <div className='relative flex-1 max-w-md'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by Bank, Account No, Beneficiary, Customer...'
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
                onClick={() => downloadPDFWithData(currentTabData, activeTab)}
                size='sm'
                className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs'
                disabled={!currentTabData?.length}
              >
                <FiFilePlus className='h-3.5 w-3.5' /> Export PDF
              </Button>
              <Button
                onClick={() => downloadExcelWithData(currentTabData, activeTab)}
                size='sm'
                className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                disabled={!currentTabData?.length}
              >
                <FiDownload className='h-3.5 w-3.5' /> Export Excel
              </Button>
            </div>
          </div>
        </div>

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
                  {currentTabData.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16'>
                      <FiDollarSign className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                      <h3 className='text-base font-medium text-gray-900'>
                        No bank fund requests found
                      </h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        {searchText || statusFilter !== "ALL"
                          ? "Try adjusting your search or filter terms"
                          : "Add your first bank fund request using the button above"}
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
