"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import PartyLocationDialog from "@/views/dialogs/general-dialogs/dialog-party-location";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type PartyLocationsPageProps = {
  initialData: any[];
};

// Static field configuration for PartyLocations
const fieldConfig = [
  {
    fieldName: "partyLocationId",
    displayName: "Party Location ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "partyId",
    displayName: "Party ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "unlocationId",
    displayName: "UN Location ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "locationCode",
    displayName: "Location Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "locationName",
    displayName: "Location Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "addressLine1",
    displayName: "Address Line 1",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "addressLine2",
    displayName: "Address Line 2",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "postalCode",
    displayName: "Postal Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "phone",
    displayName: "Phone",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "fax",
    displayName: "Fax",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "email",
    displayName: "Email",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonName",
    displayName: "Contact Person",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonDesignation",
    displayName: "Contact Designation",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonPhone",
    displayName: "Contact Phone",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "contactPersonEmail",
    displayName: "Contact Email",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "isHeadOffice",
    displayName: "Head Office",
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

export default function PartyLocationsPage({
  initialData,
}: PartyLocationsPageProps) {
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
          <PartyLocationDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.partyLocationId === updatedItem.partyLocationId
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
          </PartyLocationDialog>
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
    // Location Code
    {
      accessorKey: "locationCode",
      header: "Location Code",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("locationCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Location Name
    {
      accessorKey: "locationName",
      header: "Location Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("locationName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Address Line 1
    {
      accessorKey: "addressLine1",
      header: "Address Line 1",
      cell: ({ row }) => (
        <span
          className='max-w-[200px] truncate'
          title={row.getValue("addressLine1") || ""}
        >
          {row.getValue("addressLine1") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Phone
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span>{row.getValue("phone") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Email
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span
          className='max-w-[180px] truncate'
          title={row.getValue("email") || ""}
        >
          {row.getValue("email") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Contact Person Name
    {
      accessorKey: "contactPersonName",
      header: "Contact Person",
      cell: ({ row }) => (
        <span>{row.getValue("contactPersonName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Contact Person Designation
    {
      accessorKey: "contactPersonDesignation",
      header: "Contact Designation",
      cell: ({ row }) => (
        <span>{row.getValue("contactPersonDesignation") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Is Head Office
    {
      accessorKey: "isHeadOffice",
      header: "Head Office",
      cell: ({ row }) => {
        const isHeadOffice = row.getValue("isHeadOffice");
        return isHeadOffice ? (
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
    // Remarks
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <span
          className='max-w-[150px] truncate'
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
    const worksheet = workbook.addWorksheet("PartyLocations");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((location: any) => {
      const row = displayedFields.map(
        (field) => location[field.fieldName] || ""
      );
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "PartyLocations.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SamplePartyLocations");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "isHeadOffice":
        case "isActive":
          return true;
        case "locationCode":
          return "LOC001";
        case "locationName":
          return "Main Office";
        case "addressLine1":
          return "123 Main Street";
        case "addressLine2":
          return "Central Business District";
        case "postalCode":
          return "10001";
        case "phone":
          return "+1-555-0123";
        case "fax":
          return "+1-555-0124";
        case "email":
          return "contact@company.com";
        case "contactPersonName":
          return "John Smith";
        case "contactPersonDesignation":
          return "Office Manager";
        case "contactPersonPhone":
          return "+1-555-0125";
        case "contactPersonEmail":
          return "john.smith@company.com";
        case "remarks":
          return "Sample party location remarks";
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFilePartyLocations.xlsx");
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
                field.fieldName === "isHeadOffice" ||
                field.fieldName === "isActive"
              ) {
                value = Boolean(value);
              }
              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}PartyLocation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Party Locations imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing Party Locations. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.locationName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}PartyLocation/${item.partyLocationId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) => record.partyLocationId !== item.partyLocationId
            )
          );
          alert("Party Location deleted successfully.");
        } else {
          throw new Error("Failed to delete Party Location");
        }
      } catch (error) {
        alert("Error deleting Party Location. Please try again.");
        console.error("Error deleting Party Location:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Party Locations</h1>
      <div className='flex justify-between items-center mb-4'>
        <PartyLocationDialog
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
            placeholder='🔍 Search party locations...'
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
          searchBy='locationName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No Party Locations found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first Party Location using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
