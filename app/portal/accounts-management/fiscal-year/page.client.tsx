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
import FiscalYearForm from "@/views/forms/accounting/fiscal-year-form";

type FiscalYearPageProps = {
  initialData: any[];
};

// Static field configuration for FiscalYear
const fieldConfig = [
  {
    fieldName: "fiscalYearId",
    displayName: "Fiscal Year ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "companyId",
    displayName: "Company ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "fiscalYearName",
    displayName: "Fiscal Year Name",
    isdisplayed: false,
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
    fieldName: "isActive",
    displayName: "Status",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "version",
    displayName: "Version",
    isdisplayed: false,
    isselected: true,
  },
];

const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected,
);

export default function FiscalYearPage({ initialData }: FiscalYearPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"add" | "edit">("add");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<any>({});

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

  const handleAddEdit = (fiscalYear: any) => {
    if (formType === "add") {
      setData((prev) => [...prev, fiscalYear]);
    } else {
      setData((prev) =>
        prev.map((item) =>
          item.fiscalYearId === fiscalYear.fiscalYearId ? fiscalYear : item
        )
      );
    }
    setShowForm(false);
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
              setSelectedFiscalYear(row.original);
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
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");
        return isActive ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Inactive
          </span>
        );
      },
      enableColumnFilter: false,
    },
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("FiscalYears");

    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    data.forEach((fiscalYear: any) => {
      const row = displayedFields.map((field) => {
        const value = fiscalYear[field.fieldName];
        if (["startDate", "endDate"].includes(field.fieldName)) {
          return value ? new Date(value) : "";
        }
        if (field.fieldName === "isActive") {
          return value ? "Active" : "Inactive";
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
      saveAs(new Blob([buffer]), "FiscalYears.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleFiscalYears");

    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "startDate":
          return new Date("2024-01-01");
        case "endDate":
          return new Date("2024-12-31");
        case "isActive":
          return "Active";
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
      saveAs(new Blob([buffer]), "SampleFile_FiscalYears.xlsx");
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
              if (field.fieldName === "isActive") {
                value = value === "Active" || value === true;
              }
              if (field.fieldName === "version") {
                value = Number(value) || 0;
              }
              payload[field.fieldName] = value;
            }
          });
          // Add companyId from localStorage
          const user = localStorage.getItem("user");
          let companyId = 1;
          if (user) {
            try {
              const u = JSON.parse(user);
              companyId = u?.companyId || 1;
            } catch (error) {
              console.error("Error parsing user JSON:", error);
            }
          }
          payload.companyId = companyId;
          
          await fetch(`${baseUrl}FiscalYear`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }),
      );
      setIsLoading(false);
      alert("Fiscal years imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing fiscal years. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (
      confirm(
        `Are you sure you want to delete fiscal year starting from ${formatDate(item.startDate)} to ${formatDate(item.endDate)}?`,
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}FiscalYear/${item.fiscalYearId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.fiscalYearId !== item.fiscalYearId),
          );
          alert("Fiscal year deleted successfully.");
        } else {
          throw new Error("Failed to delete fiscal year");
        }
      } catch (error) {
        alert("Error deleting fiscal year. Please try again.");
        console.error("Error deleting fiscal year:", error);
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
        <FiscalYearForm
          type={formType}
          defaultState={selectedFiscalYear}
          handleAddEdit={handleAddEdit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className="p-6 bg-white shadow-md rounded-md">
          <h1 className="text-2xl font-bold mb-4">Fiscal Years</h1>
          <div className="flex justify-between items-center mb-4">
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                setFormType("add");
                setSelectedFiscalYear({});
                setShowForm(true);
              }}
            >
              <Plus size={16} />
              Add Fiscal Year
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
                placeholder="🔍 Search fiscal years..."
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
              searchBy="startDate"
              isPage
              isMultiSearch
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No fiscal years found</p>
              <p className="text-gray-400 text-sm mt-2">
                {initialData === null
                  ? "Loading..."
                  : "Add your first fiscal year using the button above"}
              </p>
            </div>
          )}

          {isLoading && <AppLoader />}
        </div>
      )}
    </>
  );
}