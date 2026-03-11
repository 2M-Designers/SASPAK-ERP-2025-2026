import React, { useState, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DetentionRecord {
  jobEquipmentDetentionDetailId?: number;
  jobId?: number;
  containerNumber: string;
  containerTypeId?: number;
  containerSizeId?: number;
  netWeight: number;
  transporterPartyId?: number;
  emptyDate?: string;
  eirReceivedOn?: string;
  condition?: string;
  rentDays: number;
  rentAmountFc: number;
  exchangeRate: number;
  rentAmountLc: number;
  damage: string;
  dirty: string;
  version?: number;
}

interface DispatchRecord {
  jobEquipmentHandingOverId?: number;
  jobId?: number;
  containerNumber: string;
  containerTypeId?: number;
  containerSizeId?: number;
  netWeight: number;
  transporterPartyId?: number;
  destinationLocationId?: number;
  containerReturnTerminalId?: number;
  buyingAmountLc: number;
  topayAmountLc: number;
  dispatchDate: string;
  version?: number;
}

interface PartyOption {
  value: number;
  label: string;
}

interface ContainerOption {
  value: number;
  label: string;
}

// ─── Condition options (single source of truth) ───────────────────────────────
const CONDITION_OPTIONS = ["Good", "Fair", "Poor", "Damaged", "Dirty"];

/**
 * Normalize a condition string from the API to exactly match one of
 * CONDITION_OPTIONS, regardless of casing / extra whitespace.
 * Returns "" if no match found (shows placeholder instead of broken value).
 */
const normalizeCondition = (raw: string | null | undefined): string => {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // 1. Exact match — fastest path
  if (CONDITION_OPTIONS.includes(trimmed)) return trimmed;

  // 2. Case-insensitive exact match
  const lower = trimmed.toLowerCase();
  const exact = CONDITION_OPTIONS.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;

  // 3. Starts-with match (handles truncation e.g. "Goo" → "Good")
  const partial = CONDITION_OPTIONS.find(
    (o) =>
      o.toLowerCase().startsWith(lower) || lower.startsWith(o.toLowerCase()),
  );
  if (partial) return partial;

  // Nothing matched — log for debugging, return "" to show placeholder
  console.warn(
    `[DetentionTab] Unrecognized condition value from API: "${trimmed}"`,
  );
  return "";
};

export default function DetentionTab({
  form,
  fclContainers = [],
  containerTypes = [],
  containerSizes = [],
  detentionRecords = [],
  setDetentionRecords,
  toast,
  dispatchRecords = [],
  parties = [],
}: any) {
  // ─── advanceRentPaidUpto: fully controlled via form (no separate local state)
  // form.watch keeps the input populated correctly in edit mode.
  const uptoDateValue: string = form.watch("advanceRentPaidUpto") || "";

  // ─── Transporter helpers ─────────────────────────────────────────────────────
  const getTransporterNameForContainer = (containerNumber: string): string => {
    if (!dispatchRecords?.length || !parties?.length) return "";
    const rec = dispatchRecords.find(
      (r: DispatchRecord) => r.containerNumber === containerNumber,
    );
    if (!rec?.transporterPartyId) return "";
    return (
      parties.find((p: PartyOption) => p.value === rec.transporterPartyId)
        ?.label || ""
    );
  };

  const getTransporterIdForContainer = (containerNumber: string): number => {
    if (!dispatchRecords?.length) return 0;
    const rec = dispatchRecords.find(
      (r: DispatchRecord) => r.containerNumber === containerNumber,
    );
    return rec?.transporterPartyId || 0;
  };

  // ─── Auto-add new containers from Shipping tab ───────────────────────────────
  useEffect(() => {
    if (!fclContainers.length) return;
    const existingNos = new Set(
      detentionRecords.map((r: DetentionRecord) => r.containerNumber),
    );
    const newRecords = fclContainers
      .filter((c: any) => !existingNos.has(c.containerNo))
      .map((c: any) => ({
        containerNumber: c.containerNo,
        containerTypeId: c.containerTypeId,
        containerSizeId: c.containerSizeId,
        netWeight: c.tareWeight || 0,
        transporterPartyId: getTransporterIdForContainer(c.containerNo),
        emptyDate: "",
        eirReceivedOn: "",
        condition: "",
        rentDays: 0,
        rentAmountFc: 0,
        exchangeRate: 0,
        rentAmountLc: 0,
        damage: "",
        dirty: "",
      }));

    if (newRecords.length > 0) {
      setDetentionRecords([...detentionRecords, ...newRecords]);
    }
  }, [fclContainers]);

  // ─── Sync transporter IDs when dispatch records arrive ───────────────────────
  useEffect(() => {
    if (!detentionRecords.length || !dispatchRecords.length) return;
    const updated = detentionRecords.map((r: DetentionRecord) => {
      const id = getTransporterIdForContainer(r.containerNumber);
      return id && !r.transporterPartyId ? { ...r, transporterPartyId: id } : r;
    });
    setDetentionRecords(updated);
  }, [dispatchRecords]);

  // ─── Recalculate balance from form values ────────────────────────────────────
  const recalculateBalance = () => {
    const total = form.getValues("detentionTotalPayable") || 0;
    const deposit = form.getValues("detentionDepositAmount") || 0;
    const advance = form.getValues("detentionAdvanceRentPaid") || 0;
    form.setValue(
      "detentionBalanceReceivable",
      parseFloat((total - deposit - advance).toFixed(2)),
      { shouldDirty: true },
    );
  };

  // Auto-sync total payable whenever detention rows change
  useEffect(() => {
    const total = detentionRecords.reduce(
      (s: number, r: DetentionRecord) => s + (r.rentAmountLc || 0),
      0,
    );
    form.setValue("detentionTotalPayable", parseFloat(total.toFixed(2)), {
      shouldDirty: true,
    });
    recalculateBalance();
  }, [detentionRecords]);

  // ─── Update a single detention row field ─────────────────────────────────────
  const updateDetentionRecord = (
    index: number,
    field: keyof DetentionRecord,
    value: any,
  ) => {
    const updated = [...detentionRecords];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "emptyDate" && uptoDateValue) {
      updated[index].rentDays = calculateRentDays(value, uptoDateValue);
    }

    if (field === "rentAmountFc" || field === "exchangeRate") {
      const usd =
        field === "rentAmountFc" ? value : updated[index].rentAmountFc || 0;
      const rate =
        field === "exchangeRate" ? value : updated[index].exchangeRate || 0;
      updated[index].rentAmountLc = parseFloat((usd * rate).toFixed(2));
    }

    setDetentionRecords(updated);
  };

  const calculateRentDays = (emptyDate: string, upto: string): number => {
    if (!emptyDate || !upto) return 0;
    try {
      const diff = new Date(upto).getTime() - new Date(emptyDate).getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return 0;
    }
  };

  // ─── Upto Date handler — persists to form AND recalculates rent days ─────────
  const handleUptoDateChange = (newDate: string) => {
    // ✅ Write directly into form field so it saves to DB
    form.setValue("advanceRentPaidUpto", newDate, { shouldDirty: true });

    if (newDate) {
      const updated = detentionRecords.map((r: DetentionRecord) =>
        r.emptyDate
          ? { ...r, rentDays: calculateRentDays(r.emptyDate, newDate) }
          : r,
      );
      setDetentionRecords(updated);
    }
  };

  // ─── Label helpers ────────────────────────────────────────────────────────────
  const getContainerTypeLabel = (id?: number) =>
    containerTypes.find((t: ContainerOption) => t.value === id)?.label || "";

  const getContainerSizeLabel = (id?: number) =>
    containerSizes.find((s: ContainerOption) => s.value === id)?.label || "";

  // ─── Aggregates ───────────────────────────────────────────────────────────────
  const totalRentUsd = detentionRecords.reduce(
    (s: number, r: DetentionRecord) => s + (r.rentAmountFc || 0),
    0,
  );
  const totalRentPkr = detentionRecords.reduce(
    (s: number, r: DetentionRecord) => s + (r.rentAmountLc || 0),
    0,
  );

  const depositAmount = form.watch("detentionDepositAmount") || 0;
  const advanceRent = form.watch("detentionAdvanceRentPaid") || 0;
  const totalPayable = form.watch("detentionTotalPayable") || 0;
  const balanceReceivable = form.watch("detentionBalanceReceivable") || 0;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <TabsContent value='detention' className='space-y-4'>
      {/* Header Card */}
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <CardTitle className='text-base text-center'>
            Container Detention Details
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          <div className='bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-5 w-5 text-blue-600 mt-0.5 shrink-0' />
              <div>
                <h3 className='font-semibold text-blue-900 mb-1'>
                  Container Detention Management (FCL Only)
                </h3>
                <p className='text-sm text-blue-700'>
                  Track container detention charges, deposits, and refunds. Grid
                  auto-populates from containers in Shipping Tab.
                  <span className='font-semibold ml-1'>
                    Transport field is pre-filled from Dispatch Tab.
                  </span>
                  <br />
                  <DollarSign className='inline h-4 w-4 mr-1' />
                  <span className='font-semibold'>
                    Rent amounts are in USD. Enter exchange rate to
                    auto-calculate PKR amounts.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Master fields — all wired to form */}
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
            {/* Depositor — native select so value always displays after async load */}
            <div className='space-y-2'>
              <Label htmlFor='depositorPartyId'>Depositor</Label>
              <select
                id='depositorPartyId'
                value={form.watch("depositorPartyId") || ""}
                onChange={(e) =>
                  form.setValue(
                    "depositorPartyId",
                    e.target.value ? parseInt(e.target.value, 10) : 0,
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
                className='h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
              >
                <option value=''>Select Depositor</option>
                {parties
                  .filter((p: PartyOption) => p.value && p.label)
                  .map((p: PartyOption) => (
                    <option key={p.value} value={String(p.value)}>
                      {p.label}
                    </option>
                  ))}
              </select>
              {form.watch("depositorPartyId") > 0 && (
                <p className='text-xs text-green-600'>
                  ✅{" "}
                  {parties.find(
                    (p: PartyOption) =>
                      p.value === form.watch("depositorPartyId"),
                  )?.label || "Selected"}
                </p>
              )}
            </div>

            {/* Deposit Amount */}
            <div className='space-y-2'>
              <Label>Deposit Amount (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                placeholder='0.00'
                {...form.register("detentionDepositAmount", {
                  valueAsNumber: true,
                  onChange: () => recalculateBalance(),
                })}
              />
            </div>

            {/* Advance Rent */}
            <div className='space-y-2'>
              <Label>Advance Rent (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                placeholder='0.00'
                {...form.register("detentionAdvanceRentPaid", {
                  valueAsNumber: true,
                  onChange: () => recalculateBalance(),
                })}
              />
            </div>

            {/* Total Payable — read-only, auto-calculated */}
            <div className='space-y-2'>
              <Label>Total Payable (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                placeholder='0.00'
                className='bg-green-50 font-semibold'
                readOnly
                {...form.register("detentionTotalPayable", {
                  valueAsNumber: true,
                })}
              />
              <p className='text-xs text-green-600'>Auto-calculated</p>
            </div>

            {/* Balance Receivable — read-only, auto-calculated */}
            <div className='space-y-2'>
              <Label>Balance Receivable (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                placeholder='0.00'
                className='bg-blue-50 font-bold'
                readOnly
                {...form.register("detentionBalanceReceivable", {
                  valueAsNumber: true,
                })}
              />
              <p className='text-xs text-blue-600'>Auto-calculated</p>
            </div>
          </div>

          {/*
            ✅ Upto Date — fully controlled via form.watch / form.setValue.
            NO separate local state. This ensures:
            - Edit mode populates correctly when form.reset() fires
            - The value is persisted to DB via advanceRentPaidUpto
          */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='advanceRentPaidUpto'>Upto Date</Label>
              <Input
                id='advanceRentPaidUpto'
                type='date'
                value={uptoDateValue}
                onChange={(e) => handleUptoDateChange(e.target.value)}
              />
              <p className='text-xs text-gray-500'>
                Auto-calculates rent days for all containers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detention Records Table */}
      <Card>
        <CardHeader className='py-3 px-4 border-b'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Container Detention Grid</h3>
            <Badge variant='outline'>
              {detentionRecords.length} Container(s)
            </Badge>
          </div>
          {fclContainers.length === 0 && (
            <p className='text-sm text-amber-600 mt-2'>
              ⚠️ No containers found. Add containers in Shipping Tab first.
            </p>
          )}
          {dispatchRecords.length > 0 && (
            <p className='text-sm text-green-600 mt-2'>
              ✅ Transport field pre-filled from Dispatch Tab selections
            </p>
          )}
        </CardHeader>
        <CardContent className='p-0'>
          {detentionRecords.length === 0 ? (
            <div className='p-8 text-center text-gray-500'>
              <Info className='h-12 w-12 mx-auto mb-4 text-gray-400' />
              <p className='text-lg font-medium mb-2'>No Containers</p>
              <p className='text-sm'>
                Add containers in Shipping Tab to track detention details
              </p>
            </div>
          ) : (
            <>
              <style jsx>{`
                .detention-table-wrapper::-webkit-scrollbar {
                  width: 14px;
                  height: 14px;
                }
                .detention-table-wrapper::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 10px;
                }
                .detention-table-wrapper::-webkit-scrollbar-thumb {
                  background: #888;
                  border-radius: 10px;
                  border: 3px solid #f1f1f1;
                }
                .detention-table-wrapper::-webkit-scrollbar-thumb:hover {
                  background: #555;
                }
                .detention-table-wrapper::-webkit-scrollbar-corner {
                  background: #f1f1f1;
                }
                .detention-table-wrapper {
                  scrollbar-width: thick;
                  scrollbar-color: #888 #f1f1f1;
                }
              `}</style>

              <div className='overflow-x-auto detention-table-wrapper max-h-[600px]'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='w-[50px] sticky left-0 bg-gray-50 z-20'>
                        #
                      </TableHead>
                      <TableHead className='min-w-[140px]'>
                        Container No.
                      </TableHead>
                      <TableHead className='min-w-[90px]'>Type</TableHead>
                      <TableHead className='min-w-[80px]'>Size</TableHead>
                      <TableHead className='min-w-[110px]'>
                        Weight (kg)
                      </TableHead>
                      <TableHead className='min-w-[180px]'>Transport</TableHead>
                      <TableHead className='min-w-[150px]'>
                        Empty Date
                      </TableHead>
                      <TableHead className='min-w-[150px]'>
                        EIR Received
                      </TableHead>
                      <TableHead className='min-w-[160px]'>Condition</TableHead>
                      <TableHead className='min-w-[100px] text-right'>
                        Rent Days
                      </TableHead>
                      <TableHead className='min-w-[140px] text-right bg-blue-50'>
                        Rent (USD)
                      </TableHead>
                      <TableHead className='min-w-[140px] text-right bg-blue-50'>
                        Exch. Rate
                      </TableHead>
                      <TableHead className='min-w-[140px] text-right bg-green-50'>
                        Rent (PKR)
                      </TableHead>
                      <TableHead className='min-w-[150px]'>Damage</TableHead>
                      <TableHead className='min-w-[150px]'>Dirty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detentionRecords.map(
                      (record: DetentionRecord, index: number) => {
                        /*
                          ✅ CONDITION FIX — two-part approach:
                          1. normalizeCondition() maps any casing the API sends
                             ("good", "GOOD", "Good") to the exact SelectItem value.
                          2. key prop includes the raw condition value so Radix UI
                             Select fully remounts when async data arrives, preventing
                             the "Select condition" placeholder staying stuck.
                        */
                        const normalizedCondition = normalizeCondition(
                          record.condition,
                        );

                        return (
                          <TableRow key={index} className='hover:bg-gray-50'>
                            <TableCell className='font-medium sticky left-0 bg-white z-10'>
                              {index + 1}
                            </TableCell>

                            <TableCell className='font-mono text-sm'>
                              {record.containerNumber}
                            </TableCell>

                            <TableCell>
                              {getContainerTypeLabel(record.containerTypeId)}
                            </TableCell>

                            <TableCell>
                              {getContainerSizeLabel(record.containerSizeId)}
                            </TableCell>

                            <TableCell className='text-right'>
                              {record.netWeight?.toFixed(2) || "0.00"}
                            </TableCell>

                            <TableCell>
                              <Input
                                className='h-9 bg-gray-50'
                                value={
                                  getTransporterNameForContainer(
                                    record.containerNumber,
                                  ) || "Not assigned"
                                }
                                readOnly
                                title='Assign transporter in Dispatch Tab'
                              />
                            </TableCell>

                            <TableCell>
                              <Input
                                type='date'
                                className='h-9'
                                value={record.emptyDate || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "emptyDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <Input
                                type='date'
                                className='h-9'
                                value={record.eirReceivedOn || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "eirReceivedOn",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>

                            {/*
                              ✅ CONDITION — native <select> instead of Radix UI.
                              Radix UI Select silently ignores value changes that
                              happen after the initial mount in table rows, so the
                              trigger label stays stuck on the placeholder even when
                              `value` is correct. A native select is always a
                              controlled component: whatever `value` is, that's
                              exactly what the user sees — no remount tricks needed.
                            */}
                            <TableCell>
                              <select
                                value={normalizedCondition}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "condition",
                                    e.target.value,
                                  )
                                }
                                className='h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                              >
                                <option value=''>Select condition</option>
                                {CONDITION_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </TableCell>

                            <TableCell className='text-right'>
                              <Input
                                type='number'
                                className='h-9 text-right'
                                value={record.rentDays || 0}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "rentDays",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className='bg-blue-50'>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9 text-right font-semibold'
                                placeholder='0.00'
                                value={record.rentAmountFc || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "rentAmountFc",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className='bg-blue-50'>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9 text-right'
                                placeholder='0.00'
                                value={record.exchangeRate || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "exchangeRate",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className='bg-green-50'>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9 text-right bg-green-50 font-bold'
                                value={
                                  record.rentAmountLc?.toFixed(2) || "0.00"
                                }
                                readOnly
                                title='Auto-calculated: USD Rent × Exchange Rate'
                              />
                            </TableCell>

                            <TableCell>
                              <Input
                                type='text'
                                className='h-9'
                                placeholder='e.g., Scratched on side'
                                value={record.damage || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "damage",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <Input
                                type='text'
                                className='h-9'
                                placeholder='e.g., Oil stains'
                                value={record.dirty || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "dirty",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Summary Footer */}
          {detentionRecords.length > 0 && (
            <div className='p-4 border-t bg-gray-50'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4'>
                <div>
                  <span className='text-gray-600'>Total Containers:</span>{" "}
                  <span className='font-semibold'>
                    {detentionRecords.length}
                  </span>
                </div>
                <div className='bg-blue-50 p-2 rounded'>
                  <span className='text-blue-900'>Total Rent (USD):</span>{" "}
                  <span className='font-bold text-blue-900'>
                    ${totalRentUsd.toFixed(2)}
                  </span>
                </div>
                <div className='bg-green-50 p-2 rounded'>
                  <span className='text-green-900'>Total Rent (PKR):</span>{" "}
                  <span className='font-bold text-green-900'>
                    PKR{" "}
                    {totalRentPkr.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className='bg-white p-4 rounded border'>
                <h4 className='font-semibold mb-3'>Financial Summary (PKR)</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <div className='text-gray-600'>Total Rent Payable:</div>
                    <div className='font-semibold'>
                      PKR{" "}
                      {Number(totalPayable).toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className='text-gray-600'>Security Deposit:</div>
                    <div className='font-semibold'>
                      PKR{" "}
                      {Number(depositAmount).toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className='text-gray-600'>Advance Rent:</div>
                    <div className='font-semibold'>
                      PKR{" "}
                      {Number(advanceRent).toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className='bg-blue-50 p-2 rounded'>
                    <div className='text-blue-900 font-medium'>
                      Balance Receivable:
                    </div>
                    <div className='font-bold text-blue-900 text-lg'>
                      PKR{" "}
                      {Number(balanceReceivable).toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
                <div className='mt-3 text-xs text-gray-500 bg-blue-50 p-2 rounded'>
                  <p>
                    ℹ️ <strong>Note:</strong> Damage and Dirty are text fields
                    for descriptions (e.g., &quot;Scratched on side&quot;,
                    &quot;Oil stains&quot;). Financial calculations are based on
                    rent only.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader className='py-3 px-4 border-b'>
          <h3 className='text-lg font-semibold'>Additional Information</h3>
        </CardHeader>
        <CardContent className='p-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='caseSubmittedToLineOn'>
                Case Submitted to Line on
              </Label>
              <Input
                id='caseSubmittedToLineOn'
                type='date'
                {...form.register("caseSubmittedToLineOn")}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='rentInvoiceIssuedOn'>
                Rent Invoice Issued on
              </Label>
              <Input
                id='rentInvoiceIssuedOn'
                type='date'
                {...form.register("rentInvoiceIssuedOn")}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='refundBalanceReceivedOn'>
                Refund/Balance Received on
              </Label>
              <Input
                id='refundBalanceReceivedOn'
                type='date'
                {...form.register("refundBalanceReceivedOn")}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
