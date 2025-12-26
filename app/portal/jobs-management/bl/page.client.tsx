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
import BlForm from "@/views/forms/job-order-forms/bl-form-stepwise";

type BlMasterPageProps = {
  initialData?: any[];
};

// Updated BlMaster type with ALL new fields
type BlMaster = {
  blMasterId: number;
  companyId: number;
  //jobId: number;
  mblNumber: string;
  hblNumber: string;
  blDate: string;
  shipperPartyId: number;
  consigneePartyId: number;
  notifyPartyId: number;
  noOfPackages: number;
  grossWeight: number;
  netWeight: number;
  volumeCbm: number;
  polId?: number;
  podId?: number;
  vesselName?: string;
  voyage?: string;
  forwardingAgentId?: number;
  freightType?: string;
  movement?: string;
  blCurrencyId?: number;
  placeOfIssueId?: number;
  dateOfIssue?: string;
  marksAndContainersNo?: string;
  blNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  // Display names
  shipperName?: string;
  consigneeName?: string;
  notifyName?: string;
  //jobNumber?: string;
  polName?: string;
  podName?: string;
  forwardingAgentName?: string;
  currencyName?: string;
  placeOfIssueName?: string;
  equipments?: BlEquipment[];
};

// Updated BlEquipment type with ALL new fields
type BlEquipment = {
  blEquipmentId: number;
  blMasterId: number;
  containerNo: string;
  volumeCbm: number;
  containerTypeId: number;
  containerSizeId: number;
  sealNo: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  descriptionOfGoods?: string;
  hsCodes?: string;
  freeDays: number;
  afterFreeDaysTarrifAmount: number;
  afterFreeDaysTarrifAmountLC: number;
  tarrifCurrencyId?: number;
  createdAt: string;
  version: number;
  containerTypeName?: string;
  containerSizeName?: string;
  tarrifCurrencyName?: string;
};

// Updated field configuration for Bill of Lading
const blFieldConfig = [
  {
    fieldName: "blMasterId",
    displayName: "BL ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "companyId",
    displayName: "Company ID",
    isdisplayed: false,
    isselected: true,
  },
  /*{
    fieldName: "jobId",
    displayName: "Job ID",
    isdisplayed: false,
    isselected: true,
  },*/
  /*{
    fieldName: "jobNumber",
    displayName: "Job Number",
    isdisplayed: true,
    isselected: true,
  },*/
  {
    fieldName: "mblNumber",
    displayName: "MBL Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "hblNumber",
    displayName: "HBL Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "blDate",
    displayName: "BL Date",
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
    fieldName: "polId",
    displayName: "POL ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "polName",
    displayName: "Port of Loading",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "podId",
    displayName: "POD ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "podName",
    displayName: "Port of Discharge",
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
    fieldName: "voyage",
    displayName: "Voyage",
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
    fieldName: "blCurrencyId",
    displayName: "Currency ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "currencyName",
    displayName: "BL Currency",
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
    fieldName: "marksAndContainersNo",
    displayName: "Marks & Container No",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "blNotes",
    displayName: "BL Notes",
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

// Updated equipment field configuration
const equipmentFieldConfig = [
  {
    fieldName: "blEquipmentId",
    displayName: "Equipment ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "blMasterId",
    displayName: "BL ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "containerNo",
    displayName: "Container No",
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
    fieldName: "containerTypeId",
    displayName: "Type ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "containerTypeName",
    displayName: "Container Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "containerSizeId",
    displayName: "Size ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "containerSizeName",
    displayName: "Container Size",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "sealNo",
    displayName: "Seal No",
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
    fieldName: "tareWeight",
    displayName: "Tare Weight",
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
    fieldName: "afterFreeDaysTarrifAmount",
    displayName: "Tarrif Amount",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "afterFreeDaysTarrifAmountLC",
    displayName: "Tarrif Amount LC",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "tarrifCurrencyId",
    displayName: "Tarrif Currency ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "tarrifCurrencyName",
    displayName: "Tarrif Currency",
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
    fieldName: "version",
    displayName: "Version",
    isdisplayed: false,
    isselected: true,
  },
];

export default function BillOfLadingPage({ initialData }: BlMasterPageProps) {
  const [data, setData] = useState<BlMaster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedBl, setSelectedBl] = useState<BlMaster | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_BL");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBlDetails, setSelectedBlDetails] = useState<BlMaster | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState("ALL");
  const router = useRouter();
  const { toast } = useToast();

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "ISSUED", label: "Issued" },
    { value: "SURRENDERED", label: "Surrendered" },
    { value: "AMENDED", label: "Amended" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Fetch B/L data with ALL new fields
  const fetchBillOfLadings = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Bl/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "BlMasterId,CompanyId,MblNumber,HblNumber,BlDate,ShipperPartyId,ConsigneePartyId,NotifyPartyId,NoOfPackages,GrossWeight,NetWeight,VolumeCbm,POLId,PODId,VesselName,Voyage,ForwardingAgentId,FreightType,Movement,BLCurrencyId,PlaceOfIssueId,DateOfIssue,MarksAndContainersNo,BLNotes,Status,CreatedAt,UpdatedAt,Version",
          where: "",
          sortOn: "BlDate DESC",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const blData = await response.json();

        const enrichedData = await Promise.all(
          blData.map(async (bl: BlMaster) => {
            try {
              // Fetch job details
              /*let jobNumber = `JOB-${bl.jobId}`;
              if (bl.jobId) {
                try {
                  const jobResponse = await fetch(`${baseUrl}Job/${bl.jobId}`);
                  if (jobResponse.ok) {
                    const jobData = await jobResponse.json();
                    jobNumber = jobData.jobNumber || jobNumber;
                  }
                } catch (err) {
                  console.error(`Error fetching job ${bl.jobId}:`, err);
                }
              }*/

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
                shipperData,
                consigneeData,
                notifyData,
                forwardingAgentData,
              ] = await Promise.all([
                fetchParty(bl.shipperPartyId),
                fetchParty(bl.consigneePartyId),
                fetchParty(bl.notifyPartyId),
                bl.forwardingAgentId
                  ? fetchParty(bl.forwardingAgentId)
                  : Promise.resolve(null),
              ]);

              // Fetch location details
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

              const [polData, podData, placeOfIssueData] = await Promise.all([
                bl.polId ? fetchLocation(bl.polId) : Promise.resolve(null),
                bl.podId ? fetchLocation(bl.podId) : Promise.resolve(null),
                bl.placeOfIssueId
                  ? fetchLocation(bl.placeOfIssueId)
                  : Promise.resolve(null),
              ]);

              // Fetch currency details
              let currencyName = null;
              if (bl.blCurrencyId) {
                try {
                  const currencyResponse = await fetch(
                    `${baseUrl}Currency/${bl.blCurrencyId}`
                  );
                  if (currencyResponse.ok) {
                    const currencyData = await currencyResponse.json();
                    currencyName =
                      currencyData.currencyCode || currencyData.currencyName;
                  }
                } catch (err) {
                  console.error(
                    `Error fetching currency ${bl.blCurrencyId}:`,
                    err
                  );
                }
              }

              // Equipment will be loaded on-demand when viewing details
              let equipments: BlEquipment[] = [];

              return {
                ...bl,
                //jobNumber,
                shipperName: shipperData?.partyName || "N/A",
                consigneeName: consigneeData?.partyName || "N/A",
                notifyName: notifyData?.partyName || "N/A",
                forwardingAgentName: forwardingAgentData?.partyName || null,
                polName: polData
                  ? `${polData.uncode} - ${polData.locationName}`
                  : null,
                podName: podData
                  ? `${podData.uncode} - ${podData.locationName}`
                  : null,
                placeOfIssueName: placeOfIssueData
                  ? `${placeOfIssueData.uncode} - ${placeOfIssueData.locationName}`
                  : null,
                currencyName,
                equipments,
              };
            } catch (error) {
              console.error(`Error enriching BL ${bl.blMasterId}:`, error);
              return bl;
            }
          })
        );

        setData(enrichedData);
        toast({
          title: "Success",
          description: "Bill of Ladings loaded successfully",
        });
      } else {
        throw new Error("Failed to fetch bill of ladings");
      }
    } catch (error) {
      console.error("Error fetching bill of ladings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bill of ladings list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillOfLadings();
  }, []);

  const searchInItem = (item: BlMaster, searchTerm: string) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const searchableFields = [
      item.mblNumber?.toString(),
      item.hblNumber?.toString(),
      //item.jobNumber?.toString(),
      item.shipperName?.toString(),
      item.consigneeName?.toString(),
      item.notifyName?.toString(),
      item.vesselName?.toString(),
      item.voyage?.toString(),
      item.status?.toString(),
    ];
    return searchableFields.some(
      (field) => field && field.toLowerCase().includes(searchLower)
    );
  };

  const filterByStatus = (bl: BlMaster) => {
    if (statusFilter === "ALL") return true;
    return bl.status === statusFilter;
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
      case "SURRENDERED":
        tabData = data.filter((item) => item.status === "SURRENDERED");
        break;
      case "AMENDED":
        tabData = data.filter((item) => item.status === "AMENDED");
        break;
      case "CANCELLED":
        tabData = data.filter((item) => item.status === "CANCELLED");
        break;
    }

    tabData = tabData.filter((item) => searchInItem(item, searchText));

    if (activeTab === "ALL_BL") {
      tabData = tabData.filter(filterByStatus);
    }

    return tabData;
  };

  const getBlStats = () => {
    const allBls = data;
    return {
      totalBls: allBls.length,
      draftBls: allBls.filter((item) => item.status === "DRAFT").length,
      issuedBls: allBls.filter((item) => item.status === "ISSUED").length,
      surrenderedBls: allBls.filter((item) => item.status === "SURRENDERED")
        .length,
      amendedBls: allBls.filter((item) => item.status === "AMENDED").length,
      cancelledBls: allBls.filter((item) => item.status === "CANCELLED").length,
      totalPackages: allBls.reduce(
        (sum, item) => sum + (item.noOfPackages || 0),
        0
      ),
      totalWeight: allBls.reduce(
        (sum, item) => sum + (item.grossWeight || 0),
        0
      ),
      totalVolume: allBls.reduce((sum, item) => sum + (item.volumeCbm || 0), 0),
    };
  };

  const handleAddEditComplete = (updatedItem: any) => {
    setShowForm(false);
    setSelectedBl(null);
    fetchBillOfLadings();
  };

  const handleDelete = async (item: BlMaster) => {
    if (
      confirm(
        `Are you sure you want to delete BL "${
          item.mblNumber || item.hblNumber
        }"?`
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Bl/${item.blMasterId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev) =>
            prev.filter((record) => record.blMasterId !== item.blMasterId)
          );
          toast({
            title: "Success",
            description: "Bill of Lading deleted successfully",
          });
        } else {
          throw new Error("Failed to delete Bill of Lading");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete Bill of Lading",
        });
        console.error("Error deleting Bill of Lading:", error);
      }
    }
  };

  // Fetch complete BL details with equipment using the detail API
  const fetchBlDetails = async (blMasterId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Bl/${blMasterId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch BL details");
      }

      const blDetailData = await response.json();

      // Enrich equipment data with display names
      if (blDetailData.blEquipments && blDetailData.blEquipments.length > 0) {
        const enrichedEquipments = await Promise.all(
          blDetailData.blEquipments.map(async (eq: any) => {
            try {
              // Fetch container type name
              let containerTypeName = null;
              if (eq.containerTypeId) {
                const typeResponse = await fetch(
                  `${baseUrl}ContainerType/${eq.containerTypeId}`
                );
                if (typeResponse.ok) {
                  const typeData = await typeResponse.json();
                  containerTypeName =
                    typeData.containerTypeName || typeData.containerType;
                }
              }

              // Fetch container size name
              let containerSizeName = null;
              if (eq.containerSizeId) {
                const sizeResponse = await fetch(
                  `${baseUrl}ContainerSize/${eq.containerSizeId}`
                );
                if (sizeResponse.ok) {
                  const sizeData = await sizeResponse.json();
                  containerSizeName =
                    sizeData.containerSizeName || sizeData.containerSize;
                }
              }

              // Fetch tariff currency name
              let tarrifCurrencyName = null;
              if (eq.tarrifCurrencyId) {
                const currencyResponse = await fetch(
                  `${baseUrl}Currency/${eq.tarrifCurrencyId}`
                );
                if (currencyResponse.ok) {
                  const currencyData = await currencyResponse.json();
                  tarrifCurrencyName =
                    currencyData.currencyCode || currencyData.currencyName;
                }
              }

              return {
                ...eq,
                containerTypeName,
                containerSizeName,
                tarrifCurrencyName,
              };
            } catch (err) {
              console.error("Error enriching equipment:", err);
              return eq;
            }
          })
        );
        blDetailData.equipments = enrichedEquipments;
      } else {
        blDetailData.equipments = [];
      }

      // Get display names from the list data
      const listItem = data.find((item) => item.blMasterId === blMasterId);

      return {
        ...blDetailData,
        shipperName: listItem?.shipperName,
        consigneeName: listItem?.consigneeName,
        notifyName: listItem?.notifyName,
        forwardingAgentName: listItem?.forwardingAgentName,
        polName: listItem?.polName,
        podName: listItem?.podName,
        placeOfIssueName: listItem?.placeOfIssueName,
        currencyName: listItem?.currencyName,
      };
    } catch (error) {
      console.error("Error fetching BL details:", error);
      throw error;
    }
  };

  // Handle viewing BL details
  const handleViewDetails = async (bl: BlMaster) => {
    try {
      const blDetails = await fetchBlDetails(bl.blMasterId);
      setSelectedBlDetails(blDetails);
      setViewDialogOpen(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load BL details",
      });
    }
  };

  // Handle edit - fetch complete data including equipment
  const handleEdit = async (bl: BlMaster) => {
    try {
      setIsLoading(true);
      const blDetails = await fetchBlDetails(bl.blMasterId);
      setSelectedBl(blDetails);
      setShowForm(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load BL for editing",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle duplicate - fetch complete data and reset IDs for new record
  const handleDuplicate = async (bl: BlMaster) => {
    try {
      setIsLoading(true);
      const blDetails = await fetchBlDetails(bl.blMasterId);

      // Create duplicate with reset IDs and modified numbers
      const duplicateBl = {
        ...blDetails,
        blMasterId: 0, // Reset ID for new record
        mblNumber: `${blDetails.mblNumber}-COPY`,
        hblNumber: blDetails.hblNumber ? `${blDetails.hblNumber}-COPY` : "",
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 0,
        // Reset equipment IDs for new record
        equipments:
          blDetails.equipments?.map((eq: BlEquipment) => ({
            ...eq,
            blEquipmentId: 0,
            blMasterId: 0,
            createdAt: new Date().toISOString(),
            version: 0,
          })) || [],
      };

      setSelectedBl(duplicateBl);
      setShowForm(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate BL",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExcelWithData = (dataToExport: BlMaster[], tabName: string) => {
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

      const headers = blFieldConfig
        .filter((field) => field.isdisplayed && field.isselected)
        .map((field) => field.displayName);
      worksheet.addRow(headers);

      dataToExport.forEach((bl) => {
        const row = blFieldConfig
          .filter((field) => field.isdisplayed && field.isselected)
          .map((field) => {
            const value = (bl as any)[field.fieldName];

            if (
              field.fieldName === "blDate" ||
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
          `${tabName}_BillOfLading_${moment().format("YYYY-MM-DD")}.xlsx`
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

  const downloadPDFWithData = (dataToExport: BlMaster[], tabName: string) => {
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
      doc.text(`${tabName} - Bill of Lading Report`, 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${dataToExport.length}`, 20, 37);

      const tableHeaders = [
        "MBL No",
        "HBL No",
        "BL Date",
        "Vessel",
        "Voyage",
        "POL",
        "POD",
        "Status",
      ];
      const tableData = dataToExport.map((item) => [
        item.mblNumber?.toString() || "N/A",
        item.hblNumber?.toString() || "N/A",
        item.blDate ? new Date(item.blDate).toLocaleDateString() : "N/A",
        (item.vesselName?.toString() || "N/A").substring(0, 15),
        (item.voyage?.toString() || "N/A").substring(0, 10),
        (item.polName?.toString() || "N/A").substring(0, 15),
        (item.podName?.toString() || "N/A").substring(0, 15),
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

      doc.save(`${tabName}_BillOfLading_${moment().format("YYYY-MM-DD")}.pdf`);
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

  const generateBLPDF = (bl: BlMaster) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(40, 116, 166);
    doc.text("BILL OF LADING", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Original`, 20, 35);
    doc.text(
      `BL Date: ${
        bl.blDate ? new Date(bl.blDate).toLocaleDateString() : "N/A"
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
    doc.text(bl.shipperName || "N/A", 20, 57);

    // Consignee
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("CONSIGNEE", 20, 70);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(bl.consigneeName || "N/A", 20, 77);

    // Notify Party
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("NOTIFY PARTY", 20, 90);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(bl.notifyName || "N/A", 20, 97);

    // BL Numbers & Vessel Info
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("BL INFORMATION", 110, 50);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`MBL: ${bl.mblNumber || "N/A"}`, 110, 57);
    doc.text(`HBL: ${bl.hblNumber || "N/A"}`, 110, 64);
    doc.text(`Vessel: ${bl.vesselName || "N/A"}`, 110, 71);
    doc.text(`Voyage: ${bl.voyage || "N/A"}`, 110, 78);

    // Routing
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("ROUTING", 20, 110);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`POL: ${bl.polName || "N/A"}`, 20, 117);
    doc.text(`POD: ${bl.podName || "N/A"}`, 20, 124);
    doc.text(`Freight: ${bl.freightType || "N/A"}`, 20, 131);
    doc.text(`Movement: ${bl.movement || "N/A"}`, 20, 138);

    // Cargo Details
    doc.setFontSize(12);
    doc.setTextColor(40, 116, 166);
    doc.text("CARGO DETAILS", 20, 151);

    const cargoData = [
      ["Description", "Value"],
      ["No. of Packages", bl.noOfPackages?.toString() || "0"],
      ["Gross Weight", `${bl.grossWeight?.toFixed(2) || "0"} kg`],
      ["Net Weight", `${bl.netWeight?.toFixed(2) || "0"} kg`],
      ["Volume", `${bl.volumeCbm?.toFixed(2) || "0"} CBM`],
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
    if (bl.equipments && bl.equipments.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 170;

      doc.setFontSize(12);
      doc.setTextColor(40, 116, 166);
      doc.text("EQUIPMENT DETAILS", 20, finalY + 10);

      const equipHeaders = [
        "Container No",
        "Type",
        "Size",
        "Seal No",
        "Volume",
        "Free Days",
        "Tarrif",
      ];
      const equipData = bl.equipments.map((eq) => [
        eq.containerNo || "N/A",
        eq.containerTypeName || "N/A",
        eq.containerSizeName || "N/A",
        eq.sealNo || "N/A",
        `${eq.volumeCbm?.toFixed(2) || "0"} CBM`,
        eq.freeDays?.toString() || "0",
        `${eq.afterFreeDaysTarrifAmount?.toFixed(2) || "0"}`,
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
    doc.text(`Status: ${bl.status}`, 160, finalY + 10);

    doc.save(
      `BL_${bl.mblNumber || bl.blMasterId}_${moment().format("YYYY-MM-DD")}.pdf`
    );
    toast({
      title: "Success",
      description: "BL document generated successfully",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ISSUED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SURRENDERED":
        return "bg-green-50 text-green-700 border-green-200";
      case "AMENDED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const columns: ColumnDef<BlMaster>[] = [
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
                  onClick={() => handleEdit(row.original)}
                >
                  <FiEdit size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Edit BL</p>
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
                <p className='text-xs'>Duplicate BL</p>
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
                <p className='text-xs'>Delete BL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors'
                  onClick={() => generateBLPDF(row.original)}
                >
                  <FiPrinter size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Print BL</p>
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
      accessorKey: "mblNumber",
      header: "MBL Number",
      cell: ({ row }) => (
        <div className='font-semibold text-sm text-gray-900'>
          <div>{row.getValue("mblNumber") || "-"}</div>
          {row.original.hblNumber && (
            <div className='text-xs text-gray-500 mt-0.5'>
              HBL: {row.original.hblNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "blDate",
      header: "BL Date",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {row.getValue("blDate")
            ? new Date(row.getValue("blDate")).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "vesselVoyage",
      header: "Vessel / Voyage",
      cell: ({ row }) => (
        <div className='text-sm text-gray-700'>
          <div className='font-medium'>{row.original.vesselName || "-"}</div>
          {row.original.voyage && (
            <div className='text-xs text-gray-500 mt-0.5'>
              V: {row.original.voyage}
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
          <div>POL: {row.original.polName?.split(" - ")[0] || "-"}</div>
          <div className='mt-0.5'>
            POD: {row.original.podName?.split(" - ")[0] || "-"}
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
            {status === "ISSUED" && <FiCheckCircle className='mr-1 h-3 w-3' />}
            {status === "CANCELLED" && (
              <FiAlertCircle className='mr-1 h-3 w-3' />
            )}
            {status}
          </span>
        );
      },
    },
  ];

  // View BL Details Dialog with ALL new fields
  const ViewBLDialog = () => (
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FiEye className='h-5 w-5' />
            Bill of Lading Details
          </DialogTitle>
          <DialogDescription>
            Complete details for BL{" "}
            {selectedBlDetails?.mblNumber || selectedBlDetails?.hblNumber}
          </DialogDescription>
        </DialogHeader>

        {selectedBlDetails && (
          <div className='space-y-4'>
            {/* Basic BL Information */}
            <div className='grid grid-cols-2 gap-4'>
              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    BL Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3'>
                  <div className='space-y-1.5 text-xs'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>MBL Number:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.mblNumber || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>HBL Number:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.hblNumber || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>BL Date:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.blDate
                          ? new Date(
                              selectedBlDetails.blDate
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Currency:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.currencyName || "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    Vessel & Routing
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3'>
                  <div className='space-y-1.5 text-xs'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Vessel:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.vesselName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Voyage:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.voyage || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>POL:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.polName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>POD:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.podName || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Freight Type:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.freightType || "-"}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Movement:</span>
                      <span className='font-medium'>
                        {selectedBlDetails.movement || "-"}
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
                      {selectedBlDetails.shipperName || "-"}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                      Consignee
                    </h4>
                    <p className='text-sm'>
                      {selectedBlDetails.consigneeName || "-"}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                      Notify Party
                    </h4>
                    <p className='text-sm'>
                      {selectedBlDetails.notifyName || "-"}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                      Forwarding Agent
                    </h4>
                    <p className='text-sm'>
                      {selectedBlDetails.forwardingAgentName || "-"}
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
                      {selectedBlDetails.placeOfIssueName || "-"}
                    </span>
                  </div>
                  <div className='text-xs'>
                    <span className='text-gray-600'>Date of Issue: </span>
                    <span className='font-medium'>
                      {selectedBlDetails.dateOfIssue
                        ? new Date(
                            selectedBlDetails.dateOfIssue
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
                      {selectedBlDetails.noOfPackages || 0}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>Packages</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {selectedBlDetails.grossWeight?.toFixed(2) || "0.00"}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Gross Weight (kg)
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-orange-600'>
                      {selectedBlDetails.netWeight?.toFixed(2) || "0.00"}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Net Weight (kg)
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {selectedBlDetails.volumeCbm?.toFixed(2) || "0.00"}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Volume (CBM)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Marks and Notes */}
            {(selectedBlDetails.marksAndContainersNo ||
              selectedBlDetails.blNotes) && (
              <Card>
                <CardHeader className='py-3 px-4'>
                  <CardTitle className='text-sm font-medium'>
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0 px-4 pb-3 space-y-2'>
                  {selectedBlDetails.marksAndContainersNo && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-1'>
                        Marks & Container Numbers
                      </h4>
                      <p className='text-xs text-gray-600 whitespace-pre-wrap'>
                        {selectedBlDetails.marksAndContainersNo}
                      </p>
                    </div>
                  )}
                  {selectedBlDetails.blNotes && (
                    <div>
                      <h4 className='text-xs font-semibold text-gray-700 mb-1'>
                        BL Notes
                      </h4>
                      <p className='text-xs text-gray-600 whitespace-pre-wrap'>
                        {selectedBlDetails.blNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Equipment Information with NEW fields */}
            {selectedBlDetails.equipments &&
              selectedBlDetails.equipments.length > 0 && (
                <Card>
                  <CardHeader className='py-3 px-4'>
                    <CardTitle className='text-sm font-medium'>
                      Equipment Details ({selectedBlDetails.equipments.length}{" "}
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
                            <th className='text-left py-2 px-2'>Vol (CBM)</th>
                            <th className='text-left py-2 px-2'>Gross Wt</th>
                            <th className='text-left py-2 px-2'>Net Wt</th>
                            <th className='text-left py-2 px-2'>Free Days</th>
                            <th className='text-left py-2 px-2'>Tarrif</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBlDetails.equipments.map((eq, index) => (
                            <tr
                              key={eq.blEquipmentId}
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
                                {eq.volumeCbm?.toFixed(2) || "0.00"}
                              </td>
                              <td className='py-2 px-2'>
                                {eq.grossWeight?.toFixed(2)} kg
                              </td>
                              <td className='py-2 px-2'>
                                {eq.netWeight?.toFixed(2)} kg
                              </td>
                              <td className='py-2 px-2'>{eq.freeDays || 0}</td>
                              <td className='py-2 px-2'>
                                {eq.afterFreeDaysTarrifAmount?.toFixed(2) ||
                                  "0.00"}
                              </td>
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
                        selectedBlDetails.status
                      )}`}
                    >
                      {selectedBlDetails.status}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Created: </span>
                    <span className='font-medium'>
                      {selectedBlDetails.createdAt
                        ? new Date(
                            selectedBlDetails.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Updated: </span>
                    <span className='font-medium'>
                      {selectedBlDetails.updatedAt
                        ? new Date(
                            selectedBlDetails.updatedAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-600'>Version: </span>
                    <span className='font-medium'>
                      {selectedBlDetails.version || "1"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => generateBLPDF(selectedBlDetails!)}
            className='flex items-center gap-2'
          >
            <FiPrinter className='h-4 w-4' />
            Print BL
          </Button>
          <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const BlStatsPage = () => {
    const stats = getBlStats();

    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>BL Statistics</h2>
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
                Total B/Ls
              </CardTitle>
              <div className='text-2xl font-bold text-blue-900 mt-1'>
                {stats.totalBls}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>
                {stats.issuedBls} issued • {stats.draftBls} draft
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
              <div className='text-xs text-gray-600'>Across all B/Ls</div>
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
            <div className='grid grid-cols-5 gap-2'>
              {[
                {
                  status: "DRAFT",
                  count: stats.draftBls,
                  color: "bg-gray-100 text-gray-800",
                },
                {
                  status: "ISSUED",
                  count: stats.issuedBls,
                  color: "bg-blue-100 text-blue-800",
                },
                {
                  status: "SURRENDERED",
                  count: stats.surrenderedBls,
                  color: "bg-green-100 text-green-800",
                },
                {
                  status: "AMENDED",
                  count: stats.amendedBls,
                  color: "bg-yellow-100 text-yellow-800",
                },
                {
                  status: "CANCELLED",
                  count: stats.cancelledBls,
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
              setSelectedBl(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' />
            Back to B/L List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <BlForm
              type={selectedBl && selectedBl.blMasterId > 0 ? "edit" : "add"}
              defaultState={selectedBl || {}}
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
              Bill of Lading Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Manage Master Bills of Lading (MBL) and House Bills of Lading
              (HBL)
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={fetchBillOfLadings}
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
                setSelectedBl(null);
                setShowForm(true);
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5'
            >
              <FiFilePlus className='h-3.5 w-3.5' />
              Add New B/L
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
                  placeholder='Search by MBL, HBL, Vessel...'
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
              {activeTab === "ALL_BL" && (
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
          defaultValue='ALL_BL'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='grid w-full grid-cols-7 gap-1 bg-transparent h-auto p-0'>
              <TabsTrigger
                value='ALL_BL'
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
                Draft ({getBlStats().draftBls})
              </TabsTrigger>
              <TabsTrigger
                value='ISSUED'
                className='text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Issued ({getBlStats().issuedBls})
              </TabsTrigger>
              <TabsTrigger
                value='SURRENDERED'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />
                Surrendered ({getBlStats().surrenderedBls})
              </TabsTrigger>
              <TabsTrigger
                value='AMENDED'
                className='text-xs py-2 px-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiEdit className='w-3.5 h-3.5 mr-1.5' />
                Amended ({getBlStats().amendedBls})
              </TabsTrigger>
              <TabsTrigger
                value='CANCELLED'
                className='text-xs py-2 px-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiAlertCircle className='w-3.5 h-3.5 mr-1.5' />
                Cancelled ({getBlStats().cancelledBls})
              </TabsTrigger>
              <TabsTrigger
                value='STATISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiFilePlus className='w-3.5 h-3.5 mr-1.5' />
                Statistics
              </TabsTrigger>
            </TabsList>
          </div>

          {[
            "ALL_BL",
            "DRAFT",
            "ISSUED",
            "SURRENDERED",
            "AMENDED",
            "CANCELLED",
          ].map((tab) => (
            <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
              <div className='bg-white rounded-lg shadow-sm border'>
                {currentTabData.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-16'>
                    <div className='text-center'>
                      <FiPackage className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                      <h3 className='text-base font-medium text-gray-900'>
                        No bill of ladings found
                      </h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        {searchText || statusFilter !== "ALL"
                          ? "Try adjusting your search or filter terms"
                          : "Add your first bill of lading using the button above"}
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
              <BlStatsPage />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isLoading && <AppLoader />}
      <ViewBLDialog />
    </div>
  );
}
