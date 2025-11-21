// ============================================
// 1. TYPE DEFINITIONS (UPDATED)
// File: @/types/master-setup.types.ts
// ============================================

export interface FieldConfig {
  fieldName: string;
  displayName: string;
  isdisplayed: boolean;
  isselected: boolean;
  routeTo?: string | null;
  displayType?: string | null;
  dataType?: string | null;
  isquoted: boolean;
  alias?: string | null;
  isDefaultSort: boolean;
  isDefaultSortDesc: boolean;
  enumList?: any[] | null;
}

export interface FormFieldConfig {
  enumList: never[];
  fieldName: string;
  displayName: string;
  dataType: string;
  isRequired: boolean;
  maxLength?: number;
  minLength?: number;
  validationRules?: any;
  placeholder?: string;
  options?: any[];
  defaultValue?: any;
}

// Extended FieldConfig interface for merged fields with form-specific properties
export interface MergedFieldConfig extends FieldConfig {
  isRequired?: boolean;
  maxLength?: number;
  minLength?: number;
  validationRules?: any;
  placeholder?: string;
  options?: any[];
  defaultValue?: any;
}

export interface MasterSetupConfig {
  endpoint: string; // e.g., "Department"
  title: string; // e.g., "Departments Management"
  searchPlaceholder?: string;
  searchField?: string;
  enableImageUpload?: boolean;
  enableExcelImport?: boolean;
  enableExcelExport?: boolean;
  customColumns?: any[]; // For additional custom columns
  transformData?: (data: any) => any; // Data transformation function

  // API Payload configurations
  listPayload?: ApiPayload; // Payload for GetList API
  formConfig?: FormFieldConfig[]; // Form configuration from GetDtoMeta API

  // Method-specific payloads
  getPayload?: ApiPayload; // For GET operations
  createPayload?: ApiPayload; // For POST operations
  updatePayload?: ApiPayload; // For PUT operations
  deletePayload?: ApiPayload; // For DELETE operations

  // API method customization
  customGetListMethod?: string; // Custom method name for GetList
  customGetConfigMethod?: string; // Custom method name for GetConfig
  customGetDtoMetaMethod?: string; // Custom method name for GetDtoMeta
  customCreateMethod?: string; // Custom method name for Create
  customUpdateMethod?: string; // Custom method name for Update
  customDeleteMethod?: string; // Custom method name for Delete
}

export interface ApiPayload {
  select?: string;
  where?: string;
  orderBy?: string;
  sortOn?: string; // Some APIs use sortOn instead of orderBy
  page?: string | number;
  pageSize?: string | number;
  skip?: number;
  take?: number;
  filter?: any; // For complex filtering
  include?: string; // For including related entities

  // Add deletion-specific properties and other common payload properties
  deletedBy?: number;
  companyId?: number;
  enteredBy?: number;
  editBy?: number;

  // Allow any additional properties for flexibility
  [key: string]: any;
}

// Strict API payload for APIs that require specific casing
export interface StrictApiPayload {
  Select?: string;
  Where?: string;
  OrderBy?: string;
  SortOn?: string;
  Page?: string | number;
  PageSize?: string | number;
  Skip?: number;
  Take?: number;
  Filter?: any;
  Include?: string;
  DeletedBy?: number;
  CompanyId?: number;
  EnteredBy?: number;
  EditBy?: number;
  [key: string]: any;
}

// Response interfaces for API consistency
export interface ApiResponse<T = any> {
  data?: T;
  result?: T;
  items?: T[];
  records?: T[];
  list?: T[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  success?: boolean;
  message?: string;
  error?: string;
}

// Service method interfaces
export interface ServiceMethods {
  getList: (endpoint: string, payload?: ApiPayload) => Promise<any>;
  getConfig: (endpoint: string, payload?: ApiPayload) => Promise<any>;
  getDtoMeta: (endpoint: string, payload?: ApiPayload) => Promise<any>;
  create: (
    endpoint: string,
    data: any,
    isFormData?: boolean,
    payload?: ApiPayload
  ) => Promise<any>;
  update: (
    endpoint: string,
    id: number | string,
    data: any,
    isFormData?: boolean,
    payload?: ApiPayload
  ) => Promise<any>;
  delete: (
    endpoint: string,
    id: number | string,
    payload?: ApiPayload
  ) => Promise<any>;
  bulkDelete?: (
    endpoint: string,
    ids: (number | string)[],
    payload?: ApiPayload
  ) => Promise<boolean>;
  uploadFile?: (
    endpoint: string,
    formData: FormData,
    payload?: ApiPayload
  ) => Promise<any>;
  search?: (
    endpoint: string,
    searchCriteria: any,
    payload?: ApiPayload
  ) => Promise<any[]>;
  executeCustomMethod?: (
    endpoint: string,
    method: string,
    payload?: ApiPayload,
    httpMethod?: string
  ) => Promise<any>;
}

// Component props interfaces
export interface MasterSetupPageProps {
  config: MasterSetupConfig;
  initialData?: any[];
  initialFieldConfig?: FieldConfig[];
  formConfig?: FormFieldConfig[];
}

export interface MasterSetupDialogProps {
  type: "add" | "edit" | "delete";
  config: MasterSetupConfig;
  fieldConfig: FieldConfig[];
  formFieldConfig: FormFieldConfig[];
  defaultState: any;
  handleAddEdit?: (data: any) => void;
  handleDelete?: (id: number) => void;
}

// Form generator types
export interface FormGeneratorConfig {
  fieldConfig: MergedFieldConfig[];
  form: any; // react-hook-form form instance
  onSubmit?: (data: any) => void;
}

// Excel utility types
export interface ExcelExportConfig {
  data: any[];
  fieldConfig: FieldConfig[];
  fileName: string;
  includeHiddenFields?: boolean;
}

export interface ExcelImportConfig {
  file: File;
  fieldConfig: FieldConfig[];
  onProgress?: (progress: number) => void;
  onComplete?: (results: any[]) => void;
  onError?: (error: any) => void;
}

// Column generator types
export interface ColumnConfig {
  fieldName: string;
  header: string;
  cell?: (row: any) => any;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  size?: number;
}

// Dialog state types
export interface DialogState {
  isOpen: boolean;
  type: "add" | "edit" | "delete";
  data?: any;
  isLoading: boolean;
}

// Search and filter types
export interface SearchFilter {
  field: string;
  value: any;
  operator?:
    | "contains"
    | "equals"
    | "startsWith"
    | "endsWith"
    | "greaterThan"
    | "lessThan";
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
