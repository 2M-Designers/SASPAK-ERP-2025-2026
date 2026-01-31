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
import { Copy, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DispatchRecord {
  jobEquipmentHandingOverId?: number;
  jobId?: number;
  containerNumber: string;
  containerTypeId?: number;
  containerSizeId?: number;
  netWeight: number;
  transporterPartyId?: number;
  destinationLocationId?: number;
  containerReturnTerminalId?: number; // ✅ NEW: Empty Return field
  buyingAmountLc: number;
  topayAmountLc: number;
  dispatchDate: string;
  version?: number;
  packageType?: string;
  quantity?: number;
}

export default function DispatchTab({
  form,
  fclContainers = [],
  parties = [],
  locations = [],
  containerTypes = [],
  containerSizes = [],
  packageTypes = [],
  shippingType,
  dispatchRecords = [],
  setDispatchRecords,
  toast,
}: any) {
  const [applyToAllValues, setApplyToAllValues] = useState({
    transporterPartyId: undefined as number | undefined,
    destinationLocationId: undefined as number | undefined,
    containerReturnTerminalId: undefined as number | undefined, // ✅ NEW
    buyingAmountLc: 0,
    topayAmountLc: 0,
    dispatchDate: "",
  });

  useEffect(() => {
    if (shippingType === "FCL" && fclContainers.length > 0) {
      const existingIds = new Set(
        dispatchRecords.map((r: DispatchRecord) => r.containerNumber),
      );

      const newRecords = fclContainers
        .filter((container: any) => !existingIds.has(container.containerNo))
        .map((container: any) => ({
          containerNumber: container.containerNo,
          containerTypeId: container.containerTypeId,
          containerSizeId: container.containerSizeId,
          netWeight: container.tareWeight || 0,
          transporterPartyId: undefined,
          destinationLocationId: undefined,
          containerReturnTerminalId: undefined, // ✅ NEW
          buyingAmountLc: 0,
          topayAmountLc: 0,
          dispatchDate: "",
        }));

      if (newRecords.length > 0) {
        setDispatchRecords([...dispatchRecords, ...newRecords]);
      }
    }
  }, [fclContainers, shippingType]);

  const updateDispatchRecord = (
    index: number,
    field: keyof DispatchRecord,
    value: any,
  ) => {
    const updatedRecords = [...dispatchRecords];
    updatedRecords[index] = {
      ...updatedRecords[index],
      [field]: value,
    };
    setDispatchRecords(updatedRecords);
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

    const updatedRecords = dispatchRecords.map((record: DispatchRecord) => ({
      ...record,
      ...(applyToAllValues.transporterPartyId && {
        transporterPartyId: applyToAllValues.transporterPartyId,
      }),
      ...(applyToAllValues.destinationLocationId && {
        destinationLocationId: applyToAllValues.destinationLocationId,
      }),
      ...(applyToAllValues.containerReturnTerminalId && {
        // ✅ NEW
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

    setDispatchRecords(updatedRecords);

    toast({
      title: "Success",
      description: `Applied values to ${updatedRecords.length} record(s)`,
    });
  };

  const handleAddPackageRow = () => {
    const newRecord: DispatchRecord = {
      containerNumber: `PKG-${Date.now()}`,
      packageType: "",
      quantity: 0,
      netWeight: 0,
      transporterPartyId: undefined,
      destinationLocationId: undefined,
      containerReturnTerminalId: undefined, // ✅ NEW
      buyingAmountLc: 0,
      topayAmountLc: 0,
      dispatchDate: "",
    };
    setDispatchRecords([...dispatchRecords, newRecord]);
  };

  const handleDeleteRecord = (index: number) => {
    if (confirm("Are you sure you want to delete this dispatch record?")) {
      setDispatchRecords(
        dispatchRecords.filter((_: any, i: number) => i !== index),
      );
      toast({
        title: "Deleted",
        description: "Dispatch record removed",
      });
    }
  };

  const getPartyLabel = (partyId: number | undefined) => {
    if (!partyId) return "";
    const party = parties.find((p: any) => p.value === partyId);
    return party?.label || "";
  };

  const getLocationLabel = (locationId: number | undefined) => {
    if (!locationId) return "";
    const location = locations.find((l: any) => l.value === locationId);
    return location?.label || "";
  };

  const getContainerTypeLabel = (typeId: number | undefined) => {
    if (!typeId) return "";
    const type = containerTypes.find((t: any) => t.value === typeId);
    return type?.label || "";
  };

  const getContainerSizeLabel = (sizeId: number | undefined) => {
    if (!sizeId) return "";
    const size = containerSizes.find((s: any) => s.value === sizeId);
    return size?.label || "";
  };

  const totals = {
    containers: dispatchRecords.length,
    totalWeight: dispatchRecords.reduce(
      (sum: number, r: DispatchRecord) => sum + (r.netWeight || 0),
      0,
    ),
    totalBuying: dispatchRecords.reduce(
      (sum: number, r: DispatchRecord) => sum + (r.buyingAmountLc || 0),
      0,
    ),
    totalToPay: dispatchRecords.reduce(
      (sum: number, r: DispatchRecord) => sum + (r.topayAmountLc || 0),
      0,
    ),
  };

  const isFCL = shippingType === "FCL";

  return (
    <TabsContent value='dispatch' className='space-y-4'>
      {/* Header with Info */}
      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
        <div className='flex items-start gap-2'>
          <Info className='h-5 w-5 text-blue-600 mt-0.5' />
          <div>
            <h3 className='font-semibold text-blue-900 mb-1'>
              Dispatch - Handed Over To
            </h3>
            <p className='text-sm text-blue-700'>
              {isFCL
                ? "Grid shows all containers from Shipping Tab. Fill in dispatch details for each container."
                : "Add packages and fill in dispatch details. Use 'Apply to All' to set common values."}
            </p>
          </div>
        </div>
      </div>

      {/* Apply to All Section */}
      <div className='bg-white p-6 rounded-lg border'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>Apply Common Values to All</h3>
          <Badge variant='outline' className='text-sm'>
            Optional Quick Fill
          </Badge>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
          <div className='space-y-2'>
            <Label>Transporter</Label>
            <Select
              value={applyToAllValues.transporterPartyId?.toString() || ""}
              onValueChange={(value) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  transporterPartyId: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Transporter'>
                  {applyToAllValues.transporterPartyId
                    ? getPartyLabel(applyToAllValues.transporterPartyId)
                    : "Select Transporter"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {parties
                  .filter((p: any) => p?.value)
                  .map((party: any) => (
                    <SelectItem
                      key={party.value}
                      value={party.value.toString()}
                    >
                      {party.label || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Destination</Label>
            <Select
              value={applyToAllValues.destinationLocationId?.toString() || ""}
              onValueChange={(value) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  destinationLocationId: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Destination'>
                  {applyToAllValues.destinationLocationId
                    ? getLocationLabel(applyToAllValues.destinationLocationId)
                    : "Select Destination"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter((location: any) => location?.value)
                  .map((location: any) => (
                    <SelectItem
                      key={location.value}
                      value={location.value.toString()}
                    >
                      {location.label || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* ✅ NEW: Empty Return Field */}
          <div className='space-y-2'>
            <Label>Empty Return (Terminal)</Label>
            <Select
              value={
                applyToAllValues.containerReturnTerminalId?.toString() || ""
              }
              onValueChange={(value) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  containerReturnTerminalId: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Return Terminal'>
                  {applyToAllValues.containerReturnTerminalId
                    ? getLocationLabel(
                        applyToAllValues.containerReturnTerminalId,
                      )
                    : "Select Return Terminal"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter((location: any) => location?.value)
                  .map((location: any) => (
                    <SelectItem
                      key={location.value}
                      value={location.value.toString()}
                    >
                      {location.label || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-gray-500'>Container return location</p>
          </div>

          <div className='space-y-2'>
            <Label>Buying (PKR)</Label>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              value={applyToAllValues.buyingAmountLc || ""}
              onChange={(e) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  buyingAmountLc: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className='text-xs text-gray-500'>If vendor</p>
          </div>

          <div className='space-y-2'>
            <Label>To-Pay (PKR)</Label>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              value={applyToAllValues.topayAmountLc || ""}
              onChange={(e) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  topayAmountLc: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className='text-xs text-gray-500'>Recovery</p>
          </div>

          <div className='space-y-2'>
            <Label>Dispatch Date</Label>
            <Input
              type='date'
              value={applyToAllValues.dispatchDate || ""}
              onChange={(e) =>
                setApplyToAllValues({
                  ...applyToAllValues,
                  dispatchDate: e.target.value,
                })
              }
            />
          </div>
        </div>

        <Button
          type='button'
          onClick={handleApplyToAll}
          disabled={dispatchRecords.length === 0}
          className='w-full'
        >
          <Copy className='h-4 w-4 mr-2' />
          Apply to All {dispatchRecords.length} Record(s)
        </Button>
      </div>

      {/* Dispatch Records Table */}
      <div className='bg-white rounded-lg border'>
        <div className='p-4 border-b flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>
            {isFCL ? "Container" : "Package"} Dispatch Details
          </h3>
          {!isFCL && (
            <Button type='button' onClick={handleAddPackageRow} size='sm'>
              + Add Package Row
            </Button>
          )}
        </div>

        {dispatchRecords.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            <Info className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <p className='text-lg font-medium mb-2'>No Dispatch Records</p>
            <p className='text-sm'>
              {isFCL
                ? "Add containers in Shipping Tab first"
                : "Click 'Add Package Row' to start"}
            </p>
          </div>
        ) : (
          <>
            {/* ✅ IMPROVED: Better scrollbar and fixed dropdown behavior */}
            <style jsx>{`
              .dispatch-table-wrapper::-webkit-scrollbar {
                width: 14px;
                height: 14px;
              }
              .dispatch-table-wrapper::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              .dispatch-table-wrapper::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 10px;
                border: 3px solid #f1f1f1;
              }
              .dispatch-table-wrapper::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              /* Firefox */
              .dispatch-table-wrapper {
                scrollbar-width: thick;
                scrollbar-color: #888 #f1f1f1;
              }
            `}</style>

            <div className='overflow-x-auto dispatch-table-wrapper max-h-[600px]'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='w-[50px] sticky left-0 bg-gray-50 z-20'>
                      #
                    </TableHead>
                    {isFCL ? (
                      <>
                        <TableHead className='min-w-[140px]'>
                          Container No.
                        </TableHead>
                        <TableHead className='min-w-[100px]'>Type</TableHead>
                        <TableHead className='min-w-[80px]'>Size</TableHead>
                        <TableHead className='min-w-[110px] text-right'>
                          Weight (kg)
                        </TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className='min-w-[180px]'>
                          Package Type
                        </TableHead>
                        <TableHead className='min-w-[90px]'>Qty</TableHead>
                        <TableHead className='min-w-[110px]'>
                          Weight (kg)
                        </TableHead>
                      </>
                    )}
                    <TableHead className='min-w-[220px]'>Transporter</TableHead>
                    <TableHead className='min-w-[220px]'>Destination</TableHead>
                    <TableHead className='min-w-[220px]'>
                      Empty Return
                    </TableHead>
                    <TableHead className='min-w-[130px]'>
                      Buying (PKR)
                    </TableHead>
                    <TableHead className='min-w-[130px]'>
                      To-Pay (PKR)
                    </TableHead>
                    <TableHead className='min-w-[150px]'>
                      Dispatch Date
                    </TableHead>
                    <TableHead className='w-[80px] sticky right-0 bg-gray-50 z-20'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchRecords.map(
                    (record: DispatchRecord, index: number) => (
                      <TableRow key={index} className='hover:bg-gray-50'>
                        <TableCell className='font-medium sticky left-0 bg-white z-10'>
                          {index + 1}
                        </TableCell>

                        {isFCL ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <Select
                                value={record.packageType || ""}
                                onValueChange={(value) =>
                                  updateDispatchRecord(
                                    index,
                                    "packageType",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className='h-9'>
                                  <SelectValue placeholder='Select' />
                                </SelectTrigger>
                                <SelectContent className='max-h-[300px] overflow-y-auto z-50'>
                                  {packageTypes
                                    .filter(
                                      (pkg: any) => pkg?.value && pkg?.label,
                                    )
                                    .map((pkg: any) => (
                                      <SelectItem
                                        key={pkg.value}
                                        value={pkg.label}
                                      >
                                        {pkg.label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type='number'
                                className='h-9'
                                value={record.quantity || ""}
                                onChange={(e) =>
                                  updateDispatchRecord(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-9'
                                value={record.netWeight || ""}
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
                        <TableCell>
                          <Select
                            value={record.transporterPartyId?.toString() || ""}
                            onValueChange={(value) =>
                              updateDispatchRecord(
                                index,
                                "transporterPartyId",
                                parseInt(value),
                              )
                            }
                          >
                            <SelectTrigger className='h-9'>
                              <SelectValue placeholder='Select Transporter'>
                                {record.transporterPartyId
                                  ? getPartyLabel(record.transporterPartyId)
                                  : "Select Transporter"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className='max-h-[300px] overflow-y-auto z-50'>
                              {parties
                                .filter((p: any) => p?.value)
                                .map((party: any) => (
                                  <SelectItem
                                    key={party.value}
                                    value={party.value.toString()}
                                  >
                                    {party.label || "Unknown"}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Destination */}
                        <TableCell>
                          <Select
                            value={
                              record.destinationLocationId?.toString() || ""
                            }
                            onValueChange={(value) =>
                              updateDispatchRecord(
                                index,
                                "destinationLocationId",
                                parseInt(value),
                              )
                            }
                          >
                            <SelectTrigger className='h-9'>
                              <SelectValue placeholder='Select Destination'>
                                {record.destinationLocationId
                                  ? getLocationLabel(
                                      record.destinationLocationId,
                                    )
                                  : "Select Destination"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className='max-h-[300px] overflow-y-auto z-50'>
                              {locations
                                .filter((location: any) => location?.value)
                                .map((location: any) => (
                                  <SelectItem
                                    key={location.value}
                                    value={location.value.toString()}
                                  >
                                    {location.label || "Unknown"}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* ✅ NEW: Empty Return Field */}
                        <TableCell>
                          <Select
                            value={
                              record.containerReturnTerminalId?.toString() || ""
                            }
                            onValueChange={(value) =>
                              updateDispatchRecord(
                                index,
                                "containerReturnTerminalId",
                                parseInt(value),
                              )
                            }
                          >
                            <SelectTrigger className='h-9'>
                              <SelectValue placeholder='Select Return'>
                                {record.containerReturnTerminalId
                                  ? getLocationLabel(
                                      record.containerReturnTerminalId,
                                    )
                                  : "Select Return"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className='max-h-[300px] overflow-y-auto z-50'>
                              {locations
                                .filter((location: any) => location?.value)
                                .map((location: any) => (
                                  <SelectItem
                                    key={location.value}
                                    value={location.value.toString()}
                                  >
                                    {location.label || "Unknown"}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Buying Amount */}
                        <TableCell>
                          <Input
                            type='number'
                            step='0.01'
                            className='h-9'
                            placeholder='0.00'
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

                        {/* To-Pay Amount */}
                        <TableCell>
                          <Input
                            type='number'
                            step='0.01'
                            className='h-9'
                            placeholder='0.00'
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
                        <TableCell>
                          <Input
                            type='date'
                            className='h-9'
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

                        {/* Actions */}
                        <TableCell className='sticky right-0 bg-white z-10'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteRecord(index)}
                            className='h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Summary Footer */}
        {dispatchRecords.length > 0 && (
          <div className='p-4 border-t bg-gray-50'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              <div>
                <span className='text-gray-600'>
                  Total {isFCL ? "Containers" : "Packages"}:
                </span>{" "}
                <span className='font-semibold'>{totals.containers}</span>
              </div>
              <div>
                <span className='text-gray-600'>Total Weight:</span>{" "}
                <span className='font-semibold'>
                  {totals.totalWeight.toFixed(2)} kg
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Total Buying:</span>{" "}
                <span className='font-semibold'>
                  PKR{" "}
                  {totals.totalBuying.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Total To-Pay:</span>{" "}
                <span className='font-semibold'>
                  PKR{" "}
                  {totals.totalToPay.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className='bg-white p-6 rounded-lg border'>
        <h3 className='text-lg font-semibold mb-4'>Dispatch Notes</h3>
        <textarea
          className='w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Enter any additional dispatch notes or instructions...'
          value={form.watch("dispatchNotes") || ""}
          onChange={(e) => form.setValue("dispatchNotes", e.target.value)}
        />
      </div>
    </TabsContent>
  );
}
