"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ChargesDialog from "@/views/dialogs/general-dialogs/dialog-charges";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type ChargesPageProps = {
  initialData: any[];
};

// Static field configuration
const fieldConfig = [
  {
    fieldName: "chargeId",
    displayName: "Charge ID",
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
    fieldName: "chargeCode",
    displayName: "Charge Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "chargeName",
    displayName: "Charge Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "chargeType",
    displayName: "Charge Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "chargeGroup",
    displayName: "Charge Group",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "revenueGLAccountId",
    displayName: "Revenue GL Account",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "costGLAccountId",
    displayName: "Cost GL Account",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isTaxable",
    displayName: "Taxable",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "defaultTaxPercentage",
    displayName: "Tax Percentage",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isReimbursable",
    displayName: "Reimbursable",
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
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

// Dummy GL Accounts data
const dummyGLAccounts = [
  { id: 1, name: "Revenue Account 1", code: "REV001" },
  { id: 2, name: "Revenue Account 2", code: "REV002" },
  { id: 3, name: "Cost Account 1", code: "COS001" },
  { id: 4, name: "Cost Account 2", code: "COS002" },
  { id: 5, name: "Revenue Account 3", code: "REV003" },
  { id: 6, name: "Cost Account 3", code: "COS003" },
];

// Charge Types
const chargeTypes = [
  "Freight",
  "Handling",
  "Customs",
  "Insurance",
  "Storage",
  "Documentation",
  "Other",
];

export default function ChargesPage({ initialData }: ChargesPageProps) {
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
          <ChargesDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.chargeId === updatedItem.chargeId ? updatedItem : item
                )
              );
              router.refresh();
            }}
          >
            <button className='text-blue-600 hover:text-blue-800'>
              <FiEdit size={16} />
            </button>
          </ChargesDialog>
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
    // Charge Code
    {
      accessorKey: "chargeCode",
      header: "Charge Code",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("chargeCode") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Charge Name
    {
      accessorKey: "chargeName",
      header: "Charge Name",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("chargeName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Charge Type
    {
      accessorKey: "chargeType",
      header: "Charge Type",
      cell: ({ row }) => <span>{row.getValue("chargeType") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Charge Group
    {
      accessorKey: "chargeGroup",
      header: "Charge Group",
      cell: ({ row }) => <span>{row.getValue("chargeGroup") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Revenue GL Account
    {
      accessorKey: "revenueGLAccountId",
      header: "Revenue GL Account",
      cell: ({ row }) => {
        const revenueAccountId = row.getValue("revenueGLAccountId");
        const revenueAccount = dummyGLAccounts.find(
          (acc) => acc.id === revenueAccountId
        );
        return (
          <span>
            {revenueAccount
              ? `${revenueAccount.code} - ${revenueAccount.name}`
              : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Cost GL Account
    {
      accessorKey: "costGLAccountId",
      header: "Cost GL Account",
      cell: ({ row }) => {
        const costAccountId = row.getValue("costGLAccountId");
        const costAccount = dummyGLAccounts.find(
          (acc) => acc.id === costAccountId
        );
        return (
          <span>
            {costAccount ? `${costAccount.code} - ${costAccount.name}` : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Is Taxable
    {
      accessorKey: "isTaxable",
      header: "Taxable",
      cell: ({ row }) => {
        const isTaxable = row.getValue("isTaxable");
        return isTaxable ? (
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
    // Default Tax Percentage
    {
      accessorKey: "defaultTaxPercentage",
      header: "Tax Percentage",
      cell: ({ row }) => {
        const taxPercentage = row.getValue("defaultTaxPercentage");
        const taxNum =
          typeof taxPercentage === "number"
            ? taxPercentage
            : parseFloat(String(taxPercentage));
        return !isNaN(taxNum) ? (
          <span className='font-mono'>{taxNum.toFixed(2)}%</span>
        ) : (
          <span>-</span>
        );
      },
      enableColumnFilter: false,
    },
    // Is Reimbursable
    {
      accessorKey: "isReimbursable",
      header: "Reimbursable",
      cell: ({ row }) => {
        const isReimbursable = row.getValue("isReimbursable");
        return isReimbursable ? (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
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
    // Remarks
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <span
          className='max-w-[200px] truncate'
          title={row.getValue("remarks") || ""}
        >
          {row.getValue("remarks") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Charges");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((charge: any) => {
      const row = displayedFields.map((field) => charge[field.fieldName] || "");
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "ChargesMaster.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleCharges");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "isTaxable":
        case "isReimbursable":
        case "isActive":
          return true;
        case "defaultTaxPercentage":
          return 18.0;
        case "chargeCode":
          return "FRE001";
        case "chargeName":
          return "Freight Charge";
        case "chargeType":
          return "Freight";
        case "chargeGroup":
          return "Transportation";
        case "revenueGLAccountId":
          return 1;
        case "costGLAccountId":
          return 3;
        case "remarks":
          return "Sample remarks for freight charge";
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileCharges.xlsx");
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
                field.fieldName === "isTaxable" ||
                field.fieldName === "isReimbursable" ||
                field.fieldName === "isActive"
              ) {
                value = Boolean(value);
              } else if (field.fieldName === "defaultTaxPercentage") {
                value = parseFloat(value) || 0;
              } else if (
                field.fieldName === "revenueGLAccountId" ||
                field.fieldName === "costGLAccountId"
              ) {
                value = parseInt(value) || 0;
              }
              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}ChargesMaster`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Charges imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing charges. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.chargeName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}ChargesMaster/${item.chargeId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.chargeId !== item.chargeId)
          );
          alert("Charge deleted successfully.");
        } else {
          throw new Error("Failed to delete charge");
        }
      } catch (error) {
        alert("Error deleting charge. Please try again.");
        console.error("Error deleting charge:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Charges Master</h1>
      <div className='flex justify-between items-center mb-4'>
        <ChargesDialog
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
            placeholder='🔍 Search charges...'
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
          searchBy='chargeName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No charges found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first charge using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
