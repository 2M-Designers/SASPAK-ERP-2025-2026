"use client";

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

// RMS Channel Options with colors
const RMS_CHANNEL_OPTIONS = [
  { value: "GREEN", label: "Green", color: "bg-green-500 text-white" },
  {
    value: "YELLOW_YELLOW",
    label: "Yellow-Yellow",
    color: "bg-yellow-400 text-black",
  },
  {
    value: "YELLOW_RED",
    label: "Yellow-Red",
    color: "bg-orange-500 text-white",
  },
  { value: "RED", label: "Red", color: "bg-red-500 text-white" },
];

// Security Type Options (80, 81, 82, 83)
const SECURITY_TYPE_OPTIONS = [
  { value: "80", label: "80" },
  { value: "81", label: "81" },
  { value: "82", label: "82" },
  { value: "83", label: "83" },
];

// Clearance Delay Type Options
const CLEARANCE_DELAY_TYPES = [
  { value: "GROUNDING", label: "Grounding" },
  { value: "EXAMINATION", label: "Examination" },
  { value: "GROUP", label: "Group" },
  { value: "NOC", label: "NOC" },
];

// Dispatch Delay Type Options
const DISPATCH_DELAY_TYPES = [
  { value: "FI", label: "FI (Form I)" },
  { value: "OBL", label: "OBL (Original Bill of Lading)" },
  { value: "CLEARANCE", label: "Clearance" },
];

export default function CompletionTab({ form, shippingType }: any) {
  const [clearanceDelayTypes, setClearanceDelayTypes] = useState<string[]>([]);
  const [dispatchDelayTypes, setDispatchDelayTypes] = useState<string[]>([]);

  // Watch relevant dates for automatic calculation
  const gateOutDate = form.watch("gateOutDate");
  const gdDate = form.watch("gddate");
  const vesselArrival = form.watch("vesselArrival");

  // Calculate Clearance Delay Days automatically
  useEffect(() => {
    if (gateOutDate && gdDate) {
      try {
        const gateOut = new Date(gateOutDate);
        const gd = new Date(gdDate);
        const diffTime = gateOut.getTime() - gd.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        form.setValue("delayInClearanceDays", Math.max(0, diffDays));
      } catch (error) {
        console.error("Error calculating clearance delay:", error);
      }
    }
  }, [gateOutDate, gdDate, form]);

  // Calculate Dispatch Delay Days automatically
  useEffect(() => {
    // Get earliest dispatch date from dispatch records
    const dispatchRecords = form.watch("dispatchRecords") || [];
    if (dispatchRecords.length > 0 && vesselArrival) {
      try {
        const dispatchDates = dispatchRecords
          .map((r: any) => r.dispatchDate)
          .filter(Boolean)
          .map((d: string) => new Date(d));

        if (dispatchDates.length > 0) {
          const earliestDispatch = new Date(
            Math.min(...dispatchDates.map((d: Date) => d.getTime())),
          );
          const arrival = new Date(vesselArrival);
          const diffTime = earliestDispatch.getTime() - arrival.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          form.setValue("delayInDispatchDays", Math.max(0, diffDays));
        }
      } catch (error) {
        console.error("Error calculating dispatch delay:", error);
      }
    }
  }, [vesselArrival, form]);

  // Handle multi-select for clearance delay types
  const handleClearanceDelayTypeToggle = (value: string) => {
    const updated = clearanceDelayTypes.includes(value)
      ? clearanceDelayTypes.filter((t) => t !== value)
      : [...clearanceDelayTypes, value];

    setClearanceDelayTypes(updated);
    form.setValue("delayInClearanceType", updated.join(","));
  };

  // Handle multi-select for dispatch delay types
  const handleDispatchDelayTypeToggle = (value: string) => {
    const updated = dispatchDelayTypes.includes(value)
      ? dispatchDelayTypes.filter((t) => t !== value)
      : [...dispatchDelayTypes, value];

    setDispatchDelayTypes(updated);
    form.setValue("delayInDispatchType", updated.join(","));
  };

  // Load existing multi-select values
  useEffect(() => {
    const clearanceTypes = form.watch("delayInClearanceType");
    if (clearanceTypes) {
      setClearanceDelayTypes(
        clearanceTypes
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
      );
    }

    const dispatchTypes = form.watch("delayInDispatchType");
    if (dispatchTypes) {
      setDispatchDelayTypes(
        dispatchTypes
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
      );
    }
  }, []);

  // Get selected RMS channel for color badge
  const selectedRmsChannel = form.watch("rmsChannel");
  const rmsChannelOption = RMS_CHANNEL_OPTIONS.find(
    (opt) => opt.value === selectedRmsChannel,
  );

  // Check if shipping type is LCL
  const isLCL = shippingType === "LCL" || shippingType === "AIR";

  return (
    <TabsContent value='completion' className='space-y-4'>
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Completion Details
              </h3>
              <Badge variant='outline' className='text-xs'>
                Job Completion Status
              </Badge>
            </div>

            {/* GD Cleared U/S Section */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <FormField
                control={form.control}
                name='gdClearedUs'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      GD Cleared U/S{" "}
                      <span className='text-xs text-gray-500'>
                        (Security Type)
                      </span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type (80, 81, etc.)' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SECURITY_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='gdSecurityValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter security value'
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='gdSecurityExpiryDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* RMS Channel */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='rmsChannel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      RMS Channel
                      {rmsChannelOption && (
                        <Badge className={`${rmsChannelOption.color} ml-2`}>
                          {rmsChannelOption.label}
                        </Badge>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select RMS channel' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RMS_CHANNEL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className='flex items-center gap-2'>
                              <div
                                className={`w-3 h-3 rounded-full ${option.color}`}
                              ></div>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Destuffing On - Only for LCL */}
              <FormField
                control={form.control}
                name='destuffingOn'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      Destuffing On
                      <Badge variant='secondary' className='text-xs'>
                        Only for LCL
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        value={field.value || ""}
                        disabled={!isLCL}
                        className={!isLCL ? "bg-gray-100" : ""}
                      />
                    </FormControl>
                    {!isLCL && (
                      <p className='text-xs text-gray-500 flex items-center gap-1'>
                        <Info className='h-3 w-3' />
                        Available only for LCL/Air shipments
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* GD Assign to Gate Out Date */}
            <FormField
              control={form.control}
              name='gdAssignToGateOutDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GD Assign to Gate Out Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delay in Clearance Section */}
            <div className='space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-orange-600' />
                <h4 className='font-semibold text-gray-900'>
                  Delay in Clearance
                </h4>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Days (Auto-calculated) */}
                <FormField
                  control={form.control}
                  name='delayInClearanceDays'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Days{" "}
                        <span className='text-xs text-gray-500'>
                          (Gate Out - GD Date)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          {...field}
                          value={field.value || 0}
                          readOnly
                          className='bg-gray-100'
                        />
                      </FormControl>
                      <p className='text-xs text-gray-500'>Auto-calculated</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name='delayInClearanceReason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason of Delay</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter reason'
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type (Multi-select) */}
                <FormItem>
                  <FormLabel>
                    Type{" "}
                    <span className='text-xs text-gray-500'>
                      (Multi-select)
                    </span>
                  </FormLabel>
                  <div className='space-y-2 border rounded-md p-3 bg-white'>
                    {CLEARANCE_DELAY_TYPES.map((type) => (
                      <div
                        key={type.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`clearance-${type.value}`}
                          checked={clearanceDelayTypes.includes(type.value)}
                          onCheckedChange={() =>
                            handleClearanceDelayTypeToggle(type.value)
                          }
                        />
                        <label
                          htmlFor={`clearance-${type.value}`}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                        >
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {clearanceDelayTypes.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-2'>
                      {clearanceDelayTypes.map((type) => (
                        <Badge
                          key={type}
                          variant='secondary'
                          className='text-xs'
                        >
                          {
                            CLEARANCE_DELAY_TYPES.find((t) => t.value === type)
                              ?.label
                          }
                        </Badge>
                      ))}
                    </div>
                  )}
                </FormItem>
              </div>
            </div>

            {/* Delay in Dispatch Section */}
            <div className='space-y-4 p-4 bg-red-50 rounded-lg border border-red-200'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-red-600' />
                <h4 className='font-semibold text-gray-900'>
                  Delay in Dispatch
                </h4>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Days (Auto-calculated) */}
                <FormField
                  control={form.control}
                  name='delayInDispatchDays'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Days{" "}
                        <span className='text-xs text-gray-500'>
                          (Earliest Dispatch - Arrival)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          {...field}
                          value={field.value || 0}
                          readOnly
                          className='bg-gray-100'
                        />
                      </FormControl>
                      <p className='text-xs text-gray-500'>Auto-calculated</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name='delayInDispatchReason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason of Delay</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter reason'
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type (Multi-select) */}
                <FormItem>
                  <FormLabel>
                    Type{" "}
                    <span className='text-xs text-gray-500'>
                      (Multi-select)
                    </span>
                  </FormLabel>
                  <div className='space-y-2 border rounded-md p-3 bg-white'>
                    {DISPATCH_DELAY_TYPES.map((type) => (
                      <div
                        key={type.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`dispatch-${type.value}`}
                          checked={dispatchDelayTypes.includes(type.value)}
                          onCheckedChange={() =>
                            handleDispatchDelayTypeToggle(type.value)
                          }
                        />
                        <label
                          htmlFor={`dispatch-${type.value}`}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                        >
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {dispatchDelayTypes.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-2'>
                      {dispatchDelayTypes.map((type) => (
                        <Badge
                          key={type}
                          variant='secondary'
                          className='text-xs'
                        >
                          {
                            DISPATCH_DELAY_TYPES.find((t) => t.value === type)
                              ?.label
                          }
                        </Badge>
                      ))}
                    </div>
                  )}
                </FormItem>
              </div>
            </div>

            {/* Remarks */}
            <FormField
              control={form.control}
              name='completionRemarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any completion remarks or notes...'
                      className='min-h-[100px]'
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
