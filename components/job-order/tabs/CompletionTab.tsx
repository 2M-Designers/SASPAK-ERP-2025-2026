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

interface GdClearedOption {
  value: number;
  label: string;
  sectionCode: string;
  sectionName: string;
  isSecurityRequired: boolean;
}

export default function CompletionTab({ form, shippingType, toast }: any) {
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
        form.setValue("delayInClearance", Math.max(0, diffDays).toString());
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
          form.setValue("delayInDispatch", Math.max(0, diffDays).toString());
        }
      } catch (error) {
        console.error("Error calculating dispatch delay:", error);
      }
    }
  }, [vesselArrival, form]);

  // Get selected RMS channel for color badge
  const selectedRmsChannel = form.watch("rmschannel");
  const rmsChannelOption = RMS_CHANNEL_OPTIONS.find(
    (opt) => opt.value === selectedRmsChannel,
  );

  // Get selected GD Cleared U/S for display
  const selectedGdCleared = form.watch("gdclearedUs");
  const selectedGdOption = gdClearedOptions.find(
    (opt) => opt.value === selectedGdCleared,
  );

  // ✨ NEW: Watch clearance flags
  const isClearanceGrounding = form.watch("isClearanceGrounding");
  const isClearanceExamination = form.watch("isClearanceExamination");
  const isClearanceGroup = form.watch("isClearanceGroup");
  const isClearanceNoc = form.watch("isClearanceNoc");

  // ✨ NEW: Watch dispatch flags
  const isDispatchFi = form.watch("isDispatchFi");
  const isDispatchObl = form.watch("isDispatchObl");
  const isDispatchClearance = form.watch("isDispatchClearance");

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

              {/* ✨ UPDATED: psqcasamples (lowercase 's') as free text input */}
              <FormField
                control={form.control}
                name='psqcasamples'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PSQCA Samples</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter PSQCA sample details'
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          console.log("PSQCA samples changed:", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ✨ NEW: Clearance Flags Section */}
            <div className='space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='flex items-center gap-2'>
                <Info className='h-5 w-5 text-blue-600' />
                <h4 className='font-semibold text-gray-900'>
                  Clearance Status Flags
                </h4>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {/* isClearanceGrounding */}
                <FormField
                  control={form.control}
                  name='isClearanceGrounding'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel className='cursor-pointer'>
                          Grounding
                        </FormLabel>
                        <p className='text-xs text-gray-500'>
                          Clearance involves grounding
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* isClearanceExamination */}
                <FormField
                  control={form.control}
                  name='isClearanceExamination'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel className='cursor-pointer'>
                          Examination
                        </FormLabel>
                        <p className='text-xs text-gray-500'>
                          Customs examination required
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* isClearanceGroup */}
                <FormField
                  control={form.control}
                  name='isClearanceGroup'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel className='cursor-pointer'>
                          Group Clearance
                        </FormLabel>
                        <p className='text-xs text-gray-500'>
                          Part of group clearance
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* isClearanceNoc */}
                <FormField
                  control={form.control}
                  name='isClearanceNoc'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel className='cursor-pointer'>
                          NOC Required
                        </FormLabel>
                        <p className='text-xs text-gray-500'>
                          No Objection Certificate
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Show active flags */}
              {(isClearanceGrounding ||
                isClearanceExamination ||
                isClearanceGroup ||
                isClearanceNoc) && (
                <div className='flex flex-wrap gap-2 mt-2'>
                  {isClearanceGrounding && (
                    <Badge variant='secondary'>Grounding</Badge>
                  )}
                  {isClearanceExamination && (
                    <Badge variant='secondary'>Examination</Badge>
                  )}
                  {isClearanceGroup && (
                    <Badge variant='secondary'>Group Clearance</Badge>
                  )}
                  {isClearanceNoc && <Badge variant='secondary'>NOC</Badge>}
                </div>
              )}
            </div>

            {/* Delay in Clearance Section */}
            <div className='space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-orange-600' />
                <h4 className='font-semibold text-gray-900'>
                  Delay in Clearance
                </h4>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                          {...field}
                          value={field.value || "0"}
                          readOnly
                          className='bg-gray-100'
                        />
                      </FormControl>
                      <p className='text-xs text-gray-500'>Auto-calculated</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>
            </div>

            {/* ✨ NEW: Dispatch Status Flags Section */}
            <div className='space-y-4 p-4 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2'>
                <Info className='h-5 w-5 text-green-600' />
                <h4 className='font-semibold text-gray-900'>
                  Document Dispatch Status
                </h4>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* isDispatchFi */}
                <FormField
                  control={form.control}
                  name='isDispatchFi'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel className='cursor-pointer'>
                          Form I Dispatched
                        </FormLabel>
                        <p className='text-xs text-gray-500'>
                          FI documents sent
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* isDispatchObl */}
                <FormField
                  control={form.control}
                  name='isDispatchObl'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel className='cursor-pointer'>
                          OBL Dispatched
                        </FormLabel>
                        <p className='text-xs text-gray-500'>
                          Original Bill of Lading sent
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* isDispatchClearance */}
                <FormField
                  control={form.control}
                  name='isDispatchClearance'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel className='cursor-pointer'>
                          Clearance Docs Dispatched
                        </FormLabel>
                        <p className='text-xs text-gray-500'>
                          Clearance documents sent
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Show active dispatch flags */}
              {(isDispatchFi || isDispatchObl || isDispatchClearance) && (
                <div className='flex flex-wrap gap-2 mt-2'>
                  {isDispatchFi && <Badge variant='secondary'>Form I</Badge>}
                  {isDispatchObl && <Badge variant='secondary'>OBL</Badge>}
                  {isDispatchClearance && (
                    <Badge variant='secondary'>Clearance Docs</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Delay in Dispatch Section */}
            <div className='space-y-4 p-4 bg-red-50 rounded-lg border border-red-200'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-red-600' />
                <h4 className='font-semibold text-gray-900'>
                  Delay in Dispatch
                </h4>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                          {...field}
                          value={field.value || "0"}
                          readOnly
                          className='bg-gray-100'
                        />
                      </FormControl>
                      <p className='text-xs text-gray-500'>Auto-calculated</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>
            </div>

            {/* Remarks */}
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
