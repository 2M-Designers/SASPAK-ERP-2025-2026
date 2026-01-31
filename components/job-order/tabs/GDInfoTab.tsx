import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Info,
} from "lucide-react";
import * as ExcelJS from "exceljs";
import { parseGDOfficialFormat, type GDItem } from "./gdOfficialFormatParser";

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
  const [currentGD, setCurrentGD] = useState<any>({
    id: 0,
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

  // ✅ NEW: Get current date in YYYY-MM-DD format for max date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // ✅ NEW: Format GD Number - KAPS-TYPE-####-DDMMYYYY
  const formatGDNumber = (
    prefix: string,
    type: string,
    serial: string,
    date: string,
  ): string => {
    if (!type || !serial || !date) return "";

    // Convert date from YYYY-MM-DD to DDMMYYYY
    const dateParts = date.split("-");
    if (dateParts.length !== 3) return "";

    const formattedDate = `${dateParts[2]}${dateParts[1]}${dateParts[0]}`; // DDMMYYYY

    return `${prefix}-${type}-${serial}-${formattedDate}`;
  };

  // ✅ NEW: Auto-generate GD Number when type or date changes
  React.useEffect(() => {
    const gdType = form.watch("gdType");
    const gdDate = form.watch("gddate");
    const gdNumber = form.watch("gdnumber");

    // Only auto-generate if we have type and date
    if (gdType && gdDate) {
      // Extract serial number if GD number already exists and follows format
      let serial = "1119"; // Default serial

      if (gdNumber) {
        const parts = gdNumber.split("-");
        if (parts.length === 4) {
          serial = parts[2]; // Keep existing serial
        }
      }

      const newGDNumber = formatGDNumber("KAPS", gdType, serial, gdDate);

      // Only update if different to avoid infinite loop
      if (newGDNumber !== gdNumber) {
        form.setValue("gdnumber", newGDNumber);
      }
    }
  }, [form.watch("gdType"), form.watch("gddate")]);

  // ✅ NEW: Validate GD Number format
  const validateGDNumberFormat = (value: string): boolean => {
    if (!value) return true; // Allow empty

    // Format: KAPS-XX-####-DDMMYYYY
    const pattern = /^[A-Z]{4}-[A-Z]{2}-\d{4}-\d{8}$/;
    return pattern.test(value);
  };

  // Calculate total assessed value from all items
  const calculateTotalAssessedValue = () => {
    return goodsDeclarations.reduce(
      (sum: number, gd: any) => sum + (gd.totalAssessedValue || 0),
      0,
    );
  };

  // Auto-calculate insurance when type is "1percent"
  React.useEffect(() => {
    if (insuranceType === "1percent") {
      const totalAV = calculateTotalAssessedValue();
      const insuranceValue = totalAV * 0.01;
      form.setValue("insurance", insuranceValue.toFixed(2));
    }
  }, [insuranceType, goodsDeclarations, form]);

  // Auto-calculate landing (1% of AV + insurance)
  React.useEffect(() => {
    const totalAV = calculateTotalAssessedValue();
    const insuranceValue = parseFloat(form.watch("insurance") || "0");
    const landingValue = (totalAV + insuranceValue) * 0.01;
    form.setValue("landing", landingValue.toFixed(2));
  }, [goodsDeclarations, form.watch("insurance"), form]);

  // Download Excel Template using exceljs
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
        "Levy ASD",
        "Levy IT",
        "Rate CD (%)",
        "Rate ST (%)",
        "Rate RD (%)",
        "Rate ASD (%)",
        "Rate IT (%)",
        "Payable CD",
        "Payable ST",
        "Payable RD",
        "Payable ASD",
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

      toast({
        title: "Template Downloaded",
        description: "Excel template downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating template:", error);
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
      const jsonData: any[] = [];

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
        "Levy ASD",
        "Levy IT",
        "Rate CD (%)",
        "Rate ST (%)",
        "Rate RD (%)",
        "Rate ASD (%)",
        "Rate IT (%)",
        "Payable CD",
        "Payable ST",
        "Payable RD",
        "Payable ASD",
        "Payable IT",
      ];

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData: any = {};
        headers.forEach((header, index) => {
          const cell = row.getCell(index + 1);
          rowData[header] = cell.value;
        });
        jsonData.push(rowData);
      });

      const mappedData = jsonData.map((row: any, index: number) => ({
        id: -(Math.floor(Date.now() / 1000) + index),
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
        levyAsd: parseFloat(row["Levy ASD"]) || 0,
        levyIt: parseFloat(row["Levy IT"]) || 0,
        rateCd: parseFloat(row["Rate CD (%)"]) || 0,
        rateSt: parseFloat(row["Rate ST (%)"]) || 0,
        rateRd: parseFloat(row["Rate RD (%)"]) || 0,
        rateAsd: parseFloat(row["Rate ASD (%)"]) || 0,
        rateIt: parseFloat(row["Rate IT (%)"]) || 0,
        payableCd: parseFloat(row["Payable CD"]) || 0,
        payableSt: parseFloat(row["Payable ST"]) || 0,
        payableRd: parseFloat(row["Payable RD"]) || 0,
        payableAsd: parseFloat(row["Payable ASD"]) || 0,
        payableIt: parseFloat(row["Payable IT"]) || 0,
        version: 0,
      }));

      setGoodsDeclarations([...goodsDeclarations, ...mappedData]);

      toast({
        title: "Success",
        description: `${mappedData.length} items imported successfully`,
      });
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to parse Excel file. Please check the format.",
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
        id: -(Math.floor(Date.now() / 1000) + index),
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
        description: `${mappedData.length} items imported from official GD format`,
      });
    } catch (error: any) {
      console.error("Error parsing official GD:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to parse GD file. Please check the format.",
      });
    }

    e.target.value = "";
  };

  const handleAddGD = () => {
    setCurrentGD({
      id: 0,
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
    if (confirm("Are you sure you want to delete this item?")) {
      setGoodsDeclarations(
        goodsDeclarations.filter((_: any, i: number) => i !== index),
      );
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    }
  };

  return (
    <TabsContent value='gd' className='space-y-4'>
      {/* Master Fields Section */}
      <div className='bg-white p-6 rounded-lg border'>
        <h3 className='text-lg font-semibold mb-4'>GD Master Information</h3>

        {/* ✅ NEW: GD Number Format Info */}
        <Alert className='mb-4 bg-blue-50 border-blue-200'>
          <Info className='h-4 w-4 text-blue-600' />
          <AlertDescription className='text-sm text-blue-800'>
            <strong>GD Number Format:</strong> KAPS-TYPE-####-DDMMYYYY
            <br />
            <span className='text-xs'>
              Example: KAPS-HC-1119-20122026 (Auto-generated from Type and Date)
            </span>
          </AlertDescription>
        </Alert>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Row 1 */}
          <div className='space-y-2'>
            <Label htmlFor='gdType'>
              Type{" "}
              <span className='text-xs text-gray-500'>(HC/IB/EB/TI/SB)</span>
            </Label>
            <Select
              value={form.watch("gdType") || ""}
              onValueChange={(value) => form.setValue("gdType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='HC'>HC - Home Consumption</SelectItem>
                <SelectItem value='IB'>IB - Import Bond</SelectItem>
                <SelectItem value='EB'>EB - Export Bond</SelectItem>
                <SelectItem value='TI'>TI - Temporary Import</SelectItem>
                <SelectItem value='SB'>SB - Supply Bond</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='gddate'>
              GD Date
              <span className='text-xs text-gray-500 ml-1'>
                (No future dates)
              </span>
            </Label>
            <Input
              id='gddate'
              type='date'
              max={getTodayDate()}
              {...form.register("gddate")}
            />
            <p className='text-xs text-gray-500'>
              Maximum date: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='gdnumber'>
              GD Number
              <span className='text-xs text-gray-500 ml-1'>
                (Auto-generated)
              </span>
            </Label>
            <Input
              id='gdnumber'
              type='text'
              placeholder='KAPS-HC-1119-20122026'
              className={
                form.watch("gdnumber") &&
                !validateGDNumberFormat(form.watch("gdnumber"))
                  ? "border-red-500"
                  : ""
              }
              {...form.register("gdnumber")}
            />
            {form.watch("gdnumber") &&
              !validateGDNumberFormat(form.watch("gdnumber")) && (
                <p className='text-xs text-red-500'>
                  Invalid format. Expected: KAPS-XX-####-DDMMYYYY
                </p>
              )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='jobInvoiceExchRate'>
              Exchange Rate{" "}
              <span className='text-xs text-gray-500'>(4 decimals)</span>
            </Label>
            <Input
              id='jobInvoiceExchRate'
              type='number'
              step='0.0001'
              placeholder='e.g., 282.2500'
              {...form.register("jobInvoiceExchRate", { valueAsNumber: true })}
            />
          </div>

          {/* Row 4: Financial Calculations */}
          <div className='space-y-2'>
            <Label htmlFor='freightCharges'>
              {freightType === "Collect" ? "Freight Charges" : "Other Charges"}
            </Label>
            <Input
              id='freightCharges'
              type='number'
              step='0.01'
              placeholder='0.00'
              {...form.register("freightCharges", { valueAsNumber: true })}
            />
            <p className='text-xs text-gray-500'>
              {freightType === "Collect"
                ? "Freight is Collect - enter freight charges"
                : "Enter other charges"}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='insurance'>Insurance</Label>
            <div className='flex gap-2'>
              <Select
                value={insuranceType}
                onValueChange={(value) => {
                  setInsuranceType(value as "1percent" | "Rs");
                  if (value === "1percent") {
                    const totalAV = calculateTotalAssessedValue();
                    form.setValue("insurance", (totalAV * 0.01).toFixed(2));
                  }
                }}
              >
                <SelectTrigger className='w-[120px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1percent'>1% of AV</SelectItem>
                  <SelectItem value='Rs'>Rs.</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id='insurance'
                type='number'
                step='0.01'
                placeholder='0.00'
                disabled={insuranceType === "1percent"}
                className={insuranceType === "1percent" ? "bg-gray-100" : ""}
                {...form.register("insurance")}
              />
            </div>
            {insuranceType === "1percent" && (
              <p className='text-xs text-green-600'>
                Auto-calculated: 1% of Total AV ($
                {calculateTotalAssessedValue().toFixed(2)})
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='landing'>Landing (1% of AV + Insurance)</Label>
            <Input
              id='landing'
              type='number'
              step='0.01'
              placeholder='0.00'
              disabled
              className='bg-gray-100'
              {...form.register("landing")}
            />
            <p className='text-xs text-blue-600'>Auto-calculated</p>
          </div>
        </div>

        {/* Summary Display */}
        {goodsDeclarations.length > 0 && (
          <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <h4 className='font-semibold text-sm mb-2'>Financial Summary</h4>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
              <div>
                <span className='text-gray-600'>Total Items:</span>{" "}
                <span className='font-semibold'>
                  {goodsDeclarations.length}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Total AV:</span>{" "}
                <span className='font-semibold'>
                  ${calculateTotalAssessedValue().toFixed(2)}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Insurance:</span>{" "}
                <span className='font-semibold'>
                  ${parseFloat(form.watch("insurance") || "0").toFixed(2)}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Landing:</span>{" "}
                <span className='font-semibold'>
                  ${parseFloat(form.watch("landing") || "0").toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Grid Section */}
      <div className='bg-white p-6 rounded-lg border'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>GD Detail Items</h3>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={downloadTemplate}
            >
              <Download className='h-4 w-4 mr-2' />
              Download Template
            </Button>

            <label htmlFor='excel-upload'>
              <Button type='button' variant='outline' size='sm' asChild>
                <span>
                  <Upload className='h-4 w-4 mr-2' />
                  Upload Template
                </span>
              </Button>
            </label>
            <input
              id='excel-upload'
              type='file'
              accept='.xlsx,.xls'
              className='hidden'
              onChange={handleFileUpload}
            />

            <label htmlFor='official-gd-upload'>
              <Button type='button' variant='outline' size='sm' asChild>
                <span>
                  <FileText className='h-4 w-4 mr-2' />
                  Import GD File
                </span>
              </Button>
            </label>
            <input
              id='official-gd-upload'
              type='file'
              accept='.xlsx,.xls'
              className='hidden'
              onChange={handleOfficialGDUpload}
              title='Upload official Pakistan Customs GD format (Fields 37-48)'
            />

            <Button type='button' size='sm' onClick={handleAddGD}>
              <Plus className='h-4 w-4 mr-2' />
              Add Item
            </Button>
          </div>
        </div>

        {/* ✅ IMPROVED: Better scrollbar visibility and wider table */}
        <div className='border rounded-lg overflow-x-auto max-h-[600px] styled-scrollbar'>
          <style jsx>{`
            .styled-scrollbar::-webkit-scrollbar {
              width: 14px;
              height: 14px;
            }
            .styled-scrollbar::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }
            .styled-scrollbar::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 10px;
              border: 3px solid #f1f1f1;
            }
            .styled-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
            .styled-scrollbar::-webkit-scrollbar-corner {
              background: #f1f1f1;
            }
            /* Firefox */
            .styled-scrollbar {
              scrollbar-width: thick;
              scrollbar-color: #888 #f1f1f1;
            }
          `}</style>

          <Table>
            <TableHeader>
              <TableRow className='bg-gray-100'>
                <TableHead className='w-16 sticky left-0 bg-gray-100 z-10'>
                  #
                </TableHead>
                <TableHead className='min-w-[100px]'>Unit Type</TableHead>
                <TableHead className='min-w-[80px] text-right'>Qty</TableHead>
                <TableHead className='min-w-[120px]'>CO Code</TableHead>
                <TableHead className='min-w-[120px]'>SRO No</TableHead>
                <TableHead className='min-w-[120px]'>HS Code</TableHead>
                <TableHead className='min-w-[250px]'>Description</TableHead>
                <TableHead className='min-w-[140px] text-right'>
                  Decl. Unit Value
                </TableHead>
                <TableHead className='min-w-[140px] text-right'>
                  Assd. Unit Value
                </TableHead>
                <TableHead className='min-w-[140px] text-right'>
                  Total Decl.
                </TableHead>
                <TableHead className='min-w-[140px] text-right'>
                  Total Assd.
                </TableHead>
                <TableHead className='min-w-[160px] text-right'>
                  Custom Decl. (PKR)
                </TableHead>
                <TableHead className='min-w-[160px] text-right'>
                  Custom Assd. (PKR)
                </TableHead>
                <TableHead className='min-w-[100px] text-right'>
                  CD Rate %
                </TableHead>
                <TableHead className='min-w-[100px] text-right'>
                  ST Rate %
                </TableHead>
                <TableHead className='min-w-[100px] text-right'>
                  RD Rate %
                </TableHead>
                <TableHead className='min-w-[120px] text-right'>
                  Payable CD
                </TableHead>
                <TableHead className='min-w-[120px] text-right'>
                  Payable ST
                </TableHead>
                <TableHead className='min-w-[120px] text-right'>
                  Payable RD
                </TableHead>
                <TableHead className='w-28 sticky right-0 bg-gray-100 z-10'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goodsDeclarations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={20}
                    className='text-center text-muted-foreground py-8'
                  >
                    No items added. Click Add Item or Upload Excel to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                goodsDeclarations.map((gd: any, index: number) => (
                  <TableRow key={gd.id || index} className='hover:bg-gray-50'>
                    <TableCell className='sticky left-0 bg-white'>
                      {index + 1}
                    </TableCell>
                    <TableCell>{gd.unitType}</TableCell>
                    <TableCell className='text-right'>{gd.quantity}</TableCell>
                    <TableCell>{gd.cocode}</TableCell>
                    <TableCell>{gd.sronumber}</TableCell>
                    <TableCell>{gd.hscode}</TableCell>
                    <TableCell
                      className='max-w-[250px] truncate'
                      title={gd.itemDescription}
                    >
                      {gd.itemDescription}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.declaredUnitValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.assessedUnitValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.totalDeclaredValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.totalAssessedValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.customDeclaredValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.customAssessedValue.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>{gd.rateCd}%</TableCell>
                    <TableCell className='text-right'>{gd.rateSt}%</TableCell>
                    <TableCell className='text-right'>{gd.rateRd}%</TableCell>
                    <TableCell className='text-right'>
                      {gd.payableCd.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.payableSt.toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {gd.payableRd.toFixed(2)}
                    </TableCell>
                    <TableCell className='sticky right-0 bg-white'>
                      <div className='flex gap-1'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditGD(index)}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteGD(index)}
                        >
                          <Trash2 className='h-4 w-4 text-red-500' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {goodsDeclarations.length > 0 && (
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              <div>
                <span className='font-semibold'>Total Items:</span>{" "}
                {goodsDeclarations.length}
              </div>
              <div>
                <span className='font-semibold'>Total Qty:</span>{" "}
                {goodsDeclarations.reduce(
                  (sum: number, gd: any) => sum + gd.quantity,
                  0,
                )}
              </div>
              <div>
                <span className='font-semibold'>Total Assessed Value:</span> $
                {goodsDeclarations
                  .reduce(
                    (sum: number, gd: any) => sum + gd.totalAssessedValue,
                    0,
                  )
                  .toFixed(2)}
              </div>
              <div>
                <span className='font-semibold'>Total Payable (CD+ST+RD):</span>{" "}
                PKR{" "}
                {goodsDeclarations
                  .reduce(
                    (sum: number, gd: any) =>
                      sum + gd.payableCd + gd.payableSt + gd.payableRd,
                    0,
                  )
                  .toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isGDDialogOpen} onOpenChange={setIsGDDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingGDIndex !== null ? "Edit" : "Add"} GD Item
            </DialogTitle>
            <DialogDescription>
              Enter the goods declaration details below
            </DialogDescription>
          </DialogHeader>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Unit Type</Label>
              <Input
                value={currentGD.unitType}
                onChange={(e) =>
                  setCurrentGD({ ...currentGD, unitType: e.target.value })
                }
                placeholder='e.g., PCS, KGS, MT'
              />
            </div>

            <div className='space-y-2'>
              <Label>Quantity</Label>
              <Input
                type='number'
                value={currentGD.quantity}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    quantity: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>CO Code</Label>
              <Input
                value={currentGD.cocode}
                onChange={(e) =>
                  setCurrentGD({ ...currentGD, cocode: e.target.value })
                }
                placeholder='e.g., China'
              />
            </div>

            <div className='space-y-2'>
              <Label>SRO Number</Label>
              <Input
                value={currentGD.sronumber}
                onChange={(e) =>
                  setCurrentGD({ ...currentGD, sronumber: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>HS Code</Label>
              <Input
                value={currentGD.hscode}
                onChange={(e) =>
                  setCurrentGD({ ...currentGD, hscode: e.target.value })
                }
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label>Item Description</Label>
              <Input
                value={currentGD.itemDescription}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    itemDescription: e.target.value,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Declared Unit Value</Label>
              <Input
                type='number'
                step='0.01'
                value={currentGD.declaredUnitValue}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    declaredUnitValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Assessed Unit Value</Label>
              <Input
                type='number'
                step='0.01'
                value={currentGD.assessedUnitValue}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    assessedUnitValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Total Declared Value</Label>
              <Input
                type='number'
                step='0.01'
                value={currentGD.totalDeclaredValue}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    totalDeclaredValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Total Assessed Value</Label>
              <Input
                type='number'
                step='0.01'
                value={currentGD.totalAssessedValue}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    totalAssessedValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Custom Declared Value (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                value={currentGD.customDeclaredValue}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    customDeclaredValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Custom Assessed Value (PKR)</Label>
              <Input
                type='number'
                step='0.01'
                value={currentGD.customAssessedValue}
                onChange={(e) =>
                  setCurrentGD({
                    ...currentGD,
                    customAssessedValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className='md:col-span-2 mt-4'>
              <h4 className='font-semibold mb-2'>Tax Rates (%)</h4>
              <div className='grid grid-cols-5 gap-2'>
                <div className='space-y-2'>
                  <Label>CD %</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.rateCd}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        rateCd: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>ST %</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.rateSt}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        rateSt: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>RD %</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.rateRd}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        rateRd: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>ASD %</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.rateAsd}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        rateAsd: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>IT %</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.rateIt}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        rateIt: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className='md:col-span-2 mt-4'>
              <h4 className='font-semibold mb-2'>Payable Amounts (PKR)</h4>
              <div className='grid grid-cols-5 gap-2'>
                <div className='space-y-2'>
                  <Label>CD</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.payableCd}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        payableCd: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>ST</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.payableSt}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        payableSt: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>RD</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.payableRd}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        payableRd: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>ASD</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.payableAsd}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        payableAsd: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>IT</Label>
                  <Input
                    type='number'
                    step='0.01'
                    value={currentGD.payableIt}
                    onChange={(e) =>
                      setCurrentGD({
                        ...currentGD,
                        payableIt: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsGDDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type='button' onClick={handleSaveGD}>
              {editingGDIndex !== null ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
