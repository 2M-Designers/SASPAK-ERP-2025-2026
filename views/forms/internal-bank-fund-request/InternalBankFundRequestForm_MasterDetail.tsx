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
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiLock,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type InternalBankFundRequestFormProps = {
  type: "add" | "edit";
  defaultState?: any;
  handleAddEdit: (data: any) => void;
};

type SubRequestStatus = string;

type LineItem = {
  id: string;
  internalFundsRequestBankId?: number;
  jobId: number | null;
  jobNumber: string;
  jobOperationType: string;
  customerName: string;
  headCoaId: number | null;
  headOfAccount: string;
  beneficiaryCoaId: number | null;
  beneficiary: string;
  accountNo: string;
  onAccountOfId: number | null;
  onAccountOfName: string;
  requestedAmount: number;
  requestedTo: number | null;
  subRequestStatus: SubRequestStatus;
  remarks: string;
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

type JobDetail = {
  jobId?: number;
  jobNumber?: string;
  operationType?: string;
  consigneePartyId?: number;
  shipperPartyId?: number;
  consigneeParty?: {
    partyId: number;
    partyName: string;
    benificiaryNameOfPo?: string;
  };
  shipperParty?: {
    partyId: number;
    partyName: string;
    benificiaryNameOfPo?: string;
  };
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

type StatusOption = { key: string; label: string };

// ─── UUID ─────────────────────────────────────────────────────────────────────

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ─── Master status derivation ─────────────────────────────────────────────────

const deriveMasterStatus = (
  items: LineItem[],
  pendingValue: string,
): string => {
  if (items.length === 0) return pendingValue;
  const statuses = items.map((i) => i.subRequestStatus);
  const first = statuses[0];
  if (statuses.every((s) => s === first)) return first;
  return pendingValue;
};

// ─── SASPAK company constant ──────────────────────────────────────────────────

const COMPANY_PARTY: Party = {
  partyId: -1,
  partyCode: "SASPAK",
  partyName: "SASPAK Cargo (Company)",
  benificiaryFromPO: "SASPAK Cargo",
};

// ─── Extract customer name from job detail ────────────────────────────────────

const extractCustomerName = (
  detail: JobDetail,
  operationType: string,
): string => {
  const opType = (operationType || detail.operationType || "").toLowerCase();
  if (opType.includes("import")) return detail.consigneeParty?.partyName || "";
  if (opType.includes("export")) return detail.shipperParty?.partyName || "";
  return (
    detail.consigneeParty?.partyName || detail.shipperParty?.partyName || ""
  );
};

// ─── Extract consignee/shipper for "On Account Of" ────────────────────────────

const extractLinkedParty = (
  detail: JobDetail,
  operationType: string,
): Party | null => {
  const opType = (operationType || detail.operationType || "").toLowerCase();
  if (opType.includes("import") && detail.consigneeParty) {
    return {
      partyId: detail.consigneeParty.partyId,
      partyCode: "CONSIGNEE",
      partyName: detail.consigneeParty.partyName,
      benificiaryFromPO: detail.consigneeParty.benificiaryNameOfPo,
    };
  }
  if (opType.includes("export") && detail.shipperParty) {
    return {
      partyId: detail.shipperParty.partyId,
      partyCode: "SHIPPER",
      partyName: detail.shipperParty.partyName,
      benificiaryFromPO: detail.shipperParty.benificiaryNameOfPo,
    };
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InternalBankFundRequestForm({
  type,
  defaultState,
  handleAddEdit,
}: InternalBankFundRequestFormProps) {
  // ── Master state ──────────────────────────────────────────────────────────
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [selectedRequestor, setSelectedRequestor] = useState<number | null>(
    null,
  );
  const [requestorName, setRequestorName] = useState("");
  const [requestorSearch, setRequestorSearch] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  // ── Status options from API ───────────────────────────────────────────────
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [pendingStatus, setPendingStatus] = useState("Pending");
  const [approvedStatus, setApprovedStatus] = useState("Approved");
  const [rejectedStatus, setRejectedStatus] = useState("Rejected");

  // ── Detail state ──────────────────────────────────────────────────────────
  const emptyLine = (): LineItem => ({
    id: generateUUID(),
    jobId: null,
    jobNumber: "",
    jobOperationType: "",
    customerName: "",
    headCoaId: null,
    headOfAccount: "",
    beneficiaryCoaId: null,
    beneficiary: "",
    accountNo: "",
    onAccountOfId: null,
    onAccountOfName: "",
    requestedAmount: 0,
    requestedTo: null,
    subRequestStatus: pendingStatus,
    remarks: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);
  const [jobDetailsCache, setJobDetailsCache] = useState<
    Record<number, JobDetail>
  >({});

  // ── Reference data ────────────────────────────────────────────────────────
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

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const amountInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const jobSelectRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const masterApprovalStatus = deriveMasterStatus(lineItems, pendingStatus);

  // Self-approval lock
  const requestCreatorId: number | null =
    type === "edit" ? (defaultState?.createdBy ?? null) : userId;
  const isCreator = userId !== null && userId === requestCreatorId;
  const isRequestedToUser = userId !== null && userId === selectedRequestor;
  const canChangeStatus = isRequestedToUser && !isCreator;
  const isSelfApproval = !canChangeStatus;

  // ── userId ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(parseInt(stored, 10));
    else console.warn("No userId in localStorage");
  }, []);

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
          setStatusOptions(opts);
          const p = opts.find((o) => o.key.toLowerCase() === "pending");
          const a = opts.find((o) => o.key.toLowerCase() === "approved");
          const r = opts.find((o) => o.key.toLowerCase() === "rejected");
          if (p) setPendingStatus(p.key);
          if (a) setApprovedStatus(a.key);
          if (r) setRejectedStatus(r.key);
          if (p) {
            setLineItems((prev) =>
              prev.map((li) =>
                li.subRequestStatus === "Pending" ||
                li.subRequestStatus === "PENDING"
                  ? { ...li, subRequestStatus: p.key }
                  : li,
              ),
            );
          }
        }
      } catch (e) {
        console.error("Status fetch:", e);
      }
    };
    fetchStatuses();
  }, []);

  // ── Fetch reference data ──────────────────────────────────────────────────
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL;

    const fetchBanks = async () => {
      try {
        const res = await fetch(`${base}Banks/GetList`, {
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
          const d = await res.json();
          setBanks(d);
          setFilteredBanks(d);
        }
      } catch (e) {
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
        const res = await fetch(`${base}Job/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "JobId, JobNumber, OperationType, Status",
            where: "",
            sortOn: "JobId DESC",
            page: "1",
            pageSize: "500",
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setJobs(d);
          setFilteredJobs(d);
        }
      } catch (e) {
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
        const res = await fetch(`${base}ChargesMaster/GetList`, {
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
          const d = await res.json();
          setChargesMasters(d);
          setFilteredCharges(d);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const fetchParties = async () => {
      try {
        const res = await fetch(`${base}Party/GetList`, {
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
          const d = await res.json();
          setParties(d);
          setFilteredBeneficiaries(d);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${base}User/GetList`, {
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
        if (res.ok) setUsers(await res.json());
      } catch (e) {
        console.error(e);
      }
    };

    fetchBanks();
    fetchJobs();
    fetchCharges();
    fetchParties();
    fetchUsers();
  }, [toast]);

  // ── Fetch job detail ──────────────────────────────────────────────────────
  const fetchJobDetail = async (jobId: number): Promise<JobDetail | null> => {
    if (jobDetailsCache[jobId]) return jobDetailsCache[jobId];
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${base}Job/${jobId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const detail: JobDetail = await res.json();
        setJobDetailsCache((prev) => ({ ...prev, [jobId]: detail }));
        return detail;
      }
    } catch (e) {
      console.error("Job detail:", e);
    }
    return null;
  };

  // ── On Account Of parties ─────────────────────────────────────────────────
  const getOnAccountOfParties = (line: LineItem): Party[] => {
    let list: Party[] = [COMPANY_PARTY];
    if (!line.jobId) {
      list = [COMPANY_PARTY, ...parties];
    } else {
      const detail = jobDetailsCache[line.jobId];
      if (detail) {
        const linked = extractLinkedParty(detail, line.jobOperationType);
        if (linked) list.push(linked);
      }
    }
    if (line.onAccountOfId && line.onAccountOfId > 0) {
      const alreadyIn = list.some((p) => p.partyId === line.onAccountOfId);
      if (!alreadyIn) {
        const fromParties = parties.find(
          (p) => p.partyId === line.onAccountOfId,
        );
        if (fromParties) list.push(fromParties);
        else if (line.onAccountOfName)
          list.push({
            partyId: line.onAccountOfId,
            partyCode: "",
            partyName: line.onAccountOfName,
          });
      }
    }
    return list;
  };

  // ── Search filters ────────────────────────────────────────────────────────
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

  // ── Line item helpers ─────────────────────────────────────────────────────
  const updateLineItem = (id: string, field: string, value: any) =>
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const clearLineJob = (lineId: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              jobId: null,
              jobNumber: "",
              jobOperationType: "",
              customerName: "",
              onAccountOfId: null,
              onAccountOfName: "",
            }
          : item,
      ),
    );
  };

  const handleLineJobChange = async (lineId: string, jobIdStr: string) => {
    const job = jobs.find((j) => j.jobId.toString() === jobIdStr);
    if (!job) return;
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              jobId: job.jobId,
              jobNumber: job.jobNumber,
              jobOperationType: job.operationType,
              customerName: "",
              onAccountOfId: null,
              onAccountOfName: "",
            }
          : item,
      ),
    );
    const detail = await fetchJobDetail(job.jobId);
    if (detail) {
      const customerName = extractCustomerName(detail, job.operationType);
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === lineId
            ? { ...item, customerName, jobOperationType: job.operationType }
            : item,
        ),
      );
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

  const handleOnAccountOfChange = (lineId: string, partyIdStr: string) => {
    if (partyIdStr === "-1") {
      updateLineItem(lineId, "onAccountOfId", -1);
      updateLineItem(lineId, "onAccountOfName", COMPANY_PARTY.partyName);
      return;
    }
    const line = lineItems.find((i) => i.id === lineId)!;
    const pool = getOnAccountOfParties(line);
    const party =
      pool.find((p) => p.partyId.toString() === partyIdStr) ||
      parties.find((p) => p.partyId.toString() === partyIdStr);
    if (party) {
      updateLineItem(lineId, "onAccountOfId", party.partyId);
      updateLineItem(lineId, "onAccountOfName", party.partyName);
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

  // ── Per-line approval ─────────────────────────────────────────────────────
  const setLineStatus = (id: string, status: string) => {
    if (isSelfApproval) return;
    updateLineItem(id, "subRequestStatus", status);
  };

  const approveLineItem = (id: string) => setLineStatus(id, approvedStatus);
  const rejectLineItem = (id: string) => setLineStatus(id, rejectedStatus);
  const pendingLineItem = (id: string) => setLineStatus(id, pendingStatus);

  const approveAllLines = () => {
    if (isSelfApproval) return;
    setLineItems((prev) =>
      prev.map((i) => ({ ...i, subRequestStatus: approvedStatus })),
    );
  };
  const rejectAllLines = () => {
    if (isSelfApproval) return;
    setLineItems((prev) =>
      prev.map((i) => ({ ...i, subRequestStatus: rejectedStatus })),
    );
  };

  // ── Add / Remove ──────────────────────────────────────────────────────────
  const addLineItem = () => {
    const newItem: LineItem = {
      ...emptyLine(),
      requestedTo: selectedRequestor,
      subRequestStatus: pendingStatus,
    };
    setLineItems((prev) => [...prev, newItem]);
    // Focus the Job Number select trigger of the newly added row
    setTimeout(() => {
      jobSelectRefs.current[lineItems.length]?.focus();
    }, 120);
  };

  const removeLineItem = (id: string, index: number) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
      if (index > 0)
        setTimeout(() => {
          amountInputRefs.current[index - 1]?.focus();
        }, 100);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one line item is required",
      });
    }
  };

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  const handleAmountKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (index === lineItems.length - 1) {
        addLineItem(); // focuses the new row's job select
      } else {
        jobSelectRefs.current[index + 1]?.focus();
      }
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

  // ── Pre-populate for edit ─────────────────────────────────────────────────
  useEffect(() => {
    if (type !== "edit" || !defaultState) return;

    const bankId = defaultState.bankId ?? defaultState.BankId;
    if (bankId) {
      setSelectedBankId(bankId);
      const bank = banks.find((b) => b.bankId === bankId);
      setBankName(bank ? bank.bankName : `Bank #${bankId}`);
    }

    if (defaultState.requestedTo) {
      setSelectedRequestor(defaultState.requestedTo);
      const user = users.find((u) => u.userId === defaultState.requestedTo);
      if (user) setRequestorName(user.fullName || user.username);
    }

    const details =
      defaultState.internalBankFundsRequests ||
      defaultState.InternalBankFundsRequests ||
      [];
    if (details.length > 0) {
      const mapped: LineItem[] = details.map((d: any) => {
        const detailJobId = d.jobId ?? d.JobId ?? null;
        const job = jobs.find((j) => j.jobId === detailJobId);
        const savedOnAccountOfId = d.onAccountOfId || d.OnAccountOfId || null;
        const fromParties = savedOnAccountOfId
          ? parties.find((p) => p.partyId === savedOnAccountOfId)
          : null;
        return {
          id: generateUUID(),
          internalFundsRequestBankId:
            d.internalFundsRequestBankId || d.InternalFundsRequestBankId,
          jobId: detailJobId,
          jobNumber: job?.jobNumber || d.jobNumber || d.JobNumber || "",
          jobOperationType: job?.operationType || d.operationType || "",
          customerName: d.customerName || d.CustomerName || "",
          headCoaId: d.headCoaId || d.HeadCoaId || null,
          headOfAccount: d.headOfAccount || d.HeadOfAccount || "",
          beneficiaryCoaId: d.beneficiaryCoaId || d.BeneficiaryCoaId || null,
          beneficiary: d.beneficiary || d.Beneficiary || "",
          accountNo: d.accountNo || d.AccountNo || "",
          onAccountOfId: savedOnAccountOfId,
          onAccountOfName: (() => {
            if (!savedOnAccountOfId) return "";
            if (savedOnAccountOfId === COMPANY_PARTY.partyId)
              return COMPANY_PARTY.partyName;
            return (
              fromParties?.partyName ||
              d.onAccountOfName ||
              d.OnAccountOfName ||
              ""
            );
          })(),
          requestedAmount: d.requestedAmount || d.RequestedAmount || 0,
          requestedTo: d.requestedTo || d.RequestedTo || null,
          subRequestStatus:
            d.subRequestStatus || d.SubRequestStatus || pendingStatus,
          remarks: d.remarks || d.Remarks || "",
        };
      });
      setLineItems(mapped);
      mapped.forEach((m) => {
        if (m.jobId) fetchJobDetail(m.jobId);
      });
    }
  }, [type, defaultState, users, jobs, banks, parties]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!selectedBankId) errors.push("Bank is required");
    if (!selectedRequestor) errors.push("Requested To (User) is required");
    if (!userId) errors.push("User ID not found. Please log in again.");

    lineItems.forEach((item, i) => {
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Session Error",
        description: "User session not found. Please log in again.",
      });
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    const total = lineItems.reduce((s, i) => s + (i.requestedAmount || 0), 0);
    const computedStatus = masterApprovalStatus;

    try {
      const buildDetail = (item: LineItem): any => {
        const d: any = {
          jobId: item.jobId ?? null,
          headCoaId: item.headCoaId,
          beneficiaryCoaId: item.beneficiaryCoaId,
          headOfAccount: item.headOfAccount,
          beneficiary: item.beneficiary,
          accountNo: item.accountNo || "",
          requestedAmount: item.requestedAmount,
          approvedAmount: 0,
          chargesId: item.headCoaId,
          customerName: item.customerName || "",
          requestedTo: item.requestedTo ?? selectedRequestor,
          onAccountOfId:
            item.onAccountOfId && item.onAccountOfId > 0
              ? item.onAccountOfId
              : null,
          // Send "" on create — API rejects any non-empty status when requestedTo
          // differs from requestorUserId, treating it as already processed.
          subRequestStatus: type === "edit" ? item.subRequestStatus : "",
          remarks: item.remarks || "",
          version: 0,
          createdOn: new Date().toISOString(),
        };

        if (type === "edit" && item.internalFundsRequestBankId) {
          d.internalFundsRequestBankId = item.internalFundsRequestBankId;
          d.bankFundRequestMasterId = defaultState.bankFundRequestId;
          const orig = defaultState?.internalBankFundsRequests?.find(
            (x: any) =>
              (x.internalFundsRequestBankId || x.InternalFundsRequestBankId) ===
              item.internalFundsRequestBankId,
          );
          d.createdOn = orig?.createdOn || orig?.CreatedOn || d.createdOn;
        } else if (type === "edit") {
          d.bankFundRequestMasterId = defaultState.bankFundRequestId;
        }

        return d;
      };

      const payload: any = {
        bankId: selectedBankId,
        bank: null,
        totalRequestedAmount: total,
        totalApprovedAmount:
          type === "edit" ? (defaultState?.totalApprovedAmount ?? 0) : 0,
        approvalStatus: computedStatus,
        approvedBy: type === "edit" ? (defaultState?.approvedBy ?? null) : null,
        approvedOn: type === "edit" ? (defaultState?.approvedOn ?? null) : null,
        requestedTo: selectedRequestor,
        requestorUserId: userId,
        createdOn:
          type === "edit" ? defaultState?.createdOn : new Date().toISOString(),
        version: type === "edit" ? (defaultState?.version ?? 0) : 0,
        internalBankFundsRequests: lineItems.map(buildDetail),
      };

      if (type === "edit" && defaultState?.bankFundRequestId)
        payload.bankFundRequestId = defaultState.bankFundRequestId;

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
      const endpoint = `${base}InternalBankFundsRequest`;
      console.log(
        `📡 ${method} ${endpoint}`,
        JSON.stringify(finalPayload, null, 2),
      );

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

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
        description: `Bank fund request ${type === "edit" ? "updated" : "created"} — ${lineItems.length} item(s) | ${computedStatus} | Total: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }).format(total)}`,
      });
      handleAddEdit(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: type === "edit" ? "Update Failed" : "Create Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = {
    lineItems: lineItems.length,
    totalAmount: lineItems.reduce((s, i) => s + (i.requestedAmount || 0), 0),
    approved: lineItems.filter((i) => i.subRequestStatus === approvedStatus)
      .length,
    rejected: lineItems.filter((i) => i.subRequestStatus === rejectedStatus)
      .length,
  };

  const statusColor = (status: string) => {
    if (status === approvedStatus)
      return "bg-green-50 text-green-700 border-green-300";
    if (status === rejectedStatus)
      return "bg-red-50 text-red-700 border-red-300";
    return "bg-yellow-50 text-yellow-700 border-yellow-300";
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-4'
      onKeyDown={(e) => {
        // Only Ctrl+Enter / Cmd+Enter should submit; plain Enter stays in the field
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) e.preventDefault();
      }}
    >
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
            <div className='flex items-center gap-2'>
              {isSelfApproval && (
                <Badge
                  variant='outline'
                  className='bg-orange-50 text-orange-700 border-orange-300 flex items-center gap-1'
                >
                  <FiLock className='h-3 w-3' /> Self-approval locked
                </Badge>
              )}
              <Badge
                variant='outline'
                className={`font-semibold border ${statusColor(masterApprovalStatus)}`}
              >
                {masterApprovalStatus}
              </Badge>
              <Badge variant='outline' className='bg-white'>
                {lineItems.length} Line Item(s)
              </Badge>
            </div>
          </div>
          <CardDescription className='pt-2'>
            Select a bank and fill in the line item details. Job Number is
            optional. Approve or reject each line to auto-update master status.
          </CardDescription>
        </CardHeader>

        <CardContent className='p-4'>
          {/* Self-approval warning */}
          {isSelfApproval && (
            <div className='bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2'>
              <FiLock className='h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0' />
              <p className='text-sm text-orange-800'>
                <strong>Approval locked:</strong>{" "}
                {isCreator && !isRequestedToUser
                  ? "The user who created this request cannot approve it. Only the designated recipient can approve or reject."
                  : isCreator && isRequestedToUser
                    ? "You created this request and are also its recipient. A different authorised user must perform the approval."
                    : "Only the user this request was sent to can approve or reject it."}
              </p>
            </div>
          )}

          {/* Info banner */}
          <div className='bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
              <p className='text-xs text-blue-700'>
                • Select the bank at master level &nbsp;•&nbsp;
                <strong>Job Number is optional</strong> — leave blank for
                admin/vendor expenses &nbsp;•&nbsp; Customer name auto-fills
                from job &nbsp;•&nbsp; "On Account Of" shows consignee (import)
                or shipper (export) + SASPAK Cargo &nbsp;•&nbsp; All ✓ → Master{" "}
                {approvedStatus} · All ✗ → {rejectedStatus} · Mixed →{" "}
                {pendingStatus} &nbsp;•&nbsp;
                <kbd className='px-1 bg-gray-100 border rounded'>
                  Ctrl+Enter
                </kbd>{" "}
                to submit
              </p>
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
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                <Badge variant='outline' className='bg-gray-100'>
                  Details
                </Badge>
                Line Items
              </h3>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={approveAllLines}
                  disabled={isSelfApproval}
                  className='flex items-center gap-1.5 text-green-700 border-green-300 hover:bg-green-50 text-xs disabled:opacity-40'
                >
                  <FiCheckCircle className='h-3.5 w-3.5' /> Approve All
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={rejectAllLines}
                  disabled={isSelfApproval}
                  className='flex items-center gap-1.5 text-red-700 border-red-300 hover:bg-red-50 text-xs disabled:opacity-40'
                >
                  <FiXCircle className='h-3.5 w-3.5' /> Reject All
                </Button>
              </div>
            </div>

            <div className='border rounded-lg overflow-hidden shadow-sm'>
              <div
                ref={tableContainerRef}
                className='overflow-x-auto bank-fund-table-wrapper'
                style={{ maxHeight: "520px" }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-[40px] sticky left-0 bg-gray-50 z-20 border-r'>
                        #
                      </TableHead>
                      <TableHead className='min-w-[180px]'>
                        Job Number
                      </TableHead>
                      <TableHead className='min-w-[155px]'>
                        Customer Name
                      </TableHead>
                      <TableHead className='min-w-[200px]'>
                        Head of Account <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[200px]'>
                        Beneficiary <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[190px]'>
                        On Account Of
                      </TableHead>
                      <TableHead className='min-w-[160px]'>
                        Account No
                      </TableHead>
                      <TableHead className='min-w-[135px]'>
                        Amount (PKR) <span className='text-red-500'>*</span>
                      </TableHead>
                      <TableHead className='min-w-[160px]'>Remarks</TableHead>
                      <TableHead className='min-w-[130px] bg-green-50/60 text-center'>
                        Status
                      </TableHead>
                      <TableHead className='w-[50px] sticky right-0 bg-gray-50 z-20 border-l'>
                        Del
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => {
                      const onAccountParties = getOnAccountOfParties(item);
                      const isApproved =
                        item.subRequestStatus === approvedStatus;
                      const isRejected =
                        item.subRequestStatus === rejectedStatus;

                      const resolvedOnAccountName = (() => {
                        if (!item.onAccountOfId) return "";
                        if (item.onAccountOfId === COMPANY_PARTY.partyId)
                          return COMPANY_PARTY.partyName;
                        return (
                          parties.find((p) => p.partyId === item.onAccountOfId)
                            ?.partyName ||
                          item.onAccountOfName ||
                          ""
                        );
                      })();

                      return (
                        <TableRow
                          key={item.id}
                          className={`group ${isApproved ? "bg-green-50/20" : isRejected ? "bg-red-50/20" : ""}`}
                        >
                          {/* # */}
                          <TableCell className='font-medium sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r text-center text-xs'>
                            {index + 1}
                          </TableCell>

                          {/* Job Number — optional */}
                          <TableCell>
                            <Select
                              value={item.jobId?.toString() || ""}
                              onValueChange={(v) =>
                                handleLineJobChange(item.id, v)
                              }
                            >
                              <SelectTrigger
                                className='h-9 text-sm'
                                data-index={index}
                              >
                                <SelectValue placeholder='Optional'>
                                  {item.jobNumber || "Optional"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent
                                className='max-h-[300px] w-[280px]'
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
                                  {item.jobId && (
                                    <div
                                      className='px-3 py-2 text-xs text-blue-600 cursor-pointer hover:bg-blue-50 border-b flex items-center gap-1'
                                      onClick={() => clearLineJob(item.id)}
                                    >
                                      <FiX className='h-3 w-3' /> Clear
                                      selection
                                    </div>
                                  )}
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

                          {/* Customer Name — read-only */}
                          <TableCell>
                            <Input
                              type='text'
                              value={item.customerName}
                              readOnly
                              className='h-9 text-sm bg-gray-50 text-gray-700'
                              placeholder={
                                item.jobId && !item.customerName
                                  ? "Fetching..."
                                  : "—"
                              }
                            />
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
                                      placeholder='Search heads...'
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

                          {/* On Account Of */}
                          <TableCell>
                            <Select
                              value={item.onAccountOfId?.toString() || ""}
                              onValueChange={(v) =>
                                handleOnAccountOfChange(item.id, v)
                              }
                            >
                              <SelectTrigger className='h-9 text-sm'>
                                <SelectValue placeholder='Select party'>
                                  {resolvedOnAccountName || undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent
                                className='max-h-[300px] w-[280px]'
                                position='popper'
                                sideOffset={5}
                              >
                                <div className='max-h-[280px] overflow-y-auto'>
                                  {onAccountParties.map((party) => (
                                    <SelectItem
                                      key={party.partyId}
                                      value={party.partyId.toString()}
                                    >
                                      <div className='flex flex-col'>
                                        <span className='font-medium'>
                                          {party.partyName}
                                        </span>
                                        <span className='text-xs text-gray-400'>
                                          {party.partyCode}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Account No */}
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

                          {/* Amount PKR */}
                          <TableCell>
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
                                className='h-9 text-sm pl-10'
                                placeholder='0.00'
                              />
                            </div>
                          </TableCell>

                          {/* Remarks */}
                          <TableCell>
                            <Input
                              type='text'
                              value={item.remarks}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "remarks",
                                  e.target.value,
                                )
                              }
                              className='h-9 text-sm'
                              placeholder='Optional remarks...'
                            />
                          </TableCell>

                          {/* Status + Approve / Reject */}
                          <TableCell className='bg-green-50/20'>
                            <div className='flex items-center gap-1 justify-center'>
                              {isSelfApproval ? (
                                <span className='text-xs text-gray-400 flex items-center gap-1'>
                                  <FiLock className='h-3 w-3' /> Locked
                                </span>
                              ) : (
                                <>
                                  <button
                                    type='button'
                                    onClick={() =>
                                      isApproved
                                        ? pendingLineItem(item.id)
                                        : approveLineItem(item.id)
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
                                  <span
                                    className={`text-xs font-semibold px-1 py-0.5 rounded border min-w-[54px] text-center ${statusColor(item.subRequestStatus)}`}
                                  >
                                    {isApproved
                                      ? "✓ Apvd"
                                      : isRejected
                                        ? "✗ Rjct"
                                        : "Pending"}
                                  </span>
                                  <button
                                    type='button'
                                    onClick={() =>
                                      isRejected
                                        ? pendingLineItem(item.id)
                                        : rejectLineItem(item.id)
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
                                </>
                              )}
                            </div>
                          </TableCell>

                          {/* Delete */}
                          <TableCell className='sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => removeLineItem(item.id, index)}
                              className='h-8 w-8 p-0 text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity'
                              aria-label={`Remove line ${index + 1}`}
                            >
                              <FiTrash2 className='h-4 w-4' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
              <FiPlus className='h-4 w-4' /> Add Line Item
            </Button>
          </div>

          {/* Summary */}
          <div className='bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600'>Total Items</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {totals.lineItems}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600'>Total Amount</p>
                <p className='text-lg font-bold text-green-700'>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(totals.totalAmount)}
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600'>
                  {approvedStatus} / {rejectedStatus}
                </p>
                <p className='text-xl font-bold'>
                  <span className='text-green-600'>{totals.approved}</span>
                  <span className='text-gray-400 mx-1'>/</span>
                  <span className='text-red-600'>{totals.rejected}</span>
                </p>
              </div>
              <div className='bg-white p-3 rounded border shadow-sm'>
                <p className='text-xs text-gray-600'>Master Status</p>
                <p
                  className={`text-sm font-bold mt-1 flex items-center gap-1 ${
                    masterApprovalStatus === approvedStatus
                      ? "text-green-700"
                      : masterApprovalStatus === rejectedStatus
                        ? "text-red-700"
                        : "text-yellow-700"
                  }`}
                >
                  {masterApprovalStatus === approvedStatus && <FiCheckCircle />}
                  {masterApprovalStatus === rejectedStatus && <FiXCircle />}
                  {masterApprovalStatus === pendingStatus && <FiClock />}
                  {masterApprovalStatus}
                </p>
              </div>
            </div>
            <div className='mt-3 pt-3 border-t border-blue-200'>
              <p className='text-xs text-blue-700'>
                <Info className='inline h-3 w-3 mr-1' />
                All ✓ → Master {approvedStatus} &nbsp;·&nbsp; All ✗ →{" "}
                {rejectedStatus} &nbsp;·&nbsp; Mixed → {pendingStatus}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => handleAddEdit(null)}
          disabled={isSubmitting}
          className='gap-2'
        >
          <FiX className='h-4 w-4' /> Cancel
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting || lineItems.length === 0}
          className='bg-blue-600 hover:bg-blue-700 gap-2'
        >
          {isSubmitting ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />{" "}
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
