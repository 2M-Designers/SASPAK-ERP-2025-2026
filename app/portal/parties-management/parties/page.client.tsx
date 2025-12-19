"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import PartiesForm from "@/views/forms/parties-form/parties-form-section";
import AppLoader from "@/components/app-loader";
import {
  FiTrash2,
  FiDownload,
  FiEdit,
  FiArrowLeft,
  FiChevronDown,
  FiChevronRight,
  FiFilePlus,
  FiUsers,
  FiBriefcase,
  FiTruck,
  FiRefreshCw,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import { useToast } from "@/hooks/use-toast";

type PartiesPageProps = {
  initialData?: any[];
};

// Static field configuration for Parties
const fieldConfig = [
  {
    fieldName: "partyId",
    displayName: "Party ID",
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
    fieldName: "partyCode",
    displayName: "Party Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "partyName",
    displayName: "Party Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "partyShortName",
    displayName: "Short Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isActive",
    displayName: "Status",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isGLLinked",
    displayName: "GL Linked",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isCustomer",
    displayName: "Customer",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isVendor",
    displayName: "Vendor",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isCustomerVendor",
    displayName: "Customer/Vendor",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isAgent",
    displayName: "Agent",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isOverseasAgent",
    displayName: "Overseas Agent",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isShippingLine",
    displayName: "Shipping Line",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isTransporter",
    displayName: "Transporter",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isConsignee",
    displayName: "Consignee",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isShipper",
    displayName: "Shipper",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isPrincipal",
    displayName: "Principal",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isNonGLParty",
    displayName: "Non-GL Party",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isInSeaImport",
    displayName: "Sea Import",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isInSeaExport",
    displayName: "Sea Export",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isInAirImport",
    displayName: "Air Import",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isInAirExport",
    displayName: "Air Export",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isInLogistics",
    displayName: "Logistics",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "unLocationId",
    displayName: "UN Location ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "addressLine1",
    displayName: "Address Line 1",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "addressLine2",
    displayName: "Address Line 2",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "postalCode",
    displayName: "Postal Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "phone",
    displayName: "Phone",
    isdisplayed: true,
    isselected: true,
  },
  { fieldName: "fax", displayName: "Fax", isdisplayed: true, isselected: true },
  {
    fieldName: "email",
    displayName: "Email",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "website",
    displayName: "Website",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonName",
    displayName: "Contact Person",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonDesignation",
    displayName: "Contact Designation",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonEmail",
    displayName: "Contact Email",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonPhone",
    displayName: "Contact Phone",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "ntnNumber",
    displayName: "NTN Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "strnNumber",
    displayName: "STRN Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "bankName",
    displayName: "Bank Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "bankAccountNumber",
    displayName: "Bank Account",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "ibanNumber",
    displayName: "IBAN Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "creditLimitLC",
    displayName: "Credit Limit LC",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "creditLimitFC",
    displayName: "Credit Limit FC",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "allowedCreditDays",
    displayName: "Credit Days",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "paymentTerms",
    displayName: "Payment Terms",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "glParentAccountId",
    displayName: "GL Parent Account",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "glAccountId",
    displayName: "GL Account",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "trackIdAllowed",
    displayName: "Track ID Allowed",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "idPasswordAllowed",
    displayName: "ID Password Allowed",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "sendEmail",
    displayName: "Send Email",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "canSeeBills",
    displayName: "Can See Bills",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "canSeeLedger",
    displayName: "Can See Ledger",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isProcessOwner",
    displayName: "Process Owner",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "clearanceByOps",
    displayName: "Clearance By Ops",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "clearanceByAcm",
    displayName: "Clearance By ACM",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "atTradeForGDInsustrial",
    displayName: "AT Trade GD Industrial",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "atTradeForGDCommercial",
    displayName: "AT Trade GD Commercial",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "benificiaryNameOfPO",
    displayName: "Beneficiary Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "salesRepId",
    displayName: "Sales Rep",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "docsRepId",
    displayName: "Docs Rep",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "accountsRepId",
    displayName: "Accounts Rep",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "createdBy",
    displayName: "Created By",
    isdisplayed: false,
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

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function PartiesPage({ initialData }: PartiesPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("ALL_PARTIES");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const router = useRouter();
  const { toast } = useToast();

  // Fetch parties data using POST method
  const fetchParties = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Parties/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select:
            "PartyId,PartyCode,PartyName,PartyShortName,IsActive,IsCustomer,IsVendor,IsAgent,IsShippingLine,IsTransporter,IsOverseasAgent,Email,Phone,ContactPersonName,CreditLimitLC,AllowedCreditDays",
          where: "",
          sortOn: "PartyName",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
        console.log("Parties data fetched successfully:", data);
      } else {
        throw new Error("Failed to fetch parties");
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load parties list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setData(initialData);
    } else {
      fetchParties();
    }
  }, []);

  // Enhanced search function
  const searchInItem = (item: any, searchTerm: string) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const searchableFields = [
      item.partyId?.toString(),
      item.partyCode?.toString(),
      item.partyName?.toString(),
      item.partyShortName?.toString(),
      item.email?.toString(),
      item.phone?.toString(),
      item.contactPersonName?.toString(),
      item.contactPersonEmail?.toString(),
      item.contactPersonPhone?.toString(),
      item.addressLine1?.toString(),
      item.addressLine2?.toString(),
      item.ntnNumber?.toString(),
      item.strnNumber?.toString(),
      item.bankName?.toString(),
    ];

    return searchableFields.some(
      (field) => field && field.toLowerCase().includes(searchLower)
    );
  };

  // Filter data for different tabs
  const getAllParties = () => data || [];
  const getActiveParties = () => data?.filter((item) => item.isActive) || [];
  const getCustomers = () => data?.filter((item) => item.isCustomer) || [];
  const getVendors = () => data?.filter((item) => item.isVendor) || [];
  const getAgents = () =>
    data?.filter((item) => item.isAgent || item.isOverseasAgent) || [];
  const getLogisticsParties = () =>
    data?.filter(
      (item) => item.isShippingLine || item.isTransporter || item.isInLogistics
    ) || [];

  // Calculate statistics
  const getPartiesStats = () => {
    const allParties = getAllParties();

    return {
      totalParties: allParties.length,
      activeParties: allParties.filter((item) => item.isActive).length,
      customers: allParties.filter((item) => item.isCustomer).length,
      vendors: allParties.filter((item) => item.isVendor).length,
      agents: allParties.filter((item) => item.isAgent || item.isOverseasAgent)
        .length,
      shippingLines: allParties.filter((item) => item.isShippingLine).length,
      transporters: allParties.filter((item) => item.isTransporter).length,
      seaImportParties: allParties.filter((item) => item.isInSeaImport).length,
      seaExportParties: allParties.filter((item) => item.isInSeaExport).length,
      airImportParties: allParties.filter((item) => item.isInAirImport).length,
      airExportParties: allParties.filter((item) => item.isInAirExport).length,
    };
  };

  // Get data for current tab with search filter
  const getCurrentTabData = () => {
    let tabData = [];
    switch (activeTab) {
      case "ALL_PARTIES":
        tabData = getAllParties();
        break;
      case "ACTIVE":
        tabData = getActiveParties();
        break;
      case "CUSTOMERS":
        tabData = getCustomers();
        break;
      case "VENDORS":
        tabData = getVendors();
        break;
      case "AGENTS":
        tabData = getAgents();
        break;
      case "LOGISTICS":
        tabData = getLogisticsParties();
        break;
      default:
        tabData = getAllParties();
    }

    return tabData.filter((item: any) => searchInItem(item, searchText));
  };

  // Group parties by type for categorized view
  const getGroupedParties = () => {
    const parties = getCurrentTabData();
    const grouped: Record<string, any[]> = {
      Customers: [],
      Vendors: [],
      Agents: [],
      "Shipping Lines": [],
      Transporters: [],
      "Other Parties": [],
    };

    parties.forEach((party: any) => {
      if (party.isCustomer) {
        grouped["Customers"].push(party);
      } else if (party.isVendor) {
        grouped["Vendors"].push(party);
      } else if (party.isAgent || party.isOverseasAgent) {
        grouped["Agents"].push(party);
      } else if (party.isShippingLine) {
        grouped["Shipping Lines"].push(party);
      } else if (party.isTransporter) {
        grouped["Transporters"].push(party);
      } else {
        grouped["Other Parties"].push(party);
      }
    });

    // Remove empty groups
    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  };

  const handleAddEditComplete = (updatedItem: any) => {
    setShowForm(false);
    setSelectedParty(null);
    // Refresh data by fetching again
    fetchParties();
  };

  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='text-blue-600 hover:text-blue-800'
                  onClick={() => {
                    setSelectedParty(row.original);
                    setShowForm(true);
                  }}
                >
                  <FiEdit size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Party</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='text-red-600 hover:text-red-800'
                  onClick={() => handleDelete(row.original)}
                >
                  <FiTrash2 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Party</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "row",
      header: "S.No",
      cell: ({ row }) => parseInt(row.id) + 1,
      enableColumnFilter: false,
    },
    {
      accessorKey: "partyCode",
      header: "Party Code",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("partyCode") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "partyName",
      header: "Party Name",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("partyName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "partyShortName",
      header: "Short Name",
      cell: ({ row }) => <span>{row.getValue("partyShortName") || "-"}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "contactPersonName",
      header: "Contact Person",
      cell: ({ row }) => (
        <span>{row.getValue("contactPersonName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.getValue("email") || "-"}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span>{row.getValue("phone") || "-"}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "partyTypes",
      header: "Party Types",
      cell: ({ row }) => {
        const types = [];
        if (row.original.isCustomer) types.push("Customer");
        if (row.original.isVendor) types.push("Vendor");
        if (row.original.isAgent) types.push("Agent");
        if (row.original.isShippingLine) types.push("Shipping Line");
        if (row.original.isTransporter) types.push("Transporter");
        if (row.original.isOverseasAgent) types.push("Overseas Agent");
        if (row.original.isConsignee) types.push("Consignee");
        if (row.original.isShipper) types.push("Shipper");

        return (
          <div className='flex flex-wrap gap-1'>
            {types.slice(0, 3).map((type, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
              >
                {type}
              </span>
            ))}
            {types.length > 3 && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                +{types.length - 3}
              </span>
            )}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "creditInfo",
      header: "Credit Info",
      cell: ({ row }) => {
        const creditLimit = row.original.creditLimitLC;
        const creditDays = row.original.allowedCreditDays;

        return (
          <div className='text-sm'>
            {creditLimit ? <div>LC: {creditLimit}</div> : null}
            {creditDays ? <div>Days: {creditDays}</div> : null}
            {!creditLimit && !creditDays ? "-" : null}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");
        return isActive ? (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            Active
          </span>
        ) : (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            Inactive
          </span>
        );
      },
      enableColumnFilter: false,
    },
  ];

  const downloadExcelWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${tabName}`);

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    dataToExport.forEach((party: any) => {
      const row = displayedFields.map((field) => {
        const value = party[field.fieldName];

        // Format dates for Excel
        if (
          field.fieldName === "createdAt" ||
          field.fieldName === "updatedAt"
        ) {
          return value ? new Date(value) : "";
        }

        // Format boolean values
        if (typeof value === "boolean") {
          return value ? "Yes" : "No";
        }

        return value || "";
      });
      worksheet.addRow(row);
    });

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "createdAt" || field.fieldName === "updatedAt"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy";
    });

    // Auto-fit columns
    worksheet.columns = worksheet.columns.map((column) => {
      return { ...column, width: 15 };
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), `${tabName}_Parties.xlsx`);
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleParties");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "partyCode":
          return "PTY001";
        case "partyName":
          return "ABC Trading Company";
        case "partyShortName":
          return "ABC Trading";
        case "isActive":
          return "Yes";
        case "isCustomer":
          return "Yes";
        case "isVendor":
          return "No";
        case "email":
          return "contact@abctrading.com";
        case "phone":
          return "+1234567890";
        case "contactPersonName":
          return "John Smith";
        case "contactPersonDesignation":
          return "Manager";
        case "addressLine1":
          return "123 Main Street";
        case "creditLimitLC":
          return "50000";
        case "allowedCreditDays":
          return "30";
        default:
          if (field.fieldName.includes("is")) {
            return "No";
          }
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    // Auto-fit columns
    worksheet.columns = worksheet.columns.map((column) => {
      return { ...column, width: 15 };
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_Parties.xlsx");
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    readXlsxFile(event.target.files[0]).then((rows: any) => {
      setIsLoading(true);
      insertData(rows.slice(1)); // Skip header row
    });
  };

  const insertData = async (newData: any[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    try {
      await Promise.all(
        newData.map(async (row) => {
          // Create payload object by mapping Excel columns to field names
          const payload: any = {};
          displayedFields.forEach((field, index) => {
            if (index < row.length) {
              let value = row[index];

              // Handle boolean fields
              if (
                field.fieldName.startsWith("is") ||
                field.fieldName === "trackIdAllowed" ||
                field.fieldName === "idPasswordAllowed" ||
                field.fieldName === "sendEmail" ||
                field.fieldName === "canSeeBills" ||
                field.fieldName === "canSeeLedger" ||
                field.fieldName === "isProcessOwner" ||
                field.fieldName === "clearanceByOps" ||
                field.fieldName === "clearanceByAcm"
              ) {
                value =
                  value === "Yes" ||
                  value === "yes" ||
                  value === true ||
                  value === "TRUE";
              }

              // Handle numeric fields
              if (
                (field.fieldName.includes("Id") &&
                  field.fieldName !== "partyId") ||
                field.fieldName === "creditLimitLC" ||
                field.fieldName === "creditLimitFC" ||
                field.fieldName === "allowedCreditDays"
              ) {
                value = Number(value) || 0;
              }

              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}Parties`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Parties imported successfully! Refreshing data...");
      fetchParties(); // Refresh data after import
    } catch (error) {
      setIsLoading(false);
      alert("Error importing Parties. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.partyName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Parties/${item.partyId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.partyId !== item.partyId)
          );
          alert("Party deleted successfully.");
        } else {
          throw new Error("Failed to delete Party");
        }
      } catch (error) {
        alert("Error deleting Party. Please try again.");
        console.error("Error deleting Party:", error);
      }
    }
  };

  // PDF Export Function
  const downloadPDFWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport || dataToExport.length === 0) {
      alert(`No data available to export for ${tabName}`);
      return;
    }

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.setTextColor(40, 116, 166);
      doc.text(`${tabName} - Parties Report`, 20, 20);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${dataToExport.length}`, 20, 37);

      // Prepare table data
      const tableHeaders = [
        "Code",
        "Name",
        "Short Name",
        "Contact Person",
        "Email",
        "Phone",
        "Types",
        "Status",
      ];

      const tableData = dataToExport.map((item) => [
        item.partyCode?.toString() || "N/A",
        (item.partyName?.toString() || "N/A").substring(0, 25),
        (item.partyShortName?.toString() || "N/A").substring(0, 15),
        (item.contactPersonName?.toString() || "N/A").substring(0, 20),
        (item.email?.toString() || "N/A").substring(0, 25),
        item.phone?.toString() || "N/A",
        getPartyTypes(item).join(", ").substring(0, 30),
        item.isActive ? "Active" : "Inactive",
      ]);

      // Use autoTable function
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
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20 },
          6: { cellWidth: 35 },
          7: { cellWidth: 15 },
        },
      });

      doc.save(`${tabName}_Parties_${moment().format("YYYY-MM-DD")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please check the console for details.");
    }
  };

  // Helper function to get party types
  const getPartyTypes = (party: any) => {
    const types = [];
    if (party.isCustomer) types.push("Customer");
    if (party.isVendor) types.push("Vendor");
    if (party.isAgent) types.push("Agent");
    if (party.isShippingLine) types.push("Shipping Line");
    if (party.isTransporter) types.push("Transporter");
    if (party.isOverseasAgent) types.push("Overseas Agent");
    return types;
  };

  // Statistics and Charts Component
  const PartiesStatsPage = () => {
    const stats = getPartiesStats();

    // Data for charts
    const partyTypeData = [
      { name: "Customers", value: stats.customers, color: "#3b82f6" },
      { name: "Vendors", value: stats.vendors, color: "#10b981" },
      { name: "Agents", value: stats.agents, color: "#f59e0b" },
      { name: "Shipping Lines", value: stats.shippingLines, color: "#ef4444" },
      { name: "Transporters", value: stats.transporters, color: "#8b5cf6" },
    ];

    const operationTypeData = [
      { name: "Sea Import", value: stats.seaImportParties, color: "#3b82f6" },
      { name: "Sea Export", value: stats.seaExportParties, color: "#60a5fa" },
      { name: "Air Import", value: stats.airImportParties, color: "#ef4444" },
      { name: "Air Export", value: stats.airExportParties, color: "#f87171" },
    ];

    const statusData = [
      { name: "Active", value: stats.activeParties, color: "#10b981" },
      {
        name: "Inactive",
        value: stats.totalParties - stats.activeParties,
        color: "#6b7280",
      },
    ];

    // Export statistics PDF
    const exportStatsPDF = () => {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 116, 166);
      doc.text("Parties Statistics Report", 20, 20);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35);
      doc.text(`Total Parties: ${stats.totalParties}`, 20, 45);

      // Statistics Summary
      doc.setFontSize(14);
      doc.setTextColor(40, 116, 166);
      doc.text("Statistics Summary", 20, 65);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Active Parties: ${stats.activeParties}`, 30, 80);
      doc.text(`Customers: ${stats.customers}`, 30, 90);
      doc.text(`Vendors: ${stats.vendors}`, 30, 100);
      doc.text(`Agents: ${stats.agents}`, 30, 110);
      doc.text(`Shipping Lines: ${stats.shippingLines}`, 30, 120);
      doc.text(`Transporters: ${stats.transporters}`, 30, 130);

      // Operations Summary
      doc.setFontSize(14);
      doc.setTextColor(40, 116, 166);
      doc.text("Operations Summary", 20, 150);

      doc.setFontSize(11);
      doc.text(`Sea Import Parties: ${stats.seaImportParties}`, 30, 165);
      doc.text(`Sea Export Parties: ${stats.seaExportParties}`, 30, 175);
      doc.text(`Air Import Parties: ${stats.airImportParties}`, 30, 185);
      doc.text(`Air Export Parties: ${stats.airExportParties}`, 30, 195);

      doc.save(`Parties_Statistics_${moment().format("YYYY-MM-DD")}.pdf`);
    };

    return (
      <div className='space-y-6'>
        {/* Header with Export Button */}
        <div className='flex justify-between items-center'>
          <h2 className='text-2xl font-bold text-gray-800'>
            Parties Statistics
          </h2>
          <Button
            onClick={exportStatsPDF}
            className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
          >
            <FiDownload />
            Export PDF Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='shadow-lg border-l-4 border-l-blue-500'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-semibold text-blue-700'>
                Total Parties
              </CardTitle>
              <div className='text-2xl font-bold text-blue-800'>
                {stats.totalParties}
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='text-sm text-gray-600'>
                {stats.activeParties} active •{" "}
                {stats.totalParties - stats.activeParties} inactive
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-lg border-l-4 border-l-green-500'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-semibold text-green-700'>
                Customers
              </CardTitle>
              <div className='text-2xl font-bold text-green-800'>
                {stats.customers}
              </div>
            </CardHeader>
            <CardContent className='pt-0'></CardContent>
          </Card>

          <Card className='shadow-lg border-l-4 border-l-orange-500'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-semibold text-orange-700'>
                Vendors
              </CardTitle>
              <div className='text-2xl font-bold text-orange-800'>
                {stats.vendors}
              </div>
            </CardHeader>
            <CardContent className='pt-0'></CardContent>
          </Card>

          <Card className='shadow-lg border-l-4 border-l-purple-500'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-semibold text-purple-700'>
                Agents
              </CardTitle>
              <div className='text-2xl font-bold text-purple-800'>
                {stats.agents}
              </div>
            </CardHeader>
            <CardContent className='pt-0'></CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Party Types Chart */}
          <Card className='shadow-lg'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold text-gray-800'>
                Party Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={partyTypeData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey='value'
                    >
                      {partyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Operations Chart */}
          <Card className='shadow-lg'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold text-gray-800'>
                Operations Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={operationTypeData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey='value' fill='#3b82f6' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render categorized view
  const renderCategorizedView = () => {
    const groupedData = getGroupedParties();

    if (Object.keys(groupedData).length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='text-center'>
            <h3 className='text-lg font-medium text-gray-900'>
              No parties found
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              {searchText
                ? "Try adjusting your search terms"
                : "Add your first party using the button above"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        {Object.entries(groupedData).map(([groupKey, items]) => (
          <Card key={groupKey} className='border border-gray-200'>
            <Collapsible
              open={expandedGroups[groupKey]}
              onOpenChange={() => toggleGroupExpansion(groupKey)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className='cursor-pointer hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg font-semibold'>
                      {groupKey}
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='text-sm'>
                        {items.length} party{items.length !== 1 ? "ies" : ""}
                      </Badge>
                      {expandedGroups[groupKey] ? (
                        <FiChevronDown className='h-5 w-5' />
                      ) : (
                        <FiChevronRight className='h-5 w-5' />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className='pt-0'>
                  <AppDataTable
                    data={items}
                    loading={false}
                    columns={columns}
                    searchText={searchText}
                    isPage
                    isMultiSearch
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    );
  };

  // Render table view
  const renderTableView = () => {
    const currentData = getCurrentTabData();

    if (!currentData || currentData.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='text-center'>
            <h3 className='text-lg font-medium text-gray-900'>
              No parties found
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              {searchText
                ? "Try adjusting your search terms"
                : "Add your first party using the button above"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <AppDataTable
        data={currentData}
        loading={false}
        columns={columns}
        searchText={searchText}
        isPage
        isMultiSearch
      />
    );
  };

  if (showForm) {
    return (
      <div className='p-6 bg-white shadow-md rounded-md'>
        <Button
          variant='outline'
          onClick={() => {
            setShowForm(false);
            setSelectedParty(null);
          }}
          className='mb-4 gap-1'
        >
          <FiArrowLeft className='h-4 w-4' />
          Back to Parties List
        </Button>

        <PartiesForm
          type={selectedParty ? "edit" : "add"}
          defaultState={selectedParty || {}}
          handleAddEdit={handleAddEditComplete}
        />
      </div>
    );
  }

  const currentTabData = getCurrentTabData();

  return (
    <div className='p-6 bg-white shadow-md rounded-md'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Parties Management</h1>
          <p className='text-sm text-muted-foreground'>
            Manage all business parties, customers, vendors, and agents
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={fetchParties}
            variant='outline'
            className='flex items-center gap-2'
            disabled={isLoading}
          >
            <FiRefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedParty(null);
              setShowForm(true);
            }}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            Add New Party
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='flex justify-between items-center mb-6'>
        <div className='flex items-center gap-4'>
          <div className='flex flex-col'>
            <Input
              type='text'
              placeholder='🔍 Search by code, name, email, phone, contact person...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='w-96'
            />
            {searchText === "" && (
              <p className='text-xs text-gray-500 mt-1'>
                Search across: Party Code, Name, Email, Phone, Contact Person,
                Address, etc.
              </p>
            )}
          </div>
          {searchText && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSearchText("")}
              className='text-gray-500 hover:text-gray-700'
            >
              Clear
            </Button>
          )}
        </div>
        <div className='flex gap-3 items-center'>
          <Button
            onClick={downloadSampleExcel}
            className='flex items-center gap-2'
            variant='outline'
          >
            <FiDownload />
            Sample File
          </Button>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Import:</span>
            <Input
              type='file'
              accept='.xlsx'
              onChange={handleFileUpload}
              className='w-auto'
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue='ALL_PARTIES'
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'
      >
        <TabsList className='grid w-full grid-cols-7'>
          <TabsTrigger value='ALL_PARTIES'>
            <FiUsers className='w-4 h-4 mr-2' />
            ALL PARTIES ({getAllParties().length})
          </TabsTrigger>
          <TabsTrigger value='ACTIVE'>
            <FiBriefcase className='w-4 h-4 mr-2' />
            ACTIVE ({getActiveParties().length})
          </TabsTrigger>
          <TabsTrigger value='CUSTOMERS'>
            <FiUsers className='w-4 h-4 mr-2' />
            CUSTOMERS ({getCustomers().length})
          </TabsTrigger>
          <TabsTrigger value='VENDORS'>
            <FiBriefcase className='w-4 h-4 mr-2' />
            VENDORS ({getVendors().length})
          </TabsTrigger>
          <TabsTrigger value='AGENTS'>
            <FiUsers className='w-4 h-4 mr-2' />
            AGENTS ({getAgents().length})
          </TabsTrigger>
          <TabsTrigger value='LOGISTICS'>
            <FiTruck className='w-4 h-4 mr-2' />
            LOGISTICS ({getLogisticsParties().length})
          </TabsTrigger>
          <TabsTrigger value='STATISTICS'>
            <FiFilePlus className='w-4 h-4 mr-2' />
            STATISTICS
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        {[
          "ALL_PARTIES",
          "ACTIVE",
          "CUSTOMERS",
          "VENDORS",
          "AGENTS",
          "LOGISTICS",
        ].map((tab) => (
          <TabsContent key={tab} value={tab} className='space-y-4'>
            <div className='flex justify-end gap-3'>
              <Button
                onClick={() =>
                  downloadPDFWithData(currentTabData, tab.replace("_", " "))
                }
                className='flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm'
                disabled={!currentTabData || currentTabData.length === 0}
              >
                <FiFilePlus />
                Export PDF
              </Button>
              <Button
                onClick={() =>
                  downloadExcelWithData(currentTabData, tab.replace("_", " "))
                }
                className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm'
                disabled={!currentTabData || currentTabData.length === 0}
              >
                <FiDownload />
                Export Excel
              </Button>
            </div>
            {["CUSTOMERS", "VENDORS", "AGENTS", "LOGISTICS"].includes(tab)
              ? renderCategorizedView()
              : renderTableView()}
          </TabsContent>
        ))}

        <TabsContent value='STATISTICS' className='space-y-4'>
          <PartiesStatsPage />
        </TabsContent>
      </Tabs>

      {isLoading && <AppLoader />}
    </div>
  );
}
