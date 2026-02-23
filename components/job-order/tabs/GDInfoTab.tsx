import React, { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

  // ✅ NEW: Customizable GD Number prefix (default "KAPS")
  const [gdPrefix, setGdPrefix] = useState<string>("KAPS");

  // ✅ NEW: Separate state for GD serial number (no length limit)
  const [gdSerialNumber, setGdSerialNumber] = useState<string>("1119");

  // ✅ NEW: Controlled state for Type dropdown
  const [selectedType, setSelectedType] = useState<string>("");

  // ✅ NEW: Track if initial data has been loaded (prevents auto-generation on edit)
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // ✅ Sync selectedType with form value on mount or when form value changes
  React.useEffect(() => {
    const currentType = form.watch("gdType");
    if (currentType && currentType !== selectedType) {
      setSelectedType(currentType);
      console.log("Synced type from form:", currentType);
    }
  }, [form.watch("gdType")]);

  // ✅ NEW: Extract prefix and serial number from existing GD Number on mount (Edit mode)
  React.useEffect(() => {
    const existingGDNumber = form.watch("gdnumber");

    if (existingGDNumber && existingGDNumber.includes("-")) {
      // Format: PREFIX-TYPE-SERIAL-DDMMYYYY
      const parts = existingGDNumber.split("-");

      if (parts.length === 4) {
        const prefixFromGD = parts[0]; // Extract prefix (KAPS or custom)
        const serialFromGD = parts[2]; // Extract serial number

        if (prefixFromGD && prefixFromGD !== gdPrefix) {
          console.log("Extracted prefix from GD:", prefixFromGD);
          setGdPrefix(prefixFromGD);
        }

        if (serialFromGD && serialFromGD !== gdSerialNumber) {
          console.log("Extracted serial number from GD:", serialFromGD);
          setGdSerialNumber(serialFromGD);
        }
      }
    }

    // Mark initial load as complete after a short delay
    setTimeout(() => {
      setIsInitialLoad(false);
      console.log("Initial load complete");
    }, 500);
  }, []); // Run only once on mount

  // ✅ NEW: Extract prefix, type and serial number from GD Number in edit mode
  React.useEffect(() => {
    const gdNumber = form.watch("gdnumber");

    if (gdNumber && gdNumber.includes("-")) {
      // Parse format: PREFIX-TYPE-SERIAL-DDMMYYYY
      const parts = gdNumber.split("-");

      if (parts.length === 4) {
        const extractedPrefix = parts[0]; // Get the PREFIX part
        const extractedType = parts[1]; // Get the TYPE part
        const extractedSerial = parts[2]; // Get the SERIAL part

        console.log("Extracted from GD Number:", {
          prefix: extractedPrefix,
          type: extractedType,
          serial: extractedSerial,
          fullNumber: gdNumber,
        });

        // Only update if different to avoid infinite loops
        if (extractedPrefix && extractedPrefix !== gdPrefix) {
          setGdPrefix(extractedPrefix);
        }

        if (extractedSerial && extractedSerial !== gdSerialNumber) {
          setGdSerialNumber(extractedSerial);
        }

        if (extractedType && extractedType !== selectedType) {
          setSelectedType(extractedType);
          form.setValue("gdType", extractedType);
        }
      }
    }
  }, []); // Run only on mount to extract from existing GD Number

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

  // ✅ Get current date in YYYY-MM-DD format for max date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // ✅ Format GD Number - PREFIX-TYPE-SERIAL-DDMMYYYY
  const formatGDNumber = (
    prefix: string,
    type: string,
    serial: string,
    date: string,
  ): string => {
    if (!prefix || !type || !serial || !date) return "";

    // Clean prefix (remove spaces, convert to uppercase)
    const cleanPrefix = prefix.trim().toUpperCase();

    // Clean serial (remove non-alphanumeric characters)
    const cleanSerial = serial.trim();

    // Convert date from YYYY-MM-DD to DDMMYYYY
    const dateParts = date.split("-");
    if (dateParts.length !== 3) return "";

    const formattedDate = `${dateParts[2]}${dateParts[1]}${dateParts[0]}`; // DDMMYYYY

    return `${cleanPrefix}-${type}-${cleanSerial}-${formattedDate}`;
  };

  // ✅ Auto-generate GD Number when prefix, type, serial, or date changes
  // But only AFTER initial load is complete (prevents overwriting in edit mode)
  React.useEffect(() => {
    // Skip auto-generation during initial load
    if (isInitialLoad) {
      console.log("Skipping auto-generation: initial load in progress");
      return;
    }

    const gdDate = form.watch("gddate");
    const existingGDNumber = form.watch("gdnumber");

    // Only auto-generate if we have all required fields
    if (gdPrefix && selectedType && gdSerialNumber && gdDate) {
      const newGDNumber = formatGDNumber(
        gdPrefix,
        selectedType,
        gdSerialNumber,
        gdDate,
      );

      // Only update if different
      if (newGDNumber && newGDNumber !== existingGDNumber) {
        console.log("Auto-generating GD Number:", newGDNumber);
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

        {/* ✅ IMPROVED: Show auto-generated GD Number at top */}
        {form.watch("gdnumber") && (
          <Alert className='mb-4 bg-green-50 border-green-200'>
            <Info className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-sm text-green-800'>
              <strong>Generated GD Number:</strong>{" "}
              <span className='font-mono text-lg font-bold'>
                {form.watch("gdnumber")}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ NEW: Updated info about format with customizable prefix */}
        <Alert className='mb-4 bg-blue-50 border-blue-200'>
          <Info className='h-4 w-4 text-blue-600' />
          <AlertDescription className='text-sm text-blue-800'>
            <strong>GD Number Format:</strong> PREFIX-TYPE-SERIAL-DDMMYYYY
            <br />
            <span className='text-xs'>
              Enter your prefix (default: KAPS), select Type and Date, then
              enter the serial number (any length).
            </span>
          </AlertDescription>
        </Alert>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* ✅ NEW: Row 1 - GD Number Components */}
          {/* ✅ NEW: Prefix Input (User can change from KAPS) */}
          <div className='space-y-2'>
            <Label htmlFor='gdPrefix'>
              GD Prefix <span className='text-red-500'>*</span>
              <span className='text-xs text-gray-500 ml-1'>
                (e.g., KAPS, KAPT)
              </span>
            </Label>
            <Input
              id='gdPrefix'
              type='text'
              placeholder='KAPS'
              value={gdPrefix}
              onChange={(e) => {
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, ""); // Only letters and numbers
                setGdPrefix(value);
              }}
              className='font-mono text-lg'
              maxLength={10}
            />
            <p className='text-xs text-gray-500'>
              Default: KAPS (customizable)
            </p>
          </div>

          <div className='space-y-2'>
            <Label>
              Type <span className='text-red-500'>*</span>
              <span className='text-xs text-gray-500 ml-1'>
                (HC/IB/EB/TI/SB)
              </span>
            </Label>
            <Select
              value={selectedType || ""}
              onValueChange={(value) => {
                console.log("Type selected:", value);
                setSelectedType(value);
                form.setValue("gdType", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Type' />
              </SelectTrigger>
              <SelectContent position='popper' sideOffset={5}>
                <SelectItem value='HC'>HC - Home Consumption</SelectItem>
                <SelectItem value='IB'>IB - Import Bond</SelectItem>
                <SelectItem value='EB'>EB - Export Bond</SelectItem>
                <SelectItem value='TI'>TI - Temporary Import</SelectItem>
                <SelectItem value='SB'>SB - Supply Bond</SelectItem>
              </SelectContent>
            </Select>
            {!selectedType && (
              <p className='text-xs text-orange-600'>
                ⚠️ Please select a GD Type
              </p>
            )}
            {selectedType && (
              <p className='text-xs text-green-600'>
                ✅ Selected: {selectedType}
              </p>
            )}
          </div>

          {/* ✅ UPDATED: Serial Number Input (No length limit) */}
          <div className='space-y-2'>
            <Label htmlFor='gdSerialNumber'>
              Serial Number <span className='text-red-500'>*</span>
              <span className='text-xs text-gray-500 ml-1'>(any length)</span>
            </Label>
            <Input
              id='gdSerialNumber'
              type='text'
              placeholder='1119'
              value={gdSerialNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, ""); // Only digits
                setGdSerialNumber(value);
              }}
              className='font-mono text-lg'
            />
            <p className='text-xs text-gray-500'>
              Enter serial number (e.g., 1119, 0001, 123456)
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='gddate'>
              GD Date <span className='text-red-500'>*</span>
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

          {/* Row 2: Exchange Rate & Charges */}
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

          <div className='space-y-2'>
            <Label htmlFor='gdcharges'>
              {freightType === "Collect" ? "Freight Charges" : "Other Charges"}
            </Label>
            <Input
              id='gdcharges'
              type='number'
              step='0.01'
              placeholder='0.00'
              {...form.register("gdcharges", { valueAsNumber: true })}
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
                <SelectContent position='popper' sideOffset={5}>
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

      {/* Detail Grid Section - SAME AS BEFORE */}
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

      {/* Add/Edit Dialog - TRUNCATED FOR BREVITY - SAME AS BEFORE */}
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
            {/* All the form fields from before - same code */}
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
                  <Label>AST %</Label>
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
                  <Label>AST</Label>
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
