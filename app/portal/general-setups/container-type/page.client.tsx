"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ContainerTypeDialog from "@/views/dialogs/general-dialogs/dialog-container-type";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type ContainerTypePageProps = {
  initialData: any[];
};

// Static field configuration
const fieldConfig = [
  {
    fieldName: "containerTypeId",
    displayName: "Container Type ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "typeCode",
    displayName: "Type Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "typeName",
    displayName: "Type Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isHazardousAllowed",
    displayName: "Hazardous Allowed",
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
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function SetupContainerTypePage({
  initialData,
}: ContainerTypePageProps) {
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
          <ContainerTypeDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.containerTypeId === updatedItem.containerTypeId
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
          </ContainerTypeDialog>
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
    // Type Code
    {
      accessorKey: "typeCode",
      header: "Type Code",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("typeCode") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Type Name
    {
      accessorKey: "typeName",
      header: "Type Name",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("typeName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Is Hazardous Allowed
    {
      accessorKey: "isHazardousAllowed",
      header: "Hazardous Allowed",
      cell: ({ row }) => {
        const isHazardousAllowed = row.getValue("isHazardousAllowed");
        return isHazardousAllowed ? (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            Yes
          </span>
        ) : (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
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
    // Created At
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span className='text-sm text-gray-600'>
          {formatDate(row.getValue("createdAt"))}
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
    const worksheet = workbook.addWorksheet("ContainerTypes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((containerType: any) => {
      const row = displayedFields.map((field) => {
        if (
          field.fieldName === "createdAt" ||
          field.fieldName === "updatedAt"
        ) {
          return formatDate(containerType[field.fieldName] || "");
        }
        return containerType[field.fieldName] || "";
      });
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "ContainerTypes.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleContainerTypes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRows = [
      // Dry Container
      {
        typeCode: "DRY",
        typeName: "Dry Container",
        isHazardousAllowed: false,
        isActive: true,
        remarks: "Standard dry container for general cargo",
        companyId: 1,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
      // Reefer Container
      {
        typeCode: "REEF",
        typeName: "Reefer Container",
        isHazardousAllowed: false,
        isActive: true,
        remarks: "Refrigerated container for perishable goods",
        companyId: 1,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
      // Tank Container
      {
        typeCode: "TANK",
        typeName: "Tank Container",
        isHazardousAllowed: true,
        isActive: true,
        remarks: "For liquid and gas cargo, hazardous allowed",
        companyId: 1,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
      // Open Top
      {
        typeCode: "OTOP",
        typeName: "Open Top Container",
        isHazardousAllowed: false,
        isActive: true,
        remarks: "Open top for oversized cargo",
        companyId: 1,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
      // Flat Rack
      {
        typeCode: "FLAT",
        typeName: "Flat Rack Container",
        isHazardousAllowed: false,
        isActive: true,
        remarks: "Flat rack for heavy machinery",
        companyId: 1,
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
    ];

    sampleRows.forEach((sample) => {
      const row = displayedFields.map(
        (field) => (sample as any)[field.fieldName] || ""
      );
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileContainerTypes.xlsx");
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
                field.fieldName === "isHazardousAllowed" ||
                field.fieldName === "isActive"
              ) {
                value = Boolean(value);
              } else if (field.fieldName === "companyId") {
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

          await fetch(`${baseUrl}SetupContainerType`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Container types imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing container types. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.typeName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}SetupContainerType/${item.containerTypeId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) => record.containerTypeId !== item.containerTypeId
            )
          );
          alert("Container type deleted successfully.");
        } else {
          throw new Error("Failed to delete container type");
        }
      } catch (error) {
        alert("Error deleting container type. Please try again.");
        console.error("Error deleting container type:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Container Type Setup</h1>
      <div className='flex justify-between items-center mb-4'>
        <ContainerTypeDialog
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
            placeholder='🔍 Search container types...'
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
          searchBy='typeName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No container types found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first container type using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
