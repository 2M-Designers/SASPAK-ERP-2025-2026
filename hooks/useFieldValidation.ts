// ============================================
// HOOK: useFieldValidation
// File: @/hooks/useFieldValidation.ts
// ============================================

import { useMemo } from "react";
import { z } from "zod";
import { FieldConfig } from "@/types/master-setup.types";

export function useFieldValidation(fieldConfig: FieldConfig[]) {
  const validationSchema = useMemo(() => {
    const schemaFields: any = {};

    fieldConfig.forEach((field) => {
      if (field.fieldName === "Id") {
        schemaFields[field.fieldName] = z.number().optional();
        return;
      }

      let fieldSchema: any;

      switch (field.dataType || field.displayType) {
        case "boolean":
          fieldSchema = z.boolean();
          break;
        case "number":
        case "int":
          fieldSchema = z.number({
            required_error: `${field.displayName} is required`,
            invalid_type_error: `${field.displayName} must be a number`,
          });
          break;
        case "datetime":
        case "date":
          fieldSchema = z.string().min(1, `${field.displayName} is required`);
          break;
        case "email":
          fieldSchema = z.string().email("Invalid email address");
          break;
        default:
          fieldSchema = z.string().min(1, `${field.displayName} is required`);
      }

      if (!field.isselected) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.fieldName] = fieldSchema;
    });

    return z.object(schemaFields);
  }, [fieldConfig]);

  return validationSchema;
}
