"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
  FiSearch,
  FiDollarSign,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InternalFundRequestFormProps = {
  type: "add" | "edit";
  defaultState?: any;
  handleAddEdit: (data: any) => void;
};

type LineItem = {
  id: string;
  jobId: number | null;
  jobNumber: string;
  headCoaId: number | null;
  headOfAccount: string;
  beneficiaryCoaId: number | null;
  beneficiary: string;
  partiesAccount: string;
  requestedAmount: number;
  approvalStatus: string;
};

type Job = {
  jobId: number;
  jobNumber: string;
  operationType: string;
  status: string;
};

type ChargesMaster = {
  chargeId: number;
  chargeCode: string;
  chargeName: string;
};

type Party = {
  partyId: number;
  partyCode: string;
  partyName: string;
  benificiaryFromPO?: string;
};

type User = {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  designation?: string;
  departmentId?: number;
};

export default function InternalFundRequestForm({
  type,
  defaultState,
  handleAddEdit,
}: InternalFundRequestFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      jobId: null,
      jobNumber: "",
      headCoaId: null,
      headOfAccount: "",
      beneficiaryCoaId: null,
      beneficiary: "",
      partiesAccount: "",
      requestedAmount: 0,
      approvalStatus: "PENDING",
    },
  ]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [chargesMasters, setChargesMasters] = useState<ChargesMaster[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filteredCharges, setFilteredCharges] = useState<ChargesMaster[]>([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<Party[]>(
    [],
  );

  const [jobSearch, setJobSearch] = useState("");
  const [chargeSearch, setChargeSearch] = useState("");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [requestorSearch, setRequestorSearch] = useState("");
  const [selectedRequestor, setSelectedRequestor] = useState<number | null>(
    null,
  );
  const [requestorName, setRequestorName] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Refs for inputs and selects
  const amountInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Get userId from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
      console.log("UserId from localStorage:", parseInt(storedUserId, 10));
    } else {
      console.warn("No userId found in localStorage");
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Job/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "JobId, JobNumber, OperationType, Status",
            where: "",
            sortOn: "JobId DESC",
            page: "1",
            pageSize: "100",
          }),
        });

        if (response.ok) {
          const jobData = await response.json();
          setJobs(jobData);
          setFilteredJobs(jobData);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load jobs",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchChargesMasters = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}ChargesMaster/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "ChargeId, ChargeCode, ChargeName",
            where: "",
            sortOn: "ChargeCode ASC",
            page: "1",
            pageSize: "200",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setChargesMasters(data);
          setFilteredCharges(data);
        }
      } catch (error) {
        console.error("Error fetching charges:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load expense heads",
        });
      }
    };

    const fetchParties = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Party/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "PartyId, PartyCode, PartyName, BenificiaryNameOfPO",
            where: "",
            sortOn: "PartyName ASC",
            page: "1",
            pageSize: "500",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setParties(data);
          setFilteredBeneficiaries(data);
        }
      } catch (error) {
        console.error("Error fetching parties:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load parties",
        });
      }
    };

    const fetchUsers = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}User/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "UserId, Username, FullName, Email, Designation, DepartmentId",
            where: "",
            sortOn: "FullName ASC",
            page: "1",
            pageSize: "500",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          console.log("Loaded users:", data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users",
        });
      }
    };

    fetchJobs();
    fetchChargesMasters();
    fetchParties();
    fetchUsers();
  }, [toast]);

  // Filter jobs based on search
  useEffect(() => {
    if (jobSearch.trim() === "") {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(
        (job) =>
          job.jobNumber.toLowerCase().includes(jobSearch.toLowerCase()) ||
          job.operationType.toLowerCase().includes(jobSearch.toLowerCase()),
      );
      setFilteredJobs(filtered);
    }
  }, [jobSearch, jobs]);

  // Filter charges based on search
  useEffect(() => {
    if (chargeSearch.trim() === "") {
      setFilteredCharges(chargesMasters);
    } else {
      const filtered = chargesMasters.filter(
        (charge) =>
          charge.chargeCode
            .toLowerCase()
            .includes(chargeSearch.toLowerCase()) ||
          charge.chargeName.toLowerCase().includes(chargeSearch.toLowerCase()),
      );
      setFilteredCharges(filtered);
    }
  }, [chargeSearch, chargesMasters]);

  // Filter beneficiaries based on search
  useEffect(() => {
    if (beneficiarySearch.trim() === "") {
      setFilteredBeneficiaries(parties);
    } else {
      const filtered = parties.filter(
        (party) =>
          party.partyName
            .toLowerCase()
            .includes(beneficiarySearch.toLowerCase()) ||
          party.partyCode
            .toLowerCase()
            .includes(beneficiarySearch.toLowerCase()) ||
          (party.benificiaryFromPO || "")
            .toLowerCase()
            .includes(beneficiarySearch.toLowerCase()),
      );
      setFilteredBeneficiaries(filtered);
    }
  }, [beneficiarySearch, parties]);

  // Separate filtered list for requestors (from users)
  const filteredRequestors =
    requestorSearch.trim() === ""
      ? users
      : users.filter(
          (user) =>
            user.fullName
              .toLowerCase()
              .includes(requestorSearch.toLowerCase()) ||
            user.username
              .toLowerCase()
              .includes(requestorSearch.toLowerCase()) ||
            (user.email || "")
              .toLowerCase()
              .includes(requestorSearch.toLowerCase()) ||
            (user.designation || "")
              .toLowerCase()
              .includes(requestorSearch.toLowerCase()),
        );

  const addLineItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      jobId: null,
      jobNumber: "",
      headCoaId: null,
      headOfAccount: "",
      beneficiaryCoaId: null,
      beneficiary: "",
      partiesAccount: "",
      requestedAmount: 0,
      approvalStatus: "PENDING",
    };
    setLineItems([...lineItems, newItem]);

    // Focus on the new row's amount input
    setTimeout(() => {
      const newIndex = lineItems.length;
      amountInputRefs.current[newIndex]?.focus();
    }, 100);
  };

  const removeLineItem = (id: string, index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
      // Focus on previous row's amount input
      if (index > 0) {
        setTimeout(() => {
          amountInputRefs.current[index - 1]?.focus();
        }, 100);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one line item is required",
      });
    }
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    console.log(`📝 updateLineItem called:`, { id, field, value });

    setLineItems((prevItems) => {
      const newItems = prevItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      );

      console.log("Updated line items:", newItems);
      return newItems;
    });
  };

  const handleJobChange = async (id: string, jobId: string) => {
    console.log("=== handleJobChange START ===");
    console.log("Line item id:", id);
    console.log("Selected jobId (as string):", jobId);
    console.log("Available jobs:", jobs);

    const selectedJob = jobs.find((j) => j.jobId.toString() === jobId);
    console.log("Found job:", selectedJob);

    if (selectedJob) {
      console.log("Updating line item with:", {
        jobId: selectedJob.jobId,
        jobNumber: selectedJob.jobNumber,
      });

      updateLineItem(id, "jobId", selectedJob.jobId);
      updateLineItem(id, "jobNumber", selectedJob.jobNumber);

      console.log("Update complete");
    } else {
      console.error("❌ Job not found for ID:", jobId);
    }
    console.log("=== handleJobChange END ===");
  };

  const handleHeadOfAccountChange = (id: string, chargeId: string) => {
    console.log("handleHeadOfAccountChange called with:", { id, chargeId });
    const selectedCharge = chargesMasters.find(
      (c) => c.chargeId.toString() === chargeId,
    );
    console.log("Found charge:", selectedCharge);

    if (selectedCharge) {
      updateLineItem(id, "headCoaId", selectedCharge.chargeId);
      updateLineItem(
        id,
        "headOfAccount",
        selectedCharge.chargeName || selectedCharge.chargeCode,
      );
      console.log(
        `Updated charge: ID=${selectedCharge.chargeId}, Name=${selectedCharge.chargeName}`,
      );
    }
  };

  const handleBeneficiaryChange = (id: string, partyId: string) => {
    console.log("handleBeneficiaryChange called with:", { id, partyId });
    const selectedParty = parties.find((p) => p.partyId.toString() === partyId);
    console.log("Found party:", selectedParty);

    if (selectedParty) {
      updateLineItem(id, "beneficiaryCoaId", selectedParty.partyId);
      updateLineItem(
        id,
        "beneficiary",
        selectedParty.benificiaryFromPO ||
          selectedParty.partyName ||
          selectedParty.partyCode,
      );
      // Also set parties account from the same party
      updateLineItem(
        id,
        "partiesAccount",
        selectedParty.partyName || selectedParty.partyCode,
      );
      console.log(
        `Updated party: ID=${selectedParty.partyId}, Name=${selectedParty.partyName}`,
      );
    }
  };

  const handleRequestorChange = (userId: string) => {
    console.log("handleRequestorChange called with:", userId);
    const selectedUser = users.find((u) => u.userId.toString() === userId);
    console.log("Found user:", selectedUser);

    if (selectedUser) {
      setSelectedRequestor(selectedUser.userId);
      setRequestorName(selectedUser.fullName || selectedUser.username);
      console.log(
        `Selected requestor: ID=${selectedUser.userId}, Name=${selectedUser.fullName}`,
      );
    }
  };

  // Handle keyboard navigation for amount input
  const handleAmountKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === lineItems.length - 1) {
        addLineItem();
      } else {
        amountInputRefs.current[index + 1]?.focus();
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index === lineItems.length - 1) {
        addLineItem();
      } else {
        amountInputRefs.current[index + 1]?.focus();
      }
    }

    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      amountInputRefs.current[index - 1]?.focus();
    }

    // Ctrl+Enter to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Check requestor
    if (!selectedRequestor) {
      errors.push("User (Requestor) is required");
    }

    // Check userId
    if (!userId) {
      errors.push("User ID not found. Please log in again.");
    }

    lineItems.forEach((item, index) => {
      console.log(`Validating line ${index + 1}:`, {
        jobId: item.jobId,
        jobNumber: item.jobNumber,
        headCoaId: item.headCoaId,
        headOfAccount: item.headOfAccount,
        beneficiaryCoaId: item.beneficiaryCoaId,
        beneficiary: item.beneficiary,
        amount: item.requestedAmount,
      });

      if (!item.jobId) {
        errors.push(`Line ${index + 1}: Job number is required`);
      }
      if (!item.headCoaId) {
        errors.push(`Line ${index + 1}: Head of account is required`);
      }
      if (!item.beneficiaryCoaId) {
        errors.push(`Line ${index + 1}: Beneficiary is required`);
      }
      if (!item.requestedAmount || item.requestedAmount <= 0) {
        errors.push(`Line ${index + 1}: Valid amount is required`);
      }
    });

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          errors.slice(0, 3).join(", ") + (errors.length > 3 ? "..." : ""),
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Current line items before submission:", lineItems);

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      console.log("API Base URL:", baseUrl);
      console.log("Line items to submit:", lineItems);

      // Submit each line item
      const promises = lineItems.map(async (item) => {
        const payload = {
          jobId: item.jobId,
          headCoaId: item.headCoaId,
          beneficiaryCoaId: item.beneficiaryCoaId,
          headOfAccount: item.headOfAccount,
          beneficiary: item.beneficiary,
          partiesAccount: item.partiesAccount,
          requestedAmount: item.requestedAmount,
          approvalStatus: item.approvalStatus,
          requestedTo: selectedRequestor, // Add requestor
          createdBy: userId, // Add userId from localStorage
          createdOn: new Date().toISOString(),
          version: 0,
        };

        console.log("Submitting payload:", payload);

        if (type === "edit" && defaultState?.internalFundsRequestCashId) {
          const response = await fetch(`${baseUrl}InternalCashFundsRequest`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              internalFundsRequestCashId:
                defaultState.internalFundsRequestCashId,
              version: defaultState.version,
            }),
          });

          console.log("Update response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Update error:", errorText);
            throw new Error(
              `Failed to update fund request: ${response.status}`,
            );
          }

          return await response.json();
        } else {
          const response = await fetch(`${baseUrl}InternalCashFundsRequest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          console.log("Create response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Create error:", errorText);
            throw new Error(
              `Failed to create fund request: ${response.status}`,
            );
          }

          return await response.json();
        }
      });

      const results = await Promise.all(promises);
      console.log("Submission results:", results);

      toast({
        title: "Success",
        description: `Fund request${lineItems.length > 1 ? "s" : ""} ${type === "edit" ? "updated" : "created"} successfully`,
      });

      handleAddEdit(lineItems);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${type === "edit" ? "update" : "create"} fund request: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-populate form for edit mode
  useEffect(() => {
    if (type === "edit" && defaultState) {
      setLineItems([
        {
          id: crypto.randomUUID(),
          jobId: defaultState.jobId || null,
          jobNumber: defaultState.jobNumber || "",
          headCoaId: defaultState.headCoaId || null,
          headOfAccount: defaultState.headOfAccount || "",
          beneficiaryCoaId: defaultState.beneficiaryCoaId || null,
          beneficiary: defaultState.beneficiary || "",
          partiesAccount: defaultState.partiesAccount || "",
          requestedAmount: defaultState.requestedAmount || 0,
          approvalStatus: defaultState.approvalStatus || "PENDING",
        },
      ]);

      // Set requestor if available
      if (defaultState.requestedTo) {
        setSelectedRequestor(defaultState.requestedTo);
        // Find and set the requestor name from users
        const requestor = users.find(
          (u) => u.userId === defaultState.requestedTo,
        );
        if (requestor) {
          setRequestorName(requestor.fullName || requestor.username);
        }
      }
    }
  }, [type, defaultState, users]);

  // Handle Ctrl+Enter globally
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const submitButton = document.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown as any);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown as any);
    };
  }, []);

  // Calculate totals
  const totals = {
    lineItems: lineItems.length,
    totalAmount: lineItems.reduce(
      (sum, item) => sum + (item.requestedAmount || 0),
      0,
    ),
    pendingItems: lineItems.filter((item) => item.approvalStatus === "PENDING")
      .length,
    approvedItems: lineItems.filter(
      (item) => item.approvalStatus === "APPROVED",
    ).length,
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* Add global styles for better dropdown visibility */}
      <style jsx global>{`
        /* Better scrollbar styling */
        .fund-request-table-wrapper::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .fund-request-table-wrapper::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 7px;
          border: 1px solid #d1d5db;
        }
        .fund-request-table-wrapper::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 7px;
          border: 2px solid #e5e7eb;
        }
        .fund-request-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
        .fund-request-table-wrapper::-webkit-scrollbar-corner {
          background: #e5e7eb;
        }
        .fund-request-table-wrapper {
          scrollbar-width: auto;
          scrollbar-color: #6b7280 #e5e7eb;
        }
      `}</style>

      {/* Header Card */}
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg'>
              {type === "edit"
                ? "Edit Internal Fund Request"
                : "New Internal Fund Request"}
            </CardTitle>
            <Badge variant='outline' className='bg-white'>
              {lineItems.length} Line Item(s)
            </Badge>
          </div>
          <CardDescription className='pt-2'>
            Fill in the details for the fund request. You can add multiple line
            items for different expense heads.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-4'>
          {/* Info Banner */}
          <div className='bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-blue-900 mb-1'>
                  Internal Fund Request Guidelines
                </h3>
                <p className='text-sm text-blue-700'>
                  • Press{" "}
                  <kbd className='px-1 py-0.5 bg-gray-100 border rounded text-xs'>
                    Tab
                  </kbd>{" "}
                  to move between fields
                  <br />• In Amount field: Press{" "}
                  <kbd className='px-1 py-0.5 bg-gray-100 border rounded text-xs'>
                    Enter
                  </kbd>{" "}
                  to go to next row
                  <br />• Press{" "}
                  <kbd className='px-1 py-0.5 bg-gray-100 border rounded text-xs'>
                    Ctrl+Enter
                  </kbd>{" "}
                  to submit form
                  <br />• Dropdowns are searchable - start typing to filter
                  options
                  <br />• Beneficiary selection will auto-fill Parties A/C
                </p>
              </div>
            </div>
          </div>

          {/* Requestor Selection */}
          <div className='mb-4 p-4 border rounded-lg bg-gray-50'>
            <Label
              htmlFor='requestor'
              className='text-sm font-medium text-gray-700 mb-2 block'
            >
              Request To (User) <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={selectedRequestor?.toString() || ""}
              onValueChange={handleRequestorChange}
            >
              <SelectTrigger className='w-full md:w-96 h-10'>
                <SelectValue placeholder='Select User'>
                  {requestorName || "Select User"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                className='max-h-[300px] w-[400px]'
                position='popper'
                sideOffset={5}
              >
                <div className='sticky top-0 bg-white p-2 border-b z-50'>
                  <div className='relative'>
                    <FiSearch className='absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input
                      placeholder='Search users...'
                      value={requestorSearch}
                      onChange={(e) => setRequestorSearch(e.target.value)}
                      className='pl-8 h-8'
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className='max-h-[250px] overflow-y-auto'>
                  {filteredRequestors.length === 0 ? (
                    <div className='p-4 text-center text-gray-500'>
                      No users found
                    </div>
                  ) : (
                    filteredRequestors.map((user) => (
                      <SelectItem
                        key={user.userId}
                        value={user.userId.toString()}
                      >
                        <div className='flex flex-col'>
                          <span className='font-medium'>{user.fullName}</span>
                          <span className='text-xs text-gray-500'>
                            {user.username}
                            {user.designation && ` - ${user.designation}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
            <p className='text-xs text-gray-600 mt-1'>
              This requestor will be applied to all line items in this request
            </p>
          </div>

          {/* Main Table */}
          <div className='border rounded-lg overflow-hidden shadow-sm'>
            <div
              ref={tableContainerRef}
              className='overflow-x-auto fund-request-table-wrapper'
              style={{ maxHeight: "500px" }}
            >
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='w-[50px] sticky left-0 bg-gray-50 z-20 border-r'>
                      #
                    </TableHead>
                    <TableHead className='min-w-[200px]'>
                      Job No. <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='min-w-[220px]'>
                      Head of Account <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='min-w-[220px]'>
                      Beneficiary <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='min-w-[180px]'>Parties A/C</TableHead>
                    <TableHead className='min-w-[150px]'>
                      Amount <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='min-w-[120px]'>Status</TableHead>
                    <TableHead className='w-[80px] sticky right-0 bg-gray-50 z-20 border-l'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={item.id} className='hover:bg-gray-50 group'>
                      <TableCell className='font-medium sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r'>
                        {index + 1}
                      </TableCell>

                      {/* Job Number */}
                      <TableCell>
                        <Select
                          value={item.jobId?.toString() || ""}
                          onValueChange={(value) => {
                            console.log("Job onValueChange:", value);
                            handleJobChange(item.id, value);
                          }}
                        >
                          <SelectTrigger className='h-9 text-sm'>
                            <SelectValue placeholder='Select Job'>
                              {item.jobNumber || "Select Job"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent
                            className='max-h-[300px] w-[300px]'
                            position='popper'
                            sideOffset={5}
                          >
                            <div className='sticky top-0 bg-white p-2 border-b z-50'>
                              <div className='relative'>
                                <FiSearch className='absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                                <Input
                                  placeholder='Search jobs...'
                                  value={jobSearch}
                                  onChange={(e) => setJobSearch(e.target.value)}
                                  className='pl-8 h-8'
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className='max-h-[250px] overflow-y-auto'>
                              {filteredJobs.length === 0 ? (
                                <div className='p-4 text-center text-gray-500'>
                                  No jobs found
                                </div>
                              ) : (
                                filteredJobs.map((job) => (
                                  <SelectItem
                                    key={job.jobId}
                                    value={job.jobId.toString()}
                                  >
                                    <div className='flex flex-col'>
                                      <span className='font-medium'>
                                        {job.jobNumber}
                                      </span>
                                      <span className='text-xs text-gray-500'>
                                        {job.operationType} - {job.status}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Head of Account */}
                      <TableCell>
                        <Select
                          value={item.headCoaId?.toString() || ""}
                          onValueChange={(value) => {
                            console.log("Charge onValueChange:", value);
                            handleHeadOfAccountChange(item.id, value);
                          }}
                        >
                          <SelectTrigger className='h-9 text-sm'>
                            <SelectValue placeholder='Select Expense Head'>
                              {item.headOfAccount || "Select Expense Head"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent
                            className='max-h-[300px] w-[300px]'
                            position='popper'
                            sideOffset={5}
                          >
                            <div className='sticky top-0 bg-white p-2 border-b z-50'>
                              <div className='relative'>
                                <FiSearch className='absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                                <Input
                                  placeholder='Search expense heads...'
                                  value={chargeSearch}
                                  onChange={(e) =>
                                    setChargeSearch(e.target.value)
                                  }
                                  className='pl-8 h-8'
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className='max-h-[250px] overflow-y-auto'>
                              {filteredCharges.length === 0 ? (
                                <div className='p-4 text-center text-gray-500'>
                                  No expense heads found
                                </div>
                              ) : (
                                filteredCharges.map((charge) => (
                                  <SelectItem
                                    key={charge.chargeId}
                                    value={charge.chargeId.toString()}
                                  >
                                    <div className='flex flex-col'>
                                      <span className='font-medium'>
                                        {charge.chargeCode}
                                      </span>
                                      <span className='text-xs text-gray-500'>
                                        {charge.chargeName}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Beneficiary */}
                      <TableCell>
                        <Select
                          value={item.beneficiaryCoaId?.toString() || ""}
                          onValueChange={(value) => {
                            console.log("Beneficiary onValueChange:", value);
                            handleBeneficiaryChange(item.id, value);
                          }}
                        >
                          <SelectTrigger className='h-9 text-sm'>
                            <SelectValue placeholder='Select Beneficiary'>
                              {item.beneficiary || "Select Beneficiary"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent
                            className='max-h-[300px] w-[300px]'
                            position='popper'
                            sideOffset={5}
                          >
                            <div className='sticky top-0 bg-white p-2 border-b z-50'>
                              <div className='relative'>
                                <FiSearch className='absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                                <Input
                                  placeholder='Search beneficiaries...'
                                  value={beneficiarySearch}
                                  onChange={(e) =>
                                    setBeneficiarySearch(e.target.value)
                                  }
                                  className='pl-8 h-8'
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className='max-h-[250px] overflow-y-auto'>
                              {filteredBeneficiaries.length === 0 ? (
                                <div className='p-4 text-center text-gray-500'>
                                  No beneficiaries found
                                </div>
                              ) : (
                                filteredBeneficiaries.map((party) => (
                                  <SelectItem
                                    key={party.partyId}
                                    value={party.partyId.toString()}
                                  >
                                    <div className='flex flex-col'>
                                      <span className='font-medium'>
                                        {party.partyName}
                                      </span>
                                      <span className='text-xs text-gray-500'>
                                        {party.benificiaryFromPO ||
                                          party.partyCode}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Parties Account (Auto-filled from beneficiary) */}
                      <TableCell>
                        <Input
                          type='text'
                          value={item.partiesAccount}
                          readOnly
                          className='h-9 text-sm bg-gray-50'
                          placeholder='Auto-filled'
                          title='Auto-filled from selected beneficiary'
                        />
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <div className='relative'>
                          <FiDollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                          <Input
                            ref={(el) => {
                              amountInputRefs.current[index] = el;
                            }}
                            type='number'
                            min='0'
                            step='0.01'
                            value={item.requestedAmount || ""}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                "requestedAmount",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            onKeyDown={(e) => handleAmountKeyDown(e, index)}
                            className='h-9 text-sm pl-9'
                            placeholder='0.00'
                          />
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={
                            item.approvalStatus === "APPROVED"
                              ? "default"
                              : item.approvalStatus === "REJECTED"
                                ? "destructive"
                                : "outline"
                          }
                          className='w-full justify-center'
                        >
                          {item.approvalStatus}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className='sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeLineItem(item.id, index)}
                          className='h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity'
                          title='Remove line item (Delete key)'
                          aria-label={`Remove line item ${index + 1}`}
                        >
                          <FiTrash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Add Line Item Button */}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={addLineItem}
            className='flex items-center gap-2 mt-4'
          >
            <FiPlus className='h-4 w-4' />
            Add Line Item
          </Button>

          {/* Summary Card */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='bg-white p-3 rounded border'>
                <p className='text-sm text-gray-600'>Total Line Items</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {totals.lineItems}
                </p>
              </div>
              <div className='bg-white p-3 rounded border'>
                <p className='text-sm text-gray-600'>Total Amount</p>
                <p className='text-2xl font-bold text-green-700'>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(totals.totalAmount)}
                </p>
              </div>
              <div className='bg-white p-3 rounded border'>
                <p className='text-sm text-gray-600'>Pending Items</p>
                <p className='text-2xl font-bold text-amber-600'>
                  {totals.pendingItems}
                </p>
              </div>
              <div className='bg-white p-3 rounded border'>
                <p className='text-sm text-gray-600'>Approved Items</p>
                <p className='text-2xl font-bold text-emerald-600'>
                  {totals.approvedItems}
                </p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className='mt-4 pt-3 border-t border-blue-200'>
              <p className='text-xs text-blue-700 flex items-center gap-2'>
                <Info className='h-3 w-3' />
                Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to submit the form
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => handleAddEdit(null)}
          disabled={isSubmitting}
          className='gap-2'
        >
          <FiX className='h-4 w-4' />
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting || lineItems.length === 0}
          className='bg-blue-600 hover:bg-blue-700 gap-2'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Submitting...
            </>
          ) : (
            <>
              <FiSave className='h-4 w-4' />
              {type === "edit" ? "Update Request" : "Submit Request"}
              <kbd className='ml-2 px-1.5 py-0.5 text-xs bg-blue-800 text-white rounded'>
                Ctrl+Enter
              </kbd>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
