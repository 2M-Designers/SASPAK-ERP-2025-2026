"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColumnDef } from "@tanstack/react-table";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import AppLoader from "@/components/app-loader";
import {
  FiTrash2,
  FiDownload,
  FiEdit,
  FiFilePlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiDollarSign,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiCheck,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import { useToast } from "@/hooks/use-toast";

type InternalFundRequestPageProps = {
  initialData?: any[];
};

type InternalFundRequest = {
  internalFundsRequestCashId: number;
  jobId: number;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount?: string;
  beneficiary?: string;
  partiesAccount?: string;
  requestedAmount: number;
  approvedAmount?: number;
  approvalStatus: string;
  approvedBy?: number;
  approvedOn?: string;
  requestedTo?: number;
  createdOn: string;
  createdBy?: number;
  version: number;
  jobNumber?: string;
};

// Cache manager to prevent duplicate fetches
class CacheManager {
  private jobCache: Map<number, string> = new Map();
  private partyCache: Map<number, string> = new Map();
  private coaCache: Map<number, string> = new Map();
  private pendingJobFetches: Map<number, Promise<string>> = new Map();
  private pendingPartyFetches: Map<number, Promise<string>> = new Map();
  private pendingCoaFetches: Map<number, Promise<string>> = new Map();

  async getJobNumber(jobId: number | undefined): Promise<string> {
    if (!jobId) return "-";

    if (this.jobCache.has(jobId)) {
      return this.jobCache.get(jobId)!;
    }

    if (this.pendingJobFetches.has(jobId)) {
      return this.pendingJobFetches.get(jobId)!;
    }

    const fetchPromise = this.fetchJobNumber(jobId);
    this.pendingJobFetches.set(jobId, fetchPromise);

    const result = await fetchPromise;
    this.pendingJobFetches.delete(jobId);

    return result;
  }

  async getPartyName(partyId: number | undefined): Promise<string> {
    if (!partyId) return "-";

    if (this.partyCache.has(partyId)) {
      return this.partyCache.get(partyId)!;
    }

    if (this.pendingPartyFetches.has(partyId)) {
      return this.pendingPartyFetches.get(partyId)!;
    }

    const fetchPromise = this.fetchPartyName(partyId);
    this.pendingPartyFetches.set(partyId, fetchPromise);

    const result = await fetchPromise;
    this.pendingPartyFetches.delete(partyId);

    return result;
  }

  async getCoaName(coaId: number | undefined): Promise<string> {
    if (!coaId) return "-";

    if (this.coaCache.has(coaId)) {
      return this.coaCache.get(coaId)!;
    }

    if (this.pendingCoaFetches.has(coaId)) {
      return this.pendingCoaFetches.get(coaId)!;
    }

    const fetchPromise = this.fetchCoaName(coaId);
    this.pendingCoaFetches.set(coaId, fetchPromise);

    const result = await fetchPromise;
    this.pendingCoaFetches.delete(coaId);

    return result;
  }

  private async fetchJobNumber(jobId: number): Promise<string> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Job/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        const jobNumber = data.jobNumber || "-";
        this.jobCache.set(jobId, jobNumber);
        return jobNumber;
      }
    } catch (err) {
      console.error(`Error fetching job ${jobId}:`, err);
    }
    return "-";
  }

  private async fetchPartyName(partyId: number): Promise<string> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Party/${partyId}`);
      if (response.ok) {
        const data = await response.json();
        const partyName = data.partyName || data.partyCode || "-";
        this.partyCache.set(partyId, partyName);
        return partyName;
      }
    } catch (err) {
      console.error(`Error fetching party ${partyId}:`, err);
    }
    return "-";
  }

  private async fetchCoaName(coaId: number): Promise<string> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}ChargesMaster/${coaId}`);
      if (response.ok) {
        const data = await response.json();
        const coaName = data.chargeDescription || data.chargeCode || "-";
        this.coaCache.set(coaId, coaName);
        return coaName;
      }
    } catch (err) {
      console.error(`Error fetching COA ${coaId}:`, err);
    }
    return "-";
  }

  async prefetchDetails(request: InternalFundRequest): Promise<{
    jobNumber: string;
    headOfAccount: string;
    beneficiary: string;
  }> {
    return {
      jobNumber: await this.getJobNumber(request.jobId),
      headOfAccount: await this.getCoaName(request.headCoaId),
      beneficiary: await this.getPartyName(request.beneficiaryCoaId),
    };
  }
}

const cacheManager = new CacheManager();

export default function InternalFundRequestPage({
  initialData,
}: InternalFundRequestPageProps) {
  const [data, setData] = useState<InternalFundRequest[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("ALL_REQUESTS");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<InternalFundRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const { toast } = useToast();

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PAID", label: "Paid" },
  ];

  const fetchFundRequests = useCallback(
    async (silent: boolean = false) => {
      if (!silent) {
        console.log("🔄 Fetching fund requests list...");
      }
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        if (!baseUrl) {
          throw new Error("NEXT_PUBLIC_BASE_URL is not configured");
        }

        const url = `${baseUrl}InternalCashFundsRequest/GetList`;
        console.log(`📡 Calling: ${url}`);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "InternalFundsRequestCashId, JobId, Job.JobNumber, HeadCoaId, BeneficiaryCoaId, HeadOfAccount, Beneficiary, PartiesAccount, RequestedAmount, ApprovedAmount, ApprovalStatus, ApprovedBy, ApprovedOn, RequestedTo, CreatedOn, CreatedBy, Version",
            where: "",
            sortOn: "InternalFundsRequestCashId DESC",
            page: "1",
            pageSize: "100",
          }),
        });

        if (response.ok) {
          const requestData = await response.json();
          console.log(`✅ Loaded ${requestData.length} fund requests`);

          if (!silent) {
            console.log("Sample data (first 3 items):");
            requestData
              .slice(0, 3)
              .forEach((item: InternalFundRequest, idx: number) => {
                console.log(
                  `  ${idx + 1}. ID:${item.internalFundsRequestCashId} Job:${item.jobNumber} Status:${item.approvalStatus} Amt:${item.requestedAmount}`,
                );
              });
          } else {
            console.log("  (Silent refresh - no toast)");
          }

          setData(requestData);

          if (!silent) {
            toast({
              title: "Success",
              description: `Loaded ${requestData.length} fund requests`,
            });
          }
        } else {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }
      } catch (error) {
        console.error("❌ Error fetching fund requests:", error);

        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.error("🔴 Network error - possible causes:");
          console.error("  1. Server is down or unreachable");
          console.error("  2. CORS is blocking the request");
          console.error("  3. Network is disabled in browser/app");
          console.error(
            "  4. URL is incorrect:",
            process.env.NEXT_PUBLIC_BASE_URL,
          );
        }

        if (!silent) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "Failed to load fund requests list. Please check your connection.",
          });
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!initialData) {
      fetchFundRequests(false);
    }
  }, [initialData, fetchFundRequests]);

  const searchInItem = (item: InternalFundRequest, searchTerm: string) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();

    const searchableFields = [
      item.jobNumber,
      item.headOfAccount,
      item.beneficiary,
      item.approvalStatus,
      item.requestedAmount?.toString(),
    ].filter(Boolean) as string[];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(searchLower),
    );
  };

  const filterByStatus = (request: InternalFundRequest) => {
    if (statusFilter === "ALL") return true;
    return request.approvalStatus === statusFilter;
  };

  const getCurrentTabData = () => {
    let tabData = data;

    switch (activeTab) {
      case "PENDING":
        tabData = data.filter((item) => item.approvalStatus === "PENDING");
        break;
      case "APPROVED":
        tabData = data.filter((item) => item.approvalStatus === "APPROVED");
        break;
      case "REJECTED":
        tabData = data.filter((item) => item.approvalStatus === "REJECTED");
        break;
      case "PAID":
        tabData = data.filter((item) => item.approvalStatus === "PAID");
        break;
    }

    tabData = tabData.filter((item) => searchInItem(item, searchText));

    if (activeTab === "ALL_REQUESTS") {
      tabData = tabData.filter(filterByStatus);
    }

    return tabData;
  };

  const getRequestStats = useMemo(() => {
    const allRequests = data;
    return {
      totalRequests: allRequests.length,
      pendingRequests: allRequests.filter(
        (item) => item.approvalStatus === "PENDING",
      ).length,
      approvedRequests: allRequests.filter(
        (item) => item.approvalStatus === "APPROVED",
      ).length,
      rejectedRequests: allRequests.filter(
        (item) => item.approvalStatus === "REJECTED",
      ).length,
      paidRequests: allRequests.filter((item) => item.approvalStatus === "PAID")
        .length,
      totalRequestedAmount: allRequests.reduce(
        (sum, item) => sum + (item.requestedAmount || 0),
        0,
      ),
      totalApprovedAmount: allRequests.reduce(
        (sum, item) => sum + (item.approvedAmount || 0),
        0,
      ),
    };
  }, [data]);

  const handleDelete = async (item: InternalFundRequest) => {
    if (
      confirm(
        `Are you sure you want to delete this fund request for Job "${item.jobNumber}"?`,
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}InternalCashFundsRequest/${item.internalFundsRequestCashId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          setData((prev) =>
            prev.filter(
              (record) =>
                record.internalFundsRequestCashId !==
                item.internalFundsRequestCashId,
            ),
          );
          toast({
            title: "Success",
            description: "Fund request deleted successfully",
          });
        } else {
          throw new Error("Failed to delete fund request");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete fund request",
        });
        console.error("Error deleting fund request:", error);
      }
    }
  };

  const handleViewDetails = async (request: InternalFundRequest) => {
    setSelectedRequestDetails(request);
    setViewDialogOpen(true);
  };

  const handleInlineEdit = async (
    request: InternalFundRequest,
    newAmount: number,
  ) => {
    console.log("=".repeat(80));
    console.log("🚀 INLINE EDIT STARTED");
    console.log("Request ID:", request.internalFundsRequestCashId);
    console.log("Current Status:", request.approvalStatus);
    console.log("New Amount:", newAmount);

    if (!newAmount || newAmount <= 0) {
      console.error("❌ Invalid amount:", newAmount);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid amount",
      });
      return;
    }

    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("❌ No userId found in localStorage!");
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log in again.",
      });
      return;
    }

    const userId = parseInt(storedUserId, 10);
    console.log("✅ User ID:", userId);

    const isPending = request.approvalStatus === "PENDING";
    console.log(`📋 Action: ${isPending ? "APPROVE (POST)" : "UPDATE (PUT)"}`);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      const payload = {
        internalFundsRequestCashId: request.internalFundsRequestCashId,
        jobId: request.jobId,
        headCoaId: request.headCoaId,
        beneficiaryCoaId: request.beneficiaryCoaId,
        headOfAccount: request.headOfAccount,
        beneficiary: request.beneficiary,
        partiesAccount: request.partiesAccount,
        requestedAmount: request.requestedAmount,
        approvedAmount: newAmount,
        approvalStatus: isPending ? "APPROVED" : request.approvalStatus,
        approvedBy: userId.toString(),
        approvedOn: request.approvedOn || new Date().toISOString(),
        requestedTo: request.requestedTo?.toString() || null,
        createdBy: request.createdBy?.toString() || null,
        createdOn: request.createdOn,
        version: request.version,
      };

      console.log("📦 Payload:");
      console.log(JSON.stringify(payload, null, 2));

      const method = isPending ? "PUT" : "PUT";
      const url = `${baseUrl}InternalCashFundsRequest`;
      console.log(`📡 ${method} ${url}`);

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(
        `📡 Response Status: ${response.status} ${response.statusText}`,
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Success! Response:", responseData);

        // Update local state
        setData((prev) =>
          prev.map((item) =>
            item.internalFundsRequestCashId ===
            request.internalFundsRequestCashId
              ? {
                  ...item,
                  approvedAmount: newAmount,
                  approvalStatus: isPending ? "APPROVED" : item.approvalStatus,
                  approvedBy: userId,
                  approvedOn: new Date().toISOString(),
                  version: item.version + 1,
                }
              : item,
          ),
        );

        console.log("✅ Local state updated");

        toast({
          title: "Success",
          description: isPending
            ? `Request approved with amount ${new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(newAmount)}`
            : "Approved amount updated successfully",
        });

        setEditingRow(null);

        // Try to refresh data for pending approvals
        if (isPending) {
          console.log("🔄 Attempting silent refresh...");
          try {
            await fetchFundRequests(true);
            console.log("✅ Data refreshed");
          } catch (refreshError) {
            console.warn(
              "⚠️ Auto-refresh failed (data saved locally):",
              refreshError,
            );
          }
        }

        console.log("=".repeat(80));
      } else {
        const errorText = await response.text();
        console.error(`❌ ${method} failed!`);
        console.error("Status:", response.status);
        console.error("Response:", errorText);

        let errorMessage = `Failed to ${isPending ? "approve" : "update"}: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            const errors = Object.entries(errorJson.errors)
              .map(
                ([key, msgs]) =>
                  `${key}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
              )
              .join("; ");
            errorMessage = errors;
          } else if (errorJson.title) {
            errorMessage = errorJson.title;
          }
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("💥 Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isPending ? "approve request" : "update approved amount"}`,
      });
    }
  };

  const downloadExcelWithData = (
    dataToExport: InternalFundRequest[],
    tabName: string,
  ) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No data available to export",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(tabName);

      const headers = [
        "Job Number",
        "Head of Account",
        "Beneficiary",
        "Requested Amount",
        "Approved Amount",
        "Status",
        "Created On",
      ];
      worksheet.addRow(headers);

      dataToExport.forEach((request) => {
        const row = [
          request.jobNumber || "",
          request.headOfAccount || "",
          request.beneficiary || "",
          request.requestedAmount || 0,
          request.approvedAmount || 0,
          request.approvalStatus || "",
          request.createdOn
            ? new Date(request.createdOn).toLocaleDateString()
            : "",
        ];
        worksheet.addRow(row);
      });

      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer]),
          `${tabName}_FundRequests_${moment().format("YYYY-MM-DD")}.xlsx`,
        );
      });

      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate Excel file",
      });
      console.error("Error generating Excel:", error);
    }
  };

  const downloadPDFWithData = (
    dataToExport: InternalFundRequest[],
    tabName: string,
  ) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No data available to export",
      });
      return;
    }

    try {
      const doc = new jsPDF("landscape");
      doc.setFontSize(16);
      doc.setTextColor(40, 116, 166);
      doc.text(`${tabName} - Internal Fund Requests Report`, 20, 20);

      const tableHeaders = [
        "Job No",
        "Head of Account",
        "Beneficiary",
        "Requested",
        "Approved",
        "Status",
      ];
      const tableData = dataToExport.map((item) => [
        item.jobNumber?.toString() || "N/A",
        item.headOfAccount || "N/A",
        item.beneficiary || "N/A",
        item.requestedAmount?.toString() || "0",
        item.approvedAmount?.toString() || "0",
        item.approvalStatus || "N/A",
      ]);

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 30,
        theme: "striped",
        headStyles: {
          fillColor: [40, 116, 166],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`${tabName}_FundRequests_${moment().format("YYYY-MM-DD")}.pdf`);
      toast({
        title: "Success",
        description: "PDF file downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF file",
      });
      console.error("Error generating PDF:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      case "PAID":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const columns: ColumnDef<InternalFundRequest>[] = [
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(row.original);
                  }}
                >
                  <FiEye size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>View Details</p>
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
      accessorKey: "jobNumber",
      header: "Job Number",
      cell: ({ row }) => (
        <div className='font-semibold text-sm text-gray-900'>
          <div>{row.original.jobNumber || "-"}</div>
          <div className='text-xs text-gray-500 mt-0.5'>
            {row.original.createdOn
              ? new Date(row.original.createdOn).toLocaleDateString()
              : "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "headOfAccount",
      header: "Head of Account",
      cell: ({ row }) => (
        <div className='text-sm text-gray-700'>
          {row.getValue("headOfAccount") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "beneficiary",
      header: "Beneficiary",
      cell: ({ row }) => (
        <div className='text-sm text-gray-700'>
          {row.getValue("beneficiary") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "requestedAmount",
      header: "Requested Amount",
      cell: ({ row }) => {
        const isEditingThis =
          editingRow === row.original.internalFundsRequestCashId;
        const isPending = row.original.approvalStatus === "PENDING";

        // Show input when editing this specific row and it's pending
        if (isEditingThis && isPending) {
          return (
            <div className='flex items-center gap-1'>
              <Input
                type='number'
                min='0'
                step='0.01'
                value={editAmount}
                onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInlineEdit(row.original, editAmount);
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingRow(null);
                  }
                }}
                className='h-7 text-xs w-28'
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onBlur={() => {
                  // Delay to allow button clicks to register
                  setTimeout(() => setEditingRow(null), 200);
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInlineEdit(row.original, editAmount);
                }}
                className='p-1 text-green-600 hover:text-green-800 flex-shrink-0'
                onMouseDown={(e) => e.preventDefault()}
                title='Approve'
              >
                <FiCheck size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRow(null);
                }}
                className='p-1 text-red-600 hover:text-red-800 flex-shrink-0'
                onMouseDown={(e) => e.preventDefault()}
                title='Cancel'
              >
                <FiX size={14} />
              </button>
            </div>
          );
        }

        // Show clickable amount for pending requests
        return (
          <div
            className={`text-sm font-medium text-gray-900 ${
              isPending
                ? "cursor-pointer hover:bg-yellow-50 rounded px-2 py-1 transition-colors border border-transparent hover:border-yellow-300"
                : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (isPending) {
                console.log(
                  "📝 Starting edit for PENDING request:",
                  row.original.internalFundsRequestCashId,
                );
                setEditingRow(row.original.internalFundsRequestCashId);
                setEditAmount(row.original.requestedAmount);
              }
            }}
            title={isPending ? "Click to approve with amount" : ""}
          >
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "PKR",
            }).format(row.getValue("requestedAmount") || 0)}
            {isPending && <FiEdit className='inline ml-1 h-3 w-3 opacity-50' />}
          </div>
        );
      },
    },
    {
      accessorKey: "approvedAmount",
      header: "Approved Amount",
      cell: ({ row }) => {
        const isEditingThis =
          editingRow === row.original.internalFundsRequestCashId;
        const isApproved = row.original.approvalStatus === "APPROVED";

        // Show input when editing this specific row and it's approved
        if (isEditingThis && isApproved) {
          return (
            <div className='flex items-center gap-1'>
              <Input
                type='number'
                min='0'
                step='0.01'
                value={editAmount}
                onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInlineEdit(row.original, editAmount);
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingRow(null);
                  }
                }}
                className='h-7 text-xs w-28'
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onBlur={() => {
                  setTimeout(() => setEditingRow(null), 200);
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInlineEdit(row.original, editAmount);
                }}
                className='p-1 text-green-600 hover:text-green-800 flex-shrink-0'
                onMouseDown={(e) => e.preventDefault()}
                title='Save'
              >
                <FiCheck size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRow(null);
                }}
                className='p-1 text-red-600 hover:text-red-800 flex-shrink-0'
                onMouseDown={(e) => e.preventDefault()}
                title='Cancel'
              >
                <FiX size={14} />
              </button>
            </div>
          );
        }

        // Show clickable amount for approved requests
        return (
          <div
            className={`text-sm font-medium ${
              isApproved
                ? "text-green-700 cursor-pointer hover:bg-green-50 rounded px-2 py-1 transition-colors border border-transparent hover:border-green-300"
                : "text-gray-400"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (isApproved && row.original.approvedAmount) {
                console.log(
                  "📝 Starting edit for APPROVED amount:",
                  row.original.internalFundsRequestCashId,
                );
                setEditingRow(row.original.internalFundsRequestCashId);
                setEditAmount(row.original.approvedAmount);
              }
            }}
            title={isApproved ? "Click to edit" : ""}
          >
            {row.original.approvedAmount ? (
              <>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                }).format(row.original.approvedAmount)}
                {isApproved && (
                  <FiEdit className='inline ml-1 h-3 w-3 opacity-50' />
                )}
              </>
            ) : (
              "-"
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "approvalStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("approvalStatus") as string;
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(
              status,
            )}`}
          >
            {status === "PENDING" && <FiClock className='mr-1 h-3 w-3' />}
            {status === "APPROVED" && (
              <FiCheckCircle className='mr-1 h-3 w-3' />
            )}
            {status === "REJECTED" && <FiXCircle className='mr-1 h-3 w-3' />}
            {status === "PAID" && <FiCheckCircle className='mr-1 h-3 w-3' />}
            {status}
          </span>
        );
      },
    },
  ];

  const ViewRequestDialog = () => {
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [enrichedRequest, setEnrichedRequest] = useState<any>(null);

    useEffect(() => {
      if (selectedRequestDetails && viewDialogOpen) {
        setDetailsLoading(true);
        cacheManager.prefetchDetails(selectedRequestDetails).then((details) => {
          setEnrichedRequest({
            ...selectedRequestDetails,
            ...details,
          });
          setDetailsLoading(false);
        });
      } else {
        setEnrichedRequest(null);
      }
    }, [selectedRequestDetails, viewDialogOpen]);

    return (
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent
          className='max-w-2xl max-h-[80vh] overflow-y-auto'
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' />
              Fund Request Details
            </DialogTitle>
            <DialogDescription>
              Details for Job {enrichedRequest?.jobNumber}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className='flex justify-center items-center py-8'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-sm text-gray-600'>Loading details...</p>
              </div>
            </div>
          ) : (
            enrichedRequest && (
              <div className='space-y-4'>
                <Card>
                  <CardHeader className='py-3 px-4'>
                    <CardTitle className='text-sm font-medium'>
                      Request Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 px-4 pb-3'>
                    <div className='space-y-1.5 text-xs'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Job Number:</span>
                        <span className='font-medium'>
                          {enrichedRequest.jobNumber}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Head of Account:</span>
                        <span className='font-medium'>
                          {enrichedRequest.headOfAccount}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Beneficiary:</span>
                        <span className='font-medium'>
                          {enrichedRequest.beneficiary}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Requested Amount:</span>
                        <span className='font-medium text-blue-700'>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "PKR",
                          }).format(enrichedRequest.requestedAmount || 0)}
                        </span>
                      </div>
                      {enrichedRequest.approvedAmount && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>
                            Approved Amount:
                          </span>
                          <span className='font-medium text-green-700'>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "PKR",
                            }).format(enrichedRequest.approvedAmount)}
                          </span>
                        </div>
                      )}
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Status:</span>
                        <span className='font-medium'>
                          {enrichedRequest.approvalStatus}
                        </span>
                      </div>
                      {enrichedRequest.approvedOn && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Approved On:</span>
                          <span className='font-medium'>
                            {new Date(
                              enrichedRequest.approvedOn,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Created On:</span>
                        <span className='font-medium'>
                          {new Date(
                            enrichedRequest.createdOn,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const RequestStatsPage = () => {
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
          >
            <FiDownload size={14} />
            Export Report
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          <Card className='border border-blue-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-blue-700 uppercase tracking-wide'>
                Total Requests
              </CardTitle>
              <div className='text-2xl font-bold text-blue-900 mt-1'>
                {stats.totalRequests}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>
                {stats.pendingRequests} pending • {stats.approvedRequests}{" "}
                approved
              </div>
            </CardContent>
          </Card>

          <Card className='border border-green-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-green-700 uppercase tracking-wide'>
                Total Requested
              </CardTitle>
              <div className='text-2xl font-bold text-green-900 mt-1'>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                  notation: "compact",
                }).format(stats.totalRequestedAmount)}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Sum of all requests</div>
            </CardContent>
          </Card>

          <Card className='border border-purple-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-purple-700 uppercase tracking-wide'>
                Total Approved
              </CardTitle>
              <div className='text-2xl font-bold text-purple-900 mt-1'>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                  notation: "compact",
                }).format(stats.totalApprovedAmount)}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Approved amount</div>
            </CardContent>
          </Card>

          <Card className='border border-yellow-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-yellow-700 uppercase tracking-wide'>
                Pending
              </CardTitle>
              <div className='text-2xl font-bold text-yellow-900 mt-1'>
                {stats.pendingRequests}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Awaiting approval</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const currentTabData = getCurrentTabData();

  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Internal Fund Request Approval (Cash)
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Approve and edit fund requests directly in the grid
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => fetchFundRequests(false)}
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
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='flex items-center gap-2 flex-1 w-full md:w-auto'>
              <div className='relative flex-1 max-w-md'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by Job No, Account...'
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
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                disabled={!currentTabData || currentTabData.length === 0}
              >
                <FiFilePlus className='h-3.5 w-3.5' />
                Export PDF
              </Button>
              <Button
                onClick={() => downloadExcelWithData(currentTabData, activeTab)}
                size='sm'
                className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                disabled={!currentTabData || currentTabData.length === 0}
              >
                <FiDownload className='h-3.5 w-3.5' />
                Export Excel
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
                <FiDollarSign className='w-3.5 h-3.5 mr-1.5' />
                All ({data.length})
              </TabsTrigger>
              <TabsTrigger
                value='PENDING'
                className='text-xs py-2 px-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiClock className='w-3.5 h-3.5 mr-1.5' />
                Pending ({getRequestStats.pendingRequests})
              </TabsTrigger>
              <TabsTrigger
                value='APPROVED'
                className='text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Approved ({getRequestStats.approvedRequests})
              </TabsTrigger>
              <TabsTrigger
                value='REJECTED'
                className='text-xs py-2 px-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiXCircle className='w-3.5 h-3.5 mr-1.5' />
                Rejected ({getRequestStats.rejectedRequests})
              </TabsTrigger>
              <TabsTrigger
                value='PAID'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Paid ({getRequestStats.paidRequests})
              </TabsTrigger>
              <TabsTrigger
                value='STATISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiFilePlus className='w-3.5 h-3.5 mr-1.5' />
                Statistics
              </TabsTrigger>
            </TabsList>
          </div>

          {["ALL_REQUESTS", "PENDING", "APPROVED", "REJECTED", "PAID"].map(
            (tab) => (
              <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
                <div className='bg-white rounded-lg shadow-sm border'>
                  {currentTabData.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16'>
                      <div className='text-center'>
                        <FiDollarSign className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                        <h3 className='text-base font-medium text-gray-900'>
                          No fund requests found
                        </h3>
                        <p className='mt-1 text-sm text-gray-500'>
                          {searchText || statusFilter !== "ALL"
                            ? "Try adjusting your search or filter terms"
                            : "No requests available for approval"}
                        </p>
                      </div>
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
