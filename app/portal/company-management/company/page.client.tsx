"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import CompanyDialog from "@/views/dialogs/company-dialogs/dialog-company";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";

type CompanyPageProps = {
  initialData: any[];
};

// Static field configuration from the API result
const fieldConfig = [
  {
    fieldName: "CompanyId",
    displayName: "CompanyId",
    isdisplayed: false,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "int",
    isquoted: false,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "LogoUrl",
    displayName: "Company Logo",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "image",
    isquoted: true,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "CompanyCode",
    displayName: "Company Code",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "string",
    isquoted: true,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "CompanyName",
    displayName: "Company Name",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "string",
    isquoted: true,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "LegalName",
    displayName: "Legal Name",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "string",
    isquoted: true,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "TaxIdnumber",
    displayName: "Tax Number",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "string",
    isquoted: true,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "AddressLine1",
    displayName: "Address",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "string",
    isquoted: true,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "Phone",
    displayName: "Phone",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "string",
    isquoted: true,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
  {
    fieldName: "IsActive",
    displayName: "Is Active",
    isdisplayed: true,
    isselected: true,
    routeTo: null,
    displayType: null,
    dataType: "bool",
    isquoted: false,
    alias: null,
    isDefaultSort: null,
    isDefaultSortDesc: null,
    enumList: null,
  },
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function CompanyPage({ initialData }: CompanyPageProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <CompanyDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.companyId === updatedItem.companyId ? updatedItem : item
                )
              );
              router.refresh();
            }}
          >
            <button className='text-blue-600 hover:text-blue-800'>
              <FiEdit size={16} />
            </button>
          </CompanyDialog>
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
    // Company Logo
    {
      accessorKey: "logoUrl",
      header: "Company Logo",
      cell: ({ row }) => {
        const value = row.getValue("logoUrl");
        return value ? (
          <div className='w-12 h-12 relative'>
            <Image
              src={value as string}
              alt='Company Logo'
              fill
              className='object-cover rounded'
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        ) : (
          <span className='text-gray-400 text-sm'>No Logo</span>
        );
      },
      enableColumnFilter: false,
    },
    // Company Code
    {
      accessorKey: "companyCode",
      header: "Company Code",
      cell: ({ row }) => <span>{row.getValue("companyCode") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Company Name
    {
      accessorKey: "companyName",
      header: "Company Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("companyName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Legal Name
    {
      accessorKey: "legalName",
      header: "Legal Name",
      cell: ({ row }) => <span>{row.getValue("legalName") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Tax Number
    {
      accessorKey: "taxIdnumber",
      header: "Tax Number",
      cell: ({ row }) => <span>{row.getValue("taxIdnumber") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Address
    {
      accessorKey: "addressLine1",
      header: "Address",
      cell: ({ row }) => <span>{row.getValue("addressLine1") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Phone
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span>{row.getValue("phone") || "-"}</span>,
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
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Companies");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((company: any) => {
      const row = displayedFields.map((field) => company[field.fieldName]);
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "Companies.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleCompanies");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.dataType) {
        case "string":
          return `Sample ${field.displayName}`;
        case "int":
          return 1;
        case "bool":
          return true;
        case "image":
          return "https://example.com/logo.png";
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileCompanies.xlsx");
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
              // Convert data types as needed
              let value = row[index];
              if (field.dataType === "bool") {
                value = Boolean(value);
              } else if (field.dataType === "int") {
                value = parseInt(value) || 0;
              }
              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}Company`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Companies imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing companies. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.companyName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Company/${item.companyId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.companyId !== item.companyId)
          );
          alert("Company deleted successfully.");
        } else {
          throw new Error("Failed to delete company");
        }
      } catch (error) {
        alert("Error deleting company. Please try again.");
        console.error("Error deleting company:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Companies</h1>
      <div className='flex justify-between items-center mb-4'>
        <CompanyDialog
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
            placeholder='🔍 Search companies...'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='min-w-[250px]'
          />
        </div>
      </div>

      <AppDataTable
        data={filteredData ?? []}
        loading={data === null}
        columns={columns}
        searchText={searchText}
        searchBy='companyName'
        isPage
        isMultiSearch
      />

      {isLoading && <AppLoader />}
    </div>
  );
}
