"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ExchangeRateDialog from "@/views/dialogs/general-dialogs/dialog-exchange-rate";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type ExchangeRatesPageProps = {
  initialData: any[];
};

// Static field configuration
const fieldConfig = [
  {
    fieldName: "exchangeRateId",
    displayName: "Exchange Rate ID",
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
    fieldName: "fromCurrencyId",
    displayName: "From Currency",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "toCurrencyId",
    displayName: "To Currency",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "rate",
    displayName: "Exchange Rate",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "effectiveDate",
    displayName: "Effective Date",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "rateExpiryDate",
    displayName: "Expiry Date",
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

export default function ExchangeRatesPage({
  initialData,
}: ExchangeRatesPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log("Initial Data received:", initialData);
    if (initialData && Array.isArray(initialData)) {
      setData(initialData);
    } else {
      console.warn("Initial data is not an array:", initialData);
      setData([]);
    }
    fetchCurrencies();
  }, [initialData]);

  const fetchCurrencies = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}SetupCurrency/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "CurrencyId,CurrencyCode,CurrencyName,Symbol",
          where: "IsActive == true",
          sortOn: "currencyCode",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrencies(data);
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const getCurrencyName = (currencyId: number) => {
    const currency = currencies.find((c) => c.currencyId === currencyId);
    return currency
      ? `${currency.currencyCode} - ${currency.currencyName}`
      : "Unknown";
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <ExchangeRateDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.exchangeRateId === updatedItem.exchangeRateId
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
          </ExchangeRateDialog>
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
    // From Currency
    {
      accessorKey: "fromCurrencyId",
      header: "From Currency",
      cell: ({ row }) => (
        <span className='font-medium'>
          {getCurrencyName(row.getValue("fromCurrencyId"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    // To Currency
    {
      accessorKey: "toCurrencyId",
      header: "To Currency",
      cell: ({ row }) => (
        <span className='font-medium'>
          {getCurrencyName(row.getValue("toCurrencyId"))}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Exchange Rate
    {
      accessorKey: "rate",
      header: "Exchange Rate",
      cell: ({ row }) => (
        <span className='font-mono font-semibold'>
          {parseFloat(String(row.getValue("rate") ?? "0")).toFixed(6)}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Effective Date
    {
      accessorKey: "effectiveDate",
      header: "Effective Date",
      cell: ({ row }) => {
        const dateVal = row.getValue("effectiveDate");
        if (!dateVal) {
          return <span>-</span>;
        }
        // Normalize value to a Date instance safely
        const parsedDate =
          dateVal instanceof Date ? dateVal : new Date(String(dateVal));
        // If parsedDate is invalid, show fallback
        if (isNaN(parsedDate.getTime())) {
          return <span>-</span>;
        }
        return <span>{parsedDate.toLocaleDateString()}</span>;
      },
      enableColumnFilter: false,
    },
    // Rate Expiry Date
    {
      accessorKey: "rateExpiryDate",
      header: "Expiry Date",
      cell: ({ row }) => {
        const date = row.getValue("rateExpiryDate");
        if (!date) {
          return <span className='text-gray-400'>No expiry</span>;
        }
        // Safely parse value into a Date instance
        const parsedDate = date instanceof Date ? date : new Date(String(date));
        if (isNaN(parsedDate.getTime())) {
          return <span className='text-gray-400'>No expiry</span>;
        }
        return <span>{parsedDate.toLocaleDateString()}</span>;
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
    const worksheet = workbook.addWorksheet("ExchangeRates");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((exchangeRate: any) => {
      const row = displayedFields.map((field) => {
        if (
          field.fieldName === "fromCurrencyId" ||
          field.fieldName === "toCurrencyId"
        ) {
          return getCurrencyName(exchangeRate[field.fieldName]);
        } else if (
          field.fieldName === "effectiveDate" ||
          field.fieldName === "rateExpiryDate"
        ) {
          return exchangeRate[field.fieldName]
            ? new Date(exchangeRate[field.fieldName]).toLocaleDateString()
            : "";
        } else if (field.fieldName === "rate") {
          return parseFloat(exchangeRate[field.fieldName] || 0).toFixed(6);
        }
        return exchangeRate[field.fieldName] || "";
      });
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "ExchangeRates.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleExchangeRates");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "isActive":
          return true;
        case "fromCurrencyId":
          return 1; // Assuming USD has ID 1
        case "toCurrencyId":
          return 2; // Assuming EUR has ID 2
        case "rate":
          return 0.85;
        case "effectiveDate":
          return new Date().toISOString().split("T")[0];
        case "rateExpiryDate":
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileExchangeRates.xlsx");
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
              if (field.fieldName === "isActive") {
                value = Boolean(value);
              } else if (field.fieldName === "rate") {
                value = parseFloat(value) || 0;
              } else if (
                field.fieldName === "fromCurrencyId" ||
                field.fieldName === "toCurrencyId"
              ) {
                value = parseInt(value) || 0;
              } else if (
                field.fieldName === "effectiveDate" ||
                field.fieldName === "rateExpiryDate"
              ) {
                value = value ? new Date(value).toISOString() : null;
              }
              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}SetupExchangeRates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Exchange rates imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing exchange rates. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    const fromCurrency = getCurrencyName(item.fromCurrencyId);
    const toCurrency = getCurrencyName(item.toCurrencyId);

    if (
      confirm(
        `Are you sure you want to delete exchange rate from ${fromCurrency} to ${toCurrency}?`
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}SetupExchangeRates/${item.exchangeRateId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) => record.exchangeRateId !== item.exchangeRateId
            )
          );
          alert("Exchange rate deleted successfully.");
        } else {
          throw new Error("Failed to delete exchange rate");
        }
      } catch (error) {
        alert("Error deleting exchange rate. Please try again.");
        console.error("Error deleting exchange rate:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Exchange Rates Setup</h1>
      <div className='flex justify-between items-center mb-4'>
        <ExchangeRateDialog
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
            placeholder='🔍 Search exchange rates...'
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
          searchBy='rate'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No exchange rates found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first exchange rate using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
