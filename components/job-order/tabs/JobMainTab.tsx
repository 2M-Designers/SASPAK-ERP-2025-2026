import { TabsContent } from "@/components/ui/tabs";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Select from "react-select";
import { compactSelectStyles } from "../utils/styles";

interface SelectOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

interface JobMainTabProps {
  form: any;
  parties: SelectOption[];
  processOwners: SelectOption[];
  shippers: SelectOption[];
  consignees: SelectOption[];
  localAgents: SelectOption[];
  carriers: SelectOption[];
  transporters: SelectOption[];
  terminals: SelectOption[];
  operationTypes: SelectOption[];
  operationModes: SelectOption[];
  jobLoadTypes: SelectOption[];
  jobLoads: SelectOption[];
  documentTypes: SelectOption[];
  loadingParties: boolean;
  loadingOperationTypes: boolean;
  loadingOperationModes: boolean;
  loadingJobLoadTypes: boolean;
  loadingJobLoads: boolean;
  loadingDocumentTypes: boolean;
  mode?: string;
  shippingType?: string;
  documentType?: string;
  shipperId?: number;
  consigneeId?: number;
}

// ─── Shared compact primitives (same design language as ShippingTab) ─────────

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

function SectionBar({ title }: { title: string }) {
  return (
    <div className='flex items-center gap-2 mt-4 mb-2 first:mt-0'>
      <span className='text-[11px] font-bold uppercase tracking-widest text-blue-700 whitespace-nowrap'>
        {title}
      </span>
      <div className='flex-1 border-t border-blue-200' />
    </div>
  );
}

const tinySelectStyles = {
  ...compactSelectStyles,
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "30px",
    height: "30px",
    fontSize: "13px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": { borderColor: "#3b82f6" },
  }),
  valueContainer: (base: any) => ({ ...base, padding: "0 6px" }),
  input: (base: any) => ({ ...base, margin: 0, padding: 0, fontSize: "13px" }),
  indicatorsContainer: (base: any) => ({ ...base, height: "30px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base: any) => ({ ...base, padding: "0 4px" }),
  menu: (base: any) => ({ ...base, fontSize: "13px", zIndex: 9999 }),
  option: (base: any, state: any) => ({
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

const tinyInputClass =
  "h-[30px] text-[13px] px-2 py-0 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

// ─── Checkbox pill — label + box side by side ────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function JobMainTab(props: JobMainTabProps) {
  const {
    form,
    processOwners,
    shippers,
    consignees,
    operationTypes,
    operationModes,
    jobLoadTypes,
    jobLoads,
    documentTypes,
    loadingParties,
    loadingOperationTypes,
    loadingOperationModes,
    loadingJobLoadTypes,
    loadingJobLoads,
    loadingDocumentTypes,
    mode,
    shippingType,
  } = props;

  return (
    <TabsContent value='main'>
      <div className='bg-white border border-gray-200 rounded-md p-4 space-y-1'>
        {/* ── JOB REFERENCE ── */}
        <SectionBar title='Job Reference' />
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-3'>
          {/* Job Number — read-only, amber tint like auto-calc fields */}
          <FormField
            control={form.control}
            name='jobNumber'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Job Order No. ↺'>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed`}
                      placeholder='Auto-generated'
                      readOnly
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Job Date — read-only */}
          <FormField
            control={form.control}
            name='jobDate'
            render={({ field }) => (
              <FormItem>
                <Field label='Job Date ↺'>
                  <FormControl>
                    <Input
                      type='date'
                      {...field}
                      value={field.value || ""}
                      className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed`}
                      readOnly
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Customer Reference */}
          <FormField
            control={form.control}
            name='customerReferenceNumber'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Customer Reference No.'>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      className={tinyInputClass}
                      placeholder='e.g. CR-2025-0001'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── SCOPE ── */}
        <SectionBar title='Scope' />
        <div className='flex flex-wrap gap-x-6 gap-y-2 py-0.5'>
          <CheckPill
            form={form}
            name='isFreightForwarding'
            label='Freight Forwarding'
          />
          <CheckPill form={form} name='isClearance' label='Clearance' />
          <CheckPill form={form} name='isTransporter' label='Transport' />
          <CheckPill form={form} name='isOther' label='Other' />
        </div>

        {/* ── OPERATION DETAILS ── */}
        <SectionBar title='Operation Details' />
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-3'>
          {/* Direction */}
          <FormField
            control={form.control}
            name='operationType'
            render={({ field }) => (
              <FormItem>
                <Field label='Direction'>
                  <FormControl>
                    <Select
                      options={operationTypes}
                      value={
                        operationTypes.find((t) => t.value === field.value) ||
                        null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingOperationTypes}
                      isClearable
                      placeholder='Import / Export…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Mode */}
          <FormField
            control={form.control}
            name='operationMode'
            render={({ field }) => (
              <FormItem>
                <Field label='Mode'>
                  <FormControl>
                    <Select
                      options={operationModes}
                      value={
                        operationModes.find((m) => m.value === field.value) ||
                        null
                      }
                      onChange={(val) => {
                        field.onChange(val?.value);
                        if (val?.value === "AIR") {
                          form.setValue("jobSubType", "");
                          form.setValue("jobLoadType", "");
                        }
                      }}
                      styles={tinySelectStyles}
                      isLoading={loadingOperationModes}
                      isClearable
                      placeholder='SEA / AIR…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Shipping Type — hidden for AIR */}
          {mode !== "AIR" && (
            <FormField
              control={form.control}
              name='jobSubType'
              render={({ field }) => (
                <FormItem>
                  <Field label='Shipping Type'>
                    <FormControl>
                      <Select
                        options={jobLoadTypes}
                        value={
                          jobLoadTypes.find((t) => t.value === field.value) ||
                          null
                        }
                        onChange={(val) => field.onChange(val?.value)}
                        styles={tinySelectStyles}
                        isLoading={loadingJobLoadTypes}
                        isClearable
                        placeholder='FCL / LCL…'
                      />
                    </FormControl>
                  </Field>
                  <FormMessage className='text-[10px]' />
                </FormItem>
              )}
            />
          )}

          {/* Load — only for FCL */}
          {shippingType === "FCL" && (
            <FormField
              control={form.control}
              name='jobLoadType'
              render={({ field }) => (
                <FormItem>
                  <Field label='Load'>
                    <FormControl>
                      <Select
                        options={jobLoads}
                        value={
                          jobLoads.find((l) => l.value === field.value) || null
                        }
                        onChange={(val) => field.onChange(val?.value)}
                        styles={tinySelectStyles}
                        isLoading={loadingJobLoads}
                        isClearable
                        placeholder='Select load…'
                      />
                    </FormControl>
                  </Field>
                  <FormMessage className='text-[10px]' />
                </FormItem>
              )}
            />
          )}

          {/* Document Type */}
          <FormField
            control={form.control}
            name='jobDocumentType'
            render={({ field }) => (
              <FormItem>
                <Field label='Document Type'>
                  <FormControl>
                    <Select
                      options={documentTypes}
                      value={
                        documentTypes.find((d) => d.value === field.value) ||
                        null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingDocumentTypes}
                      isClearable
                      placeholder='Master / House…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── PARTIES ── */}
        <SectionBar title='Parties' />
        <div className='grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-3'>
          {/* Shipper */}
          <FormField
            control={form.control}
            name='shipperPartyId'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Shipper'>
                  <FormControl>
                    <Select
                      options={shippers}
                      value={
                        shippers.find((p) => p.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingParties}
                      isClearable
                      placeholder='Select shipper…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Consignee */}
          <FormField
            control={form.control}
            name='consigneePartyId'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Consignee'>
                  <FormControl>
                    <Select
                      options={consignees}
                      value={
                        consignees.find((p) => p.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingParties}
                      isClearable
                      placeholder='Select consignee…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Process Owner */}
          <FormField
            control={form.control}
            name='processOwnerId'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Process Owner'>
                  <FormControl>
                    <Select
                      options={processOwners}
                      value={
                        processOwners.find((p) => p.value === field.value) ||
                        null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingParties}
                      isClearable
                      placeholder='Select process owner…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>
      </div>
    </TabsContent>
  );
}
