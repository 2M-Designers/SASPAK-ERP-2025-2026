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
import { Upload, Download, Plus, Pencil, Trash2, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { parseGDOfficialFormat, type GDItem } from "./gdOfficialFormatParser";

export default function GDInfoTab({
  form,
  goodsDeclarations,
  setGoodsDeclarations,
  toast,
  freightType, // Add freightType prop to check if "Collect" from Shipping Tab
}: any) {
  const [isGDDialogOpen, setIsGDDialogOpen] = useState(false);
  const [editingGDIndex, setEditingGDIndex] = useState<number | null>(null);
  const [insuranceType, setInsuranceType] = useState<"1percent" | "custom">(
    "custom",
  );
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

  // Download Excel Template
  const downloadTemplate = () => {
    const template = [
      {
        "Item No": 1,
        "Unit Type": "PCS",
        Quantity: 100,
        "CO Code": "China",
        "SRO Number": "SRO-001",
        "HS Code": "8471.30",
        "Item Description": "Sample item description",
        "Declared Unit Value": 100.0,
        "Assessed Unit Value": 100.0,
        "Total Declared Value": 10000.0,
        "Total Assessed Value": 10000.0,
        "Custom Declared Value (PKR)": 2822500.0,
        "Custom Assessed Value (PKR)": 2822500.0,
        "Levy CD": 0,
        "Levy ST": 0,
        "Levy RD": 0,
        "Levy ASD": 0,
        "Levy IT": 0,
        "Rate CD (%)": 3.75,
        "Rate ST (%)": 18.0,
        "Rate RD (%)": 5.0,
        "Rate ASD (%)": 3.0,
        "Rate IT (%)": 6.0,
        "Payable CD": 105843.75,
        "Payable ST": 508185.0,
        "Payable RD": 141233.0,
        "Payable ASD": 84872.0,
        "Payable IT": 113431.0,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GD Template");

    // Set column widths
    ws["!cols"] = [
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, "GD_Detail_Template.xlsx");

    toast({
      title: "Template Downloaded",
      description: "Excel template downloaded successfully",
    });
  };

  // Upload Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const mappedData = jsonData.map((row: any, index: number) => ({
          id: -(Math.floor(Date.now() / 1000) + index), // Int32-safe negative ID
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
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input
  };

  // Upload Official GD Format (Fields 37-48)
  const handleOfficialGDUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const gdItems = await parseGDOfficialFormat(file);

      // Map GDItem to our internal format
      const mappedData = gdItems.map((item: GDItem, index: number) => ({
        id: -(Math.floor(Date.now() / 1000) + index), // Int32-safe negative ID
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

    e.target.value = ""; // Reset input
  };

  // Add/Edit GD Item
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
    // Calculate totals if not provided
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
      // Update existing
      const updated = [...goodsDeclarations];
      updated[editingGDIndex] = updatedGD;
      setGoodsDeclarations(updated);
    } else {
      // Add new with negative ID
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
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Row 1 */}
          <div className='space-y-2'>
            <Label htmlFor='gdnumber'>GD Number</Label>
            <Input
              id='gdnumber'
              type='text'
              placeholder='Enter GD Number'
              {...form.register("gdnumber")}
            />
          </div>

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
            <Label htmlFor='gddate'>GD Date</Label>
            <Input id='gddate' type='date' {...form.register("gddate")} />
          </div>

          {/* Row 2 */}
          <div className='space-y-2'>
            <Label htmlFor='gdclearedUs'>GD Cleared U/S</Label>
            <Input
              id='gdclearedUs'
              type='text'
              placeholder='e.g., 80/81 etc'
              {...form.register("gdclearedUs")}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='gdcharges'>GD Charges (PKR)</Label>
            <Input
              id='gdcharges'
              type='number'
              step='0.01'
              placeholder='0.00'
              {...form.register("gdcharges", { valueAsNumber: true })}
            />
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

          {/* Row 3: Security */}
          <div className='space-y-2'>
            <Label htmlFor='gdsecurityType'>Security Type</Label>
            <Select
              value={form.watch("gdsecurityType") || ""}
              onValueChange={(value) => form.setValue("gdsecurityType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Security Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Bank Guarantee'>Bank Guarantee</SelectItem>
                <SelectItem value='Cash Deposit'>Cash Deposit</SelectItem>
                <SelectItem value='Bond'>Bond</SelectItem>
                <SelectItem value='None'>None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='gdsecurityValue'>Security Value</Label>
            <Input
              id='gdsecurityValue'
              type='number'
              step='0.01'
              placeholder='0.00'
              {...form.register("gdsecurityValue")}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='gdsecurityExpiryDate'>Security Expiry Date</Label>
            <Input
              id='gdsecurityExpiryDate'
              type='date'
              {...form.register("gdsecurityExpiryDate")}
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
                  setInsuranceType(value as "1percent" | "custom");
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
                  <SelectItem value='custom'>Rs.</SelectItem>
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

          {/* Row 5: PSQCA */}
          <div className='space-y-2'>
            <Label htmlFor='psqcaSamples'>PSQCA Samples</Label>
            <Select
              value={form.watch("psqcaSamples") || ""}
              onValueChange={(value) => form.setValue("psqcaSamples", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Submitted'>Submitted</SelectItem>
                <SelectItem value='Not Required'>Not Required</SelectItem>
                <SelectItem value='Pending'>Pending</SelectItem>
              </SelectContent>
            </Select>
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

            {/* Template-based Upload */}
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

            {/* Official GD Format Upload */}
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

        {/* Table */}
        <div className='border rounded-lg overflow-auto max-h-96'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-16'>#</TableHead>
                <TableHead>Unit Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>CO Code</TableHead>
                <TableHead>SRO No</TableHead>
                <TableHead>HS Code</TableHead>
                <TableHead className='min-w-[200px]'>Description</TableHead>
                <TableHead className='text-right'>Decl. Unit Value</TableHead>
                <TableHead className='text-right'>Assd. Unit Value</TableHead>
                <TableHead className='text-right'>Total Decl.</TableHead>
                <TableHead className='text-right'>Total Assd.</TableHead>
                <TableHead className='text-right'>Custom Decl. (PKR)</TableHead>
                <TableHead className='text-right'>Custom Assd. (PKR)</TableHead>
                <TableHead className='text-right'>CD Rate %</TableHead>
                <TableHead className='text-right'>ST Rate %</TableHead>
                <TableHead className='text-right'>RD Rate %</TableHead>
                <TableHead className='text-right'>Payable CD</TableHead>
                <TableHead className='text-right'>Payable ST</TableHead>
                <TableHead className='text-right'>Payable RD</TableHead>
                <TableHead className='w-24'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goodsDeclarations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={20}
                    className='text-center text-muted-foreground'
                  >
                    No items added. Click Add Item or Upload Excel to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                goodsDeclarations.map((gd: any, index: number) => (
                  <TableRow key={gd.id || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{gd.unitType}</TableCell>
                    <TableCell>{gd.quantity}</TableCell>
                    <TableCell>{gd.cocode}</TableCell>
                    <TableCell>{gd.sronumber}</TableCell>
                    <TableCell>{gd.hscode}</TableCell>
                    <TableCell
                      className='max-w-[200px] truncate'
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
                    <TableCell>
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
            {/* Basic Info */}
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

            {/* Values */}
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

            {/* Rates */}
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

            {/* Payables */}
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
