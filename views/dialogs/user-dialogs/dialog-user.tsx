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
import {
  Loader2,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────
const formSchema = z.object({
  userId: z.number().optional(),
  companyId: z.number().optional(),
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
  isAllowedRequestApproval: z.boolean().default(false),
  version: z.number().optional(),
});

// ─── Interfaces ───────────────────────────────────────────────────────────────
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
  /** When provided, the dialog is fully controlled by the parent */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SectionHeader = ({ label }: { label: string }) => (
  <div className='flex items-center gap-3 mb-1'>
    <span className='text-xs font-semibold uppercase tracking-widest text-slate-400'>
      {label}
    </span>
    <div className='flex-1 h-px bg-slate-100' />
  </div>
);

const StyledSelect = ({
  value,
  onChange,
  options,
  placeholder,
  isLoading,
  disabled,
  error,
  getKey,
  getLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  options: any[];
  placeholder: string;
  isLoading?: boolean;
  disabled?: boolean;
  error?: boolean;
  getKey: (o: any) => number;
  getLabel: (o: any) => string;
}) => (
  <div className='relative'>
    <select
      value={value || 0}
      onChange={(e) =>
        onChange(e.target.value === "0" ? 0 : parseInt(e.target.value))
      }
      disabled={disabled || isLoading}
      className={`w-full appearance-none px-3 py-2 pr-9 border rounded-lg text-sm bg-white transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
        ${error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}
        ${disabled || isLoading ? "opacity-60 bg-slate-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <option value={0}>{isLoading ? "Loading…" : placeholder}</option>
      {options.map((o) => (
        <option key={getKey(o)} value={getKey(o)}>
          {getLabel(o)}
        </option>
      ))}
    </select>
    <div className='pointer-events-none absolute inset-y-0 right-2.5 flex items-center'>
      {isLoading ? (
        <Loader2 className='h-4 w-4 animate-spin text-slate-400' />
      ) : (
        <ChevronDown className='h-4 w-4 text-slate-400' />
      )}
    </div>
  </div>
);

const ToggleSwitch = ({
  checked,
  onChange,
  label,
  description,
  disabled,
  activeColor = "bg-blue-50 border-blue-200",
  activeText = "text-blue-700",
  activeDot = "bg-blue-500",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  activeColor?: string;
  activeText?: string;
  activeDot?: string;
}) => (
  <button
    type='button'
    onClick={() => !disabled && onChange(!checked)}
    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left
      ${checked ? `${activeColor} shadow-sm` : "bg-slate-50 border-slate-200 hover:border-slate-300"}
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <div>
      <p
        className={`text-sm font-medium ${checked ? activeText : "text-slate-700"}`}
      >
        {label}
      </p>
      {description && (
        <p className='text-xs text-slate-400 mt-0.5'>{description}</p>
      )}
    </div>
    <div
      className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 ${checked ? activeDot : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: UserDialogProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  // Support both controlled (parent passes open/onOpenChange) and uncontrolled modes
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // localStorage-derived state (client-only)
  const [companyName, setCompanyName] = useState("—");
  const [storedCompanyId, setStoredCompanyId] = useState(1);
  const [storedUserId, setStoredUserId] = useState(0);
  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setCompanyName(parsed?.companyName || "—");
        setStoredCompanyId(parsed?.companyId || 1);
        setStoredUserId(parsed?.userID || 0);
      }
    } catch {}
  }, []);

  // Dropdown data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // ── Form ────────────────────────────────────────────────────────────────────
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
      isActive: defaultState.isActive ?? true,
      isLocked: defaultState.isLocked ?? false,
      isAllowedRequestApproval: defaultState.isAllowedRequestApproval ?? false,
      version: defaultState.version || 0,
    },
  });

  // ── Reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    form.reset({
      userId: defaultState.userId || undefined,
      companyId: defaultState.companyId || storedCompanyId,
      branchId: defaultState.branchId || 0,
      departmentId: defaultState.departmentId || 0,
      username: defaultState.username || "",
      passwordHash: "",
      email: defaultState.email || "",
      fullName: defaultState.fullName || "",
      designation: defaultState.designation || "",
      phoneNumber: defaultState.phoneNumber || "",
      roleId: defaultState.roleId || 0,
      isActive: defaultState.isActive ?? true,
      isLocked: defaultState.isLocked ?? false,
      isAllowedRequestApproval: defaultState.isAllowedRequestApproval ?? false,
      version: defaultState.version || 0,
    });
    fetchBranches();
    fetchDepartments();
    fetchRoles();
  }, [open, defaultState, storedCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const res = await fetch(`${baseUrl}Branch/GetList`, {
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
      if (!res.ok) throw new Error("Failed to fetch branches");
      setBranches(await res.json());
    } catch {
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
      const res = await fetch(`${baseUrl}Department/GetList`, {
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
      if (!res.ok) throw new Error("Failed to fetch departments");
      setDepartments(await res.json());
    } catch {
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
      const res = await fetch(`${baseUrl}Role/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "RoleId,RoleName",
          where: "IsActive == true",
          sortOn: "roleName",
          page: "1",
          pageSize: "100",
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      setRoles(await res.json());
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load roles list",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isUpdate = type === "edit";

    // Build payload matching the API schema (camelCase)
    const payload: any = {
      username: values.username,
      email: values.email,
      fullName: values.fullName,
      designation: values.designation,
      phoneNumber: values.phoneNumber || "",
      branchId: values.branchId,
      departmentId: values.departmentId,
      roleId: values.roleId,
      isActive: values.isActive,
      isLocked: values.isLocked,
      isAllowedRequestApproval: values.isAllowedRequestApproval,
      version: values.version || 0,
    };

    if (!isUpdate) {
      // POST — new user
      payload.companyId = storedCompanyId;
      payload.createdBy = storedUserId;
      payload.passwordHash = values.passwordHash || "";
    } else {
      // PUT — edit user
      payload.userId = values.userId;
      payload.companyId = values.companyId || storedCompanyId;
      payload.updatedBy = storedUserId;
      // API always requires passwordHash — use new value if provided,
      // otherwise fall back to the existing hash from defaultState
      payload.passwordHash =
        values.passwordHash || defaultState.passwordHash || "";
    }

    setIsLoading(true);
    // Both POST and PUT use the same base URL; userId travels in the body
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}User`;

    try {
      const response = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMsg = `HTTP Error: ${response.status}`;
        try {
          const e = await response.json();
          // Handle ASP.NET validation errors object e.g. { errors: { PasswordHash: ["..."] } }
          if (e?.errors && typeof e.errors === "object") {
            const msgs = Object.values(e.errors).flat() as string[];
            errMsg = msgs.join("\n");
          } else {
            errMsg = e?.message || e?.title || errMsg;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const text = await response.text();
      let jsonData: any = null;
      if (text) {
        try {
          jsonData = JSON.parse(text);
          if (jsonData?.statusCode >= 400)
            throw new Error(jsonData.message || "Unknown error");
        } catch {}
      }

      setOpen(false);
      form.setValue("passwordHash", "");
      handleAddEdit({ ...values, ...jsonData });
      toast({ title: `User ${isUpdate ? "updated" : "added"} successfully.` });
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
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const pwd = Array.from(
      { length: 12 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    form.setValue("passwordHash", pwd);
    setShowPassword(true);
  };

  const anyDropdownLoading =
    loadingBranches || loadingDepartments || loadingRoles;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.clearErrors();
      }}
    >
      {/* Only render the trigger when not controlled externally */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {type === "edit" ? (
            children || <Button variant='outline'>Edit</Button>
          ) : (
            <Button className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm'>
              <Plus size={15} />
              Add User
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className='max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200 shadow-2xl'>
        {/* ── Sticky header ── */}
        <div className='sticky top-0 z-10 bg-white border-b border-slate-100 px-7 py-5 rounded-t-2xl'>
          <DialogHeader>
            <DialogTitle className='text-lg font-semibold text-slate-800'>
              {type === "edit" ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription className='text-sm text-slate-400 mt-0.5'>
              {type === "edit"
                ? "Update user information and permissions."
                : "Create a new user account with access permissions."}
            </DialogDescription>
          </DialogHeader>

          {/* Company badge */}
          <div className='mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg'>
            <span className='text-xs text-slate-400 font-medium'>Company</span>
            <span className='text-xs font-semibold text-slate-700'>
              {companyName}
            </span>
          </div>
        </div>

        {/* ── Form body ── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='px-7 py-6 flex flex-col gap-6'
          >
            {/* ── Organisation ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Organisation' />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Branch */}
                <FormField
                  control={form.control}
                  name='branchId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Branch <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <StyledSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={branches}
                          placeholder='Select Branch'
                          isLoading={loadingBranches}
                          disabled={isLoading}
                          error={!!form.formState.errors.branchId}
                          getKey={(o) => o.branchId}
                          getLabel={(o) => `${o.branchName} (${o.branchCode})`}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Department */}
                <FormField
                  control={form.control}
                  name='departmentId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Department <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <StyledSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={departments}
                          placeholder='Select Department'
                          isLoading={loadingDepartments}
                          disabled={isLoading}
                          error={!!form.formState.errors.departmentId}
                          getKey={(o) => o.departmentId}
                          getLabel={(o) => o.departmentName}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── User Information ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='User Information' />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Username */}
                <FormField
                  control={form.control}
                  name='username'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Username <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. john.doe'
                          {...field}
                          className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Email <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='e.g. john@company.com'
                          {...field}
                          className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
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
                    <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                      Full Name <span className='text-red-400'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. John Doe'
                        {...field}
                        className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
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
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Designation <span className='text-red-400'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Software Engineer'
                          {...field}
                          className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name='phoneNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. +92 300 1234567'
                          {...field}
                          className='rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Role & Permissions ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Role & Permissions' />

              <FormField
                control={form.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                      Role <span className='text-red-400'>*</span>
                    </FormLabel>
                    <FormControl>
                      <StyledSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={roles}
                        placeholder='Select Role'
                        isLoading={loadingRoles}
                        disabled={isLoading}
                        error={!!form.formState.errors.roleId}
                        getKey={(o) => o.roleId}
                        getLabel={(o) => o.roleName}
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Security ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Security' />

              <FormField
                control={form.control}
                name='passwordHash'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
                      Password{" "}
                      {type === "add" ? (
                        <span className='text-red-400'>*</span>
                      ) : (
                        <span className='text-slate-400 normal-case font-normal'>
                          (leave blank to keep current)
                        </span>
                      )}
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
                          className='pr-10 rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'
                        />
                        <button
                          type='button'
                          className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className='flex items-center gap-3 mt-1.5'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={generateRandomPassword}
                        className='text-xs h-7 gap-1.5 rounded-md border-slate-200 text-slate-600'
                      >
                        <RefreshCw size={12} />
                        Generate
                      </Button>
                      {showPassword && form.watch("passwordHash") && (
                        <span className='text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate max-w-[200px]'>
                          {form.watch("passwordHash")}
                        </span>
                      )}
                    </div>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Account Flags ── */}
            <div className='flex flex-col gap-4'>
              <SectionHeader label='Account Flags' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {/* Is Active */}
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleSwitch
                          checked={field.value}
                          onChange={field.onChange}
                          label='Active'
                          description={
                            field.value
                              ? "Account is active"
                              : "Account is inactive"
                          }
                          disabled={isLoading}
                          activeColor='bg-green-50 border-green-200'
                          activeText='text-green-700'
                          activeDot='bg-green-500'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Is Locked */}
                <FormField
                  control={form.control}
                  name='isLocked'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleSwitch
                          checked={field.value}
                          onChange={field.onChange}
                          label='Locked'
                          description={
                            field.value
                              ? "Account is locked"
                              : "Account is unlocked"
                          }
                          disabled={isLoading}
                          activeColor='bg-red-50 border-red-200'
                          activeText='text-red-700'
                          activeDot='bg-red-500'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Is Allowed Request Approval */}
                <FormField
                  control={form.control}
                  name='isAllowedRequestApproval'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleSwitch
                          checked={field.value}
                          onChange={field.onChange}
                          label='Request Approval'
                          description={
                            field.value
                              ? "Can approve requests"
                              : "Cannot approve requests"
                          }
                          disabled={isLoading}
                          activeColor='bg-blue-50 border-blue-200'
                          activeText='text-blue-700'
                          activeDot='bg-blue-500'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Hidden fields ── */}
            <div className='hidden'>
              {(["version", "companyId", "userId"] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type='hidden' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* ── Sticky footer ── */}
            <div className='sticky bottom-0 bg-white border-t border-slate-100 -mx-7 -mb-6 px-7 py-4 flex items-center justify-between gap-3 rounded-b-2xl mt-2'>
              <p className='text-xs text-slate-400'>
                Fields marked{" "}
                <span className='text-red-400 font-medium'>*</span> are required
              </p>
              <div className='flex gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className='rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading || anyDropdownLoading}
                  className='rounded-lg bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving…
                    </>
                  ) : type === "edit" ? (
                    "Update User"
                  ) : (
                    "Add User"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
