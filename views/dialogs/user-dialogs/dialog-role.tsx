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

// Validation Schema for Role
const formSchema = z.object({
  roleId: z.number().optional(),
  companyId: z.number().optional(),
  roleName: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name is too long"),
  description: z
    .string()
    .max(500, "Description is too long")
    .optional()
    .or(z.literal("")),
  isSystemRole: z.boolean().default(false),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

// Optional: Permission interface if you have permissions
interface Permission {
  permissionId: number;
  permissionName: string;
  moduleName: string;
}

interface RoleDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function RoleDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: RoleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Optional: If you want to include permissions in the dialog
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleId: defaultState.roleId || undefined,
      companyId: defaultState.companyId || 1,
      roleName: defaultState.roleName || "",
      description: defaultState.description || "",
      isSystemRole: defaultState.isSystemRole || false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
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
        roleId: defaultState.roleId || undefined,
        companyId: companyId, // Set from localStorage
        roleName: defaultState.roleName || "",
        description: defaultState.description || "",
        isSystemRole: defaultState.isSystemRole || false,
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        version: defaultState.version || 0,
      });

      // Initialize selected permissions if editing
      if (type === "edit" && defaultState.permissions) {
        setSelectedPermissions(
          defaultState.permissions.map((p: any) => p.permissionId)
        );
      } else {
        setSelectedPermissions([]);
      }

      // Optional: Fetch permissions if needed
      // fetchPermissions();
    }
  }, [open, type, defaultState, form]);

  // Optional: Fetch permissions function
  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Permission/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "PermissionId,PermissionName,ModuleName",
          where: "IsActive == true",
          sortOn: "moduleName,permissionName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      } else {
        throw new Error("Failed to fetch permissions");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load permissions list",
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
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
      roleName: values.roleName,
      description: values.description || "",
      isSystemRole: values.isSystemRole,
      isActive: values.isActive,
      version: values.version || 0,
    };

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage
    } else {
      // For edit operation - include the ID
      payload.roleId = values.roleId;
      payload.companyId = values.companyId;
    }

    // Optional: Add permissions to payload if you have a permissions field
    // if (selectedPermissions.length > 0) {
    //   payload.permissions = selectedPermissions.map(id => ({ permissionId: id }));
    // }

    // Add user tracking if needed
    if (isUpdate) {
      // payload.updatedBy = userID;
      // payload.updatedAt = new Date().toISOString();
    } else {
      // payload.createdBy = userID;
      // payload.createdAt = new Date().toISOString();
    }

    console.log("Role Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "Role", {
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

      // Prepare the response data to include in handleAddEdit
      const responseItem = {
        ...values,
        ...jsonData,
      };

      handleAddEdit(responseItem);

      toast({
        title: `Role ${type === "edit" ? "updated" : "added"} successfully.`,
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
            Add Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Role" : "Add New Role"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update role information and permissions."
              : "Create a new role with specific permissions."}
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
                        return u?.companyName || "SASPAK CARGO";
                      } catch (error) {
                        return "SASPAK CARGO";
                      }
                    }
                    return "SASPAK CARGO";
                  })()}
                </div>
              </div>
            </div>

            {/* Basic Role Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Role Information</h3>

              {/* Role Name */}
              <FormField
                control={form.control}
                name='roleName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter role name (e.g., Administrator, Manager)'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Enter role description (optional)'
                        className='resize-none'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <div className='text-xs text-gray-500'>
                      {field.value?.length || 0}/500 characters
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Role Settings */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Role Settings</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Is System Role */}
                <FormField
                  control={form.control}
                  name='isSystemRole'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Role</FormLabel>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={field.value}
                            onChange={field.onChange}
                            className='w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                          />
                          <span className='text-sm font-medium'>
                            {field.value ? "Yes" : "No"}
                          </span>
                        </div>
                      </FormControl>
                      <p className='text-xs text-gray-500'>
                        System roles are predefined and cannot be deleted
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Active */}
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Status</FormLabel>
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
                      <p className='text-xs text-gray-500'>
                        Inactive roles cannot be assigned to users
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Optional: Permissions Section */}
            {/* Uncomment this section if you want to include permissions in the dialog */}
            {/*
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Permissions</h3>
              <div className='p-4 border rounded-md bg-gray-50'>
                <div className='flex justify-between items-center mb-3'>
                  <FormLabel>Select Permissions</FormLabel>
                  {selectedPermissions.length > 0 && (
                    <span className='text-xs text-blue-600'>
                      {selectedPermissions.length} permission(s) selected
                    </span>
                  )}
                </div>
                
                {loadingPermissions ? (
                  <p className='text-sm text-gray-500'>Loading permissions...</p>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2'>
                    {permissions.map((permission) => (
                      <div
                        key={permission.permissionId}
                        className='flex items-center gap-2 p-2 hover:bg-gray-100 rounded'
                      >
                        <input
                          type='checkbox'
                          id={`perm-${permission.permissionId}`}
                          checked={selectedPermissions.includes(permission.permissionId)}
                          onChange={() => togglePermission(permission.permissionId)}
                          className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <label
                          htmlFor={`perm-${permission.permissionId}`}
                          className='text-sm cursor-pointer'
                        >
                          <span className='font-medium'>{permission.permissionName}</span>
                          <span className='text-xs text-gray-500 ml-2'>
                            ({permission.moduleName})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {permissions.length === 0 && !loadingPermissions && (
                  <p className='text-sm text-gray-500 text-center py-4'>
                    No permissions available
                  </p>
                )}
              </div>
            </div>
            */}

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
                  name='roleId'
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
                {type === "edit" ? "Update Role" : "Add Role"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
