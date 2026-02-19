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
  FiUpload,
  FiSearch,
  FiX,
  FiFilter,
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
// Each entry maps: fieldName (camelCase from API response) -> displayName -> apiKey (PascalCase for POST body)
const fieldConfig = [
  {
    fieldName: "partyId",
    apiKey: "PartyId",
    displayName: "Party ID",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "companyId",
    apiKey: "CompanyId",
    displayName: "Company ID",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "partyCode",
    apiKey: "PartyCode",
    displayName: "Party Code",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "partyName",
    apiKey: "PartyName",
    displayName: "Party Name",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "partyShortName",
    apiKey: "PartyShortName",
    displayName: "Short Name",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "isActive",
    apiKey: "IsActive",
    displayName: "Status",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isGLLinked",
    apiKey: "IsGllinked",
    displayName: "GL Linked",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isCustomer",
    apiKey: "IsCustomer",
    displayName: "Customer",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isVendor",
    apiKey: "IsVendor",
    displayName: "Vendor",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isCustomerVendor",
    apiKey: "IsCustomerVendor",
    displayName: "Customer/Vendor",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isAgent",
    apiKey: "IsAgent",
    displayName: "Agent",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isOverseasAgent",
    apiKey: "IsOverseasAgent",
    displayName: "Overseas Agent",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isShippingLine",
    apiKey: "IsShippingLine",
    displayName: "Shipping Line",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isTransporter",
    apiKey: "IsTransporter",
    displayName: "Transporter",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isConsignee",
    apiKey: "IsConsignee",
    displayName: "Consignee",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isShipper",
    apiKey: "IsShipper",
    displayName: "Shipper",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isPrincipal",
    apiKey: "IsPrincipal",
    displayName: "Principal",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isNonGLParty",
    apiKey: "IsNonGlparty",
    displayName: "Non GL Party",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isTerminal",
    apiKey: "IsTerminal",
    displayName: "Terminal",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isBondedCarrier",
    apiKey: "IsBondedCarier",
    displayName: "Bonded Carrier",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isInSeaImport",
    apiKey: "IsInSeaImport",
    displayName: "Sea Import",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isInSeaExport",
    apiKey: "IsInSeaExport",
    displayName: "Sea Export",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isInAirImport",
    apiKey: "IsInAirImport",
    displayName: "Air Import",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isInAirExport",
    apiKey: "IsInAirExport",
    displayName: "Air Export",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isInLogistics",
    apiKey: "IsInLogistics",
    displayName: "Logistics",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "unLocationId",
    apiKey: "UnlocationId",
    displayName: "UN Location ID",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "addressLine1",
    apiKey: "AddressLine1",
    displayName: "Address Line 1",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "addressLine2",
    apiKey: "AddressLine2",
    displayName: "Address Line 2",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "postalCode",
    apiKey: "PostalCode",
    displayName: "Postal Code",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "phone",
    apiKey: "Phone",
    displayName: "Phone",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "fax",
    apiKey: "Fax",
    displayName: "Fax",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "email",
    apiKey: "Email",
    displayName: "Email",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "website",
    apiKey: "Website",
    displayName: "Website",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "contactPersonName",
    apiKey: "ContactPersonName",
    displayName: "Contact Person",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "contactPersonDesignation",
    apiKey: "ContactPersonDesignation",
    displayName: "Contact Designation",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "contactPersonEmail",
    apiKey: "ContactPersonEmail",
    displayName: "Contact Email",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "contactPersonPhone",
    apiKey: "ContactPersonPhone",
    displayName: "Contact Phone",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "ntnNumber",
    apiKey: "Ntnnumber",
    displayName: "NTN Number",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "strnNumber",
    apiKey: "Strnnumber",
    displayName: "STRN Number",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "bankName",
    apiKey: "BankName",
    displayName: "Bank Name",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "bankAccountNumber",
    apiKey: "BankAccountNumber",
    displayName: "Bank Account",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "ibanNumber",
    apiKey: "Ibannumber",
    displayName: "IBAN Number",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "creditLimitLC",
    apiKey: "CreditLimitLc",
    displayName: "Credit Limit LC",
    isdisplayed: true,
    isselected: true,
    type: "decimal",
  },
  {
    fieldName: "creditLimitFC",
    apiKey: "CreditLimitFc",
    displayName: "Credit Limit FC",
    isdisplayed: true,
    isselected: true,
    type: "decimal",
  },
  {
    fieldName: "allowedCreditDays",
    apiKey: "AllowedCreditDays",
    displayName: "Credit Days",
    isdisplayed: true,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "paymentTerms",
    apiKey: "PaymentTerms",
    displayName: "Payment Terms",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "glParentAccountId",
    apiKey: "GlparentAccountId",
    displayName: "GL Parent Account",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "glAccountId",
    apiKey: "GlaccountId",
    displayName: "GL Account",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "trackIdAllowed",
    apiKey: "TrackIdAllowed",
    displayName: "Track ID Allowed",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "idPasswordAllowed",
    apiKey: "IdPasswordAllowed",
    displayName: "ID Password Allowed",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "sendEmail",
    apiKey: "SendEmail",
    displayName: "Send Email",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "canSeeBills",
    apiKey: "CanSeeBills",
    displayName: "Can See Bills",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "canSeeLedger",
    apiKey: "CanSeeLedger",
    displayName: "Can See Ledger",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isProcessOwner",
    apiKey: "IsProcessOwner",
    displayName: "Process Owner",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "clearanceByOps",
    apiKey: "ClearanceByOps",
    displayName: "Clearance By Ops",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "clearanceByAcm",
    apiKey: "ClearanceByAcm",
    displayName: "Clearance By ACM",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "atTradeForGDIndustrial",
    apiKey: "AttradeForGdinsustrial",
    displayName: "AT Trade GD Industrial",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "atTradeForGDCommercial",
    apiKey: "AttradeForGdcommercial",
    displayName: "AT Trade GD Commercial",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "benificiaryNameOfPO",
    apiKey: "BenificiaryNameOfPo",
    displayName: "Beneficiary Name",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "salesRepId",
    apiKey: "SalesRepId",
    displayName: "Sales Rep",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "docsRepId",
    apiKey: "DocsRepId",
    displayName: "Docs Rep",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "accountsRepId",
    apiKey: "AccountsRepId",
    displayName: "Accounts Rep",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "version",
    apiKey: "Version",
    displayName: "Version",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
];

// Get only displayed fields for the table / Excel export
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected,
);

// ─── Type conversion helpers ──────────────────────────────────────────────────

/** Reliably parse any Excel cell value into a true boolean */
const parseBool = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  const str = String(value).trim().toLowerCase();
  return str === "true" || str === "yes" || str === "1";
};

/** Parse any Excel cell value into an integer (0 when empty/invalid) */
const parseInt_ = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? 0 : n;
};

/** Parse any Excel cell value into a decimal (0 when empty/invalid) */
const parseDecimal = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;
  const n = parseFloat(String(value));
  return isNaN(n) ? 0 : n;
};

/** Convert a raw Excel cell value according to the field's declared type */
const convertValue = (value: any, type: string): any => {
  switch (type) {
    case "bool":
      return parseBool(value);
    case "int":
      return parseInt_(value);
    case "decimal":
      return parseDecimal(value);
    default:
      return value !== null && value !== undefined ? String(value) : "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export default function PartiesPage({ initialData }: PartiesPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("ALL_PARTIES");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const router = useRouter();
  const { toast } = useToast();

  // ── Fetch parties ──────────────────────────────────────────────────────────
  const fetchParties = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Party/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const result = await response.json();
        setData(result);
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

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setData(initialData);
    } else {
      fetchParties();
    }
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────────
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
      (field) => field && field.toLowerCase().includes(searchLower),
    );
  };

  // ── Tab data helpers ───────────────────────────────────────────────────────
  const getAllParties = () => data || [];
  const getActiveParties = () => data?.filter((i) => i.isActive) || [];
  const getCustomers = () => data?.filter((i) => i.isCustomer) || [];
  const getVendors = () => data?.filter((i) => i.isVendor) || [];
  const getAgents = () =>
    data?.filter((i) => i.isAgent || i.isOverseasAgent) || [];
  const getLogisticsParties = () =>
    data?.filter(
      (i) => i.isShippingLine || i.isTransporter || i.isInLogistics,
    ) || [];

  const getPartiesStats = () => {
    const all = getAllParties();
    return {
      totalParties: all.length,
      activeParties: all.filter((i) => i.isActive).length,
      customers: all.filter((i) => i.isCustomer).length,
      vendors: all.filter((i) => i.isVendor).length,
      agents: all.filter((i) => i.isAgent || i.isOverseasAgent).length,
      shippingLines: all.filter((i) => i.isShippingLine).length,
      transporters: all.filter((i) => i.isTransporter).length,
      seaImportParties: all.filter((i) => i.isInSeaImport).length,
      seaExportParties: all.filter((i) => i.isInSeaExport).length,
      airImportParties: all.filter((i) => i.isInAirImport).length,
      airExportParties: all.filter((i) => i.isInAirExport).length,
    };
  };

  const getCurrentTabData = () => {
    let tabData: any[] = [];
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
      if (party.isCustomer) grouped["Customers"].push(party);
      else if (party.isVendor) grouped["Vendors"].push(party);
      else if (party.isAgent || party.isOverseasAgent)
        grouped["Agents"].push(party);
      else if (party.isShippingLine) grouped["Shipping Lines"].push(party);
      else if (party.isTransporter) grouped["Transporters"].push(party);
      else grouped["Other Parties"].push(party);
    });
    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length === 0) delete grouped[key];
    });
    return grouped;
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<any>[] = [
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
                  onClick={() => {
                    setSelectedParty(row.original);
                    setShowForm(true);
                  }}
                >
                  <FiEdit size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Edit Party</p>
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
                <p className='text-xs'>Delete Party</p>
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
      cell: ({ row }) => (
        <span className='text-xs text-gray-600'>{parseInt(row.id) + 1}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "partyCode",
      header: "Party Code",
      cell: ({ row }) => (
        <span className='font-semibold text-sm text-gray-900'>
          {row.getValue("partyCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "partyName",
      header: "Party Name",
      cell: ({ row }) => (
        <span className='font-medium text-sm text-gray-900'>
          {row.getValue("partyName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "partyShortName",
      header: "Short Name",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {row.getValue("partyShortName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "contactPersonName",
      header: "Contact Person",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {row.getValue("contactPersonName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className='text-sm text-blue-600'>
          {row.getValue("email") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {row.getValue("phone") || "-"}
        </span>
      ),
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
        if (row.original.isPrincipal) types.push("Principal");
        if (row.original.isTerminal) types.push("Terminal");
        if (row.original.isBondedCarrier) types.push("Bonded Carrier");
        if (row.original.isInSeaImport) types.push("Sea Import");
        if (row.original.isInSeaExport) types.push("Sea Export");
        if (row.original.isInAirImport) types.push("Air Import");
        if (row.original.isInAirExport) types.push("Air Export");
        if (row.original.isInLogistics) types.push("Logistics");
        return (
          <div className='flex flex-wrap gap-1'>
            {types.slice(0, 2).map((type, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'
              >
                {type}
              </span>
            ))}
            {types.length > 2 && (
              <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200'>
                +{types.length - 2}
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
          <div className='text-xs text-gray-600'>
            {creditLimit ? (
              <div className='font-medium'>LC: {creditLimit}</div>
            ) : null}
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
      cell: ({ row }) =>
        row.getValue("isActive") ? (
          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200'>
            Active
          </span>
        ) : (
          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200'>
            Inactive
          </span>
        ),
      enableColumnFilter: false,
    },
  ];

  // ── Excel export ───────────────────────────────────────────────────────────
  const downloadExcelWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data to export");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${tabName}`);
    worksheet.addRow(displayedFields.map((f) => f.displayName));
    dataToExport.forEach((party: any) => {
      const row = displayedFields.map((field) => {
        const value = party[field.fieldName];
        if (field.fieldName === "createdAt" || field.fieldName === "updatedAt")
          return value ? new Date(value) : "";
        if (typeof value === "boolean") return value ? "Yes" : "No";
        return value ?? "";
      });
      worksheet.addRow(row);
    });
    worksheet.columns = worksheet.columns.map((col) => ({ ...col, width: 15 }));
    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), `${tabName}_Parties.xlsx`);
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleParties");
    worksheet.addRow(displayedFields.map((f) => f.displayName));
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
          return field.type === "bool" ? "No" : `Sample ${field.displayName}`;
      }
    });
    worksheet.addRow(sampleRow);
    worksheet.columns = worksheet.columns.map((col) => ({ ...col, width: 15 }));
    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_Parties.xlsx");
    });
  };

  // ── Excel import ───────────────────────────────────────────────────────────

  /**
   * Build a lookup map:  displayName (lower-trimmed) → fieldConfig entry
   * This lets us match Excel column headers to field definitions regardless
   * of column order or whether the user uses an old/new sample template.
   */
  const buildHeaderMap = (): Record<string, (typeof fieldConfig)[0]> => {
    const map: Record<string, (typeof fieldConfig)[0]> = {};
    fieldConfig.forEach((field) => {
      map[field.displayName.trim().toLowerCase()] = field;
    });
    return map;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    const file = event.target.files[0];

    readXlsxFile(file).then((rows: any[][]) => {
      if (!rows || rows.length < 2) {
        toast({
          variant: "destructive",
          title: "Empty File",
          description: "The uploaded file has no data rows.",
        });
        return;
      }

      // Row 0 → header labels, Row 1+ → data
      const headerRow: string[] = rows[0].map((h: any) =>
        h != null ? String(h).trim().toLowerCase() : "",
      );
      const dataRows = rows.slice(1).filter((row) =>
        // Skip completely empty rows
        row.some((cell) => cell !== null && cell !== undefined && cell !== ""),
      );

      if (dataRows.length === 0) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No data rows found in the file after the header.",
        });
        return;
      }

      setIsLoading(true);
      insertData(headerRow, dataRows);
    });

    // Reset so the same file can be re-uploaded
    event.target.value = "";
  };

  const insertData = async (headerRow: string[], dataRows: any[][]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const headerMap = buildHeaderMap();
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        dataRows.map(async (row) => {
          // ── Build dto by matching each column header to its field ──────────
          const dto: Record<string, any> = {};

          // Default all fields to safe zero/false/empty values first
          fieldConfig.forEach((field) => {
            switch (field.type) {
              case "bool":
                dto[field.apiKey] = false;
                break;
              case "int":
                dto[field.apiKey] = 0;
                break;
              case "decimal":
                dto[field.apiKey] = 0;
                break;
              default:
                dto[field.apiKey] = "";
                break;
            }
          });

          // Override with actual Excel values, matched by column header name
          headerRow.forEach((header, colIndex) => {
            const fieldDef = headerMap[header];
            if (!fieldDef) return; // unknown column — skip gracefully

            const rawValue = colIndex < row.length ? row[colIndex] : null;
            dto[fieldDef.apiKey] = convertValue(rawValue, fieldDef.type);
          });

          // Always treat as a new record
          dto["PartyId"] = 0;

          // ── Log the dto for debugging ──────────────────────────────────────
          console.log("Importing party dto:", JSON.stringify(dto, null, 2));

          try {
            const response = await fetch(`${baseUrl}Party`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dto }),
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              const errText = await response.text();
              console.error(
                `Failed to import row (${dto["PartyCode"] || "unknown"}):`,
                errText,
              );
            }
          } catch (err) {
            failCount++;
            console.error(
              `Exception importing row (${dto["PartyCode"] || "unknown"}):`,
              err,
            );
          }
        }),
      );

      setIsLoading(false);

      if (failCount === 0) {
        toast({
          title: "Import Successful",
          description: `${successCount} ${successCount === 1 ? "party" : "parties"} imported successfully.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Partial Import",
          description: `${successCount} imported, ${failCount} failed. Check the browser console for details.`,
        });
      }

      fetchParties();
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Unexpected error during import. Check the console.",
      });
      console.error("Error importing data:", error);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.partyName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Party/${item.partyId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.partyId !== item.partyId),
          );
          toast({
            title: "Deleted",
            description: "Party deleted successfully.",
          });
        } else {
          throw new Error("Failed to delete Party");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error deleting Party. Please try again.",
        });
        console.error("Error deleting Party:", error);
      }
    }
  };

  // ── PDF export ─────────────────────────────────────────────────────────────
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

  const downloadPDFWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport || dataToExport.length === 0) {
      alert(`No data available to export for ${tabName}`);
      return;
    }
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(40, 116, 166);
      doc.text(`${tabName} - Parties Report`, 20, 20);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${dataToExport.length}`, 20, 37);

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
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
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

  // ── Add/Edit complete ──────────────────────────────────────────────────────
  const handleAddEditComplete = () => {
    setShowForm(false);
    setSelectedParty(null);
    fetchParties();
  };

  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // ── Statistics Component ───────────────────────────────────────────────────
  const PartiesStatsPage = () => {
    const stats = getPartiesStats();
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

    const exportStatsPDF = () => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(40, 116, 166);
      doc.text("Parties Statistics Report", 20, 20);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35);
      doc.text(`Total Parties: ${stats.totalParties}`, 20, 45);
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
      doc.setFontSize(14);
      doc.setTextColor(40, 116, 166);
      doc.text("Operations Summary", 20, 150);
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Sea Import Parties: ${stats.seaImportParties}`, 30, 165);
      doc.text(`Sea Export Parties: ${stats.seaExportParties}`, 30, 175);
      doc.text(`Air Import Parties: ${stats.airImportParties}`, 30, 185);
      doc.text(`Air Export Parties: ${stats.airExportParties}`, 30, 195);
      doc.save(`Parties_Statistics_${moment().format("YYYY-MM-DD")}.pdf`);
    };

    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Parties Statistics
          </h2>
          <Button
            onClick={exportStatsPDF}
            size='sm'
            className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'
          >
            <FiDownload size={14} /> Export PDF Report
          </Button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          <Card className='border border-blue-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-blue-700 uppercase tracking-wide'>
                Total Parties
              </CardTitle>
              <div className='text-2xl font-bold text-blue-900 mt-1'>
                {stats.totalParties}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>
                {stats.activeParties} active •{" "}
                {stats.totalParties - stats.activeParties} inactive
              </div>
            </CardContent>
          </Card>
          <Card className='border border-green-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-green-700 uppercase tracking-wide'>
                Customers
              </CardTitle>
              <div className='text-2xl font-bold text-green-900 mt-1'>
                {stats.customers}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Business clients</div>
            </CardContent>
          </Card>
          <Card className='border border-orange-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-orange-700 uppercase tracking-wide'>
                Vendors
              </CardTitle>
              <div className='text-2xl font-bold text-orange-900 mt-1'>
                {stats.vendors}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Service providers</div>
            </CardContent>
          </Card>
          <Card className='border border-purple-200 shadow-sm'>
            <CardHeader className='pb-2 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-purple-700 uppercase tracking-wide'>
                Agents
              </CardTitle>
              <div className='text-2xl font-bold text-purple-900 mt-1'>
                {stats.agents}
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-3 px-4'>
              <div className='text-xs text-gray-600'>Representatives</div>
            </CardContent>
          </Card>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Card className='border shadow-sm'>
            <CardHeader className='pb-3 pt-4 px-4'>
              <CardTitle className='text-sm font-semibold text-gray-900'>
                Party Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4 px-4'>
              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={partyTypeData}
                      cx='50%'
                      cy='50%'
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey='value'
                    >
                      {partyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className='border shadow-sm'>
            <CardHeader className='pb-3 pt-4 px-4'>
              <CardTitle className='text-sm font-semibold text-gray-900'>
                Operations Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4 px-4'>
              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={operationTypeData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis
                      dataKey='name'
                      tick={{ fontSize: 11 }}
                      stroke='#6b7280'
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke='#6b7280' />
                    <RechartsTooltip />
                    <Bar dataKey='value' fill='#3b82f6' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderCategorizedView = () => {
    const groupedData = getGroupedParties();
    if (Object.keys(groupedData).length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <FiUsers className='mx-auto h-12 w-12 text-gray-400 mb-3' />
          <h3 className='text-base font-medium text-gray-900'>
            No parties found
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            {searchText
              ? "Try adjusting your search terms"
              : "Add your first party using the button above"}
          </p>
        </div>
      );
    }
    return (
      <div className='space-y-3'>
        {Object.entries(groupedData).map(([groupKey, items]) => (
          <Card key={groupKey} className='border shadow-sm'>
            <Collapsible
              open={expandedGroups[groupKey]}
              onOpenChange={() => toggleGroupExpansion(groupKey)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className='cursor-pointer hover:bg-gray-50 transition-colors py-3 px-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-semibold text-gray-900'>
                      {groupKey}
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='text-xs px-2 py-0.5 font-medium'
                      >
                        {items.length} party{items.length !== 1 ? "ies" : ""}
                      </Badge>
                      {expandedGroups[groupKey] ? (
                        <FiChevronDown className='h-4 w-4 text-gray-500' />
                      ) : (
                        <FiChevronRight className='h-4 w-4 text-gray-500' />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className='pt-0 pb-3 px-4'>
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

  const renderTableView = () => {
    const currentData = getCurrentTabData();
    if (!currentData || currentData.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <FiUsers className='mx-auto h-12 w-12 text-gray-400 mb-3' />
          <h3 className='text-base font-medium text-gray-900'>
            No parties found
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            {searchText
              ? "Try adjusting your search terms"
              : "Add your first party using the button above"}
          </p>
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

  // ── Show form ──────────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className='p-4 bg-gray-50 min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setShowForm(false);
              setSelectedParty(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' />
            Back to Parties List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <PartiesForm
              type={selectedParty ? "edit" : "add"}
              defaultState={selectedParty || {}}
              handleAddEdit={handleAddEditComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  const currentTabData = getCurrentTabData();

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              Parties Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Manage all business parties, customers, vendors, and agents
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={fetchParties}
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
                setSelectedParty(null);
                setShowForm(true);
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5'
            >
              <FiUsers className='h-3.5 w-3.5' />
              Add New Party
            </Button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='flex items-center gap-2 flex-1 w-full md:w-auto'>
              <div className='relative flex-1 max-w-md'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by code, name, email, phone...'
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
            </div>
            <div className='flex gap-2 items-center'>
              <Button
                onClick={downloadSampleExcel}
                size='sm'
                className='flex items-center gap-1.5 text-xs'
                variant='outline'
              >
                <FiDownload className='h-3.5 w-3.5' />
                Sample File
              </Button>
              <div className='flex items-center gap-2'>
                <label
                  htmlFor='file-upload'
                  className='cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                >
                  <FiUpload className='h-3.5 w-3.5' />
                  Import Excel
                </label>
                <Input
                  id='file-upload'
                  type='file'
                  accept='.xlsx'
                  onChange={handleFileUpload}
                  className='hidden'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue='ALL_PARTIES'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='grid w-full grid-cols-7 gap-1 bg-transparent h-auto p-0'>
              <TabsTrigger
                value='ALL_PARTIES'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiUsers className='w-3.5 h-3.5 mr-1.5' /> All (
                {getAllParties().length})
              </TabsTrigger>
              <TabsTrigger
                value='ACTIVE'
                className='text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiBriefcase className='w-3.5 h-3.5 mr-1.5' /> Active (
                {getActiveParties().length})
              </TabsTrigger>
              <TabsTrigger
                value='CUSTOMERS'
                className='text-xs py-2 px-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiUsers className='w-3.5 h-3.5 mr-1.5' /> Customers (
                {getCustomers().length})
              </TabsTrigger>
              <TabsTrigger
                value='VENDORS'
                className='text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiBriefcase className='w-3.5 h-3.5 mr-1.5' /> Vendors (
                {getVendors().length})
              </TabsTrigger>
              <TabsTrigger
                value='AGENTS'
                className='text-xs py-2 px-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiUsers className='w-3.5 h-3.5 mr-1.5' /> Agents (
                {getAgents().length})
              </TabsTrigger>
              <TabsTrigger
                value='LOGISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiTruck className='w-3.5 h-3.5 mr-1.5' /> Logistics (
                {getLogisticsParties().length})
              </TabsTrigger>
              <TabsTrigger
                value='STATISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiFilePlus className='w-3.5 h-3.5 mr-1.5' /> Stats
              </TabsTrigger>
            </TabsList>
          </div>

          {[
            "ALL_PARTIES",
            "ACTIVE",
            "CUSTOMERS",
            "VENDORS",
            "AGENTS",
            "LOGISTICS",
          ].map((tab) => (
            <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
              <div className='flex justify-end gap-2'>
                <Button
                  onClick={() =>
                    downloadPDFWithData(currentTabData, tab.replace("_", " "))
                  }
                  size='sm'
                  className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs'
                  disabled={!currentTabData || currentTabData.length === 0}
                >
                  <FiFilePlus className='h-3.5 w-3.5' /> Export PDF
                </Button>
                <Button
                  onClick={() =>
                    downloadExcelWithData(currentTabData, tab.replace("_", " "))
                  }
                  size='sm'
                  className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                  disabled={!currentTabData || currentTabData.length === 0}
                >
                  <FiDownload className='h-3.5 w-3.5' /> Export Excel
                </Button>
              </div>
              <div className='bg-white rounded-lg shadow-sm border'>
                {["CUSTOMERS", "VENDORS", "AGENTS", "LOGISTICS"].includes(tab)
                  ? renderCategorizedView()
                  : renderTableView()}
              </div>
            </TabsContent>
          ))}

          <TabsContent value='STATISTICS' className='space-y-3 mt-3'>
            <div className='bg-white rounded-lg shadow-sm border p-4'>
              <PartiesStatsPage />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isLoading && <AppLoader />}
    </div>
  );
}
