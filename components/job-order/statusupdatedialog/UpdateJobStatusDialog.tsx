// components/job-order/statusupdatedialog/UpdateJobStatusDialog.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import Select, { SingleValue } from "react-select";

type JobMaster = {
  jobId: number;
  jobNumber: string;
  status: string;
  remarks?: string;
  operationType?: string;
  operationMode?: string;
};

type StatusMeta = {
  dot: string;
  badge: string;
  icon?: JSX.Element;
};

type StatusOption = {
  value: string;
  label: string;
  meta: StatusMeta;
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

const getStatusMeta = (status: string): StatusMeta => {
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
    s.includes("COMPLETE")
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

// Map a Tailwind bg-* class name to a hex color for inline use in react-select
const dotClassToHex = (cls: string): string => {
  switch (cls) {
    case "bg-red-500":
      return "#ef4444";
    case "bg-green-500":
      return "#22c55e";
    case "bg-blue-500":
      return "#3b82f6";
    case "bg-yellow-500":
      return "#eab308";
    default:
      return "#9ca3af"; // gray-400
  }
};

export function UpdateJobStatusDialog({
  open,
  job,
  onClose,
  onSuccess,
  apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "",
}: UpdateJobStatusDialogProps) {
  const { toast } = useToast();
  const [rawStatusOptions, setRawStatusOptions] = useState<
    { key: string; label: string }[]
  >([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [jobRemarks, setJobRemarks] = useState("");
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-compute react-select options with meta attached so formatOptionLabel
  // doesn't have to re-run getStatusMeta on every render.
  const statusOptions: StatusOption[] = useMemo(
    () =>
      rawStatusOptions.map((opt) => ({
        value: opt.key,
        label: opt.label,
        meta: getStatusMeta(opt.key),
      })),
    [rawStatusOptions],
  );

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
          setRawStatusOptions(options);
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

  // Controlled value for react-select (find pattern, fall back to null)
  const selectedOption =
    statusOptions.find((o) => o.value === selectedStatus) ?? null;

  // Render a single option (with colored dot)
  const formatOptionLabel = (option: StatusOption) => (
    <div className='flex items-start gap-2'>
      <span
        className='inline-block w-2 h-2 rounded-full flex-shrink-0 mt-1'
        style={{ backgroundColor: dotClassToHex(option.meta.dot) }}
      />
      <span className='text-xs leading-snug whitespace-normal'>
        {option.label}
      </span>
    </div>
  );

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

            <Select<StatusOption, false>
              value={selectedOption}
              onChange={(opt: SingleValue<StatusOption>) =>
                setSelectedStatus(opt?.value ?? "")
              }
              options={statusOptions}
              isLoading={isLoadingStatuses}
              isDisabled={isSubmitting}
              isClearable
              isSearchable
              placeholder='Select new stage...'
              formatOptionLabel={formatOptionLabel}
              noOptionsMessage={() => "No statuses available"}
              loadingMessage={() => "Loading statuses..."}
              // Portal the menu so it escapes the Dialog's stacking context
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition='fixed'
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 40,
                  fontSize: 14,
                  borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                  boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
                  "&:hover": {
                    borderColor: "#3b82f6",
                  },
                }),
                valueContainer: (base) => ({
                  ...base,
                  padding: "2px 8px",
                }),
                input: (base) => ({
                  ...base,
                  margin: 0,
                  padding: 0,
                }),
                option: (base, state) => ({
                  ...base,
                  fontSize: 12,
                  padding: "8px 12px",
                  backgroundColor: state.isSelected
                    ? "#dbeafe"
                    : state.isFocused
                      ? "#eff6ff"
                      : "white",
                  color: "#111827",
                  cursor: "pointer",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  maxHeight: 320,
                }),
                menuList: (base) => ({
                  ...base,
                  maxHeight: 320,
                }),
              }}
            />

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
