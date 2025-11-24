"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import UserDialog from "@/views/dialogs/user-dialogs/dialog-user";
import AppLoader from "@/components/app-loader";
import { FiTrash2, FiDownload, FiEdit, FiLock, FiUnlock } from "react-icons/fi";
import { useRouter } from "next/navigation";

type UserPageProps = {
  initialData: any[];
};

// Static field configuration for User
const fieldConfig = [
  {
    fieldName: "userId",
    displayName: "User ID",
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
    fieldName: "departmentId",
    displayName: "Department ID",
    isdisplayed: false,
    isselected: true,
  },
  {
    fieldName: "username",
    displayName: "Username",
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
    fieldName: "fullName",
    displayName: "Full Name",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "designation",
    displayName: "Designation",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "phoneNumber",
    displayName: "Phone Number",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "lastLoginAt",
    displayName: "Last Login",
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
    fieldName: "isLocked",
    displayName: "Lock Status",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "failedLoginAttempts",
    displayName: "Failed Attempts",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "roleId",
    displayName: "Role ID",
    isdisplayed: false,
    isselected: true,
  },
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function UserPage({ initialData }: UserPageProps) {
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
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Format date for display (date only)
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle lock/unlock user
  const handleLockUnlock = async (user: any) => {
    const action = user.isLocked ? "unlock" : "lock";
    if (
      confirm(`Are you sure you want to ${action} user "${user.username}"?`)
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}User/${user.userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...user,
            isLocked: !user.isLocked,
            failedLoginAttempts: 0, // Reset failed attempts when unlocking
          }),
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.map((item: any) =>
              item.userId === user.userId
                ? { ...item, isLocked: !user.isLocked, failedLoginAttempts: 0 }
                : item
            )
          );
          alert(`User ${action}ed successfully.`);
        } else {
          throw new Error(`Failed to ${action} user`);
        }
      } catch (error) {
        alert(`Error ${action}ing user. Please try again.`);
        console.error(`Error ${action}ing user:`, error);
      }
    }
  };

  // Reset failed login attempts
  const handleResetAttempts = async (user: any) => {
    if (confirm(`Reset failed login attempts for "${user.username}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}User/${user.userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...user,
            failedLoginAttempts: 0,
          }),
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.map((item: any) =>
              item.userId === user.userId
                ? { ...item, failedLoginAttempts: 0 }
                : item
            )
          );
          alert("Failed login attempts reset successfully.");
        } else {
          throw new Error("Failed to reset login attempts");
        }
      } catch (error) {
        alert("Error resetting login attempts. Please try again.");
        console.error("Error resetting login attempts:", error);
      }
    }
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className='flex gap-2'>
            <UserDialog
              type='edit'
              defaultState={user}
              handleAddEdit={(updatedItem: any) => {
                setData((prev: any) =>
                  prev.map((item: any) =>
                    item.userId === updatedItem.userId ? updatedItem : item
                  )
                );
                router.refresh();
              }}
            >
              <button className='text-blue-600 hover:text-blue-800'>
                <FiEdit size={16} />
              </button>
            </UserDialog>

            {/* Lock/Unlock Button */}
            <button
              className={`${
                user.isLocked
                  ? "text-green-600 hover:text-green-800"
                  : "text-yellow-600 hover:text-yellow-800"
              }`}
              onClick={() => handleLockUnlock(user)}
              title={user.isLocked ? "Unlock User" : "Lock User"}
            >
              {user.isLocked ? <FiUnlock size={16} /> : <FiLock size={16} />}
            </button>

            {/* Reset Failed Attempts Button */}
            {user.failedLoginAttempts > 0 && (
              <button
                className='text-orange-600 hover:text-orange-800'
                onClick={() => handleResetAttempts(user)}
                title='Reset Failed Login Attempts'
              >
                <FiUnlock size={16} />
              </button>
            )}

            <button
              className='text-red-600 hover:text-red-800'
              onClick={() => handleDelete(user)}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "row",
      header: "S.No",
      cell: ({ row }) => parseInt(row.id) + 1,
      enableColumnFilter: false,
    },
    // Username
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("username") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Full Name
    {
      accessorKey: "fullName",
      header: "Full Name",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("fullName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Email
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.getValue("email") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Designation
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => <span>{row.getValue("designation") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Phone Number
    {
      accessorKey: "phoneNumber",
      header: "Phone Number",
      cell: ({ row }) => <span>{row.getValue("phoneNumber") || "-"}</span>,
      enableColumnFilter: false,
    },
    // Last Login
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) => {
        const lastLogin = row.getValue("lastLoginAt");
        return (
          <span className='text-sm'>
            {lastLogin ? formatDate(lastLogin as string) : "Never"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Failed Login Attempts
    {
      accessorKey: "failedLoginAttempts",
      header: "Failed Attempts",
      cell: ({ row }) => {
        const attempts = row.getValue("failedLoginAttempts");
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              (attempts as number) > 0
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {attempts ? attempts.toString() : "0"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    // Lock Status
    {
      accessorKey: "isLocked",
      header: "Lock Status",
      cell: ({ row }) => {
        const isLocked = row.getValue("isLocked");
        return isLocked ? (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            Locked
          </span>
        ) : (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            Unlocked
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
    const worksheet = workbook.addWorksheet("Users");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((user: any) => {
      const row = displayedFields.map((field) => {
        const value = user[field.fieldName];

        // Format dates for Excel
        if (
          field.fieldName === "lastLoginAt" ||
          field.fieldName === "passwordResetTokenExpiry"
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
        field.fieldName === "lastLoginAt" ||
        field.fieldName === "passwordResetTokenExpiry"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy hh:mm:ss";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "Users.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleUsers");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      switch (field.fieldName) {
        case "username":
          return "john.doe";
        case "email":
          return "john.doe@company.com";
        case "fullName":
          return "John Doe";
        case "designation":
          return "Software Engineer";
        case "phoneNumber":
          return "+1234567890";
        case "lastLoginAt":
          return new Date();
        case "isActive":
          return true;
        case "isLocked":
          return false;
        case "failedLoginAttempts":
          return 0;
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "lastLoginAt" ||
        field.fieldName === "passwordResetTokenExpiry"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy hh:mm:ss";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_Users.xlsx");
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
              if (
                field.fieldName === "isActive" ||
                field.fieldName === "isLocked"
              ) {
                value = Boolean(value);
              }

              // Handle numeric fields
              if (
                field.fieldName === "failedLoginAttempts" ||
                field.fieldName === "roleId"
              ) {
                value = parseInt(value) || 0;
              }

              // Handle date fields
              if (
                field.fieldName === "lastLoginAt" ||
                field.fieldName === "passwordResetTokenExpiry"
              ) {
                if (value) {
                  value = new Date(value).toISOString();
                }
              }

              payload[field.fieldName] = value;
            }
          });

          await fetch(`${baseUrl}User`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Users imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing Users. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (user: any) => {
    if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}User/${user.userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.userId !== user.userId)
          );
          alert("User deleted successfully.");
        } else {
          throw new Error("Failed to delete User");
        }
      } catch (error) {
        alert("Error deleting User. Please try again.");
        console.error("Error deleting User:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Users</h1>
      <div className='flex justify-between items-center mb-4'>
        <UserDialog
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
            placeholder='🔍 Search users...'
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
          searchBy='username'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No users found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first user using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
