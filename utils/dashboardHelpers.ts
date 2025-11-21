import { MonthlyTrend } from "@/types/dashboard";

export const getPriorityColor = (priority: string) => {
  const map: Record<string, string> = {
    priority1: "bg-red-500",
    priority2: "bg-yellow-500",
    priority3: "bg-teal-500",
    priority4: "bg-blue-500",
  };
  return map[priority.toLowerCase()] || "bg-gray-400";
};

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export function transformMonthlyTrend(data: any[]): MonthlyTrend[] {
  return data.map((item) => ({
    month: item.month,
    priority: item.priority,
    openCount: item.openCount,
    year: item.year ?? new Date().getFullYear(),
    monthName: item.monthName ?? "",
  }));
}
