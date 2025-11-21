export class FieldConfigHelper {
  /**
   * Default field patterns for common system fields
   */
  private static readonly DEFAULT_FIELD_PATTERNS = {
    // System/Audit fields that should be hidden in forms
    hiddenPatterns: [
      /^version$/i,
      ///^isactive$/i,
      ///^companyid$/i,
      /^enteredby$/i,
      /^editby$/i,
      /^createdby$/i,
      /^createdat$/i,
      /^modifiedby$/i,
      /^modifiedat$/i,
      /^deletedby$/i,
      /^deletedat$/i,
      /^timestamp$/i,
      /^rowversion$/i,
    ],

    // Fields that should be locked in edit mode
    lockedPatterns: [
      ///id$/i, // Fields ending with "id"
      ///^id/i, // Fields starting with "id"
      ///code$/i, // Fields ending with "code"
      ///^code/i, // Fields starting with "code"
    ],

    // Fields that are typically required
    requiredPatterns: [/name$/i, /^name/i, /code$/i, /^code/i],
  };

  /**
   * Enhance form configuration with data types and field controls
   */
  static enhanceFormConfig(
    formConfig: any[],
    dataTypes: { [key: string]: string },
    options: {
      hiddenPatterns?: RegExp[];
      lockedPatterns?: RegExp[];
      requiredPatterns?: RegExp[];
      customHiddenFields?: string[];
      customLockedFields?: string[];
      customRequiredFields?: string[];
    } = {}
  ): any[] {
    const {
      hiddenPatterns = this.DEFAULT_FIELD_PATTERNS.hiddenPatterns,
      lockedPatterns = this.DEFAULT_FIELD_PATTERNS.lockedPatterns,
      requiredPatterns = this.DEFAULT_FIELD_PATTERNS.requiredPatterns,
      customHiddenFields = [],
      customLockedFields = [],
      customRequiredFields = [],
    } = options;

    return formConfig
      .map((field) => {
        const fieldName = field.fieldName?.toLowerCase() || "";

        // Get data type from API or fallback
        const apiType = dataTypes[field.fieldName] || field.dataType;
        const dataType = this.mapApiTypeToFormType(apiType);

        // Determine if field should be hidden using patterns + custom fields
        const shouldHide =
          this.matchesPattern(fieldName, hiddenPatterns) ||
          customHiddenFields.some((hiddenField) =>
            fieldName.includes(hiddenField.toLowerCase())
          );

        // Determine if field should be locked using patterns + custom fields
        const shouldLock =
          this.matchesPattern(fieldName, lockedPatterns) ||
          customLockedFields.some((lockedField) =>
            fieldName.includes(lockedField.toLowerCase())
          );

        // Determine if field is required using patterns + custom fields + original config
        const isRequired =
          this.matchesPattern(fieldName, requiredPatterns) ||
          customRequiredFields.some((requiredField) =>
            fieldName.includes(requiredField.toLowerCase())
          ) ||
          field.isRequired;

        return {
          ...field,
          dataType,
          isRequired: Boolean(isRequired),
          isHiddenInDialog: shouldHide,
          isLockedInEdit: shouldLock,
          // Additional metadata
          originalDataType: apiType,
          isSystemField: shouldHide || shouldLock,
        };
      })
      .filter((field) => !field.isHiddenInDialog); // Remove hidden fields
  }

  /**
   * Check if field name matches any pattern
   */
  private static matchesPattern(
    fieldName: string,
    patterns: RegExp[]
  ): boolean {
    return patterns.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Get field patterns for specific entity type
   */
  static getEntityFieldPatterns(entityType: string): {
    hiddenPatterns: RegExp[];
    lockedPatterns: RegExp[];
    requiredPatterns: RegExp[];
  } {
    const basePatterns = { ...this.DEFAULT_FIELD_PATTERNS };

    // Entity-specific pattern overrides
    switch (entityType.toLowerCase()) {
      case "company":
        return {
          ...basePatterns,
          requiredPatterns: [
            /^companyname$/i,
            /^companycode$/i,
            /^legalname$/i,
            ...basePatterns.requiredPatterns,
          ],
        };

      case "branch":
        return {
          ...basePatterns,
          requiredPatterns: [
            /^branchname$/i,
            /^branchcode$/i,
            ...basePatterns.requiredPatterns,
          ],
        };

      case "department":
        return {
          ...basePatterns,
          requiredPatterns: [
            /^departmentname$/i,
            /^departmentcode$/i,
            ...basePatterns.requiredPatterns,
          ],
        };

      default:
        return basePatterns;
    }
  }

  /**
   * Get field display configuration for different contexts
   */
  static getFieldDisplayConfig(
    fieldName: string,
    context: "table" | "form" | "edit" = "form",
    entityType?: string
  ) {
    const patterns = entityType
      ? this.getEntityFieldPatterns(entityType)
      : this.DEFAULT_FIELD_PATTERNS;

    const isSystemField = this.matchesPattern(
      fieldName,
      patterns.hiddenPatterns
    );
    const isLockedField = this.matchesPattern(
      fieldName,
      patterns.lockedPatterns
    );
    const isRequiredField = this.matchesPattern(
      fieldName,
      patterns.requiredPatterns
    );

    switch (context) {
      case "table":
        return {
          visible: true, // Always show in table
          editable: false,
          required: false,
        };

      case "form":
        return {
          visible: !isSystemField,
          editable: !isSystemField && !isLockedField,
          required: !isSystemField && isRequiredField,
        };

      case "edit":
        return {
          visible: !isSystemField,
          editable: !isSystemField && !isLockedField,
          required: false, // Requirements might be different in edit mode
        };

      default:
        return {
          visible: true,
          editable: true,
          required: false,
        };
    }
  }

  // ... rest of the methods remain the same
  static mapApiTypeToFormType(apiType: string): string {
    if (!apiType) return "string";

    const typeMap: { [key: string]: string } = {
      // Integer types
      int32: "number",
      int64: "number",
      integer: "number",
      int: "number",
      number: "number",

      // Decimal types
      decimal: "number",
      float: "number",
      double: "number",
      single: "number",

      // Boolean types
      boolean: "boolean",
      bool: "boolean",

      // Date/Time types
      datetime: "datetime",
      date: "date",
      time: "time",
      datetimeoffset: "datetime",

      // String types
      string: "string",
      guid: "string",
      char: "string",
      text: "textarea",

      // Special types
      email: "email",
      phone: "tel",
      url: "url",
      color: "color",
    };

    const normalizedType = apiType.toLowerCase().replace(/[^a-z0-9]/g, "");
    return typeMap[normalizedType] || "string";
  }

  static getDefaultValue(dataType: string): any {
    const defaults: { [key: string]: any } = {
      number: 0,
      boolean: false,
      datetime: new Date().toISOString().split("T")[0],
      date: new Date().toISOString().split("T")[0],
      string: "",
      textarea: "",
      email: "",
      tel: "",
      url: "",
      color: "#000000",
    };

    return defaults[dataType] || "";
  }

  static getTableColumns(fieldConfig: any[]): any[] {
    return fieldConfig.map((field) => ({
      ...field,
      isdisplayed: true, // Always show in table
    }));
  }
}
