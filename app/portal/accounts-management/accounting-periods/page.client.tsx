"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import AccountingPeriodForm from "@/views/forms/accounting/accounting-period-form";

type AccountingPeriodPageProps = {
  initialData: any[];
};

// Static field configuration for AccountingPeriod
const fieldConfig = [
  {
    fieldName: "accountingPeriodId",
    displayName: "Accounting Period ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "fiscalYearId",
    displayName: "Fiscal Year ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "periodName",
    displayName: "Period Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "startDate",
    displayName: "Start Date",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "endDate",
    displayName: "End Date",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "status",
    displayName: "Status",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "version",
    displayName: "Version",
    isdisplayed: true,
    isselected: true,
  },
];

const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected,
);

export default function AccountingPeriodPage({ initialData }: AccountingPeriodPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"add" | "edit">("add");
  const [selectedPeriod, setSelectedPeriod] = useState<any>({});

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setData(initialData);
    } else {
      setData([]);
    }
  }, [initialData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleAddEdit = (period: any) => {
    if (formType === "add") {
      setData((prev) => [...prev, period]);
    } else {
      setData((prev) =>
        prev.map((item) =>
          item.accountingPeriodId === period.accountingPeriodId ? period : item
        )
      );
    }
    setShowForm(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:text-blue-800"
            onClick={() => {
              setFormType("edit");
              setSelectedPeriod(row.original);
              setShowForm(true);
            }}
          >
            <FiEdit size={16} />
          </button>
          <button
            className="text-red-600 hover:text-red-800"
            onClick={() => handleDelete(row.original)}
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "row",
      header: "S.No",
      cell: ({ row }) => parseInt(row.id) + 1,
      enableColumnFilter: false,
    },
    {
      accessorKey: "periodName",
      header: "Period Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue("periodName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => <span>{formatDate(row.getValue("startDate"))}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => <span>{formatDate(row.getValue("endDate"))}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string | undefined;
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
          >
            {status ?? "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => <span>{row.getValue("version") || "-"}</span>,
      enableColumnFilter: false,
    },
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("AccountingPeriods");

    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    data.forEach((period: any) => {
      const row = displayedFields.map((field) => {
        const value = period[field.fieldName];
        if (["startDate", "endDate"].includes(field.fieldName)) {
          return value ? new Date(value) : "";
        }
        return value || "";
      });
      worksheet.addRow(row);
    });

    const dateColumns = displayedFields
      .map((field, index) =>
        ["startDate", "endDate"].includes(field.fieldName) ? index + 1 : null,
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "AccountingPeriods.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleAccountingPeriods");

    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "periodName":
          return "Jul-2024";
        case "startDate":
          return new Date("2024-07-01");
        case "endDate":
          return new Date("2024-07-31");
        case "status":
          return "Open";
        case "version":
          return 1;
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    const dateColumns = displayedFields
      .map((field, index) =>
        ["startDate", "endDate"].includes(field.fieldName) ? index + 1 : null,
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_AccountingPeriods.xlsx");
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    readXlsxFile(event.target.files[0]).then((rows: any) => {
      setIsLoading(true);
      insertData(rows.slice(1));
    });
  };

  const insertData = async (newData: any[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    try {
      await Promise.all(
        newData.map(async (row) => {
          const payload: any = {};
          displayedFields.forEach((field, index) => {
            if (index < row.length) {
              let value = row[index];
              if (["startDate", "endDate"].includes(field.fieldName)) {
                if (value) value = new Date(value).toISOString();
              }
              if (field.fieldName === "version") {
                value = Number(value) || 1;
              }
              payload[field.fieldName] = value;
            }
          });
          await fetch(`${baseUrl}AccountingPeriod`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }),
      );
      setIsLoading(false);
      alert("Accounting periods imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing accounting periods. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (
      confirm(
        `Are you sure you want to delete accounting period "${item.periodName}"?`,
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}AccountingPeriod/${item.accountingPeriodId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.accountingPeriodId !== item.accountingPeriodId),
          );
          alert("Accounting period deleted successfully.");
        } else {
          throw new Error("Failed to delete accounting period");
        }
      } catch (error) {
        alert("Error deleting accounting period. Please try again.");
        console.error("Error deleting accounting period:", error);
      }
    }
  };

  const filteredData = data?.filter((item: any) =>
    Object.values(item).some((value: any) =>
      value?.toString().toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  return (
    <>
      {showForm ? (
        <AccountingPeriodForm
          type={formType}
          defaultState={selectedPeriod}
          handleAddEdit={handleAddEdit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className="p-6 bg-white shadow-md rounded-md">
          <h1 className="text-2xl font-bold mb-4">Accounting Periods</h1>
          <div className="flex justify-between items-center mb-4">
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                setFormType("add");
                setSelectedPeriod({});
                setShowForm(true);
              }}
            >
              <Plus size={16} />
              Add Accounting Period
            </Button>

            <div className="flex gap-3 items-center">
              <Button
                onClick={downloadSampleExcel}
                className="flex items-center gap-2"
                variant="outline"
              >
                <FiDownload />
                Sample File
              </Button>
              <Button
                onClick={downloadExcelWithData}
                className="flex items-center gap-2"
                variant="outline"
                disabled={!data || data.length === 0}
              >
                <FiDownload />
                Export to Excel
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Import:</span>
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="w-auto"
                />
              </div>
              <Input
                type="text"
                placeholder="🔍 Search accounting periods..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="min-w-[250px]"
              />
            </div>
          </div>

          {data && data.length > 0 ? (
            <AppDataTable
              data={filteredData ?? []}
              loading={isLoading}
              columns={columns}
              searchText={searchText}
              searchBy="periodName"
              isPage
              isMultiSearch
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No accounting periods found</p>
              <p className="text-gray-400 text-sm mt-2">
                {initialData === null
                  ? "Loading..."
                  : "Add your first accounting period using the button above"}
              </p>
            </div>
          )}

          {isLoading && <AppLoader />}
        </div>
      )}
    </>
  );
}