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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type UserPageProps = {
  initialData: any[];
};

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
    fieldName: "roleId",
    displayName: "Role ID",
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
    fieldName: "isAllowedRequestApproval",
    displayName: "Request Approval Allowed",
    isdisplayed: true,
    isselected: true,
  },
];

const displayedFields = fieldConfig.filter(
  (f) => f.isdisplayed && f.isselected,
);

export default function UserPage({ initialData }: UserPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Controlled edit dialog state
  const [fetchingUserId, setFetchingUserId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setData(Array.isArray(initialData) ? initialData : []);
  }, [initialData]);

  // ── Fetch full user record, then open edit dialog ─────────────────────────
  const handleEditClick = async (userId: number) => {
    setFetchingUserId(userId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}User/${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fullUser = await res.json();
      setEditUser(fullUser);
      setEditDialogOpen(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user details. Please try again.",
      });
      console.error("Error fetching user:", error);
    } finally {
      setFetchingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };

  // ── Lock / Unlock ─────────────────────────────────────────────────────────
  const handleLockUnlock = async (user: any) => {
    const action = user.isLocked ? "unlock" : "lock";
    if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`))
      return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}User`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          isLocked: !user.isLocked,
          failedLoginAttempts: 0,
        }),
      });
      if (!res.ok) throw new Error();
      setData((prev) =>
        prev.map((item) =>
          item.userId === user.userId
            ? { ...item, isLocked: !user.isLocked, failedLoginAttempts: 0 }
            : item,
        ),
      );
      toast({ title: `User ${action}ed successfully.` });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error ${action}ing user. Please try again.`,
      });
    }
  };

  // ── Reset failed attempts ─────────────────────────────────────────────────
  const handleResetAttempts = async (user: any) => {
    if (!confirm(`Reset failed login attempts for "${user.username}"?`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}User`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, failedLoginAttempts: 0 }),
      });
      if (!res.ok) throw new Error();
      setData((prev) =>
        prev.map((item) =>
          item.userId === user.userId
            ? { ...item, failedLoginAttempts: 0 }
            : item,
        ),
      );
      toast({ title: "Failed login attempts reset successfully." });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error resetting login attempts. Please try again.",
      });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (user: any) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`))
      return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}User/${user.userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setData((prev) => prev.filter((r) => r.userId !== user.userId));
      toast({ title: "User deleted successfully." });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error deleting user. Please try again.",
      });
    }
  };

  // ── Bool badge ────────────────────────────────────────────────────────────
  const BoolBadge = ({
    value,
    trueLabel,
    falseLabel,
    trueColor = "bg-green-100 text-green-800",
    falseColor = "bg-gray-100 text-gray-800",
  }: {
    value: unknown;
    trueLabel: string;
    falseLabel: string;
    trueColor?: string;
    falseColor?: string;
  }) => {
    const isTrue =
      value === true || value === 1 || value === "true" || value === "1";
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isTrue ? trueColor : falseColor}`}
      >
        {isTrue ? trueLabel : falseLabel}
      </span>
    );
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        const isFetchingThis = fetchingUserId === user.userId;
        return (
          <div className='flex gap-2 items-center'>
            <button
              className='text-blue-600 hover:text-blue-800 disabled:opacity-40'
              title='Edit User'
              disabled={isFetchingThis}
              onClick={() => handleEditClick(user.userId)}
            >
              {isFetchingThis ? (
                <Loader2 size={15} className='animate-spin' />
              ) : (
                <FiEdit size={16} />
              )}
            </button>
            <button
              className={
                user.isLocked
                  ? "text-green-600 hover:text-green-800"
                  : "text-yellow-600 hover:text-yellow-800"
              }
              onClick={() => handleLockUnlock(user)}
              title={user.isLocked ? "Unlock User" : "Lock User"}
            >
              {user.isLocked ? <FiUnlock size={16} /> : <FiLock size={16} />}
            </button>
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
              title='Delete User'
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
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("username") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "fullName",
      header: "Full Name",
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue("fullName") || "-"}</span>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.getValue("email") || "-"}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => <span>{row.getValue("designation") || "-"}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone Number",
      cell: ({ row }) => <span>{row.getValue("phoneNumber") || "-"}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "roleName",
      header: "Role",
      cell: ({ row }) => <span>{row.getValue("roleName") || "-"}</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) => {
        const v = row.getValue("lastLoginAt");
        return (
          <span className='text-sm'>
            {v ? formatDate(v as string) : "Never"}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "failedLoginAttempts",
      header: "Failed Attempts",
      cell: ({ row }) => {
        const a = (row.getValue("failedLoginAttempts") as number) ?? 0;
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${a > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
          >
            {a}
          </span>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "isLocked",
      header: "Lock Status",
      cell: ({ row }) => (
        <BoolBadge
          value={row.getValue("isLocked")}
          trueLabel='Locked'
          falseLabel='Unlocked'
          trueColor='bg-red-100 text-red-800'
          falseColor='bg-green-100 text-green-800'
        />
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <BoolBadge
          value={row.getValue("isActive")}
          trueLabel='Active'
          falseLabel='Inactive'
          trueColor='bg-green-100 text-green-800'
          falseColor='bg-red-100 text-red-800'
        />
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "isAllowedRequestApproval",
      header: "Request Approval",
      cell: ({ row }) => (
        <BoolBadge
          value={row.getValue("isAllowedRequestApproval")}
          trueLabel='Allowed'
          falseLabel='Not Allowed'
          trueColor='bg-blue-100 text-blue-800'
          falseColor='bg-gray-100 text-gray-800'
        />
      ),
      enableColumnFilter: false,
    },
  ];

  // ── Excel ─────────────────────────────────────────────────────────────────
  const downloadExcelWithData = () => {
    if (!data?.length) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export.",
      });
      return;
    }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Users");
    ws.addRow(displayedFields.map((f) => f.displayName));
    data.forEach((user) =>
      ws.addRow(
        displayedFields.map((field) => {
          const v = user[field.fieldName];
          if (field.fieldName === "lastLoginAt") return v ? new Date(v) : "";
          if (
            ["isActive", "isLocked", "isAllowedRequestApproval"].includes(
              field.fieldName,
            )
          )
            return v ? "Yes" : "No";
          return v ?? "";
        }),
      ),
    );
    displayedFields.forEach((field, idx) => {
      if (field.fieldName === "lastLoginAt")
        ws.getColumn(idx + 1).numFmt = "dd/mm/yyyy hh:mm:ss";
    });
    wb.xlsx
      .writeBuffer()
      .then((buf: any) => {
        saveAs(
          new Blob([buf]),
          `Users_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
        toast({ title: "Export Successful" });
      })
      .catch(() => toast({ variant: "destructive", title: "Export Error" }));
  };

  const downloadSampleExcel = () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("SampleUsers");
    ws.addRow(displayedFields.map((f) => f.displayName));
    ws.addRow(
      displayedFields.map((field) => {
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
          case "roleName":
            return "Admin";
          case "lastLoginAt":
            return new Date();
          case "isActive":
            return "Yes";
          case "isLocked":
            return "No";
          case "failedLoginAttempts":
            return 0;
          case "isAllowedRequestApproval":
            return "Yes";
          default:
            return `Sample ${field.displayName}`;
        }
      }),
    );
    displayedFields.forEach((field, idx) => {
      if (field.fieldName === "lastLoginAt")
        ws.getColumn(idx + 1).numFmt = "dd/mm/yyyy hh:mm:ss";
    });
    wb.xlsx
      .writeBuffer()
      .then((buf: any) => {
        saveAs(new Blob([buf]), "SampleFile_Users.xlsx");
        toast({ title: "Sample Downloaded" });
      })
      .catch(() => toast({ variant: "destructive", title: "Download Error" }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    if (!event.target.files[0].name.endsWith(".xlsx")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload an Excel (.xlsx) file.",
      });
      return;
    }
    setIsLoading(true);
    readXlsxFile(event.target.files[0])
      .then((rows: any) => insertData(rows.slice(1)))
      .catch(() => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "File Read Error" });
      });
  };

  const insertData = async (newData: any[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const results = { success: 0, failed: 0 };
    try {
      for (const row of newData) {
        try {
          const payload: any = {};
          displayedFields.forEach((field, index) => {
            if (index >= row.length) return;
            let value = row[index];
            switch (field.fieldName) {
              case "isActive":
              case "isLocked":
              case "isAllowedRequestApproval":
                value =
                  value?.toString().toLowerCase() === "yes" ||
                  value === true ||
                  value === 1;
                break;
              case "failedLoginAttempts":
              case "roleId":
                value = parseInt(value) || 0;
                break;
              case "lastLoginAt":
                value = value ? new Date(value).toISOString() : null;
                break;
            }
            payload[field.fieldName] = value;
          });
          const res = await fetch(`${baseUrl}User`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) results.success++;
          else results.failed++;
        } catch {
          results.failed++;
        }
      }
      setIsLoading(false);
      toast(
        results.failed === 0
          ? {
              title: "Import Successful",
              description: `${results.success} users imported!`,
            }
          : {
              variant: results.success > 0 ? "default" : "destructive",
              title: results.success > 0 ? "Partial Import" : "Import Failed",
              description: `${results.success} imported, ${results.failed} failed.`,
            },
      );
      router.refresh();
    } catch {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Import Error" });
    }
  };

  const filteredData = data?.filter((item) =>
    Object.values(item).some((v: any) =>
      v?.toString().toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className='p-6 bg-white shadow-md rounded-md'>
      <h1 className='text-2xl font-bold mb-4'>Users</h1>

      <div className='flex justify-between items-center mb-4 flex-wrap gap-4'>
        {/* Add User — uncontrolled, uses its own internal trigger */}
        <UserDialog
          type='add'
          defaultState={{}}
          handleAddEdit={(newItem) => {
            setData((prev) => [...(prev || []), newItem]);
            router.refresh();
          }}
        />

        <div className='flex gap-3 items-center flex-wrap'>
          <Button
            onClick={downloadSampleExcel}
            className='flex items-center gap-2'
            variant='outline'
          >
            <FiDownload /> Sample File
          </Button>
          <Button
            onClick={downloadExcelWithData}
            className='flex items-center gap-2'
            variant='outline'
            disabled={!data?.length}
          >
            <FiDownload /> Export to Excel
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
            placeholder='🔍 Search users...'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='min-w-[250px]'
          />
        </div>
      </div>

      {/* Edit dialog — controlled by page, opens after GET /User/{id} */}
      {editUser && (
        <UserDialog
          type='edit'
          defaultState={editUser}
          open={editDialogOpen}
          onOpenChange={(next) => {
            setEditDialogOpen(next);
            if (!next) setEditUser(null);
          }}
          handleAddEdit={(updatedItem) => {
            setData((prev) =>
              prev.map((item) =>
                item.userId === updatedItem.userId
                  ? { ...item, ...updatedItem }
                  : item,
              ),
            );
            setEditUser(null);
            router.refresh();
          }}
        />
      )}

      {isLoading ? (
        <div className='flex justify-center items-center py-12'>
          <AppLoader />
        </div>
      ) : data?.length ? (
        <AppDataTable
          data={filteredData ?? []}
          loading={false}
          columns={columns}
          searchText={searchText}
          searchBy='username'
          isPage
          isMultiSearch
        />
      ) : (
        <div className='text-center py-12 border rounded-lg bg-gray-50'>
          <p className='text-gray-500 text-lg mb-2'>No users found</p>
          <p className='text-gray-400 text-sm'>
            {initialData === null
              ? "Loading users data..."
              : "Add your first user using the 'Add User' button above"}
          </p>
        </div>
      )}
    </div>
  );
}
