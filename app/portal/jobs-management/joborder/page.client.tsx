// app/job-order/page.tsx (or your main page file)

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
  FiBox,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiBriefcase,
  FiTruck,
  FiFilePlus as FiFilePlusIcon,
  FiToggleRight,
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
import JobForm from "@/components/job-order/JobOrderForm";
import { UpdateJobStatusDialog } from "@/components/job-order/statusupdatedialog/UpdateJobStatusDialog";

type JobMasterPageProps = {
  initialData?: any[];
};

type JobMaster = {
  jobId: number;
  companyId: number;
  jobNumber: string;
  jobDate?: string;
  operationType: string;
  operationMode?: string;
  jobDocumentType?: string;
  houseDocumentNumber?: string;
  houseDocumentDate?: string;
  masterDocumentNumber?: string;
  masterDocumentDate?: string;
  isFreightForwarding?: boolean;
  isClearance?: boolean;
  isTransporter?: boolean;
  isOther?: boolean;
  jobSubType?: string;
  jobLoadType?: string;
  freightType?: string;
  shipperPartyId?: number;
  consigneePartyId?: number;
  notifyParty1Id?: number;
  notifyParty2Id?: number;
  principalId?: number;
  overseasAgentId?: number;
  transporterPartyId?: number;
  depositorPartyId?: number;
  carrierPartyId?: number;
  terminalPartyId?: number;
  originPortId?: number;
  destinationPortId?: number;
  placeOfDeliveryId?: number;
  vesselName?: string;
  voyageNo?: string;
  grossWeight?: number;
  netWeight?: number;
  etdDate?: string;
  etaDate?: string;
  vesselArrival?: string;
  deliverDate?: string;
  freeDays?: number;
  lastFreeDay?: string;
  advanceRentPaidUpto?: string;
  dispatchAddress?: string;
  gdType?: string;
  originalDocsReceivedOn?: string;
  copyDocsReceivedOn?: string;
  jobDescription?: string;
  igmNumber?: string;
  indexNo?: string;
  blStatus?: string;
  insurance?: string;
  landing?: string;
  caseSubmittedToLineOn?: string;
  rentInvoiceIssuedOn?: string;
  refundBalanceReceivedOn?: string;
  status: string;
  remarks?: string;
  poReceivedOn?: string;
  poCustomDuty?: number;
  poWharfage?: number;
  poExciseDuty?: number;
  poDeliveryOrder?: number;
  poSecurityDeposite?: number;
  poSASAdvance?: number;
  jobInvoiceExchRate?: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  processOwnerId?: number;
};

// ─── Cache Manager ────────────────────────────────────────────────────────────

class CacheManager {
  private partyCache: Map<number, string> = new Map();
  private locationCache: Map<number, string> = new Map();
  private pendingPartyFetches: Map<number, Promise<string>> = new Map();
  private pendingLocationFetches: Map<number, Promise<string>> = new Map();

  async getPartyName(partyId: number | undefined): Promise<string> {
    if (!partyId) return "-";
    if (this.partyCache.has(partyId)) return this.partyCache.get(partyId)!;
    if (this.pendingPartyFetches.has(partyId))
      return this.pendingPartyFetches.get(partyId)!;
    const fetchPromise = this.fetchPartyName(partyId);
    this.pendingPartyFetches.set(partyId, fetchPromise);
    const result = await fetchPromise;
    this.pendingPartyFetches.delete(partyId);
    return result;
  }

  async getLocationName(locationId: number | undefined): Promise<string> {
    if (!locationId) return "-";
    if (this.locationCache.has(locationId))
      return this.locationCache.get(locationId)!;
    if (this.pendingLocationFetches.has(locationId))
      return this.pendingLocationFetches.get(locationId)!;
    const fetchPromise = this.fetchLocationName(locationId);
    this.pendingLocationFetches.set(locationId, fetchPromise);
    const result = await fetchPromise;
    this.pendingLocationFetches.delete(locationId);
    return result;
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

  private async fetchLocationName(locationId: number): Promise<string> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}UnLocation/${locationId}`);
      if (response.ok) {
        const data = await response.json();
        const locationName = data.uncode || data.locationName || "-";
        this.locationCache.set(locationId, locationName);
        return locationName;
      }
    } catch (err) {
      console.error(`Error fetching location ${locationId}:`, err);
    }
    return "-";
  }

  async prefetchDetails(job: JobMaster) {
    const [shipperName, consigneeName, originName, destinationName] =
      await Promise.all([
        this.getPartyName(job.shipperPartyId),
        this.getPartyName(job.consigneePartyId),
        this.getLocationName(job.originPortId),
        this.getLocationName(job.destinationPortId),
      ]);
    return { shipperName, consigneeName, originName, destinationName };
  }
}

const cacheManager = new CacheManager();

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function getBaseUrl() {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "";
  return b.endsWith("/") ? b : `${b}/`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JobOrderPage({ initialData }: JobMasterPageProps) {
  const [data, setData] = useState<JobMaster[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobMaster | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_JOBS");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] =
    useState<JobMaster | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [operationTypeFilter, setOperationTypeFilter] = useState("ALL");

  // ── Update Status Dialog state ────────────────────────────────────────────
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [jobForStatusUpdate, setJobForStatusUpdate] =
    useState<JobMaster | null>(null);

  const { toast } = useToast();

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "ON_HOLD", label: "On Hold" },
  ];

  const operationTypeOptions = [
    { value: "ALL", label: "All Types" },
    { value: "IMPORT", label: "Import" },
    { value: "EXPORT", label: "Export" },
    { value: "LOCAL", label: "Local" },
  ];

  const fetchJobOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}Job/GetList`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          select:
            "JobId, JobNumber, JobDate, OperationType, OperationMode, JobDocumentType, HouseDocumentNumber, MasterDocumentNumber, isFreightForwarding, isClearance, isTransporter, ShipperPartyId, ConsigneePartyId, OriginPortId, DestinationPortId, VesselName, VoyageNo, GrossWeight, NetWeight, EtdDate, EtaDate, Status, Remarks, CreatedAt, UpdatedAt, Version",
          where: "",
          search: "",
          sortOn: "JobId DESC",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const jobData = await response.json();
        setData(jobData);
        toast({
          title: "Success",
          description: `Loaded ${jobData.length} job orders`,
        });
      } else {
        throw new Error("Failed to fetch job orders");
      }
    } catch (error) {
      console.error("Error fetching job orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load job orders list",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!initialData) fetchJobOrders();
  }, [initialData, fetchJobOrders]);

  // ── Filter helpers ────────────────────────────────────────────────────────
  const searchInItem = (item: JobMaster, searchTerm: string) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return [
      item.jobNumber,
      item.vesselName,
      item.voyageNo,
      item.houseDocumentNumber,
      item.masterDocumentNumber,
      item.status,
    ]
      .filter(Boolean)
      .some((f) => f!.toLowerCase().includes(t));
  };

  const getCurrentTabData = () => {
    let tabData = data;
    switch (activeTab) {
      case "DRAFT":
        tabData = data.filter((i) => i.status === "DRAFT");
        break;
      case "ACTIVE":
        tabData = data.filter((i) => i.status === "ACTIVE");
        break;
      case "IN_PROGRESS":
        tabData = data.filter((i) => i.status === "IN_PROGRESS");
        break;
      case "COMPLETED":
        tabData = data.filter((i) => i.status === "COMPLETED");
        break;
      case "CANCELLED":
        tabData = data.filter((i) => i.status === "CANCELLED");
        break;
      case "IMPORT":
        tabData = data.filter((i) => i.operationType === "IMPORT");
        break;
      case "EXPORT":
        tabData = data.filter((i) => i.operationType === "EXPORT");
        break;
      case "LOCAL":
        tabData = data.filter((i) => i.operationType === "LOCAL");
        break;
    }
    tabData = tabData.filter((i) => searchInItem(i, searchText));
    if (activeTab === "ALL_JOBS") {
      if (statusFilter !== "ALL")
        tabData = tabData.filter((i) => i.status === statusFilter);
      if (operationTypeFilter !== "ALL")
        tabData = tabData.filter(
          (i) => i.operationType === operationTypeFilter,
        );
    }
    return tabData;
  };

  const getJobStats = useMemo(() => {
    return {
      totalJobs: data.length,
      draftJobs: data.filter((i) => i.status === "DRAFT").length,
      activeJobs: data.filter((i) => i.status === "ACTIVE").length,
      inProgressJobs: data.filter((i) => i.status === "IN_PROGRESS").length,
      completedJobs: data.filter((i) => i.status === "COMPLETED").length,
      cancelledJobs: data.filter((i) => i.status === "CANCELLED").length,
      importJobs: data.filter((i) => i.operationType === "IMPORT").length,
      exportJobs: data.filter((i) => i.operationType === "EXPORT").length,
      localJobs: data.filter((i) => i.operationType === "LOCAL").length,
      freightForwardingJobs: data.filter((i) => i.isFreightForwarding).length,
      clearanceJobs: data.filter((i) => i.isClearance).length,
      transporterJobs: data.filter((i) => i.isTransporter).length,
    };
  }, [data]);

  const handleAddEditComplete = () => {
    setShowForm(false);
    setSelectedJob(null);
    fetchJobOrders();
  };

  const handleDelete = async (item: JobMaster) => {
    if (!confirm(`Are you sure you want to delete Job "${item.jobNumber}"?`))
      return;
    try {
      const res = await fetch(`${getBaseUrl()}Job/${item.jobId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setData((prev) => prev.filter((r) => r.jobId !== item.jobId));
        toast({ title: "Deleted", description: "Job order deleted." });
      } else throw new Error();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job order",
      });
    }
  };

  const handleViewDetails = (job: JobMaster) => {
    setSelectedJobDetails(job);
    setViewDialogOpen(true);
  };

  // ── Status update success handler ──────────────────────────────────────────
  const handleStatusUpdateSuccess = (
    jobId: number,
    newStatus: string,
    remarks: string,
  ) => {
    setData((prev) =>
      prev.map((j) =>
        j.jobId === jobId
          ? {
              ...j,
              status: newStatus,
              remarks: remarks,
              updatedAt: new Date().toISOString(),
            }
          : j,
      ),
    );
    toast({
      title: "Status Updated",
      description: `Job status has been updated to "${newStatus}"`,
    });
  };

  // ── Export helpers ────────────────────────────────────────────────────────
  const downloadExcelWithData = (
    dataToExport: JobMaster[],
    tabName: string,
  ) => {
    if (!dataToExport?.length) {
      toast({ variant: "destructive", title: "No Data" });
      return;
    }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(tabName);
    ws.addRow([
      "Job Number",
      "Job Date",
      "Operation Type",
      "Vessel",
      "Voyage",
      "ETD",
      "ETA",
      "Status",
    ]);
    dataToExport.forEach((job) => {
      ws.addRow([
        job.jobNumber || "",
        job.jobDate ? new Date(job.jobDate).toLocaleDateString() : "",
        job.operationType || "",
        job.vesselName || "",
        job.voyageNo || "",
        job.etdDate ? new Date(job.etdDate).toLocaleDateString() : "",
        job.etaDate ? new Date(job.etaDate).toLocaleDateString() : "",
        job.status || "",
      ]);
    });
    ws.columns.forEach((c) => (c.width = 15));
    wb.xlsx.writeBuffer().then((buf) => {
      saveAs(
        new Blob([buf]),
        `${tabName}_Jobs_${moment().format("YYYY-MM-DD")}.xlsx`,
      );
    });
  };

  const downloadPDFWithData = (dataToExport: JobMaster[], tabName: string) => {
    if (!dataToExport?.length) {
      toast({ variant: "destructive", title: "No Data" });
      return;
    }
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.setTextColor(40, 116, 166);
    doc.text(`${tabName} - Job Orders Report`, 20, 20);
    autoTable(doc, {
      head: [["Job No", "Job Date", "Type", "Vessel", "ETD", "ETA", "Status"]],
      body: dataToExport.map((item) => [
        item.jobNumber || "N/A",
        item.jobDate ? new Date(item.jobDate).toLocaleDateString() : "N/A",
        item.operationType || "N/A",
        item.vesselName || "N/A",
        item.etdDate ? new Date(item.etdDate).toLocaleDateString() : "N/A",
        item.etaDate ? new Date(item.etaDate).toLocaleDateString() : "N/A",
        item.status || "N/A",
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
    doc.save(`${tabName}_Jobs_${moment().format("YYYY-MM-DD")}.pdf`);
  };

  // ── Badge helpers ─────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ACTIVE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getOperationTypeBadge = (operationType: string) => {
    switch (operationType) {
      case "IMPORT":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "EXPORT":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "LOCAL":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ColumnDef<JobMaster>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-1'>
          {/* View */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors'
                  onClick={() => handleViewDetails(row.original)}
                >
                  <FiEye size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>View Details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Edit */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors'
                  onClick={() => {
                    setSelectedJob(row.original);
                    setShowForm(true);
                  }}
                >
                  <FiEdit size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Edit Job</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Update Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors'
                  onClick={() => {
                    setJobForStatusUpdate(row.original);
                    setUpdateStatusDialogOpen(true);
                  }}
                >
                  <FiToggleRight size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Update Status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Delete */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-red-500 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors'
                  onClick={() => handleDelete(row.original)}
                >
                  <FiTrash2 size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Delete Job</p>
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
          <div>{row.getValue("jobNumber") || "-"}</div>
          <div className='text-xs text-gray-500 mt-0.5'>
            {row.original.jobDate
              ? new Date(row.original.jobDate).toLocaleDateString()
              : "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "operationType",
      header: "Operation",
      cell: ({ row }) => {
        const operationType = row.getValue("operationType") as string;
        return (
          <div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getOperationTypeBadge(operationType)}`}
            >
              {operationType}
            </span>
            {row.original.operationMode && (
              <div className='text-xs text-gray-500 mt-0.5'>
                {row.original.operationMode}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "services",
      header: "Services",
      cell: ({ row }) => (
        <div className='flex gap-1 flex-wrap'>
          {row.original.isFreightForwarding && (
            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700'>
              FF
            </span>
          )}
          {row.original.isClearance && (
            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700'>
              CL
            </span>
          )}
          {row.original.isTransporter && (
            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700'>
              TR
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "vesselVoyage",
      header: "Vessel / Voyage",
      cell: ({ row }) => (
        <div className='text-sm text-gray-700'>
          <div className='font-medium'>{row.original.vesselName || "-"}</div>
          {row.original.voyageNo && (
            <div className='text-xs text-gray-500 mt-0.5'>
              V: {row.original.voyageNo}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "schedule",
      header: "Schedule",
      cell: ({ row }) => (
        <div className='text-xs text-gray-700'>
          <div>
            ETD:{" "}
            {row.original.etdDate
              ? new Date(row.original.etdDate).toLocaleDateString()
              : "-"}
          </div>
          <div className='mt-0.5'>
            ETA:{" "}
            {row.original.etaDate
              ? new Date(row.original.etaDate).toLocaleDateString()
              : "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(status)}`}
          >
            {status === "DRAFT" && <FiClock className='h-3 w-3' />}
            {(status === "ACTIVE" || status === "COMPLETED") && (
              <FiCheckCircle className='h-3 w-3' />
            )}
            {status === "CANCELLED" && <FiAlertCircle className='h-3 w-3' />}
            {status}
          </span>
        );
      },
    },
  ];

  // ── View Dialog ───────────────────────────────────────────────────────────
  const ViewJobDialog = () => {
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [enrichedJob, setEnrichedJob] = useState<any>(null);

    useEffect(() => {
      if (selectedJobDetails && viewDialogOpen) {
        setDetailsLoading(true);
        cacheManager.prefetchDetails(selectedJobDetails).then((details) => {
          setEnrichedJob({ ...selectedJobDetails, ...details });
          setDetailsLoading(false);
        });
      } else {
        setEnrichedJob(null);
      }
    }, [selectedJobDetails, viewDialogOpen]);

    return (
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' />
              Job Order Details
            </DialogTitle>
            <DialogDescription>
              Details for Job {selectedJobDetails?.jobNumber}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className='flex justify-center items-center py-8'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4' />
                <p className='text-sm text-gray-600'>Loading details...</p>
              </div>
            </div>
          ) : (
            enrichedJob && (
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <Card>
                    <CardHeader className='py-3 px-4'>
                      <CardTitle className='text-sm font-medium'>
                        Job Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-0 px-4 pb-3'>
                      <div className='space-y-1.5 text-xs'>
                        {[
                          ["Job Number", enrichedJob.jobNumber],
                          [
                            "Job Date",
                            enrichedJob.jobDate
                              ? new Date(
                                  enrichedJob.jobDate,
                                ).toLocaleDateString()
                              : "-",
                          ],
                          ["Operation Type", enrichedJob.operationType],
                          ["Status", enrichedJob.status],
                        ].map(([label, val]) => (
                          <div key={label} className='flex justify-between'>
                            <span className='text-gray-600'>{label}:</span>
                            <span className='font-medium'>{val}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='py-3 px-4'>
                      <CardTitle className='text-sm font-medium'>
                        Routing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-0 px-4 pb-3'>
                      <div className='space-y-1.5 text-xs'>
                        {[
                          ["Origin", enrichedJob.originName],
                          ["Destination", enrichedJob.destinationName],
                          ["Vessel", enrichedJob.vesselName || "-"],
                          ["Voyage", enrichedJob.voyageNo || "-"],
                        ].map(([label, val]) => (
                          <div key={label} className='flex justify-between'>
                            <span className='text-gray-600'>{label}:</span>
                            <span className='font-medium'>{val}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader className='py-3 px-4'>
                    <CardTitle className='text-sm font-medium'>
                      Parties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 px-4 pb-3'>
                    <div className='grid grid-cols-2 gap-4 text-xs'>
                      <div>
                        <span className='text-gray-600'>Shipper: </span>
                        <span className='font-medium'>
                          {enrichedJob.shipperName}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-600'>Consignee: </span>
                        <span className='font-medium'>
                          {enrichedJob.consigneeName}
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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const JobStatsPage = () => {
    const stats = getJobStats;
    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Job Statistics
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
              label: "Total Jobs",
              val: stats.totalJobs,
              sub: `${stats.activeJobs} active • ${stats.draftJobs} draft`,
              color: "blue",
            },
            {
              label: "Completed",
              val: stats.completedJobs,
              sub: `${stats.inProgressJobs} in progress`,
              color: "green",
            },
            {
              label: "Import Jobs",
              val: stats.importJobs,
              sub: "Inbound shipments",
              color: "purple",
            },
            {
              label: "Export Jobs",
              val: stats.exportJobs,
              sub: "Outbound shipments",
              color: "indigo",
            },
          ].map(({ label, val, sub, color }) => (
            <Card
              key={label}
              className={`border border-${color}-200 shadow-sm`}
            >
              <CardHeader className='pb-2 pt-3 px-4'>
                <CardTitle
                  className={`text-xs font-medium text-${color}-700 uppercase tracking-wide`}
                >
                  {label}
                </CardTitle>
                <div className={`text-2xl font-bold text-${color}-900 mt-1`}>
                  {val}
                </div>
              </CardHeader>
              <CardContent className='pt-0 pb-3 px-4'>
                <div className='text-xs text-gray-600'>{sub}</div>
              </CardContent>
            </Card>
          ))}
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
              setSelectedJob(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Job List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <JobForm
              type={selectedJob ? "edit" : "add"}
              defaultState={selectedJob || {}}
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
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Job Order Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Manage job orders with complete tracking
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={fetchJobOrders}
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
                setSelectedJob(null);
                setShowForm(true);
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' /> Add New Job
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='flex items-center gap-2 flex-1 w-full md:w-auto'>
              <div className='relative flex-1 max-w-md'>
                <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by Job No, Vessel...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-9 pr-9 py-1.5 text-sm h-9'
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText("")}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    <FiX className='h-4 w-4' />
                  </button>
                )}
              </div>
              {activeTab === "ALL_JOBS" && (
                <>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-[150px] h-9 text-sm'>
                      <SelectValue placeholder='Filter by status' />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={operationTypeFilter}
                    onValueChange={setOperationTypeFilter}
                  >
                    <SelectTrigger className='w-[150px] h-9 text-sm'>
                      <SelectValue placeholder='Filter by type' />
                    </SelectTrigger>
                    <SelectContent>
                      {operationTypeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={() => downloadPDFWithData(currentTabData, activeTab)}
                size='sm'
                className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs'
                disabled={!currentTabData?.length}
              >
                <FiFilePlusIcon className='h-3.5 w-3.5' /> Export PDF
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

        {/* Tabs */}
        <Tabs
          defaultValue='ALL_JOBS'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='grid w-full grid-cols-9 gap-1 bg-transparent h-auto p-0'>
              {[
                {
                  value: "ALL_JOBS",
                  label: `All (${data.length})`,
                  icon: <FiBriefcase className='w-3.5 h-3.5 mr-1' />,
                  active: "blue",
                },
                {
                  value: "DRAFT",
                  label: `Draft (${getJobStats.draftJobs})`,
                  icon: <FiClock className='w-3.5 h-3.5 mr-1' />,
                  active: "gray",
                },
                {
                  value: "ACTIVE",
                  label: `Active (${getJobStats.activeJobs})`,
                  icon: <FiCheckCircle className='w-3.5 h-3.5 mr-1' />,
                  active: "blue",
                },
                {
                  value: "COMPLETED",
                  label: `Done (${getJobStats.completedJobs})`,
                  icon: <FiCheckCircle className='w-3.5 h-3.5 mr-1' />,
                  active: "green",
                },
                {
                  value: "CANCELLED",
                  label: `Cancelled (${getJobStats.cancelledJobs})`,
                  icon: <FiAlertCircle className='w-3.5 h-3.5 mr-1' />,
                  active: "red",
                },
                {
                  value: "IMPORT",
                  label: `Import (${getJobStats.importJobs})`,
                  icon: <FiTruck className='w-3.5 h-3.5 mr-1' />,
                  active: "purple",
                },
                {
                  value: "EXPORT",
                  label: `Export (${getJobStats.exportJobs})`,
                  icon: <FiTruck className='w-3.5 h-3.5 mr-1' />,
                  active: "indigo",
                },
                {
                  value: "LOCAL",
                  label: `Local (${getJobStats.localJobs})`,
                  icon: <FiBox className='w-3.5 h-3.5 mr-1' />,
                  active: "teal",
                },
                {
                  value: "STATISTICS",
                  label: "Stats",
                  icon: <FiFilePlusIcon className='w-3.5 h-3.5 mr-1' />,
                  active: "orange",
                },
              ].map(({ value, label, icon, active }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={`text-xs py-2 px-2 data-[state=active]:bg-${active}-50 data-[state=active]:text-${active}-700 data-[state=active]:shadow-none rounded-md`}
                >
                  {icon}
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {[
            "ALL_JOBS",
            "DRAFT",
            "ACTIVE",
            "COMPLETED",
            "CANCELLED",
            "IMPORT",
            "EXPORT",
            "LOCAL",
          ].map((tab) => (
            <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
              <div className='bg-white rounded-lg shadow-sm border'>
                {currentTabData.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16'>
                    <FiBriefcase className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                    <h3 className='text-base font-medium text-gray-900'>
                      No job orders found
                    </h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      {searchText ||
                      statusFilter !== "ALL" ||
                      operationTypeFilter !== "ALL"
                        ? "Try adjusting your search or filter terms"
                        : "Add your first job order using the button above"}
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
              <JobStatsPage />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isLoading && <AppLoader />}

      {/* Dialogs */}
      <ViewJobDialog />

      {/* Update Status Dialog */}
      <UpdateJobStatusDialog
        open={updateStatusDialogOpen}
        job={jobForStatusUpdate}
        onClose={() => {
          setUpdateStatusDialogOpen(false);
          setJobForStatusUpdate(null);
        }}
        onSuccess={handleStatusUpdateSuccess}
        apiBaseUrl={process.env.NEXT_PUBLIC_BASE_URL}
      />
    </div>
  );
}
