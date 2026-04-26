import React, { useState, useEffect } from "react";
import ReactSelect, { StylesConfig, GroupBase } from "react-select";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign } from "lucide-react";
import { compactSelectStyles } from "../utils/styles";

// ─── Shared compact design primitives ────────────────────────────────────────

/** Format YYYY-MM-DD or ISO string → dd/mm/yyyy, timezone-safe */
const fmtDate = (val: string | null | undefined): string => {
  if (!val) return "—";
  const datePart = val.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3 && parts[0].length === 4)
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return val;
};

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className='text-[11px] font-semibold uppercase tracking-wide text-gray-500 leading-none'>
        {label}
      </span>
      {children}
    </div>
  );
}

function SectionBar({
  title,
  aside,
}: {
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className='flex items-center gap-2 mt-4 mb-2 first:mt-0'>
      <span className='text-[11px] font-bold uppercase tracking-widest text-blue-700 whitespace-nowrap'>
        {title}
      </span>
      <div className='flex-1 border-t border-blue-200' />
      {aside}
    </div>
  );
}

const tinyInputClass =
  "h-[30px] text-[13px] px-2 py-0 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

// react-select compact styles — same tokens as all other tabs
const tinySelectStyles: StylesConfig<any, false, GroupBase<any>> = {
  ...compactSelectStyles,
  control: (base, state) => ({
    ...base,
    minHeight: "30px",
    height: "30px",
    fontSize: "13px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": { borderColor: "#3b82f6" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 6px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: "13px" }),
  indicatorsContainer: (base) => ({ ...base, height: "30px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "0 4px" }),
  menu: (base) => ({ ...base, fontSize: "13px", zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    padding: "5px 10px",
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#111",
  }),
};

// ─── Condition options (single source of truth) ───────────────────────────────
const CONDITION_OPTIONS = ["Good", "Fair", "Poor", "Damaged", "Dirty"];

const normalizeCondition = (raw: string | null | undefined): string => {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (CONDITION_OPTIONS.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  const exact = CONDITION_OPTIONS.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;
  const partial = CONDITION_OPTIONS.find(
    (o) =>
      o.toLowerCase().startsWith(lower) || lower.startsWith(o.toLowerCase()),
  );
  if (partial) return partial;
  console.warn(`[DetentionTab] Unrecognized condition value: "${trimmed}"`);
  return "";
};

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

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
  loadingParties = false,
}: any) {
  const uptoDateValue: string = form.watch("advanceRentPaidUpto") || "";

  // ─── Transporter helpers ──────────────────────────────────────────────────

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

  // ─── Auto-add new containers from Shipping tab ────────────────────────────

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
    if (newRecords.length > 0)
      setDetentionRecords([...detentionRecords, ...newRecords]);
  }, [fclContainers]);

  // ─── Sync transporter IDs when dispatch records arrive ────────────────────

  useEffect(() => {
    if (!detentionRecords.length || !dispatchRecords.length) return;
    const updated = detentionRecords.map((r: DetentionRecord) => {
      const id = getTransporterIdForContainer(r.containerNumber);
      return id && !r.transporterPartyId ? { ...r, transporterPartyId: id } : r;
    });
    setDetentionRecords(updated);
  }, [dispatchRecords]);

  // ─── Recalculate balance ──────────────────────────────────────────────────

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

  // ─── Update a single detention row field ─────────────────────────────────

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

  // ─── Upto Date handler ────────────────────────────────────────────────────

  const handleUptoDateChange = (newDate: string) => {
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

  // ─── Label helpers ────────────────────────────────────────────────────────

  const getContainerTypeLabel = (id?: number) =>
    containerTypes.find((t: ContainerOption) => t.value === id)?.label || "";

  const getContainerSizeLabel = (id?: number) =>
    containerSizes.find((s: ContainerOption) => s.value === id)?.label || "";

  // ─── Aggregates ───────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <TabsContent value='detention'>
      <div className='bg-white border border-gray-200 rounded-md p-4'>
        {/* ── MASTER FIELDS ── */}
        <SectionBar title='Detention Master' />

        <div className='flex flex-wrap gap-x-3 gap-y-3 items-end'>
          {/* Depositor — react-select */}
          <Field label='Depositor' className='min-w-[200px] flex-1'>
            <ReactSelect
              options={parties.filter((p: PartyOption) => p.value && p.label)}
              value={
                parties.find(
                  (p: PartyOption) =>
                    p.value === form.watch("depositorPartyId"),
                ) || null
              }
              onChange={(val: any) =>
                form.setValue("depositorPartyId", val?.value ?? 0, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              isLoading={loadingParties}
              isClearable
              placeholder='Select depositor…'
              styles={tinySelectStyles}
            />
          </Field>

          {/* Deposit Amount */}
          <Field label='Deposit Amount (PKR)' className='w-[150px]'>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={tinyInputClass}
              {...form.register("detentionDepositAmount", {
                valueAsNumber: true,
                onChange: () => recalculateBalance(),
              })}
            />
          </Field>

          {/* Advance Rent */}
          <Field label='Advance Rent (PKR)' className='w-[150px]'>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={tinyInputClass}
              {...form.register("detentionAdvanceRentPaid", {
                valueAsNumber: true,
                onChange: () => recalculateBalance(),
              })}
            />
          </Field>

          {/* Total Payable — auto-calc */}
          <Field label='Total Payable (PKR) ↺' className='w-[150px]'>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed font-semibold`}
              readOnly
              {...form.register("detentionTotalPayable", {
                valueAsNumber: true,
              })}
            />
          </Field>

          {/* Balance Receivable — auto-calc */}
          <Field label='Balance Receivable (PKR) ↺' className='w-[165px]'>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={`${tinyInputClass} bg-blue-50 border-blue-300 cursor-not-allowed font-bold`}
              readOnly
              {...form.register("detentionBalanceReceivable", {
                valueAsNumber: true,
              })}
            />
          </Field>

          {/* Upto Date */}
          <Field label='Advance Rent Upto Date' className='w-[160px]'>
            <Input
              type='date'
              className={tinyInputClass}
              value={uptoDateValue}
              onChange={(e) => handleUptoDateChange(e.target.value)}
            />
            <span className='text-[10px] text-gray-400 mt-0.5'>
              Auto-calculates rent days
            </span>
          </Field>
        </div>

        {/* Info note */}
        <div className='flex items-center gap-1.5 mt-3 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-1.5'>
          <DollarSign className='h-3.5 w-3.5 shrink-0' />
          <span>
            Rent amounts are in <strong>USD</strong>. Enter exchange rate per
            row to auto-calculate PKR. Transport is pre-filled from Dispatch
            Tab.
          </span>
        </div>

        {/* ── DETENTION RECORDS TABLE ── */}
        <SectionBar
          title={`Container Detention Grid${detentionRecords.length > 0 ? ` (${detentionRecords.length})` : ""}`}
          aside={
            fclContainers.length === 0 && (
              <span className='text-[10px] text-amber-600'>
                ⚠ Add containers in Shipping tab first
              </span>
            )
          }
        />

        {detentionRecords.length === 0 ? (
          <div className='text-center py-8 text-[12px] text-gray-400 border-2 border-dashed border-gray-200 rounded-md'>
            No containers — add FCL containers in the Shipping tab first.
          </div>
        ) : (
          <div className='border border-gray-200 rounded overflow-x-auto overflow-y-auto max-h-[500px]'>
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 10px;
                height: 10px;
              }
              div::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 6px;
              }
              div::-webkit-scrollbar-thumb {
                background: #aaa;
                border-radius: 6px;
                border: 2px solid #f1f1f1;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #888;
              }
            `}</style>

            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50 h-8'>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 sticky left-0 bg-gray-50 z-20 w-8'>
                    #
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[130px]'>
                    Container No.
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[70px]'>
                    Type
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[60px]'>
                    Size
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[80px] text-right'>
                    Wt (kg)
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[150px]'>
                    Transporter
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[120px]'>
                    Empty Date
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[120px]'>
                    EIR Received
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[120px]'>
                    Condition
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[80px] text-right'>
                    Rent Days
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right bg-blue-50'>
                    Rent (USD)
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right bg-blue-50'>
                    Exch. Rate
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[120px] text-right bg-green-50'>
                    Rent (PKR) ↺
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[160px]'>
                    Damage
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[160px]'>
                    Dirty
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {detentionRecords.map(
                  (record: DetentionRecord, index: number) => {
                    const normalizedCondition = normalizeCondition(
                      record.condition,
                    );
                    const transporterName = getTransporterNameForContainer(
                      record.containerNumber,
                    );

                    return (
                      <TableRow key={index} className='h-9 hover:bg-gray-50'>
                        {/* # */}
                        <TableCell className='text-[12px] py-0.5 px-2 sticky left-0 bg-white z-10 font-medium'>
                          {index + 1}
                        </TableCell>

                        {/* Container No. — read */}
                        <TableCell className='text-[12px] py-0.5 px-2 font-mono'>
                          {record.containerNumber}
                        </TableCell>

                        {/* Type — read */}
                        <TableCell className='text-[12px] py-0.5 px-2'>
                          {getContainerTypeLabel(record.containerTypeId)}
                        </TableCell>

                        {/* Size — read */}
                        <TableCell className='text-[12px] py-0.5 px-2'>
                          {getContainerSizeLabel(record.containerSizeId)}
                        </TableCell>

                        {/* Weight — read */}
                        <TableCell className='text-[12px] py-0.5 px-2 text-right'>
                          {(record.netWeight || 0).toFixed(2)}
                        </TableCell>

                        {/* Transporter — read-only, filled from Dispatch Tab */}
                        <TableCell className='py-0.5 px-1'>
                          <Input
                            className={`${tinyInputClass} bg-gray-50 cursor-not-allowed w-[145px]`}
                            value={transporterName || "Not assigned"}
                            readOnly
                            title='Assign transporter in Dispatch Tab'
                          />
                        </TableCell>

                        {/* Empty Date */}
                        <TableCell className='py-0.5 px-1'>
                          <Input
                            type='date'
                            className={`${tinyInputClass} w-[120px]`}
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

                        {/* EIR Received */}
                        <TableCell className='py-0.5 px-1'>
                          <Input
                            type='date'
                            className={`${tinyInputClass} w-[120px]`}
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
                        Condition — native <select> is intentional.
                        Radix/shadcn Select silently ignores value changes in table
                        rows after mount. Native select is always a fully controlled
                        component: whatever `value` is, that's what the user sees.
                      */}
                        <TableCell className='py-0.5 px-1'>
                          <select
                            value={normalizedCondition}
                            onChange={(e) =>
                              updateDetentionRecord(
                                index,
                                "condition",
                                e.target.value,
                              )
                            }
                            className='h-[30px] w-[115px] rounded border border-gray-300 bg-white px-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500'
                          >
                            <option value=''>Select…</option>
                            {CONDITION_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </TableCell>

                        {/* Rent Days */}
                        <TableCell className='py-0.5 px-1'>
                          <Input
                            type='number'
                            className={`${tinyInputClass} w-[75px] text-right`}
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

                        {/* Rent USD */}
                        <TableCell className='py-0.5 px-1 bg-blue-50/40'>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            className={`${tinyInputClass} w-[100px] text-right font-semibold bg-blue-50 border-blue-200`}
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

                        {/* Exchange Rate */}
                        <TableCell className='py-0.5 px-1 bg-blue-50/40'>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            className={`${tinyInputClass} w-[100px] text-right bg-blue-50 border-blue-200`}
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

                        {/* Rent PKR — auto-calc, read-only */}
                        <TableCell className='py-0.5 px-1 bg-green-50/40'>
                          <Input
                            type='number'
                            step='0.01'
                            className={`${tinyInputClass} w-[110px] text-right font-bold bg-green-50 border-green-200 cursor-not-allowed`}
                            value={record.rentAmountLc?.toFixed(2) || "0.00"}
                            readOnly
                            title='Auto-calculated: USD × Rate'
                          />
                        </TableCell>

                        {/* Damage */}
                        <TableCell className='py-0.5 px-1'>
                          <Input
                            type='text'
                            placeholder='e.g. Scratched on side'
                            className={`${tinyInputClass} w-[155px]`}
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

                        {/* Dirty */}
                        <TableCell className='py-0.5 px-1'>
                          <Input
                            type='text'
                            placeholder='e.g. Oil stains'
                            className={`${tinyInputClass} w-[155px]`}
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
        )}

        {/* ── SUMMARY ── */}
        {detentionRecords.length > 0 && (
          <>
            <SectionBar title='Financial Summary' />
            <div className='flex flex-wrap gap-x-6 gap-y-1 text-[12px] py-0.5'>
              <span className='text-gray-500'>
                Containers:{" "}
                <strong className='text-gray-800'>
                  {detentionRecords.length}
                </strong>
              </span>
              <span className='text-gray-500'>
                Total Rent (USD):{" "}
                <strong className='text-blue-700'>
                  ${totalRentUsd.toFixed(2)}
                </strong>
              </span>
              <span className='text-gray-500'>
                Total Rent (PKR):{" "}
                <strong className='text-green-700'>
                  PKR{" "}
                  {totalRentPkr.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <span className='text-gray-500'>
                Total Payable:{" "}
                <strong className='text-gray-800'>
                  PKR{" "}
                  {Number(totalPayable).toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <span className='text-gray-500'>
                Deposit:{" "}
                <strong className='text-gray-800'>
                  PKR{" "}
                  {Number(depositAmount).toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <span className='text-gray-500'>
                Advance Rent:{" "}
                <strong className='text-gray-800'>
                  PKR{" "}
                  {Number(advanceRent).toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <span className='text-blue-700 font-semibold'>
                Balance Receivable:{" "}
                <strong className='text-blue-800'>
                  PKR{" "}
                  {Number(balanceReceivable).toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
            </div>
            <p className='text-[10px] text-gray-400 mt-1'>
              ℹ Damage and Dirty are description fields only — not included in
              financial calculations.
            </p>
          </>
        )}

        {/* ── ADDITIONAL INFORMATION ── */}
        <SectionBar title='Additional Information' />
        <div className='flex flex-wrap gap-x-3 gap-y-3 items-end'>
          <Field label='Case Submitted to Line on' className='w-[175px]'>
            <Input
              type='date'
              className={tinyInputClass}
              {...form.register("caseSubmittedToLineOn")}
            />
          </Field>

          <Field label='Rent Invoice Issued on' className='w-[175px]'>
            <Input
              type='date'
              className={tinyInputClass}
              {...form.register("rentInvoiceIssuedOn")}
            />
          </Field>

          <Field label='Refund / Balance Received on' className='w-[185px]'>
            <Input
              type='date'
              className={tinyInputClass}
              {...form.register("refundBalanceReceivedOn")}
            />
          </Field>
        </div>
      </div>
    </TabsContent>
  );
}
