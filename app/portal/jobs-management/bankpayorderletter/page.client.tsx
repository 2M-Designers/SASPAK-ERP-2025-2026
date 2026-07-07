"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders, getBaseUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FiSearch,
  FiLoader,
  FiRefreshCw,
  FiCheckSquare,
  FiFileText,
  FiFilter,
} from "react-icons/fi";
import { CheckSquare, Square, AlertCircle, Building2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Bank = {
  bankId: number;
  bankCode: string;
  bankName: string;
};

type ApprovedDetailItem = {
  internalFundsRequestBankId: number;
  bankFundRequestMasterId: number;
  jobId: number | null;
  jobNumber: string;
  headOfAccount: string;
  beneficiary: string;
  beneficiaryCoaId: number | null;
  onAccountOfId: number | null;
  onAccountOfName: string;
  accountNo: string;
  approvedAmount: number;
  requestedAmount: number;
  bankId: number | null;
  bankName: string;
  customerName: string;
  chargesId: number;
  remarks: string;
  isBankLetterReleased: boolean | number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BankPayOrderLetterClient() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const debouncedBankSearch = useDebounce(bankSearch, 250);

  const [allItems, setAllItems] = useState<ApprovedDetailItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [tableSearch, setTableSearch] = useState("");
  const debouncedTableSearch = useDebounce(tableSearch, 250);

  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const { toast } = useToast();
  const router = useRouter();

  // ── Filtered banks for dropdown ────────────────────────────────────────────
  const filteredBanks = useMemo(() => {
    const q = debouncedBankSearch.toLowerCase();
    return q
      ? banks.filter(
          (b) =>
            b.bankName.toLowerCase().includes(q) ||
            b.bankCode.toLowerCase().includes(q),
        )
      : banks;
  }, [debouncedBankSearch, banks]);

  // ── Split into pending (not yet released) and released ────────────────────
  const pendingItems = useMemo(
    () => allItems.filter((it) => !it.isBankLetterReleased),
    [allItems],
  );
  const releasedItems = useMemo(
    () => allItems.filter((it) => !!it.isBankLetterReleased),
    [allItems],
  );

  // ── Filtered table rows (only from pending) ────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = debouncedTableSearch.toLowerCase();
    if (!q) return pendingItems;
    return pendingItems.filter(
      (it) =>
        it.headOfAccount.toLowerCase().includes(q) ||
        it.beneficiary.toLowerCase().includes(q) ||
        it.customerName.toLowerCase().includes(q) ||
        it.jobNumber.toLowerCase().includes(q) ||
        it.accountNo.toLowerCase().includes(q) ||
        it.bankFundRequestMasterId.toString().includes(q),
    );
  }, [pendingItems, debouncedTableSearch]);

  // ── Released items filtered by search ─────────────────────────────────────
  const filteredReleasedItems = useMemo(() => {
    const q = debouncedTableSearch.toLowerCase();
    if (!q) return releasedItems;
    return releasedItems.filter(
      (it) =>
        it.headOfAccount.toLowerCase().includes(q) ||
        it.beneficiary.toLowerCase().includes(q) ||
        it.customerName.toLowerCase().includes(q) ||
        it.jobNumber.toLowerCase().includes(q) ||
        it.accountNo.toLowerCase().includes(q) ||
        it.bankFundRequestMasterId.toString().includes(q),
    );
  }, [releasedItems, debouncedTableSearch]);

  // ── Derived selection state ────────────────────────────────────────────────
  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((it) => selectedIds.has(it.internalFundsRequestBankId));
  const someFilteredSelected =
    filteredItems.some((it) =>
      selectedIds.has(it.internalFundsRequestBankId),
    ) && !allFilteredSelected;

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const selected = allItems.filter((it) =>
      selectedIds.has(it.internalFundsRequestBankId),
    );
    return {
      count: selected.length,
      totalAmount: selected.reduce((s, it) => s + it.approvedAmount, 0),
      masterIds: [...new Set(selected.map((it) => it.bankFundRequestMasterId))],
    };
  }, [allItems, selectedIds]);

  // ── Fetch banks ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const res = await fetch(`${getBaseUrl()}Banks/GetList`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            select: "BankId, BankCode, BankName",
            where: "",
            search: "",
            sortOn: "BankName ASC",
            page: "1",
            pageSize: "5000",
          }),
        });
        if (!res.ok) return;
        const d = await res.json();
        const list: Bank[] = (
          Array.isArray(d) ? d : (d?.data ?? d?.items ?? [])
        ).map((b: any) => ({
          bankId: b.bankId ?? b.BankId ?? 0,
          bankCode: b.bankCode ?? b.BankCode ?? "",
          bankName: b.bankName ?? b.BankName ?? "",
        }));
        setBanks(list);
      } catch (e) {
        console.error("Banks fetch error:", e);
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  // ── Fetch approved items: get master IDs then fetch each record individually ─
  const fetchApprovedItems = useCallback(
    async (bankId: number | null) => {
      setIsLoadingItems(true);
      setSelectedIds(new Set());
      try {
        // Fetch master IDs, jobs, and parties in parallel
        const [listRes, jobsRes, partiesRes] = await Promise.all([
          fetch(`${getBaseUrl()}InternalBankFundsRequest/GetList`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              select: "BankFundRequestId",
              where: `ApprovalStatus == "Approved"`,
              search: "",
              sortOn: "BankFundRequestId DESC",
              page: "1",
              pageSize: "2000",
            }),
          }),
          fetch(`${getBaseUrl()}Job/GetList`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              select: "JobId, JobNumber",
              where: "",
              search: "",
              sortOn: "JobId DESC",
              page: "1",
              pageSize: "2000",
            }),
          }),
          fetch(`${getBaseUrl()}Party/GetList`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              select: "PartyId, PartyName",
              where: "",
              search: "",
              sortOn: "PartyName ASC",
              page: "1",
              pageSize: "5000",
            }),
          }),
        ]);

        if (!listRes.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to load approved requests (${listRes.status})`,
          });
          return;
        }

        // Build jobId → jobNumber lookup
        const jobMap = new Map<number, string>();
        if (jobsRes.ok) {
          const jd = await jobsRes.json();
          const jList: any[] = Array.isArray(jd) ? jd : (jd?.data ?? jd?.items ?? []);
          for (const j of jList) {
            const id = j.jobId ?? j.JobId;
            const num = j.jobNumber ?? j.JobNumber ?? "";
            if (id) jobMap.set(id, num);
          }
        }

        // Build partyId → partyName lookup
        const partyMap = new Map<number, string>();
        if (partiesRes.ok) {
          const pd = await partiesRes.json();
          const pList: any[] = Array.isArray(pd) ? pd : (pd?.data ?? pd?.items ?? []);
          for (const p of pList) {
            const id = p.partyId ?? p.PartyId;
            const name = p.partyName ?? p.PartyName ?? "";
            if (id) partyMap.set(id, name);
          }
        }

        const listData = await listRes.json();
        const masterSummaries: any[] = Array.isArray(listData)
          ? listData
          : (listData?.data ?? listData?.items ?? []);

        const ids: number[] = masterSummaries
          .map((m) => m.bankFundRequestId ?? m.BankFundRequestId)
          .filter(Boolean);

        if (ids.length === 0) {
          setAllItems([]);
          return;
        }

        // Fetch each master individually to get nested detail lines
        const fullRecords = await Promise.all(
          ids.map((id) =>
            fetch(`${getBaseUrl()}InternalBankFundsRequest/${id}`, {
              method: "GET",
              headers: getAuthHeaders(),
            }).then((r) => (r.ok ? r.json() : null)),
          ),
        );

        const bankMap = new Map(banks.map((b) => [b.bankId, b.bankName]));
        const items: ApprovedDetailItem[] = [];

        for (const master of fullRecords) {
          if (!master) continue;
          const masterId =
            master.bankFundRequestId ?? master.BankFundRequestId ?? 0;
          const masterBankId = master.bankId ?? master.BankId ?? null;
          const details: any[] =
            master.internalBankFundsRequests ??
            master.InternalBankFundsRequests ??
            [];

          for (const r of details) {
            const status = r.subRequestStatus ?? r.SubRequestStatus ?? "";
            if (status.toLowerCase() !== "approved") continue;

            const bId = r.bankId ?? r.BankId ?? masterBankId;

            // Client-side bank filter — only apply when a bank is selected
            if (bankId !== null && bId !== bankId) continue;

            const jobId = r.jobId ?? r.JobId ?? null;
            const onAccountOfId = r.onAccountOfId ?? r.OnAccountOfId ?? null;

            items.push({
              internalFundsRequestBankId:
                r.internalFundsRequestBankId ??
                r.InternalFundsRequestBankId ??
                0,
              bankFundRequestMasterId: masterId,
              jobId,
              jobNumber:
                (jobId ? jobMap.get(jobId) : undefined) ??
                r.jobNumber ?? r.JobNumber ?? "",
              headOfAccount: r.headOfAccount ?? r.HeadOfAccount ?? "",
              beneficiary: r.beneficiary ?? r.Beneficiary ?? "",
              beneficiaryCoaId: r.beneficiaryCoaId ?? r.BeneficiaryCoaId ?? null,
              onAccountOfId,
              onAccountOfName:
                (onAccountOfId ? partyMap.get(onAccountOfId) : undefined) ??
                r.onAccountOfName ?? r.OnAccountOfName ?? "",
              accountNo: r.accountNo ?? r.AccountNo ?? "",
              approvedAmount: r.approvedAmount ?? r.ApprovedAmount ?? 0,
              requestedAmount: r.requestedAmount ?? r.RequestedAmount ?? 0,
              bankId: bId,
              bankName: bankMap.get(bId) ?? r.bankName ?? r.BankName ?? "",
              customerName: r.customerName ?? r.CustomerName ?? "",
              chargesId: r.chargesId ?? r.ChargesId ?? 0,
              remarks: r.remarks ?? r.Remarks ?? "",
              isBankLetterReleased:
                r.isBankLetterReleased ?? r.IsBankLetterReleased ?? null,
            });
          }
        }

        setAllItems(items);
      } catch (e) {
        console.error("Fetch approved items error:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load approved items. Please try again.",
        });
      } finally {
        setIsLoadingItems(false);
      }
    },
    [banks, toast],
  );

  // Re-fetch when bank selection changes or banks list first loads
  useEffect(() => {
    if (banks.length > 0) {
      fetchApprovedItems(selectedBankId);
    }
  }, [selectedBankId, banks.length]); // eslint-disable-line

  // ── Selection handlers ─────────────────────────────────────────────────────
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          filteredItems.forEach((it) =>
            next.add(it.internalFundsRequestBankId),
          );
          return next;
        });
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          filteredItems.forEach((it) =>
            next.delete(it.internalFundsRequestBankId),
          );
          return next;
        });
      }
    },
    [filteredItems],
  );

  const handleSelectItem = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreatePayOrder = useCallback(async () => {
    if (isSubmittingRef.current) return;

    if (selectedIds.size === 0) {
      toast({
        variant: "destructive",
        title: "No Selection",
        description: "Please select at least one approved request.",
      });
      return;
    }

    // ── Pre-validation: all selected items must have a GL Account (BeneficiaryCoaId) ──
    const selectedItems = allItems.filter((it) =>
      selectedIds.has(it.internalFundsRequestBankId),
    );

    const missingGlAccount = selectedItems.filter(
      (it) => !it.beneficiaryCoaId || it.beneficiaryCoaId === 0,
    );

    if (missingGlAccount.length > 0) {
      const names = [
        ...new Set(missingGlAccount.map((it) => it.beneficiary || "Unknown")),
      ];
      toast({
        variant: "destructive",
        title: "GL Account Missing",
        description: `Cannot release — the following beneficiar${names.length === 1 ? "y has" : "ies have"} no GL Account configured: ${names.join(", ")}. Please set the GL Account in Parties Setup first.`,
        duration: 8000,
      });
      return;
    }

    // ── Pre-validation: bank must be selected ──
    if (!selectedBankId) {
      toast({
        variant: "destructive",
        title: "No Bank Selected",
        description: "Please select a bank before releasing.",
      });
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = {
        fundRequestDetailIds: [...selectedIds],
        bulkIds: totals.masterIds,
        status: "Released",
        headId: selectedBankId,
        anyId: 0,
        anyString: referenceNo.trim(),
        remarks: remarks.trim(),
      };

      console.log(
        "📦 PAY ORDER LETTER PAYLOAD:",
        JSON.stringify(payload, null, 2),
      );

      const res = await fetch(
        `${getBaseUrl()}InternalBankFundsRequestDetail/BulkBankLetterStatusUpdate`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      if (res.status === 401) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please log in again.",
        });
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        let userMessage = `Failed (${res.status})`;
        try {
          const parsed = JSON.parse(errorText);
          if (Array.isArray(parsed)) userMessage = parsed.join("\n");
          else if (parsed.errors)
            userMessage = Object.values(parsed.errors).flat().join(", ");
          else if (parsed.title) userMessage = parsed.title;
          else if (parsed.message) userMessage = parsed.message;
          else if (typeof parsed === "string") userMessage = parsed;
        } catch {
          userMessage = errorText || userMessage;
        }
        throw new Error(userMessage);
      }

      toast({
        title: "Pay Order Letter Created",
        description: `${totals.count} item(s) | ${fmt(totals.totalAmount)}`,
      });

      setSelectedIds(new Set());
      setRemarks("");
      setReferenceNo("");
      setTimeout(() => router.push("/portal/jobs-management/bankletter"), 1500);
      await fetchApprovedItems(selectedBankId);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "";
      const lowerMsg = errMsg.toLowerCase();

      if (lowerMsg.includes("already released")) {
        toast({
          title: "Already Released",
          description:
            "These records were already released on a previous attempt. Redirecting to bank letter.",
        });
        setSelectedIds(new Set());
        setRemarks("");
        setReferenceNo("");
        setTimeout(
          () => router.push("/portal/jobs-management/bankletter"),
          1500,
        );
        fetchApprovedItems(selectedBankId);
      } else {
        console.error("💥 Pay Order Letter error:", error);
        toast({
          variant: "destructive",
          title: "Release Failed",
          description: errMsg || "An unknown error occurred. No records were released.",
          duration: 8000,
        });
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    selectedIds,
    allItems,
    totals,
    selectedBankId,
    referenceNo,
    remarks,
    fetchApprovedItems,
    toast,
  ]);

  // ── Selected bank label ────────────────────────────────────────────────────
  const selectedBankName = useMemo(
    () => banks.find((b) => b.bankId === selectedBankId)?.bankName ?? "",
    [banks, selectedBankId],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto space-y-4'>
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
              <FiFileText className='h-6 w-6 text-purple-600' />
              Bank Pay Order Letter
            </h1>
            <p className='text-sm text-gray-500 mt-0.5'>
              Select approved bank fund requests to create a Pay Order Letter
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchApprovedItems(selectedBankId)}
            disabled={isLoadingItems}
            className='gap-1.5'
          >
            <FiRefreshCw
              className={`h-3.5 w-3.5 ${isLoadingItems ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* ── Filter Card ──────────────────────────────────────────────── */}
        <Card className='border-purple-200 bg-purple-50/30'>
          <CardHeader className='py-3 px-4'>
            <CardTitle className='text-sm font-semibold text-purple-900 flex items-center gap-2'>
              <FiFilter className='h-4 w-4' />
              Filter by Bank
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='flex items-end gap-4'>
              <div className='flex-1 max-w-xs'>
                <Label className='text-xs font-medium text-gray-700 mb-1.5 block'>
                  Bank
                </Label>
                <Select
                  value={selectedBankId?.toString() ?? ""}
                  onValueChange={(v) =>
                    setSelectedBankId(v ? parseInt(v, 10) : null)
                  }
                  disabled={isLoadingBanks}
                >
                  <SelectTrigger className='h-9 bg-white'>
                    <SelectValue
                      placeholder={
                        isLoadingBanks ? "Loading banks..." : "All Banks"
                      }
                    >
                      {selectedBankName || "All Banks"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className='max-h-[300px] w-[320px]'>
                    <div className='sticky top-0 bg-white p-2 border-b z-50'>
                      <div className='relative'>
                        <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                        <Input
                          placeholder='Search banks...'
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          className='pl-7 h-7 text-sm'
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className='max-h-[240px] overflow-y-auto'>
                      <SelectItem value=''>
                        <span className='text-gray-500 italic'>All Banks</span>
                      </SelectItem>
                      {filteredBanks.map((bank) => (
                        <SelectItem
                          key={bank.bankId}
                          value={bank.bankId.toString()}
                        >
                          <div className='flex flex-col'>
                            <span className='font-medium'>{bank.bankName}</span>
                            <span className='text-xs text-gray-500'>
                              {bank.bankCode}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {selectedBankId && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedBankId(null)}
                  className='text-xs text-purple-600 h-9'
                >
                  Clear filter
                </Button>
              )}

              <div className='ml-auto flex items-center gap-2'>
                {isLoadingItems ? (
                  <Badge
                    variant='outline'
                    className='bg-blue-50 border-blue-200 text-blue-700'
                  >
                    <FiLoader className='h-3 w-3 mr-1.5 animate-spin' />
                    Loading...
                  </Badge>
                ) : (
                  <>
                    <Badge
                      variant='outline'
                      className='bg-green-50 border-green-200 text-green-700'
                    >
                      {pendingItems.length} pending
                    </Badge>
                    {releasedItems.length > 0 && (
                      <Badge
                        variant='outline'
                        className='bg-amber-50 border-amber-200 text-amber-700'
                      >
                        {releasedItems.length} released
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Summary bar ──────────────────────────────────────────────── */}
        {totals.count > 0 && (
          <div className='grid grid-cols-3 gap-3'>
            <Card className='border-purple-200'>
              <CardContent className='p-3'>
                <p className='text-xs text-gray-500'>Selected Items</p>
                <p className='text-2xl font-bold text-purple-700'>
                  {totals.count}
                </p>
              </CardContent>
            </Card>
            <Card className='border-purple-200'>
              <CardContent className='p-3'>
                <p className='text-xs text-gray-500'>Total Approved Amount</p>
                <p className='text-lg font-bold text-green-700'>
                  {fmt(totals.totalAmount)}
                </p>
              </CardContent>
            </Card>
            <Card className='border-purple-200'>
              <CardContent className='p-3'>
                <p className='text-xs text-gray-500'>Fund Requests</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {totals.masterIds.length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Main Table ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader className='py-3 px-4 bg-gray-50 border-b'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                <Building2 className='h-4 w-4 text-purple-600' />
                Approved Requests
                {selectedBankId && selectedBankName && (
                  <Badge
                    variant='outline'
                    className='ml-1 text-xs bg-purple-50 text-purple-700 border-purple-200'
                  >
                    {selectedBankName}
                  </Badge>
                )}
              </CardTitle>

              {/* Table search */}
              <div className='relative w-64'>
                <FiSearch className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                <Input
                  placeholder='Search...'
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className='pl-7 h-8 text-sm'
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            {allItems.length === 0 && !isLoadingItems ? (
              <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
                <AlertCircle className='h-10 w-10 mb-3 text-gray-300' />
                <p className='text-sm font-medium'>
                  No approved requests found
                </p>
                <p className='text-xs mt-1'>
                  {selectedBankId
                    ? "Try selecting a different bank or clear the filter."
                    : "There are no approved bank fund requests at this time."}
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      {/* Select-all checkbox */}
                      <TableHead className='w-10 pl-4'>
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label='Select all'
                          className='cursor-pointer'
                          {...(someFilteredSelected
                            ? { "data-state": "indeterminate" }
                            : {})}
                        />
                      </TableHead>
                      <TableHead className='w-8 text-center text-xs'>
                        #
                      </TableHead>
                      <TableHead className='text-xs min-w-[90px]'>
                        Request ID
                      </TableHead>
                      <TableHead className='text-xs min-w-[110px]'>
                        Job Number
                      </TableHead>
                      <TableHead className='text-xs min-w-[200px]'>
                        Head of Account
                      </TableHead>
                      <TableHead className='text-xs min-w-[180px]'>
                        Beneficiary
                      </TableHead>
                      <TableHead className='text-xs min-w-[180px]'>
                        On Account Of
                      </TableHead>
                      <TableHead className='text-xs min-w-[130px]'>
                        Account No
                      </TableHead>
                      <TableHead className='text-xs min-w-[130px] text-right'>
                        Approved Amount
                      </TableHead>
                      {!selectedBankId && (
                        <TableHead className='text-xs min-w-[130px]'>
                          Bank
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {isLoadingItems ? (
                      <TableRow>
                        <TableCell
                          colSpan={selectedBankId ? 9 : 10}
                          className='text-center py-12 text-gray-400'
                        >
                          <FiLoader className='animate-spin inline h-5 w-5 mr-2' />
                          Loading approved requests...
                        </TableCell>
                      </TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={selectedBankId ? 9 : 10}
                          className='text-center py-8 text-gray-400 text-sm'
                        >
                          No items match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredItems.map((item, idx) => {
                          const isChecked = selectedIds.has(
                            item.internalFundsRequestBankId,
                          );
                          return (
                            <TableRow
                              key={item.internalFundsRequestBankId}
                              className={`cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-purple-50 hover:bg-purple-100/70"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                handleSelectItem(
                                  item.internalFundsRequestBankId,
                                  !isChecked,
                                )
                              }
                            >
                              <TableCell
                                className='pl-4'
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleSelectItem(
                                      item.internalFundsRequestBankId,
                                      checked === true,
                                    )
                                  }
                                  aria-label={`Select item ${item.internalFundsRequestBankId}`}
                                />
                              </TableCell>

                              <TableCell className='text-center text-xs text-gray-400'>
                                {idx + 1}
                              </TableCell>

                              <TableCell className='text-xs font-mono text-purple-700'>
                                #{item.bankFundRequestMasterId}
                              </TableCell>

                              <TableCell className='text-xs'>
                                {item.jobNumber || (
                                  <span className='text-gray-400 italic'>
                                    —
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className='text-xs font-medium text-gray-800'>
                                {item.headOfAccount || (
                                  <span className='text-gray-400'>—</span>
                                )}
                              </TableCell>

                              <TableCell className='text-xs text-gray-700'>
                                <span className='flex items-center gap-1'>
                                  <span>{item.beneficiary || <span className='text-gray-400 italic'>—</span>}</span>
                                  {item.beneficiary && (!item.beneficiaryCoaId || item.beneficiaryCoaId === 0) && (
                                    <span className='text-amber-600 text-[10px] font-semibold shrink-0 bg-amber-50 border border-amber-300 rounded px-1'>
                                      ⚠ No GL A/C
                                    </span>
                                  )}
                                </span>
                              </TableCell>

                              <TableCell className='text-xs text-gray-700'>
                                {item.onAccountOfName || (
                                  <span className='text-gray-400 italic'>—</span>
                                )}
                              </TableCell>

                              <TableCell className='text-xs font-mono text-gray-600'>
                                {item.accountNo || (
                                  <span className='text-gray-400 italic'>
                                    —
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className='text-xs text-right font-semibold text-green-700'>
                                {fmt(item.approvedAmount)}
                              </TableCell>

                              {!selectedBankId && (
                                <TableCell className='text-xs text-gray-600'>
                                  {item.bankName || (
                                    <span className='text-gray-400 italic'>
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}

                        {/* ── Released items separator + rows ──────────── */}
                        {filteredReleasedItems.length > 0 && (
                          <>
                            <TableRow className='bg-amber-50/60 border-y border-amber-200'>
                              <TableCell
                                colSpan={selectedBankId ? 8 : 9}
                                className='py-1.5 px-4'
                              >
                                <span className='text-[11px] font-semibold text-amber-700 flex items-center gap-1.5'>
                                  <FiCheckSquare className='h-3.5 w-3.5' />
                                  Already Released (
                                  {filteredReleasedItems.length}) — Bank Letter
                                  Generated
                                </span>
                              </TableCell>
                            </TableRow>

                            {filteredReleasedItems.map((item, idx) => (
                              <TableRow
                                key={`rel-${item.internalFundsRequestBankId}`}
                                className='bg-amber-50/30 opacity-60 cursor-not-allowed'
                              >
                                <TableCell className='pl-4'>
                                  <Checkbox disabled checked={false} />
                                </TableCell>

                                <TableCell className='text-center text-xs text-gray-400'>
                                  {filteredItems.length + idx + 1}
                                </TableCell>

                                <TableCell className='text-xs font-mono text-amber-700'>
                                  <div className='flex items-center gap-1.5'>
                                    #{item.bankFundRequestMasterId}
                                    <Badge className='text-[9px] px-1 py-0 h-4 bg-amber-100 text-amber-700 border border-amber-300 font-normal'>
                                      Released
                                    </Badge>
                                  </div>
                                </TableCell>

                                <TableCell className='text-xs text-gray-500'>
                                  {item.jobNumber || (
                                    <span className='italic'>—</span>
                                  )}
                                </TableCell>

                                <TableCell className='text-xs text-gray-500'>
                                  {item.headOfAccount || (
                                    <span className='italic'>—</span>
                                  )}
                                </TableCell>

                                <TableCell className='text-xs text-gray-500'>
                                  {item.beneficiary || (
                                    <span className='italic'>—</span>
                                  )}
                                </TableCell>

                                <TableCell className='text-xs text-gray-500'>
                                  {item.onAccountOfName || (
                                    <span className='italic'>—</span>
                                  )}
                                </TableCell>

                                <TableCell className='text-xs font-mono text-gray-400'>
                                  {item.accountNo || (
                                    <span className='italic'>—</span>
                                  )}
                                </TableCell>

                                <TableCell className='text-xs text-right text-gray-500 line-through'>
                                  {fmt(item.approvedAmount)}
                                </TableCell>

                                {!selectedBankId && (
                                  <TableCell className='text-xs text-gray-400'>
                                    {item.bankName || (
                                      <span className='italic'>—</span>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Create Pay Order Letter Section ──────────────────────────── */}
        <Card className='border-purple-200'>
          <CardHeader className='py-3 px-4 bg-purple-50 border-b border-purple-100'>
            <CardTitle className='text-sm font-semibold text-purple-900 flex items-center gap-2'>
              <FiFileText className='h-4 w-4' />
              Create Pay Order Letter
              {totals.count > 0 && (
                <Badge className='bg-purple-600 text-white ml-1 text-xs'>
                  {totals.count} item{totals.count !== 1 ? "s" : ""} selected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className='p-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
              {/* Reference Number */}
              <div>
                <Label
                  htmlFor='ref-no'
                  className='text-sm font-medium text-gray-700 mb-1.5 block'
                >
                  Reference Number
                  <span className='ml-1 text-xs text-gray-400 font-normal'>
                    (optional)
                  </span>
                </Label>
                <Input
                  id='ref-no'
                  type='text'
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder='e.g. POL-2026-001'
                  className='h-9 text-sm'
                />
              </div>

              {/* Bank (read-only info) */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-1.5 block'>
                  Bank
                </Label>
                <div className='h-9 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700'>
                  {selectedBankName || (
                    <span className='text-gray-400 italic'>All Banks</span>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className='mb-4'>
              <Label
                htmlFor='pol-remarks'
                className='text-sm font-medium text-gray-700 mb-1.5 block'
              >
                Remarks
                <span className='ml-1 text-xs text-gray-400 font-normal'>
                  (optional)
                </span>
              </Label>
              <Textarea
                id='pol-remarks'
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder='Add any notes about this pay order letter...'
                className='min-h-[72px] text-sm resize-none'
              />
            </div>

            {/* Selection summary + Action */}
            <div className='flex items-center justify-between pt-3 border-t border-purple-100'>
              <div className='text-sm text-gray-600'>
                {totals.count > 0 ? (
                  <span>
                    <strong className='text-purple-700'>{totals.count}</strong>{" "}
                    item{totals.count !== 1 ? "s" : ""} across{" "}
                    <strong className='text-blue-700'>
                      {totals.masterIds.length}
                    </strong>{" "}
                    request{totals.masterIds.length !== 1 ? "s" : ""} —{" "}
                    <strong className='text-green-700'>
                      {fmt(totals.totalAmount)}
                    </strong>
                  </span>
                ) : (
                  <span className='text-gray-400'>
                    No items selected. Check rows in the table above.
                  </span>
                )}
              </div>

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedIds(new Set())}
                  disabled={totals.count === 0 || isSubmitting}
                  className='text-xs'
                >
                  Clear Selection
                </Button>

                <Button
                  onClick={handleCreatePayOrder}
                  disabled={totals.count === 0 || isSubmitting}
                  className='bg-purple-600 hover:bg-purple-700 text-white gap-2'
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className='h-4 w-4 animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiFileText className='h-4 w-4' />
                      Create Pay Order Letter
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
