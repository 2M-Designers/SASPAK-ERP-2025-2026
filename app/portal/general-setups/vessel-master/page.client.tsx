"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import VesselMasterDialog from "@/views/dialogs/general-dialogs/dialog-vessel-master";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type VesselMasterPageProps = {
  initialData: any[];
};

// Static field configuration for VesselMaster
const fieldConfig = [
  {
    fieldName: "vesselId",
    displayName: "Vessel ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "vesselCode",
    displayName: "Vessel Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "vesselName",
    displayName: "Vessel Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "imonumber",
    displayName: "IMO Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "mmsinumber",
    displayName: "MMSI Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "callSign",
    displayName: "Call Sign",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "vesselType",
    displayName: "Vessel Type",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "flagCountryCode",
    displayName: "Flag Country Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "builtYear",
    displayName: "Built Year",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "deadWeightTonnage",
    displayName: "Dead Weight Tonnage (DWT)",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "grossTonnage",
    displayName: "Gross Tonnage (GT)",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "netTonnage",
    displayName: "Net Tonnage (NT)",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "operatorName",
    displayName: "Operator Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "ownerName",
    displayName: "Owner Name",
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
    fieldName: "updatedBy",
    displayName: "Updated By",
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

export default function SetupVesselMasterPage({
  initialData,
}: VesselMasterPageProps) {
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

  // Format year for display
  const formatYear = (year: any) => {
    if (!year) return "-";
    const yearNum = typeof year === "number" ? year : parseInt(String(year));
    return !isNaN(yearNum) ? yearNum.toString() : "-";
  };

  // Format tonnage numbers with commas
  const formatTonnage = (tonnage: any) => {
    if (!tonnage) return "-";
    const tonnageNum =
      typeof tonnage === "number" ? tonnage : parseFloat(String(tonnage));
    return !isNaN(tonnageNum) ? tonnageNum.toLocaleString() : "-";
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <VesselMasterDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.vesselId === updatedItem.vesselId ? updatedItem : item
                )
              );
              router.refresh();
            }}
          >
            <button className='text-blue-600 hover:text-blue-800'>
              <FiEdit size={16} />
            </button>
          </VesselMasterDialog>
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
    // Vessel Code
    {
      accessorKey: "vesselCode",
      header: "Vessel Code",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("vesselCode") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Vessel Name
    {
      accessorKey: "vesselName",
      header: "Vessel Name",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("vesselName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // IMO Number
    {
      accessorKey: "imonumber",
      header: "IMO Number",
      cell: ({ row }) => (
        <span className='font-mono'>{row.getValue("imonumber") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // MMSI Number
    {
      accessorKey: "mmsinumber",
      header: "MMSI Number",
      cell: ({ row }) => (
        <span className='font-mono'>{row.getValue("mmsinumber") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Call Sign
    {
      accessorKey: "callSign",
      header: "Call Sign",
      cell: ({ row }) => <span>{row.getValue("callSign") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Vessel Type
    {
      accessorKey: "vesselType",
      header: "Vessel Type",
      cell: ({ row }) => <span>{row.getValue("vesselType") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Flag Country Code
    {
      accessorKey: "flagCountryCode",
      header: "Flag Country",
      cell: ({ row }) => <span>{row.getValue("flagCountryCode") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Built Year
    {
      accessorKey: "builtYear",
      header: "Built Year",
      cell: ({ row }) => <span>{formatYear(row.getValue("builtYear"))}</span>,
      enableColumnFilter: false,
    },
    // Dead Weight Tonnage
    {
      accessorKey: "deadWeightTonnage",
      header: "DWT",
      cell: ({ row }) => (
        <span>{formatTonnage(row.getValue("deadWeightTonnage"))}</span>
      ),
      enableColumnFilter: false,
    },
    // Gross Tonnage
    {
      accessorKey: "grossTonnage",
      header: "GT",
      cell: ({ row }) => (
        <span>{formatTonnage(row.getValue("grossTonnage"))}</span>
      ),
      enableColumnFilter: false,
    },
    // Net Tonnage
    {
      accessorKey: "netTonnage",
      header: "NT",
      cell: ({ row }) => (
        <span>{formatTonnage(row.getValue("netTonnage"))}</span>
      ),
      enableColumnFilter: false,
    },
    // Operator Name
    {
      accessorKey: "operatorName",
      header: "Operator",
      cell: ({ row }) => <span>{row.getValue("operatorName") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Owner Name
    {
      accessorKey: "ownerName",
      header: "Owner",
      cell: ({ row }) => <span>{row.getValue("ownerName") || "-"}</span>,
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
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("VesselMaster");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((vessel: any) => {
      const row = displayedFields.map((field) => {
        if (
          field.fieldName === "createdAt" ||
          field.fieldName === "updatedAt"
        ) {
          return formatDate(vessel[field.fieldName] || "");
        }
        if (
          field.fieldName === "deadWeightTonnage" ||
          field.fieldName === "grossTonnage" ||
          field.fieldName === "netTonnage"
        ) {
          const value = vessel[field.fieldName];
          return value ? parseFloat(value) : "";
        }
        return vessel[field.fieldName] || "";
      });
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "VesselMaster.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleVesselMaster");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "vesselCode":
          return "VS001";
        case "vesselName":
          return "Sea Voyager";
        case "imonumber":
          return "9876543";
        case "mmsinumber":
          return "123456789";
        case "callSign":
          return "ABCD";
        case "vesselType":
          return "Container Ship";
        case "flagCountryCode":
          return "SG";
        case "builtYear":
          return 2015;
        case "deadWeightTonnage":
          return 50000;
        case "grossTonnage":
          return 45000;
        case "netTonnage":
          return 40000;
        case "operatorName":
          return "Maersk Line";
        case "ownerName":
          return "Maersk Group";
        case "isActive":
          return true;
        case "createdBy":
          return "admin";
        case "createdAt":
          return new Date().toISOString();
        case "updatedAt":
          return new Date().toISOString();
        case "updatedBy":
          return "admin";
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
        case "vesselCode":
          return "VS002";
        case "vesselName":
          return "Ocean Carrier";
        case "imonumber":
          return "8765432";
        case "mmsinumber":
          return "987654321";
        case "callSign":
          return "EFGH";
        case "vesselType":
          return "Bulk Carrier";
        case "flagCountryCode":
          return "US";
        case "builtYear":
          return 2018;
        case "deadWeightTonnage":
          return 80000;
        case "grossTonnage":
          return 75000;
        case "netTonnage":
          return 70000;
        case "operatorName":
          return "CMA CGM";
        case "ownerName":
          return "CMA CGM Group";
        case "isActive":
          return true;
        case "createdBy":
          return "admin";
        case "createdAt":
          return new Date().toISOString();
        case "updatedAt":
          return new Date().toISOString();
        case "updatedBy":
          return "admin";
        case "version":
          return 1;
        default:
          return "";
      }
    });

    worksheet.addRow(sampleRow2);

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFileVesselMaster.xlsx");
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
              } else if (field.fieldName === "builtYear") {
                value = parseInt(value) || 0;
              } else if (
                field.fieldName === "deadWeightTonnage" ||
                field.fieldName === "grossTonnage" ||
                field.fieldName === "netTonnage"
              ) {
                value = parseFloat(value) || 0;
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

          await fetch(`${baseUrl}VesselMaster`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Vessels imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing vessels. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.vesselName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(
          `${baseUrl}VesselMaster/${item.vesselId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.vesselId !== item.vesselId)
          );
          alert("Vessel deleted successfully.");
        } else {
          throw new Error("Failed to delete vessel");
        }
      } catch (error) {
        alert("Error deleting vessel. Please try again.");
        console.error("Error deleting vessel:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Vessel Master Setup</h1>
      <div className='flex justify-between items-center mb-4'>
        <VesselMasterDialog
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
            placeholder='🔍 Search vessels...'
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
          searchBy='vesselName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No vessels found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first vessel using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
