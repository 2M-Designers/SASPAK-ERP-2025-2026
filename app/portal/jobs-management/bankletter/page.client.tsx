"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getAuthHeaders, getBaseUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiEye,
  FiPrinter,
  FiSearch,
  FiX,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BankLetterDetail = {
  bankLetterDetailId: number;
  bankLetterId: number;
  internalBankFundRequestId: number | null;
  externalBankFundRequestId: number | null;
  amount: number;
  toPartyId: number;
  toPartyName: string;
  version: number;
};

type BankLetter = {
  bankLetterId: number;
  bankId: number;
  bankName?: string;
  totalNoOfRequests: number;
  totalAmount: number;
  transactionNo: string;
  letterMode: string;
  isFinalized: boolean;
  createdAt?: string;
  createdBy?: number;
  version: number;
  bankLetterDetails: BankLetterDetail[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(n);

const formatDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

// ─── Component ──────────────────────────────────────────────────────────────────

export default function BankLetterClient() {
  const [data, setData] = useState<BankLetter[]>([]);
  const [banksMap, setBanksMap] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BankLetter | null>(null);

  const [editForm, setEditForm] = useState({
    transactionNo: "",
    letterMode: "",
    isFinalized: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { toast } = useToast();

  // ── Fetch banks map ──────────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}Banks/GetList`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            select: "BankId, BankName",
            where: "",
            sortOn: "BankName ASC",
            page: "1",
            pageSize: "5000",
          }),
        });
        if (!res.ok) return;
        const raw = await res.json();
        const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.items ?? [];
        const map = new Map<number, string>();
        list.forEach((b: any) =>
          map.set(b.bankId ?? b.BankId, b.bankName ?? b.BankName ?? ""),
        );
        setBanksMap(map);
      } catch {
        /* silent */
      }
    };
    run();
  }, []);

  // ── Fetch list ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}BankLetter/GetList`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          select:
            "BankLetterId, BankId, TotalNoOfRequests, TotalAmount, TransactionNo, LetterMode, IsFinalized, CreatedAt, CreatedBy, Version",
          where: "",
          sortOn: "BankLetterId DESC",
          page: "1",
          pageSize: "2000",
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.items ?? [];
      setData(
        list.map((r: any) => ({
          bankLetterId: r.bankLetterId ?? r.BankLetterId,
          bankId: r.bankId ?? r.BankId,
          totalNoOfRequests:
            r.totalNoOfRequests ?? r.TotalNoOfRequests ?? 0,
          totalAmount: Number(r.totalAmount ?? r.TotalAmount) || 0,
          transactionNo: r.transactionNo ?? r.TransactionNo ?? "",
          letterMode: r.letterMode ?? r.LetterMode ?? "",
          isFinalized: r.isFinalized ?? r.IsFinalized ?? false,
          createdAt: r.createdAt ?? r.CreatedAt,
          createdBy: r.createdBy ?? r.CreatedBy,
          version: r.version ?? r.Version ?? 0,
          bankLetterDetails: [],
        })),
      );
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bank letters",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Fetch full record ────────────────────────────────────────────────────────
  const fetchFullRecord = useCallback(
    async (id: number): Promise<BankLetter | null> => {
      try {
        const res = await fetch(`${getBaseUrl()}BankLetter/${id}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();
        const bankId = d.bankId ?? d.BankId;
        return {
          bankLetterId: d.bankLetterId ?? d.BankLetterId,
          bankId,
          bankName:
            d.bank?.bankName ??
            d.bankName ??
            banksMap.get(bankId) ??
            "",
          totalNoOfRequests: d.totalNoOfRequests ?? 0,
          totalAmount: Number(d.totalAmount) || 0,
          transactionNo: d.transactionNo ?? "",
          letterMode: d.letterMode ?? "",
          isFinalized: d.isFinalized ?? false,
          createdAt: d.createdAt,
          createdBy: d.createdBy,
          version: d.version ?? 0,
          bankLetterDetails: Array.isArray(d.bankLetterDetails)
            ? d.bankLetterDetails.map((det: any) => ({
                bankLetterDetailId: det.bankLetterDetailId ?? 0,
                bankLetterId: det.bankLetterId ?? id,
                internalBankFundRequestId:
                  det.internalBankFundRequestId ?? null,
                externalBankFundRequestId:
                  det.externalBankFundRequestId ?? null,
                amount: Number(det.amount) || 0,
                toPartyId: det.toPartyId ?? 0,
                toPartyName:
                  det.toPartyName ??
                  det.toParty?.partyName ??
                  "",
                version: det.version ?? 0,
              }))
            : [],
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    [banksMap],
  );

  // ── View ─────────────────────────────────────────────────────────────────────
  const handleView = useCallback(
    async (record: BankLetter) => {
      const full = await fetchFullRecord(record.bankLetterId);
      if (!full) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load record",
        });
        return;
      }
      setSelectedRecord(full);
      setViewDialogOpen(true);
    },
    [fetchFullRecord, toast],
  );

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = useCallback(
    async (record: BankLetter) => {
      const full = await fetchFullRecord(record.bankLetterId);
      if (!full) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load record",
        });
        return;
      }
      setSelectedRecord(full);
      setEditForm({
        transactionNo: full.transactionNo,
        letterMode: full.letterMode,
        isFinalized: full.isFinalized,
      });
      setEditDialogOpen(true);
    },
    [fetchFullRecord, toast],
  );

  const handleEditSave = useCallback(async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const payload = {
        ...selectedRecord,
        transactionNo: editForm.transactionNo,
        letterMode: editForm.letterMode,
        isFinalized: editForm.isFinalized,
      };
      const res = await fetch(`${getBaseUrl()}BankLetter`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `${res.status}`);
      }
      toast({ title: "Updated", description: "Bank letter updated successfully" });
      setEditDialogOpen(false);
      fetchData();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedRecord, editForm, fetchData, toast]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(
    (record: BankLetter) => {
      setSelectedRecord(record);
      setDeleteDialogOpen(true);
    },
    [],
  );

  const handleDelete = useCallback(async () => {
    if (!selectedRecord) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${getBaseUrl()}BankLetter/${selectedRecord.bankLetterId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      toast({ title: "Deleted", description: "Bank letter deleted" });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRecord, fetchData, toast]);

  // ── Print ─────────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(
    async (record: BankLetter) => {
      setIsPrinting(true);
      try {
        const full = await fetchFullRecord(record.bankLetterId);
        if (!full) throw new Error("Failed to load record");

        const bankName =
          full.bankName || banksMap.get(full.bankId) || "—";
        const doc = new jsPDF();

        // ── Title ──
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("PAY ORDER LETTER", 105, 18, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("SASPAK Cargo & Logistics", 105, 25, { align: "center" });
        doc.setTextColor(0);

        // ── Meta info ──
        doc.setFontSize(10);
        const leftX = 14;
        const rightX = 120;
        let y = 38;

        doc.setFont("helvetica", "bold");
        doc.text("Transaction No:", leftX, y);
        doc.setFont("helvetica", "normal");
        doc.text(full.transactionNo || "—", leftX + 38, y);

        doc.setFont("helvetica", "bold");
        doc.text("Date:", rightX, y);
        doc.setFont("helvetica", "normal");
        doc.text(
          full.createdAt
            ? moment(full.createdAt).format("DD-MMM-YYYY")
            : "—",
          rightX + 14,
          y,
        );

        y += 8;
        doc.setFont("helvetica", "bold");
        doc.text("Bank:", leftX, y);
        doc.setFont("helvetica", "normal");
        doc.text(bankName, leftX + 14, y);

        doc.setFont("helvetica", "bold");
        doc.text("Letter Mode:", rightX, y);
        doc.setFont("helvetica", "normal");
        doc.text(full.letterMode || "—", rightX + 30, y);

        y += 8;
        doc.setFont("helvetica", "bold");
        doc.text("Status:", leftX, y);
        doc.setFont("helvetica", "normal");
        doc.text(full.isFinalized ? "Finalized" : "Draft", leftX + 18, y);

        // ── Details table ──
        autoTable(doc, {
          startY: y + 12,
          head: [["#", "Beneficiary / To Party", "Ref (Fund Req ID)", "Amount (PKR)"]],
          body: full.bankLetterDetails.map((d, i) => [
            i + 1,
            d.toPartyName || `Party #${d.toPartyId}`,
            d.internalBankFundRequestId
              ? `FR-${d.internalBankFundRequestId}`
              : d.externalBankFundRequestId
              ? `EFR-${d.externalBankFundRequestId}`
              : "—",
            new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(d.amount),
          ]),
          foot: [
            [
              "",
              "",
              "Total",
              new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(full.totalAmount),
            ],
          ],
          styles: { fontSize: 9 },
          headStyles: { fillColor: [41, 98, 181] },
          footStyles: { fontStyle: "bold", fillColor: [240, 240, 240] },
          columnStyles: { 3: { halign: "right" } },
        });

        // ── Signature lines ──
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(9);
        doc.line(14, finalY, 75, finalY);
        doc.line(130, finalY, 196, finalY);
        doc.text("Authorized Signatory", 14, finalY + 5);
        doc.text("Accounts Manager", 130, finalY + 5);

        doc.save(
          `BankLetter_${full.transactionNo || full.bankLetterId}.pdf`,
        );
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Print Failed",
          description: e instanceof Error ? e.message : "Unknown error",
        });
      } finally {
        setIsPrinting(false);
      }
    },
    [fetchFullRecord, banksMap, toast],
  );

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const q = searchText.toLowerCase();
    return data.filter(
      (r) =>
        r.transactionNo?.toLowerCase().includes(q) ||
        (banksMap.get(r.bankId) ?? "").toLowerCase().includes(q) ||
        r.letterMode?.toLowerCase().includes(q),
    );
  }, [data, searchText, banksMap]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className='p-4 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto space-y-4'>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
              <FiFileText className='h-6 w-6 text-blue-600' />
              Bank Letters
            </h1>
            <p className='text-sm text-gray-500 mt-0.5'>
              View, edit, and print generated bank pay order letters
            </p>
          </div>
          <Button
            onClick={fetchData}
            variant='outline'
            size='sm'
            disabled={isLoading}
            className='flex items-center gap-1.5'
          >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Search + count */}
        <Card>
          <CardContent className='pt-4 pb-3 px-4'>
            <div className='flex items-center gap-3'>
              <div className='relative flex-1 max-w-sm'>
                <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by transaction no, bank, or mode…'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-9 pr-8'
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText("")}
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    <FiX className='h-4 w-4' />
                  </button>
                )}
              </div>
              <span className='text-sm text-gray-500'>
                {filteredData.length} letter{filteredData.length !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className='pt-0 px-0 pb-0 overflow-x-auto'>
            {isLoading ? (
              <div className='flex items-center justify-center py-16 text-gray-400'>
                <FiRefreshCw className='h-5 w-5 animate-spin mr-2' />
                Loading…
              </div>
            ) : filteredData.length === 0 ? (
              <div className='text-center py-16 text-gray-400 text-sm'>
                No bank letters found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='w-[40px]'>#</TableHead>
                    <TableHead>Transaction No</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Letter Mode</TableHead>
                    <TableHead className='text-right'>Total Amount</TableHead>
                    <TableHead className='text-center'>Requests</TableHead>
                    <TableHead className='text-center'>Finalized</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className='text-center w-[140px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, idx) => (
                    <TableRow key={row.bankLetterId} className='hover:bg-gray-50'>
                      <TableCell className='text-xs text-gray-500'>
                        {idx + 1}
                      </TableCell>
                      <TableCell className='font-mono font-semibold text-sm text-blue-700'>
                        {row.transactionNo || `#${row.bankLetterId}`}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {banksMap.get(row.bankId) || `Bank #${row.bankId}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className='text-xs'>
                          {row.letterMode || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-medium text-sm'>
                        {fmt(row.totalAmount)}
                      </TableCell>
                      <TableCell className='text-center text-sm'>
                        {row.totalNoOfRequests}
                      </TableCell>
                      <TableCell className='text-center'>
                        {row.isFinalized ? (
                          <FiCheckCircle className='h-4 w-4 text-green-600 mx-auto' />
                        ) : (
                          <FiXCircle className='h-4 w-4 text-gray-300 mx-auto' />
                        )}
                      </TableCell>
                      <TableCell className='text-xs text-gray-500'>
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center justify-center gap-1'>
                          <button
                            onClick={() => handleView(row)}
                            className='p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700'
                            title='View'
                          >
                            <FiEye className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => handleEdit(row)}
                            className='p-1.5 rounded hover:bg-yellow-50 text-yellow-600 hover:text-yellow-700'
                            title='Edit'
                          >
                            <FiEdit className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => handlePrint(row)}
                            disabled={isPrinting}
                            className='p-1.5 rounded hover:bg-purple-50 text-purple-600 hover:text-purple-700 disabled:opacity-40'
                            title='Print PDF'
                          >
                            <FiPrinter className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(row)}
                            className='p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700'
                            title='Delete'
                          >
                            <FiTrash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── View Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEye className='h-5 w-5' />
              Bank Letter Details
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.transactionNo || `ID: ${selectedRecord?.bankLetterId}`}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className='space-y-4'>
              <Card>
                <CardHeader className='py-3 px-4 bg-blue-50'>
                  <CardTitle className='text-sm font-medium'>
                    Master Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-3 px-4 pb-3'>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    {[
                      ["Transaction No", selectedRecord.transactionNo || "—"],
                      ["Bank", selectedRecord.bankName || banksMap.get(selectedRecord.bankId) || `Bank #${selectedRecord.bankId}`],
                      ["Letter Mode", selectedRecord.letterMode || "—"],
                      ["Status", selectedRecord.isFinalized ? "Finalized" : "Draft"],
                      ["Total Amount", fmt(selectedRecord.totalAmount)],
                      ["No. of Requests", String(selectedRecord.totalNoOfRequests)],
                      ["Created At", formatDate(selectedRecord.createdAt)],
                    ].map(([label, value]) => (
                      <div key={label} className='flex justify-between'>
                        <span className='text-gray-600'>{label}:</span>
                        <span className='font-medium text-right'>{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='py-3 px-4 bg-gray-50'>
                  <CardTitle className='text-sm font-medium'>
                    Details ({selectedRecord.bankLetterDetails.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-3 px-4 pb-3'>
                  {selectedRecord.bankLetterDetails.length ? (
                    <div className='border rounded-lg overflow-hidden overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow className='bg-gray-50'>
                            <TableHead className='w-[40px]'>#</TableHead>
                            <TableHead>To Party</TableHead>
                            <TableHead>Fund Request Ref</TableHead>
                            <TableHead className='text-right'>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRecord.bankLetterDetails.map((d, i) => (
                            <TableRow key={d.bankLetterDetailId || i}>
                              <TableCell className='text-xs'>{i + 1}</TableCell>
                              <TableCell className='text-sm font-medium'>
                                {d.toPartyName || `Party #${d.toPartyId}`}
                              </TableCell>
                              <TableCell className='text-xs text-gray-500'>
                                {d.internalBankFundRequestId
                                  ? `FR-${d.internalBankFundRequestId}`
                                  : d.externalBankFundRequestId
                                  ? `EFR-${d.externalBankFundRequestId}`
                                  : "—"}
                              </TableCell>
                              <TableCell className='text-sm font-medium text-right'>
                                {fmt(d.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-400 text-center py-4'>
                      No detail lines
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                if (selectedRecord) handlePrint(selectedRecord);
              }}
              className='flex items-center gap-1.5'
            >
              <FiPrinter className='h-4 w-4' />
              Print PDF
            </Button>
            <Button variant='outline' onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FiEdit className='h-5 w-5' />
              Edit Bank Letter
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.transactionNo || `ID: ${selectedRecord?.bankLetterId}`}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label>Transaction No</Label>
              <Input
                value={editForm.transactionNo}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, transactionNo: e.target.value }))
                }
                placeholder='e.g. BPL-120626/0001'
              />
            </div>
            <div className='space-y-1.5'>
              <Label>Letter Mode</Label>
              <Input
                value={editForm.letterMode}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, letterMode: e.target.value }))
                }
                placeholder='e.g. PMT'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='isFinalized'
                checked={editForm.isFinalized}
                onCheckedChange={(checked) =>
                  setEditForm((p) => ({
                    ...p,
                    isFinalized: checked === true,
                  }))
                }
              />
              <Label htmlFor='isFinalized'>Mark as Finalized</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <FiTrash2 className='h-5 w-5' />
              Delete Bank Letter
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {selectedRecord?.transactionNo ||
                  `Bank Letter #${selectedRecord?.bankLetterId}`}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
