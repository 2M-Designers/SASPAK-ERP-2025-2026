"use client";

import { Button } from "@/components/ui/button";
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
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  employeeId: z.number().optional(),
  companyId: z.number().optional(),
  branchId: z.number().min(1, "Branch is required"),
  userId: z.number().min(1, "User is required"),
  employeeCode: z.string().optional(),
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  fatherName: z.string().min(1, "Father Name is required"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  gender: z.string().min(1, "Gender is required"),
  nationalIdNumber: z.string().min(1, "National ID Number is required"),
  joiningDate: z.string().min(1, "Joining Date is required"),
  confirmationDate: z.string().optional(),
  resignationDate: z.string().optional(),
  officialEmail: z
    .string()
    .email("Invalid official email address")
    .optional()
    .or(z.literal("")),
  personalEmail: z
    .string()
    .email("Invalid personal email address")
    .optional()
    .or(z.literal("")),
  mobileNumber: z.string().min(1, "Mobile Number is required"),
  departmentId: z.number().min(1, "Department is required"),
  designationId: z.number().min(1, "Designation is required"),
  reportsToEmployeeId: z.number().optional(),
  employmentStatus: z.string().min(1, "Employment Status is required"),
  isActive: z.boolean().default(true),
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

interface Designation {
  designationId: number;
  designationName: string;
}

interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

interface User {
  userId: number;
  username: string;
  email: string;
  fullName?: string;
}

interface EmployeeFormProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  onCancel: () => void;
}

export default function EmployeeForm({
  type,
  defaultState,
  handleAddEdit,
  onCancel,
}: EmployeeFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: defaultState.employeeId || undefined,
      companyId: defaultState.companyId || 1,
      branchId: defaultState.branchId || 0,
      userId: defaultState.userId || 0,
      employeeCode: defaultState.employeeCode || "",
      firstName: defaultState.firstName || "",
      lastName: defaultState.lastName || "",
      fatherName: defaultState.fatherName || "",
      dateOfBirth: defaultState.dateOfBirth || "",
      gender: defaultState.gender || "",
      nationalIdNumber: defaultState.nationalIdNumber || "",
      joiningDate: defaultState.joiningDate || "",
      confirmationDate: defaultState.confirmationDate || "",
      resignationDate: defaultState.resignationDate || "",
      officialEmail: defaultState.officialEmail || "",
      personalEmail: defaultState.personalEmail || "",
      mobileNumber: defaultState.mobileNumber || "",
      departmentId: defaultState.departmentId || 0,
      designationId: defaultState.designationId || 0,
      reportsToEmployeeId: defaultState.reportsToEmployeeId || 0,
      employmentStatus: defaultState.employmentStatus || "Active",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    let companyId = 1;
    let userId = 0;

    if (user) {
      try {
        const u = JSON.parse(user);
        companyId = u?.companyId || 1;
        userId = u?.userId || 0;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    form.reset({
      employeeId: defaultState.employeeId || undefined,
      companyId: companyId,
      branchId: defaultState.branchId || 0,
      userId: defaultState.userId || 0,
      employeeCode: defaultState.employeeCode || "",
      firstName: defaultState.firstName || "",
      lastName: defaultState.lastName || "",
      fatherName: defaultState.fatherName || "",
      dateOfBirth: defaultState.dateOfBirth || "",
      gender: defaultState.gender || "",
      nationalIdNumber: defaultState.nationalIdNumber || "",
      joiningDate: defaultState.joiningDate || "",
      confirmationDate: defaultState.confirmationDate || "",
      resignationDate: defaultState.resignationDate || "",
      officialEmail: defaultState.officialEmail || "",
      personalEmail: defaultState.personalEmail || "",
      mobileNumber: defaultState.mobileNumber || "",
      departmentId: defaultState.departmentId || 0,
      designationId: defaultState.designationId || 0,
      reportsToEmployeeId: defaultState.reportsToEmployeeId || 0,
      employmentStatus: defaultState.employmentStatus || "Active",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    });

    fetchBranches();
    fetchDepartments();
    fetchDesignations();
    fetchEmployees();
    fetchUsers();
  }, [type, defaultState]);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Branch/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      toast({ variant: "destructive", title: "Error", description: "Failed to load branches list" });
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
        headers: { "Content-Type": "application/json" },
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
      toast({ variant: "destructive", title: "Error", description: "Failed to load departments list" });
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchDesignations = async () => {
    setLoadingDesignations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Designation/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "DesignationId,DesignationName",
          where: "IsActive == true",
          sortOn: "designationName",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setDesignations(data);
      } else {
        throw new Error("Failed to fetch designations");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load designations list" });
    } finally {
      setLoadingDesignations(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Employee/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "EmployeeId,FirstName,LastName,EmployeeCode",
          where: "IsActive == true",
          sortOn: "FirstName",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        throw new Error("Failed to fetch employees");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load employees list" });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}User/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "UserId,Username",
          where: "IsActive == true",
          sortOn: "Username",
          page: "1",
          pageSize: "100",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load users list" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userId = 0;
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        userId = u?.userId || 0;
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    const payload: any = {
      firstName: values.firstName,
      lastName: values.lastName,
      fatherName: values.fatherName,
      dateOfBirth: values.dateOfBirth,
      branchId: values.branchId,
      userId: values.userId,
      gender: values.gender,
      nationalIdNumber: values.nationalIdNumber,
      joiningDate: values.joiningDate,
      confirmationDate: values.confirmationDate || null,
      resignationDate: values.resignationDate || null,
      officialEmail: values.officialEmail || "",
      personalEmail: values.personalEmail || "",
      mobileNumber: values.mobileNumber,
      departmentId: values.departmentId,
      designationId: values.designationId,
      reportsToEmployeeId:
        values.reportsToEmployeeId === 0 ? null : values.reportsToEmployeeId,
      employmentStatus: values.employmentStatus,
      isActive: values.isActive,
      version: values.version,
    };

    if (!isUpdate) {
      payload.companyId = companyId;
      payload.employeeCode = "0";
    } else {
      payload.employeeId = values.employeeId;
      payload.companyId = values.companyId;
      payload.employeeCode = values.employeeCode;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "Employee",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const responseData = await response.text();
      const jsonData = responseData ? JSON.parse(responseData) : null;

      if (jsonData?.statusCode >= 400) {
        throw new Error(jsonData.message || "Unknown error occurred");
      }

      const responseItem = {
        ...values,
        ...jsonData,
        ...(isUpdate ? {} : { employeeCode: jsonData?.employeeCode || "AUTO" }),
      };

      toast({
        title: `Employee ${type === "edit" ? "updated" : "added"} successfully.`,
      });

      // Navigate back to employee list
      handleAddEdit(responseItem);
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

  const companyName = (() => {
    if (typeof window === "undefined") return "SASPAK CARGO";
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const u = JSON.parse(user);
        return u?.companyName || "SASPAK CARGO";
      } catch {
        return "SASPAK CARGO";
      }
    }
    return "SASPAK CARGO";
  })();

  return (
    <div className="p-6 bg-white shadow-md rounded-md max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {type === "edit" ? "Edit Employee" : "Add New Employee"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {type === "edit"
              ? "Update employee information."
              : "Add a new employee to the system. Employee Code will be auto-generated."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Company & Employee Code Info */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FormLabel className="text-sm font-medium text-gray-600">
                  Company
                </FormLabel>
                <div className="mt-1 text-sm text-gray-900">{companyName}</div>
              </div>
              <div>
                <FormLabel className="text-sm font-medium text-gray-600">
                  Employee Code
                </FormLabel>
                <div className="mt-1 text-sm text-gray-900">
                  {type === "edit" ? (
                    form.watch("employeeCode") || "Not available"
                  ) : (
                    <span className="text-blue-600">Auto-generated by system</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0" ? 0 : parseInt(e.target.value)
                          )
                        }
                        disabled={loadingBranches}
                      >
                        <option value={0}>Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch.branchId} value={branch.branchId}>
                            {branch.branchName} ({branch.branchCode})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingBranches && (
                      <p className="text-sm text-gray-500">Loading branches...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || ""}
                        onChange={field.onChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0" ? 0 : parseInt(e.target.value)
                          )
                        }
                        disabled={loadingUsers}
                      >
                        <option value={0}>Select User</option>
                        {users.map((user) => (
                          <option key={user.userId} value={user.userId}>
                            {user.username}
                            
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingUsers && (
                      <p className="text-sm text-gray-500">Loading users...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter father name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationalIdNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter national ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Employment Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0" ? 0 : parseInt(e.target.value)
                          )
                        }
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
                      <p className="text-sm text-gray-500">Loading departments...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="designationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0" ? 0 : parseInt(e.target.value)
                          )
                        }
                        disabled={loadingDesignations}
                      >
                        <option value={0}>Select Designation</option>
                        {designations.map((designation) => (
                          <option
                            key={designation.designationId}
                            value={designation.designationId}
                          >
                            {designation.designationName}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingDesignations && (
                      <p className="text-sm text-gray-500">Loading designations...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reportsToEmployeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reports To</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || 0}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "0" ? 0 : parseInt(e.target.value)
                          )
                        }
                        disabled={loadingEmployees}
                      >
                        <option value={0}>Select Manager</option>
                        {employees
                          .filter((employee) =>
                            type === "edit"
                              ? employee.employeeId !== defaultState.employeeId
                              : true
                          )
                          .map((employee) => (
                            <option
                              key={employee.employeeId}
                              value={employee.employeeId}
                            >
                              {employee.employeeCode} - {employee.firstName}{" "}
                              {employee.lastName}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    {loadingEmployees && (
                      <p className="text-sm text-gray-500">Loading employees...</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employmentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Status *</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={field.value || ""}
                        onChange={field.onChange}
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Probation">Probation</option>
                        <option value="Contract">Contract</option>
                        <option value="Resigned">Resigned</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="joiningDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joining Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmation Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resignationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resignation Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="officialEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter official email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personalEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter personal email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">
                      {field.value ? "Active" : "Inactive"}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hidden fields */}
          <div className="hidden">
            <FormField control={form.control} name="version" render={({ field }) => (<FormItem><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="companyId" render={({ field }) => (<FormItem><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>)} />
            {type === "edit" && (
              <FormField control={form.control} name="employeeId" render={({ field }) => (<FormItem><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>)} />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === "edit" ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}