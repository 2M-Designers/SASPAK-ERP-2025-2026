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
import { useToast } from "@/hooks/use-toast";

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
    fieldName: "revenueGlaccountId",
    displayName: "Revenue GL Account",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "costGlaccountId",
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
  (field) => field.isdisplayed && field.isselected,
);

// Helper function to safely convert unknown to string | number | null | undefined
const safeConvert = (value: unknown): string | number | null | undefined => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  // For objects, try to convert to string
  try {
    return String(value);
  } catch {
    return null;
  }
};

export default function ChargesPage({ initialData }: ChargesPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [glAccounts, setGlAccounts] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Initial Data received:", initialData);
    if (initialData && Array.isArray(initialData)) {
      setData(initialData);
    } else {
      console.warn("Initial data is not an array:", initialData);
      setData([]);
    }

    // Fetch GL accounts for display
    fetchGLAccounts();
  }, [initialData]);

  // Fetch GL Accounts
  const fetchGLAccounts = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}GlAccount/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "AccountId,AccountCode,AccountName",
          where: "",
          sortOn: "AccountCode",
          page: "1",
          pageSize: "100",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch GL accounts: ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        setGlAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching GL accounts:", error);
    }
  };

  // Helper function to get GL account display name
  const getGLAccountDisplay = (accountId: unknown): string => {
    const safeId = safeConvert(accountId);

    if (safeId === null || safeId === undefined || safeId === "") {
      return "Not set";
    }

    // Convert to number if it's a string
    const id = typeof safeId === "string" ? parseInt(safeId, 10) : safeId;

    // Check if it's a valid number
    if (isNaN(id) || id === 0) {
      return "Not set";
    }

    const account = glAccounts.find((acc) => acc.accountId === id);
    return account
      ? `${account.accountCode} - ${account.accountName}`
      : `ID: ${id}`;
  };

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
                  item.chargeId === updatedItem.chargeId ? updatedItem : item,
                ),
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
      cell: ({ row }) => {
        const value = row.getValue("chargeCode");
        return (
          <span className='font-medium'>
            {typeof value === "string" || typeof value === "number"
              ? String(value)
              : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Charge Name
    {
      accessorKey: "chargeName",
      header: "Charge Name",
      cell: ({ row }) => {
        const value = row.getValue("chargeName");
        return (
          <span className='font-medium'>
            {typeof value === "string" || typeof value === "number"
              ? String(value)
              : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Charge Type
    {
      accessorKey: "chargeType",
      header: "Charge Type",
      cell: ({ row }) => {
        const value = row.getValue("chargeType");
        return (
          <span>
            {typeof value === "string" || typeof value === "number"
              ? String(value)
              : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Charge Group
    {
      accessorKey: "chargeGroup",
      header: "Charge Group",
      cell: ({ row }) => {
        const value = row.getValue("chargeGroup");
        return (
          <span>
            {typeof value === "string" || typeof value === "number"
              ? String(value)
              : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Revenue GL Account
    {
      accessorKey: "revenueGlaccountId",
      header: "Revenue GL Account",
      cell: ({ row }) => {
        const revenueAccountId = row.getValue("revenueGlaccountId");
        return (
          <span className='text-sm'>
            {getGLAccountDisplay(revenueAccountId)}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Cost GL Account
    {
      accessorKey: "costGlaccountId",
      header: "Cost GL Account",
      cell: ({ row }) => {
        const costAccountId = row.getValue("costGlaccountId");
        return (
          <span className='text-sm'>{getGLAccountDisplay(costAccountId)}</span>
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
        const isTaxableBool =
          isTaxable === true ||
          isTaxable === 1 ||
          isTaxable === "true" ||
          isTaxable === "1";
        return isTaxableBool ? (
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
        let taxNum: number;

        if (typeof taxPercentage === "number") {
          taxNum = taxPercentage;
        } else if (typeof taxPercentage === "string") {
          taxNum = parseFloat(taxPercentage);
        } else {
          taxNum = NaN;
        }

        return !isNaN(taxNum) && taxNum > 0 ? (
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
        const isReimbursableBool =
          isReimbursable === true ||
          isReimbursable === 1 ||
          isReimbursable === "true" ||
          isReimbursable === "1";
        return isReimbursableBool ? (
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
        const isActiveBool =
          isActive === true ||
          isActive === 1 ||
          isActive === "true" ||
          isActive === "1";
        return isActiveBool ? (
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
      cell: ({ row }) => {
        const value = row.getValue("remarks");
        const remarkText =
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : "";
        return (
          <span className='max-w-[200px] truncate' title={remarkText}>
            {remarkText || "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export.",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Charges");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((charge: any) => {
      const row = displayedFields.map((field) => {
        let value = charge[field.fieldName];

        // Format boolean values for Excel
        if (
          field.fieldName === "isTaxable" ||
          field.fieldName === "isReimbursable" ||
          field.fieldName === "isActive"
        ) {
          return value ? "Yes" : "No";
        }

        // Format GL accounts
        if (field.fieldName === "revenueGlaccountId") {
          return getGLAccountDisplay(value);
        }

        if (field.fieldName === "costGlaccountId") {
          return getGLAccountDisplay(value);
        }

        // Handle null/undefined values
        if (value === null || value === undefined) {
          return "";
        }

        return String(value);
      });
      worksheet.addRow(row);
    });

    workbook.xlsx
      .writeBuffer()
      .then((buffer: any) => {
        saveAs(
          new Blob([buffer]),
          `Charges_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        toast({
          title: "Export Successful",
          description: "Charges data has been exported to Excel.",
        });
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Export Error",
          description: "Failed to export data to Excel.",
        });
        console.error("Excel export error:", error);
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
          return "Yes";
        case "defaultTaxPercentage":
          return "18.00";
        case "chargeCode":
          return "FRE001";
        case "chargeName":
          return "Freight Charge";
        case "chargeType":
          return "Freight";
        case "chargeGroup":
          return "Transportation";
        case "revenueGlaccountId":
          return "1"; // Just the ID in sample
        case "costGlaccountId":
          return "3"; // Just the ID in sample
        case "remarks":
          return "Sample remarks for freight charge";
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    workbook.xlsx
      .writeBuffer()
      .then((buffer: any) => {
        saveAs(new Blob([buffer]), "SampleFileCharges.xlsx");
        toast({
          title: "Sample Downloaded",
          description: "Sample file has been downloaded.",
        });
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Download Error",
          description: "Failed to download sample file.",
        });
        console.error("Sample download error:", error);
      });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];

    // Check file type
    if (!file.name.endsWith(".xlsx")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload an Excel (.xlsx) file.",
      });
      return;
    }

    setIsLoading(true);
    readXlsxFile(file)
      .then((rows: any) => {
        insertData(rows.slice(1)); // Skip header row
      })
      .catch((error) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "File Read Error",
          description:
            "Failed to read the Excel file. Please check the format.",
        });
        console.error("Error reading Excel file:", error);
      });
  };

  const insertData = async (newData: any[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const user = localStorage.getItem("user");
    let companyId = 1;
    let userID = 0;

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      for (const row of newData) {
        try {
          // Create payload object by mapping Excel columns to field names
          const payload: any = {};
          displayedFields.forEach((field, index) => {
            if (index < row.length) {
              let value = row[index];

              // Handle different field types
              switch (field.fieldName) {
                case "isTaxable":
                case "isReimbursable":
                case "isActive":
                  value =
                    value?.toString().toLowerCase() === "yes" ||
                    value?.toString().toLowerCase() === "true" ||
                    value === true ||
                    value === 1;
                  break;

                case "defaultTaxPercentage":
                  value = parseFloat(value) || 0;
                  break;

                case "revenueGlaccountId":
                case "costGlaccountId":
                  // Handle GL account ID
                  if (value === null || value === undefined || value === "") {
                    value = 0;
                  } else {
                    // Try to parse as number
                    const numValue = parseFloat(value);
                    value = isNaN(numValue) ? 0 : numValue;
                  }
                  break;

                case "chargeCode":
                  value = value?.toString().toUpperCase();
                  break;

                default:
                  value = value?.toString() || "";
              }

              // Map field names to API field names
              const apiFieldName =
                field.fieldName === "revenueGlaccountId"
                  ? "RevenueGlaccountId"
                  : field.fieldName === "costGlaccountId"
                    ? "CostGlaccountId"
                    : field.fieldName.charAt(0).toUpperCase() +
                      field.fieldName.slice(1);
              payload[apiFieldName] = value;
            }
          });

          // Add required fields
          payload.CompanyId = companyId;
          payload.CreatedBy = userID;
          payload.Version = 0;

          const response = await fetch(`${baseUrl}ChargesMaster`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            results.failed++;
            results.errors.push(
              `Row ${results.success + results.failed}: ${errorText}`,
            );
          } else {
            results.success++;
          }
        } catch (rowError: any) {
          results.failed++;
          results.errors.push(
            `Row ${results.success + results.failed}: ${rowError.message || "Unknown error"}`,
          );
        }
      }

      setIsLoading(false);

      if (results.failed === 0) {
        toast({
          title: "Import Successful",
          description: `${results.success} charges imported successfully!`,
        });
      } else {
        toast({
          variant: results.success > 0 ? "default" : "destructive",
          title: results.success > 0 ? "Partial Import" : "Import Failed",
          description: `${results.success} imported, ${results.failed} failed. ${results.errors[0]}`,
        });
      }

      router.refresh();
    } catch (error: any) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Import Error",
        description:
          error.message ||
          "An error occurred during import. Please check the file format.",
      });
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.chargeName}"?`)) {
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}ChargesMaster/${item.chargeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setData((prev: any) =>
          prev.filter((record: any) => record.chargeId !== item.chargeId),
        );
        toast({
          title: "Success",
          description: "Charge deleted successfully.",
        });
        router.refresh();
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Error deleting charge. Please try again.",
      });
      console.error("Error deleting charge:", error);
    }
  };

  const filteredData = data?.filter((item: any) =>
    Object.values(item).some((value: any) =>
      value?.toString().toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  return (
    <div className='p-6 bg-white shadow-md rounded-md'>
      <h1 className='text-2xl font-bold mb-4'>Charges Master</h1>
      <div className='flex justify-between items-center mb-4 flex-wrap gap-4'>
        <ChargesDialog
          type='add'
          defaultState={{}}
          handleAddEdit={(newItem: any) => {
            setData((prev: any) => [...(prev || []), newItem]);
            router.refresh();
          }}
        />
        <div className='flex gap-3 items-center flex-wrap'>
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
              accept='.xlsx,.xls'
              onChange={handleFileUpload}
              className='w-auto'
              disabled={isLoading}
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

      {isLoading ? (
        <div className='flex justify-center items-center py-12'>
          <AppLoader />
        </div>
      ) : data && data.length > 0 ? (
        <AppDataTable
          data={filteredData ?? []}
          loading={false}
          columns={columns}
          searchText={searchText}
          searchBy='chargeName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-12 border rounded-lg bg-gray-50'>
          <p className='text-gray-500 text-lg mb-2'>No charges found</p>
          <p className='text-gray-400 text-sm'>
            {initialData === null
              ? "Loading charges data..."
              : "Add your first charge using the 'Add Charge' button above"}
          </p>
        </div>
      )}
    </div>
  );
}
