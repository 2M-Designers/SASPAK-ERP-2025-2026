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
  FiSearch,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiBriefcase,
  FiTag,
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
  onApprovalComplete: (updatedData: any) => void;
  onCancel: () => void;
};

type LineItemApproval = {
  internalFundsRequestCashId: number;
  jobId: number | null;
  jobNumber: string;
  customerName: string;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount: string;
  beneficiary: string;
  requestedAmount: number;
  approvedAmount: number;
  chargesId: number;
  onAccountOfId: number | null;
  requestedTo: number | null;
  subRequestStatus: string;
  remarks: string;
  createdOn: string;
  version?: number;
  cashFundRequestMasterId?: number;
  cashHeadId: number | null;
  cashHeadName?: string;
};

type GlAccount = {
  accountId: number;
  accountCode: string;
  accountName: string;
};

type StatusOption = { key: string; label: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternalFundRequestApprovalForm({
  requestData,
  onApprovalComplete,
  onCancel,
}: ApprovalFormProps) {
  const [lineItems, setLineItems] = useState<LineItemApproval[]>([]);
  const [masterRemarks, setMasterRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // GL Accounts for Cash Head dropdown
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [filteredGlAccounts, setFilteredGlAccounts] = useState<GlAccount[]>([]);
  const [isLoadingGlAccounts, setIsLoadingGlAccounts] = useState(false);
  const [glAccountSearch, setGlAccountSearch] = useState("");

  // Status values from API
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

  // ── Fetch GL Accounts for Cash Head ───────────────────────────────────────
  useEffect(() => {
    const fetchGlAccounts = async () => {
      setIsLoadingGlAccounts(true);
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL;
        const res = await fetch(`${base}GlAccount/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "AccountId,AccountCode,AccountName",
            where:
              "IsHeader==true && ParentAccountId != null && IsActive == true",
            sortOn: "AccountCode",
            page: "1",
            pageSize: "500",
          }),
        });
        if (res.ok) {
          const d = await res.json();
          // Normalize the data
          const normalizedData = d.map((item: any) => ({
            accountId: item.accountId || item.AccountId,
            accountCode: item.accountCode || item.AccountCode,
            accountName: item.accountName || item.AccountName,
          }));
          setGlAccounts(normalizedData);
          setFilteredGlAccounts(normalizedData);
        }
      } catch (e) {
        console.error("GL accounts:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load cash accounts",
        });
      } finally {
        setIsLoadingGlAccounts(false);
      }
    };
    fetchGlAccounts();
  }, [toast]);

  // ── Filter GL accounts based on search ────────────────────────────────────
  useEffect(() => {
    if (glAccountSearch.trim() === "") {
      setFilteredGlAccounts(glAccounts);
    } else {
      const query = glAccountSearch.toLowerCase();
      setFilteredGlAccounts(
        glAccounts.filter(
          (acc) =>
            acc.accountCode?.toLowerCase().includes(query) ||
            acc.accountName?.toLowerCase().includes(query),
        ),
      );
    }
  }, [glAccountSearch, glAccounts]);

  // ── Initialize line items from request data ───────────────────────────────
  useEffect(() => {
    if (!requestData?.internalCashFundsRequests) return;

    setMasterRemarks(requestData.remarks || "");

    const items: LineItemApproval[] = requestData.internalCashFundsRequests.map(
      (detail: any) => {
        const detailJobId = detail.jobId ?? detail.JobId ?? null;
        const jobObj = detail.job || detail.Job;
        const jobNumber =
          jobObj?.jobNumber ||
          jobObj?.JobNumber ||
          detail.jobNumber ||
          detail.JobNumber ||
          (detailJobId ? `Job #${detailJobId}` : "—");

        const cashHeadId = detail.cashHeadId ?? detail.CashHeadId ?? null;
        const cashHeadObj = detail.cashHead || detail.CashHead;
        const cashHeadName =
          cashHeadObj?.cashHeadName ||
          cashHeadObj?.CashHeadName ||
          detail.cashHeadName ||
          detail.CashHeadName ||
          "";

        // Also check glAccount if available
        const glAccountObj = detail.glAccount || detail.GlAccount;
        const glAccountName =
          glAccountObj?.accountName || glAccountObj?.AccountName || "";

        return {
          internalFundsRequestCashId:
            detail.internalFundsRequestCashId ||
            detail.InternalFundsRequestCashId,
          jobId: detailJobId,
          jobNumber,
          customerName: detail.customerName || detail.CustomerName || "",
          headCoaId: detail.headCoaId || detail.HeadCoaId,
          beneficiaryCoaId: detail.beneficiaryCoaId || detail.BeneficiaryCoaId,
          headOfAccount: detail.headOfAccount || detail.HeadOfAccount || "",
          beneficiary: detail.beneficiary || detail.Beneficiary || "",
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
          onAccountOfId: detail.onAccountOfId ?? detail.OnAccountOfId ?? null,
          requestedTo: detail.requestedTo ?? detail.RequestedTo ?? null,
          subRequestStatus:
            detail.subRequestStatus || detail.SubRequestStatus || pendingStatus,
          remarks: detail.remarks || detail.Remarks || "",
          createdOn:
            detail.createdOn || detail.CreatedOn || new Date().toISOString(),
          version: detail.version ?? 0,
          cashFundRequestMasterId: requestData.cashFundRequestId,
          cashHeadId,
          cashHeadName: cashHeadName || glAccountName,
        };
      },
    );

    setLineItems(items);
  }, [requestData, pendingStatus]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateApprovedAmount = (index: number, amount: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].approvedAmount = Math.min(
        amount,
        updated[index].requestedAmount,
      );
      return updated;
    });
  };

  const updateCashHead = (index: number, accountId: string) => {
    const selectedAccount = glAccounts.find(
      (acc) => acc.accountId.toString() === accountId,
    );
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].cashHeadId = parseInt(accountId);
      updated[index].cashHeadName = selectedAccount?.accountName || "";
      return updated;
    });
  };

  const setLineStatus = (index: number, status: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].subRequestStatus = status;
      // Reset approved amount to 0 if rejected
      if (status === rejectedStatus) {
        updated[index].approvedAmount = 0;
      }
      return updated;
    });
  };

  const approveAllLines = () => {
    setLineItems((prev) =>
      prev.map((i) => ({ ...i, subRequestStatus: approvedStatus })),
    );
  };

  const rejectAllLines = () => {
    setLineItems((prev) =>
      prev.map((i) => ({
        ...i,
        subRequestStatus: rejectedStatus,
        approvedAmount: 0,
      })),
    );
  };

  const autoFillApprovedAmounts = () => {
    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        approvedAmount:
          item.subRequestStatus !== rejectedStatus ? item.requestedAmount : 0,
      })),
    );
    toast({
      title: "Auto-filled",
      description:
        "Approved amounts set to requested amounts (except rejected lines)",
    });
  };

  const totals = {
    totalRequested: lineItems.reduce((s, i) => s + (i.requestedAmount || 0), 0),
    totalApproved: lineItems.reduce(
      (s, i) =>
        s + (i.subRequestStatus === approvedStatus ? i.approvedAmount : 0),
      0,
    ),
  };

  const derivedMasterStatus = (() => {
    if (lineItems.length === 0) return pendingStatus;
    const statuses = lineItems.map((i) => i.subRequestStatus);
    if (statuses.every((s) => s === approvedStatus)) return approvedStatus;
    if (statuses.every((s) => s === rejectedStatus)) return rejectedStatus;
    return pendingStatus;
  })();

  const handleSave = async () => {
    // Validate amounts
    const invalidAmount = lineItems.some(
      (item) =>
        item.approvedAmount < 0 || item.approvedAmount > item.requestedAmount,
    );
    if (invalidAmount) {
      toast({
        variant: "destructive",
        title: "Invalid Amounts",
        description: "Approved amounts must be between 0 and requested amount",
      });
      return;
    }

    // Validate cash head for approved lines
    const missingCashHead = lineItems.some(
      (item) => item.subRequestStatus === approvedStatus && !item.cashHeadId,
    );

    if (missingCashHead) {
      toast({
        variant: "destructive",
        title: "Missing Cash Account",
        description:
          "All approved line items must have a Cash Account selected",
      });
      return;
    }

    await submitApproval();
  };

  const submitApproval = async () => {
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
      const base = process.env.NEXT_PUBLIC_BASE_URL;

      // Build payload according to schema
      const payload = {
        CashFundRequestId:
          requestData.cashFundRequestId || requestData.CashFundRequestId,
        TotalRequestedAmount: totals.totalRequested,
        TotalApprovedAmount: totals.totalApproved,
        ApprovalStatus: derivedMasterStatus,
        ApprovedBy:
          derivedMasterStatus === approvedStatus ? userId.toString() : "",
        ApprovedOn:
          derivedMasterStatus === approvedStatus
            ? new Date().toISOString()
            : null,
        RequestedTo: requestData.requestedTo || requestData.RequestedTo,
        CreatedOn:
          requestData.createdOn ||
          requestData.CreatedOn ||
          new Date().toISOString(),
        CashHeadId: null, // Removed from master
        RequestorUserId:
          requestData.requestorUserId || requestData.RequestorUserId,
        Remarks: masterRemarks,
        CreatedByNavigation: null,
        InternalCashFundsRequests: lineItems.map((item) => ({
          InternalFundsRequestCashId: item.internalFundsRequestCashId,
          JobId: item.jobId,
          HeadCoaId: item.headCoaId,
          BeneficiaryCoaId: item.beneficiaryCoaId,
          HeadOfAccount: item.headOfAccount,
          Beneficiary: item.beneficiary,
          RequestedAmount: item.requestedAmount,
          ApprovedAmount:
            item.subRequestStatus === approvedStatus ? item.approvedAmount : 0,
          CreatedOn: item.createdOn || new Date().toISOString(),
          CashFundRequestMasterId:
            requestData.cashFundRequestId || requestData.CashFundRequestId,
          ChargesId: item.chargesId || item.headCoaId,
          CustomerName: item.customerName || "",
          RequestedTo: item.requestedTo,
          OnAccountOfId: item.onAccountOfId || null,
          SubRequestStatus: item.subRequestStatus,
          Remarks: item.remarks || "",
          CashHeadId: item.cashHeadId,
          Version: item.version || 0,
        })),
        Version: requestData.version || requestData.Version || 1,
      };

      console.log("📦 PAYLOAD:", JSON.stringify(payload, null, 2));
      console.log("📋 Request ID being sent:", payload.CashFundRequestId);

      const response = await fetch(`${base}InternalCashFundsRequest`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);

        let errorMessage = `Failed to save approval (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            errorMessage = Object.values(errorJson.errors).flat().join(", ");
          } else if (errorJson.title) {
            errorMessage = errorJson.title;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Fund request saved — Status: ${derivedMasterStatus}`,
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
  // ── Status badge styling ──────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "bg-green-100 text-green-800 border-green-300";
    if (s === "rejected") return "bg-red-100 text-red-800 border-red-300";
    if (s === "pending")
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
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
                Approve Fund Request
              </CardTitle>
              <Badge variant='outline' className='font-mono'>
                #{requestData?.cashFundRequestId}
              </Badge>
            </div>
            <div className='flex items-center gap-3'>
              <Badge
                className={`font-semibold ${getStatusBadge(derivedMasterStatus)}`}
              >
                Master: {derivedMasterStatus}
              </Badge>
            </div>
          </div>
          <CardDescription className='pt-2 flex items-center justify-between'>
            <span>
              Set approval status, approved amount, and cash account for each
              line item
            </span>
            <span className='text-xs text-gray-500'>
              Created:{" "}
              {requestData?.createdOn
                ? new Date(requestData.createdOn).toLocaleDateString()
                : "—"}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bulk Actions Bar */}
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

      {/* Line Items - Compact Cards */}
      <div className='space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2'>
        {lineItems.map((item, index) => {
          const isApproved = item.subRequestStatus === approvedStatus;
          const isRejected = item.subRequestStatus === rejectedStatus;
          const diff = item.approvedAmount - item.requestedAmount;

          return (
            <Card
              key={item.internalFundsRequestCashId || index}
              className={`border-l-4 ${
                isApproved
                  ? "border-l-green-500"
                  : isRejected
                    ? "border-l-red-500"
                    : "border-l-yellow-500"
              }`}
            >
              <CardContent className='p-4'>
                <div className='grid grid-cols-12 gap-3 items-start'>
                  {/* Line Number & Status */}
                  <div className='col-span-1'>
                    <Badge
                      variant='outline'
                      className='font-mono text-lg px-3 py-1'
                    >
                      #{index + 1}
                    </Badge>
                  </div>

                  {/* Job & Customer */}
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

                  {/* Account Details */}
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
                    </div>
                  </div>

                  {/* Requested Amount */}
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

                  {/* Approved Amount */}
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
                            index,
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

                  {/* Cash Account (GL Account) Selection */}
                  <div className='col-span-2'>
                    <Label className='text-xs text-gray-600 mb-1 block'>
                      Cash Account{" "}
                      {isApproved && <span className='text-red-500'>*</span>}
                    </Label>
                    <Select
                      value={item.cashHeadId?.toString() || ""}
                      onValueChange={(value) => updateCashHead(index, value)}
                      disabled={isRejected}
                    >
                      <SelectTrigger
                        className={`h-9 text-sm ${
                          isRejected
                            ? "bg-gray-100"
                            : "bg-blue-50 border-blue-300"
                        } ${isApproved && !item.cashHeadId ? "border-red-300" : ""}`}
                      >
                        <SelectValue placeholder='Select cash account...'>
                          {item.cashHeadName ? (
                            <span className='flex items-center gap-2 truncate'>
                              <FiDollarSign className='h-3.5 w-3.5 flex-shrink-0 text-blue-600' />
                              <span className='truncate'>
                                {item.cashHeadName}
                              </span>
                            </span>
                          ) : (
                            <span className='text-gray-500'>
                              Select cash account...
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className='max-h-[300px] w-[350px]'>
                        <div className='sticky top-0 bg-white p-2 border-b z-50'>
                          <div className='relative'>
                            <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                            <Input
                              placeholder='Search cash accounts...'
                              value={glAccountSearch}
                              onChange={(e) =>
                                setGlAccountSearch(e.target.value)
                              }
                              className='pl-8 h-8 text-sm'
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className='max-h-[250px] overflow-y-auto'>
                          {isLoadingGlAccounts ? (
                            <div className='p-4 text-center text-gray-500'>
                              Loading...
                            </div>
                          ) : filteredGlAccounts.length === 0 ? (
                            <div className='p-4 text-center text-gray-500'>
                              No cash accounts found
                            </div>
                          ) : (
                            filteredGlAccounts.map((acc) => (
                              <SelectItem
                                key={acc.accountId}
                                value={acc.accountId.toString()}
                              >
                                <div className='flex flex-col'>
                                  <span className='font-medium'>
                                    {acc.accountCode}
                                  </span>
                                  <span className='text-xs text-gray-500'>
                                    {acc.accountName}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                    {isApproved && !item.cashHeadId && (
                      <p className='text-xs text-red-600 mt-1'>
                        Required for approved items
                      </p>
                    )}
                  </div>

                  {/* Approval Actions & Remarks */}
                  <div className='col-span-1'>
                    <div className='flex items-center gap-1 justify-end'>
                      <Button
                        type='button'
                        size='sm'
                        variant={isApproved ? "default" : "outline"}
                        onClick={() => setLineStatus(index, approvedStatus)}
                        className={`h-8 w-8 p-0 ${isApproved ? "bg-green-600 hover:bg-green-700" : "text-green-700 border-green-300 hover:bg-green-50"}`}
                        title='Approve'
                      >
                        <FiCheckCircle className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        size='sm'
                        variant={isRejected ? "default" : "outline"}
                        onClick={() => setLineStatus(index, rejectedStatus)}
                        className={`h-8 w-8 p-0 ${isRejected ? "bg-red-600 hover:bg-red-700" : "text-red-700 border-red-300 hover:bg-red-50"}`}
                        title='Reject'
                      >
                        <FiXCircle className='h-4 w-4' />
                      </Button>
                      {item.remarks && (
                        <div className='relative group'>
                          <FiTag className='h-4 w-4 text-gray-400 cursor-help' />
                          <div className='absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap max-w-[200px] truncate z-50'>
                            {item.remarks}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
