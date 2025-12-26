"use client";

import { useState, useEffect } from "react";
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
  FiPackage,
  FiBox,
  FiPrinter,
  FiEye,
  FiCopy,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiBriefcase,
  FiTruck,
  FiDollarSign,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
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
import JobForm from "@/views/forms/job-order-forms/job-order-form-complete";

type JobMasterPageProps = {
  initialData?: any[];
};

// Job Master type with ALL fields
type JobMaster = {
  jobId: number;
  companyId: number;
  jobNumber: string;
  operationType: string;
  jobSubType: string;
  fclLclType?: string;
  partyId: number;
  shipperPartyId?: number;
  consigneePartyId?: number;
  notifyParty1Id?: number;
  notifyParty2Id?: number;
  principalId?: number;
  overseasAgentId?: number;
  transporterPartyId?: number;
  depositorPartyId?: number;
  originPortId?: number;
  destinationPortId?: number;
  vesselName?: string;
  voyageNo?: string;
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
  lcNumber?: string;
  igmNumber?: string;
  hblNumber?: string;
  mawbNumber?: string;
  hawbNumber?: string;
  status: string;
  remarks?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  // Display names
  partyName?: string;
  shipperName?: string;
  consigneeName?: string;
  notifyParty1Name?: string;
  notifyParty2Name?: string;
  principalName?: string;
  overseasAgentName?: string;
  transporterName?: string;
  depositorName?: string;
  originPortName?: string;
  destinationPortName?: string;
  equipments?: JobEquipment[];
  commodities?: JobCommodity[];
  charges?: JobCharge[];
};

// Job Equipment type with ALL fields
type JobEquipment = {
  jobEquipmentId: number;
  companyId: number;
  jobId: number;
  containerNo: string;
  containerTypeId?: number;
  containerSizeId?: number;
  sealNo?: string;
  tareWeight?: number;
  eirReceivedOn?: string;
  rentInvoiceIssuedOn?: string;
  containerRentFC?: number;
  containerRentLC?: number;
  damageDirtyFC?: number;
  damageDirtyLC?: number;
  refundAppliedOn?: string;
  refundFC?: number;
  refundLC?: number;
  gateOutDate?: string;
  gateInDate?: string;
  eirSubmitted?: boolean;
  eirDocumentId?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  containerTypeName?: string;
  containerSizeName?: string;
};

// Job Commodity type with ALL fields
type JobCommodity = {
  jobCommodityId: number;
  companyId: number;
  jobId: number;
  description: string;
  hsCodeId?: number;
  grossWeight?: number;
  netWeight?: number;
  volumeCbm?: number;
  declaredValueFC?: number;
  declaredValueLC?: number;
  currencyId?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  hsCode?: string;
  currencyName?: string;
};

// Job Charge type with ALL fields
type JobCharge = {
  jobChargeId: number;
  companyId: number;
  jobId: number;
  chargeId: number;
  chargeBasis?: string;
  jobEquipmentId?: number;
  currencyId?: number;
  exchangeRate?: number;
  priceFC?: number;
  priceLC?: number;
  amountFC?: number;
  amountLC?: number;
  taxPercentage?: number;
  taxFC?: number;
  taxLC?: number;
  isReimbursable?: boolean;
  isVendorCost?: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  chargeName?: string;
  currencyName?: string;
};

// Field configuration for Job Master
const jobFieldConfig = [
  {
    fieldName: "jobId",
    displayName: "Job ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "companyId",
    displayName: "Company ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "jobNumber",
    displayName: "Job Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "operationType",
    displayName: "Operation Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "jobSubType",
    displayName: "Job Sub Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "fclLclType",
    displayName: "FCL/LCL Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "partyId",
    displayName: "Party ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "partyName",
    displayName: "Party",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "shipperName",
    displayName: "Shipper",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "consigneeName",
    displayName: "Consignee",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "originPortName",
    displayName: "Origin",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "destinationPortName",
    displayName: "Destination",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "vesselName",
    displayName: "Vessel Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "voyageNo",
    displayName: "Voyage No",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "etdDate",
    displayName: "ETD",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "etaDate",
    displayName: "ETA",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "status",
    displayName: "Status",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "createdAt",
    displayName: "Created At",
    isdisplayed: true,
    isselected: true,
  },
];

export default function JobOrderPage({ initialData }: JobMasterPageProps) {
  const [data, setData] = useState<JobMaster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobMaster | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_JOBS");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] =
    useState<JobMaster | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [operationTypeFilter, setOperationTypeFilter] = useState("ALL");
  const router = useRouter();
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

  // Fetch Job data with ALL fields
  const fetchJobOrders = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Job/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "JobId,CompanyId,JobNumber,OperationType,JobSubType,FclLclType,PartyId,ShipperPartyId,ConsigneePartyId,NotifyParty1Id,NotifyParty2Id,PrincipalId,OverseasAgentId,TransporterPartyId,DepositorPartyId,OriginPortId,DestinationPortId,VesselName,VoyageNo,EtdDate,EtaDate,VesselArrival,DeliverDate,FreeDays,LastFreeDay,AdvanceRentPaidUpto,DispatchAddress,GdType,OriginalDocsReceivedOn,CopyDocsReceivedOn,JobDescription,LcNumber,IgmNumber,HblNumber,MawbNumber,HawbNumber,Status,Remarks,CreatedBy,CreatedAt,UpdatedAt,Version",
          where: "",
          sortOn: "CreatedAt DESC",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const jobData = await response.json();

        const enrichedData = await Promise.all(
          jobData.map(async (job: JobMaster) => {
            try {
              // Fetch party details
              const fetchParty = async (partyId: number) => {
                if (!partyId) return null;
                try {
                  const response = await fetch(`${baseUrl}Party/${partyId}`);
                  return response.ok ? await response.json() : null;
                } catch (err) {
                  console.error(`Error fetching party ${partyId}:`, err);
                  return null;
                }
              };

              const [
                partyData,
                shipperData,
                consigneeData,
                notifyParty1Data,
                notifyParty2Data,
                principalData,
                overseasAgentData,
                transporterData,
                depositorData,
              ] = await Promise.all([
                fetchParty(job.partyId),
                job.shipperPartyId
                  ? fetchParty(job.shipperPartyId)
                  : Promise.resolve(null),
                job.consigneePartyId
                  ? fetchParty(job.consigneePartyId)
                  : Promise.resolve(null),
                job.notifyParty1Id
                  ? fetchParty(job.notifyParty1Id)
                  : Promise.resolve(null),
                job.notifyParty2Id
                  ? fetchParty(job.notifyParty2Id)
                  : Promise.resolve(null),
                job.principalId
                  ? fetchParty(job.principalId)
                  : Promise.resolve(null),
                job.overseasAgentId
                  ? fetchParty(job.overseasAgentId)
                  : Promise.resolve(null),
                job.transporterPartyId
                  ? fetchParty(job.transporterPartyId)
                  : Promise.resolve(null),
                job.depositorPartyId
                  ? fetchParty(job.depositorPartyId)
                  : Promise.resolve(null),
              ]);

              // Fetch port/location details
              const fetchLocation = async (locationId: number) => {
                if (!locationId) return null;
                try {
                  const response = await fetch(
                    `${baseUrl}UnLocation/${locationId}`
                  );
                  return response.ok ? await response.json() : null;
                } catch (err) {
                  console.error(`Error fetching location ${locationId}:`, err);
                  return null;
                }
              };

              const [originPortData, destinationPortData] = await Promise.all([
                job.originPortId
                  ? fetchLocation(job.originPortId)
                  : Promise.resolve(null),
                job.destinationPortId
                  ? fetchLocation(job.destinationPortId)
                  : Promise.resolve(null),
              ]);

              // Child records will be loaded on-demand when viewing details
              let equipments: JobEquipment[] = [];
              let commodities: JobCommodity[] = [];
              let charges: JobCharge[] = [];

              return {
                ...job,
                partyName: partyData?.partyName || "N/A",
                shipperName: shipperData?.partyName || null,
                consigneeName: consigneeData?.partyName || null,
                notifyParty1Name: notifyParty1Data?.partyName || null,
                notifyParty2Name: notifyParty2Data?.partyName || null,
                principalName: principalData?.partyName || null,
                overseasAgentName: overseasAgentData?.partyName || null,
                transporterName: transporterData?.partyName || null,
                depositorName: depositorData?.partyName || null,
                originPortName: originPortData
                  ? `${originPortData.uncode} - ${originPortData.locationName}`
                  : null,
                destinationPortName: destinationPortData
                  ? `${destinationPortData.uncode} - ${destinationPortData.locationName}`
                  : null,
                equipments,
                commodities,
                charges,
              };
            } catch (error) {
              console.error(`Error enriching Job ${job.jobId}:`, error);
              return job;
            }
          })
        );

        setData(enrichedData);
        toast({
          title: "Success",
          description: "Job orders loaded successfully",
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
  };

  useEffect(() => {
    fetchJobOrders();
  }, []);

  const searchInItem = (item: JobMaster, searchTerm: string) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const searchableFields = [
      item.jobNumber?.toString(),
      item.partyName?.toString(),
      item.shipperName?.toString(),
      item.consigneeName?.toString(),
      item.vesselName?.toString(),
      item.voyageNo?.toString(),
      item.igmNumber?.toString(),
      item.hblNumber?.toString(),
      item.mawbNumber?.toString(),
      item.status?.toString(),
    ];
    return searchableFields.some(
      (field) => field && field.toLowerCase().includes(searchLower)
    );
  };

  const filterByStatus = (job: JobMaster) => {
    if (statusFilter === "ALL") return true;
    return job.status === statusFilter;
  };

  const filterByOperationType = (job: JobMaster) => {
    if (operationTypeFilter === "ALL") return true;
    return job.operationType === operationTypeFilter;
  };

  const getCurrentTabData = () => {
    let tabData = data;

    switch (activeTab) {
      case "DRAFT":
        tabData = data.filter((item) => item.status === "DRAFT");
        break;
      case "ACTIVE":
        tabData = data.filter((item) => item.status === "ACTIVE");
        break;
      case "IN_PROGRESS":
        tabData = data.filter((item) => item.status === "IN_PROGRESS");
        break;
      case "COMPLETED":
        tabData = data.filter((item) => item.status === "COMPLETED");
        break;
      case "CANCELLED":
        tabData = data.filter((item) => item.status === "CANCELLED");
        break;
      case "IMPORT":
        tabData = data.filter((item) => item.operationType === "IMPORT");
        break;
      case "EXPORT":
        tabData = data.filter((item) => item.operationType === "EXPORT");
        break;
      case "LOCAL":
        tabData = data.filter((item) => item.operationType === "LOCAL");
        break;
    }

    tabData = tabData.filter((item) => searchInItem(item, searchText));

    if (activeTab === "ALL_JOBS") {
      tabData = tabData.filter(filterByStatus).filter(filterByOperationType);
    }

    return tabData;
  };

  const getJobStats = () => {
    const allJobs = data;
    return {
      totalJobs: allJobs.length,
      draftJobs: allJobs.filter((item) => item.status === "DRAFT").length,
      activeJobs: allJobs.filter((item) => item.status === "ACTIVE").length,
      inProgressJobs: allJobs.filter((item) => item.status === "IN_PROGRESS")
        .length,
      completedJobs: allJobs.filter((item) => item.status === "COMPLETED")
        .length,
      cancelledJobs: allJobs.filter((item) => item.status === "CANCELLED")
        .length,
      importJobs: allJobs.filter((item) => item.operationType === "IMPORT")
        .length,
      exportJobs: allJobs.filter((item) => item.operationType === "EXPORT")
        .length,
      localJobs: allJobs.filter((item) => item.operationType === "LOCAL")
        .length,
    };
  };

  const handleAddEditComplete = (updatedItem: any) => {
    setShowForm(false);
    setSelectedJob(null);
    fetchJobOrders();
  };

  const handleDelete = async (item: JobMaster) => {
    if (confirm(`Are you sure you want to delete Job "${item.jobNumber}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Job/${item.jobId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev) =>
            prev.filter((record) => record.jobId !== item.jobId)
          );
          toast({
            title: "Success",
            description: "Job order deleted successfully",
          });
        } else {
          throw new Error("Failed to delete Job order");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete Job order",
        });
        console.error("Error deleting Job order:", error);
      }
    }
  };

  const handleViewDetails = (job: JobMaster) => {
    setSelectedJobDetails(job);
    setViewDialogOpen(true);
  };

  const handleDuplicate = (job: JobMaster) => {
    const duplicateJob = {
      ...job,
      jobId: 0,
      jobNumber: `${job.jobNumber}-COPY`,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedJob(duplicateJob);
    setShowForm(true);
  };

  const downloadExcelWithData = (
    dataToExport: JobMaster[],
    tabName: string
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

      const headers = jobFieldConfig
        .filter((field) => field.isdisplayed && field.isselected)
        .map((field) => field.displayName);
      worksheet.addRow(headers);

      dataToExport.forEach((job) => {
        const row = jobFieldConfig
          .filter((field) => field.isdisplayed && field.isselected)
          .map((field) => {
            const value = (job as any)[field.fieldName];

            if (
              field.fieldName === "etdDate" ||
              field.fieldName === "etaDate" ||
              field.fieldName === "createdAt"
            ) {
              return value ? new Date(value).toLocaleDateString() : "";
            }

            return value || "";
          });
        worksheet.addRow(row);
      });

      worksheet.columns = worksheet.columns.map((column) => ({
        ...column,
        width: 15,
      }));

      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer]),
          `${tabName}_JobOrders_${moment().format("YYYY-MM-DD")}.xlsx`
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

  const downloadPDFWithData = (dataToExport: JobMaster[], tabName: string) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No data available to export",
      });
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.setTextColor(40, 116, 166);
      doc.text(`${tabName} - Job Orders Report`, 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${dataToExport.length}`, 20, 37);

      const tableHeaders = [
        "Job No",
        "Type",
        "Sub Type",
        "Party",
        "Origin",
        "Destination",
        "ETD",
        "ETA",
        "Status",
      ];
      const tableData = dataToExport.map((item) => [
        item.jobNumber?.toString() || "N/A",
        (item.operationType?.toString() || "N/A").substring(0, 10),
        (item.jobSubType?.toString() || "N/A").substring(0, 10),
        (item.partyName?.toString() || "N/A").substring(0, 15),
        (item.originPortName?.toString() || "N/A").substring(0, 15),
        (item.destinationPortName?.toString() || "N/A").substring(0, 15),
        item.etdDate ? new Date(item.etdDate).toLocaleDateString() : "N/A",
        item.etaDate ? new Date(item.etaDate).toLocaleDateString() : "N/A",
        item.status || "N/A",
      ]);

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 45,
        theme: "striped",
        headStyles: {
          fillColor: [40, 116, 166],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      });

      doc.save(`${tabName}_JobOrders_${moment().format("YYYY-MM-DD")}.pdf`);
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

  const generateJobPDF = (job: JobMaster) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(40, 116, 166);
    doc.text("JOB ORDER", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Job Number: ${job.jobNumber}`, 20, 35);
    doc.text(`Date: ${new Date(job.createdAt).toLocaleDateString()}`, 160, 35);

    // Job Information
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("JOB INFORMATION", 20, 50);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Operation Type: ${job.operationType || "N/A"}`, 20, 57);
    doc.text(`Job Sub Type: ${job.jobSubType || "N/A"}`, 20, 64);
    doc.text(`FCL/LCL: ${job.fclLclType || "N/A"}`, 20, 71);
    doc.text(`Party: ${job.partyName || "N/A"}`, 20, 78);

    // Routing
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("ROUTING", 110, 50);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Origin: ${job.originPortName || "N/A"}`, 110, 57);
    doc.text(`Destination: ${job.destinationPortName || "N/A"}`, 110, 64);
    doc.text(`Vessel: ${job.vesselName || "N/A"}`, 110, 71);
    doc.text(`Voyage: ${job.voyageNo || "N/A"}`, 110, 78);

    // Parties
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("PARTIES", 20, 95);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Shipper: ${job.shipperName || "N/A"}`, 20, 102);
    doc.text(`Consignee: ${job.consigneeName || "N/A"}`, 20, 109);
    if (job.notifyParty1Name) {
      doc.text(`Notify 1: ${job.notifyParty1Name}`, 20, 116);
    }
    if (job.notifyParty2Name) {
      doc.text(`Notify 2: ${job.notifyParty2Name}`, 20, 123);
    }

    // Dates
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("SCHEDULE", 110, 95);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `ETD: ${
        job.etdDate ? new Date(job.etdDate).toLocaleDateString() : "N/A"
      }`,
      110,
      102
    );
    doc.text(
      `ETA: ${
        job.etaDate ? new Date(job.etaDate).toLocaleDateString() : "N/A"
      }`,
      110,
      109
    );
    doc.text(`Free Days: ${job.freeDays || "0"}`, 110, 116);

    // Equipment Details
    if (job.equipments && job.equipments.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(40, 116, 166);
      doc.text("EQUIPMENT DETAILS", 20, 140);

      const equipHeaders = [
        "Container No",
        "Type",
        "Size",
        "Seal No",
        "Status",
      ];
      const equipData = job.equipments.map((eq) => [
        eq.containerNo || "N/A",
        eq.containerTypeName || "N/A",
        eq.containerSizeName || "N/A",
        eq.sealNo || "N/A",
        eq.status || "N/A",
      ]);

      autoTable(doc, {
        head: [equipHeaders],
        body: equipData,
        startY: 145,
        theme: "grid",
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    }

    // Commodities
    if (job.commodities && job.commodities.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 150;

      doc.setFontSize(12);
      doc.setTextColor(40, 116, 166);
      doc.text("COMMODITY DETAILS", 20, finalY + 10);

      const commHeaders = [
        "Description",
        "Weight (kg)",
        "Volume (CBM)",
        "Value",
      ];
      const commData = job.commodities.map((comm) => [
        comm.description || "N/A",
        `${comm.grossWeight?.toFixed(2) || "0"}`,
        `${comm.volumeCbm?.toFixed(2) || "0"}`,
        `${comm.declaredValueFC?.toFixed(2) || "0"}`,
      ]);

      autoTable(doc, {
        head: [commHeaders],
        body: commData,
        startY: finalY + 15,
        theme: "grid",
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    }

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Generated on: " + new Date().toLocaleDateString(),
      20,
      finalY + 10
    );
    doc.text(`Status: ${job.status}`, 160, finalY + 10);

    doc.save(`Job_${job.jobNumber}_${moment().format("YYYY-MM-DD")}.pdf`);
    toast({
      title: "Success",
      description: "Job document generated successfully",
    });
  };

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
      case "ON_HOLD":
        return "bg-orange-50 text-orange-700 border-orange-200";
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

  const columns: ColumnDef<JobMaster>[] = [
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
                  onClick={() => {
                    setSelectedJob(row.original);
                    setShowForm(true);
                  }}
                >
                  <FiEdit size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Edit Job</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors'
                  onClick={() => handleDuplicate(row.original)}
                >
                  <FiCopy size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Duplicate Job</p>
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
                <p className='text-xs'>Delete Job</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors'
                  onClick={() => generateJobPDF(row.original)}
                >
                  <FiPrinter size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Print Job</p>
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
            {row.original.jobSubType || "-"}
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
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getOperationTypeBadge(
              operationType
            )}`}
          >
            {operationType}
          </span>
        );
      },
    },
    {
      accessorKey: "fclLclType",
      header: "FCL/LCL",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {row.getValue("fclLclType") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "partyName",
      header: "Party",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700 font-medium'>
          {row.getValue("partyName") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "routing",
      header: "Routing",
      cell: ({ row }) => (
        <div className='text-xs text-gray-700'>
          <div>From: {row.original.originPortName?.split(" - ")[0] || "-"}</div>
          <div className='mt-0.5'>
            To: {row.original.destinationPortName?.split(" - ")[0] || "-"}
          </div>
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
      accessorKey: "equipmentCount",
      header: "Containers",
      cell: ({ row }) => (
        <div className='text-center'>
          <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium'>
            {row.original.equipments?.length || 0}
          </span>
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
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(
              status
            )}`}
          >
            {status === "DRAFT" && <FiClock className='mr-1 h-3 w-3' />}
            {status === "ACTIVE" && <FiCheckCircle className='mr-1 h-3 w-3' />}
            {status === "COMPLETED" && (
              <FiCheckCircle className='mr-1 h-3 w-3' />
            )}
            {status === "CANCELLED" && (
              <FiAlertCircle className='mr-1 h-3 w-3' />
            )}
            {status}
          </span>
        );
      },
    },
  ];

  // View Job Details Dialog with ALL fields
  const ViewJobDialog = () => (
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FiEye className='h-5 w-5' />
            Job Order Details
          </DialogTitle>
          <DialogDescription>
            Complete details for Job {selectedJobDetails?.jobNumber}
          </DialogDescription>
        </DialogHeader>

        {selectedJobDetails && (
          <div className='space-y-4'>
            {/* Basic Job Information */}
            <div className='grid grid-cols-2 gap-4'>
              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3'>
                  <div className='space-y-1.5 text-xs'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Job Number:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.jobNumber || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Operation Type:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.operationType || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Job Sub Type:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.jobSubType || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>FCL/LCL:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.fclLclType || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Party:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.partyName || "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    Routing & Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3'>
                  <div className='space-y-1.5 text-xs'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Origin:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.originPortName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Destination:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.destinationPortName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>ETD:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.etdDate
                          ? new Date(
                              selectedJobDetails.etdDate
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>ETA:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.etaDate
                          ? new Date(
                              selectedJobDetails.etaDate
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Free Days:</span>
                      <span className='font-medium'>
                        {selectedJobDetails.freeDays || "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vessel Information */}
            <Card>
              <CardHeader className='py-3 px-4'>
                <CardTitle className='text-sm font-medium'>
                  Vessel Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0 px-4 pb-3'>
                <div className='grid grid-cols-3 gap-4 text-xs'>
                  <div>
                    <span className='text-gray-600'>Vessel Name: </span>
                    <span className='font-medium'>
                      {selectedJobDetails.vesselName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Voyage No: </span>
                    <span className='font-medium'>
                      {selectedJobDetails.voyageNo || "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Vessel Arrival: </span>
                    <span className='font-medium'>
                      {selectedJobDetails.vesselArrival
                        ? new Date(
                            selectedJobDetails.vesselArrival
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parties Information */}
            <Card>
              <CardHeader className='py-3 px-4'>
                <CardTitle className='text-sm font-medium'>
                  Parties Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0 px-4 pb-3'>
                <div className='grid grid-cols-3 gap-4'>
                  {selectedJobDetails.shipperName && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Shipper
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.shipperName}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.consigneeName && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Consignee
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.consigneeName}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.notifyParty1Name && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Notify Party 1
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.notifyParty1Name}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.notifyParty2Name && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Notify Party 2
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.notifyParty2Name}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.principalName && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Principal
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.principalName}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.overseasAgentName && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Overseas Agent
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.overseasAgentName}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.transporterName && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Transporter
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.transporterName}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.depositorName && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                        Depositor
                      </h4>
                      <p className='text-sm'>
                        {selectedJobDetails.depositorName}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Information */}
            <Card>
              <CardHeader className='py-3 px-4'>
                <CardTitle className='text-sm font-medium'>
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0 px-4 pb-3'>
                <div className='grid grid-cols-3 gap-4 text-xs'>
                  {selectedJobDetails.lcNumber && (
                    <div>
                      <span className='text-gray-600'>LC Number: </span>
                      <span className='font-medium'>
                        {selectedJobDetails.lcNumber}
                      </span>
                    </div>
                  )}
                  {selectedJobDetails.igmNumber && (
                    <div>
                      <span className='text-gray-600'>IGM Number: </span>
                      <span className='font-medium'>
                        {selectedJobDetails.igmNumber}
                      </span>
                    </div>
                  )}
                  {selectedJobDetails.hblNumber && (
                    <div>
                      <span className='text-gray-600'>HBL Number: </span>
                      <span className='font-medium'>
                        {selectedJobDetails.hblNumber}
                      </span>
                    </div>
                  )}
                  {selectedJobDetails.mawbNumber && (
                    <div>
                      <span className='text-gray-600'>MAWB Number: </span>
                      <span className='font-medium'>
                        {selectedJobDetails.mawbNumber}
                      </span>
                    </div>
                  )}
                  {selectedJobDetails.hawbNumber && (
                    <div>
                      <span className='text-gray-600'>HAWB Number: </span>
                      <span className='font-medium'>
                        {selectedJobDetails.hawbNumber}
                      </span>
                    </div>
                  )}
                  {selectedJobDetails.gdType && (
                    <div>
                      <span className='text-gray-600'>GD Type: </span>
                      <span className='font-medium'>
                        {selectedJobDetails.gdType}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipment Information */}
            {selectedJobDetails.equipments &&
              selectedJobDetails.equipments.length > 0 && (
                <Card>
                  <CardHeader className='py-3 px-4'>
                    <CardTitle className='text-sm font-medium'>
                      Equipment Details ({selectedJobDetails.equipments.length}{" "}
                      containers)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 px-4 pb-3'>
                    <div className='overflow-x-auto'>
                      <table className='w-full text-xs'>
                        <thead>
                          <tr className='border-b bg-gray-50'>
                            <th className='text-left py-2 px-2'>
                              Container No
                            </th>
                            <th className='text-left py-2 px-2'>Type</th>
                            <th className='text-left py-2 px-2'>Size</th>
                            <th className='text-left py-2 px-2'>Seal No</th>
                            <th className='text-left py-2 px-2'>Gate Out</th>
                            <th className='text-left py-2 px-2'>Gate In</th>
                            <th className='text-left py-2 px-2'>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedJobDetails.equipments.map((eq, index) => (
                            <tr
                              key={eq.jobEquipmentId}
                              className='border-b hover:bg-gray-50'
                            >
                              <td className='py-2 px-2'>{eq.containerNo}</td>
                              <td className='py-2 px-2'>
                                {eq.containerTypeName || "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.containerSizeName || "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.sealNo || "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.gateOutDate
                                  ? new Date(
                                      eq.gateOutDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.gateInDate
                                  ? new Date(eq.gateInDate).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.status || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Commodity Information */}
            {selectedJobDetails.commodities &&
              selectedJobDetails.commodities.length > 0 && (
                <Card>
                  <CardHeader className='py-3 px-4'>
                    <CardTitle className='text-sm font-medium'>
                      Commodity Details ({selectedJobDetails.commodities.length}{" "}
                      items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 px-4 pb-3'>
                    <div className='overflow-x-auto'>
                      <table className='w-full text-xs'>
                        <thead>
                          <tr className='border-b bg-gray-50'>
                            <th className='text-left py-2 px-2'>Description</th>
                            <th className='text-left py-2 px-2'>HS Code</th>
                            <th className='text-left py-2 px-2'>
                              Gross Weight
                            </th>
                            <th className='text-left py-2 px-2'>Net Weight</th>
                            <th className='text-left py-2 px-2'>Volume</th>
                            <th className='text-left py-2 px-2'>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedJobDetails.commodities.map((comm, index) => (
                            <tr
                              key={comm.jobCommodityId}
                              className='border-b hover:bg-gray-50'
                            >
                              <td className='py-2 px-2'>{comm.description}</td>
                              <td className='py-2 px-2'>
                                {comm.hsCode || "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {comm.grossWeight?.toFixed(2) || "0"} kg
                              </td>
                              <td className='py-2 px-2'>
                                {comm.netWeight?.toFixed(2) || "0"} kg
                              </td>
                              <td className='py-2 px-2'>
                                {comm.volumeCbm?.toFixed(2) || "0"} CBM
                              </td>
                              <td className='py-2 px-2'>
                                {comm.declaredValueFC?.toFixed(2) || "0"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Charges Information */}
            {selectedJobDetails.charges &&
              selectedJobDetails.charges.length > 0 && (
                <Card>
                  <CardHeader className='py-3 px-4'>
                    <CardTitle className='text-sm font-medium'>
                      Charge Details ({selectedJobDetails.charges.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 px-4 pb-3'>
                    <div className='overflow-x-auto'>
                      <table className='w-full text-xs'>
                        <thead>
                          <tr className='border-b bg-gray-50'>
                            <th className='text-left py-2 px-2'>Charge</th>
                            <th className='text-left py-2 px-2'>Basis</th>
                            <th className='text-left py-2 px-2'>Price FC</th>
                            <th className='text-left py-2 px-2'>Amount FC</th>
                            <th className='text-left py-2 px-2'>Tax</th>
                            <th className='text-left py-2 px-2'>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedJobDetails.charges.map((charge, index) => (
                            <tr
                              key={charge.jobChargeId}
                              className='border-b hover:bg-gray-50'
                            >
                              <td className='py-2 px-2'>
                                {charge.chargeName || "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {charge.chargeBasis || "N/A"}
                              </td>
                              <td className='py-2 px-2'>
                                {charge.priceFC?.toFixed(2) || "0"}
                              </td>
                              <td className='py-2 px-2'>
                                {charge.amountFC?.toFixed(2) || "0"}
                              </td>
                              <td className='py-2 px-2'>
                                {charge.taxFC?.toFixed(2) || "0"}
                              </td>
                              <td className='py-2 px-2'>
                                {(
                                  (charge.amountFC || 0) + (charge.taxFC || 0)
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Additional Information */}
            {(selectedJobDetails.jobDescription ||
              selectedJobDetails.remarks) && (
              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3 space-y-2'>
                  {selectedJobDetails.jobDescription && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-1'>
                        Job Description
                      </h4>
                      <p className='text-xs text-gray-600 whitespace-pre-wrap'>
                        {selectedJobDetails.jobDescription}
                      </p>
                    </div>
                  )}
                  {selectedJobDetails.remarks && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-1'>
                        Remarks
                      </h4>
                      <p className='text-xs text-gray-600 whitespace-pre-wrap'>
                        {selectedJobDetails.remarks}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Information */}
            <Card>
              <CardHeader className='py-3 px-4'>
                <CardTitle className='text-sm font-medium'>
                  Status & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0 px-4 pb-3'>
                <div className='grid grid-cols-4 gap-4 text-xs'>
                  <div>
                    <span className='text-gray-600'>Status: </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-medium border ${getStatusBadge(
                        selectedJobDetails.status
                      )}`}
                    >
                      {selectedJobDetails.status}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Created: </span>
                    <span className='font-medium'>
                      {selectedJobDetails.createdAt
                        ? new Date(
                            selectedJobDetails.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Updated: </span>
                    <span className='font-medium'>
                      {selectedJobDetails.updatedAt
                        ? new Date(
                            selectedJobDetails.updatedAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Version: </span>
                    <span className='font-medium'>
                      {selectedJobDetails.version || "1"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => generateJobPDF(selectedJobDetails!)}
            className='flex items-center gap-2'
          >
            <FiPrinter className='h-4 w-4' />
            Print Job
          </Button>
          <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const JobStatsPage = () => {
    const stats = getJobStats();

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
            <FiDownload size={14} />
            Export Report
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          <Card className='border border-blue-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-blue-700 uppercase tracking-wide'>
                Total Jobs
              </CardTitle>
              <div className='text-2xl font-bold text-blue-900 mt-1'>
                {stats.totalJobs}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>
                {stats.activeJobs} active • {stats.draftJobs} draft
              </div>
            </CardContent>
          </Card>

          <Card className='border border-green-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-green-700 uppercase tracking-wide'>
                Completed
              </CardTitle>
              <div className='text-2xl font-bold text-green-900 mt-1'>
                {stats.completedJobs}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>
                {stats.inProgressJobs} in progress
              </div>
            </CardContent>
          </Card>

          <Card className='border border-purple-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-purple-700 uppercase tracking-wide'>
                Import Jobs
              </CardTitle>
              <div className='text-2xl font-bold text-purple-900 mt-1'>
                {stats.importJobs}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Inbound shipments</div>
            </CardContent>
          </Card>

          <Card className='border border-indigo-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-indigo-700 uppercase tracking-wide'>
                Export Jobs
              </CardTitle>
              <div className='text-2xl font-bold text-indigo-900 mt-1'>
                {stats.exportJobs}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Outbound shipments</div>
            </CardContent>
          </Card>
        </div>

        <Card className='border shadow-sm'>
          <CardHeader className='pb-3 pt-4 px-4'>
            <CardTitle className='text-sm font-semibold text-gray-900'>
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0 pb-4 px-4'>
            <div className='grid grid-cols-6 gap-2'>
              {[
                {
                  status: "DRAFT",
                  count: stats.draftJobs,
                  color: "bg-gray-100 text-gray-800",
                },
                {
                  status: "ACTIVE",
                  count: stats.activeJobs,
                  color: "bg-blue-100 text-blue-800",
                },
                {
                  status: "IN PROGRESS",
                  count: stats.inProgressJobs,
                  color: "bg-yellow-100 text-yellow-800",
                },
                {
                  status: "COMPLETED",
                  count: stats.completedJobs,
                  color: "bg-green-100 text-green-800",
                },
                {
                  status: "CANCELLED",
                  count: stats.cancelledJobs,
                  color: "bg-red-100 text-red-800",
                },
                {
                  status: "LOCAL",
                  count: stats.localJobs,
                  color: "bg-teal-100 text-teal-800",
                },
              ].map((item) => (
                <div key={item.status} className='text-center'>
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${item.color} mb-2`}
                  >
                    <span className='text-lg font-bold'>{item.count}</span>
                  </div>
                  <div className='text-xs font-medium text-gray-700'>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
            <FiArrowLeft className='h-3.5 w-3.5' />
            Back to Job List
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
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Job Order Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Manage Import, Export, and Local job orders with complete tracking
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
              <FiFilePlus className='h-3.5 w-3.5' />
              Add New Job
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
                  placeholder='Search by Job No, Party, Vessel, IGM...'
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
              {activeTab === "ALL_JOBS" && (
                <>
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
                  <Select
                    value={operationTypeFilter}
                    onValueChange={setOperationTypeFilter}
                  >
                    <SelectTrigger className='w-[160px] h-9 text-sm'>
                      <SelectValue placeholder='Filter by type' />
                    </SelectTrigger>
                    <SelectContent>
                      {operationTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
          defaultValue='ALL_JOBS'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='grid w-full grid-cols-10 gap-1 bg-transparent h-auto p-0'>
              <TabsTrigger
                value='ALL_JOBS'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiBriefcase className='w-3.5 h-3.5 mr-1.5' />
                All ({data.length})
              </TabsTrigger>
              <TabsTrigger
                value='DRAFT'
                className='text-xs py-2 px-3 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiClock className='w-3.5 h-3.5 mr-1.5' />
                Draft ({getJobStats().draftJobs})
              </TabsTrigger>
              <TabsTrigger
                value='ACTIVE'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Active ({getJobStats().activeJobs})
              </TabsTrigger>
              <TabsTrigger
                value='IN_PROGRESS'
                className='text-xs py-2 px-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiClock className='w-3.5 h-3.5 mr-1.5' />
                In Progress ({getJobStats().inProgressJobs})
              </TabsTrigger>
              <TabsTrigger
                value='COMPLETED'
                className='text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Completed ({getJobStats().completedJobs})
              </TabsTrigger>
              <TabsTrigger
                value='CANCELLED'
                className='text-xs py-2 px-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiAlertCircle className='w-3.5 h-3.5 mr-1.5' />
                Cancelled ({getJobStats().cancelledJobs})
              </TabsTrigger>
              <TabsTrigger
                value='IMPORT'
                className='text-xs py-2 px-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiTruck className='w-3.5 h-3.5 mr-1.5' />
                Import ({getJobStats().importJobs})
              </TabsTrigger>
              <TabsTrigger
                value='EXPORT'
                className='text-xs py-2 px-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiTruck className='w-3.5 h-3.5 mr-1.5' />
                Export ({getJobStats().exportJobs})
              </TabsTrigger>
              <TabsTrigger
                value='LOCAL'
                className='text-xs py-2 px-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiBox className='w-3.5 h-3.5 mr-1.5' />
                Local ({getJobStats().localJobs})
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

          {[
            "ALL_JOBS",
            "DRAFT",
            "ACTIVE",
            "IN_PROGRESS",
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
                    <div className='text-center'>
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
      <ViewJobDialog />
    </div>
  );
}
