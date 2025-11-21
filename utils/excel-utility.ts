// ============================================
// 5. EXCEL UTILITY
// File: @/utils/excel-utility.ts
// ============================================

import moment from "moment";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FieldConfig } from "@/types/master-setup.types";

export class ExcelUtility {
  /**
   * Export data to Excel
   */
  static async exportToExcel(
    data: any[],
    config: FieldConfig[],
    filename: string
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Add headers
    const displayedFields = config.filter((f) => f.isdisplayed);
    worksheet.addRow(displayedFields.map((f) => f.displayName));

    // Add data rows
    data.forEach((record) => {
      const row = displayedFields.map((field) => {
        const value = record[field.alias || field.fieldName];

        // Format based on type
        if (field.dataType === "boolean") {
          return value ? "Yes" : "No";
        }
        if (field.dataType === "datetime" || field.displayType === "date") {
          return value ? moment(value).format("DD-MMM-YYYY") : "";
        }
        return value || "";
      });
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filename}.xlsx`);
  }

  /**
   * Generate sample Excel template
   */
  static async downloadSampleTemplate(
    config: FieldConfig[],
    filename: string
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template");

    const displayedFields = config.filter(
      (f) => f.isdisplayed && f.fieldName !== "Id"
    );
    worksheet.addRow(displayedFields.map((f) => f.displayName));

    // Add sample row
    const sampleRow = displayedFields.map((field) => {
      switch (field.dataType) {
        case "boolean":
          return "Yes";
        case "datetime":
        case "date":
          return "2024-01-01";
        case "number":
          return "100";
        default:
          return `Sample ${field.displayName}`;
      }
    });
    worksheet.addRow(sampleRow);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filename}_Template.xlsx`);
  }
}
