import { TabsContent } from "@/components/ui/tabs";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Select, { StylesConfig, GroupBase } from "react-select";
import { Plus, Save, Edit, Trash2, AlertTriangle } from "lucide-react";
import { compactSelectStyles } from "../utils/styles";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import {
  type InvoiceFormValues,
  type InvoiceItemFormValues,
} from "../schemas/jobOrderSchemas";

type Invoice = InvoiceFormValues;
type InvoiceItem = InvoiceItemFormValues;

interface SelectOption {
  value: number | string;
  label: string;
  code?: string;
  description?: string;
  [key: string]: any;
}

interface InvoiceTabProps {
  form: any;
  parties: SelectOption[];
  banks: SelectOption[];
  currencies: SelectOption[];
  hsCodes: SelectOption[];
  countries: SelectOption[];
  loadingParties: boolean;
  loadingBanks: boolean;
  loadingCurrencies: boolean;
  loadingHsCodes: boolean;
  loadingCountries: boolean;
  freightType?: string;
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  invoiceForm: UseFormReturn<Invoice>;
  showInvoiceForm: boolean;
  setShowInvoiceForm: (show: boolean) => void;
  currentInvoiceItems: InvoiceItem[];
  setCurrentInvoiceItems: (items: InvoiceItem[]) => void;
  invoiceItemForm: UseFormReturn<InvoiceItem>;
  showInvoiceItemForm: boolean;
  setShowInvoiceItemForm: (show: boolean) => void;
  editingInvoice: number | null;
  setEditingInvoice: (index: number | null) => void;
  editingInvoiceItem: number | null;
  setEditingInvoiceItem: (index: number | null) => void;
  toast: any;
}

const GOODS_TYPE_OPTIONS = [
  { value: "MACHINERY", label: "Machinery" },
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "FINISHED_GOODS", label: "Finished Goods" },
  { value: "SEMI_FINISHED", label: "Semi-Finished Goods" },
  { value: "SPARE_PARTS", label: "Spare Parts" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "TEXTILES", label: "Textiles" },
  { value: "FOOD_PRODUCTS", label: "Food Products" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "AUTOMOTIVE", label: "Automotive Parts" },
  { value: "PHARMACEUTICALS", label: "Pharmaceuticals" },
  { value: "CONSUMER_GOODS", label: "Consumer Goods" },
  { value: "INDUSTRIAL_GOODS", label: "Industrial Goods" },
  { value: "OTHER", label: "Other" },
];

// ─── Shared design primitives (identical to ShippingTab / JobMainTab) ─────────

/** Format any ISO or YYYY-MM-DD string as dd/mm/yyyy — pure string, no timezone shift */
const fmtDate = (val: string | null | undefined): string => {
  if (!val) return "—";
  const datePart = val.split("T")[0]; // strips time component if present
  const parts = datePart.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }
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
    <div className='flex items-center gap-2 mt-3 mb-2 first:mt-0'>
      <span className='text-[11px] font-bold uppercase tracking-widest text-blue-700 whitespace-nowrap'>
        {title}
      </span>
      <div className='flex-1 border-t border-blue-200' />
      {aside}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tinySelectStyles: StylesConfig<any, false, GroupBase<any>> = {
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function InvoiceTab(props: InvoiceTabProps) {
  const {
    parties,
    banks,
    currencies,
    hsCodes,
    countries,
    loadingParties,
    loadingBanks,
    loadingCurrencies,
    loadingHsCodes,
    loadingCountries,
    freightType,
    invoices,
    setInvoices,
    invoiceForm,
    showInvoiceForm,
    setShowInvoiceForm,
    currentInvoiceItems,
    setCurrentInvoiceItems,
    invoiceItemForm,
    showInvoiceItemForm,
    setShowInvoiceItemForm,
    editingInvoice,
    setEditingInvoice,
    editingInvoiceItem,
    setEditingInvoiceItem,
    toast,
  } = props;

  const [isFirstInvoice, setIsFirstInvoice] = useState(true);
  const [commonLcDetails, setCommonLcDetails] = useState<{
    lcNumber?: string;
    lcDate?: string;
    lcIssuedByBankId?: number;
    lcValue: number;
    lcCurrencyId?: number;
    lcExchangeRate: number;
    fiNumber?: string;
    fiDate?: string;
    fiExpiryDate?: string;
  }>({
    lcNumber: "",
    lcDate: "",
    lcIssuedByBankId: undefined,
    lcValue: 0,
    lcCurrencyId: undefined,
    lcExchangeRate: 0,
    fiNumber: "",
    fiDate: "",
    fiExpiryDate: "",
  });

  const calculateTotalDvValue = () =>
    currentInvoiceItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.dutiableValue || 0),
      0,
    );

  const lcValue = invoiceForm.watch("lcValue") || 0;
  const totalDvValue = calculateTotalDvValue();
  const hasLcValueMismatch =
    lcValue > 0 && Math.abs(lcValue - totalDvValue) > 0.01;

  useEffect(() => {
    const sub = invoiceItemForm.watch(
      (value: any, { name }: { name?: string }) => {
        if (
          name === "quantity" ||
          name === "assessableValue" ||
          name === "dutiableValue"
        ) {
          const total = (value.quantity || 0) * (value.dutiableValue || 0);
          if (value.totalValue !== total)
            invoiceItemForm.setValue("totalValue", total);
        }
      },
    );
    return () => sub.unsubscribe();
  }, [invoiceItemForm]);

  useEffect(() => {
    if (invoices.length === 0) {
      setIsFirstInvoice(true);
      setCommonLcDetails({
        lcNumber: "",
        lcDate: "",
        lcIssuedByBankId: undefined,
        lcValue: 0,
        lcCurrencyId: undefined,
        lcExchangeRate: 0,
        fiNumber: "",
        fiDate: "",
        fiExpiryDate: "",
      });
    }
  }, [invoices.length]);

  // ── Handlers (all logic preserved exactly) ──────────────────────────────────

  const handleAddInvoiceItem = (data: InvoiceItem) => {
    if (!data.quantity || data.quantity <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Quantity must be greater than 0",
      });
      return;
    }
    if (editingInvoiceItem !== null) {
      const updated = [...currentInvoiceItems];
      updated[editingInvoiceItem] = data;
      setCurrentInvoiceItems(updated);
      toast({ title: "Item updated" });
    } else {
      setCurrentInvoiceItems([...currentInvoiceItems, data]);
      toast({ title: "Item added" });
    }
    invoiceItemForm.reset({
      invoiceItemId: undefined,
      jobInvoiceId: undefined,
      hsCodeId: undefined,
      hsCode: "",
      description: "",
      originId: undefined,
      quantity: 0,
      dutiableValue: 0,
      assessableValue: 0,
      totalValue: 0,
      version: 0,
    });
    setShowInvoiceItemForm(false);
    setEditingInvoiceItem(null);
  };

  const handleEditInvoiceItem = (index: number) => {
    setEditingInvoiceItem(index);
    const item = currentInvoiceItems[index];
    invoiceItemForm.reset({
      invoiceItemId: item.invoiceItemId,
      jobInvoiceId: item.jobInvoiceId,
      hsCodeId: item.hsCodeId,
      hsCode: item.hsCode || "",
      description: item.description || "",
      originId: item.originId,
      quantity: item.quantity || 0,
      dutiableValue: item.dutiableValue || 0,
      assessableValue: item.assessableValue || 0,
      totalValue: item.totalValue || 0,
      version: item.version || 0,
    });
    setShowInvoiceItemForm(true);
  };

  const handleDeleteInvoiceItem = (index: number) => {
    setCurrentInvoiceItems(currentInvoiceItems.filter((_, i) => i !== index));
    toast({ title: "Item removed" });
  };

  const handleAddInvoice = (data: Invoice) => {
    if (!data.invoiceNumber?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Invoice Number is required",
      });
      return;
    }
    if (!data.invoiceDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Invoice Date is required",
      });
      return;
    }
    if (currentInvoiceItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Add at least one commodity item",
      });
      return;
    }

    const invoiceWithItems: Invoice = { ...data, items: currentInvoiceItems };

    if (editingInvoice !== null) {
      const updated = [...invoices];
      updated[editingInvoice] = invoiceWithItems;
      setInvoices(updated);
      toast({ title: "Invoice updated" });
    } else {
      setInvoices([...invoices, invoiceWithItems]);
      toast({ title: "Invoice added" });
      if (isFirstInvoice) {
        setCommonLcDetails({
          lcNumber: data.lcNumber,
          lcDate: data.lcDate,
          lcIssuedByBankId: data.lcIssuedByBankId,
          lcValue: data.lcValue,
          lcCurrencyId: data.lcCurrencyId,
          lcExchangeRate: data.lcExchangeRate,
          fiNumber: data.fiNumber,
          fiDate: data.fiDate,
          fiExpiryDate: data.fiExpiryDate,
        });
        setIsFirstInvoice(false);
      }
    }

    const resetData: Partial<Invoice> = {
      invoiceId: undefined,
      invoiceNumber: undefined,
      invoiceDate: undefined,
      invoiceIssuedByPartyId: undefined,
      shippingTerm: undefined,
      goodsType: undefined,
      lcNumber: undefined,
      lcDate: undefined,
      lcIssuedByBankId: undefined,
      lcValue: 0,
      lcCurrencyId: undefined,
      lcExchangeRate: 0,
      fiNumber: undefined,
      fiDate: undefined,
      fiExpiryDate: undefined,
      invoiceStatus: undefined,
      version: 0,
      items: [],
    };

    if (editingInvoice === null && !isFirstInvoice) {
      Object.assign(resetData, {
        lcNumber: commonLcDetails.lcNumber,
        lcDate: commonLcDetails.lcDate,
        lcIssuedByBankId: commonLcDetails.lcIssuedByBankId,
        lcValue: commonLcDetails.lcValue,
        lcCurrencyId: commonLcDetails.lcCurrencyId,
        lcExchangeRate: commonLcDetails.lcExchangeRate,
        fiNumber: commonLcDetails.fiNumber,
        fiDate: commonLcDetails.fiDate,
        fiExpiryDate: commonLcDetails.fiExpiryDate,
      });
    }

    invoiceForm.reset(resetData);
    setCurrentInvoiceItems([]);
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleEditInvoice = (index: number) => {
    setEditingInvoice(index);
    const inv = invoices[index];
    invoiceForm.reset({
      invoiceId: inv.invoiceId,
      invoiceNumber: inv.invoiceNumber || "",
      invoiceDate: inv.invoiceDate || "",
      invoiceIssuedByPartyId: inv.invoiceIssuedByPartyId,
      shippingTerm: inv.shippingTerm || "",
      goodsType: inv.goodsType || "",
      lcNumber: inv.lcNumber || "",
      lcDate: inv.lcDate || "",
      lcIssuedByBankId: inv.lcIssuedByBankId,
      lcValue: inv.lcValue || 0,
      lcCurrencyId: inv.lcCurrencyId,
      lcExchangeRate: inv.lcExchangeRate || 0,
      fiNumber: inv.fiNumber || "",
      fiDate: inv.fiDate || "",
      fiExpiryDate: inv.fiExpiryDate || "",
      invoiceStatus: inv.invoiceStatus || "DRAFT",
      version: inv.version || 0,
    });
    setCurrentInvoiceItems(inv.items || []);
    setShowInvoiceForm(true);
  };

  const handleDeleteInvoice = (index: number) => {
    setInvoices(invoices.filter((_, i) => i !== index));
    toast({ title: "Invoice deleted" });
  };

  const handleHsCodeSelect = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      invoiceItemForm.setValue("hsCode", selectedOption.code || "");
      invoiceItemForm.setValue("description", selectedOption.description || "");
      invoiceItemForm.setValue("hsCodeId", selectedOption.value as number);
    }
  };

  const handleAddInvoiceClick = () => {
    setShowInvoiceForm(!showInvoiceForm);
    setEditingInvoice(null);

    const resetData: Partial<Invoice> = {
      invoiceNumber: undefined,
      invoiceDate: undefined,
      invoiceIssuedByPartyId: undefined,
      shippingTerm: undefined,
      goodsType: undefined,
      lcNumber: undefined,
      lcDate: undefined,
      lcIssuedByBankId: undefined,
      lcValue: 0,
      lcCurrencyId: undefined,
      lcExchangeRate: 0,
      fiNumber: undefined,
      fiDate: undefined,
      fiExpiryDate: undefined,
      invoiceStatus: undefined,
      version: 0,
      items: [],
    };

    if (!isFirstInvoice) {
      Object.assign(resetData, {
        lcNumber: commonLcDetails.lcNumber,
        lcDate: commonLcDetails.lcDate,
        lcIssuedByBankId: commonLcDetails.lcIssuedByBankId,
        lcValue: commonLcDetails.lcValue,
        lcCurrencyId: commonLcDetails.lcCurrencyId,
        lcExchangeRate: commonLcDetails.lcExchangeRate,
        fiNumber: commonLcDetails.fiNumber,
        fiDate: commonLcDetails.fiDate,
        fiExpiryDate: commonLcDetails.fiExpiryDate,
      });
    }

    invoiceForm.reset(resetData);
    setCurrentInvoiceItems([]);
  };

  // ── Shipping term options derived from freightType ───────────────────────────
  const shippingTermOptions =
    freightType === "Collect"
      ? [
          { value: "FOB", label: "FOB" },
          { value: "EXW", label: "EXW" },
        ]
      : freightType === "Prepaid"
        ? [
            { value: "DDP", label: "DDP" },
            { value: "DDU", label: "DDU" },
            { value: "CFR", label: "CFR" },
          ]
        : [
            { value: "FOB", label: "FOB" },
            { value: "EXW", label: "EXW" },
            { value: "DDP", label: "DDP" },
            { value: "DDU", label: "DDU" },
            { value: "CFR", label: "CFR" },
          ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <TabsContent value='invoice'>
      <div className='bg-white border border-gray-200 rounded-md p-4'>
        {/* ── Header row: title + Add button ── */}
        <div className='flex items-center justify-between mb-3'>
          <span className='text-[13px] font-semibold text-gray-800'>
            Invoices
            {invoices.length > 0 && (
              <span className='ml-2 text-[11px] font-normal text-gray-500'>
                ({invoices.length} added)
              </span>
            )}
          </span>
          <button
            type='button'
            onClick={handleAddInvoiceClick}
            className='flex items-center gap-1 h-7 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded'
          >
            <Plus className='h-3.5 w-3.5' />
            {showInvoiceForm && editingInvoice === null
              ? "Hide Form"
              : "Add Invoice"}
          </button>
        </div>

        {/* ══════════════════════════════════════════
            INVOICE ENTRY / EDIT FORM
        ══════════════════════════════════════════ */}
        {showInvoiceForm && (
          <div className='border border-blue-200 bg-blue-50/40 rounded-md p-3 mb-4'>
            {/* LC value mismatch warning */}
            {hasLcValueMismatch && currentInvoiceItems.length > 0 && (
              <div className='flex items-center gap-2 px-3 py-2 mb-3 bg-orange-50 border border-orange-300 rounded text-xs text-orange-800'>
                <AlertTriangle className='h-3.5 w-3.5 flex-shrink-0 text-orange-500' />
                <span>
                  <strong>LC Value mismatch —</strong> LC: {lcValue.toFixed(2)}{" "}
                  · Total DV: {totalDvValue.toFixed(2)} · Diff:{" "}
                  {Math.abs(lcValue - totalDvValue).toFixed(2)}
                </span>
              </div>
            )}

            {/* ── INVOICE INFORMATION ── */}
            <SectionBar title='Invoice Information' />
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-3'>
              <FormField
                control={invoiceForm.control}
                name='invoiceNumber'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <Field label='Invoice No. *'>
                      <FormControl>
                        <Input
                          className={tinyInputClass}
                          {...field}
                          value={field.value || ""}
                          placeholder='e.g. INV-001'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name='invoiceDate'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Invoice Date *'>
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
                control={invoiceForm.control}
                name='invoiceIssuedByPartyId'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <Field label='Issued By (Party)'>
                      <FormControl>
                        <Select
                          options={parties}
                          value={
                            parties.find((p) => p.value === field.value) || null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={tinySelectStyles}
                          isLoading={loadingParties}
                          isClearable
                          placeholder='Select party…'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name='shippingTerm'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Shipping Term'>
                      <FormControl>
                        <Select
                          options={shippingTermOptions}
                          value={
                            field.value
                              ? { value: field.value, label: field.value }
                              : null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={tinySelectStyles}
                          isClearable
                          placeholder='FOB / CFR…'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name='goodsType'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <Field label='Goods Type'>
                      <FormControl>
                        <Select
                          options={GOODS_TYPE_OPTIONS}
                          value={
                            GOODS_TYPE_OPTIONS.find(
                              (g) => g.value === field.value,
                            ) || null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={tinySelectStyles}
                          isClearable
                          placeholder='Select goods type…'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />
            </div>

            {/* ── FI DETAILS ── */}
            <SectionBar
              title='FI (Form E) Details'
              aside={
                !isFirstInvoice &&
                editingInvoice === null && (
                  <span className='text-[10px] text-gray-400 italic'>
                    pre-filled from first invoice
                  </span>
                )
              }
            />
            <div className='grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3'>
              <FormField
                control={invoiceForm.control}
                name='fiNumber'
                render={({ field }) => (
                  <FormItem>
                    <Field label='FI Number'>
                      <FormControl>
                        <Input
                          className={tinyInputClass}
                          {...field}
                          value={field.value || ""}
                          placeholder='FI-001'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name='fiDate'
                render={({ field }) => (
                  <FormItem>
                    <Field label='FI Date'>
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
                control={invoiceForm.control}
                name='fiExpiryDate'
                render={({ field }) => (
                  <FormItem>
                    <Field label='FI Expiry Date'>
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

            {/* ── LC DETAILS ── */}
            <SectionBar
              title='LC (Letter of Credit) Details'
              aside={
                !isFirstInvoice &&
                editingInvoice === null && (
                  <span className='text-[10px] text-gray-400 italic'>
                    pre-filled from first invoice
                  </span>
                )
              }
            />
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-3'>
              <FormField
                control={invoiceForm.control}
                name='lcNumber'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <Field label='LC Number'>
                      <FormControl>
                        <Input
                          className={tinyInputClass}
                          {...field}
                          value={field.value || ""}
                          placeholder='LC-123'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name='lcDate'
                render={({ field }) => (
                  <FormItem>
                    <Field label='LC Date'>
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
                control={invoiceForm.control}
                name='lcIssuedByBankId'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <Field label='LC Issued By (Bank)'>
                      <FormControl>
                        <Select
                          options={banks}
                          value={
                            banks.find((b) => b.value === field.value) || null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={tinySelectStyles}
                          isLoading={loadingBanks}
                          isClearable
                          placeholder='Select bank…'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name='lcValue'
                render={({ field }) => (
                  <FormItem>
                    <Field
                      label={
                        currentInvoiceItems.length > 0
                          ? `LC Value (DV: ${totalDvValue.toFixed(2)})`
                          : "LC Value"
                      }
                    >
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          className={`${tinyInputClass} ${hasLcValueMismatch ? "border-orange-400 bg-orange-50" : ""}`}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
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
                control={invoiceForm.control}
                name='lcCurrencyId'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Currency'>
                      <FormControl>
                        <Select
                          options={currencies}
                          value={
                            currencies.find((c) => c.value === field.value) ||
                            null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={tinySelectStyles}
                          isLoading={loadingCurrencies}
                          isClearable
                          placeholder='USD…'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={invoiceForm.control}
                name='lcExchangeRate'
                render={({ field }) => (
                  <FormItem>
                    <Field label='Exchange Rate'>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          className={tinyInputClass}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder='0.00'
                        />
                      </FormControl>
                    </Field>
                    <FormMessage className='text-[10px]' />
                  </FormItem>
                )}
              />
            </div>

            {/* ══════════════════════════════════════════
                COMMODITIES SUB-SECTION
            ══════════════════════════════════════════ */}
            <SectionBar
              title={`Commodities${currentInvoiceItems.length > 0 ? ` (${currentInvoiceItems.length})` : ""}`}
              aside={
                currentInvoiceItems.length > 0 && (
                  <span className='text-[11px] font-semibold text-gray-600'>
                    Total DV:{" "}
                    <span className='text-blue-700'>
                      {totalDvValue.toFixed(2)}
                    </span>
                  </span>
                )
              }
            />

            {/* Items table */}
            {currentInvoiceItems.length > 0 && (
              <div className='border border-gray-200 rounded overflow-hidden mb-2'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-gray-50 h-8'>
                      <TableHead className='text-[11px] font-semibold py-1 px-2'>
                        HS Code
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2'>
                        Description
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2'>
                        Origin
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                        Qty
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                        DV Unit
                      </TableHead>
                      <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                        Total DV
                      </TableHead>
                      <TableHead className='text-[11px] py-1 px-1 w-12'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentInvoiceItems.map((item, idx) => (
                      <TableRow key={idx} className='h-8 hover:bg-gray-50'>
                        <TableCell className='text-[12px] py-1 px-2 font-mono'>
                          {item.hsCode || item.hsCodeId || "—"}
                        </TableCell>
                        <TableCell className='text-[12px] py-1 px-2 max-w-[200px] truncate'>
                          {item.description || "—"}
                        </TableCell>
                        <TableCell className='text-[12px] py-1 px-2'>
                          {countries.find((c) => c.value === item.originId)
                            ?.label || "—"}
                        </TableCell>
                        <TableCell className='text-[12px] py-1 px-2 text-right'>
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell className='text-[12px] py-1 px-2 text-right'>
                          {(item.dutiableValue || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className='text-[12px] py-1 px-2 text-right font-medium'>
                          {(
                            (item.quantity || 0) * (item.dutiableValue || 0)
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell className='py-1 px-1'>
                          <div className='flex'>
                            <button
                              type='button'
                              onClick={() => handleEditInvoiceItem(idx)}
                              className='p-1 rounded hover:bg-blue-100 text-blue-500'
                            >
                              <Edit className='h-3 w-3' />
                            </button>
                            <button
                              type='button'
                              onClick={() => handleDeleteInvoiceItem(idx)}
                              className='p-1 rounded hover:bg-red-100 text-red-500'
                            >
                              <Trash2 className='h-3 w-3' />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className='bg-blue-50 h-8'>
                      <TableCell
                        colSpan={5}
                        className='text-[11px] font-bold py-1 px-2 text-right text-gray-600'
                      >
                        TOTAL DV
                      </TableCell>
                      <TableCell className='text-[12px] font-bold py-1 px-2 text-right text-blue-700'>
                        {totalDvValue.toFixed(2)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add Item inline form */}
            {showInvoiceItemForm && (
              <div className='border border-green-200 bg-green-50/40 rounded p-3 mb-2'>
                <div className='text-[11px] font-bold uppercase tracking-widest text-green-700 mb-2'>
                  {editingInvoiceItem !== null
                    ? "Edit Commodity"
                    : "Add Commodity"}
                </div>

                {/* ── Single line: all 5 fields + Save button ── */}
                <div className='flex gap-2 items-end flex-wrap'>
                  {/* HS Code search — widest */}
                  <FormField
                    control={invoiceItemForm.control}
                    name='hsCodeId'
                    render={({ field }) => (
                      <FormItem className='flex-[2] min-w-[180px]'>
                        <Field label='Search HS Code'>
                          <FormControl>
                            <Select
                              options={hsCodes}
                              value={
                                hsCodes.find((h) => h.value === field.value) ||
                                null
                              }
                              onChange={(val) => {
                                field.onChange(val?.value);
                                handleHsCodeSelect(val);
                              }}
                              styles={tinySelectStyles}
                              isLoading={loadingHsCodes}
                              isClearable
                              placeholder='Code or description…'
                              filterOption={(
                                option: any,
                                inputValue: string,
                              ) => {
                                const q = inputValue.toLowerCase();
                                return (
                                  (
                                    option.data.code?.toLowerCase() || ""
                                  ).includes(q) ||
                                  (
                                    option.data.description?.toLowerCase() || ""
                                  ).includes(q)
                                );
                              }}
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  {/* HS Code read-only display */}
                  <FormField
                    control={invoiceItemForm.control}
                    name='hsCode'
                    render={({ field }) => (
                      <FormItem className='w-[90px]'>
                        <Field label='HS Code ↺'>
                          <FormControl>
                            <Input
                              className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed`}
                              {...field}
                              value={field.value || ""}
                              placeholder='Auto'
                              readOnly
                            />
                          </FormControl>
                        </Field>
                      </FormItem>
                    )}
                  />

                  {/* Origin country */}
                  <FormField
                    control={invoiceItemForm.control}
                    name='originId'
                    render={({ field }) => (
                      <FormItem className='flex-1 min-w-[130px]'>
                        <Field label='Origin'>
                          <FormControl>
                            <Select
                              options={countries}
                              value={
                                countries.find(
                                  (c) => c.value === field.value,
                                ) || null
                              }
                              onChange={(val) => field.onChange(val?.value)}
                              styles={tinySelectStyles}
                              isLoading={loadingCountries}
                              isClearable
                              placeholder='Country…'
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={invoiceItemForm.control}
                    name='quantity'
                    render={({ field }) => (
                      <FormItem className='w-[80px]'>
                        <Field label='Qty'>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
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

                  {/* Dutiable Value */}
                  <FormField
                    control={invoiceItemForm.control}
                    name='dutiableValue'
                    render={({ field }) => (
                      <FormItem className='w-[100px]'>
                        <Field label='DV Unit Price'>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              className={tinyInputClass}
                              {...field}
                              value={field.value || 0}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              placeholder='0.00'
                            />
                          </FormControl>
                        </Field>
                        <FormMessage className='text-[10px]' />
                      </FormItem>
                    )}
                  />

                  {/* Live Total DV display */}
                  {invoiceItemForm.watch("quantity") > 0 &&
                    invoiceItemForm.watch("dutiableValue") > 0 && (
                      <div className='flex flex-col justify-end pb-0.5 w-[80px]'>
                        <span className='text-[11px] text-gray-500 uppercase tracking-wide'>
                          Total DV
                        </span>
                        <span className='text-[15px] font-bold text-blue-700 leading-tight'>
                          {(
                            invoiceItemForm.watch("quantity") *
                            invoiceItemForm.watch("dutiableValue")
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}

                  {/* Save / Cancel buttons — aligned to bottom */}
                  <div className='flex gap-1 pb-0.5'>
                    <button
                      type='button'
                      className='flex items-center gap-1 h-[30px] px-3 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded'
                      onClick={(e) => {
                        e.preventDefault();
                        invoiceItemForm.handleSubmit(handleAddInvoiceItem)();
                      }}
                    >
                      <Save className='h-3 w-3' />
                      {editingInvoiceItem !== null ? "Update" : "Add"}
                    </button>
                    <button
                      type='button'
                      className='h-[30px] px-3 text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded'
                      onClick={() => {
                        setShowInvoiceItemForm(false);
                        setEditingInvoiceItem(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Description — full width below the row */}
                <FormField
                  control={invoiceItemForm.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem className='mt-2'>
                      <Field label='Item Description'>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            className='text-[13px] min-h-[46px] px-2 py-1 border border-gray-300 rounded resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            placeholder='Auto-filled from HS Code, or enter manually…'
                          />
                        </FormControl>
                      </Field>
                      <FormMessage className='text-[10px]' />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Show "Add Item" button when form is not open */}
            {!showInvoiceItemForm && (
              <button
                type='button'
                onClick={() => {
                  setShowInvoiceItemForm(true);
                  setEditingInvoiceItem(null);
                  invoiceItemForm.reset({
                    quantity: 0,
                    dutiableValue: 0,
                    assessableValue: 0,
                    totalValue: 0,
                    version: 0,
                  });
                }}
                className='text-xs text-green-700 hover:text-green-900 hover:underline mt-1'
              >
                + Add commodity item
              </button>
            )}

            {currentInvoiceItems.length === 0 && !showInvoiceItemForm && (
              <p className='text-[11px] text-red-500 mt-1'>
                ⚠ At least one commodity item is required to save the invoice.
              </p>
            )}

            {/* Save / Cancel invoice */}
            <div className='flex gap-2 mt-4 pt-3 border-t border-blue-200'>
              <button
                type='button'
                disabled={hasLcValueMismatch}
                onClick={(e) => {
                  e.preventDefault();
                  invoiceForm.handleSubmit(handleAddInvoice)();
                }}
                className={`flex items-center gap-1 h-7 px-4 text-xs font-medium rounded text-white
                  ${hasLcValueMismatch ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                <Save className='h-3 w-3' />
                {editingInvoice !== null ? "Update Invoice" : "Save Invoice"}
              </button>
              <button
                type='button'
                className='flex items-center gap-1 h-7 px-3 text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded'
                onClick={() => {
                  setShowInvoiceForm(false);
                  setEditingInvoice(null);
                  setCurrentInvoiceItems([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SAVED INVOICES LIST
        ══════════════════════════════════════════ */}
        {invoices.length > 0 && (
          <div className='space-y-2'>
            {invoices.map((inv, invIdx) => {
              const invoiceTotalDv = (inv.items || []).reduce(
                (sum, item) =>
                  sum + (item.quantity || 0) * (item.dutiableValue || 0),
                0,
              );
              return (
                <div
                  key={invIdx}
                  className='border border-gray-200 rounded overflow-hidden'
                >
                  {/* Invoice summary header */}
                  <div className='flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200'>
                    <div className='flex items-center gap-4 text-[12px]'>
                      <span className='font-bold text-gray-800'>
                        #{invIdx + 1} — {inv.invoiceNumber || "N/A"}
                      </span>
                      {/* Invoice date */}
                      <span className='text-gray-500'>
                        {fmtDate(inv.invoiceDate)}
                      </span>
                      {inv.shippingTerm && (
                        <span className='px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[11px] rounded font-medium'>
                          {inv.shippingTerm}
                        </span>
                      )}
                      {inv.goodsType && (
                        <span className='text-gray-500'>
                          {
                            GOODS_TYPE_OPTIONS.find(
                              (g) => g.value === inv.goodsType,
                            )?.label
                          }
                        </span>
                      )}
                      {inv.lcNumber && (
                        <span className='text-gray-500'>
                          LC: {inv.lcNumber}
                          {inv.lcDate && (
                            <span className='ml-1 text-gray-400'>
                              ({fmtDate(inv.lcDate)})
                            </span>
                          )}
                        </span>
                      )}
                      {inv.fiNumber && (
                        <span className='text-gray-500'>
                          FI: {inv.fiNumber}
                          {inv.fiDate && (
                            <span className='ml-1 text-gray-400'>
                              ({fmtDate(inv.fiDate)})
                            </span>
                          )}
                          {inv.fiExpiryDate && (
                            <span className='ml-1 text-gray-400'>
                              exp {fmtDate(inv.fiExpiryDate)}
                            </span>
                          )}
                        </span>
                      )}
                      <span className='font-semibold text-blue-700'>
                        DV Total: {invoiceTotalDv.toFixed(2)}
                      </span>
                      <span className='text-gray-400'>
                        ({(inv.items || []).length} item
                        {(inv.items || []).length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className='flex gap-1'>
                      <button
                        type='button'
                        onClick={() => handleEditInvoice(invIdx)}
                        className='p-1.5 rounded hover:bg-blue-100 text-blue-500'
                      >
                        <Edit className='h-3.5 w-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDeleteInvoice(invIdx)}
                        className='p-1.5 rounded hover:bg-red-100 text-red-500'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  </div>

                  {/* Commodity rows */}
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-white h-7'>
                        <TableHead className='text-[11px] font-semibold py-1 px-2'>
                          HS Code
                        </TableHead>
                        <TableHead className='text-[11px] font-semibold py-1 px-2'>
                          Description
                        </TableHead>
                        <TableHead className='text-[11px] font-semibold py-1 px-2'>
                          Origin
                        </TableHead>
                        <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                          Qty
                        </TableHead>
                        <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                          DV Unit
                        </TableHead>
                        <TableHead className='text-[11px] font-semibold py-1 px-2 text-right'>
                          Total DV
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(inv.items || []).map((item, itemIdx) => (
                        <TableRow
                          key={itemIdx}
                          className='h-7 hover:bg-gray-50'
                        >
                          <TableCell className='text-[12px] font-mono py-1 px-2'>
                            {item.hsCode || item.hsCodeId || "—"}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2 max-w-[200px] truncate'>
                            {item.description}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2'>
                            {countries.find((c) => c.value === item.originId)
                              ?.label || "—"}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2 text-right'>
                            {item.quantity || 0}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2 text-right'>
                            {(item.dutiableValue || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className='text-[12px] py-1 px-2 text-right font-medium'>
                            {(
                              (item.quantity || 0) * (item.dutiableValue || 0)
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className='bg-blue-50 h-7'>
                        <TableCell
                          colSpan={5}
                          className='text-[11px] font-bold py-1 px-2 text-right text-gray-600'
                        >
                          TOTAL DV
                        </TableCell>
                        <TableCell className='text-[12px] font-bold py-1 px-2 text-right text-blue-700'>
                          {invoiceTotalDv.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {invoices.length === 0 && !showInvoiceForm && (
          <div className='text-center py-10 text-[12px] text-gray-400 border-2 border-dashed border-gray-200 rounded-md'>
            No invoices added yet — click <strong>Add Invoice</strong> to begin.
          </div>
        )}
      </div>
    </TabsContent>
  );
}
