"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiSearch,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiBriefcase,
  FiChevronDown,
  FiChevronRight,
  FiUsers,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalFormProps = {
  requestData: any;
  /** Optional batch — when present (length > 1) the form switches to batch mode */
  batchRequests?: any[];
  onApprovalComplete: (updatedData: any) => void;
  onCancel: () => void;
};

type LineItemApproval = {
  internalFundsRequestBankId: number;
  bankFundRequestMasterId: number;
  parentRequestId: number;
  requestorUserId: number | null;
  requestorName: string;

  jobId: number | null;
  jobNumber: string;
  customerName: string;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount: string;
  beneficiary: string;
  accountNo: string;
  requestedAmount: number;
  approvedAmount: number;
  chargesId: number;
  requestedTo: number | null;
  onAccountOfId: number | null;
  subRequestStatus: string;
  remarks: string;
  createdOn: string;
  version?: number;
  bankId: number | null;
  bankName?: string;
};

type Bank = {
  bankId: number;
  bankCode: string;
  bankName: string;
};

type StatusOption = { key: string; label: string };

type User = {
  userId: number;
  fullName: string;
  username: string;
};

// ─── API Helpers ──────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
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
}

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return base.endsWith("/") ? base : `${base}/`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternalBankFundRequestApprovalForm({
  requestData,
  batchRequests,
  onApprovalComplete,
  onCancel,
}: ApprovalFormProps) {
  const isBatchMode = !!batchRequests && batchRequests.length > 1;
  const sourceRequests = useMemo(() => {
    if (isBatchMode) return batchRequests!;
    return requestData ? [requestData] : [];
  }, [isBatchMode, batchRequests, requestData]);

  const [lineItems, setLineItems] = useState<LineItemApproval[]>([]);
  const [masterRemarks, setMasterRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Banks for dropdown
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [users, setUsers] = useState<User[]>([]);

  const [pendingStatus, setPendingStatus] = useState("Pending");
  const [approvedStatus, setApprovedStatus] = useState("Approved");
  const [rejectedStatus, setRejectedStatus] = useState("Rejected");

  // Group collapse state — keyed by requestorUserId (batch mode only)
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const { toast } = useToast();

  // ── userId ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) {
      setUserId(parseInt(stored, 10));
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log in again.",
      });
    }
  }, [toast]);

  // ── Fetch status options ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch(
          `${getBaseUrl()}General/GetTypeValues?typeName=FundRequest_Detail_Status`,
          { method: "GET", headers: getAuthHeaders() },
        );

        if (!res.ok) return;

        const raw: Record<string, string> = await res.json();
        const opts: StatusOption[] = Object.entries(raw).map(
          ([key, label]) => ({ key, label }),
        );
        const p = opts.find((o) => o.key.toLowerCase() === "pending");
        const a = opts.find((o) => o.key.toLowerCase() === "approved");
        const r = opts.find((o) => o.key.toLowerCase() === "rejected");
        if (p) setPendingStatus(p.key);
        if (a) setApprovedStatus(a.key);
        if (r) setRejectedStatus(r.key);
      } catch (e) {
        console.error("Status fetch error:", e);
      }
    };
    fetchStatuses();
  }, []);

  // ── Fetch Banks ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const res = await fetch(`${getBaseUrl()}Banks/GetList`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            select: "BankId, BankCode, BankName",
            where: "",
            search: "",
            sortOn: "BankName ASC",
            page: "1",
            pageSize: "200",
          }),
        });

        if (res.status === 401) {
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Please log in again.",
          });
          return;
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Banks fetch failed: ${res.status}`, errText);
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to load banks (${res.status})`,
          });
          return;
        }

        const d = await res.json();
        const rawList = Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
        const normalized: Bank[] = rawList.map((b: any) => ({
          bankId: b.bankId ?? b.BankId,
          bankCode: b.bankCode ?? b.BankCode,
          bankName: b.bankName ?? b.BankName,
        }));
        setBanks(normalized);
        setFilteredBanks(normalized);
      } catch (e) {
        console.error("Banks fetch error:", e);
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Could not reach the server. Check your connection.",
        });
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, [toast]);

  // ── Fetch users (for displaying requestor names in batch mode) ───────────
  useEffect(() => {
    if (!isBatchMode) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}User/GetList`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            select: "UserId, Username, FullName",
            where: "",
            search: "",
            sortOn: "FullName ASC",
            page: "1",
            pageSize: "500",
          }),
        });
        if (!res.ok) return;
        const d = await res.json();
        const list = Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
        const normalized: User[] = list.map((u: any) => ({
          userId: u.userId ?? u.UserId,
          fullName: u.fullName ?? u.FullName ?? "",
          username: u.username ?? u.Username ?? "",
        }));
        setUsers(normalized);
      } catch (e) {
        console.error("Users fetch error:", e);
      }
    };
    fetchUsers();
  }, [isBatchMode]);

  // ── Filter banks ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (bankSearch.trim() === "") {
      setFilteredBanks(banks);
    } else {
      const query = bankSearch.toLowerCase();
      setFilteredBanks(
        banks.filter(
          (b) =>
            b.bankName?.toLowerCase().includes(query) ||
            b.bankCode?.toLowerCase().includes(query),
        ),
      );
    }
  }, [bankSearch, banks]);

  // ── Initialize line items from sourceRequests ─────────────────────────────
  useEffect(() => {
    if (sourceRequests.length === 0) return;

    if (!isBatchMode) {
      setMasterRemarks(sourceRequests[0]?.remarks || "");
    }

    const findUserName = (uid: number | null): string => {
      if (!uid) return "Unknown User";
      const u = users.find((x) => x.userId === uid);
      return u?.fullName || u?.username || `User #${uid}`;
    };

    const allItems: LineItemApproval[] = [];

    sourceRequests.forEach((req: any) => {
      const parentRequestId = req.bankFundRequestId ?? req.BankFundRequestId;
      const requestorUserId =
        req.requestorUserId ?? req.RequestorUserId ?? null;
      const requestorName = findUserName(requestorUserId);

      const details = req.internalBankFundsRequests || [];

      details.forEach((detail: any) => {
        const detailJobId = detail.jobId ?? detail.JobId ?? null;
        const jobObj = detail.job || detail.Job;
        const jobNumber =
          jobObj?.jobNumber ||
          jobObj?.JobNumber ||
          detail.jobNumber ||
          detail.JobNumber ||
          (detailJobId ? `Job #${detailJobId}` : "—");

        const bankId = detail.bankId ?? detail.BankId ?? null;
        const bankObj = detail.bank || detail.Bank;
        const bankName = bankObj?.bankName || bankObj?.BankName || "";

        allItems.push({
          internalFundsRequestBankId:
            detail.internalFundsRequestBankId ??
            detail.InternalFundsRequestBankId,
          bankFundRequestMasterId: parentRequestId,
          parentRequestId,
          requestorUserId,
          requestorName,
          jobId: detailJobId,
          jobNumber,
          customerName: detail.customerName || detail.CustomerName || "",
          headCoaId: detail.headCoaId || detail.HeadCoaId,
          beneficiaryCoaId: detail.beneficiaryCoaId || detail.BeneficiaryCoaId,
          headOfAccount: detail.headOfAccount || detail.HeadOfAccount || "",
          beneficiary: detail.beneficiary || detail.Beneficiary || "",
          accountNo: detail.accountNo || detail.AccountNo || "",
          requestedAmount:
            detail.requestedAmount || detail.RequestedAmount || 0,
          approvedAmount:
            detail.approvedAmount ||
            detail.ApprovedAmount ||
            detail.requestedAmount ||
            detail.RequestedAmount ||
            0,
          chargesId:
            detail.chargesId ||
            detail.ChargesId ||
            detail.headCoaId ||
            detail.HeadCoaId,
          requestedTo: detail.requestedTo ?? detail.RequestedTo ?? null,
          onAccountOfId: detail.onAccountOfId ?? detail.OnAccountOfId ?? null,
          subRequestStatus:
            detail.subRequestStatus || detail.SubRequestStatus || pendingStatus,
          remarks: detail.remarks || detail.Remarks || "",
          createdOn:
            detail.createdOn || detail.CreatedOn || new Date().toISOString(),
          version: detail.version ?? 0,
          bankId,
          bankName,
        });
      });
    });

    setLineItems(allItems);
  }, [sourceRequests, isBatchMode, pendingStatus, users]);

  // ── Group items by requestor (batch mode) ─────────────────────────────────
  const groupedByRequestor = useMemo(() => {
    const groups = new Map<
      string,
      {
        requestorUserId: number | null;
        requestorName: string;
        items: LineItemApproval[];
      }
    >();

    lineItems.forEach((item) => {
      const key = String(item.requestorUserId ?? "unknown");
      if (!groups.has(key)) {
        groups.set(key, {
          requestorUserId: item.requestorUserId,
          requestorName: item.requestorName,
          items: [],
        });
      }
      groups.get(key)!.items.push(item);
    });

    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }, [lineItems]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Mutators ──────────────────────────────────────────────────────────────
  const updateLineByItemId = useCallback(
    (itemId: number, patch: Partial<LineItemApproval>) => {
      setLineItems((prev) =>
        prev.map((it) =>
          it.internalFundsRequestBankId === itemId ? { ...it, ...patch } : it,
        ),
      );
    },
    [],
  );

  const updateApprovedAmount = useCallback((itemId: number, amount: number) => {
    setLineItems((prev) =>
      prev.map((it) => {
        if (it.internalFundsRequestBankId !== itemId) return it;
        return {
          ...it,
          approvedAmount: Math.min(amount, it.requestedAmount),
        };
      }),
    );
  }, []);

  const updateBank = useCallback(
    (itemId: number, bankIdStr: string) => {
      const selected = banks.find((b) => b.bankId.toString() === bankIdStr);
      updateLineByItemId(itemId, {
        bankId: parseInt(bankIdStr, 10),
        bankName: selected?.bankName || "",
      });
    },
    [banks, updateLineByItemId],
  );

  const updateRemarks = useCallback(
    (itemId: number, remarks: string) => {
      updateLineByItemId(itemId, { remarks });
    },
    [updateLineByItemId],
  );

  const setLineStatus = useCallback(
    (itemId: number, status: string) => {
      setLineItems((prev) =>
        prev.map((it) => {
          if (it.internalFundsRequestBankId !== itemId) return it;
          return {
            ...it,
            subRequestStatus: status,
            approvedAmount: status === rejectedStatus ? 0 : it.approvedAmount,
          };
        }),
      );
    },
    [rejectedStatus],
  );

  const approveAllLines = () =>
    setLineItems((prev) =>
      prev.map((i) => ({
        ...i,
        subRequestStatus: approvedStatus,
        approvedAmount:
          i.approvedAmount > 0 ? i.approvedAmount : i.requestedAmount,
      })),
    );

  const rejectAllLines = () =>
    setLineItems((prev) =>
      prev.map((i) => ({
        ...i,
        subRequestStatus: rejectedStatus,
        approvedAmount: 0,
      })),
    );

  const approveAllInGroup = (groupKey: string) =>
    setLineItems((prev) =>
      prev.map((i) =>
        String(i.requestorUserId ?? "unknown") === groupKey
          ? {
              ...i,
              subRequestStatus: approvedStatus,
              approvedAmount:
                i.approvedAmount > 0 ? i.approvedAmount : i.requestedAmount,
            }
          : i,
      ),
    );

  const rejectAllInGroup = (groupKey: string) =>
    setLineItems((prev) =>
      prev.map((i) =>
        String(i.requestorUserId ?? "unknown") === groupKey
          ? { ...i, subRequestStatus: rejectedStatus, approvedAmount: 0 }
          : i,
      ),
    );

  const autoFillApprovedAmounts = () => {
    setLineItems((prev) =>
      prev.map((it) => ({
        ...it,
        approvedAmount:
          it.subRequestStatus !== rejectedStatus ? it.requestedAmount : 0,
      })),
    );
    toast({
      title: "Auto-filled",
      description:
        "Approved amounts set to requested amounts (except rejected lines)",
    });
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = useMemo(
    () => ({
      totalRequested: lineItems.reduce(
        (s, i) => s + (i.requestedAmount || 0),
        0,
      ),
      totalApproved: lineItems.reduce(
        (s, i) =>
          s + (i.subRequestStatus === approvedStatus ? i.approvedAmount : 0),
        0,
      ),
      approvedCount: lineItems.filter(
        (i) => i.subRequestStatus === approvedStatus,
      ).length,
      rejectedCount: lineItems.filter(
        (i) => i.subRequestStatus === rejectedStatus,
      ).length,
      pendingCount: lineItems.filter(
        (i) =>
          i.subRequestStatus !== approvedStatus &&
          i.subRequestStatus !== rejectedStatus,
      ).length,
    }),
    [lineItems, approvedStatus, rejectedStatus],
  );

  const derivedMasterStatus = useMemo(() => {
    if (lineItems.length === 0) return pendingStatus;
    const statuses = lineItems.map((i) => i.subRequestStatus);
    if (statuses.every((s) => s === approvedStatus)) return approvedStatus;
    if (statuses.every((s) => s === rejectedStatus)) return rejectedStatus;
    return pendingStatus;
  }, [lineItems, pendingStatus, approvedStatus, rejectedStatus]);

  // ── Save validations ──────────────────────────────────────────────────────
  const missingBankItems = useMemo(
    () =>
      lineItems.filter(
        (it) => it.subRequestStatus === approvedStatus && !it.bankId,
      ),
    [lineItems, approvedStatus],
  );

  const hasInvalidApprovedAmount = useMemo(
    () =>
      lineItems.some(
        (it) =>
          it.subRequestStatus === approvedStatus &&
          (it.approvedAmount < 0 || it.approvedAmount > it.requestedAmount),
      ),
    [lineItems, approvedStatus],
  );

  const isSaveDisabled =
    isSubmitting ||
    !userId ||
    lineItems.length === 0 ||
    missingBankItems.length > 0 ||
    hasInvalidApprovedAmount ||
    (totals.approvedCount === 0 && totals.rejectedCount === 0);

  // ── Submit dispatcher ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (hasInvalidApprovedAmount) {
      toast({
        variant: "destructive",
        title: "Invalid Amounts",
        description: "Approved amounts must be between 0 and requested amount",
      });
      return;
    }
    if (missingBankItems.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Bank",
        description: `${missingBankItems.length} approved line item(s) need a Bank selected`,
      });
      return;
    }

    if (isBatchMode) {
      await submitBatchApproval();
    } else {
      await submitSingleApproval();
    }
  };

  // ── Single-record PUT (existing flow) ─────────────────────────────────────
  const submitSingleApproval = async () => {
    if (!userId) return;
    setIsSubmitting(true);

    try {
      const req = sourceRequests[0];
      const isApproving = derivedMasterStatus === approvedStatus;

      const payload = {
        BankFundRequestId: req.bankFundRequestId || req.BankFundRequestId,
        BankId: null,
        TotalRequestedAmount: totals.totalRequested,
        TotalApprovedAmount: totals.totalApproved,
        ApprovalStatus: derivedMasterStatus,
        ApprovedBy: isApproving ? userId.toString() : "",
        ApprovedOn: isApproving ? new Date().toISOString() : null,
        RequestedTo: req.requestedTo || req.RequestedTo,
        CreatedOn: req.createdOn || req.CreatedOn,
        RequestorUserId: req.requestorUserId || req.RequestorUserId,
        Remarks: masterRemarks,
        Version: req.version || req.Version || 1,
        RequestedToNavigation: null,
        InternalBankFundsRequests: lineItems.map((item) => ({
          InternalFundsRequestBankId: item.internalFundsRequestBankId,
          JobId: item.jobId,
          HeadCoaId: item.headCoaId,
          BeneficiaryCoaId: item.beneficiaryCoaId,
          HeadOfAccount: item.headOfAccount,
          Beneficiary: item.beneficiary,
          AccountNo: item.accountNo || "",
          RequestedAmount: item.requestedAmount,
          ApprovedAmount:
            item.subRequestStatus === approvedStatus ? item.approvedAmount : 0,
          RequestedTo: item.requestedTo,
          CreatedOn: item.createdOn,
          BankFundRequestMasterId:
            req.bankFundRequestId || req.BankFundRequestId,
          ChargesId: item.chargesId,
          CustomerName: item.customerName || "",
          OnAccountOfId: item.onAccountOfId || null,
          SubRequestStatus: item.subRequestStatus,
          Remarks: item.remarks || "",
          BankId: item.bankId,
          Version: item.version ?? 0,
        })),
      };

      console.log("📦 BANK SINGLE PAYLOAD:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${getBaseUrl()}InternalBankFundsRequest`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
        });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ PUT FAILED!", response.status, errorText);
        let userMessage = `Request failed (${response.status})`;
        try {
          const parsed = JSON.parse(errorText);
          if (Array.isArray(parsed)) userMessage = parsed.join("\n");
          else if (parsed.errors)
            userMessage = Object.values(parsed.errors).flat().join(", ");
          else if (parsed.title) userMessage = parsed.title;
          else if (parsed.message) userMessage = parsed.message;
          else if (typeof parsed === "string") userMessage = parsed;
        } catch {
          userMessage = errorText || userMessage;
        }
        throw new Error(userMessage);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Bank fund request saved — Status: ${derivedMasterStatus}`,
      });
      onApprovalComplete(result);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Batch BulkApprove ─────────────────────────────────────────────────────
  // Endpoint: PUT /InternalBankFundsRequestDetail/BulkApprove
  // Payload: { fundRequestDetailIds, status, headId, remarks }
  // For bank items, headId = bankId. Rejected items send headId = 0.
  // We group by (status, headId, remarks) so each detail gets its correct values.
  const submitBatchApproval = async () => {
    if (!userId) return;
    setIsSubmitting(true);

    const endpoint = `${getBaseUrl()}InternalBankFundsRequestDetail/BulkApprove`;

    type BatchKey = { status: string; headId: number; remarks: string };
    const groupMap = new Map<string, { key: BatchKey; ids: number[] }>();

    lineItems.forEach((item) => {
      if (
        item.subRequestStatus !== approvedStatus &&
        item.subRequestStatus !== rejectedStatus
      ) {
        return;
      }

      const headId =
        item.subRequestStatus === approvedStatus ? (item.bankId ?? 0) : 0;
      const remarks = item.remarks || "";
      const status = item.subRequestStatus;
      const groupKey = `${status}::${headId}::${remarks}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          key: { status, headId, remarks },
          ids: [],
        });
      }
      groupMap.get(groupKey)!.ids.push(item.internalFundsRequestBankId);
    });

    if (groupMap.size === 0) {
      toast({
        variant: "destructive",
        title: "Nothing to submit",
        description: "No items have been approved or rejected.",
      });
      setIsSubmitting(false);
      return;
    }

    const callBulk = async (
      key: BatchKey,
      ids: number[],
    ): Promise<{ ok: boolean; count: number; error?: string }> => {
      try {
        const res = await fetch(endpoint, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            fundRequestDetailIds: ids,
            status: key.status,
            headId: key.headId,
            remarks: key.remarks,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          return { ok: false, count: ids.length, error: text };
        }
        return { ok: true, count: ids.length };
      } catch (e) {
        return {
          ok: false,
          count: ids.length,
          error: e instanceof Error ? e.message : "Network error",
        };
      }
    };

    try {
      const results = await Promise.all(
        Array.from(groupMap.values()).map((g) => callBulk(g.key, g.ids)),
      );

      const totalOk = results
        .filter((r) => r.ok)
        .reduce((s, r) => s + r.count, 0);
      const totalFailed = results
        .filter((r) => !r.ok)
        .reduce((s, r) => s + r.count, 0);
      const errors = results.filter((r) => !r.ok).map((r) => r.error || "");

      if (totalFailed === 0) {
        toast({
          title: "Bulk Approval Complete",
          description: `${totals.approvedCount} approved · ${totals.rejectedCount} rejected (${totalOk} item${totalOk !== 1 ? "s" : ""} updated)`,
        });
        onApprovalComplete({
          batch: true,
          approved: totals.approvedCount,
          rejected: totals.rejectedCount,
        });
      } else if (totalOk > 0) {
        toast({
          variant: "destructive",
          title: "Partial Failure",
          description: `${totalOk} item(s) updated, ${totalFailed} failed. ${errors[0] ? errors[0].slice(0, 80) : ""}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: errors[0]?.slice(0, 100) || "All updates failed.",
        });
      }
    } catch (e) {
      console.error("Batch save error:", e);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === approvedStatus.toLowerCase())
      return "bg-green-100 text-green-800 border-green-300";
    if (s === rejectedStatus.toLowerCase())
      return "bg-red-100 text-red-800 border-red-300";
    if (s === pendingStatus.toLowerCase())
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  // ── Render single line item card ──────────────────────────────────────────
  const renderLineItemCard = (item: LineItemApproval, displayIndex: number) => {
    const isApproved = item.subRequestStatus === approvedStatus;
    const isRejected = item.subRequestStatus === rejectedStatus;
    const diff = item.approvedAmount - item.requestedAmount;
    const itemId = item.internalFundsRequestBankId;

    return (
      <Card
        key={itemId}
        className={`border-l-4 ${
          isApproved
            ? "border-l-green-500"
            : isRejected
              ? "border-l-red-500"
              : "border-l-yellow-500"
        }`}
      >
        <CardContent className='p-3'>
          <div className='grid grid-cols-12 gap-3 items-start'>
            <div className='col-span-1'>
              <Badge
                variant='outline'
                className='font-mono text-base px-2 py-0.5'
              >
                #{displayIndex}
              </Badge>
              {isBatchMode && (
                <div className='mt-1'>
                  <Badge
                    variant='outline'
                    className='text-[10px] bg-purple-50 text-purple-700 border-purple-200'
                    title={`Master Request #${item.parentRequestId}`}
                  >
                    Req #{item.parentRequestId}
                  </Badge>
                </div>
              )}
            </div>

            <div className='col-span-2'>
              <div className='space-y-1'>
                <div className='flex items-center gap-1'>
                  <FiBriefcase className='h-3.5 w-3.5 text-gray-400' />
                  <Badge
                    variant='outline'
                    className='bg-blue-50 text-blue-700 font-mono text-xs'
                  >
                    {item.jobNumber}
                  </Badge>
                </div>
                <div className='flex items-center gap-1'>
                  <FiUser className='h-3.5 w-3.5 text-gray-400' />
                  <span
                    className='text-sm text-gray-700 truncate'
                    title={item.customerName}
                  >
                    {item.customerName || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className='col-span-3'>
              <div className='space-y-1'>
                <div className='flex items-start gap-1'>
                  <FiFileText className='h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0' />
                  <span
                    className='text-sm text-gray-900 truncate'
                    title={item.headOfAccount}
                  >
                    {item.headOfAccount}
                  </span>
                </div>
                <div className='flex items-start gap-1'>
                  <FiUser className='h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0' />
                  <span
                    className='text-sm text-gray-700 truncate'
                    title={item.beneficiary}
                  >
                    {item.beneficiary}
                  </span>
                </div>
                {item.accountNo && (
                  <div className='text-[10px] text-gray-500 font-mono truncate pl-4'>
                    A/C: {item.accountNo}
                  </div>
                )}
              </div>
            </div>

            <div className='col-span-1'>
              <p className='text-xs text-gray-500'>Requested</p>
              <p className='text-base font-semibold text-gray-900'>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                  minimumFractionDigits: 0,
                }).format(item.requestedAmount)}
              </p>
            </div>

            <div className='col-span-2'>
              <Label className='text-xs text-gray-600 mb-1 block'>
                Approved Amount
              </Label>
              <div className='relative'>
                <span className='absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium'>
                  PKR
                </span>
                <Input
                  type='number'
                  min='0'
                  max={item.requestedAmount}
                  step='0.01'
                  value={item.approvedAmount || ""}
                  onChange={(e) =>
                    updateApprovedAmount(
                      itemId,
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  disabled={isRejected}
                  className={`pl-12 text-right font-semibold ${
                    isRejected
                      ? "bg-gray-100"
                      : diff > 0
                        ? "bg-red-50 border-red-300"
                        : diff < 0
                          ? "bg-orange-50 border-orange-300"
                          : "bg-green-50 border-green-300"
                  }`}
                />
              </div>
              {diff !== 0 && !isRejected && (
                <p
                  className={`text-xs mt-1 ${diff > 0 ? "text-red-600" : "text-orange-600"}`}
                >
                  {diff > 0 ? "+" : ""}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(diff)}
                </p>
              )}
            </div>

            <div className='col-span-2'>
              <Label className='text-xs text-gray-600 mb-1 block'>
                Bank {isApproved && <span className='text-red-500'>*</span>}
              </Label>
              <Select
                value={item.bankId?.toString() || ""}
                onValueChange={(value) => updateBank(itemId, value)}
                disabled={isRejected}
              >
                <SelectTrigger
                  className={`h-9 text-sm ${
                    isRejected ? "bg-gray-100" : "bg-blue-50 border-blue-300"
                  } ${isApproved && !item.bankId ? "border-red-300" : ""}`}
                >
                  <SelectValue placeholder='Select bank...'>
                    {item.bankName ? (
                      <span className='flex items-center gap-2 truncate'>
                        <FiDollarSign className='h-3.5 w-3.5 flex-shrink-0 text-blue-600' />
                        <span className='truncate'>{item.bankName}</span>
                      </span>
                    ) : (
                      <span className='text-gray-500'>Select bank...</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className='max-h-[300px] w-[350px]'>
                  <div className='sticky top-0 bg-white p-2 border-b z-50'>
                    <div className='relative'>
                      <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                      <Input
                        placeholder='Search banks...'
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className='pl-8 h-8 text-sm'
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className='max-h-[250px] overflow-y-auto'>
                    {isLoadingBanks ? (
                      <div className='p-4 text-center text-gray-500'>
                        Loading...
                      </div>
                    ) : filteredBanks.length === 0 ? (
                      <div className='p-4 text-center text-gray-500'>
                        No banks found
                      </div>
                    ) : (
                      filteredBanks.map((bank) => (
                        <SelectItem
                          key={bank.bankId}
                          value={bank.bankId.toString()}
                        >
                          <div className='flex flex-col'>
                            <span className='font-medium'>{bank.bankCode}</span>
                            <span className='text-xs text-gray-500'>
                              {bank.bankName}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
              {isApproved && !item.bankId && (
                <p className='text-xs text-red-600 mt-1'>
                  Required for approved items
                </p>
              )}
            </div>

            <div className='col-span-1'>
              <div className='flex items-center gap-1 justify-end'>
                <Button
                  type='button'
                  size='sm'
                  variant={isApproved ? "default" : "outline"}
                  onClick={() => setLineStatus(itemId, approvedStatus)}
                  className={`h-8 w-8 p-0 ${
                    isApproved
                      ? "bg-green-600 hover:bg-green-700"
                      : "text-green-700 border-green-300 hover:bg-green-50"
                  }`}
                  title='Approve'
                >
                  <FiCheckCircle className='h-4 w-4' />
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant={isRejected ? "default" : "outline"}
                  onClick={() => setLineStatus(itemId, rejectedStatus)}
                  className={`h-8 w-8 p-0 ${
                    isRejected
                      ? "bg-red-600 hover:bg-red-700"
                      : "text-red-700 border-red-300 hover:bg-red-50"
                  }`}
                  title='Reject'
                >
                  <FiXCircle className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>

          {/* Inline editable remarks */}
          <div className='mt-2 pt-2 border-t border-gray-100'>
            <div className='flex items-start gap-2'>
              <Label
                htmlFor={`remarks-${itemId}`}
                className='text-xs text-gray-600 pt-2 flex-shrink-0 min-w-[60px]'
              >
                Remarks
              </Label>
              <Input
                id={`remarks-${itemId}`}
                type='text'
                value={item.remarks}
                onChange={(e) => updateRemarks(itemId, e.target.value)}
                className='h-8 text-sm flex-1'
                placeholder='Add remarks for this line item...'
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className='space-y-4 max-w-full'>
      {/* Header Card */}
      <Card>
        <CardHeader className='py-3 px-4 bg-gradient-to-r from-purple-50 to-blue-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <FiCheckCircle className='h-5 w-5 text-purple-600' />
                {isBatchMode
                  ? "Bulk Approve Bank Fund Requests"
                  : "Approve Bank Fund Request"}
              </CardTitle>
              {isBatchMode ? (
                <Badge variant='outline' className='font-mono'>
                  {sourceRequests.length} requests · {lineItems.length} line
                  items
                </Badge>
              ) : (
                <Badge variant='outline' className='font-mono'>
                  #{requestData?.bankFundRequestId}
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-3'>
              <Badge
                className={`font-semibold ${getStatusBadge(derivedMasterStatus)}`}
              >
                {isBatchMode ? "Batch:" : "Master:"} {derivedMasterStatus}
              </Badge>
            </div>
          </div>
          <CardDescription className='pt-2 flex items-center justify-between'>
            <span>
              {isBatchMode
                ? "Review all pending bank fund requests sent to you, grouped by requestor. Approve or reject in bulk."
                : "Set approval status, approved amount, and select bank for each line item"}
            </span>
            {!isBatchMode && (
              <span className='text-xs text-gray-500'>
                Created:{" "}
                {requestData?.createdOn
                  ? new Date(requestData.createdOn).toLocaleDateString()
                  : "—"}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bulk Actions Bar */}
      <div className='bg-white rounded-lg border p-3 flex items-center justify-between flex-wrap gap-2'>
        <div className='flex items-center gap-2 flex-wrap'>
          <Info className='h-4 w-4 text-blue-600' />
          <span className='text-sm text-gray-600'>
            <strong>{lineItems.length}</strong> line items •
            <span className='text-green-600 ml-2'>
              {totals.approvedCount} approved
            </span>{" "}
            •
            <span className='text-red-600 ml-1'>
              {totals.rejectedCount} rejected
            </span>{" "}
            •
            <span className='text-yellow-600 ml-1'>
              {totals.pendingCount} pending
            </span>
          </span>
        </div>
        <div className='flex gap-2 flex-wrap'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={approveAllLines}
            className='text-green-700 border-green-300 hover:bg-green-50'
          >
            <FiCheckCircle className='h-3.5 w-3.5 mr-1.5' /> Approve All
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={rejectAllLines}
            className='text-red-700 border-red-300 hover:bg-red-50'
          >
            <FiXCircle className='h-3.5 w-3.5 mr-1.5' /> Reject All
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={autoFillApprovedAmounts}
          >
            <FiDollarSign className='h-3.5 w-3.5 mr-1.5' /> Auto-fill Amounts
          </Button>
        </div>
      </div>

      {/* Line Items */}
      <div className='space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-2'>
        {isBatchMode
          ? groupedByRequestor.map((group) => {
              const collapsed = collapsedGroups[group.key];
              const groupApproved = group.items.filter(
                (i) => i.subRequestStatus === approvedStatus,
              ).length;
              const groupRejected = group.items.filter(
                (i) => i.subRequestStatus === rejectedStatus,
              ).length;
              const groupTotal = group.items.reduce(
                (s, i) => s + (i.requestedAmount || 0),
                0,
              );

              return (
                <div
                  key={group.key}
                  className='border rounded-lg overflow-hidden bg-white'
                >
                  <div className='bg-gradient-to-r from-purple-50 to-blue-50 border-b px-4 py-3 flex items-center justify-between'>
                    <button
                      type='button'
                      onClick={() => toggleGroup(group.key)}
                      className='flex items-center gap-2 text-left flex-1'
                    >
                      {collapsed ? (
                        <FiChevronRight className='h-4 w-4 text-gray-600' />
                      ) : (
                        <FiChevronDown className='h-4 w-4 text-gray-600' />
                      )}
                      <FiUsers className='h-4 w-4 text-purple-600' />
                      <span className='font-semibold text-sm text-gray-900'>
                        {group.requestorName}
                      </span>
                      <Badge variant='outline' className='text-xs bg-white'>
                        {group.items.length} item
                        {group.items.length !== 1 ? "s" : ""}
                      </Badge>
                      <span className='text-xs text-gray-600'>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "PKR",
                          minimumFractionDigits: 0,
                        }).format(groupTotal)}
                      </span>
                      {groupApproved > 0 && (
                        <span className='text-xs text-green-600'>
                          {groupApproved}✓
                        </span>
                      )}
                      {groupRejected > 0 && (
                        <span className='text-xs text-red-600'>
                          {groupRejected}✗
                        </span>
                      )}
                    </button>
                    <div className='flex gap-1.5'>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => approveAllInGroup(group.key)}
                        className='h-7 text-xs text-green-700 border-green-300 hover:bg-green-50 px-2'
                      >
                        <FiCheckCircle className='h-3 w-3 mr-1' /> Approve
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => rejectAllInGroup(group.key)}
                        className='h-7 text-xs text-red-700 border-red-300 hover:bg-red-50 px-2'
                      >
                        <FiXCircle className='h-3 w-3 mr-1' /> Reject
                      </Button>
                    </div>
                  </div>

                  {!collapsed && (
                    <div className='p-3 space-y-2'>
                      {group.items.map((item, idx) =>
                        renderLineItemCard(item, idx + 1),
                      )}
                    </div>
                  )}
                </div>
              );
            })
          : lineItems.map((item, idx) => renderLineItemCard(item, idx + 1))}
      </div>

      {/* Summary Footer */}
      <div className='bg-gradient-to-r from-purple-50 to-blue-50 border rounded-lg p-4'>
        <div className='grid grid-cols-3 gap-4 mb-4'>
          <div className='text-center'>
            <p className='text-xs text-gray-600 mb-1'>Total Requested</p>
            <p className='text-2xl font-bold text-gray-900'>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
                minimumFractionDigits: 0,
              }).format(totals.totalRequested)}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-600 mb-1'>Total Approved</p>
            <p className='text-2xl font-bold text-green-700'>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
                minimumFractionDigits: 0,
              }).format(totals.totalApproved)}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-gray-600 mb-1'>Difference</p>
            <p
              className={`text-2xl font-bold ${
                totals.totalApproved > totals.totalRequested
                  ? "text-red-700"
                  : totals.totalApproved < totals.totalRequested
                    ? "text-orange-700"
                    : "text-green-700"
              }`}
            >
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
                minimumFractionDigits: 0,
              }).format(totals.totalApproved - totals.totalRequested)}
            </p>
          </div>
        </div>

        {/* Master remarks (single mode only) */}
        {!isBatchMode && (
          <div>
            <Label
              htmlFor='master-remarks'
              className='text-sm font-medium text-gray-700 mb-2 block'
            >
              Master Remarks
            </Label>
            <textarea
              id='master-remarks'
              value={masterRemarks}
              onChange={(e) => setMasterRemarks(e.target.value)}
              className='w-full min-h-[60px] p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white'
              placeholder='Add overall notes about this approval...'
            />
          </div>
        )}

        {totals.totalApproved > totals.totalRequested && (
          <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0' />
            <div>
              <h4 className='font-semibold text-red-900 text-sm'>
                Over-Approved Amount
              </h4>
              <p className='text-xs text-red-700'>
                Total approved exceeds requested. Please review before saving.
              </p>
            </div>
          </div>
        )}

        {missingBankItems.length > 0 && (
          <div className='mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2'>
            <AlertTriangle className='h-5 w-5 text-orange-600 flex-shrink-0' />
            <div>
              <h4 className='font-semibold text-orange-900 text-sm'>
                Bank Required
              </h4>
              <p className='text-xs text-orange-700'>
                {missingBankItems.length} approved line item(s) need a Bank
                before saving.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className='flex justify-end gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <FiX className='h-4 w-4 mr-2' /> Cancel
        </Button>
        <Button
          type='button'
          onClick={handleSave}
          disabled={isSaveDisabled}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2' />
              Saving...
            </>
          ) : (
            <>
              <FiCheckCircle className='h-4 w-4 mr-2' />
              {isBatchMode
                ? `Save Batch Approval (${totals.approvedCount + totals.rejectedCount})`
                : "Save Approval"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
