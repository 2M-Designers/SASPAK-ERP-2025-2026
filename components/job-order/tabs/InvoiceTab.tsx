import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Select from "react-select";
import {
  Plus,
  Save,
  Edit,
  Trash2,
  Package,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { compactSelectStyles } from "../utils/styles";
import { useEffect, useState } from "react";

// Define types
interface SelectOption {
  value: number | string;
  label: string;
  code?: string;
  description?: string;
  [key: string]: any;
}

interface InvoiceItem {
  invoiceItemId?: number;
  jobInvoiceId?: number;
  hsCodeId?: number;
  hsCode: string;
  description: string;
  originId?: number;
  quantity: number;
  dutiableValue: number;
  assessableValue: number;
  totalValue: number;
  version?: number;
}

interface Invoice {
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceIssuedByPartyId?: number;
  shippingTerm?: string;
  goodsType?: string; // ✅ NEW: Goods Type
  lcNumber?: string;
  lcDate?: string;
  lcIssuedByBankId?: number;
  lcValue: number;
  lcCurrencyId?: number;
  lcExchangeRate: number;
  fiNumber?: string;
  fiDate?: string;
  fiExpiryDate?: string;
  invoiceStatus?: string;
  items: InvoiceItem[];
  version?: number;
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
  invoiceForm: any;
  showInvoiceForm: boolean;
  setShowInvoiceForm: (show: boolean) => void;
  currentInvoiceItems: InvoiceItem[];
  setCurrentInvoiceItems: (items: InvoiceItem[]) => void;
  invoiceItemForm: any;
  showInvoiceItemForm: boolean;
  setShowInvoiceItemForm: (show: boolean) => void;
  editingInvoice: number | null;
  setEditingInvoice: (index: number | null) => void;
  editingInvoiceItem: number | null;
  setEditingInvoiceItem: (index: number | null) => void;
  toast: any;
}

// ✅ NEW: Goods Type Options
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

export default function InvoiceTab(props: InvoiceTabProps) {
  const {
    form,
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

  const [isFirstInvoice, setIsFirstInvoice] = useState<boolean>(true);
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

  // ✅ NEW: Calculate total DV value from current items
  const calculateTotalDvValue = (): number => {
    return currentInvoiceItems.reduce(
      (sum, item) => sum + item.quantity * item.dutiableValue,
      0,
    );
  };

  // ✅ NEW: Watch LC Value for validation
  const lcValue = invoiceForm.watch("lcValue") || 0;
  const totalDvValue = calculateTotalDvValue();
  const hasLcValueMismatch =
    lcValue > 0 && Math.abs(lcValue - totalDvValue) > 0.01;

  // Auto-calculate invoice item totalValue
  useEffect(() => {
    const subscription = invoiceItemForm.watch(
      (value: any, { name }: { name: string }) => {
        if (
          name === "quantity" ||
          name === "assessableValue" ||
          name === "dutiableValue"
        ) {
          const qty = value.quantity || 0;
          const dv = value.dutiableValue || 0;
          const total = qty * dv; // ✅ FIXED: Calculate from DV

          if (value.totalValue !== total) {
            invoiceItemForm.setValue("totalValue", total);
          }
        }
      },
    );
    return () => subscription.unsubscribe();
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

  const handleAddInvoiceItem = (data: InvoiceItem) => {
    console.log("=== handleAddInvoiceItem CALLED ===");
    console.log("Raw item data received:", JSON.stringify(data, null, 2));

    if (!data.quantity || data.quantity <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a quantity greater than 0",
      });
      return;
    }

    if (editingInvoiceItem !== null) {
      const updated = [...currentInvoiceItems];
      updated[editingInvoiceItem] = data;
      setCurrentInvoiceItems(updated);
      toast({ title: "Success", description: "Item updated" });
    } else {
      setCurrentInvoiceItems([...currentInvoiceItems, data]);
      toast({ title: "Success", description: "Item added to invoice" });
    }

    invoiceItemForm.reset({
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
    invoiceItemForm.reset(currentInvoiceItems[index]);
    setShowInvoiceItemForm(true);
  };

  const handleDeleteInvoiceItem = (index: number) => {
    setCurrentInvoiceItems(
      currentInvoiceItems.filter((_: InvoiceItem, i: number) => i !== index),
    );
    toast({ title: "Success", description: "Item removed" });
  };

  const handleAddInvoice = (data: Invoice) => {
    console.log("=== handleAddInvoice CALLED ===");
    console.log("Invoice form data:", JSON.stringify(data, null, 2));

    if (currentInvoiceItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one commodity item to the invoice",
      });
      return;
    }

    // ✅ NEW: Validate LC Value matches Total DV
    const totalDv = calculateTotalDvValue();
    if (data.lcValue > 0 && Math.abs(data.lcValue - totalDv) > 0.01) {
      toast({
        variant: "destructive",
        title: "LC Value Mismatch",
        description: `LC Value (${data.lcValue.toFixed(2)}) does not match Invoice Total DV (${totalDv.toFixed(2)}). Please correct before saving.`,
      });
      return;
    }

    const invoiceWithItems = { ...data, items: currentInvoiceItems };

    if (editingInvoice !== null) {
      const updated = [...invoices];
      updated[editingInvoice] = invoiceWithItems;
      setInvoices(updated);
      toast({ title: "Success", description: "Invoice updated" });
    } else {
      const newInvoices = [...invoices, invoiceWithItems];
      setInvoices(newInvoices);
      toast({ title: "Success", description: "Invoice added" });

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

    const resetData: any = {
      lcNumber: undefined,
      lcDate: undefined,
      lcIssuedByBankId: undefined,
      lcValue: 0,
      lcCurrencyId: undefined,
      lcExchangeRate: 0,
      fiNumber: undefined,
      fiDate: undefined,
      fiExpiryDate: undefined,
      goodsType: undefined, // ✅ NEW
      version: 0,
      items: [],
    };

    if (editingInvoice === null && !isFirstInvoice) {
      resetData.lcNumber = commonLcDetails.lcNumber;
      resetData.lcDate = commonLcDetails.lcDate;
      resetData.lcIssuedByBankId = commonLcDetails.lcIssuedByBankId;
      resetData.lcValue = commonLcDetails.lcValue;
      resetData.lcCurrencyId = commonLcDetails.lcCurrencyId;
      resetData.lcExchangeRate = commonLcDetails.lcExchangeRate;
      resetData.fiNumber = commonLcDetails.fiNumber;
      resetData.fiDate = commonLcDetails.fiDate;
      resetData.fiExpiryDate = commonLcDetails.fiExpiryDate;
    }

    invoiceForm.reset(resetData);
    setCurrentInvoiceItems([]);
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleEditInvoice = (index: number) => {
    setEditingInvoice(index);
    const invoice = invoices[index];
    invoiceForm.reset(invoice);
    setCurrentInvoiceItems(invoice.items || []);
    setShowInvoiceForm(true);
  };

  const handleDeleteInvoice = (index: number) => {
    setInvoices(invoices.filter((_: Invoice, i: number) => i !== index));
    toast({ title: "Success", description: "Invoice deleted" });
  };

  const handleHsCodeSelect = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      invoiceItemForm.setValue("hsCode", selectedOption.code || "");
      invoiceItemForm.setValue("description", selectedOption.description || "");
      invoiceItemForm.setValue("hsCodeId", selectedOption.value);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({
      title: "Coming Soon",
      description: "Excel import functionality will be implemented.",
    });
  };

  const handleAddInvoiceClick = () => {
    setShowInvoiceForm(!showInvoiceForm);
    setEditingInvoice(null);

    const resetData: any = {
      lcNumber: undefined,
      lcDate: undefined,
      lcIssuedByBankId: undefined,
      lcValue: 0,
      lcCurrencyId: undefined,
      lcExchangeRate: 0,
      fiNumber: undefined,
      fiDate: undefined,
      fiExpiryDate: undefined,
      goodsType: undefined, // ✅ NEW
      version: 0,
      items: [],
    };

    if (!isFirstInvoice) {
      resetData.lcNumber = commonLcDetails.lcNumber;
      resetData.lcDate = commonLcDetails.lcDate;
      resetData.lcIssuedByBankId = commonLcDetails.lcIssuedByBankId;
      resetData.lcValue = commonLcDetails.lcValue;
      resetData.lcCurrencyId = commonLcDetails.lcCurrencyId;
      resetData.lcExchangeRate = commonLcDetails.lcExchangeRate;
      resetData.fiNumber = commonLcDetails.fiNumber;
      resetData.fiDate = commonLcDetails.fiDate;
      resetData.fiExpiryDate = commonLcDetails.fiExpiryDate;
    }

    invoiceForm.reset(resetData);
    setCurrentInvoiceItems([]);
  };

  return (
    <TabsContent value='invoice' className='mt-0'>
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50 flex flex-row items-center justify-between'>
          <CardTitle className='text-base'>
            Invoice & Commodity Details
          </CardTitle>
          <Button
            type='button'
            size='sm'
            onClick={handleAddInvoiceClick}
            className='h-7 text-xs'
          >
            <Plus className='h-3 w-3 mr-1' />
            Add Invoice
          </Button>
        </CardHeader>
        <CardContent className='p-4'>
          {/* Display Added Invoices */}
          {invoices.length > 0 && (
            <div className='mb-6'>
              <div className='text-sm font-semibold text-gray-700 mb-3'>
                Added Invoices ({invoices.length})
              </div>
              <div className='space-y-4'>
                {invoices.map((inv: Invoice, invIdx: number) => {
                  // ✅ Calculate total DV for this invoice
                  const invoiceTotalDv = inv.items.reduce(
                    (sum, item) => sum + item.quantity * item.dutiableValue,
                    0,
                  );

                  return (
                    <Card key={invIdx} className='border-blue-200'>
                      <CardHeader className='py-2 px-3 bg-blue-50'>
                        <div className='flex items-center justify-between'>
                          <div className='text-sm font-semibold'>
                            Invoice #{invIdx + 1}: {inv.invoiceNumber || "N/A"}{" "}
                            ({inv.items.length} items)
                          </div>
                          <div className='flex gap-1'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => handleEditInvoice(invIdx)}
                              className='h-6 w-6 p-0'
                            >
                              <Edit className='h-3 w-3 text-blue-600' />
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteInvoice(invIdx)}
                              className='h-6 w-6 p-0'
                            >
                              <Trash2 className='h-3 w-3 text-red-600' />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='p-3'>
                        <div className='grid grid-cols-5 gap-2 text-xs mb-3'>
                          <div>
                            <span className='font-semibold'>Date:</span>{" "}
                            {inv.invoiceDate
                              ? new Date(inv.invoiceDate).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div>
                            <span className='font-semibold'>Term:</span>{" "}
                            {inv.shippingTerm || "N/A"}
                          </div>
                          {/* ✅ NEW: Display Goods Type */}
                          <div>
                            <span className='font-semibold'>Goods Type:</span>{" "}
                            {GOODS_TYPE_OPTIONS.find(
                              (g) => g.value === inv.goodsType,
                            )?.label || "N/A"}
                          </div>
                          <div>
                            <span className='font-semibold'>LC No:</span>{" "}
                            {inv.lcNumber || "N/A"}
                          </div>
                          <div>
                            <span className='font-semibold'>LC Value:</span>{" "}
                            {inv.lcValue || 0}
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className='text-xs'>HS Code</TableHead>
                              <TableHead className='text-xs'>
                                Description
                              </TableHead>
                              <TableHead className='text-xs'>Origin</TableHead>
                              <TableHead className='text-xs text-right'>
                                Qty
                              </TableHead>
                              <TableHead className='text-xs text-right'>
                                DV (Unit)
                              </TableHead>
                              <TableHead className='text-xs text-right'>
                                Total DV
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inv.items.map(
                              (item: InvoiceItem, itemIdx: number) => (
                                <TableRow key={itemIdx}>
                                  <TableCell className='text-xs'>
                                    {item.hsCode}
                                  </TableCell>
                                  <TableCell className='text-xs max-w-[200px] truncate'>
                                    {item.description}
                                  </TableCell>
                                  <TableCell className='text-xs'>
                                    {countries.find(
                                      (c: SelectOption) =>
                                        c.value === item.originId,
                                    )?.label || "-"}
                                  </TableCell>
                                  <TableCell className='text-xs text-right'>
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className='text-xs text-right'>
                                    {item.dutiableValue.toFixed(2)}
                                  </TableCell>
                                  <TableCell className='text-xs text-right font-medium'>
                                    {(
                                      item.quantity * item.dutiableValue
                                    ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                            {/* ✅ FIXED: Total Row */}
                            <TableRow className='bg-gray-50 font-bold'>
                              <TableCell
                                colSpan={5}
                                className='text-xs text-right'
                              >
                                TOTAL DV:
                              </TableCell>
                              <TableCell className='text-xs text-right font-bold'>
                                {invoiceTotalDv.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invoice Form */}
          {showInvoiceForm && (
            <Card className='mb-4 border-green-200'>
              <CardHeader className='py-2 px-3 bg-green-50'>
                <CardTitle className='text-sm'>
                  {editingInvoice !== null ? "Edit Invoice" : "New Invoice"}
                  {!isFirstInvoice &&
                    editingInvoice === null &&
                    " (LC/FI details pre-filled from first invoice)"}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-4'>
                <div className='space-y-4'>
                  {/* ✅ NEW: LC Value Validation Alert */}
                  {hasLcValueMismatch && currentInvoiceItems.length > 0 && (
                    <Alert
                      variant='destructive'
                      className='border-orange-500 bg-orange-50'
                    >
                      <AlertTriangle className='h-4 w-4 text-orange-600' />
                      <AlertDescription className='text-xs text-orange-800'>
                        <strong>LC Value Mismatch!</strong> LC Value (
                        {lcValue.toFixed(2)}) does not match Invoice Total DV (
                        {totalDvValue.toFixed(2)}). Difference:{" "}
                        {Math.abs(lcValue - totalDvValue).toFixed(2)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Section 1: Invoice Header */}
                  <div className='bg-gray-50 p-3 rounded'>
                    <div className='text-xs font-semibold text-gray-700 mb-2'>
                      Invoice Information
                      <span className='text-xs font-normal text-gray-500 ml-2'>
                        (Unique for each invoice)
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-3'>
                      <FormField
                        control={invoiceForm.control}
                        name='invoiceNumber'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Invoice No.
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className='h-8 text-xs'
                                placeholder='INV-001'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='invoiceDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Invoice Date
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='date'
                                {...field}
                                value={field.value || ""}
                                className='h-8 text-xs'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='invoiceIssuedByPartyId'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Issued By (Party)
                            </FormLabel>
                            <FormControl>
                              <Select
                                options={parties}
                                value={parties.find(
                                  (p: SelectOption) => p.value === field.value,
                                )}
                                onChange={(val) => field.onChange(val?.value)}
                                styles={compactSelectStyles}
                                isLoading={loadingParties}
                                isClearable
                                placeholder='Select Party'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* ✅ NEW: Shipping Term and Goods Type in same row */}
                    <div className='grid grid-cols-2 gap-3 mt-3'>
                      <FormField
                        control={invoiceForm.control}
                        name='shippingTerm'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Shipping Term (Dynamic based on Freight Type)
                            </FormLabel>
                            <FormControl>
                              <Select
                                options={
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
                                        ]
                                }
                                value={
                                  field.value
                                    ? { value: field.value, label: field.value }
                                    : null
                                }
                                onChange={(val) => field.onChange(val?.value)}
                                styles={compactSelectStyles}
                                isClearable
                                placeholder='Select Shipping Term'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* ✅ NEW: Goods Type Dropdown */}
                      <FormField
                        control={invoiceForm.control}
                        name='goodsType'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Goods Type
                            </FormLabel>
                            <FormControl>
                              <Select
                                options={GOODS_TYPE_OPTIONS}
                                value={GOODS_TYPE_OPTIONS.find(
                                  (g) => g.value === field.value,
                                )}
                                onChange={(val) => field.onChange(val?.value)}
                                styles={compactSelectStyles}
                                isClearable
                                placeholder='Select Goods Type'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 2: FI Details */}
                  <div className='bg-purple-50 p-3 rounded'>
                    <div className='text-xs font-semibold text-gray-700 mb-2'>
                      FI (Form E) Details
                      <span className='text-xs font-normal text-gray-500 ml-2'>
                        {!isFirstInvoice &&
                          editingInvoice === null &&
                          "(Pre-filled from first invoice)"}
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-3'>
                      <FormField
                        control={invoiceForm.control}
                        name='fiNumber'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>FI Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className='h-8 text-xs'
                                placeholder='FI-001'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='fiDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>FI Date</FormLabel>
                            <FormControl>
                              <Input
                                type='date'
                                {...field}
                                value={field.value || ""}
                                className='h-8 text-xs'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='lcValue'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              LC Value
                              {currentInvoiceItems.length > 0 && (
                                <span className='text-xs text-gray-500 ml-1'>
                                  (Should match Total DV:{" "}
                                  {totalDvValue.toFixed(2)})
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                step='0.01'
                                {...field}
                                value={field.value || 0}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                className={`h-8 text-xs ${
                                  hasLcValueMismatch
                                    ? "border-orange-500 bg-orange-50"
                                    : ""
                                }`}
                                placeholder='0.00'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='lcCurrencyId'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>Currency</FormLabel>
                            <FormControl>
                              <Select
                                options={currencies}
                                value={currencies.find(
                                  (c: SelectOption) => c.value === field.value,
                                )}
                                onChange={(val) => field.onChange(val?.value)}
                                styles={compactSelectStyles}
                                isLoading={loadingCurrencies}
                                isClearable
                                placeholder='Currency'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='fiExpiryDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              FI Expiry Date
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='date'
                                {...field}
                                value={field.value || ""}
                                className='h-8 text-xs'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 3: LC Details */}
                  <div className='bg-blue-50 p-3 rounded'>
                    <div className='text-xs font-semibold text-gray-700 mb-2'>
                      LC (Letter of Credit) Details
                      <span className='text-xs font-normal text-gray-500 ml-2'>
                        {!isFirstInvoice &&
                          editingInvoice === null &&
                          "(Pre-filled from first invoice)"}
                      </span>
                    </div>
                    <div className='grid grid-cols-4 gap-3'>
                      <FormField
                        control={invoiceForm.control}
                        name='lcNumber'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>LC Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                className='h-8 text-xs'
                                placeholder='LC-123'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='lcDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>LC Date</FormLabel>
                            <FormControl>
                              <Input
                                type='date'
                                {...field}
                                value={field.value || ""}
                                className='h-8 text-xs'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name='lcIssuedByBankId'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              LC Issued By (Bank)
                            </FormLabel>
                            <FormControl>
                              <Select
                                options={banks}
                                value={banks.find(
                                  (b: SelectOption) => b.value === field.value,
                                )}
                                onChange={(val) => field.onChange(val?.value)}
                                styles={compactSelectStyles}
                                isLoading={loadingBanks}
                                isClearable
                                placeholder='Select Bank'
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className='border-t my-4'></div>

                  {/* Section 4: Commodities */}
                  <div>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='text-sm font-semibold text-gray-700'>
                        Invoice Commodities ({currentInvoiceItems.length} items)
                        {currentInvoiceItems.length > 0 && (
                          <Badge variant='outline' className='ml-2'>
                            Total DV: {totalDvValue.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          onClick={() => {
                            setShowInvoiceItemForm(!showInvoiceItemForm);
                            setEditingInvoiceItem(null);
                            invoiceItemForm.reset({
                              quantity: 0,
                              dutiableValue: 0,
                              assessableValue: 0,
                              totalValue: 0,
                              version: 0,
                            });
                          }}
                          className='h-7 text-xs'
                        >
                          <Package className='h-3 w-3 mr-1' />
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {/* Current Invoice Items Table */}
                    {currentInvoiceItems.length > 0 && (
                      <Table className='mb-3'>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='text-xs'>HS Code</TableHead>
                            <TableHead className='text-xs'>
                              Description
                            </TableHead>
                            <TableHead className='text-xs'>Origin</TableHead>
                            <TableHead className='text-xs text-right'>
                              Qty
                            </TableHead>
                            <TableHead className='text-xs text-right'>
                              DV (Unit)
                            </TableHead>
                            <TableHead className='text-xs text-right'>
                              Total DV
                            </TableHead>
                            <TableHead className='text-xs'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentInvoiceItems.map(
                            (item: InvoiceItem, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className='text-xs'>
                                  {item.hsCode}
                                </TableCell>
                                <TableCell className='text-xs max-w-[200px] truncate'>
                                  {item.description}
                                </TableCell>
                                <TableCell className='text-xs'>
                                  {countries.find(
                                    (c: SelectOption) =>
                                      c.value === item.originId,
                                  )?.label || "-"}
                                </TableCell>
                                <TableCell className='text-xs text-right'>
                                  {item.quantity}
                                </TableCell>
                                <TableCell className='text-xs text-right'>
                                  {item.dutiableValue.toFixed(2)}
                                </TableCell>
                                <TableCell className='text-xs text-right font-medium'>
                                  {(item.quantity * item.dutiableValue).toFixed(
                                    2,
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className='flex gap-1'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => handleEditInvoiceItem(idx)}
                                      className='h-6 w-6 p-0'
                                    >
                                      <Edit className='h-3 w-3 text-blue-600' />
                                    </Button>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        handleDeleteInvoiceItem(idx)
                                      }
                                      className='h-6 w-6 p-0'
                                    >
                                      <Trash2 className='h-3 w-3 text-red-600' />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                          {/* ✅ FIXED: Total Row */}
                          <TableRow className='bg-gray-50 font-bold'>
                            <TableCell
                              colSpan={5}
                              className='text-xs text-right'
                            >
                              TOTAL DV:
                            </TableCell>
                            <TableCell className='text-xs text-right font-bold'>
                              {totalDvValue.toFixed(2)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}

                    {/* Add Commodity Form */}
                    {showInvoiceItemForm && (
                      <Card className='mb-3 border-blue-200'>
                        <CardHeader className='py-2 px-3 bg-blue-50'>
                          <CardTitle className='text-sm'>
                            {editingInvoiceItem !== null
                              ? "Edit Commodity"
                              : "Add Commodity"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-3'>
                          <div className='space-y-3'>
                            <FormField
                              control={invoiceItemForm.control}
                              name='hsCodeId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-xs'>
                                    Search HS Code (by Code or Description)
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      options={hsCodes}
                                      value={hsCodes.find(
                                        (h: SelectOption) =>
                                          h.value === field.value,
                                      )}
                                      onChange={(val) => {
                                        field.onChange(val?.value);
                                        handleHsCodeSelect(val);
                                      }}
                                      styles={compactSelectStyles}
                                      isLoading={loadingHsCodes}
                                      isClearable
                                      placeholder='Search by Code or Description'
                                      filterOption={(
                                        option: any,
                                        inputValue: string,
                                      ) => {
                                        const searchValue =
                                          inputValue.toLowerCase();
                                        const code =
                                          option.data.code?.toLowerCase() || "";
                                        const description =
                                          option.data.description?.toLowerCase() ||
                                          "";
                                        return (
                                          code.includes(searchValue) ||
                                          description.includes(searchValue)
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className='grid grid-cols-2 gap-3'>
                              <FormField
                                control={invoiceItemForm.control}
                                name='hsCode'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className='text-xs'>
                                      HS Code
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value || ""}
                                        className='h-8 text-xs bg-gray-50'
                                        placeholder='Auto-filled'
                                        readOnly
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={invoiceItemForm.control}
                                name='originId'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className='text-xs'>
                                      Origin (Country)
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        options={countries}
                                        value={countries.find(
                                          (c: SelectOption) =>
                                            c.value === field.value,
                                        )}
                                        onChange={(val) =>
                                          field.onChange(val?.value)
                                        }
                                        styles={compactSelectStyles}
                                        isLoading={loadingCountries}
                                        isClearable
                                        placeholder='Select Country'
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={invoiceItemForm.control}
                              name='description'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-xs'>
                                    Item Description
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      value={field.value || ""}
                                      className='h-16 text-xs'
                                      placeholder='Auto-filled from HS Code'
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className='grid grid-cols-2 gap-3'>
                              <FormField
                                control={invoiceItemForm.control}
                                name='quantity'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className='text-xs'>
                                      Quantity
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        step='0.01'
                                        {...field}
                                        value={field.value || 0}
                                        onChange={(e) =>
                                          field.onChange(Number(e.target.value))
                                        }
                                        className='h-8 text-xs'
                                        placeholder='0'
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={invoiceItemForm.control}
                                name='dutiableValue'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className='text-xs'>
                                      Dutiable Value (DV) - Unit Price
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        step='0.01'
                                        {...field}
                                        value={field.value || 0}
                                        onChange={(e) =>
                                          field.onChange(Number(e.target.value))
                                        }
                                        className='h-8 text-xs'
                                        placeholder='0.00'
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* ✅ Show calculated total */}
                            {invoiceItemForm.watch("quantity") > 0 &&
                              invoiceItemForm.watch("dutiableValue") > 0 && (
                                <div className='bg-blue-50 p-2 rounded text-xs'>
                                  <span className='font-semibold'>
                                    Total DV for this item:{" "}
                                  </span>
                                  {(
                                    invoiceItemForm.watch("quantity") *
                                    invoiceItemForm.watch("dutiableValue")
                                  ).toFixed(2)}
                                </div>
                              )}
                          </div>

                          <div className='flex gap-2 mt-3'>
                            <Button
                              type='button'
                              onClick={(e) => {
                                e.preventDefault();
                                invoiceItemForm.handleSubmit(
                                  handleAddInvoiceItem,
                                )();
                              }}
                              size='sm'
                              className='h-7 text-xs'
                            >
                              <Save className='h-3 w-3 mr-1' />
                              {editingInvoiceItem !== null
                                ? "Update"
                                : "Add"}{" "}
                              Item
                            </Button>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setShowInvoiceItemForm(false);
                                setEditingInvoiceItem(null);
                              }}
                              className='h-7 text-xs'
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {currentInvoiceItems.length === 0 &&
                      !showInvoiceItemForm && (
                        <div className='text-center py-8 text-sm text-gray-500 bg-gray-50 rounded'>
                          No commodities added. Click Add Item to add items to
                          this invoice.
                        </div>
                      )}
                  </div>
                </div>

                <div className='flex gap-2 mt-4 pt-4 border-t'>
                  <Button
                    type='button'
                    onClick={(e) => {
                      e.preventDefault();
                      invoiceForm.handleSubmit(handleAddInvoice)();
                    }}
                    size='sm'
                    className='h-8 text-xs'
                    disabled={hasLcValueMismatch}
                  >
                    <Save className='h-3 w-3 mr-1' />
                    {editingInvoice !== null ? "Update" : "Save"} Invoice
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setShowInvoiceForm(false);
                      setEditingInvoice(null);
                      setCurrentInvoiceItems([]);
                    }}
                    className='h-8 text-xs'
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {invoices.length === 0 && !showInvoiceForm && (
            <div className='text-center py-12 text-sm text-gray-500'>
              No invoices added yet. Click Add Invoice to create an invoice with
              commodities.
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
