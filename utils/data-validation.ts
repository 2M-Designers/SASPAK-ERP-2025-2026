// ============================================
// UTILITY: Data Validation
// File: @/utils/data-validation.ts
// ============================================

import { FieldConfig } from "@/types/master-setup.types";

export class DataValidator {
  static validateRecord(
    record: any,
    fieldConfig: FieldConfig[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    fieldConfig
      .filter((f) => f.isselected && f.fieldName !== "Id")
      .forEach((field) => {
        const value = record[field.fieldName];

        if (
          field.isselected &&
          (value === null || value === undefined || value === "")
        ) {
          errors.push(`${field.displayName} is required`);
          return;
        }

        // Type validation
        switch (field.dataType) {
          case "number":
          case "int":
            if (isNaN(Number(value))) {
              errors.push(`${field.displayName} must be a number`);
            }
            break;
          case "boolean":
            if (typeof value !== "boolean") {
              errors.push(`${field.displayName} must be a boolean`);
            }
            break;
          case "datetime":
          case "date":
            if (!this.isValidDate(value)) {
              errors.push(`${field.displayName} must be a valid date`);
            }
            break;
        }
      });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static validateBulkImport(
    records: any[],
    fieldConfig: FieldConfig[]
  ): {
    validRecords: any[];
    invalidRecords: { row: number; record: any; errors: string[] }[];
  } {
    const validRecords: any[] = [];
    const invalidRecords: { row: number; record: any; errors: string[] }[] = [];

    records.forEach((record, index) => {
      const validation = this.validateRecord(record, fieldConfig);

      if (validation.isValid) {
        validRecords.push(record);
      } else {
        invalidRecords.push({
          row: index + 2, // +2 because row 1 is header, index starts at 0
          record,
          errors: validation.errors,
        });
      }
    });

    return { validRecords, invalidRecords };
  }
}
