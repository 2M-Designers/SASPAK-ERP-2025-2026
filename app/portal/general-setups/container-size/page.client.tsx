"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ContainerSizeDialog from "@/views/dialogs/general-dialogs/dialog-container-size";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type ContainerSizePageProps = {
  initialData: any[];
};

// Static field configuration
const fieldConfig = [
  {
    fieldName: "containerSizeId",
    displayName: "Container Size ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "sizeCode",
    displayName: "Size Code",
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
    fieldName: "lengthFeet",
    displayName: "Length (Feet)",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "heightFeet",
    displayName: "Height (Feet)",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "widthFeet",
    displayName: "Width (Feet)",
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
    fieldName: "companyId",
    displayName: "Company ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "createdBy",
    displayName: "Created By",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "createdAt",
    displayName: "Created At",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "updatedAt",
    displayName: "Updated At",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "version",
    displayName: "Version",
    isdisplayed: false,
    isselected: true,
  },
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function SetupContainerSizePage({
  initialData,
}: ContainerSizePageProps) {
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <ContainerSizeDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.containerSizeId === updatedItem.containerSizeId
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
          </ContainerSizeDialog>
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

    // Size Code
    {
      accessorKey: "sizeCode",
      header: "Size Code",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("sizeCode") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Description
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span>{row.getValue("description") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Length (Feet)
    {
      accessorKey: "lengthFeet",
      header: "Length (Feet)",
      cell: ({ row }) => {
        const length = row.getValue("lengthFeet");
        const lengthNum =
          typeof length === "number" ? length : parseFloat(String(length));
        return !isNaN(lengthNum) ? (
          <span className='font-mono'>{lengthNum.toFixed(2)} ft</span>
        ) : (
          <span>-</span>
        );
      },
      enableColumnFilter: false,
    },
    // Height (Feet)
    {
      accessorKey: "heightFeet",
      header: "Height (Feet)",
      cell: ({ row }) => {
        const height = row.getValue("heightFeet");
        const heightNum =
          typeof height === "number" ? height : parseFloat(String(height));
        return !isNaN(heightNum) ? (
          <span className='font-mono'>{heightNum.toFixed(2)} ft</span>
        ) : (
          <span>-</span>
        );
      },
      enableColumnFilter: false,
    },
    // Width (Feet)
    {
      accessorKey: "widthFeet",
      header: "Width (Feet)",
      cell: ({ row }) => {
        const width = row.getValue("widthFeet");
        const widthNum =
          typeof width === "number" ? width : parseFloat(String(width));
        return !isNaN(widthNum) ? (
          <span className='font-mono'>{widthNum.toFixed(2)} ft</span>
        ) : (
          <span>-</span>
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
    // Created At
    /*{
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span className='text-sm text-gray-600'>
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      enableColumnFilter: false,
    },*/
    // Updated At
    /*{
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => (
        <span className='text-sm text-gray-600'>
          {formatDate(row.getValue("updatedAt"))}
        </span>
      ),
      enableColumnFilter: false,
    },*/
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ContainerSizes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((containerSize: any) => {
      const row = displayedFields.map((field) => {
        if (
          field.fieldName === "createdAt" ||
          field.fieldName === "updatedAt"
        ) {
          return formatDate(containerSize[field.fieldName] || "");
        }
        return containerSize[field.fieldName] || "";
      });
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "ContainerSizes.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleContainerSizes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "sizeCode":
          return "20FT";
        case "description":
          return "Standard 20-foot container";
        case "lengthFeet":
          return 20.0;
        case "heightFeet":
          return 8.5;
        case "widthFeet":
          return 8.0;
        case "isActive":
          return true;
        case "companyId":
          return 1;
        case "createdBy":
          return "admin";
        case "createdAt":
          return new Date().toISOString();
        case "updatedAt":
          return new Date().toISOString();
        case "version":
          return 1;
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    // Add another sample row
    const sampleRow2 = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "sizeCode":
          return "40FT";
        case "description":
          return "Standard 40-foot container";
        case "lengthFeet":
          return 40.0;
        case "heightFeet":
          return 8.5;
        case "widthFeet":
          return 8.0;
        case "isActive":
          return true;
        case "companyId":
          return 1;
        case "createdBy":
          return "admin";
        case "createdAt":
          return new Date().toISOString();
        case "updatedAt":
          return new Date().toISOString();
        case "version":
          return 1;
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow2);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileContainerSizes.xlsx");
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
              } else if (
                field.fieldName === "lengthFeet" ||
                field.fieldName === "heightFeet" ||
                field.fieldName === "widthFeet"
              ) {
                value = parseFloat(value) || 0;
              } else if (
                field.fieldName === "companyId" ||
                field.fieldName === "version"
              ) {
                value = parseInt(value) || 0;
              } else if (
                field.fieldName === "createdAt" ||
                field.fieldName === "updatedAt"
              ) {
                // If it's a date string in Excel, convert to ISO string
                if (value instanceof Date) {
                  value = value.toISOString();
                }
              }
              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}SetupContainerSize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Container sizes imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing container sizes. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.sizeCode}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}SetupContainerSize/${item.containerSizeId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) => record.containerSizeId !== item.containerSizeId
            )
          );
          alert("Container size deleted successfully.");
        } else {
          throw new Error("Failed to delete container size");
        }
      } catch (error) {
        alert("Error deleting container size. Please try again.");
        console.error("Error deleting container size:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Container Size Setup</h1>
      <div className='flex justify-between items-center mb-4'>
        <ContainerSizeDialog
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
            placeholder='🔍 Search container sizes...'
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
          searchBy='sizeCode'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No container sizes found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first container size using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
