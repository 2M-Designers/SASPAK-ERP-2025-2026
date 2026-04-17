// components/job-order/UpdateJobStatusDialog.tsx

"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FiToggleRight,
  FiX,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import { Portal } from "@radix-ui/react-portal";

type JobMaster = {
  jobId: number;
  jobNumber: string;
  status: string;
  remarks?: string;
  operationType?: string;
  operationMode?: string;
};

type UpdateJobStatusDialogProps = {
  open: boolean;
  job: JobMaster | null;
  onClose: () => void;
  onSuccess: (jobId: number, newStatus: string, remarks: string) => void;
  apiBaseUrl?: string;
};

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

export function UpdateJobStatusDialog({
  open,
  job,
  onClose,
  onSuccess,
  apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "",
}: UpdateJobStatusDialogProps) {
  const { toast } = useToast();
  const [statusOptions, setStatusOptions] = useState<
    { key: string; label: string }[]
  >([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [jobRemarks, setJobRemarks] = useState("");
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusMeta = (
    status: string,
  ): { dot: string; badge: string; icon?: JSX.Element } => {
    const s = (status ?? "").toUpperCase();

    if (s.includes("HOLD") || s.includes("CANCEL")) {
      return {
        dot: "bg-red-500",
        badge: "bg-red-50 text-red-700 border-red-300",
        icon: <FiAlertCircle className='h-3 w-3' />,
      };
    }
    if (
      s.includes("COLLECT") ||
      s.includes("DISPATCH") ||
      s.includes("COMPLET")
    ) {
      return {
        dot: "bg-green-500",
        badge: "bg-green-50 text-green-700 border-green-300",
        icon: <FiCheckCircle className='h-3 w-3' />,
      };
    }
    if (
      s.includes("IN PROCESS") ||
      s.includes("GROUNDING") ||
      s.includes("ACTIVE")
    ) {
      return {
        dot: "bg-blue-500",
        badge: "bg-blue-50 text-blue-700 border-blue-300",
      };
    }
    if (s.includes("AWAITED") || s.includes("PAYMENT") || s.includes("DRAFT")) {
      return {
        dot: "bg-yellow-500",
        badge: "bg-yellow-50 text-yellow-700 border-yellow-300",
        icon: <FiClock className='h-3 w-3' />,
      };
    }
    return {
      dot: "bg-gray-400",
      badge: "bg-gray-100 text-gray-700 border-gray-300",
    };
  };

  useEffect(() => {
    if (!open) return;

    setSelectedStatus(job?.status ?? "");
    setJobRemarks(job?.remarks ?? "");

    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const baseUrl = apiBaseUrl.endsWith("/")
          ? apiBaseUrl
          : `${apiBaseUrl}/`;
        const response = await fetch(
          `${baseUrl}General/GetTypeValues?typeName=Job_Stage_Status`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          },
        );

        if (response.status === 401) {
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Please log in again.",
          });
          return;
        }

        if (response.ok) {
          const raw: Record<string, string> = await response.json();
          const options = Object.entries(raw).map(([key, label]) => ({
            key: key,
            label: label.replace(/["']+$/g, "").trim(),
          }));
          setStatusOptions(options);
        } else {
          throw new Error("Failed to fetch status options");
        }
      } catch (error) {
        console.error("Error fetching status options:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load status options",
        });
      } finally {
        setIsLoadingStatuses(false);
      }
    };

    fetchStatuses();
  }, [open, job, apiBaseUrl, toast]);

  const handleUpdate = async () => {
    if (!job) return;

    if (!selectedStatus) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a status",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
      const params = new URLSearchParams({
        jobId: job.jobId.toString(),
        jobStatus: selectedStatus,
        jobRemarks: jobRemarks || "",
      });

      const response = await fetch(
        `${baseUrl}Job/UpdateJobStatus?${params.toString()}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        },
      );

      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please log in again.",
        });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Update failed (${response.status})`;

        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.title || parsed.message || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      onSuccess(job.jobId, selectedStatus, jobRemarks);
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMeta = getStatusMeta(selectedStatus);
  const currentMeta = getStatusMeta(job?.status ?? "");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <FiToggleRight className='h-5 w-5 text-blue-600' />
            Update Job Status
          </DialogTitle>
          <DialogDescription className='text-xs'>
            Change the stage status and add remarks for this job order
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center justify-center py-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 my-2 px-4'>
          <p className='text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1'>
            JOB ORDER
          </p>
          <p className='text-3xl font-black text-blue-800 tracking-tight mb-2'>
            {job?.jobNumber ?? "—"}
          </p>

          <div className='flex items-center gap-1.5 flex-wrap justify-center'>
            <span className='text-xs text-gray-500'>Current Stage:</span>
            {job?.status ? (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${currentMeta.badge}`}
              >
                {currentMeta.icon}
                <span
                  className={`w-1.5 h-1.5 rounded-full ${currentMeta.dot}`}
                />
                {job.status}
              </span>
            ) : (
              <span className='text-xs text-gray-400 italic'>Not set</span>
            )}
          </div>

          {job?.operationType && (
            <span className='mt-2 text-xs text-indigo-400 font-medium'>
              {job.operationType}
              {job.operationMode ? ` · ${job.operationMode}` : ""}
            </span>
          )}
        </div>

        <div className='space-y-4 pt-1'>
          <div>
            <Label className='text-sm font-medium mb-1.5 block'>
              New Stage Status <span className='text-red-500'>*</span>
            </Label>

            {isLoadingStatuses ? (
              <div className='h-10 bg-gray-100 animate-pulse rounded-md flex items-center px-3 text-xs text-gray-400'>
                Loading statuses...
              </div>
            ) : (
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isSubmitting}
              >
                <SelectTrigger className='w-full text-sm min-h-[40px] h-auto'>
                  <SelectValue placeholder='Select new stage...'>
                    {selectedStatus && (
                      <div className='flex items-center gap-2 py-0.5'>
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedMeta.dot}`}
                        />
                        <span className='text-xs leading-snug whitespace-normal text-left'>
                          {selectedStatus}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <Portal>
                  <SelectContent
                    className='max-h-[320px] z-[9999] bg-white'
                    position='popper'
                    sideOffset={5}
                  >
                    {statusOptions.length === 0 ? (
                      <div className='p-3 text-center text-sm text-gray-500'>
                        No statuses available
                      </div>
                    ) : (
                      statusOptions.map((option) => {
                        const meta = getStatusMeta(option.key);
                        return (
                          <SelectItem
                            key={option.key}
                            value={option.key}
                            className='py-2.5 cursor-pointer focus:bg-blue-50'
                          >
                            <div className='flex items-start gap-2'>
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${meta.dot}`}
                              />
                              <span className='text-xs leading-snug whitespace-normal'>
                                {option.label}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Portal>
              </Select>
            )}

            {selectedStatus && (
              <div className='mt-2 flex items-center gap-1.5'>
                <span className='text-xs text-gray-500'>Will be set to:</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${selectedMeta.badge}`}
                >
                  {selectedMeta.icon}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${selectedMeta.dot}`}
                  />
                  {selectedStatus}
                </span>
              </div>
            )}
          </div>

          <div>
            <Label className='text-sm font-medium mb-1.5 block'>
              Remarks{" "}
              <span className='text-xs text-gray-400 font-normal'>
                (optional)
              </span>
            </Label>
            <Textarea
              value={jobRemarks}
              onChange={(e) => setJobRemarks(e.target.value)}
              placeholder='Add notes about this status change...'
              className='text-sm resize-none'
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className='gap-2 pt-2'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isSubmitting}
            className='gap-1.5'
          >
            <FiX className='h-3.5 w-3.5' /> Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isSubmitting || isLoadingStatuses || !selectedStatus}
            className='bg-blue-600 hover:bg-blue-700 gap-1.5'
          >
            {isSubmitting ? (
              <>
                <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                Updating...
              </>
            ) : (
              <>
                <FiCheckCircle className='h-3.5 w-3.5' /> Update Status
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
