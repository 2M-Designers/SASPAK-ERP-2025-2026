"use client";

import { useState, useEffect } from "react";
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
  FiFileText,
  FiDollarSign,
  FiBriefcase,
  FiUser,
  FiHash,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalFormProps = {
  requestData: any;
  onApprovalComplete: (updatedData: any) => void;
  onCancel: () => void;
};

type LineItemApproval = {
  externalBankCashFundsRequestDetailsId: number;
  headCoaId: number | null;
  headOfAccount: string;
  beneficiaryCoaId: number | null;
  beneficiary: string;
  accountNo: string;
  requestToAccountId: number | null;
  requestedAmount: number;
  approvedAmount: number;
  requestedTo: number | null;
  onAccountOfId: number | null;
  chargesId: number | null;
  customerName: string;
  subRequestStatus: string;
  remarks: string;
  createdOn: string;
  version: number;
  externalbankFundRequestMasterId: number;
};

type StatusOption = { key: string; label: string };

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

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return base.endsWith("/") ? base : `${base}/`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExternalBankCashFundRequestApprovalForm({
  requestData,
  onApprovalComplete,
  onCancel,
}: ApprovalFormProps) {
  const [lineItems, setLineItems] = useState<LineItemApproval[]>([]);
  const [masterRemarks, setMasterRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [pendingStatus, setPendingStatus] = useState("Pending");
  const [approvedStatus, setApprovedStatus] = useState("Approved");
  const [rejectedStatus, setRejectedStatus] = useState("Rejected");

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
        if (res.ok) {
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
        }
      } catch (e) {
        console.error("Status fetch:", e);
      }
    };
    fetchStatuses();
  }, []);

  // ── Initialise line items from request data ───────────────────────────────
  useEffect(() => {
    const details =
      requestData?.externalBankCashFundsRequestDetails ||
      requestData?.ExternalBankCashFundsRequestDetails ||
      [];

    if (!details.length) return;

    setMasterRemarks(requestData?.remarks || "");

    const masterId: number =
      requestData?.externalBankCashFundRequestId ||
      requestData?.ExternalBankCashFundRequestId ||
      0;

    const items: LineItemApproval[] = details.map((d: any) => ({
      externalBankCashFundsRequestDetailsId:
        d.externalBankCashFundsRequestDetailsId ||
        d.ExternalBankCashFundsRequestDetailsId ||
        0,
      headCoaId: d.headCoaId ?? d.HeadCoaId ?? null,
      headOfAccount: d.headOfAccount || d.HeadOfAccount || "",
      beneficiaryCoaId: d.beneficiaryCoaId ?? d.BeneficiaryCoaId ?? null,
      beneficiary: d.beneficiary || d.Beneficiary || "",
      accountNo: d.accountNo || d.AccountNo || "",
      requestToAccountId: d.requestToAccountId ?? d.RequestToAccountId ?? null,
      requestedAmount: d.requestedAmount || d.RequestedAmount || 0,
      approvedAmount:
        d.approvedAmount ||
        d.ApprovedAmount ||
        d.requestedAmount ||
        d.RequestedAmount ||
        0,
      requestedTo: d.requestedTo ?? d.RequestedTo ?? null,
      onAccountOfId: d.onAccountOfId ?? d.OnAccountOfId ?? null,
      chargesId:
        d.chargesId ?? d.ChargesId ?? d.headCoaId ?? d.HeadCoaId ?? null,
      customerName: d.customerName || d.CustomerName || "",
      subRequestStatus:
        d.subRequestStatus || d.SubRequestStatus || pendingStatus,
      remarks: d.remarks || d.Remarks || "",
      createdOn: d.createdOn || d.CreatedOn || new Date().toISOString(),
      version: d.version ?? d.Version ?? 0,
      externalbankFundRequestMasterId: masterId,
    }));

    setLineItems(items);
  }, [requestData, pendingStatus]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateApprovedAmount = (index: number, amount: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].approvedAmount = Math.min(
        Math.max(0, amount),
        updated[index].requestedAmount,
      );
      return updated;
    });
  };

  const setLineStatus = (index: number, status: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].subRequestStatus = status;
      if (status === rejectedStatus) updated[index].approvedAmount = 0;
      return updated;
    });
  };

  const approveAllLines = () =>
    setLineItems((prev) =>
      prev.map((i) => ({ ...i, subRequestStatus: approvedStatus })),
    );

  const rejectAllLines = () =>
    setLineItems((prev) =>
      prev.map((i) => ({
        ...i,
        subRequestStatus: rejectedStatus,
        approvedAmount: 0,
      })),
    );

  const autoFillApprovedAmounts = () => {
    setLineItems((prev) =>
      prev.map((i) => ({
        ...i,
        approvedAmount:
          i.subRequestStatus !== rejectedStatus ? i.requestedAmount : 0,
      })),
    );
    toast({
      title: "Auto-filled",
      description:
        "Approved amounts set to requested amounts (except rejected lines)",
    });
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = {
    totalRequested: lineItems.reduce((s, i) => s + (i.requestedAmount || 0), 0),
    totalApproved: lineItems.reduce(
      (s, i) =>
        s + (i.subRequestStatus === approvedStatus ? i.approvedAmount : 0),
      0,
    ),
  };

  // ── Derived master status ─────────────────────────────────────────────────
  const derivedMasterStatus = (() => {
    if (lineItems.length === 0) return pendingStatus;
    const statuses = lineItems.map((i) => i.subRequestStatus);
    if (statuses.every((s) => s === approvedStatus)) return approvedStatus;
    if (statuses.every((s) => s === rejectedStatus)) return rejectedStatus;
    return pendingStatus;
  })();

  // ── Resolve display info from master ──────────────────────────────────────
  const masterJobNumber =
    requestData?.jobNumber ||
    (requestData?.jobId ? `Job #${requestData.jobId}` : null);
  const masterCustomerParty =
    requestData?.customerPartyName ||
    (requestData?.customerPartyId
      ? `Party #${requestData.customerPartyId}`
      : null);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const invalidAmount = lineItems.some(
      (i) => i.approvedAmount < 0 || i.approvedAmount > i.requestedAmount,
    );
    if (invalidAmount) {
      toast({
        variant: "destructive",
        title: "Invalid Amounts",
        description:
          "Approved amounts must be between 0 and the requested amount",
      });
      return;
    }

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log in again.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isApproving = derivedMasterStatus === approvedStatus;

      const masterId: number =
        requestData?.externalBankCashFundRequestId ||
        requestData?.ExternalBankCashFundRequestId ||
        0;

      if (!masterId) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Cannot resolve request ID. Please reopen the approval form.",
        });
        setIsSubmitting(false);
        return;
      }

      // ── Flat payload — no dto wrapper, details nested inside master ────────
      const payload = {
        ExternalBankCashFundRequestId: masterId,
        JobId: requestData.jobId ?? requestData.JobId ?? null,
        CustomerPartyId:
          requestData.customerPartyId ?? requestData.CustomerPartyId ?? null,
        TotalRequestedAmount: totals.totalRequested,
        TotalApprovedAmount: totals.totalApproved,
        ApprovalStatus: derivedMasterStatus,
        ApprovedBy: isApproving ? userId.toString() : "",
        ApprovedOn: isApproving ? new Date().toISOString() : null,
        RequestedTo: requestData.requestedTo || requestData.RequestedTo,
        CreatedOn: requestData.createdOn || requestData.CreatedOn,
        RequestorUserId:
          requestData.requestorUserId || requestData.RequestorUserId,
        Remarks: masterRemarks,
        Version: requestData.version ?? requestData.Version ?? 1,
        RequestorUser: null,
        CreatedAt: "0001-01-01T00:00:00",
        UpdatedAt: "0001-01-01T00:00:00",
        CreateLog: null,
        UpdateLog: null,

        // ── Details nested directly — no separate sibling key ──────────────
        ExternalBankCashFundsRequestDetails: lineItems.map((item) => ({
          ExternalBankCashFundsRequestDetailsId:
            item.externalBankCashFundsRequestDetailsId || 0,
          JobId: requestData.jobId ?? requestData.JobId ?? null,
          HeadCoaId: item.headCoaId,
          BeneficiaryCoaId: item.beneficiaryCoaId,
          HeadOfAccount: item.headOfAccount,
          Beneficiary: item.beneficiary,
          AccountNo: item.accountNo || "",
          RequestToAccountId: item.requestToAccountId ?? null,
          RequestedAmount: item.requestedAmount,
          ApprovedAmount:
            item.subRequestStatus === approvedStatus ? item.approvedAmount : 0,
          RequestedTo: item.requestedTo,
          CreatedOn: item.createdOn,
          ExternalbankFundRequestMasterId: masterId,
          ChargesId: item.chargesId ?? item.headCoaId,
          CustomerName: item.customerName || "",
          OnAccountOfId: item.onAccountOfId ?? null, // ✅ nullable FK → null
          SubRequestStatus: item.subRequestStatus,
          Remarks: item.remarks || "",
          Version: item.version ?? 0,
          BeneficiaryCoa: null,
          Charges: null,
          HeadCoa: null,
          CreatedAt: "0001-01-01T00:00:00",
          UpdatedAt: "0001-01-01T00:00:00",
          CreateLog: null,
          UpdateLog: null,
        })),
      };

      console.log(
        "📦 EXTERNAL CASH APPROVAL PAYLOAD:",
        JSON.stringify(payload, null, 2),
      );

      const response = await fetch(
        `${getBaseUrl()}ExternalBankCashFundRequest`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

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
        let userMessage = `Request failed (${response.status})`;
        try {
          const parsed = JSON.parse(errorText);
          if (Array.isArray(parsed)) userMessage = parsed.join("\n");
          else if (parsed.errors)
            userMessage = Object.values(parsed.errors).flat().join(", ");
          else if (parsed.title) userMessage = parsed.title;
          else if (typeof parsed === "string") userMessage = parsed;
        } catch {
          userMessage = errorText || userMessage;
        }
        throw new Error(userMessage);
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `External cash fund request saved — Status: ${derivedMasterStatus}`,
      });
      onApprovalComplete(result);
    } catch (error) {
      console.error("💥", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Status badge styling ──────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className='space-y-4 max-w-full'>
      {/* ── Header Card ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className='py-3 px-4 bg-gradient-to-r from-purple-50 to-blue-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <FiCheckCircle className='h-5 w-5 text-purple-600' />
                Approve External Bank Cash Fund Request
              </CardTitle>
              <Badge variant='outline' className='font-mono'>
                #{requestData?.externalBankCashFundRequestId}
              </Badge>
            </div>
            <Badge
              className={`font-semibold ${getStatusBadge(derivedMasterStatus)}`}
            >
              Master: {derivedMasterStatus}
            </Badge>
          </div>
          <CardDescription className='pt-2'>
            <div className='flex flex-wrap items-center gap-3 mt-1'>
              {masterJobNumber && (
                <span className='flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1'>
                  <FiBriefcase className='h-3 w-3' />
                  {masterJobNumber}
                </span>
              )}
              {masterCustomerParty && (
                <span className='flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1'>
                  <FiUser className='h-3 w-3' />
                  {masterCustomerParty}
                </span>
              )}
              <span className='text-xs text-gray-500 ml-auto'>
                Created:{" "}
                {requestData?.createdOn
                  ? new Date(requestData.createdOn).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ── Bulk Actions Bar ─────────────────────────────────────────────── */}
      <div className='bg-white rounded-lg border p-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Info className='h-4 w-4 text-blue-600' />
          <span className='text-sm text-gray-600'>
            <strong>{lineItems.length}</strong> line items •
            <span className='text-green-600 ml-2'>
              {
                lineItems.filter((i) => i.subRequestStatus === approvedStatus)
                  .length
              }{" "}
              approved
            </span>{" "}
            •
            <span className='text-red-600 ml-1'>
              {
                lineItems.filter((i) => i.subRequestStatus === rejectedStatus)
                  .length
              }{" "}
              rejected
            </span>
          </span>
        </div>
        <div className='flex gap-2'>
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

      {/* ── Line Item Cards ───────────────────────────────────────────────── */}
      <div className='space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-2'>
        {lineItems.map((item, index) => {
          const isApproved = item.subRequestStatus === approvedStatus;
          const isRejected = item.subRequestStatus === rejectedStatus;
          const diff = item.approvedAmount - item.requestedAmount;

          return (
            <Card
              key={item.externalBankCashFundsRequestDetailsId || index}
              className={`border-l-4 transition-colors ${
                isApproved
                  ? "border-l-green-500"
                  : isRejected
                    ? "border-l-red-500"
                    : "border-l-yellow-400"
              }`}
            >
              <CardContent className='p-4'>
                <div className='grid grid-cols-12 gap-3 items-start'>
                  {/* Line Number */}
                  <div className='col-span-1 flex items-start justify-center pt-1'>
                    <Badge
                      variant='outline'
                      className='font-mono text-base px-3 py-1'
                    >
                      #{index + 1}
                    </Badge>
                  </div>

                  {/* Head of Account & Beneficiary */}
                  <div className='col-span-3'>
                    <div className='space-y-1.5'>
                      <div className='flex items-start gap-1.5'>
                        <FiFileText className='h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0' />
                        <div>
                          <p className='text-xs text-gray-500'>
                            Head of Account
                          </p>
                          <p
                            className='text-sm font-medium text-gray-900 leading-tight'
                            title={item.headOfAccount}
                          >
                            {item.headOfAccount || "—"}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-start gap-1.5'>
                        <FiUser className='h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0' />
                        <div>
                          <p className='text-xs text-gray-500'>Beneficiary</p>
                          <p
                            className='text-sm text-gray-700 leading-tight truncate max-w-[160px]'
                            title={item.beneficiary}
                          >
                            {item.beneficiary || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account No & Customer Name */}
                  <div className='col-span-2'>
                    <div className='space-y-1.5'>
                      <div className='flex items-start gap-1.5'>
                        <FiHash className='h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0' />
                        <div>
                          <p className='text-xs text-gray-500'>Account No</p>
                          <p className='text-sm font-mono text-gray-700'>
                            {item.accountNo || "—"}
                          </p>
                        </div>
                      </div>
                      {item.customerName && (
                        <div className='flex items-start gap-1.5'>
                          <FiUser className='h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0' />
                          <div>
                            <p className='text-xs text-gray-500'>Customer</p>
                            <p
                              className='text-sm text-gray-700 truncate max-w-[120px]'
                              title={item.customerName}
                            >
                              {item.customerName}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requested Amount */}
                  <div className='col-span-1'>
                    <p className='text-xs text-gray-500 mb-0.5'>Requested</p>
                    <p className='text-sm font-semibold text-gray-900'>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PKR",
                        minimumFractionDigits: 0,
                      }).format(item.requestedAmount)}
                    </p>
                  </div>

                  {/* Approved Amount */}
                  <div className='col-span-2'>
                    <Label className='text-xs text-gray-600 mb-1 block'>
                      Approved Amount
                    </Label>
                    <div className='relative'>
                      <span className='absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium select-none'>
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
                            index,
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        disabled={isRejected}
                        className={`pl-12 text-right font-semibold ${
                          isRejected
                            ? "bg-gray-100"
                            : diff < 0
                              ? "bg-orange-50 border-orange-300"
                              : "bg-green-50 border-green-300"
                        }`}
                      />
                    </div>
                    {diff !== 0 && !isRejected && (
                      <p className='text-xs mt-1 text-orange-600'>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "PKR",
                        }).format(diff)}
                      </p>
                    )}
                  </div>

                  {/* Line Remarks (editable) */}
                  <div className='col-span-2'>
                    <Label className='text-xs text-gray-600 mb-1 block'>
                      Remarks
                    </Label>
                    <Input
                      type='text'
                      value={item.remarks}
                      onChange={(e) =>
                        setLineItems((prev) => {
                          const updated = [...prev];
                          updated[index].remarks = e.target.value;
                          return updated;
                        })
                      }
                      className='h-9 text-sm'
                      placeholder='Optional...'
                    />
                  </div>

                  {/* Approve / Reject Buttons */}
                  <div className='col-span-1'>
                    <div className='flex items-center gap-1 justify-end'>
                      <Button
                        type='button'
                        size='sm'
                        variant={isApproved ? "default" : "outline"}
                        onClick={() =>
                          setLineStatus(
                            index,
                            isApproved ? pendingStatus : approvedStatus,
                          )
                        }
                        className={`h-8 w-8 p-0 ${
                          isApproved
                            ? "bg-green-600 hover:bg-green-700"
                            : "text-green-700 border-green-300 hover:bg-green-50"
                        }`}
                        title={
                          isApproved
                            ? `Reset to ${pendingStatus}`
                            : `Set to ${approvedStatus}`
                        }
                      >
                        <FiCheckCircle className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={isRejected ? "default" : "outline"}
                        onClick={() =>
                          setLineStatus(
                            index,
                            isRejected ? pendingStatus : rejectedStatus,
                          )
                        }
                        className={`h-8 w-8 p-0 ${
                          isRejected
                            ? "bg-red-600 hover:bg-red-700"
                            : "text-red-700 border-red-300 hover:bg-red-50"
                        }`}
                        title={
                          isRejected
                            ? `Reset to ${pendingStatus}`
                            : `Set to ${rejectedStatus}`
                        }
                      >
                        <FiXCircle className='h-4 w-4' />
                      </Button>
                    </div>
                    <div className='flex justify-end mt-1.5'>
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${getStatusBadge(item.subRequestStatus)}`}
                      >
                        {isApproved ? "✓ Apvd" : isRejected ? "✗ Rjct" : "Pend"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Summary Footer ────────────────────────────────────────────────── */}
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

        {/* Master Remarks */}
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
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────────── */}
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
          disabled={isSubmitting || !userId}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2' />
              Saving...
            </>
          ) : (
            <>
              <FiCheckCircle className='h-4 w-4 mr-2' /> Save Approval
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
