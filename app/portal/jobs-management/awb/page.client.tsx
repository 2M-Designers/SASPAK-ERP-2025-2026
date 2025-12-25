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
  FiTruck,
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
import AwbForm from "@/views/forms/job-order-forms/awb-form-stepwise";

type AwbMasterPageProps = {
  initialData?: any[];
};

// AWB Master type with ALL fields
type AwbMaster = {
  awbId: number;
  companyId: number;
  jobId: number;
  mawbNumber: string;
  hawbNumber: string;
  awbType: string;
  awbDate: string;
  airlinePartyId: number;
  shipperPartyId: number;
  consigneePartyId: number;
  notifyPartyId: number;
  noOfPackages: number;
  grossWeight: number;
  netWeight: number;
  volumeCbm: number;
  originAirportId?: number;
  destinationAirportId?: number;
  flightNumber?: string;
  forwardingAgentId?: number;
  freightType?: string;
  movement?: string;
  awbCurrencyId?: number;
  placeOfIssueId?: number;
  dateOfIssue?: string;
  marksAndCargoNo?: string;
  awbNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  // Display names
  airlineName?: string;
  shipperName?: string;
  consigneeName?: string;
  notifyName?: string;
  jobNumber?: string;
  originAirportName?: string;
  destinationAirportName?: string;
  forwardingAgentName?: string;
  currencyName?: string;
  placeOfIssueName?: string;
  equipments?: AwbEquipment[];
};

// AWB Equipment type with ALL fields
type AwbEquipment = {
  awbEquipmentId: number;
  awbId: number;
  uldNumber: string;
  packageCount: number;
  grossWeight: number;
  netWeight: number;
  volumeCbm: number;
  dimensions?: string;
  remarks?: string;
  descriptionOfGoods?: string;
  freeDays: number;
  hsCodes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

// Field configuration for Air Waybill
const awbFieldConfig = [
  {
    fieldName: "awbId",
    displayName: "AWB ID",
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
    fieldName: "jobId",
    displayName: "Job ID",
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
    fieldName: "mawbNumber",
    displayName: "MAWB Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "hawbNumber",
    displayName: "HAWB Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "awbType",
    displayName: "AWB Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "awbDate",
    displayName: "AWB Date",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "airlinePartyId",
    displayName: "Airline ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "airlineName",
    displayName: "Airline",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "shipperPartyId",
    displayName: "Shipper ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "shipperName",
    displayName: "Shipper",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "consigneePartyId",
    displayName: "Consignee ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "consigneeName",
    displayName: "Consignee",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "notifyPartyId",
    displayName: "Notify ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "notifyName",
    displayName: "Notify Party",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "originAirportId",
    displayName: "Origin Airport ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "originAirportName",
    displayName: "Origin Airport",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "destinationAirportId",
    displayName: "Destination Airport ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "destinationAirportName",
    displayName: "Destination Airport",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "flightNumber",
    displayName: "Flight Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "forwardingAgentId",
    displayName: "Agent ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "forwardingAgentName",
    displayName: "Forwarding Agent",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "freightType",
    displayName: "Freight Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "movement",
    displayName: "Movement",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "awbCurrencyId",
    displayName: "Currency ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "currencyName",
    displayName: "AWB Currency",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "placeOfIssueId",
    displayName: "Place of Issue ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "placeOfIssueName",
    displayName: "Place of Issue",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "dateOfIssue",
    displayName: "Date of Issue",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "noOfPackages",
    displayName: "No. of Packages",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "grossWeight",
    displayName: "Gross Weight",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "netWeight",
    displayName: "Net Weight",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "volumeCbm",
    displayName: "Volume (CBM)",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "marksAndCargoNo",
    displayName: "Marks & Cargo No",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "awbNotes",
    displayName: "AWB Notes",
    isdisplayed: false,
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
  {
    fieldName: "updatedAt",
    displayName: "Updated At",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "version",
    displayName: "Version",
    isdisplayed: false,
    isselected: true,
  },
];

// Equipment field configuration
const equipmentFieldConfig = [
  {
    fieldName: "awbEquipmentId",
    displayName: "Equipment ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "awbId",
    displayName: "AWB ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "uldNumber",
    displayName: "ULD Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "packageCount",
    displayName: "Package Count",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "grossWeight",
    displayName: "Gross Weight",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "netWeight",
    displayName: "Net Weight",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "volumeCbm",
    displayName: "Volume (CBM)",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "dimensions",
    displayName: "Dimensions",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "descriptionOfGoods",
    displayName: "Description of Goods",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "hsCodes",
    displayName: "HS Codes",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "freeDays",
    displayName: "Free Days",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "remarks",
    displayName: "Remarks",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "createdAt",
    displayName: "Created At",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "updatedAt",
    displayName: "Updated At",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "version",
    displayName: "Version",
    isdisplayed: false,
    isselected: true,
  },
];

export default function AirWaybillPage({ initialData }: AwbMasterPageProps) {
  const [data, setData] = useState<AwbMaster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAwb, setSelectedAwb] = useState<AwbMaster | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_AWB");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAwbDetails, setSelectedAwbDetails] =
    useState<AwbMaster | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const router = useRouter();
  const { toast } = useToast();

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "ISSUED", label: "Issued" },
    { value: "MANIFESTED", label: "Manifested" },
    { value: "DEPARTED", label: "Departed" },
    { value: "ARRIVED", label: "Arrived" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Fetch AWB data with ALL new fields
  const fetchAirWaybills = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Awb/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "AwbId,CompanyId,JobId,MawbNumber,HawbNumber,AwbType,AwbDate,AirlinePartyId,ShipperPartyId,ConsigneePartyId,NotifyPartyId,NoOfPackages,GrossWeight,NetWeight,VolumeCbm,OriginAirportId,DestinationAirportId,FlightNumber,ForwardingAgentId,FreightType,Movement,AwbCurrencyId,PlaceOfIssueId,DateOfIssue,MarksAndCargoNo,AwbNotes,Status,CreatedAt,UpdatedAt,Version",
          where: "",
          sortOn: "AwbDate DESC",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const awbData = await response.json();

        const enrichedData = await Promise.all(
          awbData.map(async (awb: AwbMaster) => {
            try {
              // Fetch job details
              let jobNumber = `JOB-${awb.jobId}`;
              if (awb.jobId) {
                try {
                  const jobResponse = await fetch(`${baseUrl}Job/${awb.jobId}`);
                  if (jobResponse.ok) {
                    const jobData = await jobResponse.json();
                    jobNumber = jobData.jobNumber || jobNumber;
                  }
                } catch (err) {
                  console.error(`Error fetching job ${awb.jobId}:`, err);
                }
              }

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
                airlineData,
                shipperData,
                consigneeData,
                notifyData,
                forwardingAgentData,
              ] = await Promise.all([
                fetchParty(awb.airlinePartyId),
                fetchParty(awb.shipperPartyId),
                fetchParty(awb.consigneePartyId),
                fetchParty(awb.notifyPartyId),
                awb.forwardingAgentId
                  ? fetchParty(awb.forwardingAgentId)
                  : Promise.resolve(null),
              ]);

              // Fetch airport details
              const fetchAirport = async (airportId: number) => {
                if (!airportId) return null;
                try {
                  const response = await fetch(
                    `${baseUrl}UnLocation/${airportId}`
                  );
                  return response.ok ? await response.json() : null;
                } catch (err) {
                  console.error(`Error fetching airport ${airportId}:`, err);
                  return null;
                }
              };

              const [
                originAirportData,
                destinationAirportData,
                placeOfIssueData,
              ] = await Promise.all([
                awb.originAirportId
                  ? fetchAirport(awb.originAirportId)
                  : Promise.resolve(null),
                awb.destinationAirportId
                  ? fetchAirport(awb.destinationAirportId)
                  : Promise.resolve(null),
                awb.placeOfIssueId
                  ? fetchAirport(awb.placeOfIssueId)
                  : Promise.resolve(null),
              ]);

              // Fetch currency details
              let currencyName = null;
              if (awb.awbCurrencyId) {
                try {
                  const currencyResponse = await fetch(
                    `${baseUrl}Currency/${awb.awbCurrencyId}`
                  );
                  if (currencyResponse.ok) {
                    const currencyData = await currencyResponse.json();
                    currencyName =
                      currencyData.currencyCode || currencyData.currencyName;
                  }
                } catch (err) {
                  console.error(
                    `Error fetching currency ${awb.awbCurrencyId}:`,
                    err
                  );
                }
              }

              // Equipment will be loaded on-demand when viewing details
              let equipments: AwbEquipment[] = [];

              return {
                ...awb,
                jobNumber,
                airlineName: airlineData?.partyName || "N/A",
                shipperName: shipperData?.partyName || "N/A",
                consigneeName: consigneeData?.partyName || "N/A",
                notifyName: notifyData?.partyName || "N/A",
                forwardingAgentName: forwardingAgentData?.partyName || null,
                originAirportName: originAirportData
                  ? `${originAirportData.uncode} - ${originAirportData.locationName}`
                  : null,
                destinationAirportName: destinationAirportData
                  ? `${destinationAirportData.uncode} - ${destinationAirportData.locationName}`
                  : null,
                placeOfIssueName: placeOfIssueData
                  ? `${placeOfIssueData.uncode} - ${placeOfIssueData.locationName}`
                  : null,
                currencyName,
                equipments,
              };
            } catch (error) {
              console.error(`Error enriching AWB ${awb.awbId}:`, error);
              return awb;
            }
          })
        );

        setData(enrichedData);
        toast({
          title: "Success",
          description: "Air Waybills loaded successfully",
        });
      } else {
        throw new Error("Failed to fetch air waybills");
      }
    } catch (error) {
      console.error("Error fetching air waybills:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load air waybills list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAirWaybills();
  }, []);

  const searchInItem = (item: AwbMaster, searchTerm: string) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const searchableFields = [
      item.mawbNumber?.toString(),
      item.hawbNumber?.toString(),
      item.jobNumber?.toString(),
      item.airlineName?.toString(),
      item.shipperName?.toString(),
      item.consigneeName?.toString(),
      item.notifyName?.toString(),
      item.flightNumber?.toString(),
      item.status?.toString(),
    ];
    return searchableFields.some(
      (field) => field && field.toLowerCase().includes(searchLower)
    );
  };

  const filterByStatus = (awb: AwbMaster) => {
    if (statusFilter === "ALL") return true;
    return awb.status === statusFilter;
  };

  const getCurrentTabData = () => {
    let tabData = data;

    switch (activeTab) {
      case "DRAFT":
        tabData = data.filter((item) => item.status === "DRAFT");
        break;
      case "ISSUED":
        tabData = data.filter((item) => item.status === "ISSUED");
        break;
      case "MANIFESTED":
        tabData = data.filter((item) => item.status === "MANIFESTED");
        break;
      case "DEPARTED":
        tabData = data.filter((item) => item.status === "DEPARTED");
        break;
      case "ARRIVED":
        tabData = data.filter((item) => item.status === "ARRIVED");
        break;
      case "DELIVERED":
        tabData = data.filter((item) => item.status === "DELIVERED");
        break;
      case "CANCELLED":
        tabData = data.filter((item) => item.status === "CANCELLED");
        break;
    }

    tabData = tabData.filter((item) => searchInItem(item, searchText));

    if (activeTab === "ALL_AWB") {
      tabData = tabData.filter(filterByStatus);
    }

    return tabData;
  };

  const getAwbStats = () => {
    const allAwbs = data;
    return {
      totalAwbs: allAwbs.length,
      draftAwbs: allAwbs.filter((item) => item.status === "DRAFT").length,
      issuedAwbs: allAwbs.filter((item) => item.status === "ISSUED").length,
      manifestedAwbs: allAwbs.filter((item) => item.status === "MANIFESTED")
        .length,
      departedAwbs: allAwbs.filter((item) => item.status === "DEPARTED").length,
      arrivedAwbs: allAwbs.filter((item) => item.status === "ARRIVED").length,
      deliveredAwbs: allAwbs.filter((item) => item.status === "DELIVERED")
        .length,
      cancelledAwbs: allAwbs.filter((item) => item.status === "CANCELLED")
        .length,
      totalPackages: allAwbs.reduce(
        (sum, item) => sum + (item.noOfPackages || 0),
        0
      ),
      totalWeight: allAwbs.reduce(
        (sum, item) => sum + (item.grossWeight || 0),
        0
      ),
      totalVolume: allAwbs.reduce(
        (sum, item) => sum + (item.volumeCbm || 0),
        0
      ),
    };
  };

  const handleAddEditComplete = (updatedItem: any) => {
    setShowForm(false);
    setSelectedAwb(null);
    fetchAirWaybills();
  };

  const handleDelete = async (item: AwbMaster) => {
    if (
      confirm(
        `Are you sure you want to delete AWB "${
          item.mawbNumber || item.hawbNumber
        }"?`
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Awb/${item.awbId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev) =>
            prev.filter((record) => record.awbId !== item.awbId)
          );
          toast({
            title: "Success",
            description: "Air Waybill deleted successfully",
          });
        } else {
          throw new Error("Failed to delete Air Waybill");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete Air Waybill",
        });
        console.error("Error deleting Air Waybill:", error);
      }
    }
  };

  const handleViewDetails = (awb: AwbMaster) => {
    setSelectedAwbDetails(awb);
    setViewDialogOpen(true);
  };

  const handleDuplicate = (awb: AwbMaster) => {
    const duplicateAwb = {
      ...awb,
      awbId: 0,
      mawbNumber: `${awb.mawbNumber}-COPY`,
      hawbNumber: awb.hawbNumber ? `${awb.hawbNumber}-COPY` : "",
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedAwb(duplicateAwb);
    setShowForm(true);
  };

  const downloadExcelWithData = (
    dataToExport: AwbMaster[],
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

      const headers = awbFieldConfig
        .filter((field) => field.isdisplayed && field.isselected)
        .map((field) => field.displayName);
      worksheet.addRow(headers);

      dataToExport.forEach((awb) => {
        const row = awbFieldConfig
          .filter((field) => field.isdisplayed && field.isselected)
          .map((field) => {
            const value = (awb as any)[field.fieldName];

            if (
              field.fieldName === "awbDate" ||
              field.fieldName === "createdAt" ||
              field.fieldName === "dateOfIssue"
            ) {
              return value ? new Date(value).toLocaleDateString() : "";
            }

            if (
              field.fieldName.includes("Weight") ||
              field.fieldName === "volumeCbm"
            ) {
              return typeof value === "number" ? value.toFixed(2) : value;
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
          `${tabName}_AirWaybill_${moment().format("YYYY-MM-DD")}.xlsx`
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

  const downloadPDFWithData = (dataToExport: AwbMaster[], tabName: string) => {
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
      doc.text(`${tabName} - Air Waybill Report`, 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${dataToExport.length}`, 20, 37);

      const tableHeaders = [
        "MAWB No",
        "HAWB No",
        "Job No",
        "AWB Date",
        "Airline",
        "Flight",
        "Origin",
        "Destination",
        "Status",
      ];
      const tableData = dataToExport.map((item) => [
        item.mawbNumber?.toString() || "N/A",
        item.hawbNumber?.toString() || "N/A",
        item.jobNumber?.toString() || "N/A",
        item.awbDate ? new Date(item.awbDate).toLocaleDateString() : "N/A",
        (item.airlineName?.toString() || "N/A").substring(0, 15),
        (item.flightNumber?.toString() || "N/A").substring(0, 10),
        (item.originAirportName?.toString() || "N/A").substring(0, 15),
        (item.destinationAirportName?.toString() || "N/A").substring(0, 15),
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

      doc.save(`${tabName}_AirWaybill_${moment().format("YYYY-MM-DD")}.pdf`);
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

  const generateAWBPDF = (awb: AwbMaster) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(40, 116, 166);
    doc.text("AIR WAYBILL", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Original`, 20, 35);
    doc.text(
      `AWB Date: ${
        awb.awbDate ? new Date(awb.awbDate).toLocaleDateString() : "N/A"
      }`,
      160,
      35
    );

    // Shipper
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("SHIPPER", 20, 50);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(awb.shipperName || "N/A", 20, 57);

    // Consignee
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("CONSIGNEE", 20, 70);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(awb.consigneeName || "N/A", 20, 77);

    // Notify Party
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("NOTIFY PARTY", 20, 90);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(awb.notifyName || "N/A", 20, 97);

    // AWB Numbers & Flight Info
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("AWB INFORMATION", 110, 50);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`MAWB: ${awb.mawbNumber || "N/A"}`, 110, 57);
    doc.text(`HAWB: ${awb.hawbNumber || "N/A"}`, 110, 64);
    doc.text(`Job: ${awb.jobNumber || "N/A"}`, 110, 71);
    doc.text(`Airline: ${awb.airlineName || "N/A"}`, 110, 78);
    doc.text(`Flight: ${awb.flightNumber || "N/A"}`, 110, 85);
    doc.text(`Type: ${awb.awbType || "N/A"}`, 110, 92);

    // Routing
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("ROUTING", 20, 110);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Origin: ${awb.originAirportName || "N/A"}`, 20, 117);
    doc.text(`Destination: ${awb.destinationAirportName || "N/A"}`, 20, 124);
    doc.text(`Freight: ${awb.freightType || "N/A"}`, 20, 131);
    doc.text(`Movement: ${awb.movement || "N/A"}`, 20, 138);

    // Cargo Details
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("CARGO DETAILS", 20, 151);

    const cargoData = [
      ["Description", "Value"],
      ["No. of Packages", awb.noOfPackages?.toString() || "0"],
      ["Gross Weight", `${awb.grossWeight?.toFixed(2) || "0"} kg`],
      ["Net Weight", `${awb.netWeight?.toFixed(2) || "0"} kg`],
      ["Volume", `${awb.volumeCbm?.toFixed(2) || "0"} CBM`],
    ];

    autoTable(doc, {
      head: [cargoData[0]],
      body: cargoData.slice(1),
      startY: 158,
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 40 } },
    });

    // Equipment Details with new fields
    if (awb.equipments && awb.equipments.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 170;

      doc.setFontSize(12);
      doc.setTextColor(40, 116, 166);
      doc.text("ULD DETAILS", 20, finalY + 10);

      const equipHeaders = [
        "ULD Number",
        "Packages",
        "Gross Wt",
        "Volume",
        "Dimensions",
        "Free Days",
      ];
      const equipData = awb.equipments.map((eq) => [
        eq.uldNumber || "N/A",
        eq.packageCount?.toString() || "0",
        `${eq.grossWeight?.toFixed(2) || "0"} kg`,
        `${eq.volumeCbm?.toFixed(2) || "0"} CBM`,
        eq.dimensions || "N/A",
        eq.freeDays?.toString() || "0",
      ]);

      autoTable(doc, {
        head: [equipHeaders],
        body: equipData,
        startY: finalY + 15,
        theme: "grid",
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        styles: { fontSize: 7, cellPadding: 2 },
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
    doc.text(`Status: ${awb.status}`, 160, finalY + 10);

    doc.save(
      `AWB_${awb.mawbNumber || awb.awbId}_${moment().format("YYYY-MM-DD")}.pdf`
    );
    toast({
      title: "Success",
      description: "AWB document generated successfully",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ISSUED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "MANIFESTED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "DEPARTED":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "ARRIVED":
        return "bg-green-50 text-green-700 border-green-200";
      case "DELIVERED":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const columns: ColumnDef<AwbMaster>[] = [
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
                    setSelectedAwb(row.original);
                    setShowForm(true);
                  }}
                >
                  <FiEdit size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Edit AWB</p>
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
                <p className='text-xs'>Duplicate AWB</p>
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
                <p className='text-xs'>Delete AWB</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors'
                  onClick={() => generateAWBPDF(row.original)}
                >
                  <FiPrinter size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Print AWB</p>
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
      accessorKey: "mawbNumber",
      header: "MAWB Number",
      cell: ({ row }) => (
        <div className='font-semibold text-sm text-gray-900'>
          <div>{row.getValue("mawbNumber") || "-"}</div>
          {row.original.hawbNumber && (
            <div className='text-xs text-gray-500 mt-0.5'>
              HAWB: {row.original.hawbNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "jobNumber",
      header: "Job No",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700 font-medium'>
          {row.getValue("jobNumber") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "awbDate",
      header: "AWB Date",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {row.getValue("awbDate")
            ? new Date(row.getValue("awbDate")).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "airlineFlight",
      header: "Airline / Flight",
      cell: ({ row }) => (
        <div className='text-sm text-gray-700'>
          <div className='font-medium flex items-center gap-1'>
            <FiTruck className='h-3 w-3 text-gray-400' />
            {row.original.airlineName || "-"}
          </div>
          {row.original.flightNumber && (
            <div className='text-xs text-gray-500 mt-0.5'>
              FL: {row.original.flightNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "routing",
      header: "Routing",
      cell: ({ row }) => (
        <div className='text-xs text-gray-700'>
          <div>
            Origin: {row.original.originAirportName?.split(" - ")[0] || "-"}
          </div>
          <div className='mt-0.5'>
            Dest: {row.original.destinationAirportName?.split(" - ")[0] || "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "cargoDetails",
      header: "Cargo Details",
      cell: ({ row }) => (
        <div className='text-sm text-gray-700'>
          <div className='flex items-center gap-1'>
            <FiPackage className='h-3 w-3 text-gray-400' />
            <span>Pkgs: {row.original.noOfPackages || 0}</span>
          </div>
          <div className='flex items-center gap-1 mt-0.5'>
            <FiBox className='h-3 w-3 text-gray-400' />
            <span>{row.original.grossWeight?.toFixed(2) || "0"} kg</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "equipmentCount",
      header: "ULDs",
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
            {status === "ISSUED" && <FiCheckCircle className='mr-1 h-3 w-3' />}
            {status === "DEPARTED" && <FiTruck className='mr-1 h-3 w-3' />}
            {status === "CANCELLED" && (
              <FiAlertCircle className='mr-1 h-3 w-3' />
            )}
            {status}
          </span>
        );
      },
    },
  ];

  // View AWB Details Dialog with ALL new fields
  const ViewAWBDialog = () => (
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FiEye className='h-5 w-5' />
            Air Waybill Details
          </DialogTitle>
          <DialogDescription>
            Complete details for AWB{" "}
            {selectedAwbDetails?.mawbNumber || selectedAwbDetails?.hawbNumber}
          </DialogDescription>
        </DialogHeader>

        {selectedAwbDetails && (
          <div className='space-y-4'>
            {/* Basic AWB Information */}
            <div className='grid grid-cols-2 gap-4'>
              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    AWB Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3'>
                  <div className='space-y-1.5 text-xs'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>MAWB Number:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.mawbNumber || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>HAWB Number:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.hawbNumber || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Job Number:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.jobNumber || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>AWB Type:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.awbType || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>AWB Date:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.awbDate
                          ? new Date(
                              selectedAwbDetails.awbDate
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Currency:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.currencyName || "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    Flight & Routing
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3'>
                  <div className='space-y-1.5 text-xs'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Airline:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.airlineName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Flight Number:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.flightNumber || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Origin:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.originAirportName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Destination:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.destinationAirportName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Freight Type:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.freightType || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Movement:</span>
                      <span className='font-medium'>
                        {selectedAwbDetails.movement || "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Parties Information */}
            <Card>
              <CardHeader className='py-3 px-4'>
                <CardTitle className='text-sm font-medium'>
                  Parties Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0 px-4 pb-3'>
                <div className='grid grid-cols-4 gap-4'>
                  <div>
                    <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                      Shipper
                    </h4>
                    <p className='text-sm'>
                      {selectedAwbDetails.shipperName || "-"}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                      Consignee
                    </h4>
                    <p className='text-sm'>
                      {selectedAwbDetails.consigneeName || "-"}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                      Notify Party
                    </h4>
                    <p className='text-sm'>
                      {selectedAwbDetails.notifyName || "-"}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                      Forwarding Agent
                    </h4>
                    <p className='text-sm'>
                      {selectedAwbDetails.forwardingAgentName || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issue Information */}
            <Card>
              <CardHeader className='py-3 px-4'>
                <CardTitle className='text-sm font-medium'>
                  Issue Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0 px-4 pb-3'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-xs'>
                    <span className='text-gray-600'>Place of Issue: </span>
                    <span className='font-medium'>
                      {selectedAwbDetails.placeOfIssueName || "-"}
                    </span>
                  </div>
                  <div className='text-xs'>
                    <span className='text-gray-600'>Date of Issue: </span>
                    <span className='font-medium'>
                      {selectedAwbDetails.dateOfIssue
                        ? new Date(
                            selectedAwbDetails.dateOfIssue
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cargo Information */}
            <Card>
              <CardHeader className='py-3 px-4'>
                <CardTitle className='text-sm font-medium'>
                  Cargo Information
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0 px-4 pb-3'>
                <div className='grid grid-cols-4 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {selectedAwbDetails.noOfPackages || 0}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>Packages</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {selectedAwbDetails.grossWeight?.toFixed(2) || "0.00"}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Gross Weight (kg)
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-orange-600'>
                      {selectedAwbDetails.netWeight?.toFixed(2) || "0.00"}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Net Weight (kg)
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {selectedAwbDetails.volumeCbm?.toFixed(2) || "0.00"}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Volume (CBM)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Marks and Notes */}
            {(selectedAwbDetails.marksAndCargoNo ||
              selectedAwbDetails.awbNotes) && (
              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3 space-y-2'>
                  {selectedAwbDetails.marksAndCargoNo && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-1'>
                        Marks & Cargo Numbers
                      </h4>
                      <p className='text-xs text-gray-600 whitespace-pre-wrap'>
                        {selectedAwbDetails.marksAndCargoNo}
                      </p>
                    </div>
                  )}
                  {selectedAwbDetails.awbNotes && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-1'>
                        AWB Notes
                      </h4>
                      <p className='text-xs text-gray-600 whitespace-pre-wrap'>
                        {selectedAwbDetails.awbNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ULD/Equipment Information with NEW fields */}
            {selectedAwbDetails.equipments &&
              selectedAwbDetails.equipments.length > 0 && (
                <Card>
                  <CardHeader className='py-3 px-4'>
                    <CardTitle className='text-sm font-medium'>
                      ULD Details ({selectedAwbDetails.equipments.length} units)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0 px-4 pb-3'>
                    <div className='overflow-x-auto'>
                      <table className='w-full text-xs'>
                        <thead>
                          <tr className='border-b bg-gray-50'>
                            <th className='text-left py-2 px-2'>ULD Number</th>
                            <th className='text-left py-2 px-2'>Packages</th>
                            <th className='text-left py-2 px-2'>Gross Wt</th>
                            <th className='text-left py-2 px-2'>Net Wt</th>
                            <th className='text-left py-2 px-2'>Vol (CBM)</th>
                            <th className='text-left py-2 px-2'>Dimensions</th>
                            <th className='text-left py-2 px-2'>Free Days</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAwbDetails.equipments.map((eq, index) => (
                            <tr
                              key={eq.awbEquipmentId}
                              className='border-b hover:bg-gray-50'
                            >
                              <td className='py-2 px-2'>{eq.uldNumber}</td>
                              <td className='py-2 px-2'>
                                {eq.packageCount || 0}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.grossWeight?.toFixed(2)} kg
                              </td>
                              <td className='py-2 px-2'>
                                {eq.netWeight?.toFixed(2)} kg
                              </td>
                              <td className='py-2 px-2'>
                                {eq.volumeCbm?.toFixed(2) || "0.00"}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.dimensions || "N/A"}
                              </td>
                              <td className='py-2 px-2'>{eq.freeDays || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                        selectedAwbDetails.status
                      )}`}
                    >
                      {selectedAwbDetails.status}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Created: </span>
                    <span className='font-medium'>
                      {selectedAwbDetails.createdAt
                        ? new Date(
                            selectedAwbDetails.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Updated: </span>
                    <span className='font-medium'>
                      {selectedAwbDetails.updatedAt
                        ? new Date(
                            selectedAwbDetails.updatedAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Version: </span>
                    <span className='font-medium'>
                      {selectedAwbDetails.version || "1"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => generateAWBPDF(selectedAwbDetails!)}
            className='flex items-center gap-2'
          >
            <FiPrinter className='h-4 w-4' />
            Print AWB
          </Button>
          <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const AwbStatsPage = () => {
    const stats = getAwbStats();

    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            AWB Statistics
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
                Total AWBs
              </CardTitle>
              <div className='text-2xl font-bold text-blue-900 mt-1'>
                {stats.totalAwbs}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>
                {stats.issuedAwbs} issued • {stats.draftAwbs} draft
              </div>
            </CardContent>
          </Card>

          <Card className='border border-green-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-green-700 uppercase tracking-wide'>
                Total Packages
              </CardTitle>
              <div className='text-2xl font-bold text-green-900 mt-1'>
                {stats.totalPackages}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Across all AWBs</div>
            </CardContent>
          </Card>

          <Card className='border border-orange-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-orange-700 uppercase tracking-wide'>
                Total Weight
              </CardTitle>
              <div className='text-2xl font-bold text-orange-900 mt-1'>
                {stats.totalWeight.toFixed(2)}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Kilograms</div>
            </CardContent>
          </Card>

          <Card className='border border-purple-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-purple-700 uppercase tracking-wide'>
                Total Volume
              </CardTitle>
              <div className='text-2xl font-bold text-purple-900 mt-1'>
                {stats.totalVolume.toFixed(2)}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Cubic Meters</div>
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
            <div className='grid grid-cols-4 gap-2'>
              {[
                {
                  status: "DRAFT",
                  count: stats.draftAwbs,
                  color: "bg-gray-100 text-gray-800",
                },
                {
                  status: "ISSUED",
                  count: stats.issuedAwbs,
                  color: "bg-blue-100 text-blue-800",
                },
                {
                  status: "MANIFESTED",
                  count: stats.manifestedAwbs,
                  color: "bg-purple-100 text-purple-800",
                },
                {
                  status: "DEPARTED",
                  count: stats.departedAwbs,
                  color: "bg-orange-100 text-orange-800",
                },
                {
                  status: "ARRIVED",
                  count: stats.arrivedAwbs,
                  color: "bg-green-100 text-green-800",
                },
                {
                  status: "DELIVERED",
                  count: stats.deliveredAwbs,
                  color: "bg-teal-100 text-teal-800",
                },
                {
                  status: "CANCELLED",
                  count: stats.cancelledAwbs,
                  color: "bg-red-100 text-red-800",
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
              setSelectedAwb(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' />
            Back to AWB List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <AwbForm
              type={selectedAwb ? "edit" : "add"}
              defaultState={selectedAwb || {}}
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
              Air Waybill Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Manage Master Air Waybills (MAWB) and House Air Waybills (HAWB)
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={fetchAirWaybills}
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
                setSelectedAwb(null);
                setShowForm(true);
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' />
              Add New AWB
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
                  placeholder='Search by MAWB, HAWB, Job, Airline, Flight...'
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
              {activeTab === "ALL_AWB" && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-[180px] h-9 text-sm'>
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
          defaultValue='ALL_AWB'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='grid w-full grid-cols-9 gap-1 bg-transparent h-auto p-0'>
              <TabsTrigger
                value='ALL_AWB'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiPackage className='w-3.5 h-3.5 mr-1.5' />
                All ({data.length})
              </TabsTrigger>
              <TabsTrigger
                value='DRAFT'
                className='text-xs py-2 px-3 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiClock className='w-3.5 h-3.5 mr-1.5' />
                Draft ({getAwbStats().draftAwbs})
              </TabsTrigger>
              <TabsTrigger
                value='ISSUED'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Issued ({getAwbStats().issuedAwbs})
              </TabsTrigger>
              <TabsTrigger
                value='MANIFESTED'
                className='text-xs py-2 px-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiBox className='w-3.5 h-3.5 mr-1.5' />
                Manifested ({getAwbStats().manifestedAwbs})
              </TabsTrigger>
              <TabsTrigger
                value='DEPARTED'
                className='text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiTruck className='w-3.5 h-3.5 mr-1.5' />
                Departed ({getAwbStats().departedAwbs})
              </TabsTrigger>
              <TabsTrigger
                value='ARRIVED'
                className='text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Arrived ({getAwbStats().arrivedAwbs})
              </TabsTrigger>
              <TabsTrigger
                value='DELIVERED'
                className='text-xs py-2 px-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Delivered ({getAwbStats().deliveredAwbs})
              </TabsTrigger>
              <TabsTrigger
                value='CANCELLED'
                className='text-xs py-2 px-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiAlertCircle className='w-3.5 h-3.5 mr-1.5' />
                Cancelled ({getAwbStats().cancelledAwbs})
              </TabsTrigger>
              <TabsTrigger
                value='STATISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiFilePlus className='w-3.5 h-3.5 mr-1.5' />
                Statistics
              </TabsTrigger>
            </TabsList>
          </div>

          {[
            "ALL_AWB",
            "DRAFT",
            "ISSUED",
            "MANIFESTED",
            "DEPARTED",
            "ARRIVED",
            "DELIVERED",
            "CANCELLED",
          ].map((tab) => (
            <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
              <div className='bg-white rounded-lg shadow-sm border'>
                {currentTabData.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16'>
                    <div className='text-center'>
                      <FiTruck className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                      <h3 className='text-base font-medium text-gray-900'>
                        No air waybills found
                      </h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        {searchText || statusFilter !== "ALL"
                          ? "Try adjusting your search or filter terms"
                          : "Add your first air waybill using the button above"}
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
              <AwbStatsPage />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isLoading && <AppLoader />}
      <ViewAWBDialog />
    </div>
  );
}
