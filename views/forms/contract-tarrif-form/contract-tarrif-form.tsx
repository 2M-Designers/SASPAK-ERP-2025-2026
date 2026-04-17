"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiLoader,
  FiInfo,
} from "react-icons/fi";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormProps = {
  type: "add" | "edit";
  defaultState?: any;
  handleAddEdit: (data: any) => void;
};

type Party = { partyId: number; partyCode: string; partyName: string };
type Branch = { branchId: number; branchCode: string; branchName: string };
type Charge = {
  chargeId: number;
  chargeCode: string;
  chargeName: string;
  chargesNature: string;
};

type ContractBranch = {
  id: string; // local UUID for React key
  contractTarrifBranchesId: number;
  bracnchId: number;
  branchName: string;
  contractTarrifId: number;
};

type ContractDetail = {
  id: string; // local UUID
  contractTarrifDetailId: number;
  contractTarrifId: number;
  chargesId: number | null;
  chargeName: string;
  description: string;
  value: number;
  isValuePercentage: boolean;
  rangeStartDate: string;
  rangeEndDate: string;
  isTaxableValue: boolean;
  isCustomValue: boolean;
  isInvoiceValue: boolean;
  rangeStartAmount: number;
  rangeEndAmount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const toDateInput = (v: any): string => {
  if (!v) return "";
  try {
    return new Date(v).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const toIso = (v: string): string =>
  v ? new Date(v).toISOString() : new Date().toISOString();

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function getBaseUrl(): string {
  const b = process.env.NEXT_PUBLIC_BASE_URL || "";
  return b.endsWith("/") ? b : `${b}/`;
}

const useDebounce = <T,>(val: T, delay: number): T => {
  const [d, setD] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setD(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return d;
};

const emptyDetail = (contractTarrifId = 0): ContractDetail => ({
  id: uid(),
  contractTarrifDetailId: 0,
  contractTarrifId,
  chargesId: null,
  chargeName: "",
  description: "",
  value: 0,
  isValuePercentage: false,
  rangeStartDate: "",
  rangeEndDate: "",
  isTaxableValue: false,
  isCustomValue: false,
  isInvoiceValue: false,
  rangeStartAmount: 0,
  rangeEndAmount: 0,
});

// ─── Flag checkbox group ──────────────────────────────────────────────────────

const FlagCheckbox = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className='flex items-center gap-2 cursor-pointer select-none group'>
    <Checkbox
      checked={checked}
      onCheckedChange={(v) => onChange(!!v)}
      className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
    />
    <span className='text-sm text-gray-700 group-hover:text-gray-900'>
      {label}
    </span>
  </label>
);

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function ContractTarrifForm({
  type,
  defaultState,
  handleAddEdit,
}: FormProps) {
  const { toast } = useToast();

  // ── User ID ─────────────────────────────────────────────────────────────────
  const [userId, setUserId] = useState<number>(0);
  useEffect(() => {
    const s = localStorage.getItem("userId");
    if (s) setUserId(parseInt(s, 10));
  }, []);

  // ── Master fields ───────────────────────────────────────────────────────────
  const [contractTarrifNo, setContractTarrifNo] = useState("");
  const [contractDate, setContractDate] = useState(
    toDateInput(new Date().toISOString()),
  );
  const [contractEffectiveDate, setContractEffectiveDate] = useState(
    toDateInput(new Date().toISOString()),
  );
  const [contractExpiryDate, setContractExpiryDate] = useState("");
  const [partyId, setPartyId] = useState<number | null>(null);
  const [partyName, setPartyName] = useState("");
  const [companyId, setCompanyId] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [isActive, setIsActive] = useState(true);

  // ── Flags ───────────────────────────────────────────────────────────────────
  const [isGdrawMaterial, setIsGdrawMaterial] = useState(false);
  const [isGdfinishedGoods, setIsGdfinishedGoods] = useState(false);
  const [isImport, setIsImport] = useState(false);
  const [isExport, setIsExport] = useState(false);
  const [isSea, setIsSea] = useState(false);
  const [isAir, setIsAir] = useState(false);
  const [isLand, setIsLand] = useState(false);
  const [isFcl, setIsFcl] = useState(false);
  const [isLcl, setIsLcl] = useState(false);
  const [isBreakBulk, setIsBreakBulk] = useState(false);

  // ── Sub-entities ────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState<ContractBranch[]>([]);
  const [details, setDetails] = useState<ContractDetail[]>([emptyDetail()]);

  // ── Reference data ──────────────────────────────────────────────────────────
  const [parties, setParties] = useState<Party[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);

  const [partySearch, setPartySearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  // ✅ FIX 1: per-row charge search — shared state causes cross-row filter bleed
  const [chargeSearches, setChargeSearches] = useState<Record<string, string>>(
    {},
  );

  const getChargeSearch = (rowId: string) => chargeSearches[rowId] ?? "";
  const setChargeSearch = (rowId: string, val: string) =>
    setChargeSearches((prev) => ({ ...prev, [rowId]: val }));

  const dPartySearch = useDebounce(partySearch, 250);
  const dBranchSearch = useDebounce(branchSearch, 250);

  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch reference data ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchParties = async () => {
      setLoadingParties(true);
      try {
        const res = await fetch(`${getBaseUrl()}Party/GetList`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            select: "PartyId, PartyCode, PartyName",
            where: "",
            search: "",
            sortOn: "PartyName ASC",
            page: "1",
            pageSize: "500",
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setParties(Array.isArray(d) ? d : (d?.data ?? []));
        }
      } catch (e) {
        console.error("Parties fetch:", e);
      } finally {
        setLoadingParties(false);
      }
    };

    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const res = await fetch(`${getBaseUrl()}Branch/GetList`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            select: "BranchId, BranchCode, BranchName",
            where: "",
            search: "",
            sortOn: "BranchName ASC",
            page: "1",
            pageSize: "200",
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setAllBranches(Array.isArray(d) ? d : (d?.data ?? []));
        }
      } catch (e) {
        console.error("Branches fetch:", e);
      } finally {
        setLoadingBranches(false);
      }
    };

    const fetchCharges = async () => {
      setLoadingCharges(true);
      try {
        const res = await fetch(`${getBaseUrl()}ChargesMaster/GetList`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            select: "ChargeId, ChargeCode, ChargeName, ChargesNature",
            where: "IsActive == true",
            search: "",
            sortOn: "ChargeCode ASC",
            page: "1",
            pageSize: "500",
          }),
        });
        if (res.ok) {
          const d = await res.json();
          const list = Array.isArray(d) ? d : (d?.data ?? []);
          setCharges(
            list.map((c: any) => ({
              chargeId: c.chargeId ?? c.ChargeId ?? 0,
              chargeCode: c.chargeCode ?? c.ChargeCode ?? "",
              chargeName: c.chargeName ?? c.ChargeName ?? "",
              chargesNature: c.chargesNature ?? c.ChargesNature ?? "",
            })),
          );
        }
      } catch (e) {
        console.error("Charges fetch:", e);
      } finally {
        setLoadingCharges(false);
      }
    };

    fetchParties();
    fetchBranches();
    fetchCharges();
  }, []);

  // ── Populate form for edit ──────────────────────────────────────────────────
  useEffect(() => {
    if (type !== "edit" || !defaultState) return;

    const s = defaultState;
    setContractTarrifNo(s.contractTarrifNo ?? "");
    setContractDate(toDateInput(s.contractDate));
    setContractEffectiveDate(toDateInput(s.contractEffectiveDate));
    setContractExpiryDate(toDateInput(s.contractExpiryDate));
    setPartyId(s.partyId ?? null);
    setCompanyId(s.companyId ?? 0);
    setRemarks(s.remarks ?? "");
    setIsActive(s.isActive ?? true);

    // flags — note schema uses isGdrawMaterial / isFcl etc.
    setIsGdrawMaterial(s.isGdrawMaterial ?? s.isGDRawMaterial ?? false);
    setIsGdfinishedGoods(s.isGdfinishedGoods ?? s.isGDFinishedGoods ?? false);
    setIsImport(s.isImport ?? false);
    setIsExport(s.isExport ?? false);
    setIsSea(s.isSea ?? false);
    setIsAir(s.isAir ?? false);
    setIsLand(s.isLand ?? false);
    setIsFcl(s.isFcl ?? s.isFCL ?? false);
    setIsLcl(s.isLcl ?? s.isLCL ?? false);
    setIsBreakBulk(s.isBreakBulk ?? false);

    // party name
    if (s.party?.partyName) setPartyName(s.party.partyName);

    // branches
    const rawBranches =
      s.contractTarrifBranches ?? s.ContractTarrifBranches ?? [];
    setBranches(
      rawBranches.map((b: any) => ({
        id: uid(),
        contractTarrifBranchesId:
          b.contractTarrifBranchesId ?? b.ContractTarrifBranchesId ?? 0,
        bracnchId: b.bracnchId ?? b.BracnchId ?? b.branchId ?? 0,
        branchName: b.branchName ?? b.BranchName ?? b.bracnch?.branchName ?? "",
        contractTarrifId: b.contractTarrifId ?? 0,
      })),
    );

    // details
    const rawDetails = s.contractTarrifDetails ?? s.ContractTarrifDetails ?? [];
    if (rawDetails.length > 0) {
      setDetails(
        rawDetails.map((d: any) => ({
          id: uid(),
          contractTarrifDetailId:
            d.contractTarrifDetailId ?? d.ContractTarrifDetailId ?? 0,
          contractTarrifId: d.contractTarrifId ?? 0,
          chargesId: d.chargesId ?? d.ChargesId ?? null,
          chargeName: d.charges?.chargeName ?? d.charges?.ChargeName ?? "",
          description: d.description ?? "",
          value: d.value ?? 0,
          isValuePercentage: d.isValuePercentage ?? false,
          rangeStartDate: toDateInput(d.rangeStartDate),
          rangeEndDate: toDateInput(d.rangeEndDate),
          isTaxableValue: d.isTaxableValue ?? false,
          isCustomValue: d.isCustomValue ?? false,
          isInvoiceValue: d.isInvoiceValue ?? false,
          rangeStartAmount: d.rangeStartAmount ?? 0,
          rangeEndAmount: d.rangeEndAmount ?? 0,
        })),
      );
    }
  }, [type, defaultState]);

  // Resolve party name when parties load after edit pre-populate
  useEffect(() => {
    if (partyId && parties.length > 0 && !partyName) {
      const p = parties.find((x) => x.partyId === partyId);
      if (p) setPartyName(p.partyName);
    }
  }, [partyId, parties, partyName]);

  // ✅ FIX 3: resolve chargeName from charges list when API doesn't return
  // navigation property (GetList responses typically omit it)
  useEffect(() => {
    if (charges.length === 0) return;
    setDetails((prev) =>
      prev.map((d) => {
        if (d.chargesId && !d.chargeName) {
          const charge = charges.find((c) => c.chargeId === d.chargesId);
          if (charge) return { ...d, chargeName: charge.chargeName };
        }
        return d;
      }),
    );
  }, [charges]);

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const filteredParties = useMemo(() => {
    const q = dPartySearch.toLowerCase();
    return q
      ? parties.filter(
          (p) =>
            p.partyName.toLowerCase().includes(q) ||
            p.partyCode.toLowerCase().includes(q),
        )
      : parties;
  }, [dPartySearch, parties]);

  const filteredBranches = useMemo(() => {
    const q = dBranchSearch.toLowerCase();
    const selected = new Set(branches.map((b) => b.bracnchId));
    return (
      q
        ? allBranches.filter(
            (b) =>
              b.branchName.toLowerCase().includes(q) ||
              b.branchCode.toLowerCase().includes(q),
          )
        : allBranches
    ).filter((b) => !selected.has(b.branchId));
  }, [dBranchSearch, allBranches, branches]);

  // ✅ FIX 2: per-row filtered charges — function instead of shared useMemo
  const getFilteredCharges = useCallback(
    (rowId: string) => {
      const q = (chargeSearches[rowId] ?? "").toLowerCase();
      return q
        ? charges.filter(
            (c) =>
              c.chargeName.toLowerCase().includes(q) ||
              c.chargeCode.toLowerCase().includes(q),
          )
        : charges;
    },
    [chargeSearches, charges],
  );

  // ── Branch helpers ──────────────────────────────────────────────────────────
  const addBranch = useCallback(
    (branch: Branch) => {
      setBranches((prev) => [
        ...prev,
        {
          id: uid(),
          contractTarrifBranchesId: 0,
          bracnchId: branch.branchId,
          branchName: branch.branchName,
          contractTarrifId:
            type === "edit" ? (defaultState?.contractTarrifId ?? 0) : 0,
        },
      ]);
      setBranchSearch("");
    },
    [type, defaultState],
  );

  const removeBranch = useCallback((id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ── Detail helpers ──────────────────────────────────────────────────────────
  const addDetail = useCallback(() => {
    setDetails((prev) => [
      ...prev,
      emptyDetail(type === "edit" ? (defaultState?.contractTarrifId ?? 0) : 0),
    ]);
  }, [type, defaultState]);

  const removeDetail = useCallback(
    (id: string) => {
      if (details.length === 1) {
        toast({
          variant: "destructive",
          title: "Cannot Remove",
          description: "At least one detail line is required",
        });
        return;
      }
      setDetails((prev) => prev.filter((d) => d.id !== id));
    },
    [details.length, toast],
  );

  const updateDetail = useCallback(
    (id: string, field: keyof ContractDetail, value: any) => {
      setDetails((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  const handleChargeSelect = useCallback(
    (detailId: string, chargeIdStr: string) => {
      const charge = charges.find((c) => c.chargeId.toString() === chargeIdStr);
      if (charge) {
        setDetails((prev) =>
          prev.map((d) =>
            d.id === detailId
              ? {
                  ...d,
                  chargesId: charge.chargeId,
                  chargeName: charge.chargeName,
                  description: d.description || charge.chargeName,
                }
              : d,
          ),
        );
      }
    },
    [charges],
  );

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: string[] = [];
    if (!contractTarrifNo.trim()) errs.push("Contract No is required");
    if (!contractDate) errs.push("Contract Date is required");
    if (!contractEffectiveDate) errs.push("Effective Date is required");
    if (!contractExpiryDate) errs.push("Expiry Date is required");
    if (details.some((d) => !d.chargesId))
      errs.push("All detail lines must have a Charge selected");
    if (details.some((d) => d.value <= 0))
      errs.push("All detail lines must have a value > 0");

    if (errs.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          errs.slice(0, 3).join(" • ") + (errs.length > 3 ? " …" : ""),
      });
      return false;
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const contractTarrifId =
      type === "edit" ? (defaultState?.contractTarrifId ?? 0) : 0;

    const payload = {
      // ── Audit ────────────────────────────────────────────────────────────
      CreatedAt:
        type === "edit"
          ? (defaultState?.createdAt ?? new Date().toISOString())
          : new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CreateLog: type === "edit" ? (defaultState?.createLog ?? null) : null,
      UpdateLog: null,
      Version: type === "edit" ? (defaultState?.version ?? 0) : 0,

      // ── Master ───────────────────────────────────────────────────────────
      ContractTarrifId: contractTarrifId,
      ContractTarrifNo: contractTarrifNo.trim(),
      ContractDate: toIso(contractDate),
      ContractEffectiveDate: toIso(contractEffectiveDate),
      ContractExpiryDate: toIso(contractExpiryDate),
      PartyId: partyId ?? null, // ✅ nullable FK → null, not 0
      CompanyId: companyId || null, // ✅ nullable FK → null, not 0
      Remarks: remarks,
      IsActive: isActive,
      CreatedBy: type === "edit" ? (defaultState?.createdBy ?? userId) : userId,
      UpdatedBy: userId,

      // ── Flags — exact schema casing ───────────────────────────────────────
      IsGdrawMaterial: isGdrawMaterial,
      IsGdfinishedGoods: isGdfinishedGoods,
      IsImport: isImport,
      IsExport: isExport,
      IsSea: isSea,
      IsAir: isAir,
      IsLand: isLand,
      IsFcl: isFcl,
      IsLcl: isLcl,
      IsBreakBulk: isBreakBulk,

      // ── Navigation nulls ─────────────────────────────────────────────────
      Company: null,
      Party: null,

      // ── Branches ─────────────────────────────────────────────────────────
      ContractTarrifBranches: branches.map((b) => ({
        CreatedAt: "0001-01-01T00:00:00",
        UpdatedAt: "0001-01-01T00:00:00",
        CreateLog: null,
        UpdateLog: null,
        Version: 0,
        ContractTarrifBranchesId: b.contractTarrifBranchesId,
        BracnchId: b.bracnchId,
        BranchName: b.branchName,
        ContractTarrifId: contractTarrifId,
        Bracnch: null,
      })),

      // ── Details ──────────────────────────────────────────────────────────
      ContractTarrifDetails: details.map((d) => ({
        CreatedAt: "0001-01-01T00:00:00",
        UpdatedAt: "0001-01-01T00:00:00",
        CreateLog: null,
        UpdateLog: null,
        Version: 0,
        ContractTarrifDetailId: d.contractTarrifDetailId,
        ContractTarrifId: contractTarrifId,
        ChargesId: d.chargesId ?? 0,
        Description: d.description || "",
        Value: d.value,
        IsValuePercentage: d.isValuePercentage,
        RangeStartDate: d.rangeStartDate ? toIso(d.rangeStartDate) : null, // ✅ nullable date → null, not "0001-01-01"
        RangeEndDate: d.rangeEndDate ? toIso(d.rangeEndDate) : null, // ✅ nullable date → null, not "0001-01-01"
        IsTaxableValue: d.isTaxableValue,
        IsCustomValue: d.isCustomValue,
        IsInvoiceValue: d.isInvoiceValue,
        RangeStartAmount: d.rangeStartAmount,
        RangeEndAmount: d.rangeEndAmount,
        Charges: null,
      })),
    };

    const method = type === "edit" ? "PUT" : "POST";
    const endpoint = `${getBaseUrl()}ContractTarrif`;

    console.log(`📡 ${method} ${endpoint}`, payload);

    try {
      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
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
        let msg = `Request failed (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (Array.isArray(parsed)) msg = parsed.join(", ");
          else if (parsed.errors)
            msg = Object.values(parsed.errors).flat().join(", ");
          else if (parsed.title) msg = parsed.title;
          else if (parsed.message) msg = parsed.message;
        } catch {
          msg = errText || msg;
        }
        throw new Error(msg);
      }

      const result = await res.json();
      toast({
        title: "Success",
        description: `Contract ${type === "edit" ? "updated" : "created"} — ${contractTarrifNo}`,
      });
      handleAddEdit(result);
    } catch (err) {
      toast({
        variant: "destructive",
        title: type === "edit" ? "Update Failed" : "Create Failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loadingParties || loadingBranches || loadingCharges;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-5'
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) e.preventDefault();
      }}
    >
      {isLoading && (
        <div className='fixed top-4 right-4 z-50'>
          <Badge
            variant='outline'
            className='bg-blue-50 border-blue-300 gap-1.5'
          >
            <FiLoader className='animate-spin h-3 w-3' /> Loading...
          </Badge>
        </div>
      )}

      {/* ── Section 1: Master Info ────────────────────────────────────────── */}
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-base'>
              {type === "edit" ? "Edit Contract Tariff" : "New Contract Tariff"}
            </CardTitle>
            <div className='flex items-center gap-2'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <Checkbox
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(!!v)}
                  className='data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600'
                />
                <span className='text-sm font-medium text-gray-700'>
                  Active
                </span>
              </label>
              {type === "edit" && (
                <Badge variant='outline' className='font-mono text-xs'>
                  #{defaultState?.contractTarrifId}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription className='pt-1'>
            Fill in contract information, assign branches, and add tariff detail
            lines.
          </CardDescription>
        </CardHeader>

        <CardContent className='p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {/* Contract No */}
          <div>
            <Label className='text-sm font-medium mb-1.5 block'>
              Contract No <span className='text-red-500'>*</span>
            </Label>
            <Input
              value={contractTarrifNo}
              onChange={(e) => setContractTarrifNo(e.target.value)}
              placeholder='e.g. CT-2024-001'
              className='h-9'
            />
          </div>

          {/* Contract Date */}
          <div>
            <Label className='text-sm font-medium mb-1.5 block'>
              Contract Date <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='date'
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
              className='h-9'
            />
          </div>

          {/* Effective Date */}
          <div>
            <Label className='text-sm font-medium mb-1.5 block'>
              Effective Date <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='date'
              value={contractEffectiveDate}
              onChange={(e) => setContractEffectiveDate(e.target.value)}
              className='h-9'
            />
          </div>

          {/* Expiry Date */}
          <div>
            <Label className='text-sm font-medium mb-1.5 block'>
              Expiry Date <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='date'
              value={contractExpiryDate}
              onChange={(e) => setContractExpiryDate(e.target.value)}
              className='h-9'
            />
          </div>

          {/* Party */}
          <div>
            <Label className='text-sm font-medium mb-1.5 block'>Party</Label>
            <Select
              value={partyId?.toString() || ""}
              onValueChange={(v) => {
                const p = parties.find((x) => x.partyId.toString() === v);
                if (p) {
                  setPartyId(p.partyId);
                  setPartyName(p.partyName);
                }
              }}
              disabled={loadingParties}
            >
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='Select Party'>
                  {partyName || "Select Party"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                className='max-h-[300px] w-[360px]'
                position='popper'
                sideOffset={5}
              >
                <div className='sticky top-0 bg-white p-2 border-b z-50'>
                  <div className='relative'>
                    <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input
                      placeholder='Search parties...'
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      className='pl-8 h-8'
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className='max-h-[250px] overflow-y-auto'>
                  {loadingParties ? (
                    <div className='p-3 text-center text-gray-500 text-sm'>
                      <FiLoader className='animate-spin inline mr-2' />
                      Loading...
                    </div>
                  ) : filteredParties.length === 0 ? (
                    <div className='p-3 text-center text-gray-500 text-sm'>
                      No parties found
                    </div>
                  ) : (
                    filteredParties.map((p) => (
                      <SelectItem key={p.partyId} value={p.partyId.toString()}>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{p.partyName}</span>
                          <span className='text-xs text-gray-500'>
                            {p.partyCode}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div className='md:col-span-2 lg:col-span-1'>
            <Label className='text-sm font-medium mb-1.5 block'>Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder='Optional remarks...'
              className='h-9'
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Flags ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className='py-3 px-4 bg-gray-50'>
          <CardTitle className='text-sm font-semibold text-gray-800'>
            Contract Scope
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4'>
            {/* Trade */}
            <div className='space-y-3'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                Trade
              </p>
              <FlagCheckbox
                label='Import'
                checked={isImport}
                onChange={setIsImport}
              />
              <FlagCheckbox
                label='Export'
                checked={isExport}
                onChange={setIsExport}
              />
            </div>

            {/* Mode */}
            <div className='space-y-3'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                Mode
              </p>
              <FlagCheckbox label='Sea' checked={isSea} onChange={setIsSea} />
              <FlagCheckbox label='Air' checked={isAir} onChange={setIsAir} />
              <FlagCheckbox
                label='Land'
                checked={isLand}
                onChange={setIsLand}
              />
            </div>

            {/* Cargo */}
            <div className='space-y-3'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                Cargo Type
              </p>
              <FlagCheckbox label='FCL' checked={isFcl} onChange={setIsFcl} />
              <FlagCheckbox label='LCL' checked={isLcl} onChange={setIsLcl} />
              <FlagCheckbox
                label='Break Bulk'
                checked={isBreakBulk}
                onChange={setIsBreakBulk}
              />
            </div>

            {/* GD */}
            <div className='space-y-3'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                GD Type
              </p>
              <FlagCheckbox
                label='Raw Material'
                checked={isGdrawMaterial}
                onChange={setIsGdrawMaterial}
              />
              <FlagCheckbox
                label='Finished Goods'
                checked={isGdfinishedGoods}
                onChange={setIsGdfinishedGoods}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Branches ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className='py-3 px-4 bg-gray-50'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-semibold text-gray-800'>
              Branches
            </CardTitle>
            <Badge variant='outline'>{branches.length} selected</Badge>
          </div>
        </CardHeader>
        <CardContent className='p-4 space-y-3'>
          {/* Branch picker */}
          <div className='flex gap-2'>
            <Select
              value=''
              onValueChange={(v) => {
                const b = allBranches.find((x) => x.branchId.toString() === v);
                if (b) addBranch(b);
              }}
              disabled={loadingBranches}
            >
              <SelectTrigger className='h-9 text-sm flex-1'>
                <SelectValue placeholder='Add a branch...' />
              </SelectTrigger>
              <SelectContent
                className='max-h-[280px] w-[340px]'
                position='popper'
                sideOffset={5}
              >
                <div className='sticky top-0 bg-white p-2 border-b z-50'>
                  <div className='relative'>
                    <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input
                      placeholder='Search branches...'
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      className='pl-8 h-8'
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className='max-h-[220px] overflow-y-auto'>
                  {loadingBranches ? (
                    <div className='p-3 text-center text-sm text-gray-500'>
                      Loading...
                    </div>
                  ) : filteredBranches.length === 0 ? (
                    <div className='p-3 text-center text-sm text-gray-500'>
                      All branches added
                    </div>
                  ) : (
                    filteredBranches.map((b) => (
                      <SelectItem
                        key={b.branchId}
                        value={b.branchId.toString()}
                      >
                        <div className='flex flex-col'>
                          <span className='font-medium'>{b.branchName}</span>
                          <span className='text-xs text-gray-500'>
                            {b.branchCode}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Selected branches */}
          {branches.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {branches.map((b) => (
                <span
                  key={b.id}
                  className='inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-full'
                >
                  {b.branchName}
                  <button
                    type='button'
                    onClick={() => removeBranch(b.id)}
                    className='hover:text-blue-900 transition-colors'
                  >
                    <FiX className='h-3.5 w-3.5' />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className='text-sm text-gray-400 italic'>
              No branches added — contract applies to all branches
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4: Contract Details ──────────────────────────────────── */}
      <Card>
        <CardHeader className='py-3 px-4 bg-gray-50'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-sm font-semibold text-gray-800'>
                Tariff Details
              </CardTitle>
              <CardDescription className='text-xs mt-0.5'>
                Define charges, values, and date/amount ranges per tariff line
              </CardDescription>
            </div>
            <Badge variant='outline'>{details.length} line(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50'>
                  <TableHead className='w-[36px] text-center'>#</TableHead>
                  <TableHead className='min-w-[200px]'>
                    Charge <span className='text-red-500'>*</span>
                  </TableHead>
                  <TableHead className='min-w-[160px]'>Description</TableHead>
                  <TableHead className='min-w-[110px]'>
                    Value <span className='text-red-500'>*</span>
                  </TableHead>
                  <TableHead className='min-w-[80px] text-center'>
                    % ?
                  </TableHead>
                  <TableHead className='min-w-[120px]'>
                    Range Start Date
                  </TableHead>
                  <TableHead className='min-w-[120px]'>
                    Range End Date
                  </TableHead>
                  <TableHead className='min-w-[110px]'>Amount From</TableHead>
                  <TableHead className='min-w-[110px]'>Amount To</TableHead>
                  <TableHead className='min-w-[100px] text-center'>
                    Flags
                  </TableHead>
                  <TableHead className='w-[44px] sticky right-0 bg-gray-50 border-l'>
                    Del
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((d, idx) => (
                  <TableRow key={d.id} className='group'>
                    {/* # */}
                    <TableCell className='text-center text-xs text-gray-500'>
                      {idx + 1}
                    </TableCell>

                    {/* Charge */}
                    <TableCell>
                      <Select
                        value={d.chargesId?.toString() || ""}
                        onValueChange={(v) => handleChargeSelect(d.id, v)}
                      >
                        <SelectTrigger className='h-8 text-xs'>
                          <SelectValue placeholder='Select Charge'>
                            {/* ✅ FIX: show resolved name or fallback to code lookup */}
                            {d.chargeName ||
                              charges.find((c) => c.chargeId === d.chargesId)
                                ?.chargeName ||
                              "Select Charge"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          className='max-h-[280px] w-[280px]'
                          position='popper'
                          sideOffset={5}
                        >
                          <div className='sticky top-0 bg-white p-2 border-b z-50'>
                            <div className='relative'>
                              <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                              <Input
                                placeholder='Search charges...'
                                // ✅ FIX: per-row search — no cross-row bleed
                                value={getChargeSearch(d.id)}
                                onChange={(e) =>
                                  setChargeSearch(d.id, e.target.value)
                                }
                                className='pl-7 h-7 text-xs'
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className='max-h-[220px] overflow-y-auto'>
                            {loadingCharges ? (
                              <div className='p-3 text-center text-xs text-gray-500'>
                                <FiLoader className='animate-spin inline mr-1' />
                                Loading...
                              </div>
                            ) : getFilteredCharges(d.id).length === 0 ? (
                              <div className='p-3 text-center text-xs text-gray-500'>
                                No charges found
                              </div>
                            ) : (
                              getFilteredCharges(d.id).map((c) => (
                                <SelectItem
                                  key={c.chargeId}
                                  value={c.chargeId.toString()}
                                >
                                  <div className='flex flex-col'>
                                    <span className='font-medium text-xs'>
                                      {c.chargeCode}
                                    </span>
                                    <span className='text-xs text-gray-500'>
                                      {c.chargeName}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      <Input
                        value={d.description}
                        onChange={(e) =>
                          updateDetail(d.id, "description", e.target.value)
                        }
                        className='h-8 text-xs'
                        placeholder='Description...'
                      />
                    </TableCell>

                    {/* Value */}
                    <TableCell>
                      <Input
                        type='number'
                        min='0'
                        step='0.01'
                        value={d.value || ""}
                        onChange={(e) =>
                          updateDetail(
                            d.id,
                            "value",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className='h-8 text-xs'
                        placeholder='0.00'
                      />
                    </TableCell>

                    {/* % */}
                    <TableCell className='text-center'>
                      <Checkbox
                        checked={d.isValuePercentage}
                        onCheckedChange={(v) =>
                          updateDetail(d.id, "isValuePercentage", !!v)
                        }
                      />
                    </TableCell>

                    {/* Range Start Date */}
                    <TableCell>
                      <Input
                        type='date'
                        value={d.rangeStartDate}
                        onChange={(e) =>
                          updateDetail(d.id, "rangeStartDate", e.target.value)
                        }
                        className='h-8 text-xs'
                      />
                    </TableCell>

                    {/* Range End Date */}
                    <TableCell>
                      <Input
                        type='date'
                        value={d.rangeEndDate}
                        onChange={(e) =>
                          updateDetail(d.id, "rangeEndDate", e.target.value)
                        }
                        className='h-8 text-xs'
                      />
                    </TableCell>

                    {/* Amount From */}
                    <TableCell>
                      <Input
                        type='number'
                        min='0'
                        step='0.01'
                        value={d.rangeStartAmount || ""}
                        onChange={(e) =>
                          updateDetail(
                            d.id,
                            "rangeStartAmount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className='h-8 text-xs'
                        placeholder='0.00'
                      />
                    </TableCell>

                    {/* Amount To */}
                    <TableCell>
                      <Input
                        type='number'
                        min='0'
                        step='0.01'
                        value={d.rangeEndAmount || ""}
                        onChange={(e) =>
                          updateDetail(
                            d.id,
                            "rangeEndAmount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className='h-8 text-xs'
                        placeholder='0.00'
                      />
                    </TableCell>

                    {/* Flags: Taxable / Custom / Invoice */}
                    <TableCell>
                      <div className='flex items-center gap-2 justify-center'>
                        <span
                          title='Taxable Value'
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded cursor-pointer border select-none ${
                            d.isTaxableValue
                              ? "bg-green-50 text-green-700 border-green-300"
                              : "bg-gray-50 text-gray-400 border-gray-200"
                          }`}
                          onClick={() =>
                            updateDetail(
                              d.id,
                              "isTaxableValue",
                              !d.isTaxableValue,
                            )
                          }
                        >
                          Tax
                        </span>
                        <span
                          title='Custom Value'
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded cursor-pointer border select-none ${
                            d.isCustomValue
                              ? "bg-blue-50 text-blue-700 border-blue-300"
                              : "bg-gray-50 text-gray-400 border-gray-200"
                          }`}
                          onClick={() =>
                            updateDetail(
                              d.id,
                              "isCustomValue",
                              !d.isCustomValue,
                            )
                          }
                        >
                          Cst
                        </span>
                        <span
                          title='Invoice Value'
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded cursor-pointer border select-none ${
                            d.isInvoiceValue
                              ? "bg-purple-50 text-purple-700 border-purple-300"
                              : "bg-gray-50 text-gray-400 border-gray-200"
                          }`}
                          onClick={() =>
                            updateDetail(
                              d.id,
                              "isInvoiceValue",
                              !d.isInvoiceValue,
                            )
                          }
                        >
                          Inv
                        </span>
                      </div>
                    </TableCell>

                    {/* Delete */}
                    <TableCell className='sticky right-0 bg-white group-hover:bg-gray-50 border-l'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeDetail(d.id)}
                        className='h-7 w-7 p-0 text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <FiTrash2 className='h-3.5 w-3.5' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='p-3 border-t'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addDetail}
              className='flex items-center gap-1.5 text-xs'
            >
              <FiPlus className='h-3.5 w-3.5' /> Add Detail Line
            </Button>
            <p className='mt-2 text-xs text-gray-500 flex items-center gap-1'>
              <FiInfo className='h-3 w-3' />
              <span>
                Click <strong>Tax</strong> / <strong>Cst</strong> /{" "}
                <strong>Inv</strong> badges to toggle flags per line
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className='flex justify-end gap-2 pb-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => handleAddEdit(null)}
          disabled={isSubmitting}
          className='gap-1.5'
        >
          <FiX className='h-4 w-4' /> Cancel
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting || isLoading}
          className='bg-blue-600 hover:bg-blue-700 gap-1.5'
        >
          {isSubmitting ? (
            <>
              <FiLoader className='h-4 w-4 animate-spin' /> Saving...
            </>
          ) : (
            <>
              <FiSave className='h-4 w-4' />
              {type === "edit" ? "Update Contract" : "Save Contract"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
