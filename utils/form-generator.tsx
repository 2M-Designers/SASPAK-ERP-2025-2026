// ============================================
// FORM GENERATOR - Clean & Optimized
// File: @/utils/form-generator.tsx
// ============================================

import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { MergedFieldConfig } from "@/types/master-setup.types";

interface FormFieldProps {
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  [key: string]: any;
}

export class FormGenerator {
  /**
   * Generate Zod schema from field config
   */
  static generateSchema(config: MergedFieldConfig[]): z.ZodObject<any> {
    if (!Array.isArray(config)) {
      console.warn("⚠️ FormGenerator: config is not an array");
      return z.object({});
    }

    const schemaFields: any = {};

    config.forEach((field: MergedFieldConfig) => {
      if (!field?.fieldName) {
        console.warn("⚠️ Invalid field config skipped:", field);
        return;
      }

      const fieldName = field.fieldName;
      const dataType = (field.dataType || "string").toLowerCase();

      // System fields are always optional
      const systemFields = [
        "id",
        "companyid",
        "version",
        "enteredby",
        "editby",
        "deletedby",
      ];
      if (systemFields.includes(fieldName.toLowerCase())) {
        schemaFields[fieldName] = z
          .union([z.number(), z.string()])
          .optional()
          .nullable();
        return;
      }

      let fieldSchema = this.createFieldSchema(field, dataType);
      schemaFields[fieldName] = fieldSchema;
    });

    console.log(
      "✅ Generated schema with",
      Object.keys(schemaFields).length,
      "fields"
    );
    return z.object(schemaFields);
  }

  /**
   * Create field schema based on data type
   */
  private static createFieldSchema(
    field: MergedFieldConfig,
    dataType: string
  ): z.ZodTypeAny {
    let fieldSchema: z.ZodTypeAny;

    switch (dataType) {
      case "boolean":
      case "bool":
        fieldSchema = z.boolean().default(false);
        break;

      case "number":
      case "int":
      case "integer":
        fieldSchema = z
          .union([
            z.number({
              invalid_type_error: `${field.displayName} must be a number`,
            }),
            z.string().transform((val) => parseInt(val, 10) || 0),
          ])
          .pipe(z.number().int().min(0));
        break;

      case "decimal":
      case "float":
      case "double":
        fieldSchema = z
          .union([
            z.number(),
            z.string().transform((val) => parseFloat(val) || 0),
          ])
          .pipe(z.number().min(0));
        break;

      case "email":
        fieldSchema = z.string().email("Invalid email address");
        break;

      case "phone":
      case "tel":
        fieldSchema = z
          .string()
          .regex(/^[+]?[\d\s\-()]*$/, "Invalid phone number format");
        break;

      case "url":
      case "website":
        fieldSchema = field.isRequired
          ? z.string().url("Invalid URL format")
          : z.string();
        break;

      case "select":
      case "dropdown":
      case "choice":
        fieldSchema = z.union([z.number(), z.string()]);
        break;

      default:
        fieldSchema = z.string();
        this.applyStringValidations(fieldSchema as z.ZodString, field);
    }

    // Handle enum values for non-dropdown fields
    if (
      field.enumList?.length &&
      !["select", "dropdown", "choice"].includes(dataType)
    ) {
      const enumValues = field.enumList.filter((val) => val != null);
      if (enumValues.length > 0) {
        fieldSchema = z.enum([enumValues[0], ...enumValues.slice(1)] as [
          string,
          ...string[]
        ]);
      }
    }

    return field.isRequired
      ? this.makeRequired(fieldSchema, field)
      : this.makeOptional(fieldSchema);
  }

  /**
   * Apply string validations
   */
  private static applyStringValidations(
    schema: z.ZodString,
    field: MergedFieldConfig
  ): void {
    if (field.maxLength) {
      schema.max(
        field.maxLength,
        `${field.displayName} must be less than ${field.maxLength} characters`
      );
    }
    if (field.minLength && field.isRequired) {
      schema.min(
        field.minLength,
        `${field.displayName} must be at least ${field.minLength} characters`
      );
    }
  }

  /**
   * Make field required
   */
  private static makeRequired(
    schema: z.ZodTypeAny,
    field: MergedFieldConfig
  ): z.ZodTypeAny {
    if (schema instanceof z.ZodString) {
      return schema.min(1, `${field.displayName} is required`);
    }
    return schema;
  }

  /**
   * Make field optional
   */
  private static makeOptional(schema: z.ZodTypeAny): z.ZodTypeAny {
    return schema.optional().nullable().or(z.literal(""));
  }

  /**
   * Generate form fields JSX
   */
  static generateFormFields(
    config: MergedFieldConfig[],
    form: any,
    additionalProps: FormFieldProps = {}
  ): React.ReactNode[] {
    if (!Array.isArray(config) || config.length === 0) {
      console.warn("⚠️ No field configs found for form generation");
      return [];
    }

    return config
      .filter((field) => field.isdisplayed !== false && field.fieldName)
      .map((field) => this.renderFormField(field, form, additionalProps))
      .filter(Boolean) as React.ReactNode[];
  }

  /**
   * Generate a single form field
   */
  static generateFormField(
    field: MergedFieldConfig,
    form: any,
    additionalProps: FormFieldProps = {}
  ): React.ReactNode {
    if (!field.fieldName) {
      console.warn("⚠️ Cannot generate form field without name");
      return null;
    }

    return this.renderFormField(field, form, additionalProps);
  }

  /**
   * Render individual form field
   */
  private static renderFormField(
    field: MergedFieldConfig,
    form: any,
    additionalProps: FormFieldProps = {}
  ): React.ReactNode {
    return (
      <FormField
        key={field.fieldName}
        control={form.control}
        name={field.fieldName}
        render={({ field: formField }) => (
          <FormItem className='space-y-2'>
            <FormLabel className='text-sm font-medium text-gray-700 flex items-center gap-1.5'>
              {field.displayName || field.fieldName}
              {field.isRequired && (
                <span className='text-red-500 text-base'>*</span>
              )}
            </FormLabel>
            <FormControl>
              {this.renderInputByType(field, formField, additionalProps)}
            </FormControl>
            <FormMessage className='text-xs' />
          </FormItem>
        )}
      />
    );
  }

  /**
   * Render appropriate input based on field type
   */
  private static renderInputByType(
    field: MergedFieldConfig,
    formField: any,
    additionalProps: FormFieldProps = {}
  ) {
    const fieldType = (field.dataType || "string").toLowerCase();
    const placeholder =
      additionalProps.placeholder ||
      field.placeholder ||
      `Enter ${field.displayName || field.fieldName}`;

    const commonProps = {
      disabled: additionalProps.disabled,
      placeholder: additionalProps.disabled ? undefined : placeholder,
    };

    const inputClasses = `
      w-full rounded-lg border-gray-300 
      focus:border-blue-500 focus:ring-blue-500 
      disabled:bg-gray-50 disabled:text-gray-500 
      transition-colors duration-200
      ${additionalProps.className || ""}
    `.trim();

    switch (fieldType) {
      case "boolean":
      case "bool":
        return this.renderSwitch(field, formField, additionalProps);

      case "date":
        return (
          <Input
            type='date'
            value={formField.value || ""}
            onChange={formField.onChange}
            {...commonProps}
            className={inputClasses}
          />
        );

      case "datetime":
        return (
          <Input
            type='datetime-local'
            value={formField.value || ""}
            onChange={formField.onChange}
            {...commonProps}
            className={inputClasses}
          />
        );

      case "number":
      case "int":
      case "integer":
        return this.renderNumberInput(
          field,
          formField,
          commonProps,
          inputClasses,
          true
        );

      case "decimal":
      case "float":
      case "double":
        return this.renderNumberInput(
          field,
          formField,
          commonProps,
          inputClasses,
          false
        );

      case "textarea":
      case "text":
      case "multiline":
        return (
          <Textarea
            value={formField.value || ""}
            onChange={formField.onChange}
            className={`${inputClasses} min-h-[100px]`}
            disabled={commonProps.disabled}
            placeholder={commonProps.placeholder}
          />
        );

      case "select":
      case "dropdown":
      case "choice":
        return this.renderDropdown(
          field,
          formField,
          inputClasses,
          commonProps,
          additionalProps
        );

      case "email":
        return (
          <Input
            type='email'
            value={formField.value || ""}
            onChange={formField.onChange}
            {...commonProps}
            className={inputClasses}
          />
        );

      case "password":
        return (
          <Input
            type='password'
            value={formField.value || ""}
            onChange={formField.onChange}
            {...commonProps}
            className={inputClasses}
          />
        );

      case "url":
      case "website":
        return (
          <Input
            type='url'
            value={formField.value || ""}
            onChange={formField.onChange}
            {...commonProps}
            className={inputClasses}
          />
        );

      case "phone":
      case "tel":
        return (
          <Input
            type='tel'
            value={formField.value || ""}
            onChange={formField.onChange}
            {...commonProps}
            className={inputClasses}
          />
        );

      default:
        return (
          <Input
            type='text'
            value={formField.value || ""}
            onChange={formField.onChange}
            {...commonProps}
            className={inputClasses}
          />
        );
    }
  }

  /**
   * Render switch input for boolean fields
   */
  private static renderSwitch(
    field: MergedFieldConfig,
    formField: any,
    additionalProps: FormFieldProps
  ) {
    return (
      <div className='flex items-center space-x-3 pt-1'>
        <Switch
          checked={formField.value || false}
          onCheckedChange={formField.onChange}
          disabled={additionalProps.disabled}
          className='data-[state=checked]:bg-blue-600'
        />
        <span className='text-sm text-gray-600'>
          {formField.value ? "Yes" : "No"}
        </span>
      </div>
    );
  }

  /**
   * Render number input
   */
  private static renderNumberInput(
    field: MergedFieldConfig,
    formField: any,
    commonProps: any,
    inputClasses: string,
    isInteger: boolean
  ) {
    return (
      <Input
        type='number'
        value={formField.value || ""}
        onChange={(e) => {
          const value = e.target.value;
          formField.onChange(
            value === ""
              ? ""
              : isInteger
              ? parseInt(value, 10)
              : parseFloat(value)
          );
        }}
        step={isInteger ? "1" : "0.01"}
        {...commonProps}
        className={inputClasses}
      />
    );
  }

  /**
   * Render dropdown/select input
   */
  // In the renderDropdown method, add detailed logging:

  private static renderDropdown(
    field: MergedFieldConfig,
    formField: any,
    inputClasses: string,
    commonProps: any,
    additionalProps: FormFieldProps = {}
  ) {
    const options = field.options || field.enumList || [];

    console.log(
      `🔽 [FormGenerator] Rendering dropdown for ${field.fieldName}:`,
      {
        fieldType: field.dataType,
        optionsCount: options.length,
        hasOptions: options.length > 0,
        currentValue: formField.value,
        fieldConfig: {
          dataType: field.dataType,
          displayType: field.displayType,
          hasOptionsProp: !!field.options,
          hasEnumListProp: !!field.enumList,
          optionsLength: field.options?.length || 0,
          enumListLength: field.enumList?.length || 0,
        },
        firstThreeOptions: options.slice(0, 3),
      }
    );

    if (!options.length) {
      console.warn(
        `⚠️ [FormGenerator] No options available for dropdown ${field.fieldName}`
      );
      return (
        <div className='text-sm text-gray-500 italic p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
          No options available for {field.displayName}
        </div>
      );
    }

    // Find current selected option for display
    const selectedOption = options.find((opt) => {
      const optValue = this.getOptionValue(opt);
      const matches = optValue === formField.value?.toString();
      console.log(`   🔍 Option comparison:`, {
        optionValue: optValue,
        formValue: formField.value?.toString(),
        matches,
      });
      return matches;
    });

    const displayValue = selectedOption
      ? this.getOptionLabel(selectedOption)
      : "";

    console.log(
      `✅ [FormGenerator] Creating dropdown for ${field.fieldName}:`,
      {
        selectedOption: selectedOption
          ? this.getOptionLabel(selectedOption)
          : "none",
        displayValue,
        optionsCount: options.length,
      }
    );

    return (
      <Select
        value={formField.value?.toString() || ""}
        onValueChange={(value) => {
          console.log(`📝 Dropdown ${field.fieldName} changed to:`, value);
          const finalValue = this.parseDropdownValue(value, field.fieldName);
          formField.onChange(finalValue);
        }}
        disabled={additionalProps.disabled}
        placeholder={commonProps.placeholder || `Select ${field.displayName}`}
      >
        <SelectTrigger className={inputClasses}>
          <SelectValue>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent className='max-h-[300px]'>
          {options.map((option: any, index: number) => {
            const optionValue = this.getOptionValue(option);
            const optionLabel = this.getOptionLabel(option);

            console.log(`   📌 Option ${index}:`, { optionValue, optionLabel });

            return (
              <SelectItem
                key={`${field.fieldName}-${optionValue}-${index}`}
                value={optionValue}
                className='cursor-pointer hover:bg-gray-100 transition-colors'
              >
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  /**
   * Get option value from different formats
   */
  private static getOptionValue(option: any): string {
    if (typeof option === "string") {
      return option.includes("|") ? option.split("|")[0] : option;
    }
    if (typeof option === "object" && option !== null) {
      return option.value?.toString() || "";
    }
    return option?.toString() || "";
  }

  /**
   * Get option label from different formats
   */
  private static getOptionLabel(option: any): string {
    if (typeof option === "string") {
      return option.includes("|")
        ? option.split("|")[1] || option.split("|")[0]
        : option;
    }
    if (typeof option === "object" && option !== null) {
      return option.label || option.value?.toString() || "";
    }
    return option?.toString() || "";
  }

  /**
   * Parse dropdown value for storage
   */
  private static parseDropdownValue(
    value: string,
    fieldName: string
  ): string | number {
    // Parse if it's in "id|label" format
    let finalValue = value.includes("|") ? value.split("|")[0] : value;

    // Convert to number if it looks like an ID field
    if (fieldName.toLowerCase().endsWith("id")) {
      const numValue = Number(finalValue);
      return isNaN(numValue) ? finalValue : numValue;
    }

    return finalValue;
  }

  /**
   * Safe method to generate schema with error handling
   */
  static safeGenerateSchema(config: any): z.ZodObject<any> {
    try {
      const configArray = Array.isArray(config)
        ? config
        : config?.data || config?.fields || [];
      return this.generateSchema(configArray);
    } catch (error) {
      console.error("❌ Error generating form schema:", error);
      return z.object({});
    }
  }

  /**
   * Safe method to generate form fields with error handling
   */
  static safeGenerateFormFields(
    config: any,
    form: any,
    additionalProps: FormFieldProps = {}
  ): React.ReactNode[] {
    try {
      const configArray = Array.isArray(config)
        ? config
        : config?.data || config?.fields || [];
      return this.generateFormFields(configArray, form, additionalProps);
    } catch (error) {
      console.error("❌ Error generating form fields:", error);
      return [];
    }
  }

  /**
   * Safe method to generate single form field with error handling
   */
  static safeGenerateFormField(
    field: MergedFieldConfig,
    form: any,
    additionalProps: FormFieldProps = {}
  ): React.ReactNode {
    try {
      return this.generateFormField(field, form, additionalProps);
    } catch (error) {
      console.error("❌ Error generating form field:", error);
      return null;
    }
  }
}
