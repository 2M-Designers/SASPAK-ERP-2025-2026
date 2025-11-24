"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import CostCenterDialog from "@/views/dialogs/general-dialogs/dialog-costcenter";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type CostCenterPageProps = {
  initialData: any[];
};

// Static field configuration for CostCenter
const fieldConfig = [
  {
    fieldName: "costCenterId",
    displayName: "Cost Center ID",
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
    fieldName: "costCenterCode",
    displayName: "Cost Center Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "costCenterName",
    displayName: "Cost Center Name",
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

export default function CostCenterPage({ initialData }: CostCenterPageProps) {
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
          <CostCenterDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.costCenterId === updatedItem.costCenterId
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
          </CostCenterDialog>
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
    // Cost Center Code
    {
      accessorKey: "costCenterCode",
      header: "Cost Center Code",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("costCenterCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Cost Center Name
    {
      accessorKey: "costCenterName",
      header: "Cost Center Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("costCenterName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Description
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className='max-w-md truncate'>
          {row.getValue("description") || "-"}
        </span>
      ),
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
    const worksheet = workbook.addWorksheet("CostCenters");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((costCenter: any) => {
      const row = displayedFields.map(
        (field) => costCenter[field.fieldName] || ""
      );
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "Cost_Centers.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleCostCenters");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "costCenterCode":
          return "CC001";
        case "costCenterName":
          return "Marketing Department";
        case "description":
          return "Marketing and advertising expenses";
        case "isActive":
          return true;
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_Cost_Centers.xlsx");
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

              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}CostCenter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Cost Centers imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing Cost Centers. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.costCenterName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}CostCenter/${item.costCenterId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) => record.costCenterId !== item.costCenterId
            )
          );
          alert("Cost Center deleted successfully.");
        } else {
          throw new Error("Failed to delete Cost Center");
        }
      } catch (error) {
        alert("Error deleting Cost Center. Please try again.");
        console.error("Error deleting Cost Center:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Cost Centers</h1>
      <div className='flex justify-between items-center mb-4'>
        <CostCenterDialog
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
            placeholder='🔍 Search cost centers...'
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
          searchBy='costCenterName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No cost centers found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first cost center using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
