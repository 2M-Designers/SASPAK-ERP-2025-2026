export interface PrioritySummary {
  priority: string;
  totalCount: number;
  openCount: number;
  closedCount: number;
}

export interface EquipmentSummary {
  equipment: string;
  priority: string;
  openCount: number;
}

export interface AuditTypeSummary {
  auditTypeID: number;
  category: string;
  priority: string;
  openCount: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  monthName: string;
  priority: string;
  openCount: number;
}

export interface AuditTypeTable {
  auditType: string;
  critical: number;
  deficientMajor: number;
  consideredMinor: number;
  advisoryObservation: number;
  total: number;
}
