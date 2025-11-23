"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  userId: z.number().optional(),
  companyId: z.number().optional(), // Taken from localStorage
  branchId: z.number().min(1, "Branch is required"),
  departmentId: z.number().min(1, "Department is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  passwordHash: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full Name is required"),
  designation: z.string().min(1, "Designation is required"),
  phoneNumber: z.string().optional(),
  roleId: z.number().min(1, "Role is required"),
  isActive: z.boolean().default(true),
  isLocked: z.boolean().default(false),
  version: z.number().optional(),
});

interface Branch {
  branchId: number;
  branchName: string;
  branchCode: string;
}

interface Department {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
}

interface Role {
  roleId: number;
  roleName: string;
}

interface UserDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function UserDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: UserDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: defaultState.userId || undefined,
      companyId: defaultState.companyId || 1,
      branchId: defaultState.branchId || 0,
      departmentId: defaultState.departmentId || 0,
      username: defaultState.username || "",
      passwordHash: "",
      email: defaultState.email || "",
      fullName: defaultState.fullName || "",
      designation: defaultState.designation || "",
      phoneNumber: defaultState.phoneNumber || "",
      roleId: defaultState.roleId || 0,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      isLocked: defaultState.isLocked || false,
      version: defaultState.version || 0,
    },
  });

  // Reset form when dialog opens/closes or when type changes
  useEffect(() => {
    if (open) {
      // Get company ID from localStorage
      const user = localStorage.getItem("user");
      let companyId = 1; // Default value

      if (user) {
        try {
          const u = JSON.parse(user);
          companyId = u?.companyId || 1;
        } catch (error) {
          console.error("Error parsing user JSON:", error);
        }
      }

      form.reset({
        userId: defaultState.userId || undefined,
        companyId: companyId, // Set from localStorage
        branchId: defaultState.branchId || 0,
        departmentId: defaultState.departmentId || 0,
        username: defaultState.username || "",
        passwordHash: "",
        email: defaultState.email || "",
        fullName: defaultState.fullName || "",
        designation: defaultState.designation || "",
        phoneNumber: defaultState.phoneNumber || "",
        roleId: defaultState.roleId || 0,
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        isLocked: defaultState.isLocked || false,
        version: defaultState.version || 0,
      });

      fetchBranches();
      fetchDepartments();
      fetchRoles();
    }
  }, [open, type, defaultState, form]);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Branch/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "BranchId,BranchName,BranchCode",
          where: "",
          sortOn: "branchName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      } else {
        throw new Error("Failed to fetch branches");
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load branches list",
      });
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Department/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "DepartmentId,DepartmentName,DepartmentCode",
          where: "IsActive == true",
          sortOn: "departmentName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        throw new Error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load departments list",
      });
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Role/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "RoleId,RoleName",
          where: "IsActive == true",
          sortOn: "roleName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        throw new Error("Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load roles list",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 0;
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Prepare payload according to requirements
    const payload: any = {
      username: values.username,
      email: values.email,
      fullName: values.fullName,
      designation: values.designation,
      phoneNumber: values.phoneNumber || "",
      roleId: values.roleId,
      isActive: values.isActive,
      isLocked: values.isLocked,
      version: values.version,
    };

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage
      payload.branchId = values.branchId;
      payload.departmentId = values.departmentId;
      payload.passwordHash = values.passwordHash || ""; // PasswordHash is required for new users
    } else {
      // For edit operation - include the ID and use received values
      payload.userId = values.userId;
      payload.companyId = values.companyId;
      payload.branchId = values.branchId;
      payload.departmentId = values.departmentId;
      // Only include passwordHash if provided for updates
      if (values.passwordHash) {
        payload.passwordHash = values.passwordHash;
      }
      // Use the version as received from backend (no increment)
    }

    // Add user tracking if needed
    // if (isUpdate) {
    //   payload.updatedBy = userID;
    // } else {
    //   payload.createdBy = userID;
    // }

    console.log("User Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "User", {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const responseData = await response.text();
      const jsonData = responseData ? JSON.parse(responseData) : null;

      if (jsonData?.statusCode >= 400) {
        throw new Error(jsonData.message || "Unknown error occurred");
      }

      setOpen(false);

      // Clear password field after successful submission
      form.setValue("passwordHash", "");

      // Prepare the response data to include in handleAddEdit
      const responseItem = {
        ...values,
        ...jsonData,
      };

      handleAddEdit(responseItem);

      toast({
        title: `User ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    form.setValue("passwordHash", password);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update user information and permissions."
              : "Create a new user account with access permissions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Display Company Info (read-only) */}
            <div className='p-3 bg-gray-50 rounded-md'>
              <div>
                <FormLabel className='text-sm font-medium text-gray-600'>
                  Company
                </FormLabel>
                <div className='mt-1 text-sm text-gray-900'>
                  {(() => {
                    const user = localStorage.getItem("user");
                    if (user) {
                      try {
                        const u = JSON.parse(user);
                        return u?.companyName || "Company 1";
                      } catch (error) {
                        return "Company 1";
                      }
                    }
                    return "Company 1";
                  })()}
                </div>
              </div>
            </div>

            {/* Organization Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>
                Organization Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Branch Dropdown */}
                <FormField
                  control={form.control}
                  name='branchId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch *</FormLabel>
                      <FormControl>
                        <select
                          className='w-full p-2 border rounded-md'
                          value={field.value || 0}
                          onChange={(e) => {
                            const value =
                              e.target.value === "0"
                                ? 0
                                : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                          disabled={loadingBranches}
                        >
                          <option value={0}>Select Branch</option>
                          {branches.map((branch) => (
                            <option
                              key={branch.branchId}
                              value={branch.branchId}
                            >
                              {branch.branchName} ({branch.branchCode})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      {loadingBranches && (
                        <p className='text-sm text-gray-500'>
                          Loading branches...
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department Dropdown */}
                <FormField
                  control={form.control}
                  name='departmentId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <FormControl>
                        <select
                          className='w-full p-2 border rounded-md'
                          value={field.value || 0}
                          onChange={(e) => {
                            const value =
                              e.target.value === "0"
                                ? 0
                                : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                          disabled={loadingDepartments}
                        >
                          <option value={0}>Select Department</option>
                          {departments.map((department) => (
                            <option
                              key={department.departmentId}
                              value={department.departmentId}
                            >
                              {department.departmentName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      {loadingDepartments && (
                        <p className='text-sm text-gray-500'>
                          Loading departments...
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* User Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>User Information</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Username */}
                <FormField
                  control={form.control}
                  name='username'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter username' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='Enter email address'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Full Name */}
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter full name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Designation */}
                <FormField
                  control={form.control}
                  name='designation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter designation' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name='phoneNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter phone number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Role & Permissions</h3>

              {/* Role Dropdown */}
              <FormField
                control={form.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || 0}
                        onChange={(e) => {
                          const value =
                            e.target.value === "0"
                              ? 0
                              : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={loadingRoles}
                      >
                        <option value={0}>Select Role</option>
                        {roles.map((role) => (
                          <option key={role.roleId} value={role.roleId}>
                            {role.roleName}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingRoles && (
                      <p className='text-sm text-gray-500'>Loading roles...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Security Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Security Information</h3>

              {/* PasswordHash Field */}
              <FormField
                control={form.control}
                name='passwordHash'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password{" "}
                      {type === "add" ? "*" : "(Leave blank to keep current)"}
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={
                            type === "add"
                              ? "Enter password"
                              : "Enter new password (optional)"
                          }
                          {...field}
                        />
                        <button
                          type='button'
                          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className='flex gap-2 mt-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={generateRandomPassword}
                      >
                        Generate Password
                      </Button>
                      {showPassword && form.watch("passwordHash") && (
                        <span className='text-xs text-gray-500 self-center'>
                          Password: {form.watch("passwordHash")}
                        </span>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Settings */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Is Active */}
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Status</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm font-medium'>
                          {field.value ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Locked */}
              <FormField
                control={form.control}
                name='isLocked'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lock Status</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <span className='text-sm font-medium'>
                          {field.value ? "Locked" : "Unlocked"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hidden fields */}
            <div className='hidden'>
              <FormField
                control={form.control}
                name='version'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='companyId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {type === "edit" && (
                <FormField
                  control={form.control}
                  name='userId'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type='hidden' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {type === "edit" ? "Update User" : "Add User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
