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
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PartiesPageProps = { initialData?: any[] };

// ─── Field config ─────────────────────────────────────────────────────────────
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

const displayedFields = fieldConfig.filter(
  (f) => f.isdisplayed && f.isselected,
);

// FK fields that must be sent as null (not 0) when not provided.
// EF Core rejects rows where these are 0 because no entity exists with Id = 0.
const NULLABLE_FK_FIELDS = new Set([
  "unLocationId",
  "glParentAccountId",
  "glAccountId",
  "salesRepId",
  "docsRepId",
  "accountsRepId",
]);

// Required text/contact fields — empty values get default substitutes + a warning.
const REQUIRED_FIELDS = {
  addressLine1: "Address Line 1",
  phone: "Phone",
  email: "Email",
  contactPersonName: "Contact Person Name",
  contactPersonEmail: "Contact Person Email",
  contactPersonPhone: "Contact Person Phone",
  benificiaryNameOfPO: "Beneficiary Name for PO",
};

// Defaults used to fill empty required fields. NOTE: glParentAccountId removed —
// it's a real FK and must be resolved from a code lookup, not hardcoded.
const DEFAULT_VALUES: Record<string, any> = {
  addressLine1: "N/A",
  phone: "000-000-0000",
  email: "no-email@example.com",
  contactPersonName: "Not Provided",
  contactPersonDesignation: "N/A",
  contactPersonEmail: "no-email@example.com",
  contactPersonPhone: "000-000-0000",
  benificiaryNameOfPO: "Not Provided",
  paymentTerms: "Net 30",
  partyShortName: "",
  isActive: true,
};

// Optional Excel columns for resolving GL accounts by code.
// If user adds these columns to their Excel, codes are looked up against
// the chart of accounts at import time.
const GL_PARENT_CODE_HEADER = "gl parent account code";
const GL_ACCOUNT_CODE_HEADER = "gl account code";

// ─── Type helpers ─────────────────────────────────────────────────────────────
const parseBool = (v: any) =>
  typeof v === "boolean"
    ? v
    : ["true", "yes", "1"].includes(String(v).trim().toLowerCase());
const parseInt_ = (v: any) => {
  const n = parseInt(String(v ?? ""), 10);
  return isNaN(n) ? 0 : n;
};
const parseDecimal = (v: any) => {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? 0 : n;
};
const convertValue = (v: any, t: string) => {
  switch (t) {
    case "bool":
      return parseBool(v);
    case "int":
      return parseInt_(v);
    case "decimal":
      return parseDecimal(v);
    default:
      return v != null ? String(v) : "";
  }
};

// ─── Import Result Type ──────────────────────────────────────────────────────
type ImportResult = {
  row: number;
  partyCode?: string;
  partyName?: string;
  status: "success" | "error" | "warning";
  message: string;
  errors?: string[];
  warnings?: string[];
};

// ─── Component ────────────────────────────────────────────────────────────────
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
  const [fetchingPartyId, setFetchingPartyId] = useState<number | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchParties = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}Party/GetList`, {
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
      if (res.ok) setData(await res.json());
      else throw new Error("Failed to fetch parties");
    } catch {
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
    if (initialData && Array.isArray(initialData)) setData(initialData);
    else fetchParties();
  }, []);

  // ── Fetch full party record for edit ────────────────────────────────────────
  const handleEditClick = async (partyId: number) => {
    setFetchingPartyId(partyId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}Party/${partyId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fullParty = await res.json();
      setSelectedParty(fullParty);
      setShowForm(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load party details. Please try again.",
      });
    } finally {
      setFetchingPartyId(null);
    }
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  const searchInItem = (item: any, term: string) => {
    if (!term) return true;
    const t = term.toLowerCase();
    return [
      item.partyId,
      item.partyCode,
      item.partyName,
      item.partyShortName,
      item.email,
      item.phone,
      item.contactPersonName,
      item.contactPersonEmail,
      item.contactPersonPhone,
      item.addressLine1,
      item.addressLine2,
      item.ntnNumber,
      item.strnNumber,
      item.bankName,
    ].some((f) => f?.toString().toLowerCase().includes(t));
  };

  // ── Tab helpers ─────────────────────────────────────────────────────────────
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
    const map: Record<string, any[]> = {
      ALL_PARTIES: getAllParties(),
      ACTIVE: getActiveParties(),
      CUSTOMERS: getCustomers(),
      VENDORS: getVendors(),
      AGENTS: getAgents(),
      LOGISTICS: getLogisticsParties(),
    };
    return (map[activeTab] ?? getAllParties()).filter((i) =>
      searchInItem(i, searchText),
    );
  };

  const getGroupedParties = () => {
    const grouped: Record<string, any[]> = {
      Customers: [],
      Vendors: [],
      Agents: [],
      "Shipping Lines": [],
      Transporters: [],
      "Other Parties": [],
    };
    getCurrentTabData().forEach((p) => {
      if (p.isCustomer) grouped["Customers"].push(p);
      else if (p.isVendor) grouped["Vendors"].push(p);
      else if (p.isAgent || p.isOverseasAgent) grouped["Agents"].push(p);
      else if (p.isShippingLine) grouped["Shipping Lines"].push(p);
      else if (p.isTransporter) grouped["Transporters"].push(p);
      else grouped["Other Parties"].push(p);
    });
    Object.keys(grouped).forEach((k) => {
      if (!grouped[k].length) delete grouped[k];
    });
    return grouped;
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const party = row.original;
        const isFetching = fetchingPartyId === party.partyId;
        return (
          <div className='flex gap-1.5'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled={isFetching}
                    className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-40'
                    onClick={() => handleEditClick(party.partyId)}
                  >
                    {isFetching ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <FiEdit size={14} />
                    )}
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
                    onClick={() => handleDelete(party)}
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
        );
      },
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
        const types: string[] = [];
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
            {types.slice(0, 2).map((t, i) => (
              <span
                key={i}
                className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'
              >
                {t}
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
        const cl = row.original.creditLimitLC;
        const cd = row.original.allowedCreditDays;
        return (
          <div className='text-xs text-gray-600'>
            {cl ? <div className='font-medium'>LC: {cl}</div> : null}
            {cd ? <div>Days: {cd}</div> : null}
            {!cl && !cd ? "-" : null}
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

  // ── Excel helpers ──────────────────────────────────────────────────────────
  const downloadExcelWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport?.length) {
      alert("No data to export");
      return;
    }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(tabName);
    ws.addRow(displayedFields.map((f) => f.displayName));
    dataToExport.forEach((p) =>
      ws.addRow(
        displayedFields.map((field) => {
          const v = p[field.fieldName];
          if (typeof v === "boolean") return v ? "Yes" : "No";
          return v ?? "";
        }),
      ),
    );
    ws.columns = ws.columns.map((c) => ({ ...c, width: 15 }));
    wb.xlsx
      .writeBuffer()
      .then((buf: any) => saveAs(new Blob([buf]), `${tabName}_Parties.xlsx`));
  };

  const downloadSampleExcel = () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("SampleParties");

    // Build headers: existing displayed fields + 2 GL code columns at the end
    const baseHeaders = displayedFields.map((field) => {
      const isRequired = Object.keys(REQUIRED_FIELDS).includes(field.fieldName);
      return isRequired ? `${field.displayName} *` : field.displayName;
    });
    const headers = [
      ...baseHeaders,
      "GL Parent Account Code",
      "GL Account Code",
    ];
    ws.addRow(headers);

    // Sample row
    const sampleRow = displayedFields.map((field) => {
      if (DEFAULT_VALUES[field.fieldName] !== undefined) {
        if (field.type === "bool") {
          return DEFAULT_VALUES[field.fieldName] ? "Yes" : "No";
        }
        return DEFAULT_VALUES[field.fieldName];
      }
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
        case "isGLLinked":
          return "Yes";
        case "email":
          return "contact@abctrading.com";
        case "phone":
          return "+1234567890";
        case "contactPersonName":
          return "John Smith";
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
    // Sample GL codes (user replaces with their actual chart of accounts codes)
    sampleRow.push("4001"); // GL Parent Account Code
    sampleRow.push(""); // GL Account Code (optional)
    ws.addRow(sampleRow);

    // Instructions
    ws.addRow([]);
    ws.addRow(["Instructions:"]);
    ws.addRow(["1. Fields marked with * are required"]);
    ws.addRow(["2. For boolean fields, use Yes/No or True/False"]);
    ws.addRow(["3. Empty required fields will be filled with default values"]);
    ws.addRow([
      "4. If GL Linked = Yes, you MUST provide a valid GL Parent Account Code from your chart of accounts",
    ]);
    ws.addRow([
      "5. Set Non GL Party = Yes for parties that don't need a GL account",
    ]);

    ws.columns = ws.columns.map((c) => ({ ...c, width: 15 }));
    wb.xlsx
      .writeBuffer()
      .then((buf: any) => saveAs(new Blob([buf]), "SampleFile_Parties.xlsx"));
  };

  const downloadImportResults = () => {
    if (!importResults.length) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Import Results");

    ws.addRow(["Row", "Party Code", "Party Name", "Status", "Errors/Warnings"]);
    importResults.forEach((result) => {
      ws.addRow([
        result.row,
        result.partyCode || "N/A",
        result.partyName || "N/A",
        result.status,
        result.errors?.join("; ") ||
          result.warnings?.join("; ") ||
          result.message,
      ]);
    });

    ws.columns = ws.columns.map((c) => ({ ...c, width: 20 }));
    wb.xlsx
      .writeBuffer()
      .then((buf: any) => saveAs(new Blob([buf]), "Import_Results.xlsx"));
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const buildHeaderMap = () => {
    const map: Record<string, (typeof fieldConfig)[0]> = {};
    fieldConfig.forEach((f) => {
      map[f.displayName.trim().toLowerCase()] = f;
      // Also map without trailing asterisk for required-field headers
      map[f.displayName.trim().toLowerCase().replace(" *", "")] = f;
    });
    return map;
  };

  // Helper function to safely parse API response
  const parseApiResponse = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        return { errors: { general: ["Failed to parse JSON response"] } };
      }
    }

    try {
      const text = await response.text();
      if (text.includes("<!DOCTYPE html>") || text.includes("<html>")) {
        if (response.status === 404) {
          return {
            errors: {
              endpoint: [
                "API endpoint not found (404). Please check the URL configuration.",
              ],
            },
          };
        } else if (response.status === 500) {
          return {
            errors: {
              server: [
                "Internal server error (500). The server encountered an error processing the request.",
              ],
            },
          };
        } else if (response.status === 401) {
          return {
            errors: { auth: ["Authentication required. Please log in again."] },
          };
        } else if (response.status === 403) {
          return {
            errors: {
              auth: [
                "Access forbidden. You don't have permission to perform this action.",
              ],
            },
          };
        }
      }
      return text
        ? { rawText: text }
        : {
            errors: { general: [`Server returned status ${response.status}`] },
          };
    } catch {
      return { errors: { general: ["Failed to read server response"] } };
    }
  };

  // Pull session context. Adjust to match your auth pattern (JWT, store, cookie, etc.)
  const getSessionContext = (): { companyId: number; userId: number } => {
    try {
      const companyId = Number(localStorage.getItem("companyId") ?? 0);
      const userId = Number(localStorage.getItem("userId") ?? 0);
      return { companyId, userId };
    } catch {
      return { companyId: 0, userId: 0 };
    }
  };

  // Fetch GL accounts and build a code -> id map. Returns empty map on failure.
  const fetchGlAccountsMap = async (
    baseUrl: string,
    companyId: number,
  ): Promise<Map<string, number>> => {
    try {
      const res = await fetch(`${baseUrl}Glaccount/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "AccountId,AccountCode,IsActive,CompanyId",
          where: `CompanyId = ${companyId} AND IsActive = true`,
          sortOn: "AccountCode",
          page: "1",
          pageSize: "5000",
        }),
      });
      if (!res.ok) return new Map();
      const accounts: any[] = await res.json();
      return new Map(
        accounts
          .filter((a) => a.accountCode != null && a.accountId != null)
          .map((a) => [
            String(a.accountCode).trim().toLowerCase(),
            Number(a.accountId),
          ]),
      );
    } catch {
      return new Map();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    readXlsxFile(e.target.files[0]).then((rows: any[][]) => {
      if (!rows || rows.length < 2) {
        toast({
          variant: "destructive",
          title: "Empty File",
          description: "No data rows found.",
        });
        return;
      }
      const headerRow = rows[0].map((h: any) =>
        h != null ? String(h).trim().toLowerCase().replace(" *", "") : "",
      );
      const dataRows = rows
        .slice(1)
        .filter(
          (row) =>
            !row[0]?.toString().toLowerCase().includes("instruction") &&
            row.some((c) => c != null && c !== ""),
        );

      if (!dataRows.length) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No data rows after header.",
        });
        return;
      }
      setIsLoading(true);
      insertData(headerRow, dataRows);
    });
    e.target.value = "";
  };

  const buildCompleteDto = (
    rowData: any[],
    headerRow: string[],
    headerMap: Record<string, any>,
    rowIndex: number,
    companyId: number,
    userId: number,
    glCodeMap: Map<string, number>,
  ): { dto: any; warnings: string[]; rowError: string | null } => {
    const dto: Record<string, any> = {};
    const warnings: string[] = [];

    // Initialize defaults
    fieldConfig.forEach((f) => {
      if (NULLABLE_FK_FIELDS.has(f.fieldName)) {
        dto[f.apiKey] = null;
        return;
      }
      const defaultValue = DEFAULT_VALUES[f.fieldName];
      if (defaultValue !== undefined) {
        dto[f.apiKey] = defaultValue;
      } else {
        dto[f.apiKey] =
          f.type === "bool"
            ? false
            : f.type === "int" || f.type === "decimal"
              ? 0
              : "";
      }
    });

    // Override with Excel values
    headerRow.forEach((header, idx) => {
      const def = headerMap[header];
      if (!def) return;

      const excelValue = idx < rowData.length ? rowData[idx] : null;
      const isEmpty =
        excelValue === null || excelValue === undefined || excelValue === "";

      if (NULLABLE_FK_FIELDS.has(def.fieldName) && isEmpty) {
        dto[def.apiKey] = null;
        return;
      }

      const convertedValue = convertValue(excelValue, def.type);
      const isRequired = Object.keys(REQUIRED_FIELDS).includes(def.fieldName);
      const valueIsBlank =
        convertedValue === "" ||
        convertedValue === null ||
        convertedValue === undefined ||
        (def.type !== "string" && convertedValue === 0);

      if (isRequired && valueIsBlank) {
        const fieldDisplayName =
          REQUIRED_FIELDS[def.fieldName as keyof typeof REQUIRED_FIELDS];
        warnings.push(
          `${fieldDisplayName} is empty, using default value: ${DEFAULT_VALUES[def.fieldName]}`,
        );
      } else {
        dto[def.apiKey] = convertedValue;
      }
    });

    // Resolve GL Parent Account Code and GL Account Code from optional Excel columns
    const findHeaderValue = (headerName: string): string => {
      const idx = headerRow.indexOf(headerName);
      if (idx < 0 || idx >= rowData.length) return "";
      return String(rowData[idx] ?? "").trim();
    };
    const parentCodeRaw = findHeaderValue(GL_PARENT_CODE_HEADER);
    const accountCodeRaw = findHeaderValue(GL_ACCOUNT_CODE_HEADER);
    const parentCode = parentCodeRaw.toLowerCase();
    const accountCode = accountCodeRaw.toLowerCase();

    if (parentCode) {
      const id = glCodeMap.get(parentCode);
      if (id) {
        dto["GlparentAccountId"] = id;
      } else {
        warnings.push(
          `GL Parent Account Code "${parentCodeRaw}" not found in chart of accounts`,
        );
      }
    }
    if (accountCode) {
      const id = glCodeMap.get(accountCode);
      if (id) {
        dto["GlaccountId"] = id;
      } else {
        warnings.push(
          `GL Account Code "${accountCodeRaw}" not found in chart of accounts`,
        );
      }
    }

    // Hard validation: GL-linked rows that are NOT explicitly Non GL Party
    // must have a resolved GL Parent Account, otherwise the API will 400.
    let rowError: string | null = null;
    const isGllinked = !!dto["IsGllinked"];
    const isNonGl = !!dto["IsNonGlparty"];
    if (isGllinked && !isNonGl && dto["GlparentAccountId"] == null) {
      rowError = parentCodeRaw
        ? `GL Linked = Yes but GL Parent Account Code "${parentCodeRaw}" could not be resolved. Add the column 'GL Parent Account Code' to your Excel and use a valid code from your chart of accounts.`
        : `GL Linked = Yes but no GL Parent Account Code provided. Add the column 'GL Parent Account Code' to your Excel and use a valid code from your chart of accounts, or set Non GL Party = Yes.`;
    }

    // Force ownership/audit fields
    dto["PartyId"] = 0;
    dto["CompanyId"] = companyId;

    return {
      dto: {
        ...dto,
        partyCharges: [],
        partyLocations: [],
        partyBillingParties: [],
        partiesContacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createLog: "Created via Excel import",
        updateLog: "Created via Excel import",
        version: 0,
        createdBy: userId,
      },
      warnings,
      rowError,
    };
  };

  const insertData = async (headerRow: string[], dataRows: any[][]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const headerMap = buildHeaderMap();
    const results: ImportResult[] = [];

    // Validate session context
    const { companyId, userId } = getSessionContext();
    if (!companyId) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Session Error",
        description:
          "Could not determine the active company. Please log in again.",
      });
      return;
    }

    // Pre-fetch GL accounts once for code -> id resolution
    const glCodeMap = await fetchGlAccountsMap(baseUrl ?? "", companyId);
    if (glCodeMap.size === 0) {
      // Not fatal — non-GL rows can still import. Just inform.
      toast({
        title: "GL accounts unavailable",
        description:
          "Could not load chart of accounts. Only Non-GL parties will import.",
      });
    }

    try {
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowIndex = i + 2; // +1 for header, +1 for 1-based index

        const {
          dto: completeDto,
          warnings,
          rowError,
        } = buildCompleteDto(
          row,
          headerRow,
          headerMap,
          rowIndex,
          companyId,
          userId,
          glCodeMap,
        );

        const partyCode = completeDto.PartyCode || "N/A";
        const partyName = completeDto.PartyName || "N/A";

        // Pre-flight validation — skip the POST if we already know it'll fail
        if (rowError) {
          results.push({
            row: rowIndex,
            partyCode,
            partyName,
            status: "error",
            message: "Validation failed",
            errors: [rowError],
          });
          continue;
        }

        try {
          const res = await fetch(`${baseUrl}Party`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(completeDto),
          });

          if (res.ok) {
            results.push({
              row: rowIndex,
              partyCode,
              partyName,
              status: warnings.length > 0 ? "warning" : "success",
              message:
                warnings.length > 0
                  ? "Imported with warnings"
                  : "Imported successfully",
              warnings: warnings.length > 0 ? warnings : undefined,
            });
          } else {
            const errorData = await parseApiResponse(res);

            // Try every shape the API might use, in priority order
            const errors: string[] = errorData?.errors
              ? Array.isArray(errorData.errors)
                ? (Object.values(errorData.errors).flat() as string[])
                : Object.entries(errorData.errors).map(
                    ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`,
                  )
              : errorData?.title
                ? [errorData.title]
                : errorData?.message
                  ? [errorData.message]
                  : errorData?.rawText
                    ? [String(errorData.rawText).substring(0, 500)]
                    : [
                        JSON.stringify(errorData) ||
                          `Request failed with status ${res.status}`,
                      ];

            results.push({
              row: rowIndex,
              partyCode,
              partyName,
              status: "error",
              message: "Failed to import",
              errors,
            });
          }
        } catch (err) {
          results.push({
            row: rowIndex,
            partyCode,
            partyName,
            status: "error",
            message: "Network error",
            errors: [(err as Error).message],
          });
        }
      }

      setIsLoading(false);
      setImportResults(results);
      setShowImportDialog(true);

      const successCount = results.filter(
        (r) => r.status === "success" || r.status === "warning",
      ).length;
      const errorCount = results.filter((r) => r.status === "error").length;
      const warningCount = results.filter(
        (r) => r.warnings && r.warnings.length > 0,
      ).length;

      if (errorCount === 0 && warningCount === 0) {
        toast({
          title: "Import Successful",
          description: `All ${successCount} ${
            successCount === 1 ? "party" : "parties"
          } imported successfully.`,
        });
      } else if (errorCount === 0) {
        toast({
          title: "Import Completed with Warnings",
          description: `${successCount} imported with ${warningCount} ${
            warningCount === 1 ? "warning" : "warnings"
          }.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Import Completed with Errors",
          description: `${successCount} imported, ${errorCount} failed. Check the report for details.`,
        });
      }

      fetchParties();
    } catch {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Unexpected error during import.",
      });
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.partyName}"?`))
      return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}Party/${item.partyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setData((prev) => prev.filter((r) => r.partyId !== item.partyId));
        toast({ title: "Deleted", description: "Party deleted successfully." });
      } else throw new Error();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error deleting Party. Please try again.",
      });
    }
  };

  // ── PDF ─────────────────────────────────────────────────────────────────────
  const getPartyTypes = (p: any) => {
    const t: string[] = [];
    if (p.isCustomer) t.push("Customer");
    if (p.isVendor) t.push("Vendor");
    if (p.isAgent) t.push("Agent");
    if (p.isShippingLine) t.push("Shipping Line");
    if (p.isTransporter) t.push("Transporter");
    if (p.isOverseasAgent) t.push("Overseas Agent");
    return t;
  };

  const downloadPDFWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport?.length) {
      alert(`No data for ${tabName}`);
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
      autoTable(doc, {
        head: [
          [
            "Code",
            "Name",
            "Short Name",
            "Contact Person",
            "Email",
            "Phone",
            "Types",
            "Status",
          ],
        ],
        body: dataToExport.map((i) => [
          i.partyCode || "N/A",
          (i.partyName || "N/A").substring(0, 25),
          (i.partyShortName || "N/A").substring(0, 15),
          (i.contactPersonName || "N/A").substring(0, 20),
          (i.email || "N/A").substring(0, 25),
          i.phone || "N/A",
          getPartyTypes(i).join(", ").substring(0, 30),
          i.isActive ? "Active" : "Inactive",
        ]),
        startY: 45,
        theme: "striped",
        headStyles: {
          fillColor: [40, 116, 166],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      });
      doc.save(`${tabName}_Parties_${moment().format("YYYY-MM-DD")}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
      alert("Failed to generate PDF.");
    }
  };

  // ── Add/Edit complete ───────────────────────────────────────────────────────
  const handleAddEditComplete = () => {
    setShowForm(false);
    setSelectedParty(null);
    fetchParties();
  };

  const toggleGroupExpansion = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Stats ───────────────────────────────────────────────────────────────────
  const PartiesStatsPage = () => {
    const stats = getPartiesStats();
    const partyTypeData = [
      { name: "Customers", value: stats.customers, color: "#3b82f6" },
      { name: "Vendors", value: stats.vendors, color: "#10b981" },
      { name: "Agents", value: stats.agents, color: "#f59e0b" },
      { name: "Shipping Lines", value: stats.shippingLines, color: "#ef4444" },
      { name: "Transporters", value: stats.transporters, color: "#8b5cf6" },
    ];
    const opData = [
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
      [
        ["Active Parties", stats.activeParties],
        ["Customers", stats.customers],
        ["Vendors", stats.vendors],
        ["Agents", stats.agents],
        ["Shipping Lines", stats.shippingLines],
        ["Transporters", stats.transporters],
      ].forEach(([label, val], i) => {
        doc.text(`${label}: ${val}`, 30, 80 + i * 10);
      });
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
            <FiDownload size={14} /> Export PDF
          </Button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          {[
            {
              label: "Total Parties",
              val: stats.totalParties,
              sub: `${stats.activeParties} active`,
              color: "blue",
            },
            {
              label: "Customers",
              val: stats.customers,
              sub: "Business clients",
              color: "green",
            },
            {
              label: "Vendors",
              val: stats.vendors,
              sub: "Service providers",
              color: "orange",
            },
            {
              label: "Agents",
              val: stats.agents,
              sub: "Representatives",
              color: "purple",
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
                      {partyTypeData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
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
                  <BarChart data={opData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
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

  // ── Import Results Dialog ──────────────────────────────────────────────────
  const ImportResultsDialog = () => {
    const successCount = importResults.filter(
      (r) => r.status === "success",
    ).length;
    const warningCount = importResults.filter(
      (r) => r.warnings && r.warnings.length > 0,
    ).length;
    const errorCount = importResults.filter((r) => r.status === "error").length;

    return (
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiInfo className='h-5 w-5 text-blue-600' />
              Import Results
            </DialogTitle>
            <DialogDescription>
              Summary: {successCount} successful, {warningCount} with warnings,{" "}
              {errorCount} failed
            </DialogDescription>
          </DialogHeader>

          <div className='flex gap-4 mb-4'>
            <div className='flex items-center gap-2'>
              <FiCheckCircle className='h-4 w-4 text-green-600' />
              <span className='text-sm'>Success: {successCount}</span>
            </div>
            <div className='flex items-center gap-2'>
              <FiAlertCircle className='h-4 w-4 text-yellow-600' />
              <span className='text-sm'>Warnings: {warningCount}</span>
            </div>
            <div className='flex items-center gap-2'>
              <FiX className='h-4 w-4 text-red-600' />
              <span className='text-sm'>Errors: {errorCount}</span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-16'>Row</TableHead>
                <TableHead>Party Code</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead className='w-24'>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importResults.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{result.row}</TableCell>
                  <TableCell className='font-medium'>
                    {result.partyCode}
                  </TableCell>
                  <TableCell>{result.partyName}</TableCell>
                  <TableCell>
                    {result.status === "success" && (
                      <Badge className='bg-green-100 text-green-700 border-green-200'>
                        Success
                      </Badge>
                    )}
                    {result.status === "warning" && (
                      <Badge className='bg-yellow-100 text-yellow-700 border-yellow-200'>
                        Warning
                      </Badge>
                    )}
                    {result.status === "error" && (
                      <Badge className='bg-red-100 text-red-700 border-red-200'>
                        Error
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='space-y-1'>
                      {result.warnings?.map((warning, wIndex) => (
                        <div
                          key={`w-${wIndex}`}
                          className='flex items-start gap-1 text-sm text-yellow-600'
                        >
                          <FiAlertCircle className='h-3.5 w-3.5 mt-0.5 flex-shrink-0' />
                          <span>{warning}</span>
                        </div>
                      ))}
                      {result.errors?.map((error, eIndex) => (
                        <div
                          key={`e-${eIndex}`}
                          className='flex items-start gap-1 text-sm text-red-600'
                        >
                          <FiX className='h-3.5 w-3.5 mt-0.5 flex-shrink-0' />
                          <span>{error}</span>
                        </div>
                      ))}
                      {!result.errors && !result.warnings && (
                        <span className='text-sm text-gray-600'>
                          {result.message}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={downloadImportResults}
              className='flex items-center gap-1.5'
            >
              <FiDownload className='h-3.5 w-3.5' />
              Download Report
            </Button>
            <Button size='sm' onClick={() => setShowImportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const EmptyState = ({ term }: { term: string }) => (
    <div className='flex flex-col items-center justify-center py-16'>
      <FiUsers className='mx-auto h-12 w-12 text-gray-400 mb-3' />
      <h3 className='text-base font-medium text-gray-900'>No parties found</h3>
      <p className='mt-1 text-sm text-gray-500'>
        {term
          ? "Try adjusting your search terms"
          : "Add your first party using the button above"}
      </p>
    </div>
  );

  const renderCategorizedView = () => {
    const grouped = getGroupedParties();
    if (!Object.keys(grouped).length) return <EmptyState term={searchText} />;
    return (
      <div className='space-y-3'>
        {Object.entries(grouped).map(([key, items]) => (
          <Card key={key} className='border shadow-sm'>
            <Collapsible
              open={expandedGroups[key]}
              onOpenChange={() => toggleGroupExpansion(key)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className='cursor-pointer hover:bg-gray-50 transition-colors py-3 px-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-semibold text-gray-900'>
                      {key}
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='text-xs px-2 py-0.5'>
                        {items.length} part{items.length !== 1 ? "ies" : "y"}
                      </Badge>
                      {expandedGroups[key] ? (
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
    const d = getCurrentTabData();
    if (!d?.length) return <EmptyState term={searchText} />;
    return (
      <AppDataTable
        data={d}
        loading={false}
        columns={columns}
        searchText={searchText}
        isPage
        isMultiSearch
      />
    );
  };

  // ── Show form ───────────────────────────────────────────────────────────────
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
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Parties List
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

  // ── Main render ─────────────────────────────────────────────────────────────
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
              />{" "}
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
              <FiUsers className='h-3.5 w-3.5' /> Add New Party
            </Button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='relative flex-1 max-w-md'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
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
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  <FiX className='h-4 w-4' />
                </button>
              )}
            </div>
            <div className='flex gap-2 items-center'>
              <Button
                onClick={downloadSampleExcel}
                size='sm'
                className='flex items-center gap-1.5 text-xs'
                variant='outline'
              >
                <FiDownload className='h-3.5 w-3.5' /> Sample File
              </Button>
              <label
                htmlFor='file-upload'
                className='cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
              >
                <FiUpload className='h-3.5 w-3.5' /> Import Excel
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
          {/* Info about default values & GL accounts */}
          <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md'>
            <div className='flex items-start gap-1.5 text-xs text-blue-700'>
              <FiInfo className='h-3.5 w-3.5 mt-0.5 flex-shrink-0' />
              <div>
                <p className='font-medium'>Excel import notes:</p>
                <p className='mt-0.5'>
                  Empty contact fields auto-fill with placeholder values
                  (Address Line 1, Phone, Email, Contact Person, Beneficiary
                  Name).{" "}
                  <strong>
                    For GL Linked = Yes parties, you must include a &quot;GL
                    Parent Account Code&quot; column with a valid code from your
                    chart of accounts.
                  </strong>{" "}
                  Set Non GL Party = Yes for parties that don&apos;t need a GL
                  account.
                </p>
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
              {[
                {
                  value: "ALL_PARTIES",
                  label: `All (${getAllParties().length})`,
                  icon: <FiUsers className='w-3.5 h-3.5 mr-1.5' />,
                  active: "blue",
                },
                {
                  value: "ACTIVE",
                  label: `Active (${getActiveParties().length})`,
                  icon: <FiBriefcase className='w-3.5 h-3.5 mr-1.5' />,
                  active: "green",
                },
                {
                  value: "CUSTOMERS",
                  label: `Customers (${getCustomers().length})`,
                  icon: <FiUsers className='w-3.5 h-3.5 mr-1.5' />,
                  active: "purple",
                },
                {
                  value: "VENDORS",
                  label: `Vendors (${getVendors().length})`,
                  icon: <FiBriefcase className='w-3.5 h-3.5 mr-1.5' />,
                  active: "orange",
                },
                {
                  value: "AGENTS",
                  label: `Agents (${getAgents().length})`,
                  icon: <FiUsers className='w-3.5 h-3.5 mr-1.5' />,
                  active: "indigo",
                },
                {
                  value: "LOGISTICS",
                  label: `Logistics (${getLogisticsParties().length})`,
                  icon: <FiTruck className='w-3.5 h-3.5 mr-1.5' />,
                  active: "teal",
                },
                {
                  value: "STATISTICS",
                  label: "Stats",
                  icon: <FiFilePlus className='w-3.5 h-3.5 mr-1.5' />,
                  active: "pink",
                },
              ].map(({ value, label, icon, active }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={`text-xs py-2 px-3 data-[state=active]:bg-${active}-50 data-[state=active]:text-${active}-700 data-[state=active]:shadow-none rounded-md`}
                >
                  {icon}
                  {label}
                </TabsTrigger>
              ))}
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
                  disabled={!currentTabData?.length}
                >
                  <FiFilePlus className='h-3.5 w-3.5' /> Export PDF
                </Button>
                <Button
                  onClick={() =>
                    downloadExcelWithData(currentTabData, tab.replace("_", " "))
                  }
                  size='sm'
                  className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                  disabled={!currentTabData?.length}
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

      {/* Import Results Dialog */}
      <ImportResultsDialog />

      {isLoading && <AppLoader />}
    </div>
  );
}
