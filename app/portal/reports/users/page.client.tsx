"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import AppLoader from "@/components/app-loader";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import PasswordForm from "@/views/forms/change-password";
import RoleChangeForm from "@/views/forms/change-user-role";
import UserForm from "@/views/forms/user-form";
import AccessModeForm from "@/views/forms/change-access-mode";
import Select from "react-select";

// Add proper type for props with children
interface TableCellProps {
  children: ReactNode;
  className?: string;
}

const TableCell = ({ children, className = "" }: TableCellProps) => (
  <div className={className}>{children}</div>
);

type HomePageClientProps = {
  initialData: any[];
  roles: any[];
  regulators: any[];
};

export default function ClientComponent({
  initialData,
  roles,
  regulators,
}: HomePageClientProps) {
  const router = useRouter();

  const [data, setData] = useState<any[]>(initialData);
  const [filteredData, setFilteredData] = useState<any[]>(initialData);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // State for filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<any>(null);
  const [regulatorFilter, setRegulatorFilter] = useState<any>(null);
  const [operatorFilter, setOperatorFilter] = useState<any>(null);
  const [accessFilter, setAccessFilter] = useState<any>(null);

  // State management for edit functionality
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch Users by Logged-in userID from localStorage
  // Fetch Users
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const user = localStorage.getItem("user");
      let userID = null;
      if (user) {
        const parsed = JSON.parse(user);
        userID = parsed?.userID;
      }

      if (!userID) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}Utility/GetAllUsers?userID=${userID}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setFilteredData(result);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Handle search & filters
  useEffect(() => {
    let result = [...data];

    if (searchText) {
      result = result.filter((item) =>
        item.username?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (roleFilter) {
      result = result.filter((item) => item.roleID === roleFilter.value);
    }
    if (regulatorFilter) {
      result = result.filter(
        (item) => item.regulatorID === regulatorFilter.value
      );
    }
    if (operatorFilter) {
      result = result.filter(
        (item) => item.operatorID === operatorFilter.value
      );
    }
    if (accessFilter !== null) {
      result = result.filter(
        (item) => item.isReadOnlyMode === (accessFilter.value === "readonly")
      );
    }

    setFilteredData(result);
  }, [
    searchText,
    roleFilter,
    regulatorFilter,
    operatorFilter,
    accessFilter,
    data,
  ]);

  // Reset filters and refresh data
  const handleRefresh = () => {
    setSearchText("");
    setRoleFilter(null);
    setRegulatorFilter(null);
    setOperatorFilter(null);
    setAccessFilter(null);
    // Refetch data instead of just resetting filteredData
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const user = localStorage.getItem("user");
        let userID = null;
        if (user) {
          const parsed = JSON.parse(user);
          userID = parsed?.userID;
        }

        if (!userID) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}Utility/GetAllUsers?userID=${userID}`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setFilteredData(result);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setIsLoading(false);
    };

    fetchUserData();
  };

  // Handle delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setDeletingUserId(userId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/delete/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const updatedData = data.filter((user) => user.userID !== userId);
        setData(updatedData);
        setFilteredData(updatedData);
        alert("User deleted successfully!");
      } else {
        alert("Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  // Edit
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleUserUpdated = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    fetchUserData();
    handleRefresh(); // Refresh the data after update
  };

  // Summary
  const summary = {
    total: filteredData.length,
    fullAccess: filteredData.filter((u) => !u.isReadOnlyMode).length,
    readOnly: filteredData.filter((u) => u.isReadOnlyMode).length,
  };

  // Custom select styles for react-select
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
      minHeight: "42px",
      borderRadius: "8px",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#eff6ff"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#eff6ff",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "row",
      header: "S.No",
      cell: ({ row }) => (
        <TableCell className='text-center text-sm font-medium text-gray-600'>
          {parseInt(row.id) + 1}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "username",
      header: "User Name",
      cell: ({ row }) => (
        <TableCell className='font-semibold text-gray-900'>
          {row.getValue("username")}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "passwordHash",
      header: "Password",
      cell: ({ row }) => (
        <TableCell>
          <div className='font-mono text-xs bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-gray-600 max-w-[120px] truncate'>
            {row.getValue("passwordHash")}
          </div>
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "roleName",
      header: "Role",
      cell: ({ row }) => (
        <TableCell>
          <span className='inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold'>
            {row.getValue("roleName")}
          </span>
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "regulatorName",
      header: "Regulator",
      cell: ({ row }) => (
        <TableCell>
          <span className='text-sm text-gray-700'>
            {row.getValue("regulatorName") || (
              <span className='text-gray-400 italic'>N/A</span>
            )}
          </span>
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "operatorName",
      header: "Operator",
      cell: ({ row }) => {
        const operatorName = row.getValue("operatorName");
        const displayName =
          operatorName && String(operatorName).trim() !== ""
            ? String(operatorName)
            : null;

        return (
          <TableCell>
            <div className='text-sm text-gray-700'>
              {displayName ? (
                <span className='inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium'>
                  {displayName}
                </span>
              ) : (
                <span className='text-gray-400 italic text-xs'>
                  All Operators
                </span>
              )}
            </div>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "enteredOn",
      header: "Created On",
      cell: ({ row }) => {
        const enteredOn = row.getValue("enteredOn");
        return (
          <TableCell>
            <div className='text-xs text-gray-600 font-medium'>
              {enteredOn ? moment(enteredOn).format("MMM DD, YYYY") : "N/A"}
            </div>
            <div className='text-xs text-gray-400'>
              {enteredOn ? moment(enteredOn).format("HH:mm A") : ""}
            </div>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "Change Role",
      header: () => (
        <TableCell className='text-center text-xs font-semibold text-gray-600 uppercase tracking-wide'>
          Change Role
        </TableCell>
      ),
      cell: ({ row }) => (
        <TableCell>
          <div className='flex justify-center'>
            <RoleChangeForm
              defaultState={row.original}
              roles={roles}
              onRoleChanged={handleRefresh}
            />
          </div>
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "Change Password",
      header: () => (
        <TableCell className='text-center text-xs font-semibold text-gray-600 uppercase tracking-wide'>
          Change Password
        </TableCell>
      ),
      cell: ({ row }) => (
        <TableCell>
          <div className='flex justify-center'>
            <PasswordForm
              UserID={row.original.userID}
              onPasswordChanged={handleRefresh}
            />
          </div>
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "Change Access Mode",
      header: () => (
        <TableCell className='text-center text-xs font-semibold text-gray-600 uppercase tracking-wide'>
          Access Mode
        </TableCell>
      ),
      cell: ({ row }) => (
        <TableCell>
          <div className='flex justify-center'>
            <AccessModeForm
              UserID={row.original.userID}
              currentMode={row.original.isReadOnlyMode}
              onAccessModeChanged={handleRefresh}
            />
          </div>
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "isReadOnlyMode",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isReadOnlyMode") === true;

        return (
          <TableCell>
            <div className='flex justify-center'>
              {isActive ? (
                <span className='inline-flex items-center px-2 py-1 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold'>
                  <svg
                    className='w-3 h-3 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Read Only
                </span>
              ) : (
                <span className='inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold'>
                  <svg
                    className='w-3 h-3 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Full Access
                </span>
              )}
            </div>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "actions",
      header: () => (
        <TableCell className='text-center text-xs font-semibold text-gray-600 uppercase tracking-wide'>
          Actions
        </TableCell>
      ),
      cell: ({ row }) => {
        const user = row.original;
        const isDeleting = deletingUserId === user.userID;

        return (
          <TableCell>
            <div className='flex justify-center items-center space-x-2'>
              {/* Edit Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleEditUser(user)}
                className='h-8 w-8 p-0 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:scale-105'
                title='Edit User'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              </Button>

              {/* Delete Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleDeleteUser(user.userID)}
                disabled={isDeleting}
                className='h-8 w-8 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 transition-all duration-200 hover:scale-105'
                title='Delete User'
              >
                {isDeleting ? (
                  <svg
                    className='animate-spin h-4 w-4 text-red-600'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    />
                  </svg>
                )}
              </Button>
            </div>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-6'>
      <div className='max-w-8xl mx-auto'>
        {/* Compact Header Section */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-6 mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between mb-4'>
            <div className='mb-4 lg:mb-0'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl'>
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                    />
                  </svg>
                </div>
                <div>
                  <h1 className='text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
                    Users Management
                  </h1>
                  <p className='text-gray-600 text-sm'>
                    Manage system users and permissions
                  </p>
                </div>
              </div>
            </div>
            <div className='flex-shrink-0'>
              <UserForm
                roles={roles}
                regulators={regulators}
                onUserCreated={fetchUserData}
              />
            </div>
          </div>

          {/* Compact Summary Cards */}
          <div className='grid grid-cols-3 gap-4'>
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-600 font-medium text-xs uppercase tracking-wide'>
                    Total
                  </p>
                  <p className='text-2xl font-bold text-blue-700'>
                    {summary.total}
                  </p>
                </div>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-blue-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-green-600 font-medium text-xs uppercase tracking-wide'>
                    Full Access
                  </p>
                  <p className='text-2xl font-bold text-green-700'>
                    {summary.fullAccess}
                  </p>
                </div>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-green-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-amber-600 font-medium text-xs uppercase tracking-wide'>
                    Read Only
                  </p>
                  <p className='text-2xl font-bold text-amber-700'>
                    {summary.readOnly}
                  </p>
                </div>
                <div className='p-2 bg-amber-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-amber-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit User Dialog */}
        <UserForm
          roles={roles}
          regulators={regulators}
          onUserUpdated={handleUserUpdated}
          editMode
          userData={editingUser}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />

        {/* Collapsible Filters Section */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 mb-6'>
          {/* Filter Header with Toggle */}
          <div className='p-4 border-b border-gray-100'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-gray-100 rounded-lg'>
                  <svg
                    className='w-5 h-5 text-gray-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-800'>
                    Search & Filters
                  </h2>
                  <p className='text-gray-500 text-sm'>
                    Filter users by various criteria
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                {/* Active filters indicator */}
                {(roleFilter ||
                  regulatorFilter ||
                  operatorFilter ||
                  accessFilter ||
                  searchText) && (
                  <div className='flex items-center space-x-2'>
                    <span className='bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium'>
                      {
                        [
                          roleFilter,
                          regulatorFilter,
                          operatorFilter,
                          accessFilter,
                          searchText,
                        ].filter(Boolean).length
                      }{" "}
                      active
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleRefresh}
                      className='text-xs h-7 px-2 text-gray-600 hover:text-gray-800'
                    >
                      Clear all
                    </Button>
                  </div>
                )}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowFilters(!showFilters)}
                  className='flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                >
                  <span>{showFilters ? "Hide" : "Show"} Filters</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible Filter Content */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <div className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
                {/* Search Input */}
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='Search users...'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='pl-10 h-[42px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg'
                  />
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      className='h-5 w-5 text-gray-400'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </div>
                </div>

                {/* Role Filter */}
                <Select
                  options={roles}
                  value={roleFilter}
                  onChange={setRoleFilter}
                  placeholder='Filter by Role'
                  isClearable
                  styles={selectStyles}
                />

                {/* Regulator Filter */}
                <Select
                  options={regulators}
                  value={regulatorFilter}
                  onChange={setRegulatorFilter}
                  placeholder='Filter by Regulator'
                  isClearable
                  styles={selectStyles}
                />

                {/* Operator Filter */}
                <Select
                  options={data
                    .map((o) => ({
                      value: o.operatorID,
                      label: o.operatorName,
                    }))
                    .filter(Boolean)}
                  value={operatorFilter}
                  onChange={setOperatorFilter}
                  placeholder='Filter by Operator'
                  isClearable
                  styles={selectStyles}
                />

                {/* Access Mode Filter */}
                <Select
                  options={[
                    { value: "full", label: "Full Access" },
                    { value: "readonly", label: "Read Only" },
                  ]}
                  value={accessFilter}
                  onChange={setAccessFilter}
                  placeholder='Access Mode'
                  isClearable
                  styles={selectStyles}
                />
              </div>

              {/* Action buttons in filter section */}
              <div className='flex justify-end mt-4 pt-4 border-t border-gray-100'>
                <Button
                  onClick={handleRefresh}
                  className='bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white border-0 rounded-lg transition-all duration-200 hover:shadow-lg'
                >
                  <svg
                    className='h-4 w-4 mr-2'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-50 rounded-lg'>
                <svg
                  className='w-5 h-5 text-blue-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-800'>
                  User Directory
                </h2>
                <p className='text-gray-600 text-sm'>
                  Showing {filteredData.length} of {data.length} users
                </p>
              </div>
            </div>
          </div>

          <div className='overflow-hidden'>
            <AppDataTable
              data={filteredData ?? []}
              loading={isLoading}
              columns={columns}
            />
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-2xl p-8 shadow-2xl'>
              <AppLoader />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
