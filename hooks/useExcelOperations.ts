// ============================================
// HOOK: useExcelOperations
// File: @/hooks/useExcelOperations.ts
// ============================================

import { useState } from "react";
import { ExcelUtility } from "@/utils/excel-utility";
import { FieldConfig } from "@/types/master-setup.types";
import readXlsxFile from "read-excel-file";

export function useExcelOperations(
  fieldConfig: FieldConfig[],
  onImport?: (data: any[]) => Promise<void>
) {
  const [isProcessing, setIsProcessing] = useState(false);

  const exportToExcel = async (data: any[], filename: string) => {
    setIsProcessing(true);
    try {
      await ExcelUtility.exportToExcel(data, fieldConfig, filename);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = async (filename: string) => {
    setIsProcessing(true);
    try {
      await ExcelUtility.downloadSampleTemplate(fieldConfig, filename);
    } catch (error) {
      console.error("Template download failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const importFromExcel = async (file: File) => {
    setIsProcessing(true);
    try {
      const rows = await readXlsxFile(file);
      const headers = rows[0];
      const dataRows = rows.slice(1);

      const parsedData = dataRows.map((row) => {
        const record: any = {};
        fieldConfig
          .filter((f) => f.fieldName !== "Id" && f.isdisplayed)
          .forEach((field, index) => {
            record[field.fieldName] = row[index];
          });
        return record;
      });

      if (onImport) {
        await onImport(parsedData);
      }

      return parsedData;
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    exportToExcel,
    downloadTemplate,
    importFromExcel,
  };
}
