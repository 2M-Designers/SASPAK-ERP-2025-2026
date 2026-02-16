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
import { Calendar, AlertCircle, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { fetchGdClearedUnderSection } from "../api/jobOrderApi";

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

// PSQCA Options
const PSQCA_OPTIONS = [
  { value: "Submitted", label: "Submitted" },
  { value: "Not Required", label: "Not Required" },
  { value: "Pending", label: "Pending" },
];

interface GdClearedOption {
  value: number;
  label: string;
  sectionCode: string;
  sectionName: string;
  isSecurityRequired: boolean;
}

export default function CompletionTab({ form, shippingType, toast }: any) {
  const [clearanceDelayTypes, setClearanceDelayTypes] = useState<string[]>([]);
  const [dispatchDelayTypes, setDispatchDelayTypes] = useState<string[]>([]);
  const [gdClearedOptions, setGdClearedOptions] = useState<GdClearedOption[]>(
    [],
  );
  const [loadingGdOptions, setLoadingGdOptions] = useState<boolean>(false);

  // Watch relevant dates for automatic calculation
  const gateOutDate = form.watch("gateOutDate");
  const gdDate = form.watch("gddate");
  const vesselArrival = form.watch("vesselArrival");

  // Fetch GD Cleared U/S options from API
  useEffect(() => {
    const loadGdClearedOptions = async () => {
      try {
        const options = await fetchGdClearedUnderSection(setLoadingGdOptions);

        if (options && options.length > 0) {
          setGdClearedOptions(options);
          console.log("GD Cleared U/S options loaded:", options);

          if (toast) {
            toast({
              title: "GD Cleared U/S Loaded",
              description: `${options.length} option(s) available`,
            });
          }
        } else {
          const fallbackOptions: GdClearedOption[] = [
            {
              value: 80,
              label: "80 - Section 80",
              sectionCode: "80",
              sectionName: "Section 80",
              isSecurityRequired: false,
            },
            {
              value: 81,
              label: "81 - Section 81",
              sectionCode: "81",
              sectionName: "Section 81",
              isSecurityRequired: false,
            },
            {
              value: 82,
              label: "82 - Section 82",
              sectionCode: "82",
              sectionName: "Section 82",
              isSecurityRequired: false,
            },
            {
              value: 83,
              label: "83 - Section 83",
              sectionCode: "83",
              sectionName: "Section 83",
              isSecurityRequired: false,
            },
          ];
          setGdClearedOptions(fallbackOptions);
        }
      } catch (error: any) {
        console.error("Error loading GD Cleared U/S options:", error);
        const fallbackOptions: GdClearedOption[] = [
          {
            value: 80,
            label: "80 - Section 80",
            sectionCode: "80",
            sectionName: "Section 80",
            isSecurityRequired: false,
          },
          {
            value: 81,
            label: "81 - Section 81",
            sectionCode: "81",
            sectionName: "Section 81",
            isSecurityRequired: false,
          },
          {
            value: 82,
            label: "82 - Section 82",
            sectionCode: "82",
            sectionName: "Section 82",
            isSecurityRequired: false,
          },
          {
            value: 83,
            label: "83 - Section 83",
            sectionCode: "83",
            sectionName: "Section 83",
            isSecurityRequired: false,
          },
        ];
        setGdClearedOptions(fallbackOptions);
      }
    };

    loadGdClearedOptions();
  }, [toast]);

  // Calculate Clearance Delay Days automatically
  useEffect(() => {
    if (gateOutDate && gdDate) {
      try {
        const gateOut = new Date(gateOutDate);
        const gd = new Date(gdDate);
        const diffTime = gateOut.getTime() - gd.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        form.setValue("delayInClearance", Math.max(0, diffDays)); // ✅ FIXED NAME
      } catch (error) {
        console.error("Error calculating clearance delay:", error);
      }
    }
  }, [gateOutDate, gdDate, form]);

  // Calculate Dispatch Delay Days automatically
  useEffect(() => {
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
          form.setValue("delayInDispatch", Math.max(0, diffDays)); // ✅ FIXED NAME
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
    form.setValue("delayInClearanceType", updated.join(",")); // ✅ FIXED NAME
    console.log("Clearance delay types updated:", updated);
  };

  // Handle multi-select for dispatch delay types
  const handleDispatchDelayTypeToggle = (value: string) => {
    const updated = dispatchDelayTypes.includes(value)
      ? dispatchDelayTypes.filter((t) => t !== value)
      : [...dispatchDelayTypes, value];

    setDispatchDelayTypes(updated);
    form.setValue("delayInDispatchType", updated.join(",")); // ✅ FIXED NAME
    console.log("Dispatch delay types updated:", updated);
  };

  // Load existing multi-select values
  useEffect(() => {
    const clearanceTypes = form.watch("delayInClearanceType"); // ✅ FIXED NAME
    if (clearanceTypes) {
      setClearanceDelayTypes(
        clearanceTypes
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
      );
    }

    const dispatchTypes = form.watch("delayInDispatchType"); // ✅ FIXED NAME
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
  const selectedRmsChannel = form.watch("rmschannel"); // ✅ FIXED NAME
  const rmsChannelOption = RMS_CHANNEL_OPTIONS.find(
    (opt) => opt.value === selectedRmsChannel,
  );

  // Get selected GD Cleared U/S for display
  const selectedGdCleared = form.watch("gdclearedUs"); // ✅ FIXED NAME
  const selectedGdOption = gdClearedOptions.find(
    (opt) => opt.value === selectedGdCleared,
  );

  const selectedPsqca = form.watch("psqcaSamples");

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
              {/* ✅ FIXED: gdclearedUs */}
              <FormField
                control={form.control}
                name='gdclearedUs'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      GD Cleared U/S{" "}
                      <span className='text-xs text-gray-500'>
                        (Security Type)
                      </span>
                    </FormLabel>
                    <Select
                      key={`gd-cleared-${field.value || "none"}`}
                      value={field.value?.toString()}
                      onValueChange={(value) => {
                        console.log("GD Cleared U/S selected:", value);
                        field.onChange(value);
                      }}
                      disabled={loadingGdOptions}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingGdOptions
                                ? "Loading..."
                                : "Select security type"
                            }
                          >
                            {loadingGdOptions ? (
                              <span className='flex items-center gap-2'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                Loading...
                              </span>
                            ) : selectedGdOption ? (
                              `${selectedGdOption.sectionCode} - ${selectedGdOption.sectionName}`
                            ) : (
                              "Select security type"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position='popper'
                        sideOffset={5}
                        className='max-h-[300px] overflow-y-auto z-50'
                      >
                        {gdClearedOptions.length === 0 && !loadingGdOptions ? (
                          <SelectItem value='none'>
                            No options available
                          </SelectItem>
                        ) : (
                          gdClearedOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value.toString()}
                            >
                              <div className='flex items-center justify-between w-full gap-2'>
                                <span>
                                  {option.sectionCode} - {option.sectionName}
                                </span>
                                {option.isSecurityRequired && (
                                  <Badge
                                    variant='outline'
                                    className='text-xs ml-2'
                                  >
                                    Security Required
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedGdOption && (
                      <p className='text-xs text-green-600'>
                        ✅ Selected: {selectedGdOption.sectionCode} -{" "}
                        {selectedGdOption.sectionName}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ FIXED: gdsecurityValue */}
              <FormField
                control={form.control}
                name='gdsecurityValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter security value'
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          console.log(
                            "Security value changed:",
                            e.target.value,
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ FIXED: gdsecurityExpiryDate */}
              <FormField
                control={form.control}
                name='gdsecurityExpiryDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          console.log("Expiry date changed:", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* RMS Channel */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* ✅ FIXED: rmschannel */}
              <FormField
                control={form.control}
                name='rmschannel'
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
                    <Select
                      key={`rms-${field.value || "none"}`}
                      value={field.value}
                      onValueChange={(value) => {
                        console.log("RMS Channel selected:", value);
                        field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select RMS channel' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position='popper'
                        sideOffset={5}
                        className='max-h-[300px] overflow-y-auto z-50'
                      >
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
                    {field.value && (
                      <p className='text-xs text-green-600'>
                        ✅ Selected: {rmsChannelOption?.label}
                      </p>
                    )}
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
                        onChange={(e) => {
                          field.onChange(e);
                          console.log(
                            "Destuffing date changed:",
                            e.target.value,
                          );
                        }}
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

            {/* GD Assign to Gate Out Date & PSQCA */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* ✅ FIXED: gdassignToGateOut */}
              <FormField
                control={form.control}
                name='gdassignToGateOut'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GD Assign to Gate Out Date</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          console.log(
                            "GD Assign to Gate Out Date changed:",
                            e.target.value,
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PSQCA Samples */}
              <FormField
                control={form.control}
                name='psqcaSamples'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PSQCA Samples</FormLabel>
                    <Select
                      key={`psqca-${field.value || "none"}`}
                      value={field.value}
                      onValueChange={(value) => {
                        console.log("PSQCA status selected:", value);
                        field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select Status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position='popper'
                        sideOffset={5}
                        className='max-h-[300px] overflow-y-auto z-50'
                      >
                        {PSQCA_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value && (
                      <p className='text-xs text-green-600'>
                        ✅ Selected: {field.value}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delay in Clearance Section */}
            <div className='space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-orange-600' />
                <h4 className='font-semibold text-gray-900'>
                  Delay in Clearance
                </h4>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* ✅ FIXED: delayInClearance (not delayInClearanceDays) */}
                <FormField
                  control={form.control}
                  name='delayInClearance'
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

                {/* ✅ FIXED: reasonOfDelayInClearance */}
                <FormField
                  control={form.control}
                  name='reasonOfDelayInClearance'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason of Delay</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter reason'
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            console.log(
                              "Clearance delay reason changed:",
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ✅ delayInClearanceType (multi-select) */}
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
                {/* ✅ FIXED: delayInDispatch (not delayInDispatchDays) */}
                <FormField
                  control={form.control}
                  name='delayInDispatch'
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

                {/* ✅ FIXED: reasonOfDelayInDispatch */}
                <FormField
                  control={form.control}
                  name='reasonOfDelayInDispatch'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason of Delay</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter reason'
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            console.log(
                              "Dispatch delay reason changed:",
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ✅ delayInDispatchType (multi-select) */}
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

            {/* ✅ FIXED: remarks (not completionRemarks) */}
            <FormField
              control={form.control}
              name='remarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any completion remarks or notes...'
                      className='min-h-[100px]'
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        console.log(
                          "Completion remarks changed:",
                          e.target.value,
                        );
                      }}
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
