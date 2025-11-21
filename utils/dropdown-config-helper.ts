// ============================================
// DROPDOWN CONFIGURATION HELPER
// File: @/utils/dropdown-config-helper.ts
// ============================================

import { StringUtils } from "./string-utils";

interface DropdownConfig {
  fieldName: string;
  endpoint: string;
  valueField: string;
  labelField: string;
  selectFields?: string;
  where?: string;
  dependencies?: string[]; // Fields that trigger reload
}

interface DropdownOption {
  value: string | number;
  label: string;
  data?: any; // Store full record if needed
}

export class DropdownConfigHelper {
  // Registry of dropdown configurations
  private static dropdownRegistry: Map<string, DropdownConfig> = new Map([
    // Currency dropdown
    [
      "currencyid",
      {
        fieldName: "currencyId",
        endpoint: "Currency/GetList",
        valueField: "currencyId",
        labelField: "currencyName",
        selectFields: "CurrencyId,CurrencyCode,CurrencyName,Symbol",
        where: "IsActive = 1",
      },
    ],

    // City dropdown
    [
      "cityid",
      {
        fieldName: "cityId",
        endpoint: "Unlocation/GetList",
        valueField: "unlocationId",
        labelField: "locationName",
        selectFields: "UnLocationId,locationName,UNCode,IsCountry",
        where: "",
      },
    ],

    // State dropdown
    [
      "stateid",
      {
        fieldName: "stateId",
        endpoint: "State/GetList",
        valueField: "stateId",
        labelField: "stateName",
        selectFields: "StateId,StateName,CountryId",
        where: "IsActive = 1",
        dependencies: ["countryId"], // Reload when country changes
      },
    ],

    // Country dropdown
    [
      "countryid",
      {
        fieldName: "countryId",
        endpoint: "Country/GetList",
        valueField: "countryId",
        labelField: "countryName",
        selectFields: "CountryId,CountryName,CountryCode",
        where: "IsActive = 1",
      },
    ],

    // Company dropdown (for relationships)
    [
      "companyid",
      {
        fieldName: "companyId",
        endpoint: "Company/GetList",
        valueField: "companyId",
        labelField: "companyName",
        selectFields: "companyId,companyCode,companyName",
        where: "IsActive = 1",
      },
    ],

    // UN Location dropdown (for relationships)
    [
      "parentunlocationid",
      {
        fieldName: "parentUnlocationId",
        endpoint: "Unlocation/GetList",
        valueField: "unlocationId", // ✅ Changed from "parentUnlocationId"
        labelField: "locationName",
        selectFields: "UnlocationId,LocationName,UNCode,IsActive",
        where: "IsActive = 1",
      },
    ],

    [
      "cityid",
      {
        fieldName: "parentUnlocationId",
        endpoint: "Unlocation/GetList",
        valueField: "unlocationId", // ✅ Changed from "parentUnlocationId"
        labelField: "locationName",
        selectFields: "UnlocationId,LocationName,UNCode,IsActive",
        where: "IsActive = 1 and IsCity = 1",
      },
    ],
  ]);

  /**
   * Check if a field should be rendered as a dropdown
   */
  static isDropdownField(fieldName: string): boolean {
    const normalizedName = fieldName.toLowerCase();
    return this.dropdownRegistry.has(normalizedName);
  }

  /**
   * Get dropdown configuration for a field
   */
  static getDropdownConfig(fieldName: string): DropdownConfig | null {
    const normalizedName = fieldName.toLowerCase();
    return this.dropdownRegistry.get(normalizedName) || null;
  }

  /**
   * Register a new dropdown configuration
   */
  static registerDropdown(config: DropdownConfig): void {
    const normalizedName = config.fieldName.toLowerCase();
    this.dropdownRegistry.set(normalizedName, config);
    console.log(`✅ Registered dropdown: ${config.fieldName}`);
  }

  /**
   * Register multiple dropdown configurations
   */
  static registerDropdowns(configs: DropdownConfig[]): void {
    configs.forEach((config) => this.registerDropdown(config));
  }

  /**
   * Fetch dropdown options from API
   */
  static async fetchDropdownOptions(
    fieldName: string,
    baseUrl: string,
    filterParams?: { [key: string]: any }
  ): Promise<DropdownOption[]> {
    const config = this.getDropdownConfig(fieldName);

    if (!config) {
      console.warn(`⚠️ No dropdown config found for: ${fieldName}`);
      return [];
    }

    try {
      console.log(`📥 Fetching dropdown options for: ${fieldName}`);

      // Build where clause with filters
      let whereClause = config.where || "";
      if (filterParams && config.dependencies) {
        config.dependencies.forEach((dep) => {
          if (filterParams[dep]) {
            const depValue = filterParams[dep];
            const depField = dep.charAt(0).toUpperCase() + dep.slice(1);
            whereClause += whereClause
              ? ` AND ${depField} = ${depValue}`
              : `${depField} = ${depValue}`;
          }
        });
      }

      const payload = {
        select: config.selectFields || "*",
        where: whereClause,
        sortOn: config.labelField,
        page: "1",
        pageSize: "1000",
      };

      console.log(`🌐 API Request for ${fieldName}:`, {
        url: `${baseUrl}${config.endpoint}`,
        payload,
      });

      const response = await fetch(`${baseUrl}${config.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📦 Dropdown data for ${fieldName}:`, data);

      // Transform to dropdown options
      const options = this.transformToOptions(data, config);
      console.log(`✅ Loaded ${options.length} options for ${fieldName}`);

      return options;
    } catch (error) {
      console.error(`❌ Error fetching dropdown for ${fieldName}:`, error);
      return [];
    }
  }

  /**
   * Transform API response to dropdown options
   */
  // Update the transformToOptions method in your dropdown-config-helper.ts

  private static transformToOptions(
    data: any,
    config: DropdownConfig
  ): DropdownOption[] {
    // Handle different response formats
    let items: any[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === "object") {
      // Try common response wrappers - also check for camelCase versions
      items =
        data.data ||
        data.items ||
        data.result ||
        data.records ||
        data.Data ||
        data.Items ||
        data.Result ||
        data.Records ||
        [];
    }

    if (!Array.isArray(items)) {
      console.warn("⚠️ Unexpected data format:", data);
      return [];
    }

    console.log(
      `🔍 Transforming ${items.length} items for ${config.fieldName}`
    );

    const options = items
      .map((item) => {
        if (!item) return null;

        // Handle multiple possible field name variations
        const possibleValueFields = [
          config.valueField,
          config.valueField.toLowerCase(),
          config.valueField.toUpperCase(),
          StringUtils.toPascalCase(config.valueField),
          StringUtils.toCamelCase(config.valueField),
        ];

        const possibleLabelFields = [
          config.labelField,
          config.labelField.toLowerCase(),
          config.labelField.toUpperCase(),
          StringUtils.toPascalCase(config.labelField),
          StringUtils.toCamelCase(config.labelField),
        ];

        // Find the actual field names in the item
        let value: any = null;
        let label: any = null;

        for (const field of possibleValueFields) {
          if (item[field] !== undefined) {
            value = item[field];
            break;
          }
        }

        for (const field of possibleLabelFields) {
          if (item[field] !== undefined) {
            label = item[field];
            break;
          }
        }

        // If still not found, try direct object inspection
        if (value == null) {
          const valueKeys = Object.keys(item).find(
            (key) =>
              key.toLowerCase().includes("id") &&
              (key.toLowerCase().includes(config.valueField.toLowerCase()) ||
                config.valueField.toLowerCase().includes(key.toLowerCase()))
          );
          value = valueKeys ? item[valueKeys] : null;
        }

        if (label == null) {
          const labelKeys = Object.keys(item).find(
            (key) =>
              key.toLowerCase().includes("name") &&
              (key.toLowerCase().includes(config.labelField.toLowerCase()) ||
                config.labelField.toLowerCase().includes(key.toLowerCase()))
          );
          label = labelKeys ? item[labelKeys] : null;
        }

        if (value == null) {
          console.warn(`⚠️ Null value for field ${config.fieldName}:`, item, {
            possibleValueFields,
            possibleLabelFields,
            itemKeys: Object.keys(item),
          });
          return null;
        }

        return {
          value: value,
          label: label || `Company ${value}`,
          data: item,
        };
      })
      .filter((opt) => opt != null) as DropdownOption[];

    console.log(
      `🔄 Transformed ${options.length} options for ${config.fieldName}`
    );
    return options;
  }

  /**
   * Get all dropdown configurations
   */
  static getAllDropdownConfigs(): Map<string, DropdownConfig> {
    return new Map(this.dropdownRegistry);
  }

  /**
   * Check if field has dependencies
   */
  static hasDependencies(fieldName: string): boolean {
    const config = this.getDropdownConfig(fieldName);
    return config?.dependencies ? config.dependencies.length > 0 : false;
  }

  /**
   * Get dependencies for a field
   */
  static getDependencies(fieldName: string): string[] {
    const config = this.getDropdownConfig(fieldName);
    return config?.dependencies || [];
  }

  /**
   * Batch fetch multiple dropdowns
   */
  static async fetchMultipleDropdowns(
    fieldNames: string[],
    baseUrl: string,
    filterParams?: { [key: string]: any }
  ): Promise<{ [fieldName: string]: DropdownOption[] }> {
    console.log(`📥 Batch fetching ${fieldNames.length} dropdowns...`);

    const results: { [fieldName: string]: DropdownOption[] } = {};

    // Fetch all dropdowns in parallel
    const promises = fieldNames.map(async (fieldName) => {
      const options = await this.fetchDropdownOptions(
        fieldName,
        baseUrl,
        filterParams
      );
      results[fieldName] = options;
    });

    await Promise.all(promises);

    console.log(
      "✅ Batch fetch complete:",
      Object.entries(results).map(([key, value]) => ({
        field: key,
        options: value.length,
      }))
    );
    return results;
  }

  /**
   * Create enum list from dropdown options for form config
   */
  static createEnumList(options: DropdownOption[]): string[] {
    return options.map((opt) => `${opt.value}|${opt.label}`);
  }

  /**
   * Parse enum value to get ID and label
   */
  static parseEnumValue(enumValue: string): {
    id: string | number;
    label: string;
  } {
    const parts = enumValue.split("|");
    return {
      id: parts[0],
      label: parts[1] || parts[0],
    };
  }
}
