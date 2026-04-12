"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  FiAlertCircle,
  FiLock,
  FiBriefcase,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import { useToast } from "@/hooks/use-toast";
import ExternalBankCashFundRequestForm from "@/views/forms/external-bank-cash-fund-request/ExternalBankCashFundRequestForm_MasterDetail";
import ExternalBankCashFundRequestApprovalForm from "@/views/forms/external-bank-cash-fund-request/ExternalBankCashFundRequestForm_Approval";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExternalBankCashFundRequestPageProps = {
  initialData?: ExternalBankCashFundRequest[];
};

type ExternalBankCashFundRequest = {
  externalBankCashFundRequestId: number;
  jobId: number | null;
  jobNumber?: string;
  customerPartyId: number | null;
  customerPartyName?: string;
  requestorUserId?: number;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  approvalStatus: string;
  approvedBy?: string | null;
  approvedOn?: string | null;
  requestedTo?: number | null;
  createdOn: string;
  createdBy?: string | null;
  version: number;
  // ← plural "Funds" — matches the API schema
  externalBankCashFundsRequestDetails: ExternalCashFundDetailLineItem[];
};

type ExternalCashFundDetailLineItem = {
  externalBankCashFundsRequestDetailsId: number; // ← plural "Funds"
  externalbankFundRequestMasterId?: number;
  headCoaId?: number;
  beneficiaryCoaId?: number;
  headOfAccount?: string;
  beneficiary?: string;
  accountNo?: string;
  requestedAmount: number;
  approvedAmount: number;
  subRequestStatus?: string;
  remarks?: string;
  createdOn?: string;
  version: number;
};

type StatusOption = { key: string; label: string };

type User = {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  designation?: string;
  departmentId?: number;
  isAllowedRequestApproval?: boolean;
  roleId?: number;
};

type ApiResponse<T> = T[];

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = "100";
const DEFAULT_CURRENCY = "PKR";

// ─── Utility Functions ────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(amount);

const formatCompactCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    notation: "compact",
  }).format(amount);

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExternalBankCashFundRequestPage({
  initialData,
}: ExternalBankCashFundRequestPageProps) {
  const [data, setData] = useState<ExternalBankCashFundRequest[]>(
    initialData || [],
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ExternalBankCashFundRequest | null>(null);
  const [selectedRequestForApproval, setSelectedRequestForApproval] =
    useState<ExternalBankCashFundRequest | null>(null);
  const [activeTab, setActiveTab] = useState("ALL_REQUESTS");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<ExternalBankCashFundRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [pendingStatus, setPendingStatus] = useState("Pending");
  const [approvedStatus, setApprovedStatus] = useState("Approved");
  const [rejectedStatus, setRejectedStatus] = useState("Rejected");

  const [userId, setUserId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ── Get current user from localStorage ─────────────────────────────────────
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserRole = localStorage.getItem("userRole");
    const storedUserData = localStorage.getItem("userData");

    if (storedUserId) setUserId(parseInt(storedUserId, 10));

    if (storedUserRole) {
      const roleLower = storedUserRole.toLowerCase();
      setIsAdmin(roleLower === "admin" || storedUserRole === "1");
    }

    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setCurrentUser({
          ...userData,
          userId:
            userData.userId ||
            userData.UserId ||
            parseInt(storedUserId || "0", 10),
          isAllowedRequestApproval:
            userData.isAllowedRequestApproval ??
            userData.IsAllowedRequestApproval ??
            false,
        });
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  // ── Fetch all users ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL;
        if (!base) return;
        const res = await fetch(`${base}User/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "UserId, Username, FullName, Email, Designation, DepartmentId, IsAllowedRequestApproval, RoleId",
            where: "",
            sortOn: "FullName ASC",
            page: "1",
            pageSize: "500",
          }),
        });
        if (res.ok) setUsers(await res.json());
      } catch (e) {
        console.error("Users fetch error:", e);
      }
    };
    fetchUsers();
  }, []);

  // ── Fetch status options ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL;
        if (!base) throw new Error("API base URL not configured");
        const res = await fetch(
          `${base}General/GetTypeValues?typeName=FundRequest_Detail_Status`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: abortControllerRef.current?.signal,
          },
        );
        if (!res.ok) throw new Error(`Failed to fetch statuses: ${res.status}`);
        const raw: Record<string, string> = await res.json();
        const opts: StatusOption[] = Object.entries(raw).map(
          ([key, label]) => ({ key, label }),
        );
        setStatusOptions(opts);
        const p = opts.find((o) => o.key.toLowerCase() === "pending");
        const a = opts.find((o) => o.key.toLowerCase() === "approved");
        const r = opts.find((o) => o.key.toLowerCase() === "rejected");
        if (p) setPendingStatus(p.key);
        if (a) setApprovedStatus(a.key);
        if (r) setRejectedStatus(r.key);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error("Status fetch error:", e);
      }
    };
    fetchStatuses();
  }, [toast]);

  // ── Status filter options ───────────────────────────────────────────────────
  const statusFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      { value: pendingStatus, label: pendingStatus },
      { value: approvedStatus, label: approvedStatus },
      { value: rejectedStatus, label: rejectedStatus },
      { value: "Paid", label: "Paid" },
    ],
    [pendingStatus, approvedStatus, rejectedStatus],
  );

  // ── Normalise raw API item ──────────────────────────────────────────────────
  const normaliseItem = useCallback(
    (item: any): ExternalBankCashFundRequest => ({
      ...item,
      // Singular "Fund" for the master ID
      externalBankCashFundRequestId:
        item.externalBankCashFundRequestId ||
        item.ExternalBankCashFundRequestId ||
        0,
      jobId: item.jobId ?? item.JobId ?? null,
      jobNumber: item.jobNumber || item.JobNumber || null,
      customerPartyId: item.customerPartyId ?? item.CustomerPartyId ?? null,
      customerPartyName:
        item.customerParty?.partyName ||
        item.customerPartyName ||
        item.CustomerPartyName ||
        null,
      requestorUserId: item.requestorUserId || item.RequestorUserId || null,
      createdBy: item.createdBy || item.CreatedBy || null,
      totalRequestedAmount: Number(item.totalRequestedAmount) || 0,
      totalApprovedAmount: Number(item.totalApprovedAmount) || 0,
      // Plural "Funds" for the details array — handle both casings
      externalBankCashFundsRequestDetails: Array.isArray(
        item.externalBankCashFundsRequestDetails,
      )
        ? item.externalBankCashFundsRequestDetails
        : Array.isArray(item.ExternalBankCashFundsRequestDetails)
          ? item.ExternalBankCashFundsRequestDetails
          : Array.isArray(item.externalBankCashFundRequestDetails)
            ? item.externalBankCashFundRequestDetails
            : [],
    }),
    [],
  );

  // ── Permission check helpers ────────────────────────────────────────────────
  const canApproveRequest = useCallback(
    (request: ExternalBankCashFundRequest): boolean => {
      if (!userId) return false;
      if (request.approvalStatus !== pendingStatus) return false;
      if (request.requestedTo !== userId) return false;
      let userHasApprovalPermission =
        currentUser?.isAllowedRequestApproval === true;
      if (!userHasApprovalPermission) {
        const userFromList = users.find((u) => u.userId === userId);
        userHasApprovalPermission =
          userFromList?.isAllowedRequestApproval === true;
      }
      return userHasApprovalPermission;
    },
    [currentUser, userId, pendingStatus, users],
  );

  const canEditRequest = useCallback(
    (request: ExternalBankCashFundRequest): boolean => {
      if (!userId) return false;
      if (isAdmin) return true;
      if (request.approvalStatus !== pendingStatus) return false;
      return request.requestorUserId === userId;
    },
    [userId, isAdmin, pendingStatus],
  );

  const canDeleteRequest = useCallback(
    (request: ExternalBankCashFundRequest): boolean => {
      if (!userId) return false;
      if (isAdmin) return true;
      if (request.approvalStatus !== pendingStatus) return false;
      return request.requestorUserId === userId;
    },
    [userId, isAdmin, pendingStatus],
  );

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchFundRequests = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) throw new Error("API base URL not configured");

      const response = await fetch(
        `${baseUrl}ExternalBankCashFundRequest/GetList`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "ExternalBankCashFundRequestId,JobId,CustomerPartyId,TotalRequestedAmount,TotalApprovedAmount,ApprovalStatus,ApprovedBy,ApprovedOn,RequestedTo,CreatedOn,CreatedBy,Version,RequestorUserId",
            where: "",
            sortOn: "ExternalBankCashFundRequestId DESC",
            page: "1",
            pageSize: PAGE_SIZE,
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok)
        throw new Error(`${response.status} ${response.statusText}`);

      const requestData: ApiResponse<any> = await response.json();
      const processedData = requestData.map(normaliseItem);
      setData(processedData);
      toast({
        title: "Success",
        description: `Loaded ${processedData.length} external cash fund request(s)`,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Fetch error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load external cash fund requests",
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load external cash fund requests",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, normaliseItem]);

  // ── Fetch single record ─────────────────────────────────────────────────────
  const fetchRequestDetails = useCallback(
    async (id: number): Promise<ExternalBankCashFundRequest | null> => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("API base URL not configured");

        const response = await fetch(
          `${baseUrl}ExternalBankCashFundRequest/${id}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!response.ok) throw new Error(`${response.status}`);

        const fullData = await response.json();
        return normaliseItem(fullData);
      } catch (error) {
        console.error("Detail fetch error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load request details",
        });
        return null;
      }
    },
    [toast, normaliseItem],
  );

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) {
      fetchFundRequests();
    } else {
      setData(initialData.map(normaliseItem));
    }
  }, [initialData, fetchFundRequests, normaliseItem]);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const searchInItem = useCallback(
    (item: ExternalBankCashFundRequest, term: string): boolean => {
      if (!term) return true;
      const q = term.toLowerCase();
      const fields = [
        item.approvalStatus,
        item.jobNumber,
        item.customerPartyName,
        item.createdBy,
        item.externalBankCashFundRequestId?.toString(),
        item.jobId?.toString(),
        item.totalRequestedAmount?.toString(),
        // ← plural "Funds"
        ...(item.externalBankCashFundsRequestDetails || []).flatMap((d) => [
          d.headOfAccount,
          d.beneficiary,
          d.accountNo,
          d.subRequestStatus,
          d.remarks,
        ]),
      ].filter(Boolean) as string[];
      return fields.some((f) => f.toLowerCase().includes(q));
    },
    [],
  );

  const getCurrentTabData = useMemo(() => {
    let tabData = data;
    switch (activeTab) {
      case "PENDING":
        tabData = data.filter((i) => i.approvalStatus === pendingStatus);
        break;
      case "APPROVED":
        tabData = data.filter((i) => i.approvalStatus === approvedStatus);
        break;
      case "REJECTED":
        tabData = data.filter((i) => i.approvalStatus === rejectedStatus);
        break;
      case "PAID":
        tabData = data.filter((i) => i.approvalStatus === "Paid");
        break;
      default:
        break;
    }
    if (activeTab === "ALL_REQUESTS" && statusFilter !== "ALL") {
      tabData = tabData.filter((i) => i.approvalStatus === statusFilter);
    }
    if (searchText) {
      tabData = tabData.filter((i) => searchInItem(i, searchText));
    }
    return tabData;
  }, [
    data,
    activeTab,
    statusFilter,
    searchText,
    pendingStatus,
    approvedStatus,
    rejectedStatus,
    searchInItem,
  ]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const getRequestStats = useMemo(
    () => ({
      totalRequests: data.length,
      pendingRequests: data.filter((i) => i.approvalStatus === pendingStatus)
        .length,
      approvedRequests: data.filter((i) => i.approvalStatus === approvedStatus)
        .length,
      rejectedRequests: data.filter((i) => i.approvalStatus === rejectedStatus)
        .length,
      paidRequests: data.filter((i) => i.approvalStatus === "Paid").length,
      totalRequestedAmount: data.reduce(
        (s, i) => s + (i.totalRequestedAmount || 0),
        0,
      ),
      totalApprovedAmount: data.reduce(
        (s, i) => s + (i.totalApprovedAmount || 0),
        0,
      ),
      // ← plural "Funds"
      totalLineItems: data.reduce(
        (s, i) => s + (i.externalBankCashFundsRequestDetails?.length || 0),
        0,
      ),
    }),
    [data, pendingStatus, approvedStatus, rejectedStatus],
  );

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleAddEditComplete = useCallback(() => {
    setShowForm(false);
    setSelectedRequest(null);
    fetchFundRequests();
  }, [fetchFundRequests]);

  const handleApprovalComplete = useCallback(() => {
    setShowApprovalForm(false);
    setSelectedRequestForApproval(null);
    fetchFundRequests();
  }, [fetchFundRequests]);

  const handleDelete = useCallback(
    async (item: ExternalBankCashFundRequest) => {
      if (!canDeleteRequest(item)) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to delete this request.",
        });
        return;
      }

      // ← plural "Funds"
      const count = item.externalBankCashFundsRequestDetails?.length || 0;
      if (
        !confirm(
          `Delete external cash fund request #${item.externalBankCashFundRequestId}? This will remove the master record and all ${count} line item(s).`,
        )
      )
        return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("API base URL not configured");

        const response = await fetch(
          `${baseUrl}ExternalBankCashFundRequest/${item.externalBankCashFundRequestId}`,
          { method: "DELETE" },
        );

        if (!response.ok) throw new Error("Delete failed");

        setData((prev) =>
          prev.filter(
            (r) =>
              r.externalBankCashFundRequestId !==
              item.externalBankCashFundRequestId,
          ),
        );
        toast({
          title: "Success",
          description: `Request deleted (${count} line items removed)`,
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete request",
        });
      }
    },
    [toast, canDeleteRequest],
  );

  const handleViewDetails = useCallback(
    async (request: ExternalBankCashFundRequest) => {
      // ← plural "Funds"
      if (!request.externalBankCashFundsRequestDetails?.length) {
        setIsLoading(true);
        const full = await fetchRequestDetails(
          request.externalBankCashFundRequestId,
        );
        setIsLoading(false);

        if (full) {
          setSelectedRequestDetails(full);
          setData((prev) =>
            prev.map((i) =>
              i.externalBankCashFundRequestId ===
              full.externalBankCashFundRequestId
                ? {
                    ...i,
                    // ← plural "Funds"
                    externalBankCashFundsRequestDetails:
                      full.externalBankCashFundsRequestDetails || [],
                  }
                : i,
            ),
          );
        } else {
          setSelectedRequestDetails(request);
        }
      } else {
        setSelectedRequestDetails(request);
      }
      setViewDialogOpen(true);
    },
    [fetchRequestDetails],
  );

  const handleApproveClick = useCallback(
    async (request: ExternalBankCashFundRequest) => {
      if (!canApproveRequest(request)) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to approve this request.",
        });
        return;
      }
      setIsLoading(true);
      const full = await fetchRequestDetails(
        request.externalBankCashFundRequestId,
      );
      setIsLoading(false);
      if (full) {
        setSelectedRequestForApproval(full);
        setShowApprovalForm(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load request details for approval",
        });
      }
    },
    [fetchRequestDetails, toast, canApproveRequest],
  );

  const handleEditClick = useCallback(
    async (request: ExternalBankCashFundRequest) => {
      if (!canEditRequest(request)) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description:
            request.approvalStatus !== pendingStatus
              ? `Cannot edit ${request.approvalStatus} requests.`
              : request.requestorUserId !== userId
                ? "You can only edit requests that you created."
                : "You don't have permission to edit this request.",
        });
        return;
      }
      setIsLoading(true);
      const full = await fetchRequestDetails(
        request.externalBankCashFundRequestId,
      );
      setIsLoading(false);
      if (full) {
        setSelectedRequest(full);
        setShowForm(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load request details for editing",
        });
      }
    },
    [fetchRequestDetails, toast, canEditRequest, pendingStatus, userId],
  );

  // ── Exports ─────────────────────────────────────────────────────────────────
  const downloadExcelWithData = useCallback(
    async (rows: ExternalBankCashFundRequest[], tabName: string) => {
      if (!rows?.length) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No data to export",
        });
        return;
      }
      setIsExporting(true);
      try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(tabName);
        ws.addRow([
          "Request ID",
          "Job Number",
          "Customer / Party",
          "Created By",
          "Line Items",
          "Total Requested",
          "Total Approved",
          "Status",
          "Created On",
        ]);
        rows.forEach((r) =>
          ws.addRow([
            r.externalBankCashFundRequestId || "",
            r.jobNumber || (r.jobId ? `#${r.jobId}` : "-"),
            r.customerPartyName ||
              (r.customerPartyId ? `#${r.customerPartyId}` : "-"),
            r.createdBy || "-",
            // ← plural "Funds"
            r.externalBankCashFundsRequestDetails?.length || 0,
            r.totalRequestedAmount || 0,
            r.totalApprovedAmount || 0,
            r.approvalStatus || "",
            formatDate(r.createdOn),
          ]),
        );
        ws.columns.forEach((c) => {
          c.width = 18;
        });
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer]),
          `${tabName}_ExternalCashFundRequests_${moment().format("YYYY-MM-DD")}.xlsx`,
        );
        toast({ title: "Success", description: "Excel downloaded" });
      } catch (e) {
        console.error("Excel export error:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate Excel file",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [toast],
  );

  const downloadPDFWithData = useCallback(
    (rows: ExternalBankCashFundRequest[], tabName: string) => {
      if (!rows?.length) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No data to export",
        });
        return;
      }
      setIsExporting(true);
      try {
        const doc = new jsPDF("landscape");
        doc.setFontSize(16);
        doc.setTextColor(40, 116, 166);
        doc.text(`${tabName} - External Bank Cash Fund Requests`, 20, 20);
        autoTable(doc, {
          head: [
            [
              "Request ID",
              "Job",
              "Customer / Party",
              "Created By",
              "Items",
              "Requested (PKR)",
              "Approved (PKR)",
              "Status",
              "Created On",
            ],
          ],
          body: rows.map((i) => [
            i.externalBankCashFundRequestId?.toString() || "N/A",
            i.jobNumber || (i.jobId ? `#${i.jobId}` : "-"),
            i.customerPartyName ||
              (i.customerPartyId ? `#${i.customerPartyId}` : "-"),
            i.createdBy || "-",
            // ← plural "Funds"
            i.externalBankCashFundsRequestDetails?.length?.toString() || "0",
            new Intl.NumberFormat("en-US").format(i.totalRequestedAmount || 0),
            new Intl.NumberFormat("en-US").format(i.totalApprovedAmount || 0),
            i.approvalStatus || "N/A",
            formatDate(i.createdOn),
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
        doc.save(
          `${tabName}_ExternalCashFundRequests_${moment().format("YYYY-MM-DD")}.pdf`,
        );
        toast({ title: "Success", description: "PDF downloaded" });
      } catch (e) {
        console.error("PDF export error:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate PDF file",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [toast],
  );

  // ── Status badge styling ────────────────────────────────────────────────────
  const getStatusBadge = useCallback(
    (status: string): string => {
      const s = status?.toLowerCase();
      if (s === approvedStatus.toLowerCase())
        return "bg-green-50 text-green-700 border-green-200";
      if (s === rejectedStatus.toLowerCase())
        return "bg-red-50 text-red-700 border-red-200";
      if (s === pendingStatus.toLowerCase())
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      if (s === "paid") return "bg-blue-50 text-blue-700 border-blue-200";
      return "bg-gray-100 text-gray-800 border-gray-200";
    },
    [approvedStatus, rejectedStatus, pendingStatus],
  );

  const getStatusIcon = useCallback(
    (status: string) => {
      const s = status?.toLowerCase();
      if (s === approvedStatus.toLowerCase() || s === "paid")
        return <FiCheckCircle className='mr-1 h-3 w-3' />;
      if (s === rejectedStatus.toLowerCase())
        return <FiXCircle className='mr-1 h-3 w-3' />;
      return <FiClock className='mr-1 h-3 w-3' />;
    },
    [approvedStatus, rejectedStatus],
  );

  // ── Normalised users for display ────────────────────────────────────────────
  const normalisedUsers = useMemo(
    () =>
      users.map((u) => ({
        userId: u.userId || (u as any).UserId,
        fullName: u.fullName || (u as any).FullName,
        username: u.username || (u as any).Username,
      })),
    [users],
  );

  const resolveUser = useCallback(
    (id?: number | null) => {
      if (!id) return null;
      return normalisedUsers.find((u) => u.userId === id) || null;
    },
    [normalisedUsers],
  );

  // ── Table columns ───────────────────────────────────────────────────────────
  const columns: ColumnDef<ExternalBankCashFundRequest>[] = useMemo(
    () => [
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const request = row.original;
          const showApproveButton = canApproveRequest(request);
          const showEditButton = canEditRequest(request);
          const showDeleteButton = canDeleteRequest(request);

          return (
            <div className='flex gap-1.5'>
              {/* View */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors'
                      onClick={() => handleViewDetails(request)}
                    >
                      <FiEye size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>View Details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Approve */}
              {showApproveButton ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className='p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors'
                        onClick={() => handleApproveClick(request)}
                      >
                        <FiCheckCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>Approve / Reject</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : request.approvalStatus === pendingStatus &&
                request.requestedTo === userId ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className='p-1.5 text-gray-400 cursor-not-allowed'
                        disabled
                      >
                        <FiLock size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>
                        You don't have approval permission
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}

              {/* Edit */}
              {showEditButton ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className='p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors'
                        onClick={() => handleEditClick(request)}
                      >
                        <FiEdit size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>Edit Request</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : request.approvalStatus !== pendingStatus && !isAdmin ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className='p-1.5 text-gray-400 cursor-not-allowed'
                        disabled
                      >
                        <FiLock size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>
                        Cannot edit {request.approvalStatus} requests
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}

              {/* Delete */}
              {showDeleteButton && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className='p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors'
                        onClick={() => handleDelete(request)}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>Delete Request</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "row",
        header: "#",
        cell: ({ row }) => (
          <span className='text-xs text-gray-600'>{parseInt(row.id) + 1}</span>
        ),
      },
      {
        accessorKey: "externalBankCashFundRequestId",
        header: "Request ID",
        cell: ({ row }) => (
          <div className='font-semibold text-sm text-blue-700'>
            #{row.original.externalBankCashFundRequestId}
          </div>
        ),
      },
      {
        accessorKey: "jobId",
        header: "Job",
        cell: ({ row }) => {
          const { jobId, jobNumber } = row.original;
          return jobId ? (
            <Badge
              variant='outline'
              className='bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs'
            >
              <FiBriefcase className='mr-1 h-3 w-3' />
              {jobNumber || `#${jobId}`}
            </Badge>
          ) : (
            <span className='text-xs text-gray-400'>—</span>
          );
        },
      },
      {
        accessorKey: "customerPartyId",
        header: "Customer / Party",
        cell: ({ row }) => {
          const { customerPartyId, customerPartyName } = row.original;
          return (
            <div className='text-xs text-gray-700'>
              {customerPartyName ||
                (customerPartyId ? `Party #${customerPartyId}` : "—")}
            </div>
          );
        },
      },
      {
        accessorKey: "requestorUserId",
        header: "Created By",
        cell: ({ row }) => {
          const creatorId = row.original.requestorUserId;
          const user = resolveUser(creatorId);
          return (
            <div className='text-xs text-gray-600'>
              {user?.fullName ||
                user?.username ||
                row.original.createdBy ||
                (creatorId ? `User #${creatorId}` : "—")}
            </div>
          );
        },
      },
      {
        accessorKey: "requestedTo",
        header: "Requested To",
        cell: ({ row }) => {
          const requestedToId = row.original.requestedTo;
          const user = resolveUser(requestedToId);
          return (
            <div className='text-xs text-gray-600'>
              {user?.fullName ||
                user?.username ||
                (requestedToId ? `User #${requestedToId}` : "—")}
            </div>
          );
        },
      },
      {
        id: "lineItems",
        header: "Line Items",
        cell: ({ row }) => {
          // ← plural "Funds"
          const details =
            row.original.externalBankCashFundsRequestDetails || [];
          const count = details.length;
          const approved = details.filter(
            (d) => d.subRequestStatus === approvedStatus,
          ).length;
          const rejected = details.filter(
            (d) => d.subRequestStatus === rejectedStatus,
          ).length;
          return (
            <div className='flex flex-col gap-0.5'>
              <Badge
                variant='outline'
                className='flex items-center gap-1 w-fit'
              >
                <FiList className='h-3 w-3' />
                {count} item{count !== 1 ? "s" : ""}
              </Badge>
              {count > 0 && (
                <span className='text-xs text-gray-500'>
                  <span className='text-green-600'>{approved}✓</span>{" "}
                  <span className='text-red-600'>{rejected}✗</span>
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "totalRequestedAmount",
        header: "Total Requested",
        cell: ({ row }) => (
          <div className='text-sm font-medium text-gray-900'>
            {formatCurrency(row.original.totalRequestedAmount)}
          </div>
        ),
      },
      {
        accessorKey: "totalApprovedAmount",
        header: "Total Approved",
        cell: ({ row }) => (
          <div className='text-sm font-medium text-green-700'>
            {row.original.totalApprovedAmount
              ? formatCurrency(row.original.totalApprovedAmount)
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "approvalStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.approvalStatus;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(status)}`}
            >
              {getStatusIcon(status)}
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdOn",
        header: "Created On",
        cell: ({ row }) => (
          <div className='text-xs text-gray-600'>
            {formatDate(row.original.createdOn)}
          </div>
        ),
      },
    ],
    [
      pendingStatus,
      approvedStatus,
      rejectedStatus,
      userId,
      isAdmin,
      resolveUser,
      canApproveRequest,
      canEditRequest,
      canDeleteRequest,
      handleViewDetails,
      handleApproveClick,
      handleEditClick,
      handleDelete,
      getStatusBadge,
      getStatusIcon,
    ],
  );

  // ── View Details Dialog ─────────────────────────────────────────────────────
  const ViewRequestDialog = useCallback(() => {
    if (!selectedRequestDetails) return null;

    return (
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' />
              External Bank Cash Fund Request Details
            </DialogTitle>
            <DialogDescription>
              Request ID: #
              {selectedRequestDetails.externalBankCashFundRequestId}
              {selectedRequestDetails.jobNumber
                ? ` | Job: ${selectedRequestDetails.jobNumber}`
                : selectedRequestDetails.jobId
                  ? ` | Job #${selectedRequestDetails.jobId}`
                  : ""}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Master info */}
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
                      #{selectedRequestDetails.externalBankCashFundRequestId}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Job:</span>
                    <span className='font-medium'>
                      {selectedRequestDetails.jobNumber ||
                        (selectedRequestDetails.jobId
                          ? `#${selectedRequestDetails.jobId}`
                          : "-")}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Customer / Party:</span>
                    <span className='font-medium'>
                      {selectedRequestDetails.customerPartyName ||
                        (selectedRequestDetails.customerPartyId
                          ? `#${selectedRequestDetails.customerPartyId}`
                          : "-")}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Created By:</span>
                    <span className='font-medium'>
                      {resolveUser(selectedRequestDetails.requestorUserId)
                        ?.fullName ||
                        selectedRequestDetails.createdBy ||
                        (selectedRequestDetails.requestorUserId
                          ? `User #${selectedRequestDetails.requestorUserId}`
                          : "-")}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Total Requested:</span>
                    <span className='font-medium text-blue-700'>
                      {formatCurrency(
                        selectedRequestDetails.totalRequestedAmount,
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Total Approved:</span>
                    <span className='font-medium text-green-700'>
                      {selectedRequestDetails.totalApprovedAmount
                        ? formatCurrency(
                            selectedRequestDetails.totalApprovedAmount,
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Status:</span>
                    <span
                      className={`font-medium inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStatusBadge(selectedRequestDetails.approvalStatus)}`}
                    >
                      {getStatusIcon(selectedRequestDetails.approvalStatus)}
                      {selectedRequestDetails.approvalStatus}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Line Items:</span>
                    <span className='font-medium'>
                      {/* ← plural "Funds" */}
                      {selectedRequestDetails
                        .externalBankCashFundsRequestDetails?.length || 0}{" "}
                      items
                    </span>
                  </div>
                  {selectedRequestDetails.approvedOn && (
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Approved On:</span>
                      <span className='font-medium'>
                        {formatDate(selectedRequestDetails.approvedOn)}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Created On:</span>
                    <span className='font-medium'>
                      {formatDate(selectedRequestDetails.createdOn)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detail lines */}
            <Card>
              <CardHeader className='py-3 px-4 bg-gray-50'>
                <CardTitle className='text-sm font-medium flex items-center gap-2'>
                  <Badge variant='outline' className='bg-white'>
                    Details
                  </Badge>
                  {/* ← plural "Funds" */}
                  Line Items (
                  {selectedRequestDetails.externalBankCashFundsRequestDetails
                    ?.length || 0}
                  )
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-3 px-4 pb-3'>
                {/* ← plural "Funds" */}
                {selectedRequestDetails.externalBankCashFundsRequestDetails
                  ?.length ? (
                  <div className='border rounded-lg overflow-hidden overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-gray-50'>
                          <TableHead className='w-[40px]'>#</TableHead>
                          <TableHead>Head of Account</TableHead>
                          <TableHead>Beneficiary</TableHead>
                          <TableHead>Account No</TableHead>
                          <TableHead className='text-right'>
                            Requested
                          </TableHead>
                          <TableHead className='text-right'>Approved</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* ← plural "Funds" + plural detail ID */}
                        {selectedRequestDetails.externalBankCashFundsRequestDetails.map(
                          (detail, index) => (
                            <TableRow
                              key={
                                detail.externalBankCashFundsRequestDetailsId ||
                                index
                              }
                            >
                              <TableCell className='font-medium text-xs'>
                                {index + 1}
                              </TableCell>
                              <TableCell className='text-sm'>
                                {detail.headOfAccount || "-"}
                              </TableCell>
                              <TableCell className='text-sm'>
                                {detail.beneficiary || "-"}
                              </TableCell>
                              <TableCell className='text-sm font-mono text-gray-600'>
                                {detail.accountNo || "-"}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-right'>
                                {formatCurrency(detail.requestedAmount)}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-green-700 text-right'>
                                {detail.approvedAmount
                                  ? formatCurrency(detail.approvedAmount)
                                  : "-"}
                              </TableCell>
                              <TableCell className='text-xs text-gray-600 max-w-[120px] truncate'>
                                {detail.remarks || "—"}
                              </TableCell>
                              <TableCell>
                                {detail.subRequestStatus && (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(detail.subRequestStatus)}`}
                                  >
                                    {getStatusIcon(detail.subRequestStatus)}
                                    {detail.subRequestStatus}
                                  </span>
                                )}
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

          <DialogFooter>
            <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }, [
    viewDialogOpen,
    selectedRequestDetails,
    resolveUser,
    getStatusBadge,
    getStatusIcon,
  ]);

  // ── Statistics tab ──────────────────────────────────────────────────────────
  const RequestStatsPage = useCallback(() => {
    const stats = getRequestStats;
    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            External Bank Cash Fund Request Statistics
          </h2>
          <Button
            onClick={() => downloadPDFWithData(data, "Statistics")}
            size='sm'
            className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white'
            disabled={isExporting || !data.length}
          >
            <FiDownload size={14} />
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
          {[
            {
              label: "Total Requests",
              value: stats.totalRequests,
              sub: `${stats.totalLineItems} line items · ${stats.pendingRequests} pending`,
              color: "blue",
            },
            {
              label: "Total Requested",
              value: formatCompactCurrency(stats.totalRequestedAmount),
              sub: "Sum of all requests",
              color: "green",
            },
            {
              label: "Total Approved",
              value: formatCompactCurrency(stats.totalApprovedAmount),
              sub: "Approved amount",
              color: "purple",
            },
            {
              label: approvedStatus,
              value: stats.approvedRequests,
              sub: "Fully approved",
              color: "green",
            },
          ].map((card) => (
            <Card
              key={card.label}
              className={`border border-${card.color}-200 shadow-sm`}
            >
              <CardHeader className='pb-2 pt-3 px-4'>
                <CardTitle
                  className={`text-xs font-medium text-${card.color}-700 uppercase tracking-wide`}
                >
                  {card.label}
                </CardTitle>
                <div
                  className={`text-2xl font-bold text-${card.color}-900 mt-1`}
                >
                  {card.value}
                </div>
              </CardHeader>
              <CardContent className='pt-0 pb-3 px-4'>
                <div className='text-xs text-gray-600'>{card.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }, [getRequestStats, data, isExporting, approvedStatus, downloadPDFWithData]);

  // ── Route: Approval Form ────────────────────────────────────────────────────
  if (showApprovalForm && selectedRequestForApproval) {
    return (
      <div className='p-4 bg-gray-50 min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setShowApprovalForm(false);
              setSelectedRequestForApproval(null);
            }}
            className='mb-3 gap-1.5'
          >
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Request List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <ExternalBankCashFundRequestApprovalForm
              requestData={selectedRequestForApproval}
              onApprovalComplete={handleApprovalComplete}
              onCancel={() => {
                setShowApprovalForm(false);
                setSelectedRequestForApproval(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Route: Add/Edit Form ────────────────────────────────────────────────────
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
            <FiArrowLeft className='h-3.5 w-3.5' /> Back to Request List
          </Button>
          <div className='bg-white rounded-lg shadow-sm border p-4'>
            <ExternalBankCashFundRequestForm
              type={selectedRequest ? "edit" : "add"}
              defaultState={selectedRequest}
              handleAddEdit={handleAddEditComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main List View ──────────────────────────────────────────────────────────
  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Page header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              External Bank Cash Fund Request Management
            </h1>
            <p className='text-xs text-gray-600 mt-0.5'>
              Master-detail external cash fund requests with per-line approval
              tracking
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
              <FiFilePlus className='h-3.5 w-3.5' /> Add New Request
            </Button>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <FiAlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search / filter / export bar */}
        <div className='bg-white rounded-lg shadow-sm border p-3 mb-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3'>
            <div className='flex items-center gap-2 flex-1 w-full md:w-auto'>
              <div className='relative flex-1 max-w-md'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search by job, customer, beneficiary, account...'
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
                    {statusFilterOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={() =>
                  downloadPDFWithData(getCurrentTabData, activeTab)
                }
                size='sm'
                className='flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs'
                disabled={isExporting || !getCurrentTabData.length}
              >
                <FiFilePlus className='h-3.5 w-3.5' />
                {isExporting ? "Exporting..." : "Export PDF"}
              </Button>
              <Button
                onClick={() =>
                  downloadExcelWithData(getCurrentTabData, activeTab)
                }
                size='sm'
                className='flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs'
                disabled={isExporting || !getCurrentTabData.length}
              >
                <FiDownload className='h-3.5 w-3.5' />
                {isExporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
                <FiDollarSign className='w-3.5 h-3.5 mr-1.5' /> All (
                {data.length})
              </TabsTrigger>
              <TabsTrigger
                value='PENDING'
                className='text-xs py-2 px-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiClock className='w-3.5 h-3.5 mr-1.5' /> {pendingStatus} (
                {getRequestStats.pendingRequests})
              </TabsTrigger>
              <TabsTrigger
                value='APPROVED'
                className='text-xs py-2 px-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' />{" "}
                {approvedStatus} ({getRequestStats.approvedRequests})
              </TabsTrigger>
              <TabsTrigger
                value='REJECTED'
                className='text-xs py-2 px-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiXCircle className='w-3.5 h-3.5 mr-1.5' /> {rejectedStatus} (
                {getRequestStats.rejectedRequests})
              </TabsTrigger>
              <TabsTrigger
                value='PAID'
                className='text-xs py-2 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiCheckCircle className='w-3.5 h-3.5 mr-1.5' /> Paid (
                {getRequestStats.paidRequests})
              </TabsTrigger>
              <TabsTrigger
                value='STATISTICS'
                className='text-xs py-2 px-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none rounded-md'
              >
                <FiFilePlus className='w-3.5 h-3.5 mr-1.5' /> Statistics
              </TabsTrigger>
            </TabsList>
          </div>

          {["ALL_REQUESTS", "PENDING", "APPROVED", "REJECTED", "PAID"].map(
            (tab) => (
              <TabsContent key={tab} value={tab} className='space-y-3 mt-3'>
                <div className='bg-white rounded-lg shadow-sm border'>
                  {getCurrentTabData.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16'>
                      <FiDollarSign className='mx-auto h-12 w-12 text-gray-400 mb-3' />
                      <h3 className='text-base font-medium text-gray-900'>
                        No external cash fund requests found
                      </h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        {searchText || statusFilter !== "ALL"
                          ? "Try adjusting your search or filter terms"
                          : "Add your first request using the button above"}
                      </p>
                    </div>
                  ) : (
                    <AppDataTable
                      data={getCurrentTabData}
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
