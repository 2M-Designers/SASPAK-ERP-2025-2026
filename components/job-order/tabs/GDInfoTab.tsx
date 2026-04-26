import React, { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactSelect, { StylesConfig, GroupBase } from "react-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Download, Plus, Pencil, Trash2, FileText } from "lucide-react";
import * as ExcelJS from "exceljs";
import { compactSelectStyles } from "../utils/styles";
import { parseGDOfficialFormat, type GDItem } from "./gdOfficialFormatParser";

// ─── Shared compact design primitives ────────────────────────────────────────

/** Format YYYY-MM-DD or ISO string → dd/mm/yyyy, timezone-safe */
const fmtDate = (val: string | null | undefined): string => {
  if (!val) return "—";
  const datePart = val.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return val;
};

// react-select compact styles — same as ShippingTab / InvoiceTab
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

// Compact dialog input row
function DField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-[11px] font-semibold uppercase tracking-wide text-gray-500 leading-none'>
        {label}
      </span>
      {children}
    </div>
  );
}

const GD_TYPE_OPTIONS = [
  { value: "HC", label: "HC — Home Consumption" },
  { value: "IB", label: "IB — Import Bond" },
  { value: "EB", label: "EB — Export Bond" },
  { value: "TI", label: "TI — Temporary Import" },
  { value: "SB", label: "SB — Supply Bond" },
];

const INSURANCE_TYPE_OPTIONS = [
  { value: "1percent", label: "1% of AV" },
  { value: "Rs", label: "Rs. (manual)" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function GDInfoTab({
  form,
  goodsDeclarations,
  setGoodsDeclarations,
  toast,
  freightType,
}: any) {
  const [isGDDialogOpen, setIsGDDialogOpen] = useState(false);
  const [editingGDIndex, setEditingGDIndex] = useState<number | null>(null);
  const [insuranceType, setInsuranceType] = useState<"1percent" | "Rs">("Rs");
  const [gdPrefix, setGdPrefix] = useState<string>("KAPS");
  const [gdSerialNumber, setGdSerialNumber] = useState<string>("1119");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Sync selectedType with form value on mount
  React.useEffect(() => {
    const currentType = form.watch("gdType");
    if (currentType && currentType !== selectedType) {
      setSelectedType(currentType);
    }
  }, [form.watch("gdType")]);

  // Extract prefix and serial from existing GD Number (edit mode)
  React.useEffect(() => {
    const existingGDNumber = form.watch("gdnumber");
    if (existingGDNumber && existingGDNumber.includes("-")) {
      const parts = existingGDNumber.split("-");
      if (parts.length === 4) {
        if (parts[0] && parts[0] !== gdPrefix) setGdPrefix(parts[0]);
        if (parts[2] && parts[2] !== gdSerialNumber)
          setGdSerialNumber(parts[2]);
      }
    }
    setTimeout(() => setIsInitialLoad(false), 500);
  }, []);

  // Extract prefix, type and serial from GD Number in edit mode
  React.useEffect(() => {
    const gdNumber = form.watch("gdnumber");
    if (gdNumber && gdNumber.includes("-")) {
      const parts = gdNumber.split("-");
      if (parts.length === 4) {
        if (parts[0] && parts[0] !== gdPrefix) setGdPrefix(parts[0]);
        if (parts[2] && parts[2] !== gdSerialNumber)
          setGdSerialNumber(parts[2]);
        if (parts[1] && parts[1] !== selectedType) {
          setSelectedType(parts[1]);
          form.setValue("gdType", parts[1]);
        }
      }
    }
  }, []);

  const [currentGD, setCurrentGD] = useState<any>({
    JobGoodsDeclarationId: 0,
    unitType: "",
    quantity: 0,
    cocode: "",
    sronumber: "",
    hscode: "",
    itemDescription: "",
    declaredUnitValue: 0,
    assessedUnitValue: 0,
    totalDeclaredValue: 0,
    totalAssessedValue: 0,
    customDeclaredValue: 0,
    customAssessedValue: 0,
    levyCd: 0,
    levySt: 0,
    levyRd: 0,
    levyAsd: 0,
    levyIt: 0,
    rateCd: 0,
    rateSt: 0,
    rateRd: 0,
    rateAsd: 0,
    rateIt: 0,
    payableCd: 0,
    payableSt: 0,
    payableRd: 0,
    payableAsd: 0,
    payableIt: 0,
  });

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const formatGDNumber = (
    prefix: string,
    type: string,
    serial: string,
    date: string,
  ): string => {
    if (!prefix || !type || !serial || !date) return "";
    const cleanPrefix = prefix.trim().toUpperCase();
    const cleanSerial = serial.trim();
    const dateParts = date.split("-");
    if (dateParts.length !== 3) return "";
    return `${cleanPrefix}-${type}-${cleanSerial}-${dateParts[2]}${dateParts[1]}${dateParts[0]}`;
  };

  // Auto-generate GD Number
  React.useEffect(() => {
    if (isInitialLoad) return;
    const gdDate = form.watch("gddate");
    const existingGDNumber = form.watch("gdnumber");
    if (gdPrefix && selectedType && gdSerialNumber && gdDate) {
      const newGDNumber = formatGDNumber(
        gdPrefix,
        selectedType,
        gdSerialNumber,
        gdDate,
      );
      if (newGDNumber && newGDNumber !== existingGDNumber) {
        form.setValue("gdnumber", newGDNumber);
      }
    }
  }, [
    gdPrefix,
    selectedType,
    gdSerialNumber,
    form.watch("gddate"),
    isInitialLoad,
  ]);

  const calculateTotalAssessedValue = () =>
    goodsDeclarations.reduce(
      (sum: number, gd: any) => sum + (gd.totalAssessedValue || 0),
      0,
    );

  // Auto-calc insurance
  React.useEffect(() => {
    if (insuranceType === "1percent") {
      form.setValue(
        "insurance",
        (calculateTotalAssessedValue() * 0.01).toFixed(2),
      );
    }
  }, [insuranceType, goodsDeclarations, form]);

  // Auto-calc landing
  React.useEffect(() => {
    const totalAV = calculateTotalAssessedValue();
    const insuranceValue = parseFloat(form.watch("insurance") || "0");
    form.setValue("landing", ((totalAV + insuranceValue) * 0.01).toFixed(2));
  }, [goodsDeclarations, form.watch("insurance"), form]);

  // ── Excel template download ──────────────────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("GD Template");
      const headers = [
        "Item No",
        "Unit Type",
        "Quantity",
        "CO Code",
        "SRO Number",
        "HS Code",
        "Item Description",
        "Declared Unit Value",
        "Assessed Unit Value",
        "Total Declared Value",
        "Total Assessed Value",
        "Custom Declared Value (PKR)",
        "Custom Assessed Value (PKR)",
        "Levy CD",
        "Levy ST",
        "Levy RD",
        "Levy AST",
        "Levy IT",
        "Rate CD (%)",
        "Rate ST (%)",
        "Rate RD (%)",
        "Rate AST (%)",
        "Rate IT (%)",
        "Payable CD",
        "Payable ST",
        "Payable RD",
        "Payable AST",
        "Payable IT",
      ];
      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.addRow([
        1,
        "PCS",
        100,
        "China",
        "SRO-001",
        "8471.30",
        "Sample item description",
        100.0,
        100.0,
        10000.0,
        10000.0,
        2822500.0,
        2822500.0,
        0,
        0,
        0,
        0,
        0,
        3.75,
        18.0,
        5.0,
        3.0,
        6.0,
        105843.75,
        508185.0,
        141233.0,
        84872.0,
        113431.0,
      ]);
      worksheet.columns = [
        { width: 10 },
        { width: 15 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 40 },
        { width: 18 },
        { width: 18 },
        { width: 20 },
        { width: 20 },
        { width: 25 },
        { width: 25 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "GD_Detail_Template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Template Downloaded" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate template",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
      const headers = [
        "Item No",
        "Unit Type",
        "Quantity",
        "CO Code",
        "SRO Number",
        "HS Code",
        "Item Description",
        "Declared Unit Value",
        "Assessed Unit Value",
        "Total Declared Value",
        "Total Assessed Value",
        "Custom Declared Value (PKR)",
        "Custom Assessed Value (PKR)",
        "Levy CD",
        "Levy ST",
        "Levy RD",
        "Levy AST",
        "Levy IT",
        "Rate CD (%)",
        "Rate ST (%)",
        "Rate RD (%)",
        "Rate AST (%)",
        "Rate IT (%)",
        "Payable CD",
        "Payable ST",
        "Payable RD",
        "Payable AST",
        "Payable IT",
      ];
      const jsonData: any[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = row.getCell(index + 1).value;
        });
        jsonData.push(rowData);
      });
      const mappedData = jsonData.map((row: any, index: number) => ({
        JobGoodsDeclarationId: -(Math.floor(Date.now() / 1000) + index),
        jobId: 0,
        unitType: row["Unit Type"] || "",
        quantity: parseFloat(row["Quantity"]) || 0,
        cocode: row["CO Code"] || "",
        sronumber: row["SRO Number"] || "",
        hscode: row["HS Code"] || "",
        itemDescription: row["Item Description"] || "",
        declaredUnitValue: parseFloat(row["Declared Unit Value"]) || 0,
        assessedUnitValue: parseFloat(row["Assessed Unit Value"]) || 0,
        totalDeclaredValue: parseFloat(row["Total Declared Value"]) || 0,
        totalAssessedValue: parseFloat(row["Total Assessed Value"]) || 0,
        customDeclaredValue:
          parseFloat(row["Custom Declared Value (PKR)"]) || 0,
        customAssessedValue:
          parseFloat(row["Custom Assessed Value (PKR)"]) || 0,
        levyCd: parseFloat(row["Levy CD"]) || 0,
        levySt: parseFloat(row["Levy ST"]) || 0,
        levyRd: parseFloat(row["Levy RD"]) || 0,
        levyAsd: parseFloat(row["Levy AST"]) || 0,
        levyIt: parseFloat(row["Levy IT"]) || 0,
        rateCd: parseFloat(row["Rate CD (%)"]) || 0,
        rateSt: parseFloat(row["Rate ST (%)"]) || 0,
        rateRd: parseFloat(row["Rate RD (%)"]) || 0,
        rateAsd: parseFloat(row["Rate AST (%)"]) || 0,
        rateIt: parseFloat(row["Rate IT (%)"]) || 0,
        payableCd: parseFloat(row["Payable CD"]) || 0,
        payableSt: parseFloat(row["Payable ST"]) || 0,
        payableRd: parseFloat(row["Payable RD"]) || 0,
        payableAsd: parseFloat(row["Payable AST"]) || 0,
        payableIt: parseFloat(row["Payable IT"]) || 0,
        version: 0,
      }));
      setGoodsDeclarations([...goodsDeclarations, ...mappedData]);
      toast({
        title: "Success",
        description: `${mappedData.length} items imported`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to parse Excel file.",
      });
    }
    e.target.value = "";
  };

  const handleOfficialGDUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const gdItems = await parseGDOfficialFormat(file);
      const mappedData = gdItems.map((item: GDItem, index: number) => ({
        JobGoodsDeclarationId: -(Math.floor(Date.now() / 1000) + index),
        jobId: 0,
        unitType: item.unitType,
        quantity: item.quantity,
        cocode: item.coCode,
        sronumber: item.sroNumber,
        hscode: item.hsCode,
        itemDescription: item.itemDescription,
        declaredUnitValue: item.declaredUnitValue,
        assessedUnitValue: item.assessedUnitValue,
        totalDeclaredValue: item.totalDeclaredValue,
        totalAssessedValue: item.totalAssessedValue,
        customDeclaredValue: item.customDeclaredValue,
        customAssessedValue: item.customAssessedValue,
        levyCd: item.levyCd,
        levySt: item.levySt,
        levyRd: item.levyRd,
        levyAsd: item.levyAsd,
        levyIt: item.levyIt,
        rateCd: item.rateCd,
        rateSt: item.rateSt,
        rateRd: item.rateRd,
        rateAsd: item.rateAsd,
        rateIt: item.rateIt,
        payableCd: item.payableCd,
        payableSt: item.payableSt,
        payableRd: item.payableRd,
        payableAsd: item.payableAsd,
        payableIt: item.payableIt,
        version: 0,
      }));
      setGoodsDeclarations([...goodsDeclarations, ...mappedData]);
      toast({
        title: "Success",
        description: `${mappedData.length} items imported from official GD`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to parse GD file.",
      });
    }
    e.target.value = "";
  };

  const handleAddGD = () => {
    setCurrentGD({
      JobGoodsDeclarationId: 0,
      unitType: "",
      quantity: 0,
      cocode: "",
      sronumber: "",
      hscode: "",
      itemDescription: "",
      declaredUnitValue: 0,
      assessedUnitValue: 0,
      totalDeclaredValue: 0,
      totalAssessedValue: 0,
      customDeclaredValue: 0,
      customAssessedValue: 0,
      levyCd: 0,
      levySt: 0,
      levyRd: 0,
      levyAsd: 0,
      levyIt: 0,
      rateCd: 0,
      rateSt: 0,
      rateRd: 0,
      rateAsd: 0,
      rateIt: 0,
      payableCd: 0,
      payableSt: 0,
      payableRd: 0,
      payableAsd: 0,
      payableIt: 0,
    });
    setEditingGDIndex(null);
    setIsGDDialogOpen(true);
  };

  const handleEditGD = (index: number) => {
    setCurrentGD({ ...goodsDeclarations[index] });
    setEditingGDIndex(index);
    setIsGDDialogOpen(true);
  };

  const handleSaveGD = () => {
    const updatedGD = {
      ...currentGD,
      totalDeclaredValue:
        currentGD.totalDeclaredValue ||
        currentGD.quantity * currentGD.declaredUnitValue,
      totalAssessedValue:
        currentGD.totalAssessedValue ||
        currentGD.quantity * currentGD.assessedUnitValue,
    };
    if (editingGDIndex !== null) {
      const updated = [...goodsDeclarations];
      updated[editingGDIndex] = updatedGD;
      setGoodsDeclarations(updated);
    } else {
      setGoodsDeclarations([
        ...goodsDeclarations,
        { ...updatedGD, id: -Math.floor(Date.now() / 1000), version: 0 },
      ]);
    }
    setIsGDDialogOpen(false);
    toast({
      title: "Success",
      description: `Item ${editingGDIndex !== null ? "updated" : "added"} successfully`,
    });
  };

  const handleDeleteGD = (index: number) => {
    if (confirm("Delete this item?")) {
      setGoodsDeclarations(
        goodsDeclarations.filter((_: any, i: number) => i !== index),
      );
      toast({ title: "Item deleted" });
    }
  };

  const totalAV = calculateTotalAssessedValue();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <TabsContent value='gd'>
      <div className='bg-white border border-gray-200 rounded-md p-4'>
        {/* ── GD NUMBER (auto-generated, prominent read-only) ── */}
        {form.watch("gdnumber") && (
          <div className='flex items-center gap-3 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded'>
            <span className='text-[11px] font-bold uppercase tracking-widest text-green-700 whitespace-nowrap'>
              Generated GD No.
            </span>
            <span className='font-mono text-[15px] font-bold text-green-800 tracking-wider'>
              {form.watch("gdnumber")}
            </span>
            <span className='text-[10px] text-green-600 ml-auto'>
              Format: PREFIX-TYPE-SERIAL-DDMMYYYY
            </span>
          </div>
        )}

        {/* ── GD NUMBER COMPONENTS ── */}
        <SectionBar title='GD Number Components' />
        <div className='flex gap-3 flex-wrap items-end'>
          {/* Prefix */}
          <Field label='Prefix *' className='w-[100px]'>
            <Input
              className={`${tinyInputClass} font-mono`}
              placeholder='KAPS'
              value={gdPrefix}
              maxLength={10}
              onChange={(e) =>
                setGdPrefix(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                )
              }
            />
          </Field>

          {/* Type */}
          <Field label='Type *' className='w-[210px]'>
            <ReactSelect
              options={GD_TYPE_OPTIONS}
              value={
                GD_TYPE_OPTIONS.find((o) => o.value === selectedType) || null
              }
              onChange={(val) => {
                const v = val?.value ?? "";
                setSelectedType(v);
                form.setValue("gdType", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              styles={tinySelectStyles}
              isClearable
              placeholder='Select type…'
            />
          </Field>

          {/* Serial */}
          <Field label='Serial No. *' className='w-[110px]'>
            <Input
              className={`${tinyInputClass} font-mono`}
              placeholder='1119'
              value={gdSerialNumber}
              onChange={(e) =>
                setGdSerialNumber(e.target.value.replace(/[^0-9]/g, ""))
              }
            />
          </Field>

          {/* GD Date */}
          <Field
            label={`GD Date * (max ${fmtDate(getTodayDate())})`}
            className='w-[160px]'
          >
            <Input
              type='date'
              className={tinyInputClass}
              max={getTodayDate()}
              {...form.register("gddate")}
            />
          </Field>

          {/* Preview */}
          {gdPrefix &&
            selectedType &&
            gdSerialNumber &&
            form.watch("gddate") && (
              <div className='flex flex-col justify-end pb-0.5'>
                <span className='text-[11px] text-gray-400 uppercase tracking-wide'>
                  Preview
                </span>
                <span className='font-mono text-[13px] font-semibold text-blue-700'>
                  {formatGDNumber(
                    gdPrefix,
                    selectedType,
                    gdSerialNumber,
                    form.watch("gddate"),
                  )}
                </span>
              </div>
            )}
        </div>

        {/* ── FINANCIAL DETAILS ── */}
        <SectionBar title='Financial Details' />
        <div className='flex gap-3 flex-wrap items-end'>
          {/* Exchange Rate */}
          <Field label='Exchange Rate (4 dec)' className='w-[150px]'>
            <Input
              type='number'
              step='0.0001'
              placeholder='282.2500'
              className={tinyInputClass}
              {...form.register("jobInvoiceExchRate", { valueAsNumber: true })}
            />
          </Field>

          {/* GD Charges */}
          <Field
            label={
              freightType === "Collect" ? "Freight Charges" : "Other Charges"
            }
            className='w-[140px]'
          >
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={tinyInputClass}
              {...form.register("gdcharges", { valueAsNumber: true })}
            />
          </Field>

          {/* Insurance — type picker + amount side by side */}
          <Field label='Insurance'>
            <div className='flex gap-1 items-center'>
              <div className='w-[130px]'>
                <ReactSelect
                  options={INSURANCE_TYPE_OPTIONS}
                  value={
                    INSURANCE_TYPE_OPTIONS.find(
                      (o) => o.value === insuranceType,
                    ) || null
                  }
                  onChange={(val) => {
                    const v = (val?.value ?? "Rs") as "1percent" | "Rs";
                    setInsuranceType(v);
                    if (v === "1percent") {
                      form.setValue("insurance", (totalAV * 0.01).toFixed(2));
                    }
                  }}
                  styles={tinySelectStyles}
                  isSearchable={false}
                  placeholder='Type…'
                />
              </div>
              <Input
                type='number'
                step='0.01'
                placeholder='0.00'
                className={`${tinyInputClass} w-[110px] ${insuranceType === "1percent" ? "bg-amber-50 border-amber-300 cursor-not-allowed" : ""}`}
                disabled={insuranceType === "1percent"}
                {...form.register("insurance")}
              />
            </div>
            {insuranceType === "1percent" && (
              <span className='text-[10px] text-green-600 mt-0.5'>
                Auto: 1% of AV ({totalAV.toFixed(2)})
              </span>
            )}
          </Field>

          {/* Landing — auto-calc */}
          <Field label='Landing ↺ (1% of AV + Ins.)' className='w-[160px]'>
            <Input
              type='number'
              step='0.01'
              placeholder='0.00'
              className={`${tinyInputClass} bg-amber-50 border-amber-300 cursor-not-allowed`}
              disabled
              {...form.register("landing")}
            />
          </Field>
        </div>

        {/* ── FINANCIAL SUMMARY (shown when items exist) ── */}
        {goodsDeclarations.length > 0 && (
          <>
            <SectionBar title='Financial Summary' />
            <div className='flex flex-wrap gap-x-6 gap-y-1 text-[12px] py-1'>
              <span className='text-gray-500'>
                Items:{" "}
                <strong className='text-gray-800'>
                  {goodsDeclarations.length}
                </strong>
              </span>
              <span className='text-gray-500'>
                Total Qty:{" "}
                <strong className='text-gray-800'>
                  {goodsDeclarations.reduce(
                    (s: number, g: any) => s + g.quantity,
                    0,
                  )}
                </strong>
              </span>
              <span className='text-gray-500'>
                Total AV:{" "}
                <strong className='text-blue-700'>${totalAV.toFixed(2)}</strong>
              </span>
              <span className='text-gray-500'>
                Insurance:{" "}
                <strong className='text-gray-800'>
                  ${parseFloat(form.watch("insurance") || "0").toFixed(2)}
                </strong>
              </span>
              <span className='text-gray-500'>
                Landing:{" "}
                <strong className='text-gray-800'>
                  ${parseFloat(form.watch("landing") || "0").toFixed(2)}
                </strong>
              </span>
              <span className='text-gray-500'>
                Total Payable (CD+ST+RD):{" "}
                <strong className='text-orange-700'>
                  PKR{" "}
                  {goodsDeclarations
                    .reduce(
                      (s: number, g: any) =>
                        s + g.payableCd + g.payableSt + g.payableRd,
                      0,
                    )
                    .toFixed(2)}
                </strong>
              </span>
            </div>
          </>
        )}

        {/* ── GD DETAIL ITEMS TABLE ── */}
        <SectionBar
          title={`GD Detail Items${goodsDeclarations.length > 0 ? ` (${goodsDeclarations.length})` : ""}`}
          aside={
            <div className='flex gap-1'>
              <button
                type='button'
                onClick={downloadTemplate}
                className='flex items-center gap-1 h-7 px-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700'
              >
                <Download className='h-3 w-3' /> Template
              </button>

              <label
                htmlFor='excel-upload'
                className='flex items-center gap-1 h-7 px-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700 cursor-pointer'
              >
                <Upload className='h-3 w-3' /> Upload
              </label>
              <input
                id='excel-upload'
                type='file'
                accept='.xlsx,.xls'
                className='hidden'
                onChange={handleFileUpload}
              />

              <label
                htmlFor='official-gd-upload'
                className='flex items-center gap-1 h-7 px-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700 cursor-pointer'
              >
                <FileText className='h-3 w-3' /> Import GD
              </label>
              <input
                id='official-gd-upload'
                type='file'
                accept='.xlsx,.xls'
                className='hidden'
                onChange={handleOfficialGDUpload}
              />

              <button
                type='button'
                onClick={handleAddGD}
                className='flex items-center gap-1 h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium'
              >
                <Plus className='h-3 w-3' /> Add Item
              </button>
            </div>
          }
        />

        {/* Scrollable table */}
        <div className='border border-gray-200 rounded overflow-x-auto max-h-[500px] overflow-y-auto'>
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 10px;
              height: 10px;
            }
            div::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 6px;
            }
            div::-webkit-scrollbar-thumb {
              background: #aaa;
              border-radius: 6px;
              border: 2px solid #f1f1f1;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #888;
            }
          `}</style>

          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50 h-8'>
                <TableHead className='text-[11px] font-semibold py-1 px-2 sticky left-0 bg-gray-50 z-10 w-10'>
                  #
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[80px]'>
                  Unit
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[60px] text-right'>
                  Qty
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[90px]'>
                  CO Code
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[100px]'>
                  SRO No.
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[100px]'>
                  HS Code
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[200px]'>
                  Description
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right'>
                  Decl. Unit
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right'>
                  Assd. Unit
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right'>
                  Total Decl.
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[110px] text-right'>
                  Total Assd.
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[130px] text-right'>
                  Cust. Decl (PKR)
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[130px] text-right'>
                  Cust. Assd (PKR)
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[70px] text-right'>
                  CD%
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[70px] text-right'>
                  ST%
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[70px] text-right'>
                  RD%
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[100px] text-right'>
                  Pay. CD
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[100px] text-right'>
                  Pay. ST
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 min-w-[100px] text-right'>
                  Pay. RD
                </TableHead>
                <TableHead className='text-[11px] font-semibold py-1 px-2 sticky right-0 bg-gray-50 z-10 w-16'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goodsDeclarations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={20}
                    className='text-center text-[12px] text-gray-400 py-8'
                  >
                    No items yet — click <strong>Add Item</strong> or upload a
                    template.
                  </TableCell>
                </TableRow>
              ) : (
                goodsDeclarations.map((gd: any, index: number) => (
                  <TableRow
                    key={gd.id || index}
                    className='h-8 hover:bg-gray-50'
                  >
                    <TableCell className='text-[12px] py-1 px-2 sticky left-0 bg-white z-10 font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2'>
                      {gd.unitType}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.quantity}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2'>
                      {gd.cocode}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2'>
                      {gd.sronumber}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 font-mono'>
                      {gd.hscode}
                    </TableCell>
                    <TableCell
                      className='text-[12px] py-1 px-2 max-w-[200px] truncate'
                      title={gd.itemDescription}
                    >
                      {gd.itemDescription}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.declaredUnitValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.assessedUnitValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.totalDeclaredValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.totalAssessedValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.customDeclaredValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.customAssessedValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.rateCd}%
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.rateSt}%
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.rateRd}%
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.payableCd.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.payableSt.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-2 text-right'>
                      {gd.payableRd.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-[12px] py-1 px-1 sticky right-0 bg-white z-10'>
                      <div className='flex'>
                        <button
                          type='button'
                          onClick={() => handleEditGD(index)}
                          className='p-1 rounded hover:bg-blue-100 text-blue-500'
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleDeleteGD(index)}
                          className='p-1 rounded hover:bg-red-100 text-red-500'
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ADD / EDIT GD ITEM DIALOG
      ══════════════════════════════════════════ */}
      <Dialog open={isGDDialogOpen} onOpenChange={setIsGDDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader className='pb-2 border-b'>
            <DialogTitle className='text-[14px] font-semibold'>
              {editingGDIndex !== null ? "Edit" : "Add"} GD Item
            </DialogTitle>
            <DialogDescription className='text-[12px]'>
              Enter goods declaration item details below
            </DialogDescription>
          </DialogHeader>

          <div className='py-3 space-y-3'>
            {/* Row 1: basic identifiers */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-3'>
              <DField label='Unit Type'>
                <Input
                  className={tinyInputClass}
                  placeholder='PCS / KGS / MT'
                  value={currentGD.unitType}
                  onChange={(e) =>
                    setCurrentGD({ ...currentGD, unitType: e.target.value })
                  }
                />
              </DField>
              <DField label='Quantity'>
                <Input
                  type='number'
                  className={tinyInputClass}
                  value={currentGD.quantity}
                  onChange={(e) =>
                    setCurrentGD({
                      ...currentGD,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </DField>
              <DField label='CO Code'>
                <Input
                  className={tinyInputClass}
                  placeholder='e.g. China'
                  value={currentGD.cocode}
                  onChange={(e) =>
                    setCurrentGD({ ...currentGD, cocode: e.target.value })
                  }
                />
              </DField>
              <DField label='SRO Number'>
                <Input
                  className={tinyInputClass}
                  value={currentGD.sronumber}
                  onChange={(e) =>
                    setCurrentGD({ ...currentGD, sronumber: e.target.value })
                  }
                />
              </DField>
              <DField label='HS Code'>
                <Input
                  className={`${tinyInputClass} font-mono`}
                  value={currentGD.hscode}
                  onChange={(e) =>
                    setCurrentGD({ ...currentGD, hscode: e.target.value })
                  }
                />
              </DField>
              <DField label='Item Description'>
                <Input
                  className={`${tinyInputClass} col-span-3`}
                  value={currentGD.itemDescription}
                  onChange={(e) =>
                    setCurrentGD({
                      ...currentGD,
                      itemDescription: e.target.value,
                    })
                  }
                />
              </DField>
            </div>

            {/* Row 2: declared / assessed values */}
            <div>
              <span className='text-[11px] font-bold uppercase tracking-widest text-blue-700'>
                Values
              </span>
              <div className='border-t border-blue-200 mt-1 mb-2' />
              <div className='grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3'>
                <DField label='Declared Unit Value'>
                  <Input
                    type='number'
                    step='0.01'
                    className={tinyInputClass}
                    value={currentGD.declaredUnitValue}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        declaredUnitValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </DField>
                <DField label='Assessed Unit Value'>
                  <Input
                    type='number'
                    step='0.01'
                    className={tinyInputClass}
                    value={currentGD.assessedUnitValue}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        assessedUnitValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </DField>
                <DField label='Total Declared Value'>
                  <Input
                    type='number'
                    step='0.01'
                    className={tinyInputClass}
                    value={currentGD.totalDeclaredValue}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        totalDeclaredValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </DField>
                <DField label='Total Assessed Value'>
                  <Input
                    type='number'
                    step='0.01'
                    className={tinyInputClass}
                    value={currentGD.totalAssessedValue}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        totalAssessedValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </DField>
                <DField label='Custom Declared (PKR)'>
                  <Input
                    type='number'
                    step='0.01'
                    className={tinyInputClass}
                    value={currentGD.customDeclaredValue}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        customDeclaredValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </DField>
                <DField label='Custom Assessed (PKR)'>
                  <Input
                    type='number'
                    step='0.01'
                    className={tinyInputClass}
                    value={currentGD.customAssessedValue}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        customAssessedValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </DField>
              </div>
            </div>

            {/* Row 3: tax rates — 5 in one line */}
            <div>
              <span className='text-[11px] font-bold uppercase tracking-widest text-blue-700'>
                Tax Rates (%)
              </span>
              <div className='border-t border-blue-200 mt-1 mb-2' />
              <div className='grid grid-cols-5 gap-x-3 gap-y-3'>
                {[
                  { label: "CD %", key: "rateCd" },
                  { label: "ST %", key: "rateSt" },
                  { label: "RD %", key: "rateRd" },
                  { label: "AST %", key: "rateAsd" },
                  { label: "IT %", key: "rateIt" },
                ].map(({ label, key }) => (
                  <DField key={key} label={label}>
                    <Input
                      type='number'
                      step='0.01'
                      className={tinyInputClass}
                      value={currentGD[key]}
                      onChange={(e) =>
                        setCurrentGD({
                          ...currentGD,
                          [key]: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </DField>
                ))}
              </div>
            </div>

            {/* Row 4: payable amounts — 5 in one line */}
            <div>
              <span className='text-[11px] font-bold uppercase tracking-widest text-blue-700'>
                Payable Amounts (PKR)
              </span>
              <div className='border-t border-blue-200 mt-1 mb-2' />
              <div className='grid grid-cols-5 gap-x-3 gap-y-3'>
                {[
                  { label: "Pay. CD", key: "payableCd" },
                  { label: "Pay. ST", key: "payableSt" },
                  { label: "Pay. RD", key: "payableRd" },
                  { label: "Pay. AST", key: "payableAsd" },
                  { label: "Pay. IT", key: "payableIt" },
                ].map(({ label, key }) => (
                  <DField key={key} label={label}>
                    <Input
                      type='number'
                      step='0.01'
                      className={tinyInputClass}
                      value={currentGD[key]}
                      onChange={(e) =>
                        setCurrentGD({
                          ...currentGD,
                          [key]: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </DField>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className='pt-3 border-t gap-2'>
            <button
              type='button'
              className='h-8 px-4 text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded'
              onClick={() => setIsGDDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type='button'
              className='h-8 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded'
              onClick={handleSaveGD}
            >
              {editingGDIndex !== null ? "Update" : "Add"} Item
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
