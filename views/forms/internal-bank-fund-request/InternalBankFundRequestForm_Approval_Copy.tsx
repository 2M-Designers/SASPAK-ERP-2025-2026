"use client";

import { useState, useEffect, useRef } from "react";
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
import { FiCheckCircle, FiXCircle, FiX, FiClock } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalFormProps = {
  requestData: any;
  onApprovalComplete: (updatedData: any) => void;
  onCancel: () => void;
};

type LineItemApproval = {
  internalFundsRequestBankId: number;
  jobId: number | null;
  jobNumber: string;
  customerName: string;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount: string;
  beneficiary: string;
  accountNo: string;
  onAccountOfId: number | null;
  requestedAmount: number;
  approvedAmount: number;
  chargesId: number;
  requestedTo: number | null;
  subRequestStatus: string;
  remarks: string;
  createdOn: string;
  version?: number;
  bankFundRequestMasterId?: number;
};

type StatusOption = { key: string; label: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternalBankFundRequestApprovalForm({
  requestData,
  onApprovalComplete,
  onCancel,
}: ApprovalFormProps) {
  const [lineItems, setLineItems] = useState<LineItemApproval[]>([]);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Status values from API
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [pendingStatus, setPendingStatus] = useState("Pending");
  const [approvedStatus, setApprovedStatus] = useState("Approved");
  const [rejectedStatus, setRejectedStatus] = useState("Rejected");

  const amountInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  // ── userId ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(parseInt(stored, 10));
    else
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log in again.",
      });
  }, [toast]);

  // ── Status options from API ───────────────────────────────────────────────
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL;
        const res = await fetch(
          `${base}General/GetTypeValues?typeName=FundRequest_Detail_Status`,
          { method: "GET", headers: { "Content-Type": "application/json" } },
        );
        if (res.ok) {
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
        }
      } catch (e) {
        console.error("Status fetch:", e);
      }
    };
    fetchStatuses();
  }, []);

  // ── Initialize line items from Bank detail records ────────────────────────
  useEffect(() => {
    if (!requestData?.internalBankFundsRequests) return;
    console.log("=== BANK APPROVAL FORM: Loading data ===", requestData);

    const items: LineItemApproval[] = requestData.internalBankFundsRequests.map(
      (detail: any) => {
        const detailJobId = detail.jobId ?? detail.JobId ?? null;
        const jobObj = detail.job || detail.Job;
        const jobNumber =
          jobObj?.jobNumber ||
          jobObj?.JobNumber ||
          detail.jobNumber ||
          detail.JobNumber ||
          (detailJobId ? `#${detailJobId}` : "—");

        return {
          internalFundsRequestBankId:
            detail.internalFundsRequestBankId ||
            detail.InternalFundsRequestBankId,
          jobId: detailJobId,
          jobNumber,
          customerName: detail.customerName || detail.CustomerName || "",
          headCoaId: detail.headCoaId || detail.HeadCoaId,
          beneficiaryCoaId: detail.beneficiaryCoaId || detail.BeneficiaryCoaId,
          headOfAccount: detail.headOfAccount || detail.HeadOfAccount || "",
          beneficiary: detail.beneficiary || detail.Beneficiary || "",
          accountNo: detail.accountNo || detail.AccountNo || "",
          onAccountOfId: detail.onAccountOfId ?? detail.OnAccountOfId ?? null,
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
          subRequestStatus:
            detail.subRequestStatus || detail.SubRequestStatus || pendingStatus,
          remarks: detail.remarks || detail.Remarks || "",
          createdOn:
            detail.createdOn || detail.CreatedOn || new Date().toISOString(),
          version: detail.version ?? 0,
          bankFundRequestMasterId: requestData.bankFundRequestId,
        };
      },
    );

    console.log("✅ Bank approval line items:", items);
    setLineItems(items);
  }, [requestData, pendingStatus]);

  // ── Derived master status ─────────────────────────────────────────────────
  const derivedMasterStatus = (() => {
    if (lineItems.length === 0) return pendingStatus;
    const statuses = lineItems.map((i) => i.subRequestStatus);
    const first = statuses[0];
    if (statuses.every((s) => s === first)) return first;
    return pendingStatus;
  })();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateApprovedAmount = (index: number, amount: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].approvedAmount = amount;
      return updated;
    });
  };

  // Per-line status
  const setLineStatus = (id: number, status: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.internalFundsRequestBankId === id
          ? { ...item, subRequestStatus: status }
          : item,
      ),
    );
  };

  const approveAllLines = () =>
    setLineItems((prev) =>
      prev.map((i) => ({ ...i, subRequestStatus: approvedStatus })),
    );
  const rejectAllLines = () =>
    setLineItems((prev) =>
      prev.map((i) => ({ ...i, subRequestStatus: rejectedStatus })),
    );
  const pendingAllLines = () =>
    setLineItems((prev) =>
      prev.map((i) => ({ ...i, subRequestStatus: pendingStatus })),
    );

  const autoFillApprovedAmounts = () => {
    setLineItems((prev) =>
      prev.map((item) => ({ ...item, approvedAmount: item.requestedAmount })),
    );
    toast({
      title: "Auto-filled",
      description: "All approved amounts set to requested amounts",
    });
  };

  const totals = {
    totalRequested: lineItems.reduce((s, i) => s + (i.requestedAmount || 0), 0),
    // Only sum approved amounts for lines that are approved
    totalApproved: lineItems.reduce(
      (s, i) =>
        s + (i.subRequestStatus === approvedStatus ? i.approvedAmount : 0),
      0,
    ),
  };

  const difference = totals.totalApproved - totals.totalRequested;

  // ── Save (derives master status from lines) ───────────────────────────────
  const handleSave = async () => {
    const invalid = lineItems.some(
      (item) =>
        item.approvedAmount < 0 || item.approvedAmount > item.requestedAmount,
    );
    if (invalid) {
      toast({
        variant: "destructive",
        title: "Invalid Amounts",
        description: "Approved amounts must be between 0 and requested amount",
      });
      return;
    }
    await submitApproval(derivedMasterStatus);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitApproval = async (masterStatus: string) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log in again.",
      });
      return;
    }

    const isApproving = masterStatus === approvedStatus;

    console.log("=".repeat(60));
    console.log(`BANK SAVE: master status → ${masterStatus}`);
    console.log("Request ID:", requestData.bankFundRequestId);
    console.log("=".repeat(60));

    setIsSubmitting(true);

    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL;

      const payload = {
        bankFundRequestId: requestData.bankFundRequestId,
        bankId: requestData.bankId,
        bank: null,
        requestorUserId:
          requestData.requestorUserId ?? requestData.RequestorUserId ?? null,
        totalRequestedAmount:
          requestData.totalRequestedAmount || totals.totalRequested,
        totalApprovedAmount: totals.totalApproved,
        approvalStatus: masterStatus,
        approvedBy: isApproving ? userId.toString() : null,
        approvedOn: isApproving ? new Date().toISOString() : null,
        requestedTo: requestData.requestedTo,
        createdOn: requestData.createdOn,
        version: requestData.version || 1,
        requestedToNavigation: null,
        createdAt: "0001-01-01T00:00:00",
        updatedAt: "0001-01-01T00:00:00",
        createLog: null,
        updateLog: null,
        internalBankFundsRequests: lineItems.map((item) => ({
          internalFundsRequestBankId: item.internalFundsRequestBankId,
          bankFundRequestMasterId: requestData.bankFundRequestId,
          jobId: item.jobId,
          headCoaId: item.headCoaId,
          beneficiaryCoaId: item.beneficiaryCoaId,
          headOfAccount: item.headOfAccount,
          beneficiary: item.beneficiary,
          accountNo: item.accountNo || "",
          customerName: item.customerName || "",
          onAccountOfId:
            item.onAccountOfId && item.onAccountOfId > 0
              ? item.onAccountOfId
              : null,
          requestedAmount: item.requestedAmount,
          // Only send approvedAmount if line is approved, else 0
          approvedAmount:
            item.subRequestStatus === approvedStatus ? item.approvedAmount : 0,
          chargesId: item.chargesId,
          requestedTo: item.requestedTo,
          subRequestStatus: item.subRequestStatus,
          remarks: item.remarks || "",
          version: item.version ?? 0,
          createdOn: item.createdOn,
          createdBy: null,
          beneficiaryCoa: null,
          charges: null,
          headCoa: null,
          createdAt: "0001-01-01T00:00:00",
          updatedAt: "0001-01-01T00:00:00",
          createLog: null,
          updateLog: null,
        })),
      };

      console.log(
        "📦 BANK APPROVAL PAYLOAD:",
        JSON.stringify(payload, null, 2),
      );

      const response = await fetch(`${base}InternalBankFundsRequest`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

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
          else if (typeof parsed === "string") userMessage = parsed;
        } catch {
          userMessage = errorText || userMessage;
        }
        throw new Error(userMessage);
      }

      const result = await response.json();
      console.log("✅ SUCCESS!", result);

      toast({
        title: "Success",
        description: `Bank fund request saved — Master status: ${masterStatus} | Approved: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(totals.totalApproved)}`,
      });
      onApprovalComplete(result);
    } catch (error) {
      console.error("💥", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  const handleAmountKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (index < lineItems.length - 1)
        amountInputRefs.current[index + 1]?.focus();
    }
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      amountInputRefs.current[index - 1]?.focus();
    }
  };

  // ── Status styling ────────────────────────────────────────────────────────
  const getStatusStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "bg-green-50 text-green-700 border-green-300";
    if (s === "rejected") return "bg-red-50 text-red-700 border-red-300";
    if (s === "pending")
      return "bg-yellow-50 text-yellow-700 border-yellow-300";
    if (s === "paid") return "bg-blue-50 text-blue-700 border-blue-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className='space-y-4'>
      <style jsx global>{`
        .bank-approval-table-wrapper::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .bank-approval-table-wrapper::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 7px;
          border: 1px solid #d1d5db;
        }
        .bank-approval-table-wrapper::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 7px;
          border: 2px solid #e5e7eb;
        }
        .bank-approval-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className='py-3 px-4 bg-purple-50'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg flex items-center gap-2'>
              <FiCheckCircle className='h-5 w-5 text-purple-600' />
              Approve Bank Fund Request
            </CardTitle>
            <Badge
              variant='outline'
              className={`font-semibold ${getStatusStyle(derivedMasterStatus)}`}
            >
              {derivedMasterStatus}
            </Badge>
          </div>
          <CardDescription className='pt-2'>
            Approve or reject each line item individually. Master status derives
            automatically from all lines.
          </CardDescription>
        </CardHeader>

        <CardContent className='p-4'>
          {/* Info banner */}
          <div className='bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-purple-900 mb-1'>
                  Approval Guidelines
                </h3>
                <p className='text-sm text-purple-700'>
                  • Use ✓ / ✗ buttons per line to approve or reject individual
                  items
                  <br />• Approved amounts can be less than or equal to
                  requested amounts
                  <br />• Use "Auto-fill" to set all approved amounts to
                  requested amounts
                  <br />• All ✓ → Master {approvedStatus} · All ✗ →{" "}
                  {rejectedStatus} · Mixed → {pendingStatus}
                  <br />• Press{" "}
                  <kbd className='px-1 py-0.5 bg-gray-100 border rounded text-xs'>
                    Enter
                  </kbd>{" "}
                  to move between approved amount fields
                </p>
              </div>
            </div>
          </div>

          {/* ── Master Info ──────────────────────────────────────────────────── */}
          <div className='mb-4 p-4 border-2 border-purple-300 rounded-lg bg-purple-50'>
            <h3 className='text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2'>
              <Badge variant='default' className='bg-purple-600'>
                Master
              </Badge>
              Request Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600 mb-1'>Request ID</p>
                <p className='text-base font-bold text-purple-700'>
                  #{requestData?.bankFundRequestId}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600 mb-1'>Bank</p>
                <p className='text-base font-bold text-blue-700'>
                  {requestData?.bank?.bankName ||
                    requestData?.bankName ||
                    (requestData?.bankId ? `Bank #${requestData.bankId}` : "—")}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600 mb-1'>Created On</p>
                <p className='text-sm font-medium text-gray-900'>
                  {requestData?.createdOn
                    ? new Date(requestData.createdOn).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Detail Table ─────────────────────────────────────────────────── */}
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                <Badge variant='outline' className='bg-gray-100'>
                  Details
                </Badge>
                Line Items Approval ({lineItems.length} items)
              </h3>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={approveAllLines}
                  className='flex items-center gap-1.5 text-green-700 border-green-300 hover:bg-green-50 text-xs'
                >
                  <FiCheckCircle className='h-3.5 w-3.5' /> Approve All
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={rejectAllLines}
                  className='flex items-center gap-1.5 text-red-700 border-red-300 hover:bg-red-50 text-xs'
                >
                  <FiXCircle className='h-3.5 w-3.5' /> Reject All
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={pendingAllLines}
                  className='flex items-center gap-1.5 text-yellow-700 border-yellow-300 hover:bg-yellow-50 text-xs'
                >
                  <FiClock className='h-3.5 w-3.5' /> Reset All
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={autoFillApprovedAmounts}
                  className='flex items-center gap-2 text-xs'
                >
                  <FiCheckCircle className='h-3.5 w-3.5' /> Auto-fill Amounts
                </Button>
              </div>
            </div>

            <div className='border rounded-lg overflow-hidden shadow-sm'>
              <div
                className='overflow-x-auto bank-approval-table-wrapper'
                style={{ maxHeight: "420px" }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-[45px]'>#</TableHead>
                      <TableHead className='min-w-[160px]'>
                        Job Number
                      </TableHead>
                      <TableHead className='min-w-[155px]'>
                        Customer Name
                      </TableHead>
                      <TableHead className='min-w-[210px]'>
                        Head of Account
                      </TableHead>
                      <TableHead className='min-w-[210px]'>
                        Beneficiary
                      </TableHead>
                      <TableHead className='min-w-[150px]'>
                        Account No
                      </TableHead>
                      <TableHead className='min-w-[130px]'>Remarks</TableHead>
                      <TableHead className='min-w-[140px] bg-green-50/60 text-center'>
                        Approve / Reject
                      </TableHead>
                      <TableHead className='min-w-[150px] text-right'>
                        Requested (PKR)
                      </TableHead>
                      <TableHead className='min-w-[175px] text-right bg-green-50'>
                        Approved (PKR) <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[120px] text-right'>
                        Difference
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => {
                      const diff = item.approvedAmount - item.requestedAmount;
                      const isOver = diff > 0;
                      const isUnder = diff < 0;
                      const isApproved =
                        item.subRequestStatus === approvedStatus;
                      const isRejected =
                        item.subRequestStatus === rejectedStatus;

                      return (
                        <TableRow
                          key={item.internalFundsRequestBankId || index}
                          className={`hover:bg-gray-50 ${isApproved ? "bg-green-50/20" : isRejected ? "bg-red-50/20" : ""}`}
                        >
                          <TableCell className='font-medium text-xs'>
                            {index + 1}
                          </TableCell>

                          {/* Job Number */}
                          <TableCell>
                            {item.jobId ? (
                              <Badge
                                variant='outline'
                                className='bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                              >
                                {item.jobNumber}
                              </Badge>
                            ) : (
                              <span className='text-xs text-gray-400'>—</span>
                            )}
                          </TableCell>

                          {/* Customer Name */}
                          <TableCell className='text-xs text-gray-700'>
                            {item.customerName || "—"}
                          </TableCell>

                          <TableCell className='text-sm font-medium'>
                            {item.headOfAccount}
                          </TableCell>
                          <TableCell className='text-sm'>
                            {item.beneficiary}
                          </TableCell>

                          {/* Account No — read-only */}
                          <TableCell className='text-sm text-gray-600 font-mono'>
                            {item.accountNo || "—"}
                          </TableCell>

                          {/* Remarks — read-only */}
                          <TableCell className='text-xs text-gray-600 max-w-[120px]'>
                            <span title={item.remarks}>
                              {item.remarks || "—"}
                            </span>
                          </TableCell>

                          {/* Per-line Approve / Status / Reject */}
                          <TableCell className='bg-green-50/20'>
                            <div className='flex items-center gap-1 justify-center'>
                              {/* Approve */}
                              <button
                                type='button'
                                onClick={() =>
                                  setLineStatus(
                                    item.internalFundsRequestBankId,
                                    isApproved ? pendingStatus : approvedStatus,
                                  )
                                }
                                title={
                                  isApproved
                                    ? `Reset to ${pendingStatus}`
                                    : `Set to ${approvedStatus}`
                                }
                                className={`p-1.5 rounded transition-all ${isApproved ? "bg-green-600 text-white shadow-sm" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                              >
                                <FiCheckCircle className='h-4 w-4' />
                              </button>

                              {/* Status badge */}
                              <span
                                className={`text-xs font-semibold px-1 py-0.5 rounded border min-w-[54px] text-center ${getStatusStyle(item.subRequestStatus)}`}
                              >
                                {isApproved
                                  ? "✓ Apvd"
                                  : isRejected
                                    ? "✗ Rjct"
                                    : "Pending"}
                              </span>

                              {/* Reject */}
                              <button
                                type='button'
                                onClick={() =>
                                  setLineStatus(
                                    item.internalFundsRequestBankId,
                                    isRejected ? pendingStatus : rejectedStatus,
                                  )
                                }
                                title={
                                  isRejected
                                    ? `Reset to ${pendingStatus}`
                                    : `Set to ${rejectedStatus}`
                                }
                                className={`p-1.5 rounded transition-all ${isRejected ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
                              >
                                <FiXCircle className='h-4 w-4' />
                              </button>
                            </div>
                          </TableCell>

                          {/* Requested */}
                          <TableCell className='text-sm font-medium text-right'>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "PKR",
                            }).format(item.requestedAmount)}
                          </TableCell>

                          {/* Approved (editable) */}
                          <TableCell className='bg-green-50'>
                            <div className='relative'>
                              <span className='absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold select-none'>
                                PKR
                              </span>
                              <Input
                                ref={(el) => {
                                  amountInputRefs.current[index] = el;
                                }}
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
                                onKeyDown={(e) => handleAmountKeyDown(e, index)}
                                className={`h-9 text-sm pl-10 text-right font-semibold ${isOver ? "border-red-300 bg-red-50" : "border-green-300 bg-white"}`}
                                placeholder='0.00'
                              />
                            </div>
                          </TableCell>

                          {/* Difference */}
                          <TableCell className='text-sm text-right'>
                            <span
                              className={`font-medium ${isOver ? "text-red-600" : isUnder ? "text-orange-600" : "text-green-600"}`}
                            >
                              {diff > 0 ? "+" : ""}
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "PKR",
                              }).format(diff)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* ── Totals ──────────────────────────────────────────────────────── */}
          <div className='bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-lg p-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-sm text-gray-600'>Total Requested</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(totals.totalRequested)}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-sm text-gray-600'>Total Approved</p>
                <p className='text-2xl font-bold text-green-700'>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(totals.totalApproved)}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-sm text-gray-600'>Master Status</p>
                <p
                  className={`text-sm font-bold mt-1 flex items-center gap-1 ${
                    derivedMasterStatus === approvedStatus
                      ? "text-green-700"
                      : derivedMasterStatus === rejectedStatus
                        ? "text-red-700"
                        : "text-yellow-700"
                  }`}
                >
                  {derivedMasterStatus === approvedStatus && <FiCheckCircle />}
                  {derivedMasterStatus === rejectedStatus && <FiXCircle />}
                  {derivedMasterStatus === pendingStatus && <FiClock />}
                  {derivedMasterStatus}
                </p>
              </div>
            </div>

            {difference > 0 && (
              <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                <div className='flex items-start gap-2'>
                  <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-semibold text-red-900 text-sm'>
                      Over-Approved Amount
                    </h4>
                    <p className='text-xs text-red-700 mt-1'>
                      Total approved exceeds requested by{" "}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PKR",
                      }).format(difference)}
                      . Please review before saving.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Overall Remarks ──────────────────────────────────────────────── */}
          <div className='mt-4'>
            <Label
              htmlFor='overall-remarks'
              className='text-sm font-medium text-gray-700 mb-2 block'
            >
              Overall Remarks (Optional)
            </Label>
            <textarea
              id='overall-remarks'
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className='w-full min-h-[80px] p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
              placeholder='Add any notes or comments about this approval decision...'
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Action Buttons ───────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        {/* Derived status preview */}
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <span>Master status will be saved as:</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusStyle(derivedMasterStatus)}`}
          >
            {derivedMasterStatus === approvedStatus && (
              <FiCheckCircle className='mr-1 h-3 w-3' />
            )}
            {derivedMasterStatus === rejectedStatus && (
              <FiXCircle className='mr-1 h-3 w-3' />
            )}
            {derivedMasterStatus === pendingStatus && (
              <FiClock className='mr-1 h-3 w-3' />
            )}
            {derivedMasterStatus}
          </span>
          <span className='text-xs text-gray-400'>
            (
            {
              lineItems.filter((i) => i.subRequestStatus === approvedStatus)
                .length
            }{" "}
            approved ·{" "}
            {
              lineItems.filter((i) => i.subRequestStatus === rejectedStatus)
                .length
            }{" "}
            rejected ·{" "}
            {
              lineItems.filter((i) => i.subRequestStatus === pendingStatus)
                .length
            }{" "}
            pending)
          </span>
        </div>

        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isSubmitting}
            className='gap-2'
          >
            <FiX className='h-4 w-4' /> Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSave}
            disabled={isSubmitting || !userId}
            className='bg-blue-600 hover:bg-blue-700 gap-2'
          >
            {isSubmitting ? (
              <>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />{" "}
                Saving...
              </>
            ) : (
              <>
                <FiCheckCircle className='h-4 w-4' /> Save Approval
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
