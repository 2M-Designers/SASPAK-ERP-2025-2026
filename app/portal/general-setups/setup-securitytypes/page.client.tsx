"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import SecurityTypeDialog from "@/views/dialogs/general-dialogs/dialog-security-type";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type SecurityTypesPageProps = {
  initialData: any[];
};

// Static field configuration for Security Type
const fieldConfig = [
  {
    fieldName: "securityTypeId",
    displayName: "Security Type ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "securityTypeCode",
    displayName: "Security Type Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "securityTypeName",
    displayName: "Security Type Name",
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
  (field) => field.isdisplayed && field.isselected,
);

export default function SetupSecurityTypesPage({
  initialData,
}: SecurityTypesPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  useEffect(() => {
    console.log("Initial Security Types Data received:", initialData);
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

  // Truncate description if too long
  const truncateDescription = (description: string, maxLength: number = 50) => {
    if (!description) return "-";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <SecurityTypeDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.securityTypeId === updatedItem.securityTypeId
                    ? updatedItem
                    : item,
                ),
              );
              router.refresh();
            }}
          >
            <button className='text-blue-600 hover:text-blue-800'>
              <FiEdit size={16} />
            </button>
          </SecurityTypeDialog>
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
    // Security Type Code
    {
      accessorKey: "securityTypeCode",
      header: "Security Type Code",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("securityTypeCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Security Type Name
    {
      accessorKey: "securityTypeName",
      header: "Security Type Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("securityTypeName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Description
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span
          className='text-sm text-gray-600'
          title={row.getValue("description") || ""}
        >
          {truncateDescription(row.getValue("description") || "")}
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
    // Created At (optional - can be commented out)
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
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SecurityTypes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((securityType: any) => {
      const row = displayedFields.map((field) => {
        if (
          field.fieldName === "createdAt" ||
          field.fieldName === "updatedAt"
        ) {
          return formatDate(securityType[field.fieldName] || "");
        }
        if (field.fieldName === "version") {
          return securityType[field.fieldName] || 0;
        }
        if (field.fieldName === "isActive") {
          return securityType[field.fieldName] ? "Active" : "Inactive";
        }
        return securityType[field.fieldName] || "";
      });
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SecurityTypes.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleSecurityTypes");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "securityTypeCode":
          return "SEC001";
        case "securityTypeName":
          return "Bearer Bond";
        case "description":
          return "A bond that is payable to whoever holds it";
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
          return "";
      }
    });

    worksheet.addRow(sampleRow);

    // Add another sample row
    const sampleRow2 = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "securityTypeCode":
          return "SEC002";
        case "securityTypeName":
          return "Registered Bond";
        case "description":
          return "A bond registered in the owner's name";
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
          return "";
      }
    });

    worksheet.addRow(sampleRow2);

    // Add third sample row
    const sampleRow3 = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "securityTypeCode":
          return "SEC003";
        case "securityTypeName":
          return "Debenture";
        case "description":
          return "A type of debt instrument not secured by physical assets";
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
          return "";
      }
    });

    worksheet.addRow(sampleRow3);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileSecurityTypes.xlsx");
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
              } else if (field.fieldName === "companyId") {
                value = parseInt(value) || 0;
              } else if (field.fieldName === "version") {
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

          // Get user info
          const user = localStorage.getItem("user");
          let userID = 5;
          let companyId = 1;
          if (user) {
            try {
              const u = JSON.parse(user);
              userID = u?.userID || 5;
              companyId = u?.companyId || 1;
            } catch (error) {
              console.error("Error parsing user JSON:", error);
            }
          }

          // Format payload to match API expectations
          const apiPayload = {
            SecurityTypeId: 0, // 0 for new records
            SecurityTypeCode: (payload.securityTypeCode || "").toUpperCase(),
            SecurityTypeName: payload.securityTypeName || "",
            Description: payload.description || "",
            IsActive: payload.isActive || true,
            CompanyId: companyId,
            Version: 0,
            CreatedBy: userID,
          };

          console.log("Import payload:", apiPayload);

          const response = await fetch(`${baseUrl}SetupSecurityType`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          });

          // Handle response properly
          const responseText = await response.text();
          if (!response.ok) {
            console.error("Import error:", responseText);
            throw new Error(`Failed to import: ${response.status}`);
          }
        }),
      );

      setIsLoading(false);
      alert("Security Types imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing security types. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (
      confirm(`Are you sure you want to delete "${item.securityTypeName}"?`)
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}SetupSecurityType/${item.securityTypeId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) => record.securityTypeId !== item.securityTypeId,
            ),
          );
          alert("Security Type deleted successfully.");
        } else {
          throw new Error("Failed to delete security type");
        }
      } catch (error) {
        alert("Error deleting security type. Please try again.");
        console.error("Error deleting security type:", error);
      }
    }
  };

  const filteredData = data?.filter((item: any) =>
    Object.values(item).some((value: any) =>
      value?.toString().toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  return (
    <div className='p-6 bg-white shadow-md rounded-md'>
      <h1 className='text-2xl font-bold mb-4'>Security Type Setup</h1>
      <div className='flex justify-between items-center mb-4'>
        <SecurityTypeDialog
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
            placeholder='🔍 Search security types...'
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
          searchBy='securityTypeName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No security types found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first security type using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
