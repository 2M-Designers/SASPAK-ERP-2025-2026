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
import InternalFundRequestForm from "@/views/forms/internal-fund-request/InternalFundRequestForm_MasterDetail";

type InternalFundRequestPageProps = {
  initialData?: any[];
};

// MASTER-DETAIL TYPES
type CashFundRequest = {
  cashFundRequestId: number;
  jobId: number;
  jobNumber?: string;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  approvalStatus: string;
  approvedBy?: number;
  approvedOn?: string;
  requestedTo?: number;
  createdOn: string;
  createdBy?: number;
  version: number;
  internalCashFundsRequests: DetailLineItem[];
};

type DetailLineItem = {
  internalFundsRequestCashId: number;
  jobId: number;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount: string;
  beneficiary: string;
  requestedAmount: number;
  approvedAmount: number;
  cashFundRequestMasterId: number;
  chargesId: number;
  version: number;
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
}

const cacheManager = new CacheManager();

export default function InternalFundRequestPage({
  initialData,
}: InternalFundRequestPageProps) {
  const [data, setData] = useState<CashFundRequest[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<CashFundRequest | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_REQUESTS");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<CashFundRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { toast } = useToast();

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PAID", label: "Paid" },
  ];

  const fetchFundRequests = useCallback(async () => {
    console.log("🔄 Fetching master fund requests...");
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // Fetch from MASTER endpoint
      const url = `${baseUrl}InternalCashFundsRequest/GetList`;
      console.log(`📡 Calling master endpoint: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "cashFundRequestId,jobId,TotalRequestedAmount,TotalApprovedAmount,ApprovalStatus,ApprovedBy,ApprovedOn,RequestedTo,CreatedOn,CreatedBy,version",
          where: "",
          sortOn: "cashFundRequestId DESC",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const requestData = await response.json();
        console.log(`✅ Loaded ${requestData.length} master fund requests`);
        console.log("Sample data:", requestData.slice(0, 2));

        setData(requestData);

        toast({
          title: "Success",
          description: `Loaded ${requestData.length} fund request(s)`,
        });
      } else {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    } catch (error) {
      console.error("❌ Error fetching master fund requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load fund requests list",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch complete request details by ID for editing
  const fetchRequestDetails = async (
    id: number,
  ): Promise<CashFundRequest | null> => {
    console.log(`🔍 Fetching full details for request ID: ${id}`);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const url = `${baseUrl}InternalCashFundsRequest/${id}`;
      console.log(`📡 GET ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const fullData = await response.json();
        console.log("✅ Full request data loaded:");
        console.log("Master:", {
          id: fullData.cashFundRequestId,
          jobId: fullData.jobId,
          jobNumber: fullData.job?.jobNumber,
        });
        console.log(
          "Details count:",
          fullData.internalCashFundsRequests?.length || 0,
        );
        console.log("Details:", fullData.internalCashFundsRequests);

        // Add jobNumber from nested job object if not present
        if (fullData.job?.jobNumber && !fullData.jobNumber) {
          fullData.jobNumber = fullData.job.jobNumber;
        }

        return fullData;
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load request details",
      });
      return null;
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchFundRequests();
    }
  }, [initialData, fetchFundRequests]);

  const searchInItem = (item: CashFundRequest, searchTerm: string) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();

    const searchableFields = [
      item.jobNumber,
      item.approvalStatus,
      item.totalRequestedAmount?.toString(),
      item.cashFundRequestId?.toString(),
      // Also search in detail items
      ...(item.internalCashFundsRequests || []).flatMap((detail) => [
        detail.headOfAccount,
        detail.beneficiary,
      ]),
    ].filter(Boolean) as string[];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(searchLower),
    );
  };

  const filterByStatus = (request: CashFundRequest) => {
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
        (sum, item) => sum + (item.totalRequestedAmount || 0),
        0,
      ),
      totalApprovedAmount: allRequests.reduce(
        (sum, item) => sum + (item.totalApprovedAmount || 0),
        0,
      ),
      totalLineItems: allRequests.reduce(
        (sum, item) => sum + (item.internalCashFundsRequests?.length || 0),
        0,
      ),
    };
  }, [data]);

  const handleAddEditComplete = (updatedItem: any) => {
    setShowForm(false);
    setSelectedRequest(null);
    fetchFundRequests();
  };

  const handleDelete = async (item: CashFundRequest) => {
    const lineItemCount = item.internalCashFundsRequests?.length || 0;
    if (
      confirm(
        `Are you sure you want to delete this fund request for Job "${item.jobNumber}"? This will delete the master record and all ${lineItemCount} line item(s).`,
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        // Delete master record (should cascade to details)
        const response = await fetch(
          `${baseUrl}InternalCashFundsRequest/${item.cashFundRequestId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          setData((prev) =>
            prev.filter(
              (record) => record.cashFundRequestId !== item.cashFundRequestId,
            ),
          );
          toast({
            title: "Success",
            description: `Fund request deleted successfully (${lineItemCount} line items removed)`,
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

  const handleViewDetails = async (request: CashFundRequest) => {
    setSelectedRequestDetails(request);
    setViewDialogOpen(true);
  };

  const downloadExcelWithData = (
    dataToExport: CashFundRequest[],
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
        "Request ID",
        "Job Number",
        "Line Items",
        "Total Requested",
        "Total Approved",
        "Status",
        "Created On",
      ];
      worksheet.addRow(headers);

      dataToExport.forEach((request) => {
        const row = [
          request.cashFundRequestId || "",
          request.jobNumber || "",
          request.internalCashFundsRequests?.length || 0,
          request.totalRequestedAmount || 0,
          request.totalApprovedAmount || 0,
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
    dataToExport: CashFundRequest[],
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
        "Request ID",
        "Job No",
        "Items",
        "Requested",
        "Approved",
        "Status",
      ];
      const tableData = dataToExport.map((item) => [
        item.cashFundRequestId?.toString() || "N/A",
        item.jobNumber?.toString() || "N/A",
        item.internalCashFundsRequests?.length.toString() || "0",
        item.totalRequestedAmount?.toString() || "0",
        item.totalApprovedAmount?.toString() || "0",
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

  const columns: ColumnDef<CashFundRequest>[] = [
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors'
                  onClick={async () => {
                    console.log("=== EDIT BUTTON CLICKED ===");
                    console.log("Request ID:", row.original.cashFundRequestId);

                    // Fetch full details with nested line items
                    const fullDetails = await fetchRequestDetails(
                      row.original.cashFundRequestId,
                    );

                    if (fullDetails) {
                      console.log(
                        "Full details loaded with",
                        fullDetails.internalCashFundsRequests?.length || 0,
                        "line items",
                      );
                      setSelectedRequest(fullDetails);
                      setShowForm(true);
                    } else {
                      console.error("Failed to load full details");
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
      accessorKey: "cashFundRequestId",
      header: "Request ID",
      cell: ({ row }) => (
        <div className='font-semibold text-sm text-blue-700'>
          #{row.original.cashFundRequestId}
        </div>
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
      accessorKey: "lineItems",
      header: "Line Items",
      cell: ({ row }) => {
        const count = row.original.internalCashFundsRequests?.length || 0;
        return (
          <Badge variant='outline' className='flex items-center gap-1 w-fit'>
            <FiList className='h-3 w-3' />
            {count} item{count !== 1 ? "s" : ""}
          </Badge>
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
    return (
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' />
              Fund Request Details
            </DialogTitle>
            <DialogDescription>
              Request ID: #{selectedRequestDetails?.cashFundRequestId} | Job:{" "}
              {selectedRequestDetails?.jobNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedRequestDetails && (
            <div className='space-y-4'>
              {/* Master Information */}
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
                      <span className='text-gray-600'>Job Number:</span>
                      <span className='font-medium'>
                        {selectedRequestDetails.jobNumber}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Total Requested:</span>
                      <span className='font-medium text-blue-700'>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "PKR",
                        }).format(
                          selectedRequestDetails.totalRequestedAmount || 0,
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Total Approved:</span>
                      <span className='font-medium text-green-700'>
                        {selectedRequestDetails.totalApprovedAmount
                          ? new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "PKR",
                            }).format(
                              selectedRequestDetails.totalApprovedAmount,
                            )
                          : "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Status:</span>
                      <span
                        className={`font-medium inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStatusBadge(
                          selectedRequestDetails.approvalStatus,
                        )}`}
                      >
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
                          {new Date(
                            selectedRequestDetails.approvedOn,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Created On:</span>
                      <span className='font-medium'>
                        {new Date(
                          selectedRequestDetails.createdOn,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detail Line Items */}
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
                  {selectedRequestDetails.internalCashFundsRequests &&
                  selectedRequestDetails.internalCashFundsRequests.length >
                    0 ? (
                    <div className='border rounded-lg overflow-hidden'>
                      <Table>
                        <TableHeader>
                          <TableRow className='bg-gray-50'>
                            <TableHead className='w-[50px]'>#</TableHead>
                            <TableHead>Head of Account</TableHead>
                            <TableHead>Beneficiary</TableHead>
                            <TableHead>Requested</TableHead>
                            <TableHead>Approved</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRequestDetails.internalCashFundsRequests.map(
                            (detail, index) => (
                              <TableRow key={detail.internalFundsRequestCashId}>
                                <TableCell className='font-medium'>
                                  {index + 1}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {detail.headOfAccount}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {detail.beneficiary}
                                </TableCell>
                                <TableCell className='text-sm font-medium'>
                                  {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "PKR",
                                  }).format(detail.requestedAmount || 0)}
                                </TableCell>
                                <TableCell className='text-sm font-medium text-green-700'>
                                  {detail.approvedAmount
                                    ? new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "PKR",
                                      }).format(detail.approvedAmount)
                                    : "-"}
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
                {stats.totalLineItems} line items • {stats.pendingRequests}{" "}
                pending
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
            <FiArrowLeft className='h-3.5 w-3.5' />
            Back to Request List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <InternalFundRequestForm
              type={selectedRequest ? "edit" : "add"}
              defaultState={selectedRequest || {}}
              handleAddEdit={handleAddEditComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  const currentTabData = getCurrentTabData();

  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Internal Fund Request Management (Cash)
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Master-detail fund requests with complete tracking
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
              <FiFilePlus className='h-3.5 w-3.5' />
              Add New Request
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
                            : "Add your first fund request using the button above"}
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
