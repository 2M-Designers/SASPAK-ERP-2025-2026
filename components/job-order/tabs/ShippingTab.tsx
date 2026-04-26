import { TabsContent } from "@/components/ui/tabs";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Select from "react-select";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { compactSelectStyles } from "../utils/styles";
import { useState, useEffect } from "react";

interface SelectOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

interface FclContainer {
  jobEquipmentId?: number;
  containerNo: string;
  containerSizeId?: number;
  containerTypeId?: number;
  tareWeight: number;
  sealNo?: string;
  eirReceivedOn?: string;
  eirSubmitted: boolean;
  eirDocumentId?: number;
  rentInvoiceIssuedOn?: string;
  containerRentFc: number;
  containerRentLc: number;
  damageDirtyFc: number;
  damageDirtyLc: number;
  refundAppliedOn?: string;
  refundFc: number;
  refundLc: number;
  gateOutDate?: string;
  gateInDate?: string;
  status?: string;
  noOfPackages?: number;
  packageType?: string;
}

interface ShippingTabProps {
  form: any;
  parties: SelectOption[];
  localAgents: SelectOption[];
  carriers: SelectOption[];
  terminals: SelectOption[];
  locations: SelectOption[];
  vessels: SelectOption[];
  containerTypes: SelectOption[];
  containerSizes: SelectOption[];
  packageTypes: SelectOption[];
  freightTypes: SelectOption[];
  blStatuses: SelectOption[];
  loadingParties: boolean;
  loadingLocations: boolean;
  loadingVessels: boolean;
  loadingContainerTypes: boolean;
  loadingContainerSizes: boolean;
  loadingPackageTypes: boolean;
  loadingFreightTypes: boolean;
  loadingBLStatuses: boolean;
  documentType?: string;
  shippingType?: string;
  mode?: string;
  fclContainers: FclContainer[];
  setFclContainers: (containers: FclContainer[]) => void;
  fclForm: any;
  showFclForm: boolean;
  setShowFclForm: (show: boolean) => void;
  toast: any;
}

// ─── Tiny reusable wrappers for ultra-compact layout ───────────────────────

/** A labelled field cell — label on top, control below, minimal gap */
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

/** Horizontal divider with a section title */
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

// Tighter select styles tuned for compact rows
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

export default function ShippingTab(props: ShippingTabProps) {
  const {
    form,
    parties,
    localAgents,
    carriers,
    terminals,
    locations,
    vessels,
    containerTypes,
    containerSizes,
    packageTypes,
    freightTypes,
    blStatuses,
    loadingLocations,
    loadingVessels,
    loadingContainerTypes,
    loadingContainerSizes,
    loadingPackageTypes,
    loadingFreightTypes,
    loadingBLStatuses,
    documentType,
    shippingType,
    mode,
    fclContainers,
    setFclContainers,
    fclForm,
    showFclForm,
    setShowFclForm,
    toast,
  } = props;

  const [duplicateContainerNumbers, setDuplicateContainerNumbers] = useState<
    string[]
  >([]);
  const containerNoPattern = /^[A-Z]{4}[-]?\d{6,7}[-]?\d?$/;

  // Auto-calculate Last Free Day
  useEffect(() => {
    const etaDate = form.watch("etaDate");
    const freeDays = form.watch("freeDays");
    if (etaDate && freeDays > 0) {
      const eta = new Date(etaDate);
      const lastFreeDay = new Date(eta);
      lastFreeDay.setDate(eta.getDate() + freeDays);
      form.setValue("lastFreeDay", lastFreeDay.toISOString().split("T")[0]);
    } else {
      form.setValue("lastFreeDay", "");
    }
  }, [form.watch("etaDate"), form.watch("freeDays")]);

  const checkForDuplicates = (containerNo: string) =>
    fclContainers.some(
      (c) => c.containerNo.toUpperCase() === containerNo.toUpperCase(),
    );

  useEffect(() => {
    const nos = fclContainers.map((c) => c.containerNo.toUpperCase());
    const dups: string[] = [];
    nos.forEach((n, i) => {
      if (nos.indexOf(n) !== i && !dups.includes(n)) dups.push(n);
    });
    setDuplicateContainerNumbers(dups);
  }, [fclContainers]);

  const handleAddFcl = (data: FclContainer) => {
    if (!containerNoPattern.test(data.containerNo)) {
      toast({
        variant: "destructive",
        title: "Invalid Container Number",
        description: "Format: ABCU-123456-7 or ABCU1234567",
      });
      return;
    }
    if (checkForDuplicates(data.containerNo)) {
      toast({
        variant: "destructive",
        title: "Duplicate Container",
        description: `${data.containerNo} already exists.`,
      });
      return;
    }
    setFclContainers([
      ...fclContainers,
      {
        ...data,
        noOfPackages: data.noOfPackages || 0,
        packageType: data.packageType || "NA",
      },
    ]);
    fclForm.reset({
      containerNo: "",
      containerSizeId: data.containerSizeId,
      containerTypeId: data.containerTypeId,
      tareWeight: 0,
      sealNo: "",
      gateOutDate: "",
      gateInDate: "",
      status: "",
      noOfPackages: 0,
      packageType: "",
    });
    toast({ title: "Container added", description: data.containerNo });
  };

  const handleDeleteFcl = (index: number) => {
    if (confirm("Delete this container?")) {
      setFclContainers(fclContainers.filter((_, i) => i !== index));
    }
  };

  return (
    <TabsContent value='shipping'>
      {/* ── Single white card, everything inside ── */}
      <div className='bg-white border border-gray-200 rounded-md p-4 space-y-1'>
        {/* ── DOCUMENT INFORMATION ── */}
        <SectionBar title='Document Information' />
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-3'>
          {/* Master Doc No — wider */}
          <FormField
            control={form.control}
            name='masterDocumentNumber'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Master Doc No.'>
                  <FormControl>
                    <Input
                      className={tinyInputClass}
                      {...field}
                      value={field.value || ""}
                      placeholder='e.g. MAEU123456789'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Master Doc Date */}
          <FormField
            control={form.control}
            name='masterDocumentDate'
            render={({ field }) => (
              <FormItem>
                <Field label='Master Doc Date'>
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

          {/* Local Agent */}
          <FormField
            control={form.control}
            name='principalId'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Local Agent'>
                  <FormControl>
                    <Select
                      options={localAgents}
                      value={
                        localAgents.find((p) => p.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Carrier */}
          <FormField
            control={form.control}
            name='carrierPartyId'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Carrier'>
                  <FormControl>
                    <Select
                      options={carriers}
                      value={
                        carriers.find((p) => p.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Conditional House fields */}
          {documentType === "House" && (
            <>
              <FormField
                control={form.control}
                name='houseDocumentNumber'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <Field label='House Doc No.'>
                      <FormControl>
                        <Input
                          className={tinyInputClass}
                          {...field}
                          value={field.value || ""}
                          placeholder='House document no.'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='houseDocumentDate'
                render={({ field }) => (
                  <FormItem>
                    <Field label='House Doc Date'>
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

              <FormField
                control={form.control}
                name='overseasAgentId'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <Field label='Origin Agent'>
                      <FormControl>
                        <Select
                          options={parties}
                          value={
                            parties.find((p) => p.value === field.value) || null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={tinySelectStyles}
                          isClearable
                          placeholder='Select…'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* ── VESSEL & SCHEDULE ── */}
        <SectionBar title='Vessel & Schedule' />
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-3'>
          <FormField
            control={form.control}
            name='vesselName'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Vessel / Flight No.'>
                  <FormControl>
                    <Select
                      options={vessels}
                      value={
                        vessels.find((v) => v.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingVessels}
                      isClearable
                      placeholder='Select vessel…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='etaDate'
            render={({ field }) => (
              <FormItem>
                <Field label='Arrival Date (ETA)'>
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

          <FormField
            control={form.control}
            name='freeDays'
            render={({ field }) => (
              <FormItem>
                <Field label='Free Days'>
                  <FormControl>
                    <Input
                      type='number'
                      className={tinyInputClass}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder='0'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          {/* Auto-calc Last Free Day */}
          <FormField
            control={form.control}
            name='lastFreeDay'
            render={({ field }) => (
              <FormItem>
                <Field label='Last Free Day ↺'>
                  <FormControl>
                    <Input
                      type='date'
                      className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed`}
                      {...field}
                      value={field.value || ""}
                      readOnly
                      disabled
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='igmNumber'
            render={({ field }) => (
              <FormItem>
                <Field label='IGM No.'>
                  <FormControl>
                    <Input
                      className={tinyInputClass}
                      {...field}
                      value={field.value || ""}
                      placeholder='IGM number'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='indexNo'
            render={({ field }) => (
              <FormItem>
                <Field label='Index No.'>
                  <FormControl>
                    <Input
                      className={tinyInputClass}
                      {...field}
                      value={field.value || ""}
                      placeholder='Index no.'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='freightType'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Freight Type'>
                  <FormControl>
                    <Select
                      options={freightTypes}
                      value={
                        freightTypes.find((f) => f.value === field.value) ||
                        null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingFreightTypes}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='blstatus'
            render={({ field }) => (
              <FormItem className='col-span-2'>
                <Field label='Document Status'>
                  <FormControl>
                    <Select
                      options={blStatuses}
                      value={
                        blStatuses.find((b) => b.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingBLStatuses}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── PORTS & LOCATIONS ── */}
        <SectionBar title='Ports & Locations' />
        <div className='grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-3'>
          <FormField
            control={form.control}
            name='originPortId'
            render={({ field }) => (
              <FormItem>
                <Field label='Port of Loading'>
                  <FormControl>
                    <Select
                      options={locations}
                      value={
                        locations.find((l) => l.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingLocations}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='destinationPortId'
            render={({ field }) => (
              <FormItem>
                <Field label='Port of Discharge'>
                  <FormControl>
                    <Select
                      options={locations}
                      value={
                        locations.find((l) => l.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingLocations}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='placeOfDeliveryId'
            render={({ field }) => (
              <FormItem>
                <Field label='Place of Delivery'>
                  <FormControl>
                    <Select
                      options={locations}
                      value={
                        locations.find((l) => l.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isLoading={loadingLocations}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='terminalPartyId'
            render={({ field }) => (
              <FormItem>
                <Field label='Terminal'>
                  <FormControl>
                    <Select
                      options={terminals}
                      value={
                        terminals.find((p) => p.value === field.value) || null
                      }
                      onChange={(val) => field.onChange(val?.value)}
                      styles={tinySelectStyles}
                      isClearable
                      placeholder='Select…'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── WEIGHT ── */}
        <SectionBar title='Weight' />
        <div className='grid grid-cols-3 gap-x-3 gap-y-3 max-w-lg'>
          <FormField
            control={form.control}
            name='chargeableWeight'
            render={({ field }) => (
              <FormItem>
                <Field label='Chargeable (kg)'>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.0001'
                      className={tinyInputClass}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      placeholder='0.0000'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='grossWeight'
            render={({ field }) => (
              <FormItem>
                <Field label='Gross (kg) ↺'>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.0001'
                      className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed`}
                      {...field}
                      value={field.value || 0}
                      readOnly
                      placeholder='0.0000'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='netWeight'
            render={({ field }) => (
              <FormItem>
                <Field label='Net (kg)'>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.0001'
                      className={tinyInputClass}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      placeholder='0.0000'
                    />
                  </FormControl>
                </Field>
                <FormMessage className='text-[10px]' />
              </FormItem>
            )}
          />
        </div>

        {/* ── LCL / AIR PACKAGES ── */}
        {(shippingType === "LCL" || mode === "AIR") && (
          <>
            <SectionBar title='Package Information' />
            <div className='grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-3 max-w-2xl'>
              <FormField
                control={form.control}
                name='qtyOfPackages'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Qty of Packages'>
                      <FormControl>
                        <Input
                          type='number'
                          className={tinyInputClass}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder='0'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='packagesType'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Package Type'>
                      <FormControl>
                        <Select
                          options={packageTypes}
                          value={
                            packageTypes.find((p) => p.value === field.value) ||
                            null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={tinySelectStyles}
                          isLoading={loadingPackageTypes}
                          isClearable
                          placeholder='Select…'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='packageWeight'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Weight (kg)'>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          className={tinyInputClass}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          placeholder='0.00'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='packageVolume'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Volume (CBM)'>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.001'
                          className={tinyInputClass}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          placeholder='0.000'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {/* ── FCL CONTAINERS ── */}
        {shippingType === "FCL" && (
          <>
            <SectionBar
              title={`Container Details${fclContainers.length > 0 ? ` (${fclContainers.length})` : ""}`}
            />

            {duplicateContainerNumbers.length > 0 && (
              <div className='flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-2'>
                <AlertCircle className='h-3.5 w-3.5 flex-shrink-0' />
                Duplicate container numbers:{" "}
                <strong>{duplicateContainerNumbers.join(", ")}</strong>
              </div>
            )}

            {/* Container table */}
            {fclContainers.length > 0 && (
              <div className='border border-gray-200 rounded overflow-hidden mb-2'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50 h-8'>
                      <TableHead className='text-[11px] font-semibold py-1 px-2'>
                        Container No.
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2'>
                        Size
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2'>
                        Type
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                        Weight (kg)
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                        Pkgs
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2'>
                        Pkg Type
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 w-8'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fclContainers.map((container, idx) => {
                      const isDup = duplicateContainerNumbers.includes(
                        container.containerNo.toUpperCase(),
                      );
                      return (
                        <TableRow
                          key={idx}
                          className={`h-8 ${isDup ? "bg-red-50" : "hover:bg-gray-50"}`}
                        >
                          <TableCell className='font-mono text-[12px] py-1 px-2'>
                            {container.containerNo}
                            {isDup && (
                              <span className='ml-1 text-[10px] text-red-600 font-bold'>
                                [DUP]
                              </span>
                            )}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2'>
                            {containerSizes.find(
                              (s) => s.value === container.containerSizeId,
                            )?.label || "-"}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2'>
                            {containerTypes.find(
                              (t) => t.value === container.containerTypeId,
                            )?.label || "-"}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2 text-right font-medium'>
                            {container.tareWeight.toFixed(4)}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2 text-right'>
                            {container.noOfPackages || 0}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2'>
                            {container.packageType || "-"}
                          </TableCell>
                          <TableCell className='py-1 px-1'>
                            <button
                              type='button'
                              onClick={() => handleDeleteFcl(idx)}
                              className='p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add container inline form */}
            {(showFclForm || fclContainers.length === 0) && (
              <div className='border border-blue-200 bg-blue-50 rounded p-3'>
                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-x-3 gap-y-3 items-end'>
                  <FormField
                    control={fclForm.control}
                    name='containerNo'
                    render={({ field }) => (
                      <FormItem className='col-span-2'>
                        <Field label='Container No. *'>
                          <FormControl>
                            <Input
                              className={tinyInputClass}
                              {...field}
                              value={field.value || ""}
                              placeholder='ABCU-123456-7'
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fclForm.control}
                    name='containerSizeId'
                    render={({ field }) => (
                      <FormItem>
                        <Field label='Size *'>
                          <FormControl>
                            <Select
                              options={containerSizes}
                              value={
                                containerSizes.find(
                                  (s) => s.value === field.value,
                                ) || null
                              }
                              onChange={(val) => field.onChange(val?.value)}
                              styles={tinySelectStyles}
                              isLoading={loadingContainerSizes}
                              isClearable
                              placeholder='20 / 40…'
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fclForm.control}
                    name='containerTypeId'
                    render={({ field }) => (
                      <FormItem>
                        <Field label='Type *'>
                          <FormControl>
                            <Select
                              options={containerTypes}
                              value={
                                containerTypes.find(
                                  (t) => t.value === field.value,
                                ) || null
                              }
                              onChange={(val) => field.onChange(val?.value)}
                              styles={tinySelectStyles}
                              isLoading={loadingContainerTypes}
                              isClearable
                              placeholder='GP / HC…'
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fclForm.control}
                    name='tareWeight'
                    render={({ field }) => (
                      <FormItem>
                        <Field label='Weight (kg) *'>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.0001'
                              className={tinyInputClass}
                              {...field}
                              value={field.value || 0}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              placeholder='0.0000'
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fclForm.control}
                    name='noOfPackages'
                    render={({ field }) => (
                      <FormItem>
                        <Field label='Packages'>
                          <FormControl>
                            <Input
                              type='number'
                              className={tinyInputClass}
                              {...field}
                              value={field.value || 0}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              placeholder='0'
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fclForm.control}
                    name='packageType'
                    render={({ field }) => (
                      <FormItem>
                        <Field label='Pkg Type'>
                          <FormControl>
                            <Select
                              options={packageTypes}
                              value={
                                packageTypes.find(
                                  (p) => p.value === field.value,
                                ) || null
                              }
                              onChange={(val) => field.onChange(val?.value)}
                              styles={tinySelectStyles}
                              isLoading={loadingPackageTypes}
                              isClearable
                              placeholder='Select…'
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  {/* Add button aligned to bottom */}
                  <div className='flex items-end pb-0.5'>
                    <Button
                      type='button'
                      size='sm'
                      className='h-[30px] text-xs px-4 w-full'
                      disabled={checkForDuplicates(
                        fclForm.getValues("containerNo") || "",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        fclForm.handleSubmit(handleAddFcl)();
                      }}
                    >
                      <Plus className='h-3.5 w-3.5 mr-1' /> Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle show/hide form button */}
            {fclContainers.length > 0 && (
              <div className='flex justify-end mt-1'>
                <button
                  type='button'
                  onClick={() => setShowFclForm(!showFclForm)}
                  className='text-xs text-blue-600 hover:text-blue-800 hover:underline'
                >
                  {showFclForm ? "− Hide add form" : "+ Add another container"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </TabsContent>
  );
}
