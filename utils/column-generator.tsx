// ============================================
// COLUMN GENERATOR UTILITY (IMPROVED VERSION)
// File: @/utils/column-generator.ts
// ============================================

import React from "react";
import { FiTrash2, FiImage } from "react-icons/fi";
import { Edit } from "lucide-react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { FieldConfig } from "@/types/master-setup.types";
import moment from "moment";
import { UiUtils } from "@/utils/ui-utils";

// Define a generic row type for better type safety
interface TableRow {
  [key: string]: any;
}

export class ColumnGenerator {
  // Enhanced status field patterns for better detection
  private static readonly STATUS_FIELD_PATTERNS = [
    "active",
    "status",
    "enabled",
    "disabled",
    "isactive",
    "isenabled",
    "is_active",
    "is_enabled",
    "activeflag",
    "statusflag",
    "taketive",
    "isaktive",
    "aktive",
    "state",
    "isvalid",
    "valid",
    "approved",
  ];

  private static readonly BOOLEAN_DATA_TYPES = ["boolean", "bool", "bit"];
  private static readonly NUMERIC_DATA_TYPES = [
    "int",
    "decimal",
    "number",
    "float",
    "double",
  ];
  private static readonly DATE_DATA_TYPES = ["date", "datetime", "timestamp"];

  /**
   * Generate table columns from field config
   */
  static generateColumns(
    config: any,
    actions: {
      onEdit?: (row: any) => void;
      onDelete?: (row: any) => void;
      onImageView?: (imageUrl: string) => void;
    } = {}
  ): ColumnDef<TableRow>[] {
    console.log("🔄 Generating columns from config:", config);

    const columns: ColumnDef<TableRow>[] = [];

    // Validate config is an array
    if (!Array.isArray(config)) {
      console.error("ColumnGenerator: config is not an array", config);
      return this.getDefaultColumns(actions);
    }

    // Add Serial Number first
    columns.push({
      id: "row",
      header: "S.No",
      cell: ({ row }: { row: Row<TableRow> }) => (
        <div className='text-center'>{parseInt(row.id) + 1}</div>
      ),
      enableColumnFilter: false,
      size: 80,
    });

    // Generate columns from config
    const displayFields = config.filter(
      (field: FieldConfig) => field.isdisplayed
    );

    console.log(`📊 Display fields count: ${displayFields.length}`);

    displayFields.forEach((field: FieldConfig) => {
      const accessorKey = field.alias || field.fieldName;

      console.log(`🔧 Creating column for: ${field.fieldName}`, {
        accessorKey,
        dataType: field.dataType,
        displayName: field.displayName,
        isStatusField: this.shouldShowStatusBadge(field),
      });

      const columnDef: ColumnDef<TableRow> = {
        accessorKey: accessorKey,
        header: field.displayName || field.fieldName,
        cell: ({ row }: { row: Row<TableRow> }) => {
          const value = row.getValue(accessorKey);
          return this.formatCellValue(value, field);
        },
        enableColumnFilter: false,
        size: this.getColumnSize(field),
      };

      columns.push(columnDef);
    });

    // Add Action Columns if provided
    if (actions.onEdit || actions.onDelete) {
      columns.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: Row<TableRow> }) => (
          <div className='flex gap-2'>
            {actions.onEdit && (
              <Edit
                size={18}
                className='cursor-pointer text-blue-600 hover:text-blue-800 transition-colors'
                onClick={() => actions.onEdit?.(row.original)}
              />
            )}
            {actions.onDelete && (
              <FiTrash2
                size={18}
                className='cursor-pointer text-red-500 hover:text-red-700 transition-colors'
                onClick={() => actions.onDelete?.(row.original)}
              />
            )}
          </div>
        ),
        enableColumnFilter: false,
        size: actions.onEdit && actions.onDelete ? 120 : 80,
      });
    }

    console.log(`✅ Generated ${columns.length} columns total`);
    return columns;
  }

  /**
   * Format cell value based on field type - IMPROVED VERSION
   */
  private static formatCellValue(
    value: any,
    field: FieldConfig
  ): React.ReactNode {
    console.log(
      `🎨 Formatting cell - Field: ${field.fieldName}, Value:`,
      value,
      "Type:",
      typeof value
    );

    if (value === null || value === undefined || value === "") {
      return <span className='text-gray-400'>-</span>;
    }

    // PRIMARY FIX: Use enhanced status detection
    if (this.shouldShowStatusBadge(field)) {
      console.log(`✅ Showing status badge for: ${field.fieldName}`, value);
      try {
        const statusValue = this.parseBoolean(value);
        return UiUtils.renderStatusBadge(statusValue);
      } catch (error) {
        console.error(
          `❌ Error rendering status badge for ${field.fieldName}:`,
          error
        );
        return this.formatStringValue(value); // Fallback to string
      }
    }

    // Handle date/datetime values
    if (this.isDateField(field)) {
      return this.formatDateValue(value);
    }

    // Handle numeric values
    if (this.isNumericField(field)) {
      return this.formatNumericValue(value, field);
    }

    // Handle image fields
    if (this.isImageField(field)) {
      return this.formatImageValue(value, field);
    }

    // Default string formatting
    return this.formatStringValue(value);
  }

  /**
   * ENHANCED: Check if field should show status badge
   */
  // Replace the shouldShowStatusBadge method with this simpler version:
  private static shouldShowStatusBadge(field: FieldConfig): boolean {
    // Direct and simple detection
    const isBoolType =
      field.dataType === "bool" || field.dataType === "boolean";
    const isStatusField =
      field.fieldName.toLowerCase().includes("active") ||
      field.fieldName.toLowerCase().includes("status");

    return isBoolType || isStatusField;
  }

  /**
   * Check if field is date type
   */
  private static isDateField(field: FieldConfig): boolean {
    return (
      this.DATE_DATA_TYPES.includes(field.dataType?.toLowerCase() || "") ||
      field.displayType === "date" ||
      field.displayType === "datetime" ||
      field.fieldName.toLowerCase().includes("date") ||
      field.fieldName.toLowerCase().includes("time")
    );
  }

  /**
   * Check if field is numeric type
   */
  private static isNumericField(field: FieldConfig): boolean {
    return (
      this.NUMERIC_DATA_TYPES.includes(field.dataType?.toLowerCase() || "") ||
      field.displayType === "number"
    );
  }

  /**
   * Check if field is image type
   */
  private static isImageField(field: FieldConfig): boolean {
    return (
      field.displayType === "image" ||
      field.fieldName.toLowerCase().includes("image") ||
      field.fieldName.toLowerCase().includes("photo") ||
      field.fieldName.toLowerCase().includes("avatar") ||
      field.fieldName.toLowerCase().includes("picture")
    );
  }

  /**
   * IMPROVED: Parse boolean value from various formats
   */
  private static parseBoolean(value: any): boolean {
    console.log(`🔧 Parsing boolean from:`, value, "Type:", typeof value);

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const str = value.toLowerCase().trim();
      const trueValues = [
        "true",
        "1",
        "yes",
        "active",
        "enabled",
        "on",
        "y",
        "t",
      ];
      const falseValues = [
        "false",
        "0",
        "no",
        "inactive",
        "disabled",
        "off",
        "n",
        "f",
      ];

      if (trueValues.includes(str)) return true;
      if (falseValues.includes(str)) return false;

      // Try to parse as number
      const num = Number(str);
      if (!isNaN(num)) return num !== 0;
    }

    // Final fallback
    const result = Boolean(value);
    console.log(`🔧 Boolean parse result:`, result);
    return result;
  }

  /**
   * Format date value
   */
  private static formatDateValue(value: any): React.ReactNode {
    try {
      const date = moment(value);
      if (date.isValid()) {
        return (
          <span className='text-sm text-gray-700'>
            {date.format("DD-MMM-YYYY")}
          </span>
        );
      }
      return <span className='text-gray-400'>Invalid Date</span>;
    } catch {
      return <span className='text-gray-400'>Invalid Date</span>;
    }
  }

  /**
   * Format numeric value
   */
  private static formatNumericValue(
    value: any,
    field: FieldConfig
  ): React.ReactNode {
    const num = Number(value);
    if (isNaN(num)) {
      return <span className='text-gray-400'>-</span>;
    }

    // Format based on data type
    if (field.dataType === "decimal" || field.dataType === "float") {
      return (
        <span className='text-sm font-mono text-blue-700'>
          {num.toFixed(2)}
        </span>
      );
    }

    return (
      <span className='text-sm font-mono text-green-700'>
        {num.toLocaleString()}
      </span>
    );
  }

  /**
   * Format image value
   */
  private static formatImageValue(
    value: any,
    field: FieldConfig
  ): React.ReactNode {
    if (!value || typeof value !== "string") {
      return <span className='text-gray-400'>No Image</span>;
    }

    return (
      <div className='flex items-center gap-2'>
        <img
          src={value}
          alt={field.displayName}
          className='w-8 h-8 rounded-full object-cover'
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <FiImage className='text-gray-400' size={16} />
      </div>
    );
  }

  /**
   * Format string value
   */
  private static formatStringValue(value: any): React.ReactNode {
    const stringValue = String(value);

    // Truncate long strings
    if (stringValue.length > 50) {
      return (
        <span className='text-sm text-gray-700' title={stringValue}>
          {stringValue.substring(0, 47)}...
        </span>
      );
    }

    return <span className='text-sm text-gray-700'>{stringValue}</span>;
  }

  /**
   * Get appropriate column size based on field type
   */
  private static getColumnSize(field: FieldConfig): number {
    const baseSizes: Record<string, number> = {
      boolean: 120,
      bool: 120,
      bit: 120,
      int: 120,
      decimal: 140,
      number: 120,
      float: 140,
      double: 140,
      date: 150,
      datetime: 180,
      timestamp: 180,
      string: 200,
      default: 180,
    };

    // Special handling for status fields
    if (this.shouldShowStatusBadge(field)) {
      return 120;
    }

    // Special handling for image fields
    if (this.isImageField(field)) {
      return 100;
    }

    return baseSizes[field.dataType?.toLowerCase() || ""] || baseSizes.default;
  }

  /**
   * Fallback default columns when config is invalid
   */
  private static getDefaultColumns(actions: {
    onEdit?: (row: TableRow) => void;
    onDelete?: (row: TableRow) => void;
    onImageView?: (imageUrl: string) => void;
  }): ColumnDef<TableRow>[] {
    console.log("🔄 Using default columns as fallback");

    const columns: ColumnDef<TableRow>[] = [
      {
        id: "row",
        header: "S.No",
        cell: ({ row }: { row: Row<TableRow> }) => (
          <div className='text-center'>{parseInt(row.id) + 1}</div>
        ),
        enableColumnFilter: false,
        size: 80,
      },
      {
        accessorKey: "id",
        header: "ID",
        enableColumnFilter: false,
        size: 100,
      },
      {
        accessorKey: "name",
        header: "Name",
        enableColumnFilter: false,
        size: 200,
      },
    ];

    // Add actions column if any actions are provided
    if (actions.onEdit || actions.onDelete) {
      columns.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: Row<TableRow> }) => (
          <div className='flex gap-2'>
            {actions.onEdit && (
              <Edit
                size={18}
                className='cursor-pointer text-blue-600 hover:text-blue-800 transition-colors'
                onClick={() => actions.onEdit?.(row.original)}
              />
            )}
            {actions.onDelete && (
              <FiTrash2
                size={18}
                className='cursor-pointer text-red-500 hover:text-red-700 transition-colors'
                onClick={() => actions.onDelete?.(row.original)}
              />
            )}
          </div>
        ),
        enableColumnFilter: false,
        size: actions.onEdit && actions.onDelete ? 120 : 80,
      });
    }

    return columns;
  }

  /**
   * Safe method to generate columns with error handling
   */
  static safeGenerateColumns(
    config: any,
    actions: {
      onEdit?: (row: TableRow) => void;
      onDelete?: (row: TableRow) => void;
      onImageView?: (imageUrl: string) => void;
    } = {}
  ): ColumnDef<TableRow>[] {
    try {
      return this.generateColumns(config, actions);
    } catch (error) {
      console.error("Error generating columns:", error);
      return this.getDefaultColumns(actions);
    }
  }

  /**
   * Generate columns with custom cell renderers
   */
  static generateCustomColumns(
    config: any,
    customRenderers: {
      [fieldName: string]: (
        value: any,
        row: TableRow,
        field: FieldConfig | undefined
      ) => React.ReactNode;
    } = {},
    actions: {
      onEdit?: (row: TableRow) => void;
      onDelete?: (row: TableRow) => void;
      onImageView?: (imageUrl: string) => void;
    } = {}
  ): ColumnDef<TableRow>[] {
    const columns = this.generateColumns(config, actions);

    return columns.map((column) => {
      const fieldIdentifier = this.getColumnFieldIdentifier(column);

      if (
        !fieldIdentifier ||
        !customRenderers[fieldIdentifier] ||
        this.isActionColumn(column)
      ) {
        return column;
      }

      return {
        ...column,
        cell: ({ row }) => {
          const value = row.getValue(fieldIdentifier);
          const field = Array.isArray(config)
            ? config.find(
                (f: FieldConfig) =>
                  f.fieldName === fieldIdentifier || f.alias === fieldIdentifier
              )
            : undefined;

          return customRenderers[fieldIdentifier](value, row.original, field);
        },
      };
    });
  }

  /**
   * Get the field identifier for a column
   */
  private static getColumnFieldIdentifier(
    column: ColumnDef<TableRow>
  ): string | undefined {
    if ("accessorKey" in column && column.accessorKey) {
      return column.accessorKey as string;
    }

    if (column.id && !this.isActionColumn(column)) {
      return column.id;
    }

    return undefined;
  }

  /**
   * Check if a column is an action column
   */
  private static isActionColumn(column: ColumnDef<TableRow>): boolean {
    const actionColumnIds = [
      "row",
      "actions",
      "edit-action",
      "delete-action",
      "edit",
      "delete",
    ];
    return column.id ? actionColumnIds.includes(column.id) : false;
  }

  /**
   * QUICK FIX: Force status badge for specific fields
   */
  static generateColumnsWithForcedStatus(
    config: any,
    forcedStatusFields: string[] = ["isactive", "active", "status", "taketive"],
    actions: {
      onEdit?: (row: TableRow) => void;
      onDelete?: (row: TableRow) => void;
      onImageView?: (imageUrl: string) => void;
    } = {}
  ): ColumnDef<TableRow>[] {
    const columns = this.generateColumns(config, actions);

    return columns.map((column) => {
      const fieldIdentifier = this.getColumnFieldIdentifier(column);

      if (!fieldIdentifier || this.isActionColumn(column)) {
        return column;
      }

      // Force status badge for specified fields
      const shouldForceStatus = forcedStatusFields.some((field) =>
        fieldIdentifier.toLowerCase().includes(field.toLowerCase())
      );

      if (shouldForceStatus) {
        console.log(`🎯 FORCING status badge for: ${fieldIdentifier}`);
        return {
          ...column,
          cell: ({ row }) => {
            const value = row.getValue(fieldIdentifier);
            try {
              const statusValue = this.parseBoolean(value);
              return UiUtils.renderStatusBadge(statusValue);
            } catch (error) {
              console.error(
                `❌ Error in forced status for ${fieldIdentifier}:`,
                error
              );
              return this.formatStringValue(value);
            }
          },
        };
      }

      return column;
    });
  }
}
