"use client";

import { TabsContent } from "@/components/ui/tabs";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReactSelect, { StylesConfig, GroupBase } from "react-select";
import { compactSelectStyles } from "../utils/styles";
import { fetchGdClearedUnderSection } from "../api/jobOrderApi";

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

// ─── CheckPill — inline checkbox + label (same as JobMainTab) ────────────────
function CheckPill({
  form,
  name,
  label,
}: {
  form: any;
  name: string;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex items-center gap-1.5 space-y-0'>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className='h-3.5 w-3.5 rounded border-gray-400'
            />
          </FormControl>
          <span className='text-[13px] text-gray-700 cursor-pointer select-none leading-none'>
            {label}
          </span>
        </FormItem>
      )}
    />
  );
}

// ─── RMS options with inline colours (used in formatOptionLabel) ─────────────
const RMS_CHANNEL_OPTIONS = [
  { value: "GREEN", label: "Green", hex: "#22c55e", textHex: "#fff" },
  {
    value: "YELLOW_YELLOW",
    label: "Yellow-Yellow",
    hex: "#facc15",
    textHex: "#000",
  },
  { value: "YELLOW_RED", label: "Yellow-Red", hex: "#f97316", textHex: "#fff" },
  { value: "RED", label: "Red", hex: "#ef4444", textHex: "#fff" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface GdClearedOption {
  value: number;
  label: string;
  sectionCode: string;
  sectionName: string;
  isSecurityRequired: boolean;
}

const FALLBACK_GD_OPTIONS: GdClearedOption[] = [
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function CompletionTab({ form, shippingType, toast }: any) {
  const [gdClearedOptions, setGdClearedOptions] = useState<GdClearedOption[]>(
    [],
  );
  const [loadingGdOptions, setLoadingGdOptions] = useState(false);

  // Fetch GD Cleared U/S options from API
  useEffect(() => {
    const load = async () => {
      try {
        const options = await fetchGdClearedUnderSection(setLoadingGdOptions);
        setGdClearedOptions(options?.length ? options : FALLBACK_GD_OPTIONS);
      } catch {
        setGdClearedOptions(FALLBACK_GD_OPTIONS);
      }
    };
    load();
  }, []);

  // Auto-calculate Clearance delay (gdassignToGateOut − gddate)
  useEffect(() => {
    const subscription = form.watch((formValues: any, { name }: any) => {
      if (name === "delayInClearance") return;
      const { gdassignToGateOut, gddate } = formValues;
      if (!gdassignToGateOut || !gddate) return;
      try {
        const diff =
          new Date(gdassignToGateOut).getTime() - new Date(gddate).getTime();
        const days = Math.max(0, Math.ceil(diff / 86400000)).toString();
        if (formValues.delayInClearance !== days)
          form.setValue("delayInClearance", days, {
            shouldValidate: false,
            shouldDirty: false,
          });
      } catch {
        /* ignore */
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-calculate Dispatch delay (earliest dispatchDate − etaDate)
  useEffect(() => {
    const subscription = form.watch((formValues: any, { name }: any) => {
      if (name === "delayInDispatch") return;
      const { dispatchRecords = [], etaDate } = formValues;
      if (!etaDate || !dispatchRecords.length) return;
      try {
        const dates = dispatchRecords
          .map((r: any) => r.dispatchDate)
          .filter(Boolean)
          .map((d: string) => new Date(d).getTime());
        if (!dates.length) return;
        const diff = Math.min(...dates) - new Date(etaDate).getTime();
        const days = Math.max(0, Math.ceil(diff / 86400000)).toString();
        if (formValues.delayInDispatch !== days)
          form.setValue("delayInDispatch", days, {
            shouldValidate: false,
            shouldDirty: false,
          });
      } catch {
        /* ignore */
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Watched values for derived display
  const selectedRmsValue = form.watch("rmschannel");
  const selectedRmsOption = RMS_CHANNEL_OPTIONS.find(
    (o) => o.value === selectedRmsValue,
  );
  const isLCL = shippingType === "LCL" || shippingType === "AIR";

  // Build GD cleared react-select options
  const gdSelectOptions = gdClearedOptions.map((o) => ({
    value: o.value,
    label: `${o.sectionCode} — ${o.sectionName}`,
    isSecurityRequired: o.isSecurityRequired,
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <TabsContent value='completion'>
      <div className='bg-white border border-gray-200 rounded-md p-4'>
        {/* ── GD CLEARANCE INFO ── */}
        <SectionBar title='GD Clearance' />
        <div className='flex flex-wrap gap-x-3 gap-y-3 items-end'>
          {/* GD Cleared U/S */}
          <FormField
            control={form.control}
            name='gdclearedUs'
            render={({ field }) => (
              <FormItem className='min-w-[220px] flex-1'>
                <Field
                  label={
                    loadingGdOptions
                      ? "GD Cleared U/S (loading…)"
                      : "GD Cleared U/S"
                  }
                >
                  {loadingGdOptions ? (
                    <div
                      className={`${tinyInputClass} flex items-center gap-2 bg-gray-50`}
                    >
                      <Loader2 className='h-3.5 w-3.5 animate-spin text-gray-400' />
                      <span className='text-[12px] text-gray-400'>
                        Loading sections…
                      </span>
                    </div>
                  ) : (
                    <FormControl>
                      <ReactSelect
                        options={gdSelectOptions}
                        value={
                          gdSelectOptions.find(
                            (o) =>
                              o.value.toString() === field.value?.toString(),
                          ) || null
                        }
                        onChange={(val) =>
                          field.onChange(val?.value?.toString() ?? "")
                        }
                        styles={tinySelectStyles}
                        isClearable
                        placeholder='Select section…'
                        formatOptionLabel={(opt: any) => (
                          <div className='flex items-center justify-between gap-2'>
                            <span>{opt.label}</span>
                            {opt.isSecurityRequired && (
                              <span className='text-[10px] border border-gray-300 rounded px-1 text-gray-500'>
                                Security req.
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </FormControl>
                  )}
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Security Value */}
          <FormField
            control={form.control}
            name='gdsecurityValue'
            render={({ field }) => (
              <FormItem className='w-[160px]'>
                <Field label='Security Value'>
                  <FormControl>
                    <Input
                      className={tinyInputClass}
                      placeholder='Enter value'
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Security Expiry Date */}
          <FormField
            control={form.control}
            name='gdsecurityExpiryDate'
            render={({ field }) => (
              <FormItem className='w-[155px]'>
                <Field label='Security Expiry Date'>
                  <FormControl>
                    <Input
                      type='date'
                      className={tinyInputClass}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── RMS CHANNEL & DESTUFFING ── */}
        <SectionBar title='Inspection & Channel' />
        <div className='flex flex-wrap gap-x-3 gap-y-3 items-end'>
          {/* RMS Channel */}
          <FormField
            control={form.control}
            name='rmschannel'
            render={({ field }) => (
              <FormItem className='w-[220px]'>
                <Field
                  label={
                    selectedRmsOption
                      ? `RMS Channel — ${selectedRmsOption.label}`
                      : "RMS Channel"
                  }
                >
                  <FormControl>
                    <ReactSelect
                      options={RMS_CHANNEL_OPTIONS}
                      value={
                        RMS_CHANNEL_OPTIONS.find(
                          (o) => o.value === field.value,
                        ) || null
                      }
                      onChange={(val) => field.onChange(val?.value ?? "")}
                      styles={{
                        ...tinySelectStyles,
                        // Colour the single-value background to match the channel
                        singleValue: (base) => ({
                          ...base,
                          color: selectedRmsOption?.textHex ?? "#111",
                          fontWeight: 600,
                        }),
                        control: (base, state) => ({
                          ...(tinySelectStyles.control as any)(base, state),
                          backgroundColor: selectedRmsOption?.hex ?? "white",
                          borderColor:
                            selectedRmsOption?.hex ??
                            (state.isFocused ? "#3b82f6" : "#d1d5db"),
                        }),
                      }}
                      isClearable
                      isSearchable={false}
                      placeholder='Select channel…'
                      formatOptionLabel={(opt: any) => (
                        <div className='flex items-center gap-2'>
                          <span
                            style={{
                              background: opt.hex,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          <span>{opt.label}</span>
                        </div>
                      )}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Destuffing On — LCL/AIR only */}
          <FormField
            control={form.control}
            name='destuffingOn'
            render={({ field }) => (
              <FormItem className='w-[165px]'>
                <Field
                  label={isLCL ? "Destuffing On" : "Destuffing On (LCL only)"}
                >
                  <FormControl>
                    <Input
                      type='date'
                      className={`${tinyInputClass} ${!isLCL ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60" : ""}`}
                      {...field}
                      value={field.value || ""}
                      disabled={!isLCL}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* GD Assign to Gate Out */}
          <FormField
            control={form.control}
            name='gdassignToGateOut'
            render={({ field }) => (
              <FormItem className='w-[170px]'>
                <Field label='GD Assign to Gate-Out'>
                  <FormControl>
                    <Input
                      type='date'
                      className={tinyInputClass}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* PSQCA Samples */}
          <FormField
            control={form.control}
            name='psqcasamples'
            render={({ field }) => (
              <FormItem className='min-w-[180px] flex-1'>
                <Field label='PSQCA Samples'>
                  <FormControl>
                    <Input
                      className={tinyInputClass}
                      placeholder='Sample details…'
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── CLEARANCE FLAGS ── */}
        <SectionBar title='Clearance Status' />
        <div className='flex flex-wrap gap-x-6 gap-y-2 py-0.5'>
          <CheckPill
            form={form}
            name='isClearanceGrounding'
            label='Grounding'
          />
          <CheckPill
            form={form}
            name='isClearanceExamination'
            label='Examination'
          />
          <CheckPill
            form={form}
            name='isClearanceGroup'
            label='Group Clearance'
          />
          <CheckPill form={form} name='isClearanceNoc' label='NOC Required' />
        </div>

        {/* ── DELAY IN CLEARANCE ── */}
        <SectionBar title='Delay in Clearance' />
        <div className='flex flex-wrap gap-x-3 gap-y-3 items-end'>
          <FormField
            control={form.control}
            name='delayInClearance'
            render={({ field }) => (
              <FormItem className='w-[120px]'>
                <Field label='Days ↺ (Gate-Out − GD Date)'>
                  <FormControl>
                    <Input
                      className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed font-semibold text-center`}
                      {...field}
                      value={field.value || "0"}
                      readOnly
                    />
                  </FormControl>
                </Field>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='reasonOfDelayInClearance'
            render={({ field }) => (
              <FormItem className='min-w-[240px] flex-1'>
                <Field label='Reason of Delay'>
                  <FormControl>
                    <Input
                      className={tinyInputClass}
                      placeholder='Enter reason…'
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── DISPATCH FLAGS ── */}
        <SectionBar title='Document Dispatch Status' />
        <div className='flex flex-wrap gap-x-6 gap-y-2 py-0.5'>
          <CheckPill
            form={form}
            name='isDispatchFi'
            label='Form I Dispatched'
          />
          <CheckPill form={form} name='isDispatchObl' label='OBL Dispatched' />
          <CheckPill
            form={form}
            name='isDispatchClearance'
            label='Clearance Docs Dispatched'
          />
        </div>

        {/* ── DELAY IN DISPATCH ── */}
        <SectionBar title='Delay in Dispatch' />
        <div className='flex flex-wrap gap-x-3 gap-y-3 items-end'>
          <FormField
            control={form.control}
            name='delayInDispatch'
            render={({ field }) => (
              <FormItem className='w-[120px]'>
                <Field label='Days ↺ (Dispatch − ETA)'>
                  <FormControl>
                    <Input
                      className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed font-semibold text-center`}
                      {...field}
                      value={field.value || "0"}
                      readOnly
                    />
                  </FormControl>
                </Field>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='reasonOfDelayInDispatch'
            render={({ field }) => (
              <FormItem className='min-w-[240px] flex-1'>
                <Field label='Reason of Delay'>
                  <FormControl>
                    <Input
                      className={tinyInputClass}
                      placeholder='Enter reason…'
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── REMARKS ── */}
        <SectionBar title='Remarks' />
        <FormField
          control={form.control}
          name='remarks'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder='Enter any completion remarks or notes…'
                  className='text-[13px] min-h-[70px] px-2 py-1.5 border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage className='text-[10px]' />
            </FormItem>
          )}
        />
      </div>
    </TabsContent>
  );
}
