"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import readXlsxFile from "read-excel-file";
import ContractTarrifForm from "@/views/forms/contract-tarrif-form/contract-tarrif-form";
import AppLoader from "@/components/app-loader";
import {
  FiTrash2,
  FiDownload,
  FiEdit,
  FiArrowLeft,
  FiFilePlus,
  FiRefreshCw,
  FiUpload,
  FiSearch,
  FiX,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
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

type ContractPageProps = { initialData?: any[] };

// ─── Field config ─────────────────────────────────────────────────────────────
const fieldConfig = [
  {
    fieldName: "contractTarrifId",
    apiKey: "ContractTarrifId",
    displayName: "Contract ID",
    isdisplayed: false,
    isselected: true,
    type: "int",
  },
  {
    fieldName: "contractTarrifNo",
    apiKey: "ContractTarrifNo",
    displayName: "Contract No",
    isdisplayed: true,
    isselected: true,
    type: "string",
  },
  {
    fieldName: "contractDate",
    apiKey: "ContractDate",
    displayName: "Contract Date",
    isdisplayed: true,
    isselected: true,
    type: "date",
  },
  {
    fieldName: "contractEffectiveDate",
    apiKey: "ContractEffectiveDate",
    displayName: "Effective Date",
    isdisplayed: true,
    isselected: true,
    type: "date",
  },
  {
    fieldName: "contractExpiryDate",
    apiKey: "ContractExpiryDate",
    displayName: "Expiry Date",
    isdisplayed: true,
    isselected: true,
    type: "date",
  },
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
    fieldName: "isGDRawMaterial",
    apiKey: "IsGDRawMaterial",
    displayName: "GD Raw Material",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isGDFinishedGoods",
    apiKey: "IsGDFinishedGoods",
    displayName: "GD Finished Goods",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isImport",
    apiKey: "IsImport",
    displayName: "Import",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isExport",
    apiKey: "IsExport",
    displayName: "Export",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isSea",
    apiKey: "IsSea",
    displayName: "Sea",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isAir",
    apiKey: "IsAir",
    displayName: "Air",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isLand",
    apiKey: "IsLand",
    displayName: "Land",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isFCL",
    apiKey: "IsFCL",
    displayName: "FCL",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isLCL",
    apiKey: "IsLCL",
    displayName: "LCL",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "isBreakBulk",
    apiKey: "IsBreakBulk",
    displayName: "Break Bulk",
    isdisplayed: true,
    isselected: true,
    type: "bool",
  },
  {
    fieldName: "remarks",
    apiKey: "Remarks",
    displayName: "Remarks",
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

// ─── Type helpers ─────────────────────────────────────────────────────────────
const parseBool = (v: any) =>
  typeof v === "boolean"
    ? v
    : ["true", "yes", "1"].includes(String(v).trim().toLowerCase());

const parseInt_ = (v: any) => {
  const n = parseInt(String(v ?? ""), 10);
  return isNaN(n) ? 0 : n;
};

const convertValue = (v: any, t: string) => {
  switch (t) {
    case "bool":
      return parseBool(v);
    case "int":
      return parseInt_(v);
    case "date":
      return v != null ? String(v) : "";
    default:
      return v != null ? String(v) : "";
  }
};

const formatDate = (val: any) => {
  if (!val) return "—";
  const d = moment(val);
  return d.isValid() ? d.format("DD-MMM-YYYY") : "—";
};

const isExpired = (expiryDate: any) => {
  if (!expiryDate) return false;
  return moment(expiryDate).isBefore(moment(), "day");
};

const isExpiringSoon = (expiryDate: any, days = 30) => {
  if (!expiryDate) return false;
  const expiry = moment(expiryDate);
  const now = moment();
  return expiry.isAfter(now) && expiry.diff(now, "days") <= days;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ContractTarrifPage({ initialData }: ContractPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const { toast } = useToast();

  // ── Auth headers ──────────────────────────────────────────────────────────
  const getAuthHeaders = (): HeadersInit => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const getBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    return base.endsWith("/") ? base : `${base}/`;
  };

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}ContractTarrif/GetList`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          select:
            "ContractTarrifId, ContractTarrifNo, ContractDate, ContractEffectiveDate, ContractExpiryDate, PartyId, CompanyId, IsGDRawMaterial, IsGDFinishedGoods, IsImport, IsExport, IsSea, IsAir, IsLand, IsFCL, IsLCL, IsBreakBulk, Remarks, IsActive, Version",
          where: "",
          search: "",
          sortOn: "ContractTarrifNo",
          page: "1",
          pageSize: "1000",
        }),
      });
      if (res.ok) setData(await res.json());
      else throw new Error(`HTTP ${res.status}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load contracts list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      setData(initialData);
    } else {
      fetchContracts();
    }
  }, []);

  // ── Fetch full record for edit ─────────────────────────────────────────────
  const handleEditClick = async (contractId: number) => {
    setFetchingId(contractId);
    try {
      const res = await fetch(`${getBaseUrl()}ContractTarrif/${contractId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const full = await res.json();
      setSelectedContract(full);
      setShowForm(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load contract details. Please try again.",
      });
    } finally {
      setFetchingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (item: any) => {
    if (
      !confirm(
        `Are you sure you want to delete contract "${item.contractTarrifNo}"?`,
      )
    )
      return;
    try {
      const res = await fetch(
        `${getBaseUrl()}ContractTarrif/${item.contractTarrifId}`,
        { method: "DELETE", headers: getAuthHeaders() },
      );
      if (res.ok) {
        setData((prev) =>
          prev.filter((r) => r.contractTarrifId !== item.contractTarrifId),
        );
        toast({
          title: "Deleted",
          description: "Contract deleted successfully.",
        });
      } else throw new Error();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error deleting contract. Please try again.",
      });
    }
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  const searchInItem = (item: any, term: string) => {
    if (!term) return true;
    const t = term.toLowerCase();
    return [
      item.contractTarrifNo,
      item.remarks,
      formatDate(item.contractDate),
      formatDate(item.contractEffectiveDate),
      formatDate(item.contractExpiryDate),
    ].some((f) => f?.toString().toLowerCase().includes(t));
  };

  // ── Tab data helpers ───────────────────────────────────────────────────────
  const getAll = () => data || [];
  const getActive = () => data?.filter((i) => i.isActive) || [];
  const getImport = () => data?.filter((i) => i.isImport) || [];
  const getExport = () => data?.filter((i) => i.isExport) || [];
  const getSea = () => data?.filter((i) => i.isSea) || [];
  const getAir = () => data?.filter((i) => i.isAir) || [];
  const getLand = () => data?.filter((i) => i.isLand) || [];
  const getExpired = () =>
    data?.filter((i) => isExpired(i.contractExpiryDate)) || [];
  const getExpiringSoon = () =>
    data?.filter(
      (i) =>
        !isExpired(i.contractExpiryDate) &&
        isExpiringSoon(i.contractExpiryDate),
    ) || [];

  const getCurrentTabData = () => {
    const map: Record<string, any[]> = {
      ALL: getAll(),
      ACTIVE: getActive(),
      IMPORT: getImport(),
      EXPORT: getExport(),
      SEA: getSea(),
      AIR: getAir(),
      LAND: getLand(),
      EXPIRED: getExpired(),
      EXPIRING: getExpiringSoon(),
    };
    return (map[activeTab] ?? getAll()).filter((i) =>
      searchInItem(i, searchText),
    );
  };

  const getStats = () => {
    const all = getAll();
    return {
      total: all.length,
      active: all.filter((i) => i.isActive).length,
      import: all.filter((i) => i.isImport).length,
      export: all.filter((i) => i.isExport).length,
      sea: all.filter((i) => i.isSea).length,
      air: all.filter((i) => i.isAir).length,
      land: all.filter((i) => i.isLand).length,
      fcl: all.filter((i) => i.isFCL).length,
      lcl: all.filter((i) => i.isLCL).length,
      breakBulk: all.filter((i) => i.isBreakBulk).length,
      gdRaw: all.filter((i) => i.isGDRawMaterial).length,
      gdFinished: all.filter((i) => i.isGDFinishedGoods).length,
      expired: getExpired().length,
      expiringSoon: getExpiringSoon().length,
    };
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const contract = row.original;
        const isFetching = fetchingId === contract.contractTarrifId;
        return (
          <div className='flex gap-1.5'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled={isFetching}
                    className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-40'
                    onClick={() => handleEditClick(contract.contractTarrifId)}
                  >
                    {isFetching ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <FiEdit size={14} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>Edit Contract</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors'
                    onClick={() => handleDelete(contract)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>Delete Contract</p>
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
      accessorKey: "contractTarrifNo",
      header: "Contract No",
      cell: ({ row }) => (
        <span className='font-semibold text-sm text-gray-900'>
          {row.getValue("contractTarrifNo") || "—"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "contractDate",
      header: "Contract Date",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {formatDate(row.getValue("contractDate"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "contractEffectiveDate",
      header: "Effective Date",
      cell: ({ row }) => (
        <span className='text-sm text-gray-700'>
          {formatDate(row.getValue("contractEffectiveDate"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "contractExpiryDate",
      header: "Expiry Date",
      cell: ({ row }) => {
        const val = row.getValue("contractExpiryDate");
        const expired = isExpired(val);
        const expiring = !expired && isExpiringSoon(val);
        return (
          <span
            className={`text-sm font-medium ${
              expired
                ? "text-red-600"
                : expiring
                  ? "text-orange-600"
                  : "text-gray-700"
            }`}
          >
            {formatDate(val)}
            {expired && (
              <span className='ml-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1 rounded'>
                Expired
              </span>
            )}
            {expiring && (
              <span className='ml-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1 rounded'>
                Soon
              </span>
            )}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "tradeType",
      header: "Trade Type",
      cell: ({ row }) => {
        const tags: string[] = [];
        if (row.original.isImport) tags.push("Import");
        if (row.original.isExport) tags.push("Export");
        return (
          <div className='flex flex-wrap gap-1'>
            {tags.length > 0 ? (
              tags.map((t, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    t === "Import"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}
                >
                  {t}
                </span>
              ))
            ) : (
              <span className='text-xs text-gray-400'>—</span>
            )}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "transportMode",
      header: "Mode",
      cell: ({ row }) => {
        const modes: { label: string; color: string }[] = [];
        if (row.original.isSea)
          modes.push({
            label: "Sea",
            color: "bg-cyan-50 text-cyan-700 border-cyan-200",
          });
        if (row.original.isAir)
          modes.push({
            label: "Air",
            color: "bg-sky-50 text-sky-700 border-sky-200",
          });
        if (row.original.isLand)
          modes.push({
            label: "Land",
            color: "bg-amber-50 text-amber-700 border-amber-200",
          });
        return (
          <div className='flex flex-wrap gap-1'>
            {modes.length > 0 ? (
              modes.map((m, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${m.color}`}
                >
                  {m.label}
                </span>
              ))
            ) : (
              <span className='text-xs text-gray-400'>—</span>
            )}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "cargoType",
      header: "Cargo Type",
      cell: ({ row }) => {
        const types: string[] = [];
        if (row.original.isFCL) types.push("FCL");
        if (row.original.isLCL) types.push("LCL");
        if (row.original.isBreakBulk) types.push("Break Bulk");
        return (
          <div className='flex flex-wrap gap-1'>
            {types.length > 0 ? (
              types.map((t, i) => (
                <span
                  key={i}
                  className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200'
                >
                  {t}
                </span>
              ))
            ) : (
              <span className='text-xs text-gray-400'>—</span>
            )}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "gdType",
      header: "GD Type",
      cell: ({ row }) => {
        const types: string[] = [];
        if (row.original.isGDRawMaterial) types.push("Raw Material");
        if (row.original.isGDFinishedGoods) types.push("Finished Goods");
        return (
          <div className='flex flex-wrap gap-1'>
            {types.length > 0 ? (
              types.map((t, i) => (
                <span
                  key={i}
                  className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200'
                >
                  {t}
                </span>
              ))
            ) : (
              <span className='text-xs text-gray-400'>—</span>
            )}
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <span
          className='text-sm text-gray-600 truncate max-w-[150px] block'
          title={row.getValue("remarks") || ""}
        >
          {row.getValue("remarks") || "—"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.getValue("isActive") ? (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200'>
            <FiCheckCircle className='h-3 w-3' /> Active
          </span>
        ) : (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200'>
            <FiXCircle className='h-3 w-3' /> Inactive
          </span>
        ),
      enableColumnFilter: false,
    },
  ];

  // ── Excel export ───────────────────────────────────────────────────────────
  const downloadExcelWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport?.length) {
      alert("No data to export");
      return;
    }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(tabName);
    ws.addRow(displayedFields.map((f) => f.displayName));
    dataToExport.forEach((c) =>
      ws.addRow(
        displayedFields.map((field) => {
          const v = c[field.fieldName];
          if (field.type === "bool") return v ? "Yes" : "No";
          if (field.type === "date") return formatDate(v);
          return v ?? "";
        }),
      ),
    );
    ws.columns = ws.columns.map((col) => ({ ...col, width: 18 }));
    wb.xlsx
      .writeBuffer()
      .then((buf: any) => saveAs(new Blob([buf]), `${tabName}_Contracts.xlsx`));
  };

  const downloadSampleExcel = () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("SampleContracts");
    ws.addRow(displayedFields.map((f) => f.displayName));
    ws.addRow(
      displayedFields.map((field) => {
        switch (field.fieldName) {
          case "contractTarrifNo":
            return "CT-2024-001";
          case "contractDate":
            return "2024-01-01";
          case "contractEffectiveDate":
            return "2024-01-01";
          case "contractExpiryDate":
            return "2024-12-31";
          case "isActive":
            return "Yes";
          case "isImport":
            return "Yes";
          case "isSea":
            return "Yes";
          case "isFCL":
            return "Yes";
          case "remarks":
            return "Sample contract";
          default:
            return field.type === "bool" ? "No" : `Sample ${field.displayName}`;
        }
      }),
    );
    ws.columns = ws.columns.map((col) => ({ ...col, width: 18 }));
    wb.xlsx
      .writeBuffer()
      .then((buf: any) => saveAs(new Blob([buf]), "SampleFile_Contracts.xlsx"));
  };

  // ── Excel import ───────────────────────────────────────────────────────────
  const buildHeaderMap = () => {
    const map: Record<string, (typeof fieldConfig)[0]> = {};
    fieldConfig.forEach((f) => {
      map[f.displayName.trim().toLowerCase()] = f;
    });
    return map;
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
        h != null ? String(h).trim().toLowerCase() : "",
      );
      const dataRows = rows
        .slice(1)
        .filter((row) => row.some((c) => c != null && c !== ""));
      if (!dataRows.length) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No data rows after header.",
        });
        return;
      }
      setIsLoading(true);
      insertImportedData(headerRow, dataRows);
    });
    e.target.value = "";
  };

  const insertImportedData = async (headerRow: string[], dataRows: any[][]) => {
    const headerMap = buildHeaderMap();
    let success = 0,
      fail = 0;
    try {
      await Promise.all(
        dataRows.map(async (row) => {
          const dto: Record<string, any> = {};
          fieldConfig.forEach((f) => {
            dto[f.apiKey] =
              f.type === "bool" ? false : f.type === "int" ? 0 : "";
          });
          headerRow.forEach((header, idx) => {
            const def = headerMap[header];
            if (def)
              dto[def.apiKey] = convertValue(
                idx < row.length ? row[idx] : null,
                def.type,
              );
          });
          dto["ContractTarrifId"] = 0;
          try {
            const res = await fetch(`${getBaseUrl()}ContractTarrif`, {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify(dto),
            });
            if (res.ok) success++;
            else {
              fail++;
              console.error("Import fail:", await res.text());
            }
          } catch (err) {
            fail++;
            console.error("Import exception:", err);
          }
        }),
      );
      setIsLoading(false);
      if (fail === 0)
        toast({
          title: "Import Successful",
          description: `${success} contract${success !== 1 ? "s" : ""} imported.`,
        });
      else
        toast({
          variant: "destructive",
          title: "Partial Import",
          description: `${success} imported, ${fail} failed.`,
        });
      fetchContracts();
    } catch {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Unexpected error during import.",
      });
    }
  };

  // ── PDF export ─────────────────────────────────────────────────────────────
  const downloadPDFWithData = (dataToExport: any[], tabName: string) => {
    if (!dataToExport?.length) {
      alert(`No data for ${tabName}`);
      return;
    }
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(40, 116, 166);
      doc.text(`${tabName} - Contracts Report`, 20, 20);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Total Records: ${dataToExport.length}`, 20, 37);
      autoTable(doc, {
        head: [
          [
            "Contract No",
            "Contract Date",
            "Effective Date",
            "Expiry Date",
            "Trade",
            "Mode",
            "Cargo",
            "Status",
          ],
        ],
        body: dataToExport.map((c) => [
          c.contractTarrifNo || "—",
          formatDate(c.contractDate),
          formatDate(c.contractEffectiveDate),
          formatDate(c.contractExpiryDate),
          [c.isImport && "Import", c.isExport && "Export"]
            .filter(Boolean)
            .join(", ") || "—",
          [c.isSea && "Sea", c.isAir && "Air", c.isLand && "Land"]
            .filter(Boolean)
            .join(", ") || "—",
          [c.isFCL && "FCL", c.isLCL && "LCL", c.isBreakBulk && "Break Bulk"]
            .filter(Boolean)
            .join(", ") || "—",
          c.isActive ? "Active" : "Inactive",
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
      doc.save(`${tabName}_Contracts_${moment().format("YYYY-MM-DD")}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
      alert("Failed to generate PDF.");
    }
  };

  // ── Add/Edit complete ───────────────────────────────────────────────────────
  const handleAddEditComplete = () => {
    setShowForm(false);
    setSelectedContract(null);
    fetchContracts();
  };

  // ── Stats component ─────────────────────────────────────────────────────────
  const ContractStatsSection = () => {
    const stats = getStats();

    const tradeData = [
      { name: "Import", value: stats.import, color: "#3b82f6" },
      { name: "Export", value: stats.export, color: "#10b981" },
    ];
    const modeData = [
      { name: "Sea", value: stats.sea, color: "#06b6d4" },
      { name: "Air", value: stats.air, color: "#0ea5e9" },
      { name: "Land", value: stats.land, color: "#f59e0b" },
    ];
    const cargoData = [
      { name: "FCL", value: stats.fcl, color: "#8b5cf6" },
      { name: "LCL", value: stats.lcl, color: "#a78bfa" },
      { name: "Break Bulk", value: stats.breakBulk, color: "#c4b5fd" },
    ];
    const gdData = [
      { name: "Raw Material", value: stats.gdRaw, color: "#f97316" },
      { name: "Finished Goods", value: stats.gdFinished, color: "#fb923c" },
    ];

    const exportStatsPDF = () => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(40, 116, 166);
      doc.text("Contract Tariff Statistics Report", 20, 20);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 35);
      const rows = [
        ["Total Contracts", stats.total],
        ["Active", stats.active],
        ["Import", stats.import],
        ["Export", stats.export],
        ["Sea", stats.sea],
        ["Air", stats.air],
        ["Land", stats.land],
        ["FCL", stats.fcl],
        ["LCL", stats.lcl],
        ["Break Bulk", stats.breakBulk],
        ["Expired", stats.expired],
        ["Expiring Soon (30 days)", stats.expiringSoon],
      ];
      rows.forEach(([label, val], i) => {
        doc.text(`${label}: ${val}`, 30, 55 + i * 9);
      });
      doc.save(`Contracts_Statistics_${moment().format("YYYY-MM-DD")}.pdf`);
    };

    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Contract Statistics
          </h2>
          <Button
            onClick={exportStatsPDF}
            size='sm'
            className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'
          >
            <FiDownload size={14} /> Export PDF
          </Button>
        </div>

        {/* KPI Cards */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {[
            {
              label: "Total Contracts",
              val: stats.total,
              sub: `${stats.active} active`,
              color: "blue",
            },
            {
              label: "Expiring Soon",
              val: stats.expiringSoon,
              sub: "Within 30 days",
              color: "orange",
            },
            {
              label: "Expired",
              val: stats.expired,
              sub: "Past expiry date",
              color: "red",
            },
            {
              label: "Import Contracts",
              val: stats.import,
              sub: `${stats.export} export`,
              color: "green",
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

        {/* Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Trade Type */}
          <Card className='border shadow-sm'>
            <CardHeader className='pb-3 pt-4 px-4'>
              <CardTitle className='text-sm font-semibold text-gray-900'>
                Trade Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4 px-4'>
              <div className='h-56'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={tradeData}
                      cx='50%'
                      cy='50%'
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey='value'
                    >
                      {tradeData.map((e, i) => (
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

          {/* Transport Mode */}
          <Card className='border shadow-sm'>
            <CardHeader className='pb-3 pt-4 px-4'>
              <CardTitle className='text-sm font-semibold text-gray-900'>
                Transport Mode Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4 px-4'>
              <div className='h-56'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={modeData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Bar dataKey='value' fill='#06b6d4' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cargo Type */}
          <Card className='border shadow-sm'>
            <CardHeader className='pb-3 pt-4 px-4'>
              <CardTitle className='text-sm font-semibold text-gray-900'>
                Cargo Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4 px-4'>
              <div className='h-56'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={cargoData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Bar dataKey='value' fill='#8b5cf6' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* GD Type */}
          <Card className='border shadow-sm'>
            <CardHeader className='pb-3 pt-4 px-4'>
              <CardTitle className='text-sm font-semibold text-gray-900'>
                GD Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4 px-4'>
              <div className='h-56'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={gdData}
                      cx='50%'
                      cy='50%'
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey='value'
                    >
                      {gdData.map((e, i) => (
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
        </div>
      </div>
    );
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  const EmptyState = ({ term }: { term: string }) => (
    <div className='flex flex-col items-center justify-center py-16'>
      <FiFileText className='mx-auto h-12 w-12 text-gray-400 mb-3' />
      <h3 className='text-base font-medium text-gray-900'>
        No contracts found
      </h3>
      <p className='mt-1 text-sm text-gray-500'>
        {term
          ? "Try adjusting your search terms"
          : "Add your first contract using the button above"}
      </p>
    </div>
  );

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

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const stats = getStats();
  const tabDefs = [
    { value: "ALL", label: `All (${stats.total})` },
    { value: "ACTIVE", label: `Active (${stats.active})` },
    { value: "IMPORT", label: `Import (${stats.import})` },
    { value: "EXPORT", label: `Export (${stats.export})` },
    { value: "SEA", label: `Sea (${stats.sea})` },
    { value: "AIR", label: `Air (${stats.air})` },
    { value: "LAND", label: `Land (${stats.land})` },
    {
      value: "EXPIRING",
      label: `Expiring (${stats.expiringSoon})`,
      alert: stats.expiringSoon > 0,
    },
    {
      value: "EXPIRED",
      label: `Expired (${stats.expired})`,
      alert: stats.expired > 0,
    },
    { value: "STATISTICS", label: "Stats" },
  ];

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
              setSelectedContract(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Contracts List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <ContractTarrifForm
              type={selectedContract ? "edit" : "add"}
              defaultState={selectedContract || {}}
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
              Contract Tariff Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Manage all contract tariffs — trade, mode, cargo type and validity
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={fetchContracts}
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
                setSelectedContract(null);
                setShowForm(true);
              }}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5'
            >
              <FiFileText className='h-3.5 w-3.5' /> Add New Contract
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
                placeholder='Search by contract no, remarks, date...'
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
                htmlFor='contract-file-upload'
                className='cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
              >
                <FiUpload className='h-3.5 w-3.5' /> Import Excel
              </label>
              <Input
                id='contract-file-upload'
                type='file'
                accept='.xlsx'
                onChange={handleFileUpload}
                className='hidden'
              />
            </div>
          </div>

          {/* Expiry alerts */}
          {(stats.expiringSoon > 0 || stats.expired > 0) && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {stats.expiringSoon > 0 && (
                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-full'>
                  ⚠️ {stats.expiringSoon} contract
                  {stats.expiringSoon !== 1 ? "s" : ""} expiring within 30 days
                </span>
              )}
              {stats.expired > 0 && (
                <span className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full'>
                  ❌ {stats.expired} contract{stats.expired !== 1 ? "s" : ""}{" "}
                  expired
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue='ALL'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-3'
        >
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <TabsList className='flex flex-wrap gap-1 bg-transparent h-auto p-0'>
              {tabDefs.map(({ value, label, alert }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={`text-xs py-2 px-3 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none ${
                    alert ? "text-orange-700 font-semibold" : ""
                  }`}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabDefs
            .filter((t) => t.value !== "STATISTICS")
            .map(({ value }) => (
              <TabsContent key={value} value={value} className='space-y-3 mt-3'>
                <div className='flex justify-end gap-2'>
                  <Button
                    onClick={() =>
                      downloadPDFWithData(
                        currentTabData,
                        value.replace("_", " "),
                      )
                    }
                    size='sm'
                    className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs'
                    disabled={!currentTabData?.length}
                  >
                    <FiFilePlus className='h-3.5 w-3.5' /> Export PDF
                  </Button>
                  <Button
                    onClick={() =>
                      downloadExcelWithData(
                        currentTabData,
                        value.replace("_", " "),
                      )
                    }
                    size='sm'
                    className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                    disabled={!currentTabData?.length}
                  >
                    <FiDownload className='h-3.5 w-3.5' /> Export Excel
                  </Button>
                </div>
                <div className='bg-white rounded-lg shadow-sm border'>
                  {renderTableView()}
                </div>
              </TabsContent>
            ))}

          <TabsContent value='STATISTICS' className='space-y-3 mt-3'>
            <div className='bg-white rounded-lg shadow-sm border p-4'>
              <ContractStatsSection />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {isLoading && <AppLoader />}
    </div>
  );
}
