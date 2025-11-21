// components/audit-tabs.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ChevronLeft } from "lucide-react";

interface AuditTabsProps {
  activeTab: string;
  type: "add" | "edit";
  children: React.ReactNode;
}

const tabs = [
  { id: "actionable", label: "Actionable Items" },
  { id: "open", label: "Open Items" },
  { id: "closed", label: "Closed Items" },
  { id: "stats", label: "Actionable Item Stats" },
  { id: "summary", label: "Summary Report" },
  { id: "full", label: "Full Audit" },
  { id: "audit-stats", label: "Audit Stats" },
];

export function AuditTabs({ activeTab, type, children }: AuditTabsProps) {
  const router = useRouter();

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Back button and title */}
      <div className='flex items-center justify-between mb-6'>
        <Button
          variant='outline'
          onClick={() => router.back()}
          className='gap-1'
        >
          <ChevronLeft className='h-4 w-4' />
          Back
        </Button>
        <h1 className='text-2xl font-bold tracking-tight'>
          {type === "edit" ? "Edit Audit Finding" : "Create New Audit Finding"}
        </h1>
        <div className='w-[100px]'></div>
      </div>

      {/* Tab Navigation */}
      <div className='mb-6 border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8 overflow-x-auto'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => router.push(`/your-route/${tab.id}`)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                tab.id === activeTab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
