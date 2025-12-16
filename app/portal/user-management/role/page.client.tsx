"use client";

import { useState, useEffect } from "react";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import readXlsxFile from "read-excel-file";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import RoleDialog from "@/views/dialogs/user-dialogs/dialog-role";
import AppLoader from "@/components/app-loader";
import {
  FiTrash2,
  FiDownload,
  FiEdit,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

type RolePageProps = {
  initialData: any[];
};

// Static field configuration for Role
const fieldConfig = [
  {
    fieldName: "roleId",
    displayName: "Role ID",
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
    fieldName: "roleName",
    displayName: "Role Name",
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
    fieldName: "isSystemRole",
    displayName: "System Role",
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
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "createdAt",
    displayName: "Created At",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "updatedAt",
    displayName: "Updated At",
    isdisplayed: true,
    isselected: true,
  },
  {
    fieldName: "version",
    displayName: "Version",
    isdisplayed: true,
    isselected: true,
  },
];

// Get only displayed fields for the table
const displayedFields = fieldConfig.filter(
  (field) => field.isdisplayed && field.isselected
);

export default function RolePage({ initialData }: RolePageProps) {
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

  // Get company ID from localStorage (assuming it's stored there after login)
  const getCompanyId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("companyId") || "";
    }
    return "";
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Handle toggle active/inactive status
  const handleToggleActive = async (role: any) => {
    const action = role.isActive ? "deactivate" : "activate";
    if (
      confirm(`Are you sure you want to ${action} role "${role.roleName}"?`)
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Role/${role.roleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...role,
            isActive: !role.isActive,
          }),
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.map((item: any) =>
              item.roleId === role.roleId
                ? { ...item, isActive: !role.isActive }
                : item
            )
          );
          alert(`Role ${action}d successfully.`);
        } else {
          throw new Error(`Failed to ${action} role`);
        }
      } catch (error) {
        alert(`Error ${action}ing role. Please try again.`);
        console.error(`Error ${action}ing role:`, error);
      }
    }
  };

  // Handle toggle system role status
  const handleToggleSystemRole = async (role: any) => {
    const action = role.isSystemRole ? "remove from" : "make";
    if (
      confirm(
        `Are you sure you want to ${action} "${role.roleName}" a system role?`
      )
    ) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Role/${role.roleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...role,
            isSystemRole: !role.isSystemRole,
          }),
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.map((item: any) =>
              item.roleId === role.roleId
                ? { ...item, isSystemRole: !role.isSystemRole }
                : item
            )
          );
          alert(`Role updated successfully.`);
        } else {
          throw new Error(`Failed to update role`);
        }
      } catch (error) {
        alert(`Error updating role. Please try again.`);
        console.error(`Error updating role:`, error);
      }
    }
  };

  // Generate columns based on the static field configuration
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className='flex gap-2'>
            <RoleDialog
              type='edit'
              defaultState={role}
              handleAddEdit={(updatedItem: any) => {
                setData((prev: any) =>
                  prev.map((item: any) =>
                    item.roleId === updatedItem.roleId ? updatedItem : item
                  )
                );
                router.refresh();
              }}
            >
              <button className='text-blue-600 hover:text-blue-800'>
                <FiEdit size={16} />
              </button>
            </RoleDialog>

            {/* Toggle Active/Inactive Button 
            <button
              className={`${
                role.isActive
                  ? "text-green-600 hover:text-green-800"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => handleToggleActive(role)}
              title={role.isActive ? "Deactivate Role" : "Activate Role"}
            >
              {role.isActive ? (
                <FiToggleRight size={18} />
              ) : (
                <FiToggleLeft size={18} />
              )}
            </button>
*/}
            {/* Toggle System Role Button 
            <button
              className={`${
                role.isSystemRole
                  ? "text-purple-600 hover:text-purple-800"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => handleToggleSystemRole(role)}
              title={
                role.isSystemRole ? "Remove System Role" : "Make System Role"
              }
            >
              {role.isSystemRole ? (
                <FiToggleRight size={18} />
              ) : (
                <FiToggleLeft size={18} />
              )}
            </button>
*/}
            <button
              className='text-red-600 hover:text-red-800'
              onClick={() => handleDelete(role)}
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
    // Role Name
    {
      accessorKey: "roleName",
      header: "Role Name",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("roleName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // Description
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className='text-sm'>{row.getValue("description") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    // System Role
    {
      accessorKey: "isSystemRole",
      header: "System Role",
      cell: ({ row }) => {
        const isSystemRole = row.getValue("isSystemRole");
        return isSystemRole ? (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
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
    // Status
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
    // Created By
    /*{
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => (
        <span className='text-sm'>{row.getValue("createdBy") || "-"}</span>
      ),
      enableColumnFilter: false,
    },*/
    // Created At
    /*{
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt");
        return (
          <span className='text-sm'>
            {createdAt ? formatDate(createdAt as string) : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },*/
    // Updated At
    /*{
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => {
        const updatedAt = row.getValue("updatedAt");
        return (
          <span className='text-sm'>
            {updatedAt ? formatDate(updatedAt as string) : "-"}
          </span>
        );
      },
      enableColumnFilter: false,
    },*/
    // Version
    /*{
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => (
        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
          v{row.getValue("version") || 1}
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
    const worksheet = workbook.addWorksheet("Roles");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add data rows
    data.forEach((role: any) => {
      const row = displayedFields.map((field) => {
        const value = role[field.fieldName];

        // Format dates for Excel
        if (
          field.fieldName === "createdAt" ||
          field.fieldName === "updatedAt"
        ) {
          return value ? new Date(value) : "";
        }

        // Format boolean fields
        if (
          field.fieldName === "isSystemRole" ||
          field.fieldName === "isActive"
        ) {
          return value ? "Yes" : "No";
        }

        return value || "";
      });
      worksheet.addRow(row);
    });

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "createdAt" || field.fieldName === "updatedAt"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy hh:mm:ss";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "Roles.xlsx");
    });
  };

  const downloadSampleExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SampleRoles");

    // Add headers
    const headers = displayedFields.map((field) => field.displayName);
    worksheet.addRow(headers);

    // Add sample data
    const sampleRow = displayedFields.map((field) => {
      const companyId = getCompanyId();

      switch (field.fieldName) {
        case "roleId":
          return "";
        case "companyId":
          return companyId || "COMPANY_ID";
        case "roleName":
          return "Administrator";
        case "description":
          return "Full system access with all permissions";
        case "isSystemRole":
          return true;
        case "isActive":
          return true;
        case "createdBy":
          return "System";
        case "createdAt":
          return new Date();
        case "updatedAt":
          return new Date();
        case "version":
          return "1.0";
        default:
          return `Sample ${field.displayName}`;
      }
    });

    worksheet.addRow(sampleRow);

    // Add more sample rows
    const sampleRows = [
      {
        roleName: "Manager",
        description: "Department manager with limited administrative access",
        isSystemRole: false,
        isActive: true,
        createdBy: "System",
        version: "1.0",
      },
      {
        roleName: "Viewer",
        description: "Read-only access to reports and dashboards",
        isSystemRole: false,
        isActive: true,
        createdBy: "System",
        version: "1.0",
      },
    ];

    sampleRows.forEach((sample) => {
      const row = displayedFields.map((field) => {
        const companyId = getCompanyId();

        switch (field.fieldName) {
          case "roleId":
            return "";
          case "companyId":
            return companyId || "COMPANY_ID";
          case "roleName":
            return sample.roleName;
          case "description":
            return sample.description;
          case "isSystemRole":
            return sample.isSystemRole;
          case "isActive":
            return sample.isActive;
          case "createdBy":
            return sample.createdBy;
          case "createdAt":
            return new Date();
          case "updatedAt":
            return new Date();
          case "version":
            return sample.version;
          default:
            return "";
        }
      });
      worksheet.addRow(row);
    });

    // Format date columns
    const dateColumns = displayedFields
      .map((field, index) =>
        field.fieldName === "createdAt" || field.fieldName === "updatedAt"
          ? index + 1
          : null
      )
      .filter((index) => index !== null);

    dateColumns.forEach((colIndex: any) => {
      worksheet.getColumn(colIndex).numFmt = "dd/mm/yyyy hh:mm:ss";
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      saveAs(new Blob([buffer]), "SampleFile_Roles.xlsx");
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
    const companyId = getCompanyId();

    try {
      await Promise.all(
        newData.map(async (row) => {
          // Create payload object by mapping Excel columns to field names
          const payload: any = {
            companyId: companyId,
            createdBy: "System", // Default value for bulk import
          };

          displayedFields.forEach((field, index) => {
            if (index < row.length) {
              let value = row[index];

              // Handle boolean fields
              if (
                field.fieldName === "isActive" ||
                field.fieldName === "isSystemRole"
              ) {
                value = Boolean(value);
              }

              // Handle numeric fields
              if (field.fieldName === "version") {
                value = parseFloat(value) || 1.0;
              }

              // Handle date fields
              if (
                field.fieldName === "createdAt" ||
                field.fieldName === "updatedAt"
              ) {
                if (value) {
                  value = new Date(value).toISOString();
                }
              }

              // Skip companyId if already set
              if (field.fieldName !== "companyId") {
                payload[field.fieldName] = value;
              }
            }
          });

          await fetch(`${baseUrl}Role`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );

      setIsLoading(false);
      alert("Roles imported successfully! Refreshing data...");
      router.refresh();
    } catch (error) {
      setIsLoading(false);
      alert("Error importing Roles. Please check the file format.");
      console.error("Error importing data:", error);
    }
  };

  const handleDelete = async (role: any) => {
    if (confirm(`Are you sure you want to delete role "${role.roleName}"?`)) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Role/${role.roleId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setData((prev: any) =>
            prev.filter((record: any) => record.roleId !== role.roleId)
          );
          alert("Role deleted successfully.");
        } else {
          throw new Error("Failed to delete Role");
        }
      } catch (error) {
        alert("Error deleting Role. Please try again.");
        console.error("Error deleting Role:", error);
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
      <h1 className='text-2xl font-bold mb-4'>Roles</h1>
      <div className='flex justify-between items-center mb-4'>
        <RoleDialog
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
            placeholder='🔍 Search roles...'
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
          searchBy='roleName'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-lg'>No roles found</p>
          <p className='text-gray-400 text-sm mt-2'>
            {initialData === null
              ? "Loading..."
              : "Add your first role using the button above"}
          </p>
        </div>
      )}

      {isLoading && <AppLoader />}
    </div>
  );
}
