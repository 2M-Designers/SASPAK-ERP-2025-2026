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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  employeeId: z.number().optional(),
  companyId: z.number().min(1, "Company is required"),
  branchId: z.number().min(1, "Branch is required"),
  userId: z.number().optional(),
  employeeCode: z.string().min(1, "Employee Code is required"),
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

interface Company {
  companyId: number;
  companyName: string;
  companyCode: string;
}

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: defaultState.employeeId || undefined,
      companyId: defaultState.companyId || 0,
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

  // Fetch all required data when dialog opens
  useEffect(() => {
    if (open) {
      fetchCompanies();
      fetchBranches();
      fetchDepartments();
      fetchDesignations();
      fetchEmployees();
    }
  }, [open]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Company/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "CompanyId,CompanyName,CompanyCode",
          where: "",
          sortOn: "companyName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        throw new Error("Failed to fetch companies");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load companies list",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

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

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Create payload - handle optional fields
    const payload = {
      ...values,
      reportsToEmployeeId:
        values.reportsToEmployeeId === 0 ? null : values.reportsToEmployeeId,
      confirmationDate: values.confirmationDate || null,
      resignationDate: values.resignationDate || null,
      //...(isUpdate ? { UpdatedBy: userID } : { CreatedBy: userID }),
    };

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

      handleAddEdit({
        ...values,
        ...jsonData,
      });

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
              : "Add a new employee to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Basic Information Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Basic Information</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Company Dropdown */}
                <FormField
                  control={form.control}
                  name='companyId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
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
                          disabled={loadingCompanies}
                        >
                          <option value={0}>Select Company</option>
                          {companies.map((company) => (
                            <option
                              key={company.companyId}
                              value={company.companyId}
                            >
                              {company.companyName} ({company.companyCode})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      {loadingCompanies && (
                        <p className='text-sm text-gray-500'>
                          Loading companies...
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Employee Code */}
                <FormField
                  control={form.control}
                  name='employeeCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter employee code'
                          {...field}
                          className='uppercase'
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                        className='w-4 h-4'
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
