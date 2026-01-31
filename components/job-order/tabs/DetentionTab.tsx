import React, { useState, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
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
  transport?: string;
  emptyDate?: string;
  eirReceivedDate?: string;
  condition?: string;
  rentDays: number;
  rentAmount: number; // ✅ NOW IN USD
  exchangeRate: number; // ✅ NEW: Exchange rate for this container
  rentAmountPkr: number; // ✅ NEW: Calculated PKR amount
  damageAmount: number;
  dirtyAmount: number;
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
  packageType?: string;
  quantity?: number;
}

interface PartyOption {
  value: number;
  label: string;
}

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
  // Master fields state
  const [depositor, setDepositor] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [advanceRent, setAdvanceRent] = useState<number>(0);
  const [uptoDate, setUptoDate] = useState<string>("");

  // Additional fields state
  const [caseSubmittedDate, setCaseSubmittedDate] = useState<string>("");
  const [rentInvoiceDate, setRentInvoiceDate] = useState<string>("");
  const [refundReceivedDate, setRefundReceivedDate] = useState<string>("");

  // ✅ Function to get transporter name from dispatch records
  const getTransporterForContainer = (containerNumber: string): string => {
    if (!dispatchRecords || !parties || dispatchRecords.length === 0) {
      return "";
    }

    const dispatchRecord = dispatchRecords.find(
      (record: DispatchRecord) => record.containerNumber === containerNumber,
    );

    if (!dispatchRecord || !dispatchRecord.transporterPartyId) {
      return "";
    }

    const transporterParty = parties.find(
      (party: PartyOption) => party.value === dispatchRecord.transporterPartyId,
    );

    return transporterParty?.label || "";
  };

  // Initialize detention records from containers
  useEffect(() => {
    if (fclContainers.length > 0) {
      const existingIds = new Set(
        detentionRecords.map((r: DetentionRecord) => r.containerNumber),
      );

      const newRecords = fclContainers
        .filter((container: any) => !existingIds.has(container.containerNo))
        .map((container: any) => {
          const transporterName = getTransporterForContainer(
            container.containerNo,
          );

          return {
            containerNumber: container.containerNo,
            containerTypeId: container.containerTypeId,
            containerSizeId: container.containerSizeId,
            netWeight: container.tareWeight || 0,
            transport: transporterName,
            emptyDate: "",
            eirReceivedDate: "",
            condition: "",
            rentDays: 0,
            rentAmount: 0, // USD
            exchangeRate: 0, // ✅ NEW
            rentAmountPkr: 0, // ✅ NEW
            damageAmount: 0,
            dirtyAmount: 0,
          };
        });

      if (newRecords.length > 0) {
        setDetentionRecords([...detentionRecords, ...newRecords]);
      }
    }
  }, [fclContainers, dispatchRecords]);

  // ✅ Sync transporter when dispatch records change
  useEffect(() => {
    if (detentionRecords.length > 0 && dispatchRecords.length > 0) {
      const updatedRecords = detentionRecords.map((record: DetentionRecord) => {
        const transporterName = getTransporterForContainer(
          record.containerNumber,
        );
        if (transporterName && !record.transport) {
          return {
            ...record,
            transport: transporterName,
          };
        }
        return record;
      });
      setDetentionRecords(updatedRecords);
    }
  }, [dispatchRecords]);

  // ✅ Update a specific field in a detention record with auto-calculation
  const updateDetentionRecord = (
    index: number,
    field: keyof DetentionRecord,
    value: any,
  ) => {
    const updatedRecords = [...detentionRecords];
    updatedRecords[index] = {
      ...updatedRecords[index],
      [field]: value,
    };

    // Auto-calculate rent days if empty date changes
    if (field === "emptyDate" && uptoDate) {
      const rentDays = calculateRentDays(value, uptoDate);
      updatedRecords[index].rentDays = rentDays;
    }

    // ✅ Auto-calculate PKR rent when USD rent or exchange rate changes
    if (field === "rentAmount" || field === "exchangeRate") {
      const usdRent =
        field === "rentAmount" ? value : updatedRecords[index].rentAmount;
      const rate =
        field === "exchangeRate" ? value : updatedRecords[index].exchangeRate;
      updatedRecords[index].rentAmountPkr = usdRent * rate;
    }

    setDetentionRecords(updatedRecords);
  };

  // Calculate rent days between two dates
  const calculateRentDays = (emptyDate: string, uptoDate: string): number => {
    if (!emptyDate || !uptoDate) return 0;

    const empty = new Date(emptyDate);
    const upto = new Date(uptoDate);
    const diffTime = upto.getTime() - empty.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // Recalculate all rent days when upto date changes
  const handleUptoDateChange = (newUptoDate: string) => {
    setUptoDate(newUptoDate);

    if (newUptoDate) {
      const updatedRecords = detentionRecords.map((record: DetentionRecord) => {
        if (record.emptyDate) {
          return {
            ...record,
            rentDays: calculateRentDays(record.emptyDate, newUptoDate),
          };
        }
        return record;
      });
      setDetentionRecords(updatedRecords);
    }
  };

  // Get container type label
  const getContainerTypeLabel = (typeId: number | undefined) => {
    if (!typeId) return "";
    const type = containerTypes.find((t: any) => t.value === typeId);
    return type?.label || "";
  };

  // Get container size label
  const getContainerSizeLabel = (sizeId: number | undefined) => {
    if (!sizeId) return "";
    const size = containerSizes.find((s: any) => s.value === sizeId);
    return size?.label || "";
  };

  // ✅ Calculate totals (now using PKR amounts)
  const totals = {
    containers: detentionRecords.length,
    totalRentUsd: detentionRecords.reduce(
      (sum: number, r: DetentionRecord) => sum + (r.rentAmount || 0),
      0,
    ),
    totalRentPkr: detentionRecords.reduce(
      (sum: number, r: DetentionRecord) => sum + (r.rentAmountPkr || 0),
      0,
    ),
    totalDamage: detentionRecords.reduce(
      (sum: number, r: DetentionRecord) => sum + (r.damageAmount || 0),
      0,
    ),
    totalDirty: detentionRecords.reduce(
      (sum: number, r: DetentionRecord) => sum + (r.dirtyAmount || 0),
      0,
    ),
  };

  // Calculate financial summary (using PKR)
  const totalPayable =
    totals.totalRentPkr + totals.totalDamage + totals.totalDirty;
  const securityDeposit = depositAmount;
  const balanceReceivable = totalPayable - securityDeposit - advanceRent;

  // Depositor options
  const depositorOptions = [
    "Billing Parties",
    "Transporter",
    "SASPAK",
    "Forwarder",
    "Depositor",
    "Free Deposit",
  ];

  // Condition options
  const conditionOptions = ["Good", "Fair", "Poor", "Damaged", "Dirty"];

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
          {/* Info Banner */}
          <div className='bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4'>
            <div className='flex items-start gap-2'>
              <Info className='h-5 w-5 text-blue-600 mt-0.5' />
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

          {/* Master Fields */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
            <div className='space-y-2'>
              <Label>Depositor</Label>
              <Select value={depositor} onValueChange={setDepositor}>
                <SelectTrigger>
                  <SelectValue placeholder='Select Depositor' />
                </SelectTrigger>
                <SelectContent>
                  {depositorOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-gray-500'>
                Billing Parties/Transporter/SASPAK/Forwarder/Depositor/Free
                Deposit
              </p>
            </div>

            <div className='space-y-2'>
              <Label>Deposit Amount (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                placeholder='0.00'
                value={depositAmount || ""}
                onChange={(e) =>
                  setDepositAmount(parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Advance Rent (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                placeholder='0.00'
                value={advanceRent || ""}
                onChange={(e) =>
                  setAdvanceRent(parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Upto Date</Label>
              <Input
                type='date'
                value={uptoDate || ""}
                onChange={(e) => handleUptoDateChange(e.target.value)}
              />
              <p className='text-xs text-gray-500'>Auto-calculates rent days</p>
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
              {/* ✅ IMPROVED: Better scrollbar styling */}
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
                /* Firefox */
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
                      <TableHead className='min-w-[130px]'>Condition</TableHead>
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
                      <TableHead className='min-w-[130px] text-right'>
                        Damage (PKR)
                      </TableHead>
                      <TableHead className='min-w-[130px] text-right'>
                        Dirty (PKR)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detentionRecords.map(
                      (record: DetentionRecord, index: number) => {
                        const dispatchTransporter = getTransporterForContainer(
                          record.containerNumber,
                        );

                        return (
                          <TableRow key={index} className='hover:bg-gray-50'>
                            <TableCell className='font-medium sticky left-0 bg-white z-10'>
                              {index + 1}
                            </TableCell>

                            {/* Read-only container details */}
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
                              {record.netWeight.toFixed(2)}
                            </TableCell>

                            {/* Transport */}
                            <TableCell>
                              <Input
                                className='h-9'
                                placeholder='Transport name'
                                value={
                                  record.transport || dispatchTransporter || ""
                                }
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "transport",
                                    e.target.value,
                                  )
                                }
                                title={
                                  dispatchTransporter
                                    ? `Pre-filled from Dispatch: ${dispatchTransporter}`
                                    : "Enter transport name"
                                }
                              />
                            </TableCell>

                            {/* Empty Date */}
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

                            {/* EIR Received */}
                            <TableCell>
                              <Input
                                type='date'
                                className='h-9'
                                value={record.eirReceivedDate || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "eirReceivedDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </TableCell>

                            {/* Condition */}
                            <TableCell>
                              <Select
                                value={record.condition || ""}
                                onValueChange={(value) =>
                                  updateDetentionRecord(
                                    index,
                                    "condition",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className='h-9'>
                                  <SelectValue placeholder='Select' />
                                </SelectTrigger>
                                <SelectContent className='max-h-[300px] overflow-y-auto z-50'>
                                  {conditionOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>

                            {/* Rent Days */}
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

                            {/* ✅ NEW: Rent Amount (USD) */}
                            <TableCell className='bg-blue-50'>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9 text-right font-semibold'
                                placeholder='0.00'
                                value={record.rentAmount || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "rentAmount",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>

                            {/* ✅ NEW: Exchange Rate */}
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

                            {/* ✅ NEW: Rent Amount (PKR) - Auto-calculated */}
                            <TableCell className='bg-green-50'>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9 text-right bg-green-50 font-bold'
                                value={
                                  record.rentAmountPkr?.toFixed(2) || "0.00"
                                }
                                readOnly
                                title='Auto-calculated: USD Rent × Exchange Rate'
                              />
                            </TableCell>

                            {/* Damage Amount */}
                            <TableCell>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9 text-right'
                                placeholder='0.00'
                                value={record.damageAmount || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "damageAmount",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>

                            {/* Dirty Amount */}
                            <TableCell>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9 text-right'
                                placeholder='0.00'
                                value={record.dirtyAmount || ""}
                                onChange={(e) =>
                                  updateDetentionRecord(
                                    index,
                                    "dirtyAmount",
                                    parseFloat(e.target.value) || 0,
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
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4'>
                <div>
                  <span className='text-gray-600'>Total Containers:</span>{" "}
                  <span className='font-semibold'>{totals.containers}</span>
                </div>
                <div className='bg-blue-50 p-2 rounded'>
                  <span className='text-blue-900'>Total Rent (USD):</span>{" "}
                  <span className='font-bold text-blue-900'>
                    ${totals.totalRentUsd.toFixed(2)}
                  </span>
                </div>
                <div className='bg-green-50 p-2 rounded'>
                  <span className='text-green-900'>Total Rent (PKR):</span>{" "}
                  <span className='font-bold text-green-900'>
                    PKR{" "}
                    {totals.totalRentPkr.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>Total Damage:</span>{" "}
                  <span className='font-semibold'>
                    PKR{" "}
                    {totals.totalDamage.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>Total Dirty:</span>{" "}
                  <span className='font-semibold'>
                    PKR{" "}
                    {totals.totalDirty.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className='col-span-2 md:col-span-3 border-t pt-2'>
                  <span className='text-gray-600'>Total Payable (PKR):</span>{" "}
                  <span className='font-bold text-lg'>
                    PKR{" "}
                    {totalPayable.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className='bg-white p-4 rounded border'>
                <h4 className='font-semibold mb-3'>Financial Summary (PKR)</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <div className='text-gray-600'>Total Payable:</div>
                    <div className='font-semibold'>
                      PKR{" "}
                      {totalPayable.toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className='text-gray-600'>Security Deposit:</div>
                    <div className='font-semibold'>
                      PKR{" "}
                      {securityDeposit.toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className='text-gray-600'>Advance Rent:</div>
                    <div className='font-semibold'>
                      PKR{" "}
                      {advanceRent.toLocaleString("en-PK", {
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
                      {balanceReceivable.toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Fields */}
      <Card>
        <CardHeader className='py-3 px-4 border-b'>
          <h3 className='text-lg font-semibold'>Additional Information</h3>
        </CardHeader>
        <CardContent className='p-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label>Case Submitted to Line on</Label>
              <Input
                type='date'
                value={caseSubmittedDate || ""}
                onChange={(e) => setCaseSubmittedDate(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Rent Invoice Issued on</Label>
              <Input
                type='date'
                value={rentInvoiceDate || ""}
                onChange={(e) => setRentInvoiceDate(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Refund/Balance Received on</Label>
              <Input
                type='date'
                value={refundReceivedDate || ""}
                onChange={(e) => setRefundReceivedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
