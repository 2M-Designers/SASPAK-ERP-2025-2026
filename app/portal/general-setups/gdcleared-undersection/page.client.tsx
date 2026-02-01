"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import GDClearedUnderSectionDialog from "@/views/dialogs/general-dialogs/dialog-gd-cleared-under-section";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type GDClearedUnderSectionPageProps = {
  initialData: any[];
};

// Static field configuration for GD Cleared Under Section
const fieldConfig = [
  {
    fieldName: "gdClearedUnderSectionId",
    displayName: "ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "sectionCode",
    displayName: "Section Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "sectionName",
    displayName: "Section Name",
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

export default function SetupGDClearedUnderSectionPage({
  initialData,
}: GDClearedUnderSectionPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  useEffect(() => {
    console.log("Initial GD Cleared Under Section Data received:", initialData);
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
          <GDClearedUnderSectionDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.gdClearedUnderSectionId ===
                  updatedItem.gdClearedUnderSectionId
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
          </GDClearedUnderSectionDialog>
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
    //GDClearedUnderSectionId
    {
      accessorKey: "gdclearedUnderSectionId",
      header: "ID",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("gdclearedUnderSectionId") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // S.No Column
    {
      accessorKey: "row",
      header: "S.No",
      cell: ({ row }) => parseInt(row.id) + 1,
      enableColumnFilter: false,
    },
    // Section Code
    {
      accessorKey: "sectionCode",
      header: "Section Code",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("sectionCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Section Name
    {
      accessorKey: "sectionName",
      header: "Section Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("sectionName") || "-"}
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
    const worksheet = workbook.addWorksheet("GD_Cleared_Under_Sections");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((section: any) => {
      const row = displayedFields.map((field) => {
        if (
          field.fieldName === "createdAt" ||
          field.fieldName === "updatedAt"
        ) {
          return formatDate(section[field.fieldName] || "");
        }
        if (field.fieldName === "version") {
          return section[field.fieldName] || 0;
        }
        if (field.fieldName === "isActive") {
          return section[field.fieldName] ? "Active" : "Inactive";
        }
        return section[field.fieldName] || "";
      });
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "GD_Cleared_Under_Sections.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sample_GD_Cleared_Under_Sections");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "sectionCode":
          return "SEC001";
        case "sectionName":
          return "Import Section";
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
        case "sectionCode":
          return "SEC002";
        case "sectionName":
          return "Export Section";
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

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "Sample_GD_Cleared_Under_Sections.xlsx");
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
            gdclearedUnderSectionId: 0, // 0 for new records
            SectionCode: (payload.sectionCode || "").toUpperCase(),
            SectionName: payload.sectionName || "",
            IsActive: payload.isActive || true,
            CompanyId: companyId,
            Version: 0,
            CreatedBy: userID,
          };

          console.log("Import payload:", apiPayload);

          const response = await fetch(`${baseUrl}SetupGdclearedUnderSection`, {
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
      alert(
        "GD Cleared Under Sections imported successfully! Refreshing data...",
      );
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert(
        "Error importing GD Cleared Under Sections. Please check the file format.",
      );
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.sectionName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}SetupGdclearedUnderSection/${item.gdClearedUnderSectionId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) =>
                record.gdClearedUnderSectionId !== item.gdClearedUnderSectionId,
            ),
          );
          alert("GD Cleared Under Section deleted successfully.");
        } else {
          throw new Error("Failed to delete GD Cleared Under Section");
        }
      } catch (error) {
        alert("Error deleting GD Cleared Under Section. Please try again.");
        console.error("Error deleting GD Cleared Under Section:", error);
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
      <h1 className='text-2xl font-bold mb-4'>
        GD Cleared Under Section Setup
      </h1>
      <div className='flex justify-between items-center mb-4'>
        <GDClearedUnderSectionDialog
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
            placeholder='🔍 Search sections...'
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
          searchBy='sectionName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>
            No GD Cleared Under Sections found
          </p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first section using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
