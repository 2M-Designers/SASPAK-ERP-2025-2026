"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import UNAirportDialog from "@/views/dialogs/general-dialogs/dialog-un-airports";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type UNAirportsPageProps = {
  initialData: any[];
};

// Static field configuration for UNAirports
const fieldConfig = [
  {
    fieldName: "unairportId",
    displayName: "UN Airport ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "airportCode",
    displayName: "Airport Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "airportName",
    displayName: "Airport Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "unlocationId",
    displayName: "UN Location ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "locationName",
    displayName: "UN Location",
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

export default function UNAirportsPage({ initialData }: UNAirportsPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [unlocations, setUnlocations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log("Initial Data received:", initialData);
    if (initialData && Array.isArray(initialData)) {
      setData(initialData);
    } else {
      console.warn("Initial data is not an array:", initialData);
      setData([]);
    }
    fetchUnlocations();
  }, [initialData]);

  const fetchUnlocations = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}UNLocation/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "UnlocationId,LocationName,Uncode",
          where: "IsActive == true",
          sortOn: "locationName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnlocations(data);
      }
    } catch (error) {
      console.error("Error fetching UN locations:", error);
    }
  };

  const getLocationName = (unlocationId: number) => {
    const location = unlocations.find(
      (loc) => loc.unlocationId === unlocationId
    );
    return location
      ? `${location.locationName} (${location.uncode})`
      : "Unknown";
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <UNAirportDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.unairportId === updatedItem.unairportId
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
          </UNAirportDialog>
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
    //Un Airport ID
    /*{
      accessorKey: "unairportId",
      header: "UN Airport ID",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("unairportId") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },*/
    // Airport Code
    {
      accessorKey: "airportCode",
      header: "Airport Code",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("airportCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Airport Name
    {
      accessorKey: "airportName",
      header: "Airport Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("airportName") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // UN Location
    {
      accessorKey: "unlocationId",
      header: "UN Location",
      cell: ({ row }) => (
        <span>{getLocationName(row.getValue("unlocationId"))}</span>
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
    const worksheet = workbook.addWorksheet("UNAirports");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((airport: any) => {
      const row = displayedFields.map((field) => {
        if (field.fieldName === "locationName") {
          return getLocationName(airport.unlocationId);
        }
        return airport[field.fieldName] || "";
      });
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "UNAirports.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleUNAirports");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "isActive":
          return true;
        case "airportCode":
          return "JFK";
        case "airportName":
          return "John F. Kennedy International Airport";
        case "unlocationId":
          return 1; // Assuming New York has ID 1
        case "locationName":
          return "New York (USNYC)";
        case "remarks":
          return "Sample airport remarks";
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileUNAirports.xlsx");
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
              } else if (field.fieldName === "unlocationId") {
                value = parseInt(value) || 0;
              }
              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}UNAIRPort`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("UN Airports imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing UN Airports. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.airportName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}UNAIRPort/${item.unairportId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter(
              (record: any) => record.unairportId !== item.unairportId
            )
          );
          alert("UN Airport deleted successfully.");
        } else {
          throw new Error("Failed to delete UN Airport");
        }
      } catch (error) {
        alert("Error deleting UN Airport. Please try again.");
        console.error("Error deleting UN Airport:", error);
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
      <h1 className='text-2xl font-bold mb-4'>UN Airports</h1>
      <div className='flex justify-between items-center mb-4'>
        <UNAirportDialog
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
            placeholder='🔍 Search airports...'
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
          searchBy='airportName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No UN Airports found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first UN Airport using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
