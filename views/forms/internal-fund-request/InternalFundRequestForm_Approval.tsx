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
import {
  FiCheckCircle,
  FiXCircle,
  FiSave,
  FiX,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ApprovalFormProps = {
  requestData: any;
  onApprovalComplete: (updatedData: any) => void;
  onCancel: () => void;
};

type LineItemApproval = {
  internalFundsRequestCashId: number;
  headCoaId: number;
  beneficiaryCoaId: number;
  headOfAccount: string;
  beneficiary: string;
  requestedAmount: number;
  approvedAmount: number;
  chargesId: number;
  createdOn: string;
  version?: number;
  cashFundRequestMasterId?: number;
  jobId?: number;
};

export default function InternalFundRequestApprovalForm({
  requestData,
  onApprovalComplete,
  onCancel,
}: ApprovalFormProps) {
  const [lineItems, setLineItems] = useState<LineItemApproval[]>([]);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const { toast } = useToast();

  const amountInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get userId from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
      console.log("Approver userId:", parseInt(storedUserId, 10));
    } else {
      console.error("No userId found in localStorage");
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log in again.",
      });
    }
  }, [toast]);

  // Initialize line items from request data
  useEffect(() => {
    if (requestData?.internalCashFundsRequests) {
      console.log("=== APPROVAL FORM: Loading data ===");
      console.log("Request data:", requestData);

      const items = requestData.internalCashFundsRequests.map(
        (detail: any) => ({
          internalFundsRequestCashId:
            detail.internalFundsRequestCashId ||
            detail.InternalFundsRequestCashId,
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
          createdOn:
            detail.createdOn || detail.CreatedOn || new Date().toISOString(),
          version: detail.version || 0,
          cashFundRequestMasterId: requestData.cashFundRequestId,
          jobId: requestData.jobId,
        }),
      );

      console.log("✅ Initialized approval line items:", items);
      setLineItems(items);
    }
  }, [requestData]);

  const updateApprovedAmount = (index: number, amount: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index].approvedAmount = amount;
      return updated;
    });
  };

  // Auto-fill all approved amounts to requested amounts
  const autoFillApprovedAmounts = () => {
    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        approvedAmount: item.requestedAmount,
      })),
    );
    toast({
      title: "Auto-filled",
      description: "All approved amounts set to requested amounts",
    });
  };

  // Calculate totals
  const totals = {
    totalRequested: lineItems.reduce(
      (sum, item) => sum + (item.requestedAmount || 0),
      0,
    ),
    totalApproved: lineItems.reduce(
      (sum, item) => sum + (item.approvedAmount || 0),
      0,
    ),
  };

  const handleApprove = () => {
    // Validate approved amounts
    const hasInvalidAmounts = lineItems.some(
      (item) =>
        item.approvedAmount < 0 || item.approvedAmount > item.requestedAmount,
    );

    if (hasInvalidAmounts) {
      toast({
        variant: "destructive",
        title: "Invalid Amounts",
        description: "Approved amounts must be between 0 and requested amount",
      });
      return;
    }

    setShowApproveDialog(true);
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmApproval = async () => {
    setShowApproveDialog(false);
    await submitApproval("APPROVED");
  };

  const confirmRejection = async () => {
    setShowRejectDialog(false);
    await submitApproval("REJECTED");
  };

  const submitApproval = async (status: "APPROVED" | "REJECTED") => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please log in again.",
      });
      return;
    }

    console.log("=".repeat(80));
    console.log(`APPROVAL UPDATE: ${status}`);
    console.log("=".repeat(80));
    console.log("Request ID:", requestData.cashFundRequestId);
    console.log("Approver ID:", userId);

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // Build the payload exactly as shown in the working example
      const payload = {
        jobId: requestData.jobId,
        totalRequestedAmount:
          requestData.totalRequestedAmount || totals.totalRequested,
        totalApprovedAmount: status === "APPROVED" ? totals.totalApproved : 0,
        approvalStatus: status,
        approvedBy: status === "APPROVED" ? userId.toString() : null,
        approvedOn: status === "APPROVED" ? new Date().toISOString() : null,
        requestedTo: requestData.requestedTo,
        createdBy: requestData.createdBy,
        createdOn: requestData.createdOn,
        internalCashFundsRequests: lineItems.map((item) => {
          // Create the base line item with all required fields
          const lineItem: any = {
            jobId: requestData.jobId,
            headCoaId: item.headCoaId,
            beneficiaryCoaId: item.beneficiaryCoaId,
            headOfAccount: item.headOfAccount,
            beneficiary: item.beneficiary,
            requestedAmount: item.requestedAmount,
            chargesId: item.chargesId,
            approvedAmount: status === "APPROVED" ? item.approvedAmount : 0,
          };

          // Add optional fields if they exist
          if (item.internalFundsRequestCashId) {
            lineItem.internalFundsRequestCashId =
              item.internalFundsRequestCashId;
          }

          if (requestData.cashFundRequestId) {
            lineItem.cashFundRequestMasterId = requestData.cashFundRequestId;
          }

          if (item.version !== undefined) {
            lineItem.version = item.version;
          }

          if (item.createdOn) {
            lineItem.createdOn = item.createdOn;
          }

          return lineItem;
        }),
        version: requestData.version || 1,
        cashFundRequestId: requestData.cashFundRequestId,
      };

      console.log("-".repeat(80));
      console.log("📦 APPROVAL PAYLOAD:");
      console.log(JSON.stringify(payload, null, 2));
      console.log("-".repeat(80));

      const endpoint = `${baseUrl}InternalCashFundsRequest`;
      console.log(`📡 PUT ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload), // Send payload directly, not wrapped in dto
      });

      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ PUT FAILED!");
        console.error("Status:", response.status);
        console.error("Response:", errorText);

        let errorMessage = `Failed to ${status.toLowerCase()}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors) {
            errorMessage = Object.entries(errorJson.errors)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ");
          } else if (errorJson.title) {
            errorMessage = errorJson.title;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ SUCCESS!");
      console.log(JSON.stringify(result, null, 2));
      console.log("=".repeat(80));

      toast({
        title: "Success",
        description: `Fund request ${status.toLowerCase()} successfully. ${
          status === "APPROVED"
            ? `Total approved: ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
              }).format(totals.totalApproved)}`
            : "All amounts set to zero."
        }`,
      });

      onApprovalComplete(result);
    } catch (error) {
      console.error("💥 Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${status.toLowerCase()} fund request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (index < lineItems.length - 1) {
        amountInputRefs.current[index + 1]?.focus();
      }
    }

    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      amountInputRefs.current[index - 1]?.focus();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-300";
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-300";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-300";
      case "PAID":
        return "bg-blue-50 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const difference = totals.totalApproved - totals.totalRequested;

  return (
    <div className='space-y-4'>
      {/* Add global styles */}
      <style jsx global>{`
        .approval-table-wrapper::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .approval-table-wrapper::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 7px;
          border: 1px solid #d1d5db;
        }
        .approval-table-wrapper::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 7px;
          border: 2px solid #e5e7eb;
        }
        .approval-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>

      {/* Header Card */}
      <Card>
        <CardHeader className='py-3 px-4 bg-purple-50'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg flex items-center gap-2'>
              <FiCheckCircle className='h-5 w-5 text-purple-600' />
              Approve Fund Request
            </CardTitle>
            <Badge
              variant='outline'
              className={`font-semibold ${getStatusBadge(
                requestData?.approvalStatus || "PENDING",
              )}`}
            >
              {requestData?.approvalStatus || "PENDING"}
            </Badge>
          </div>
          <CardDescription className='pt-2'>
            Review and approve/reject the fund request. You can modify approved
            amounts for each line item.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-4'>
          {/* Info Banner */}
          <div className='bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-purple-900 mb-1'>
                  Approval Guidelines
                </h3>
                <p className='text-sm text-purple-700'>
                  • Review each line item carefully before approving
                  <br />
                  • Approved amounts can be less than or equal to requested
                  amounts
                  <br />
                  • Use "Auto-fill" to approve all amounts as requested
                  <br />
                  • Rejecting will set all approved amounts to zero
                  <br />• Press{" "}
                  <kbd className='px-1 py-0.5 bg-gray-100 border rounded text-xs'>
                    Enter
                  </kbd>{" "}
                  to move between approved amount fields
                </p>
              </div>
            </div>
          </div>

          {/* Master Information (Read-Only) */}
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
                  #{requestData?.cashFundRequestId}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600 mb-1'>Job Number</p>
                <p className='text-base font-bold text-blue-700'>
                  {requestData?.job?.jobNumber || requestData?.jobNumber || "-"}
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
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items for Approval */}
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                <Badge variant='outline' className='bg-gray-100'>
                  Details
                </Badge>
                Line Items Approval ({lineItems.length} items)
              </h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={autoFillApprovedAmounts}
                className='flex items-center gap-2'
              >
                <FiCheckCircle className='h-4 w-4' />
                Auto-fill Approved Amounts
              </Button>
            </div>

            <div className='border rounded-lg overflow-hidden shadow-sm'>
              <div
                className='overflow-x-auto approval-table-wrapper'
                style={{ maxHeight: "400px" }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-[50px]'>#</TableHead>
                      <TableHead className='min-w-[220px]'>
                        Head of Account
                      </TableHead>
                      <TableHead className='min-w-[220px]'>
                        Beneficiary
                      </TableHead>
                      <TableHead className='min-w-[150px] text-right'>
                        Requested Amount
                      </TableHead>
                      <TableHead className='min-w-[180px] text-right bg-green-50'>
                        Approved Amount <span className='text-red-500'>*</span>
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

                      return (
                        <TableRow
                          key={item.internalFundsRequestCashId || index}
                          className='hover:bg-gray-50'
                        >
                          <TableCell className='font-medium'>
                            {index + 1}
                          </TableCell>
                          <TableCell className='text-sm font-medium'>
                            {item.headOfAccount}
                          </TableCell>
                          <TableCell className='text-sm'>
                            {item.beneficiary}
                          </TableCell>
                          <TableCell className='text-sm font-medium text-right'>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "PKR",
                            }).format(item.requestedAmount)}
                          </TableCell>
                          <TableCell className='bg-green-50'>
                            <div className='relative'>
                              <FiDollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
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
                                className={`h-9 text-sm pl-9 text-right font-semibold ${
                                  isOver
                                    ? "border-red-300 bg-red-50"
                                    : "border-green-300 bg-white"
                                }`}
                                placeholder='0.00'
                              />
                            </div>
                          </TableCell>
                          <TableCell className='text-sm text-right'>
                            <span
                              className={`font-medium ${
                                isOver
                                  ? "text-red-600"
                                  : isUnder
                                    ? "text-orange-600"
                                    : "text-green-600"
                              }`}
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

          {/* Totals Summary */}
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
                <p className='text-sm text-gray-600'>Difference</p>
                <p
                  className={`text-2xl font-bold ${
                    difference > 0
                      ? "text-red-700"
                      : difference < 0
                        ? "text-orange-700"
                        : "text-green-700"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(difference)}
                </p>
              </div>
            </div>

            {/* Warning if over-approved */}
            {difference > 0 && (
              <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                <div className='flex items-start gap-2'>
                  <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-semibold text-red-900 text-sm'>
                      Over-Approved Amount
                    </h4>
                    <p className='text-xs text-red-700 mt-1'>
                      Total approved amount exceeds requested amount by{" "}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PKR",
                      }).format(difference)}
                      . Please review before approving.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remarks (Optional) */}
          <div className='mt-4'>
            <Label
              htmlFor='remarks'
              className='text-sm font-medium text-gray-700 mb-2 block'
            >
              Remarks (Optional)
            </Label>
            <textarea
              id='remarks'
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className='w-full min-h-[80px] p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
              placeholder='Add any notes or comments about this approval...'
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={isSubmitting}
          className='gap-2'
        >
          <FiX className='h-4 w-4' />
          Cancel
        </Button>
        <Button
          type='button'
          variant='destructive'
          onClick={handleReject}
          disabled={isSubmitting}
          className='gap-2'
        >
          <FiXCircle className='h-4 w-4' />
          Reject Request
        </Button>
        <Button
          type='button'
          onClick={handleApprove}
          disabled={isSubmitting || !userId}
          className='bg-green-600 hover:bg-green-700 gap-2'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Processing...
            </>
          ) : (
            <>
              <FiCheckCircle className='h-4 w-4' />
              Approve Request
            </>
          )}
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <FiCheckCircle className='h-5 w-5 text-green-600' />
              Confirm Approval
            </AlertDialogTitle>
            <AlertDialogDescription className='space-y-2'>
              <p>Are you sure you want to approve this fund request?</p>
              <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded'>
                <p className='text-sm font-semibold text-green-900'>
                  Total Approved Amount:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(totals.totalApproved)}
                </p>
                <p className='text-xs text-green-700 mt-1'>
                  {lineItems.length} line item(s) will be approved
                </p>
              </div>
              {difference !== 0 && (
                <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded'>
                  <p className='text-xs text-yellow-800'>
                    <FiAlertCircle className='inline h-3 w-3 mr-1' />
                    Difference from requested:{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PKR",
                    }).format(Math.abs(difference))}{" "}
                    {difference > 0 ? "over" : "under"}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApproval}
              className='bg-green-600 hover:bg-green-700'
            >
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <FiXCircle className='h-5 w-5 text-red-600' />
              Confirm Rejection
            </AlertDialogTitle>
            <AlertDialogDescription className='space-y-2'>
              <p>Are you sure you want to reject this fund request?</p>
              <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded'>
                <p className='text-sm font-semibold text-red-900'>
                  Request ID: #{requestData?.cashFundRequestId}
                </p>
                <p className='text-xs text-red-700 mt-1'>
                  All approved amounts will be set to zero. This action can be
                  reversed later if needed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRejection}
              className='bg-red-600 hover:bg-red-700'
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
