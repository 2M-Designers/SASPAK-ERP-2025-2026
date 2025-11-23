"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import EmployeeDialog from "@/views/dialogs/hr-dialogs/dialog-employee";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit } from "react-icons/fi";
import { useRouter } from "next/navigation";

type EmployeePageProps = {
  initialData: any[];
};

// Static field configuration for Employee
const fieldConfig = [
  {
    fieldName: "employeeId",
    displayName: "Employee ID",
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
    fieldName: "branchId",
    displayName: "Branch ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "userId",
    displayName: "User ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "employeeCode",
    displayName: "Employee Code",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "firstName",
    displayName: "First Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "lastName",
    displayName: "Last Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "fatherName",
    displayName: "Father Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "dateOfBirth",
    displayName: "Date of Birth",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "gender",
    displayName: "Gender",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "nationalIdNumber",
    displayName: "National ID",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "joiningDate",
    displayName: "Joining Date",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "confirmationDate",
    displayName: "Confirmation Date",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "resignationDate",
    displayName: "Resignation Date",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "officialEmail",
    displayName: "Official Email",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "personalEmail",
    displayName: "Personal Email",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "mobileNumber",
    displayName: "Mobile Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "departmentId",
    displayName: "Department ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "designationId",
    displayName: "Designation ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "reportsToEmployeeId",
    displayName: "Reports To ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "employmentStatus",
    displayName: "Employment Status",
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

export default function EmployeePage({ initialData }: EmployeePageProps) {
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
    return date.toLocaleDateString();
  };

  // Format full name
  const formatFullName = (firstName: string, lastName: string) => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "-";
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <EmployeeDialog
            type='edit'
            defaultState={row.original}
            handleAddEdit={(updatedItem: any) => {
              setData((prev: any) =>
                prev.map((item: any) =>
                  item.employeeId === updatedItem.employeeId
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
          </EmployeeDialog>
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
    // Employee Code
    {
      accessorKey: "employeeCode",
      header: "Employee Code",
      cell: ({ row }) => (
        <span className='font-medium'>
          {row.getValue("employeeCode") || "-"}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Full Name
    {
      accessorKey: "fullName",
      header: "Full Name",
      cell: ({ row }) => (
        <span className='font-medium'>
          {formatFullName(row.original.firstName, row.original.lastName)}
        </span>
      ),
      enableColumnFilter: false,
    },
    // Father Name
    {
      accessorKey: "fatherName",
      header: "Father Name",
      cell: ({ row }) => <span>{row.getValue("fatherName") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Date of Birth
    {
      accessorKey: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }) => <span>{formatDate(row.getValue("dateOfBirth"))}</span>,
      enableColumnFilter: false,
    },
    // Gender
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <span className='capitalize'>{row.getValue("gender") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // National ID
    {
      accessorKey: "nationalIdNumber",
      header: "National ID",
      cell: ({ row }) => <span>{row.getValue("nationalIdNumber") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Joining Date
    {
      accessorKey: "joiningDate",
      header: "Joining Date",
      cell: ({ row }) => <span>{formatDate(row.getValue("joiningDate"))}</span>,
      enableColumnFilter: false,
    },
    // Official Email
    {
      accessorKey: "officialEmail",
      header: "Official Email",
      cell: ({ row }) => <span>{row.getValue("officialEmail") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Mobile Number
    {
      accessorKey: "mobileNumber",
      header: "Mobile Number",
      cell: ({ row }) => <span>{row.getValue("mobileNumber") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Employment Status
    {
      accessorKey: "employmentStatus",
      header: "Employment Status",
      cell: ({ row }) => {
        const status = row.getValue("employmentStatus") as string | undefined;
        const getStatusColor = (s?: string) => {
          switch (s?.toLowerCase()) {
            case "active":
              return "bg-green-100 text-green-800";
            case "probation":
              return "bg-yellow-100 text-yellow-800";
            case "resigned":
              return "bg-red-100 text-red-800";
            case "terminated":
              return "bg-red-100 text-red-800";
            default:
              return "bg-gray-100 text-gray-800";
          }
        };

        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              status
            )}`}
          >
            {status ?? "-"}
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
  ];

  const downloadExcelWithData = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((employee: any) => {
      const row = displayedFields.map((field) => {
        const value = employee[field.fieldName];

        // Format dates for Excel
        if (
          field.fieldName === "dateOfBirth" ||
          field.fieldName === "joiningDate" ||
          field.fieldName === "confirmationDate" ||
          field.fieldName === "resignationDate"
        ) {
          return value ? new Date(value) : "";
        }

        return value || "";
      });
      worksheet.addRow(row);
    });

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "dateOfBirth" ||
        field.fieldName === "joiningDate" ||
        field.fieldName === "confirmationDate" ||
        field.fieldName === "resignationDate"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "Employees.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleEmployees");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "employeeCode":
          return "EMP001";
        case "firstName":
          return "John";
        case "lastName":
          return "Doe";
        case "fatherName":
          return "Robert Doe";
        case "dateOfBirth":
          return new Date("1990-01-15");
        case "gender":
          return "Male";
        case "nationalIdNumber":
          return "12345-6789012-3";
        case "joiningDate":
          return new Date();
        case "confirmationDate":
          return new Date(new Date().setMonth(new Date().getMonth() + 3));
        case "officialEmail":
          return "john.doe@company.com";
        case "personalEmail":
          return "john.doe.personal@gmail.com";
        case "mobileNumber":
          return "+1234567890";
        case "employmentStatus":
          return "Active";
        case "isActive":
          return true;
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "dateOfBirth" ||
        field.fieldName === "joiningDate" ||
        field.fieldName === "confirmationDate" ||
        field.fieldName === "resignationDate"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_Employees.xlsx");
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

              // Handle date fields
              if (
                field.fieldName === "dateOfBirth" ||
                field.fieldName === "joiningDate" ||
                field.fieldName === "confirmationDate" ||
                field.fieldName === "resignationDate"
              ) {
                if (value) {
                  value = new Date(value).toISOString();
                }
              }

              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}Employee`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Employees imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing Employees. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (item: any) => {
    if (
      confirm(
        `Are you sure you want to delete "${item.firstName} ${item.lastName}"?`
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Employee/${item.employeeId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.employeeId !== item.employeeId)
          );
          alert("Employee deleted successfully.");
        } else {
          throw new Error("Failed to delete Employee");
        }
      } catch (error) {
        alert("Error deleting Employee. Please try again.");
        console.error("Error deleting Employee:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Employees</h1>
      <div className='flex justify-between items-center mb-4'>
        <EmployeeDialog
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
            placeholder='🔍 Search employees...'
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
          searchBy='FirstName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No employees found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first employee using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
