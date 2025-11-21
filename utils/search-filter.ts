// ============================================
// UTILITY: Advanced Search & Filter
// File: @/utils/search-filter.ts
// ============================================

export class SearchFilter {
  static filterData<T>(
    data: T[],
    searchTerm: string,
    searchFields: string[]
  ): T[] {
    if (!searchTerm) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter((item: any) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(lowerSearchTerm);
      });
    });
  }

  static advancedFilter<T>(data: T[], filters: Record<string, any>): T[] {
    return data.filter((item: any) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === "") return true;

        const itemValue = item[key];

        if (typeof value === "boolean") {
          return itemValue === value;
        }

        if (typeof value === "string") {
          return itemValue
            ?.toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        }

        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }

        return itemValue === value;
      });
    });
  }

  static sortData<T>(
    data: T[],
    sortBy: string,
    sortOrder: "asc" | "desc" = "asc"
  ): T[] {
    return [...data].sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }
}
