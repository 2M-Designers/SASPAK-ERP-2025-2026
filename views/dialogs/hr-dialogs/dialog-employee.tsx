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
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  employeeId: z.number().optional(),
  companyId: z.number().optional(), // Taken from localStorage, default 1
  branchId: z.number().min(1, "Branch is required"),
  userId: z.number().optional(), // Taken from localStorage
  employeeCode: z.string().optional(), // Auto-generated at backend, send 0
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

interface EmployeeDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function EmployeeDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: EmployeeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: defaultState.employeeId || undefined,
      companyId: defaultState.companyId || 1,
      branchId: defaultState.branchId || 0,
      userId: defaultState.userId || undefined,
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

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Reset form when dialog opens/closes or when type changes
  useEffect(() => {
    if (open) {
      // Get company ID and user ID from localStorage
      const user = localStorage.getItem("user");
      let companyId = 1; // Default to 1 as per requirement
      let userId = 0;

      if (user) {
        try {
          const u = JSON.parse(user);
          companyId = u?.companyId || 1;
          userId = u?.userID || 0;
        } catch (error) {
          console.error("Error parsing user JSON:", error);
        }
      }

      form.reset({
        employeeId: defaultState.employeeId || undefined,
        companyId: companyId, // Set from localStorage with default 1
        branchId: defaultState.branchId || 0,
        userId: userId, // Set from localStorage
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

  const fetchDesignations = async () => {
    setLoadingDesignations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Designation/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      console.error("Error fetching designations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load designations list",
      });
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "EmployeeId,FirstName,LastName,EmployeeCode",
          where: "IsActive == true",
          sortOn: "firstName",
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
      console.error("Error fetching employees:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load employees list",
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 0;
    let companyId = 1; // Default to 1 as per requirement

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
      firstName: values.firstName,
      lastName: values.lastName,
      fatherName: values.fatherName,
      dateOfBirth: values.dateOfBirth,
      branchId: values.branchId,
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

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage with default 1
      payload.userId = userID; // From localStorage
      payload.employeeCode = "0"; // Send 0 for auto-generation at backend
    } else {
      // For edit operation - include the ID and use received version
      payload.employeeId = values.employeeId;
      payload.companyId = values.companyId;
      payload.userId = values.userId;
      payload.employeeCode = values.employeeCode;
      // Use the version as received from backend (no increment)
    }

    // Add user tracking if needed
    // if (isUpdate) {
    //   payload.updatedBy = userID;
    // } else {
    //   payload.createdBy = userID;
    // }

    console.log("Employee Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "Employee",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

      setOpen(false);

      // Prepare the response data to include in handleAddEdit
      const responseItem = {
        ...values,
        ...jsonData,
        // For add operations, include the generated employeeCode from backend
        ...(isUpdate ? {} : { employeeCode: jsonData?.employeeCode || "AUTO" }),
      };

      handleAddEdit(responseItem);

      toast({
        title: `Employee ${
          type === "edit" ? "updated" : "added"
        } successfully.`,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add Employee
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update employee information."
              : "Add a new employee to the system. Employee Code will be auto-generated."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Display Company Info (read-only) */}
            <div className='p-3 bg-gray-50 rounded-md'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

                {/* Display Employee Code for edit, show auto-generated message for add */}
                <div>
                  <FormLabel className='text-sm font-medium text-gray-600'>
                    Employee Code
                  </FormLabel>
                  <div className='mt-1 text-sm text-gray-900'>
                    {type === "edit" ? (
                      form.watch("employeeCode") || "Not available"
                    ) : (
                      <span className='text-blue-600'>
                        Auto-generated by system
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Basic Information</h3>

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

                {/* Gender */}
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <FormControl>
                        <select
                          className='w-full p-2 border rounded-md'
                          value={field.value || ""}
                          onChange={field.onChange}
                        >
                          <option value=''>Select Gender</option>
                          <option value='Male'>Male</option>
                          <option value='Female'>Female</option>
                          <option value='Other'>Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* First Name */}
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter first name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter last name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Father Name */}
                <FormField
                  control={form.control}
                  name='fatherName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter father name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name='dateOfBirth'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          {...field}
                          value={formatDateForInput(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* National ID Number */}
                <FormField
                  control={form.control}
                  name='nationalIdNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID Number *</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter national ID' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employment Information Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Employment Information</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

                {/* Designation Dropdown */}
                <FormField
                  control={form.control}
                  name='designationId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation *</FormLabel>
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
                        <p className='text-sm text-gray-500'>
                          Loading designations...
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Reports To Dropdown */}
                <FormField
                  control={form.control}
                  name='reportsToEmployeeId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reports To</FormLabel>
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
                          disabled={loadingEmployees}
                        >
                          <option value={0}>Select Manager</option>
                          {employees
                            .filter((employee) =>
                              type === "edit"
                                ? employee.employeeId !==
                                  defaultState.employeeId
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
                        <p className='text-sm text-gray-500'>
                          Loading employees...
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Employment Status */}
                <FormField
                  control={form.control}
                  name='employmentStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status *</FormLabel>
                      <FormControl>
                        <select
                          className='w-full p-2 border rounded-md'
                          value={field.value || ""}
                          onChange={field.onChange}
                        >
                          <option value=''>Select Status</option>
                          <option value='Active'>Active</option>
                          <option value='Probation'>Probation</option>
                          <option value='Contract'>Contract</option>
                          <option value='Resigned'>Resigned</option>
                          <option value='Terminated'>Terminated</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Joining Date */}
                <FormField
                  control={form.control}
                  name='joiningDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joining Date *</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          {...field}
                          value={formatDateForInput(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirmation Date */}
                <FormField
                  control={form.control}
                  name='confirmationDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation Date</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          {...field}
                          value={formatDateForInput(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resignation Date */}
                <FormField
                  control={form.control}
                  name='resignationDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resignation Date</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
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

            {/* Contact Information Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Contact Information</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Official Email */}
                <FormField
                  control={form.control}
                  name='officialEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Official Email</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='Enter official email'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Personal Email */}
                <FormField
                  control={form.control}
                  name='personalEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Email</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='Enter personal email'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mobile Number */}
              <FormField
                control={form.control}
                name='mobileNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter mobile number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
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
              {type === "edit" && (
                <FormField
                  control={form.control}
                  name='employeeId'
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
                {type === "edit" ? "Update Employee" : "Add Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
