// ============================================
// STRING UTILITIES CLASS
// File: @/utils/string-utils.ts
// ============================================

export class StringUtils {
  /**
   * Convert string to camelCase
   * Example: "DepartmentName" -> "departmentName"
   */
  static toCamelCase(str: string): string {
    if (!str) return str;

    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");
  }

  /**
   * Convert string to PascalCase
   * Example: "departmentName" -> "DepartmentName"
   */
  static toPascalCase(str: string): string {
    if (!str) return str;

    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * Convert string to kebab-case
   * Example: "DepartmentName" -> "department-name"
   */
  static toKebabCase(str: string): string {
    if (!str) return str;

    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();
  }

  /**
   * Convert string to snake_case
   * Example: "DepartmentName" -> "department_name"
   */
  static toSnakeCase(str: string): string {
    if (!str) return str;

    return str
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toLowerCase();
  }

  /**
   * Convert string to Title Case
   * Example: "department_name" -> "Department Name"
   */
  static toTitleCase(str: string): string {
    if (!str) return str;

    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      })
      .trim();
  }

  /**
   * Transform object keys to camelCase recursively
   */
  static transformKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformKeysToCamelCase(item));
    } else if (obj !== null && typeof obj === "object") {
      const transformed: any = {};
      Object.keys(obj).forEach((key) => {
        const camelCaseKey = this.toCamelCase(key);
        transformed[camelCaseKey] = this.transformKeysToCamelCase(obj[key]);
      });
      return transformed;
    }
    return obj;
  }

  /**
   * Transform object keys to PascalCase recursively
   */
  static transformKeysToPascalCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformKeysToPascalCase(item));
    } else if (obj !== null && typeof obj === "object") {
      const transformed: any = {};
      Object.keys(obj).forEach((key) => {
        const pascalCaseKey = this.toPascalCase(key);
        transformed[pascalCaseKey] = this.transformKeysToPascalCase(obj[key]);
      });
      return transformed;
    }
    return obj;
  }
}

/*
// Basic usage
const camelCase = StringUtils.toCamelCase("DepartmentName"); // "departmentName"

// Transform entire object
const transformedData = StringUtils.transformKeysToCamelCase(apiResponse);

// Status display
const status = UiUtils.getEnhancedStatusDisplay(true, 'badge');
// Returns: Green badge with check icon and "Active" text

const inactiveStatus = UiUtils.getEnhancedStatusDisplay(false, 'icon-only');
// Returns: Red X icon only

*/
