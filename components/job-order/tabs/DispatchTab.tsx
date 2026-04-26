import React, { useState, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import ReactSelect, { StylesConfig, GroupBase } from "react-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy } from "lucide-react";
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

// react-select compact styles — identical across all tabs
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

// Narrower styles for inside table cells
const rowSelectStyles: StylesConfig<any, false, GroupBase<any>> = {
  ...tinySelectStyles,
  control: (base, state) => ({
    ...(tinySelectStyles.control as any)(base, state),
    minHeight: "28px",
    height: "28px",
    fontSize: "12px",
    minWidth: "140px",
    maxWidth: "200px",
  }),
  menu: (base) => ({ ...base, fontSize: "12px", zIndex: 9999 }),
};

// ─── Types ───────────────────────────────────────────────────────────────────

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
  packageType?: string;
  quantity?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DispatchTab({
  form,
  fclContainers = [],
  parties = [],
  transporters = [],
  locations = [],
  containerTypes = [],
  containerSizes = [],
  packageTypes = [],
  shippingType,
  shippingQtyOfPackages,
  shippingPackagesType,
  shippingPackageWeight,
  dispatchRecords = [],
  setDispatchRecords,
  toast,
}: any) {
  const isFCL = shippingType === "FCL";
  const isLCLorAIR = shippingType === "LCL" || shippingType === "AIR";

  const [applyToAllValues, setApplyToAllValues] = useState({
    transporterPartyId: undefined as number | undefined,
    destinationLocationId: undefined as number | undefined,
    containerReturnTerminalId: undefined as number | undefined,
    buyingAmountLc: 0,
    topayAmountLc: 0,
    dispatchDate: "",
  });

  // ── FCL: sync containers from Shipping Tab ────────────────────────────────
  useEffect(() => {
    if (!isFCL) return;
    if (fclContainers.length === 0) return;
    const existingIds = new Set(
      dispatchRecords.map((r: DispatchRecord) => r.containerNumber),
    );
    const newRecords = fclContainers
      .filter((c: any) => !existingIds.has(c.containerNo))
      .map((c: any) => ({
        containerNumber: c.containerNo,
        containerTypeId: c.containerTypeId,
        containerSizeId: c.containerSizeId,
        netWeight: c.tareWeight || 0,
        transporterPartyId: undefined,
        destinationLocationId: undefined,
        containerReturnTerminalId: undefined,
        buyingAmountLc: 0,
        topayAmountLc: 0,
        dispatchDate: "",
      }));
    if (newRecords.length > 0)
      setDispatchRecords([...dispatchRecords, ...newRecords]);
  }, [fclContainers, shippingType]);

  // ── LCL / AIR: keep row[0] in sync with Shipping Tab props ───────────────
  useEffect(() => {
    if (!isLCLorAIR) return;
    const qty = shippingQtyOfPackages ?? form.getValues("qtyOfPackages") ?? 0;
    const type = shippingPackagesType ?? form.getValues("packagesType") ?? "";
    const weight =
      shippingPackageWeight ?? form.getValues("packageWeight") ?? 0;
    setDispatchRecords((prev: DispatchRecord[]) => {
      const existing = prev[0] ?? {};
      const syncedRow: DispatchRecord = {
        containerNumber: existing.containerNumber || `PKG-${Date.now()}`,
        transporterPartyId: existing.transporterPartyId,
        destinationLocationId: existing.destinationLocationId,
        containerReturnTerminalId: existing.containerReturnTerminalId,
        buyingAmountLc: existing.buyingAmountLc ?? 0,
        topayAmountLc: existing.topayAmountLc ?? 0,
        dispatchDate: existing.dispatchDate ?? "",
        packageType: type,
        quantity: qty,
        netWeight: weight,
      };
      if (prev.length === 0) return [syncedRow];
      return [syncedRow, ...prev.slice(1)];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLCLorAIR,
    shippingQtyOfPackages,
    shippingPackagesType,
    shippingPackageWeight,
  ]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateDispatchRecord = (
    index: number,
    field: keyof DispatchRecord,
    value: any,
  ) => {
    const updated = [...dispatchRecords];
    updated[index] = { ...updated[index], [field]: value };
    setDispatchRecords(updated);
  };

  const handleApplyToAll = () => {
    if (dispatchRecords.length === 0) {
      toast({
        title: "No Records",
        description: "Add containers/packages first in Shipping Tab",
        variant: "destructive",
      });
      return;
    }
    const updated = dispatchRecords.map((record: DispatchRecord) => ({
      ...record,
      ...(applyToAllValues.transporterPartyId && {
        transporterPartyId: applyToAllValues.transporterPartyId,
      }),
      ...(applyToAllValues.destinationLocationId && {
        destinationLocationId: applyToAllValues.destinationLocationId,
      }),
      ...(isFCL &&
        applyToAllValues.containerReturnTerminalId && {
          containerReturnTerminalId: applyToAllValues.containerReturnTerminalId,
        }),
      ...(applyToAllValues.buyingAmountLc > 0 && {
        buyingAmountLc: applyToAllValues.buyingAmountLc,
      }),
      ...(applyToAllValues.topayAmountLc > 0 && {
        topayAmountLc: applyToAllValues.topayAmountLc,
      }),
      ...(applyToAllValues.dispatchDate && {
        dispatchDate: applyToAllValues.dispatchDate,
      }),
    }));
    setDispatchRecords(updated);
    toast({
      title: "Success",
      description: `Applied to ${updated.length} record(s)`,
    });
  };

  const handleAddPackageRow = () => {
    setDispatchRecords([
      ...dispatchRecords,
      {
        containerNumber: `PKG-${Date.now()}`,
        packageType: "",
        quantity: 0,
        netWeight: 0,
        transporterPartyId: undefined,
        destinationLocationId: undefined,
        containerReturnTerminalId: undefined,
        buyingAmountLc: 0,
        topayAmountLc: 0,
        dispatchDate: "",
      },
    ]);
  };

  const handleDeleteRecord = (index: number) => {
    if (confirm("Delete this dispatch record?")) {
      setDispatchRecords(
        dispatchRecords.filter((_: any, i: number) => i !== index),
      );
      toast({ title: "Deleted" });
    }
  };

  const getPartyLabel = (id?: number) =>
    !id ? "" : parties.find((p: any) => p.value === id)?.label || "";
  const getLocationLabel = (id?: number) =>
    !id ? "" : locations.find((l: any) => l.value === id)?.label || "";
  const getContainerTypeLabel = (id?: number) =>
    !id ? "" : containerTypes.find((t: any) => t.value === id)?.label || "";
  const getContainerSizeLabel = (id?: number) =>
    !id ? "" : containerSizes.find((s: any) => s.value === id)?.label || "";

  const totals = {
    count: dispatchRecords.length,
    weight: dispatchRecords.reduce(
      (s: number, r: DispatchRecord) => s + (r.netWeight || 0),
      0,
    ),
    buying: dispatchRecords.reduce(
      (s: number, r: DispatchRecord) => s + (r.buyingAmountLc || 0),
      0,
    ),
    toPay: dispatchRecords.reduce(
      (s: number, r: DispatchRecord) => s + (r.topayAmountLc || 0),
      0,
    ),
  };

  const transporterOptions = transporters.length > 0 ? transporters : parties;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <TabsContent value='dispatch'>
      <div className='bg-white border border-gray-200 rounded-md p-4'>
        {/* ── APPLY COMMON VALUES ── */}
        <SectionBar
          title='Apply Common Values to All'
          aside={
            <span className='text-[10px] text-gray-400 italic'>
              optional quick-fill
            </span>
          }
        />

        <div className='flex flex-wrap gap-x-3 gap-y-3 items-end'>
          {/* Transporter */}
          <Field label='Transporter' className='min-w-[180px] flex-1'>
            <ReactSelect
              options={transporterOptions}
              value={
                transporterOptions.find(
                  (p: any) => p.value === applyToAllValues.transporterPartyId,
                ) || null
              }
              onChange={(val) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  transporterPartyId: val?.value,
                })
              }
              styles={tinySelectStyles}
              isClearable
              placeholder='Select transporter…'
            />
          </Field>

          {/* Destination */}
          <Field label='Destination' className='min-w-[180px] flex-1'>
            <ReactSelect
              options={locations}
              value={
                locations.find(
                  (l: any) =>
                    l.value === applyToAllValues.destinationLocationId,
                ) || null
              }
              onChange={(val) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  destinationLocationId: val?.value,
                })
              }
              styles={tinySelectStyles}
              isClearable
              placeholder='Select destination…'
            />
          </Field>

          {/* Empty Return — FCL only */}
          {isFCL && (
            <Field
              label='Empty Return (Terminal)'
              className='min-w-[180px] flex-1'
            >
              <ReactSelect
                options={locations}
                value={
                  locations.find(
                    (l: any) =>
                      l.value === applyToAllValues.containerReturnTerminalId,
                  ) || null
                }
                onChange={(val) =>
                  setApplyToAllValues({
                    ...applyToAllValues,
                    containerReturnTerminalId: val?.value,
                  })
                }
                styles={tinySelectStyles}
                isClearable
                placeholder='Select terminal…'
              />
            </Field>
          )}

          {/* Buying */}
          <Field label='Buying (PKR)' className='w-[120px]'>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={tinyInputClass}
              value={applyToAllValues.buyingAmountLc || ""}
              onChange={(e) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  buyingAmountLc: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Field>

          {/* To-Pay */}
          <Field label='To-Pay (PKR)' className='w-[120px]'>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={tinyInputClass}
              value={applyToAllValues.topayAmountLc || ""}
              onChange={(e) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  topayAmountLc: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Field>

          {/* Dispatch Date */}
          <Field label='Dispatch Date' className='w-[140px]'>
            <Input
              type='date'
              className={tinyInputClass}
              value={applyToAllValues.dispatchDate || ""}
              onChange={(e) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  dispatchDate: e.target.value,
                })
              }
            />
          </Field>

          {/* Apply button — aligned to bottom */}
          <div className='flex items-end pb-0.5'>
            <button
              type='button'
              onClick={handleApplyToAll}
              disabled={dispatchRecords.length === 0}
              className='flex items-center gap-1.5 h-[30px] px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded'
            >
              <Copy className='h-3.5 w-3.5' />
              Apply to All{" "}
              {dispatchRecords.length > 0 ? `(${dispatchRecords.length})` : ""}
            </button>
          </div>
        </div>

        {/* ── DISPATCH RECORDS TABLE ── */}
        <SectionBar
          title={`${isFCL ? "Container" : "Package"} Dispatch Details${dispatchRecords.length > 0 ? ` (${dispatchRecords.length})` : ""}`}
          aside={
            isLCLorAIR && (
              <button
                type='button'
                onClick={handleAddPackageRow}
                className='flex items-center gap-1 h-6 px-2 text-[11px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded'
              >
                + Add Row
              </button>
            )
          }
        />

        {dispatchRecords.length === 0 ? (
          <div className='text-center py-8 text-[12px] text-gray-400 border-2 border-dashed border-gray-200 rounded-md'>
            {isFCL
              ? "No containers — add containers in the Shipping tab first."
              : "No package rows — fill in the Shipping tab or click + Add Row."}
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

                  {/* FCL-only columns */}
                  {isFCL && (
                    <>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[130px]'>
                        Container No.
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[80px]'>
                        Type
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[60px]'>
                        Size
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[90px] text-right'>
                        Wt (kg)
                      </TableHead>
                    </>
                  )}

                  {/* LCL/AIR-only columns */}
                  {isLCLorAIR && (
                    <>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[150px]'>
                        Package Type
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[70px]'>
                        Qty
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[90px]'>
                        Wt (kg)
                      </TableHead>
                    </>
                  )}

                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[180px]'>
                    Transporter
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[180px]'>
                    Destination
                  </TableHead>

                  {isFCL && (
                    <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[180px]'>
                      Empty Return
                    </TableHead>
                  )}

                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right'>
                    Buying (PKR)
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right'>
                    To-Pay (PKR)
                  </TableHead>
                  <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[120px]'>
                    Dispatch Date
                  </TableHead>
                  <TableHead className='text-[11px] py-1 px-1 sticky right-0 bg-gray-50 z-20 w-10'></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dispatchRecords.map(
                  (record: DispatchRecord, index: number) => (
                    <TableRow key={index} className='h-9 hover:bg-gray-50'>
                      {/* Row number */}
                      <TableCell className='text-[12px] py-0.5 px-2 sticky left-0 bg-white z-10 font-medium'>
                        {index + 1}
                      </TableCell>

                      {/* FCL read-only cells */}
                      {isFCL && (
                        <>
                          <TableCell className='text-[12px] py-0.5 px-2 font-mono'>
                            {record.containerNumber}
                          </TableCell>
                          <TableCell className='text-[12px] py-0.5 px-2'>
                            {getContainerTypeLabel(record.containerTypeId)}
                          </TableCell>
                          <TableCell className='text-[12px] py-0.5 px-2'>
                            {getContainerSizeLabel(record.containerSizeId)}
                          </TableCell>
                          <TableCell className='text-[12px] py-0.5 px-2 text-right'>
                            {(record.netWeight || 0).toFixed(2)}
                          </TableCell>
                        </>
                      )}

                      {/* LCL/AIR editable cells */}
                      {isLCLorAIR && (
                        <>
                          <TableCell className='py-0.5 px-1'>
                            <ReactSelect
                              options={packageTypes.filter(
                                (p: any) => p?.value && p?.label,
                              )}
                              value={
                                packageTypes.find(
                                  (p: any) => p.label === record.packageType,
                                ) || null
                              }
                              onChange={(val) =>
                                updateDispatchRecord(
                                  index,
                                  "packageType",
                                  val?.label ?? "",
                                )
                              }
                              styles={rowSelectStyles}
                              isClearable
                              placeholder='Select…'
                            />
                          </TableCell>
                          <TableCell className='py-0.5 px-1'>
                            <Input
                              type='number'
                              className={`${tinyInputClass} w-[70px]`}
                              value={record.quantity ?? ""}
                              placeholder='0'
                              onChange={(e) =>
                                updateDispatchRecord(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className='py-0.5 px-1'>
                            <Input
                              type='number'
                              step='0.01'
                              className={`${tinyInputClass} w-[90px]`}
                              value={record.netWeight ?? ""}
                              placeholder='0.00'
                              onChange={(e) =>
                                updateDispatchRecord(
                                  index,
                                  "netWeight",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </TableCell>
                        </>
                      )}

                      {/* Transporter */}
                      <TableCell className='py-0.5 px-1'>
                        <ReactSelect
                          options={transporterOptions}
                          value={
                            transporterOptions.find(
                              (p: any) => p.value === record.transporterPartyId,
                            ) || null
                          }
                          onChange={(val) =>
                            updateDispatchRecord(
                              index,
                              "transporterPartyId",
                              val?.value ?? undefined,
                            )
                          }
                          styles={rowSelectStyles}
                          isClearable
                          placeholder='Transporter…'
                        />
                      </TableCell>

                      {/* Destination */}
                      <TableCell className='py-0.5 px-1'>
                        <ReactSelect
                          options={locations}
                          value={
                            locations.find(
                              (l: any) =>
                                l.value === record.destinationLocationId,
                            ) || null
                          }
                          onChange={(val) =>
                            updateDispatchRecord(
                              index,
                              "destinationLocationId",
                              val?.value ?? undefined,
                            )
                          }
                          styles={rowSelectStyles}
                          isClearable
                          placeholder='Destination…'
                        />
                      </TableCell>

                      {/* Empty Return — FCL only */}
                      {isFCL && (
                        <TableCell className='py-0.5 px-1'>
                          <ReactSelect
                            options={locations}
                            value={
                              locations.find(
                                (l: any) =>
                                  l.value === record.containerReturnTerminalId,
                              ) || null
                            }
                            onChange={(val) =>
                              updateDispatchRecord(
                                index,
                                "containerReturnTerminalId",
                                val?.value ?? undefined,
                              )
                            }
                            styles={rowSelectStyles}
                            isClearable
                            placeholder='Return terminal…'
                          />
                        </TableCell>
                      )}

                      {/* Buying */}
                      <TableCell className='py-0.5 px-1'>
                        <Input
                          type='number'
                          step='0.01'
                          placeholder='0.00'
                          className={`${tinyInputClass} w-[100px] text-right`}
                          value={record.buyingAmountLc || ""}
                          onChange={(e) =>
                            updateDispatchRecord(
                              index,
                              "buyingAmountLc",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>

                      {/* To-Pay */}
                      <TableCell className='py-0.5 px-1'>
                        <Input
                          type='number'
                          step='0.01'
                          placeholder='0.00'
                          className={`${tinyInputClass} w-[100px] text-right`}
                          value={record.topayAmountLc || ""}
                          onChange={(e) =>
                            updateDispatchRecord(
                              index,
                              "topayAmountLc",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>

                      {/* Dispatch Date */}
                      <TableCell className='py-0.5 px-1'>
                        <Input
                          type='date'
                          className={`${tinyInputClass} w-[130px]`}
                          value={record.dispatchDate || ""}
                          onChange={(e) =>
                            updateDispatchRecord(
                              index,
                              "dispatchDate",
                              e.target.value,
                            )
                          }
                        />
                      </TableCell>

                      {/* Delete */}
                      <TableCell className='py-0.5 px-1 sticky right-0 bg-white z-10'>
                        <button
                          type='button'
                          onClick={() => handleDeleteRecord(index)}
                          className='h-[28px] w-[28px] flex items-center justify-center rounded hover:bg-red-100 text-red-500 text-lg leading-none'
                        >
                          ×
                        </button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── SUMMARY ── */}
        {dispatchRecords.length > 0 && (
          <>
            <SectionBar title='Summary' />
            <div className='flex flex-wrap gap-x-6 gap-y-1 text-[12px] py-0.5'>
              <span className='text-gray-500'>
                {isFCL ? "Containers" : "Packages"}:{" "}
                <strong className='text-gray-800'>{totals.count}</strong>
              </span>
              <span className='text-gray-500'>
                Total Weight:{" "}
                <strong className='text-gray-800'>
                  {totals.weight.toFixed(2)} kg
                </strong>
              </span>
              <span className='text-gray-500'>
                Total Buying:{" "}
                <strong className='text-blue-700'>
                  PKR{" "}
                  {totals.buying.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <span className='text-gray-500'>
                Total To-Pay:{" "}
                <strong className='text-orange-700'>
                  PKR{" "}
                  {totals.toPay.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
            </div>
          </>
        )}

        {/* ── DISPATCH NOTES ── */}
        <SectionBar title='Dispatch Notes' />
        <textarea
          className='w-full min-h-[70px] text-[13px] px-2 py-1.5 border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          placeholder='Additional dispatch notes or instructions…'
          value={form.watch("dispatchAddress") || ""}
          onChange={(e) => form.setValue("dispatchAddress", e.target.value)}
        />
      </div>
    </TabsContent>
  );
}
