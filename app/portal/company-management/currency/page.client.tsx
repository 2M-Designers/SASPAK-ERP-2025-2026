"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import CurrencyDialog from "@/views/dialogs/company-dialogs/dialog-currency";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type CurrencyPageProps = {
  initialData: any[];
};

// Static field configuration
const fieldConfig = [
  {
    fieldName: "currencyId",
    displayName: "Currency ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "currencyCode",
    displayName: "Currency Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "currencyName",
    displayName: "Currency Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "symbol",
    displayName: "Symbol",
    isdisplayed: true,
    isselected: true,
  },
  /*{
    fieldName: "exchangeRate",
    displayName: "Exchange Rate",
    isdisplayed: true,
    isselected: true,
  },*/
  {
    fieldName: "isDefault",
    displayName: "Default Currency",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isActive",
    displayName: "Status",
    isdisplayed: true,
    isselected: true,
  },
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function CurrencyPage({ initialData }: CurrencyPageProps) {
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

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <CurrencyDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.currencyId === updatedItem.currencyId
                    ? updatedItem
                    : item
                )
              );
              router.refresh();
            }}
          >
            <button className='text-blue-600 hover:text-blue-800'>
              <FiEdit size={16} />
            </button>
          </CurrencyDialog>
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
    // Currency ID
    {
      accessorKey: "currencyId",
      header: "Currency ID",
      cell: ({ row }) => <span>{row.getValue("currencyId") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Currency Code
    {
      accessorKey: "currencyCode",
      header: "Currency Code",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("currencyCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Currency Name
    {
      accessorKey: "currencyName",
      header: "Currency Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("currencyName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Symbol
    {
      accessorKey: "symbol",
      header: "Symbol",
      cell: ({ row }) => <span>{row.getValue("symbol") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Exchange Rate
    /*{
      accessorKey: "exchangeRate",
      header: "Exchange Rate",
      cell: ({ row }) => (
        <span className='font-mono'>
          {parseFloat(row.getValue("exchangeRate") || 0).toFixed(4)}
        </span>
      ),
      enableColumnFilter: false,
    },*/
    // Is Default
    {
      accessorKey: "isDefault",
      header: "Default Currency",
      cell: ({ row }) => {
        const isDefault = row.getValue("isDefault");
        return isDefault ? (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            Yes
          </span>
        ) : (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
            No
          </span>
        );
      },
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
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Currencies");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((currency: any) => {
      const row = displayedFields.map(
        (field) => currency[field.fieldName] || ""
      );
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "Currencies.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleCurrencies");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "isDefault":
        case "isActive":
          return true;
        case "exchangeRate":
          return 1.0;
        case "currencyCode":
          return "USD";
        case "currencyName":
          return "US Dollar";
        case "symbol":
          return "$";
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileCurrencies.xlsx");
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
              if (
                field.fieldName === "isDefault" ||
                field.fieldName === "isActive"
              ) {
                value = Boolean(value);
              }
              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}SetupCurrency`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Currencies imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing currencies. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.currencyName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}SetupCurrency/${item.currencyId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.currencyId !== item.currencyId)
          );
          alert("Currency deleted successfully.");
        } else {
          throw new Error("Failed to delete currency");
        }
      } catch (error) {
        alert("Error deleting currency. Please try again.");
        console.error("Error deleting currency:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Currency Setup</h1>
      <div className='flex justify-between items-center mb-4'>
        <CurrencyDialog
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
            placeholder='🔍 Search currencies...'
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
          searchBy='currencyName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No currencies found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first currency using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
