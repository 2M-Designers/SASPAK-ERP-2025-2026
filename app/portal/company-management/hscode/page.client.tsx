"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import HSCodeDialog from "@/views/dialogs/company-dialogs/dialog-hscode";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type HSCodePageProps = {
  initialData: any[];
};

// Static field configuration for HSCode
const fieldConfig = [
  {
    fieldName: "hsCodeId",
    displayName: "HS Code ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "parentHsCodeId",
    displayName: "Parent HS Code ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "code",
    displayName: "HS Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "description",
    displayName: "Description",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "chapter",
    displayName: "Chapter",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "heading",
    displayName: "Heading",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "customsDutyRate",
    displayName: "Customs Duty Rate",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "salesTaxRate",
    displayName: "Sales Tax Rate",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "regulatoryDutyRate",
    displayName: "Regulatory Duty Rate",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "additionalDutyRate",
    displayName: "Additional Duty Rate",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "uoM",
    displayName: "Unit of Measure",
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
    fieldName: "remarks",
    displayName: "Remarks",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "effectiveFrom",
    displayName: "Effective From",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "validTill",
    displayName: "Valid Till",
    isdisplayed: true,
    isselected: true,
  },
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function HSCodePage({ initialData }: HSCodePageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  useEffect(() => {
    console.log("Initial Data received:", initialData);
    if (initialData && Array.isArray(initialData)) {
      setData(initialData);
    } else {
      console.warn("Initial data is not an array:", initialData);
      setData([]);
    }
  }, [initialData]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format percentage for display
  const formatPercentage = (value: number) => {
    if (value === null || value === undefined) return "-";
    return `${value}%`;
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <HSCodeDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.hsCodeId === updatedItem.hsCodeId ? updatedItem : item
                )
              );
              router.refresh();
            }}
          >
            <button className='text-blue-600 hover:text-blue-800'>
              <FiEdit size={16} />
            </button>
          </HSCodeDialog>
          <button
            className='text-red-600 hover:text-red-800'
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
    // HS Code
    {
      accessorKey: "code",
      header: "HS Code",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("code") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Description
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("description") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Chapter
    {
      accessorKey: "chapter",
      header: "Chapter",
      cell: ({ row }) => <span>{row.getValue("chapter") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Heading
    {
      accessorKey: "heading",
      header: "Heading",
      cell: ({ row }) => <span>{row.getValue("heading") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Customs Duty Rate
    {
      accessorKey: "customsDutyRate",
      header: "Customs Duty",
      cell: ({ row }) => (
        <span className='text-right'>
          {formatPercentage(row.getValue("customsDutyRate"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Sales Tax Rate
    {
      accessorKey: "salesTaxRate",
      header: "Sales Tax",
      cell: ({ row }) => (
        <span className='text-right'>
          {formatPercentage(row.getValue("salesTaxRate"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Regulatory Duty Rate
    {
      accessorKey: "regulatoryDutyRate",
      header: "Regulatory Duty",
      cell: ({ row }) => (
        <span className='text-right'>
          {formatPercentage(row.getValue("regulatoryDutyRate"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Additional Duty Rate
    {
      accessorKey: "additionalDutyRate",
      header: "Additional Duty",
      cell: ({ row }) => (
        <span className='text-right'>
          {formatPercentage(row.getValue("additionalDutyRate"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Unit of Measure
    {
      accessorKey: "uoM",
      header: "UoM",
      cell: ({ row }) => <span>{row.getValue("uoM") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Is Active
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");
        return isActive ? (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            Active
          </span>
        ) : (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            Inactive
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Effective From
    {
      accessorKey: "effectiveFrom",
      header: "Effective From",
      cell: ({ row }) => (
        <span>{formatDate(row.getValue("effectiveFrom"))}</span>
      ),
      enableColumnFilter: false,
    },
    // Valid Till
    {
      accessorKey: "validTill",
      header: "Valid Till",
      cell: ({ row }) => <span>{formatDate(row.getValue("validTill"))}</span>,
      enableColumnFilter: false,
    },
    // Remarks
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => <span>{row.getValue("remarks") || "-"}</span>,
      enableColumnFilter: false,
    },
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("HSCodes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((hscode: any) => {
      const row = displayedFields.map((field) => {
        const value = hscode[field.fieldName];

        // Format dates for Excel
        if (
          (field.fieldName === "effectiveFrom" ||
            field.fieldName === "validTill") &&
          value
        ) {
          return new Date(value);
        }

        return value || "";
      });
      worksheet.addRow(row);
    });

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "effectiveFrom" || field.fieldName === "validTill"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "HS_Codes.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleHSCodes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "code":
          return "0101.21.10";
        case "description":
          return "Live purebred breeding horses";
        case "chapter":
          return "01";
        case "heading":
          return "0101";
        case "customsDutyRate":
          return 5;
        case "salesTaxRate":
          return 17;
        case "regulatoryDutyRate":
          return 0;
        case "additionalDutyRate":
          return 0;
        case "uoM":
          return "Number";
        case "isActive":
          return true;
        case "remarks":
          return "Sample HS Code entry";
        case "effectiveFrom":
          return new Date();
        case "validTill":
          return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "effectiveFrom" || field.fieldName === "validTill"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_HS_Codes.xlsx");
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    readXlsxFile(event.target.files[0]).then((rows: any) => {
      setIsLoading(true);
      insertData(rows.slice(1)); // Skip header row
    });
  };

  const insertData = async (newData: any[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    try {
      await Promise.all(
        newData.map(async (row) => {
          // Create payload object by mapping Excel columns to field names
          const payload: any = {};
          displayedFields.forEach((field, index) => {
            if (index < row.length) {
              let value = row[index];

              // Handle boolean fields
              if (field.fieldName === "isActive") {
                value = Boolean(value);
              }

              // Handle numeric fields
              if (
                field.fieldName === "customsDutyRate" ||
                field.fieldName === "salesTaxRate" ||
                field.fieldName === "regulatoryDutyRate" ||
                field.fieldName === "additionalDutyRate"
              ) {
                value = parseFloat(value) || 0;
              }

              // Handle date fields
              if (
                field.fieldName === "effectiveFrom" ||
                field.fieldName === "validTill"
              ) {
                if (value) {
                  value = new Date(value).toISOString();
                }
              }

              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}HSCode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("HS Codes imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing HS Codes. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete HS Code "${item.code}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}HSCode/${item.hsCodeId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.hsCodeId !== item.hsCodeId)
          );
          alert("HS Code deleted successfully.");
        } else {
          throw new Error("Failed to delete HS Code");
        }
      } catch (error) {
        alert("Error deleting HS Code. Please try again.");
        console.error("Error deleting HS Code:", error);
      }
    }
  };

  const filteredData = data?.filter((item: any) =>
    Object.values(item).some((value: any) =>
      value?.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <div className='p-6 bg-white shadow-md rounded-md'>
      <h1 className='text-2xl font-bold mb-4'>HS Codes</h1>
      <div className='flex justify-between items-center mb-4'>
        <HSCodeDialog
          type='add'
          defaultState={{}}
          handleAddEdit={(newItem: any) => {
            setData((prev: any) => [...(prev || []), newItem]);
            router.refresh();
          }}
        />
        <div className='flex gap-3 items-center'>
          <Button
            onClick={downloadSampleExcel}
            className='flex items-center gap-2'
            variant='outline'
          >
            <FiDownload />
            Sample File
          </Button>
          <Button
            onClick={downloadExcelWithData}
            className='flex items-center gap-2'
            variant='outline'
            disabled={!data || data.length === 0}
          >
            <FiDownload />
            Export to Excel
          </Button>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Import:</span>
            <Input
              type='file'
              accept='.xlsx'
              onChange={handleFileUpload}
              className='w-auto'
            />
          </div>
          <Input
            type='text'
            placeholder='🔍 Search HS Codes...'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='min-w-[250px]'
          />
        </div>
      </div>

      {data && data.length > 0 ? (
        <AppDataTable
          data={filteredData ?? []}
          loading={isLoading}
          columns={columns}
          searchText={searchText}
          searchBy='code'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No HS Codes found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first HS Code using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
