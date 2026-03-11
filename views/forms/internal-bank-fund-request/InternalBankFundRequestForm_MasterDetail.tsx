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

// ─── Types ───────────────────────────────────────────────────────────────────

type InternalBankFundRequestFormProps = {
  type: "add" | "edit";
  defaultState?: any;
  handleAddEdit: (data: any) => void;
};

type LineItem = {
  id: string;
  internalFundsRequestBankId?: number; // existing detail ID for edit mode
  jobId: number | null;
  jobNumber: string;
  headCoaId: number | null;
  headOfAccount: string;
  beneficiaryCoaId: number | null;
  beneficiary: string;
  accountNo: string; // Bank account number — editable
  requestedAmount: number;
};

type Bank = {
  bankId: number;
  bankCode: string;
  bankName: string;
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

// ─── UUID helper ──────────────────────────────────────────────────────────────

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternalBankFundRequestForm({
  type,
  defaultState,
  handleAddEdit,
}: InternalBankFundRequestFormProps) {
  // ── Master level state ────────────────────────────────────────────────────
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("PENDING");

  // ── Detail level state ────────────────────────────────────────────────────
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: generateUUID(),
      jobId: null,
      jobNumber: "",
      headCoaId: null,
      headOfAccount: "",
      beneficiaryCoaId: null,
      beneficiary: "",
      accountNo: "",
      requestedAmount: 0,
    },
  ]);

  // ── Reference data ─────────────────────────────────────────────────────────
  const [banks, setBanks] = useState<Bank[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [chargesMasters, setChargesMasters] = useState<ChargesMaster[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
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

  const amountInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ── userId from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(parseInt(stored, 10));
    else console.warn("No userId found in localStorage");
  }, []);

  // ── Fetch reference data ───────────────────────────────────────────────────
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const fetchBanks = async () => {
      try {
        const res = await fetch(`${baseUrl}Banks/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "BankId, BankCode, BankName",
            where: "",
            sortOn: "BankName ASC",
            page: "1",
            pageSize: "200",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setBanks(data);
          setFilteredBanks(data);
        }
      } catch (e) {
        console.error("Error fetching banks:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load banks",
        });
      }
    };

    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${baseUrl}Job/GetList`, {
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
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
          setFilteredJobs(data);
        }
      } catch (e) {
        console.error("Error fetching jobs:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load jobs",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCharges = async () => {
      try {
        const res = await fetch(`${baseUrl}ChargesMaster/GetList`, {
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
        if (res.ok) {
          const data = await res.json();
          setChargesMasters(data);
          setFilteredCharges(data);
        }
      } catch (e) {
        console.error("Error fetching charges:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load expense heads",
        });
      }
    };

    const fetchParties = async () => {
      try {
        const res = await fetch(`${baseUrl}Party/GetList`, {
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
        if (res.ok) {
          const data = await res.json();
          setParties(data);
          setFilteredBeneficiaries(data);
        }
      } catch (e) {
        console.error("Error fetching parties:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load parties",
        });
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${baseUrl}User/GetList`, {
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
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (e) {
        console.error("Error fetching users:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users",
        });
      }
    };

    fetchBanks();
    fetchJobs();
    fetchCharges();
    fetchParties();
    fetchUsers();
  }, [toast]);

  // ── Search filters ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = bankSearch.toLowerCase();
    setFilteredBanks(
      q
        ? banks.filter(
            (b) =>
              b.bankName.toLowerCase().includes(q) ||
              b.bankCode.toLowerCase().includes(q),
          )
        : banks,
    );
  }, [bankSearch, banks]);

  useEffect(() => {
    const q = jobSearch.toLowerCase();
    setFilteredJobs(
      q
        ? jobs.filter(
            (j) =>
              j.jobNumber.toLowerCase().includes(q) ||
              j.operationType.toLowerCase().includes(q),
          )
        : jobs,
    );
  }, [jobSearch, jobs]);

  useEffect(() => {
    const q = chargeSearch.toLowerCase();
    setFilteredCharges(
      q
        ? chargesMasters.filter(
            (c) =>
              c.chargeCode.toLowerCase().includes(q) ||
              c.chargeName.toLowerCase().includes(q),
          )
        : chargesMasters,
    );
  }, [chargeSearch, chargesMasters]);

  useEffect(() => {
    const q = beneficiarySearch.toLowerCase();
    setFilteredBeneficiaries(
      q
        ? parties.filter(
            (p) =>
              p.partyName.toLowerCase().includes(q) ||
              p.partyCode.toLowerCase().includes(q) ||
              (p.benificiaryFromPO || "").toLowerCase().includes(q),
          )
        : parties,
    );
  }, [beneficiarySearch, parties]);

  const filteredRequestors =
    requestorSearch.trim() === ""
      ? users
      : users.filter(
          (u) =>
            u.fullName.toLowerCase().includes(requestorSearch.toLowerCase()) ||
            u.username.toLowerCase().includes(requestorSearch.toLowerCase()) ||
            (u.email || "")
              .toLowerCase()
              .includes(requestorSearch.toLowerCase()) ||
            (u.designation || "")
              .toLowerCase()
              .includes(requestorSearch.toLowerCase()),
        );

  // ── Line item helpers ──────────────────────────────────────────────────────
  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleLineJobChange = (lineId: string, jobId: string) => {
    const job = jobs.find((j) => j.jobId.toString() === jobId);
    if (job) {
      updateLineItem(lineId, "jobId", job.jobId);
      updateLineItem(lineId, "jobNumber", job.jobNumber);
    }
  };

  const handleHeadOfAccountChange = (id: string, chargeId: string) => {
    const charge = chargesMasters.find(
      (c) => c.chargeId.toString() === chargeId,
    );
    if (charge) {
      updateLineItem(id, "headCoaId", charge.chargeId);
      updateLineItem(
        id,
        "headOfAccount",
        charge.chargeName || charge.chargeCode,
      );
    }
  };

  const handleBeneficiaryChange = (id: string, partyId: string) => {
    const party = parties.find((p) => p.partyId.toString() === partyId);
    if (party) {
      updateLineItem(id, "beneficiaryCoaId", party.partyId);
      updateLineItem(
        id,
        "beneficiary",
        party.benificiaryFromPO || party.partyName || party.partyCode,
      );
    }
  };

  const handleBankChange = (bankId: string) => {
    const bank = banks.find((b) => b.bankId.toString() === bankId);
    if (bank) {
      setSelectedBankId(bank.bankId);
      setBankName(bank.bankName);
    }
  };

  const handleRequestorChange = (uid: string) => {
    const user = users.find((u) => u.userId.toString() === uid);
    if (user) {
      setSelectedRequestor(user.userId);
      setRequestorName(user.fullName || user.username);
    }
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: generateUUID(),
      jobId: null,
      jobNumber: "",
      headCoaId: null,
      headOfAccount: "",
      beneficiaryCoaId: null,
      beneficiary: "",
      accountNo: "",
      requestedAmount: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
    setTimeout(() => {
      amountInputRefs.current[lineItems.length]?.focus();
    }, 100);
  };

  const removeLineItem = (id: string, index: number) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
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

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleAmountKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (index === lineItems.length - 1) addLineItem();
      else amountInputRefs.current[index + 1]?.focus();
    }
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      amountInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // ── Ctrl+Enter global handler ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const btn = document.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;
        if (btn && !btn.disabled) btn.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Pre-populate for edit ──────────────────────────────────────────────────
  useEffect(() => {
    if (type !== "edit" || !defaultState) return;

    console.log("=== EDIT MODE: Loading bank fund request ===", defaultState);

    // Bank
    const bankId = defaultState.bankId || defaultState.BankId;
    if (bankId) {
      setSelectedBankId(bankId);
      const bank = banks.find((b) => b.bankId === bankId);
      if (bank) setBankName(bank.bankName);
      else setBankName(`Bank #${bankId}`);
    }

    // Requestor
    if (defaultState.requestedTo) {
      setSelectedRequestor(defaultState.requestedTo);
      const user = users.find((u) => u.userId === defaultState.requestedTo);
      if (user) setRequestorName(user.fullName || user.username);
    }

    // Approval status
    if (defaultState.approvalStatus)
      setApprovalStatus(defaultState.approvalStatus);

    // Line items
    const details =
      defaultState.internalBankFundsRequests ||
      defaultState.InternalBankFundsRequests ||
      [];

    if (details.length > 0) {
      const mapped: LineItem[] = details.map((d: any) => {
        const detailJobId = d.jobId ?? d.JobId ?? null;
        const job = jobs.find((j) => j.jobId === detailJobId);
        return {
          id: generateUUID(),
          internalFundsRequestBankId:
            d.internalFundsRequestBankId || d.InternalFundsRequestBankId,
          jobId: detailJobId,
          jobNumber: job?.jobNumber || d.jobNumber || d.JobNumber || "",
          headCoaId: d.headCoaId || d.HeadCoaId || null,
          headOfAccount: d.headOfAccount || d.HeadOfAccount || "",
          beneficiaryCoaId: d.beneficiaryCoaId || d.BeneficiaryCoaId || null,
          beneficiary: d.beneficiary || d.Beneficiary || "",
          accountNo: d.accountNo || d.AccountNo || "",
          requestedAmount: d.requestedAmount || d.RequestedAmount || 0,
        };
      });
      setLineItems(mapped);
    } else {
      console.warn("⚠️ No detail records found in defaultState");
    }
  }, [type, defaultState, users, jobs, banks]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!selectedBankId) errors.push("Bank is required");
    if (!selectedRequestor) errors.push("Requested To (User) is required");
    if (!userId) errors.push("User ID not found. Please log in again.");

    lineItems.forEach((item, i) => {
      if (!item.jobId) errors.push(`Line ${i + 1}: Job Number is required`);
      if (!item.headCoaId)
        errors.push(`Line ${i + 1}: Head of Account is required`);
      if (!item.beneficiaryCoaId)
        errors.push(`Line ${i + 1}: Beneficiary is required`);
      if (!item.requestedAmount || item.requestedAmount <= 0)
        errors.push(`Line ${i + 1}: Valid amount is required`);
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const totalRequestedAmount = lineItems.reduce(
      (sum, item) => sum + (item.requestedAmount || 0),
      0,
    );

    try {
      // ── Build detail lines ─────────────────────────────────────────────────
      const buildDetailLine = (item: LineItem): any => {
        const base: any = {
          jobId: item.jobId,
          headCoaId: item.headCoaId,
          beneficiaryCoaId: item.beneficiaryCoaId,
          headOfAccount: item.headOfAccount,
          beneficiary: item.beneficiary,
          accountNo: item.accountNo || "",
          requestedAmount: item.requestedAmount,
          approvedAmount: 0,
          chargesId: item.headCoaId,
          requestedTo: selectedRequestor,
          version: 0,
          createdOn: new Date().toISOString(),
          createdBy: null,
        };

        if (type === "edit" && item.internalFundsRequestBankId) {
          // Existing line
          base.internalFundsRequestBankId = item.internalFundsRequestBankId;
          base.bankFundRequestMasterId = defaultState.bankFundRequestId;
          const orig = defaultState?.internalBankFundsRequests?.find(
            (d: any) =>
              (d.internalFundsRequestBankId || d.InternalFundsRequestBankId) ===
              item.internalFundsRequestBankId,
          );
          base.createdOn = orig?.createdOn || orig?.CreatedOn || base.createdOn;
        } else if (type === "edit") {
          // New line added during edit
          base.bankFundRequestMasterId = defaultState.bankFundRequestId;
        }

        return base;
      };

      // ── Build master payload ───────────────────────────────────────────────
      const payload: any = {
        bankId: selectedBankId,
        bank: null, // ← required by API validator
        totalRequestedAmount,
        totalApprovedAmount:
          type === "edit" ? defaultState?.totalApprovedAmount || 0 : 0,
        approvalStatus: approvalStatus,
        approvedBy: type === "edit" ? defaultState?.approvedBy || null : null,
        approvedOn: type === "edit" ? defaultState?.approvedOn || null : null,
        requestedTo: selectedRequestor,
        requestedToNavigation: null, // ← also add for safety
        createdOn:
          type === "edit" ? defaultState?.createdOn : new Date().toISOString(),
        version: type === "edit" ? defaultState?.version || 0 : 0,
        internalBankFundsRequests: lineItems.map(buildDetailLine),
      };

      if (type === "edit" && defaultState?.bankFundRequestId) {
        payload.bankFundRequestId = defaultState.bankFundRequestId;
      }

      // ── PUT: add navigation null fields ───────────────────────────────────
      let finalPayload = payload;
      if (type === "edit") {
        finalPayload = {
          ...payload,
          requestedToNavigation: null,
          createdAt: "0001-01-01T00:00:00",
          updatedAt: "0001-01-01T00:00:00",
          createLog: null,
          updateLog: null,
          internalBankFundsRequests: payload.internalBankFundsRequests.map(
            (d: any) => ({
              ...d,
              beneficiaryCoa: null,
              charges: null,
              headCoa: null,
              createdAt: "0001-01-01T00:00:00",
              updatedAt: "0001-01-01T00:00:00",
              createLog: null,
              updateLog: null,
            }),
          ),
        };
      }

      const method = type === "edit" ? "PUT" : "POST";
      const endpoint = `${baseUrl}InternalBankFundsRequest`;

      console.log(`📡 ${method} ${endpoint}`);
      console.log("📦 PAYLOAD:", JSON.stringify(finalPayload, null, 2));

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ SUCCESS:", result);

      toast({
        title: "Success",
        description: `Bank fund request ${type === "edit" ? "updated" : "created"} with ${lineItems.length} line item(s). Total: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(totalRequestedAmount)}`,
      });

      handleAddEdit(result);
    } catch (error) {
      console.error("💥 Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${type === "edit" ? "update" : "create"} bank fund request: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totals = {
    lineItems: lineItems.length,
    totalAmount: lineItems.reduce((s, i) => s + (i.requestedAmount || 0), 0),
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <style jsx global>{`
        .bank-fund-table-wrapper::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .bank-fund-table-wrapper::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 7px;
          border: 1px solid #d1d5db;
        }
        .bank-fund-table-wrapper::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 7px;
          border: 2px solid #e5e7eb;
        }
        .bank-fund-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
        .bank-fund-table-wrapper::-webkit-scrollbar-corner {
          background: #e5e7eb;
        }
        .bank-fund-table-wrapper {
          scrollbar-width: auto;
          scrollbar-color: #6b7280 #e5e7eb;
        }
      `}</style>

      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg'>
              {type === "edit"
                ? "Edit Internal Bank Fund Request"
                : "New Internal Bank Fund Request"}
            </CardTitle>
            <Badge variant='outline' className='bg-white'>
              {lineItems.length} Line Item(s)
            </Badge>
          </div>
          <CardDescription className='pt-2'>
            Select a bank and fill in the line item details. Each line item can
            have its own job number.
          </CardDescription>
        </CardHeader>

        <CardContent className='p-4'>
          {/* Info Banner */}
          <div className='bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-blue-900 mb-1'>
                  Internal Fund Request (Bank)
                </h3>
                <p className='text-sm text-blue-700'>
                  • Select the bank at the master level
                  <br />• Each line item can have its own job number and account
                  number
                  <br />• Press{" "}
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
                </p>
              </div>
            </div>
          </div>

          {/* ── MASTER FIELDS ──────────────────────────────────────────────── */}
          <div className='mb-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50'>
            <h3 className='text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2'>
              <Badge variant='default' className='bg-blue-600'>
                Master
              </Badge>
              Request Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Bank */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Bank <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={selectedBankId?.toString() || ""}
                  onValueChange={handleBankChange}
                >
                  <SelectTrigger className='w-full h-10'>
                    <SelectValue placeholder='Select Bank'>
                      {bankName || "Select Bank"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className='max-h-[300px] w-[400px]'
                    position='popper'
                    sideOffset={5}
                  >
                    <div className='sticky top-0 bg-white p-2 border-b z-50'>
                      <div className='relative'>
                        <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                        <Input
                          placeholder='Search banks...'
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          className='pl-8 h-8'
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className='max-h-[250px] overflow-y-auto'>
                      {filteredBanks.length === 0 ? (
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
                              <span className='font-medium'>
                                {bank.bankName}
                              </span>
                              <span className='text-xs text-gray-500'>
                                {bank.bankCode}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* Requested To */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Request To (User) <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={selectedRequestor?.toString() || ""}
                  onValueChange={handleRequestorChange}
                >
                  <SelectTrigger className='w-full h-10'>
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
                        <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
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
                              <span className='font-medium'>
                                {user.fullName}
                              </span>
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
              </div>
            </div>
          </div>

          {/* ── DETAIL TABLE ───────────────────────────────────────────────── */}
          <div className='mb-4'>
            <h3 className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <Badge variant='outline' className='bg-gray-100'>
                Details
              </Badge>
              Line Items (Expense Breakdown)
            </h3>

            <div className='border rounded-lg overflow-hidden shadow-sm'>
              <div
                ref={tableContainerRef}
                className='overflow-x-auto bank-fund-table-wrapper'
                style={{ maxHeight: "500px" }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-[50px] sticky left-0 bg-gray-50 z-20 border-r'>
                        #
                      </TableHead>
                      <TableHead className='min-w-[200px]'>
                        Job Number <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[220px]'>
                        Head of Account <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[220px]'>
                        Beneficiary <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[180px]'>
                        Account No
                      </TableHead>
                      <TableHead className='min-w-[150px]'>
                        Amount <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='w-[80px] sticky right-0 bg-gray-50 z-20 border-l'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className='hover:bg-gray-50 group'
                      >
                        {/* # */}
                        <TableCell className='font-medium sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r'>
                          {index + 1}
                        </TableCell>

                        {/* Job Number */}
                        <TableCell>
                          <Select
                            value={item.jobId?.toString() || ""}
                            onValueChange={(v) =>
                              handleLineJobChange(item.id, v)
                            }
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
                                  <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                                  <Input
                                    placeholder='Search jobs...'
                                    value={jobSearch}
                                    onChange={(e) =>
                                      setJobSearch(e.target.value)
                                    }
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
                            onValueChange={(v) =>
                              handleHeadOfAccountChange(item.id, v)
                            }
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
                                  <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
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
                            onValueChange={(v) =>
                              handleBeneficiaryChange(item.id, v)
                            }
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
                                  <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
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

                        {/* Account No — editable text field */}
                        <TableCell>
                          <Input
                            type='text'
                            value={item.accountNo}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                "accountNo",
                                e.target.value,
                              )
                            }
                            className='h-9 text-sm'
                            placeholder='Enter account no.'
                          />
                        </TableCell>

                        {/* Amount */}
                        <TableCell>
                          <div className='relative'>
                            <FiDollarSign className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
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

                        {/* Delete */}
                        <TableCell className='sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeLineItem(item.id, index)}
                            className='h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity'
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

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addLineItem}
              className='flex items-center gap-2 mt-3'
            >
              <FiPlus className='h-4 w-4' />
              Add Line Item
            </Button>
          </div>

          {/* Summary */}
          <div className='bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-sm text-gray-600'>Total Line Items</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {totals.lineItems}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-sm text-gray-600'>Total Amount</p>
                <p className='text-2xl font-bold text-green-700'>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(totals.totalAmount)}
                </p>
              </div>
            </div>
            <div className='mt-4 pt-3 border-t border-blue-200'>
              <p className='text-xs text-blue-700 flex items-center gap-2'>
                <Info className='h-3 w-3' />
                Each line item has its own job number and account number • Press
                Ctrl+Enter to submit
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
