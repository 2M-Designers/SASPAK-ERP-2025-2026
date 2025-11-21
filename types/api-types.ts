// types/api-payload.types.ts

/**
 * Standard API payload for data fetching operations
 */
export interface ApiPayload {
  /**
   * Comma-separated list of fields to select
   * Example: "Id,Name,Email,Status"
   */
  select?: string;

  /**
   * Filter conditions in string format
   * Example: "Status == 'Active' AND Category == 'Electronics'"
   */
  where?: string;

  /**
   * Sorting criteria
   * Example: "Name ASC, CreatedDate DESC"
   */
  orderBy?: string;

  /**
   * Number of records to skip (for pagination)
   */
  skip?: number;

  /**
   * Number of records to take (for pagination)
   */
  take?: number;

  /**
   * Search term for global search
   */
  search?: string;

  /**
   * Specific field to search on
   */
  searchField?: string;

  /**
   * Additional parameters for advanced filtering
   */
  parameters?: Record<string, any>;

  /**
   * Include related entities
   * Example: "Category,Supplier,Images"
   */
  include?: string;

  /**
   * Group by fields for aggregation
   */
  groupBy?: string;

  /**
   * Enable distinct results
   */
  distinct?: boolean;
}

/**
 * Extended payload for advanced scenarios
 */
export interface AdvancedApiPayload extends ApiPayload {
  /**
   * Custom joins for complex queries
   */
  joins?: Array<{
    table: string;
    on: string;
    type?: "INNER" | "LEFT" | "RIGHT";
  }>;

  /**
   * Aggregation functions
   */
  aggregates?: Array<{
    field: string;
    function: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
    alias?: string;
  }>;

  /**
   * Having clause for aggregated results
   */
  having?: string;
}

/**
 * Bulk operation payload
 */
export interface BulkApiPayload {
  /**
   * Array of records for bulk operations
   */
  records: any[];

  /**
   * Operation type
   */
  operation: "CREATE" | "UPDATE" | "DELETE" | "UPSERT";

  /**
   * Conflict resolution strategy for UPSERT operations
   */
  conflictFields?: string[];
}

/**
 * File upload payload
 */
export interface FileUploadPayload {
  /**
   * Form data containing files
   */
  formData: FormData;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;

  /**
   * File validation rules
   */
  validation?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxFiles?: number;
  };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  /**
   * Response data
   */
  data: T;

  /**
   * Total count of records (for paginated responses)
   */
  totalCount?: number;

  /**
   * Current page number
   */
  page?: number;

  /**
   * Page size
   */
  pageSize?: number;

  /**
   * Total pages available
   */
  totalPages?: number;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Response message
   */
  message?: string;

  /**
   * Error details if any
   */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /**
   * Server timestamp
   */
  timestamp?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Filter conditions for advanced filtering
 */
export interface FilterCondition {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "in";
  value: any;
  logicalOperator?: "AND" | "OR";
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  direction: "ASC" | "DESC";
}

/**
 * Search configuration
 */
export interface SearchConfig {
  term: string;
  fields: string[];
  mode?: "exact" | "partial" | "fuzzy";
}

// Utility types for building payloads
export type PayloadBuilder = {
  select: (fields: string[]) => PayloadBuilder;
  where: (condition: string) => PayloadBuilder;
  orderBy: (field: string, direction?: "ASC" | "DESC") => PayloadBuilder;
  paginate: (page: number, pageSize: number) => PayloadBuilder;
  search: (term: string, field?: string) => PayloadBuilder;
  build: () => ApiPayload;
};

/**
 * Helper function to create API payloads using fluent interface
 */
export const createPayload = (): PayloadBuilder => {
  const payload: Partial<ApiPayload> = {};

  return {
    select(fields: string[]): PayloadBuilder {
      payload.select = fields.join(",");
      return this;
    },

    where(condition: string): PayloadBuilder {
      payload.where = condition;
      return this;
    },

    orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): PayloadBuilder {
      payload.orderBy = `${field} ${direction}`;
      return this;
    },

    paginate(page: number, pageSize: number): PayloadBuilder {
      payload.skip = (page - 1) * pageSize;
      payload.take = pageSize;
      return this;
    },

    search(term: string, field?: string): PayloadBuilder {
      payload.search = term;
      if (field) {
        payload.searchField = field;
      }
      return this;
    },

    build(): ApiPayload {
      return payload as ApiPayload;
    },
  };
};

// Example usage:
/*
const payload = createPayload()
  .select(['Id', 'Name', 'Email', 'Status'])
  .where("Status == 'Active'")
  .orderBy('CreatedDate', 'DESC')
  .paginate(1, 20)
  .search('john', 'Name')
  .build();
*/

/**
 * Default payload values for common scenarios
 */
export const DefaultPayloads = {
  /**
   * Basic payload with common fields
   */
  BASIC: {
    select: "Id,Name,Description,IsActive,CreatedDate",
    take: 50,
    orderBy: "CreatedDate DESC",
  } as ApiPayload,

  /**
   * Minimal payload for dropdowns
   */
  DROPDOWN: {
    select: "Id,Name",
    take: 100,
    orderBy: "Name ASC",
  } as ApiPayload,

  /**
   * Detailed payload for view pages
   */
  DETAILED: {
    select: "*",
    take: 1,
  } as ApiPayload,
};

/**
 * Type guard to check if object is ApiPayload
 */
export function isApiPayload(obj: any): obj is ApiPayload {
  return (
    obj &&
    (typeof obj.select === "string" ||
      typeof obj.where === "string" ||
      typeof obj.orderBy === "string" ||
      typeof obj.skip === "number" ||
      typeof obj.take === "number")
  );
}

/**
 * Merge multiple payloads into one
 */
export function mergePayloads(...payloads: Partial<ApiPayload>[]): ApiPayload {
  return payloads.reduce(
    (merged, current) => ({
      ...merged,
      ...current,
    }),
    {} as ApiPayload
  );
}
