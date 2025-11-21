import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import Select from "react-select";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import moment from "moment";
import Loader from "@/components/app-loader";
import { useRouter } from "next/navigation";

// Create separate schemas for create and edit
const createFormSchema = z
  .object({
    Username: z
      .string()
      .min(5, { message: "Username must be at least 5 characters" }),
    Password: z
      .string()
      .min(5, { message: "Password must be at least 5 characters" }),
    ConfirmPassword: z
      .string()
      .min(5, { message: "Please confirm your password" }),
    roleID: z.number({ required_error: "Please select a role" }),
    regulatorID: z.number({ required_error: "Please select a regulator" }),
    operatorID: z.number().optional(),
  })
  .refine((data) => data.Password === data.ConfirmPassword, {
    message: "Passwords don't match",
    path: ["ConfirmPassword"],
  });

const editFormSchema = z.object({
  Username: z
    .string()
    .min(5, { message: "Username must be at least 5 characters" }),
  roleID: z.number({ required_error: "Please select a role" }),
  regulatorID: z.number({ required_error: "Please select a regulator" }),
  operatorID: z.number().optional(),
});

interface UserFormProps {
  roles: any[];
  regulators: any[];
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
  editMode?: boolean;
  userData?: any; // User data for edit mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function UserForm({
  roles,
  regulators,
  onUserCreated,
  onUserUpdated,
  editMode = false,
  userData = null,
  open = false,
  onOpenChange,
}: UserFormProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [isLoading, setIsLoading] = useState(false);
  const [operators, setOperators] = useState<any[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const router = useRouter();

  // Use appropriate schema based on mode
  const formSchema = editMode ? editFormSchema : createFormSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: editMode
      ? {
          Username: userData?.username || "",
          roleID: userData?.roleID || undefined,
          regulatorID: userData?.regulatorID || undefined,
          operatorID: userData?.operatorID || undefined,
        }
      : {
          Username: "",
          Password: "",
          ConfirmPassword: "",
        },
  });

  // Watch regulatorID to load operators when it changes
  const selectedRegulatorId = form.watch("regulatorID");
  const selectedRoleId = form.watch("roleID");

  // Check if selected role is "Operator"
  const isOperatorRole = () => {
    const selectedRole = roles.find((role) => role.value === selectedRoleId);
    return selectedRole?.label?.toLowerCase() === "operator";
  };

  // Enhanced select styles for react-select
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
      minHeight: "44px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "400",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#eff6ff"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      fontSize: "14px",
      padding: "10px 12px",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#eff6ff",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#374151",
      fontSize: "14px",
    }),
  };

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Fetch operators when regulatorID changes and role is Operator
  useEffect(() => {
    const fetchOperators = async () => {
      if (!selectedRegulatorId || !isOperatorRole()) {
        setOperators([]);
        form.setValue("operatorID", undefined);
        return;
      }

      setLoadingOperators(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}Operator/GetOperators?regulatorId=${selectedRegulatorId}`
        );

        if (response.ok) {
          const data = await response.json();
          const operatorOptions = data.map((operator: any) => ({
            value: operator.operatorID,
            label: operator.operatorName,
            regulatorID: operator.regulatorID,
          }));
          setOperators(operatorOptions);
        } else {
          console.error("Failed to fetch operators");
          setOperators([]);
        }
      } catch (error) {
        console.error("Error fetching operators:", error);
        setOperators([]);
      } finally {
        setLoadingOperators(false);
      }
    };

    fetchOperators();
  }, [selectedRegulatorId, selectedRoleId, form]);

  // Clear operator selection when role changes to non-operator
  useEffect(() => {
    if (!isOperatorRole()) {
      form.setValue("operatorID", undefined);
      setOperators([]);
    }
  }, [selectedRoleId, form]);

  // Pre-fill form when userData changes (edit mode)
  useEffect(() => {
    if (editMode && userData) {
      form.reset({
        Username: userData.username || "",
        roleID: userData.roleID || undefined,
        regulatorID: userData.regulatorID || undefined,
        operatorID: userData.operatorID || undefined,
      });
    }
  }, [editMode, userData, form]);

  // Validate operator selection for operator role
  const validateForm = () => {
    if (isOperatorRole() && !form.getValues("operatorID")) {
      form.setError("operatorID", {
        type: "required",
        message: "Operator selection is required for Operator role",
      });
      return false;
    }
    return true;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Additional validation for operator role
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let url = "";
      let method = "POST";
      let payload: any = {
        ...values,
        operatorID: isOperatorRole() ? values.operatorID : null,
      };

      if (editMode && userData) {
        // Edit mode - update user
        url = `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/update/${userData.userID}`;
        method = "POST";
        payload = {
          ...payload,
          userID: userData.userID,
          // Don't include password in update unless we add a separate password change feature
        };
      } else {
        // Create mode - new user
        url = `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/create`;
        payload = {
          ...payload,
          passwordHash: (values as any).Password,
        };
      }

      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status >= 200 && res.status < 300) {
        setIsOpen(false);
        form.reset();
        setOperators([]);

        // Refresh and notify parent component
        router.refresh();
        if (editMode && onUserUpdated) {
          onUserUpdated();
        } else if (!editMode && onUserCreated) {
          onUserCreated();
        }
      } else {
        console.error(`Failed to ${editMode ? "update" : "create"} user`);
        alert(
          `Failed to ${editMode ? "update" : "create"} user. Please try again.`
        );
      }
    } catch (error) {
      console.error(`Error ${editMode ? "updating" : "creating"} user:`, error);
      alert(
        `Error ${editMode ? "updating" : "creating"} user. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
    if (!open) {
      // Reset form when dialog closes
      form.reset();
      setOperators([]);
    }
  };

  return (
    <>
      {!editMode && (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <div className='flex items-center space-x-2'>
                <span>Add New User</span>
              </div>
            </Button>
          </DialogTrigger>
        </Dialog>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {editMode && (
          <DialogTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 px-3 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800'
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
          </DialogTrigger>
        )}

        <DialogContent className='sm:max-w-[550px] bg-white rounded-2xl shadow-2xl border-0'>
          <DialogHeader className='border-b border-gray-100 pb-6 mb-2'>
            <div className='flex items-center space-x-3'>
              <div
                className={`p-3 rounded-xl ${
                  editMode
                    ? "bg-blue-50"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50"
                }`}
              >
                {editMode ? (
                  <svg
                    className='w-6 h-6 text-blue-600'
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
                ) : (
                  <svg
                    className='w-6 h-6 text-blue-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                    />
                  </svg>
                )}
              </div>
              <div>
                <DialogTitle className='text-2xl font-bold text-gray-800'>
                  {editMode ? "Edit User Account" : "Create New User Account"}
                </DialogTitle>
                <DialogDescription className='text-gray-600 mt-1'>
                  {editMode
                    ? "Update user information and system permissions."
                    : "Set up a new user account with appropriate access levels."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6'>
                <FormField
                  control={form.control}
                  name='Username'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-semibold text-gray-700 flex items-center space-x-2'>
                        <svg
                          className='w-4 h-4 text-gray-500'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                          />
                        </svg>
                        <span>Username</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter username (minimum 5 characters)'
                          {...field}
                          className='h-11 px-4 border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg text-sm'
                          disabled={editMode}
                        />
                      </FormControl>
                      <FormMessage className='text-red-500 text-xs' />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='roleID'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-semibold text-gray-700 flex items-center space-x-2'>
                          <svg
                            className='w-4 h-4 text-gray-500'
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
                          <span>User Role</span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            options={roles}
                            value={roles.find(
                              (option: any) => option.value === field.value
                            )}
                            onChange={(val) => {
                              field.onChange(val?.value);
                              if (val?.label?.toLowerCase() !== "operator") {
                                form.setValue("operatorID", undefined);
                              }
                            }}
                            placeholder='Select user role'
                            styles={selectStyles}
                          />
                        </FormControl>
                        <FormMessage className='text-red-500 text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='regulatorID'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-semibold text-gray-700 flex items-center space-x-2'>
                          <svg
                            className='w-4 h-4 text-gray-500'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                            />
                          </svg>
                          <span>Regulator</span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            options={regulators}
                            value={regulators.find(
                              (option: any) => option.value === field.value
                            )}
                            onChange={(val) => {
                              field.onChange(val?.value);
                              form.setValue("operatorID", undefined);
                            }}
                            placeholder='Select regulator'
                            styles={selectStyles}
                          />
                        </FormControl>
                        <FormMessage className='text-red-500 text-xs' />
                      </FormItem>
                    )}
                  />
                </div>

                {isOperatorRole() && (
                  <FormField
                    control={form.control}
                    name='operatorID'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-semibold text-gray-700 flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <svg
                              className='w-4 h-4 text-gray-500'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6'
                              />
                            </svg>
                            <span>Operator</span>
                          </div>
                          <span className='text-xs font-normal text-red-500 bg-red-50 px-2 py-1 rounded-full'>
                            * Required
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            options={operators}
                            value={operators.find(
                              (option: any) => option.value === field.value
                            )}
                            onChange={(val) => field.onChange(val?.value)}
                            placeholder={
                              loadingOperators
                                ? "Loading operators..."
                                : !selectedRegulatorId
                                ? "Select a regulator first"
                                : operators.length === 0
                                ? "No operators available"
                                : "Select operator"
                            }
                            isDisabled={
                              !selectedRegulatorId ||
                              loadingOperators ||
                              operators.length === 0
                            }
                            isLoading={loadingOperators}
                            styles={selectStyles}
                            noOptionsMessage={() =>
                              "No operators found for this regulator"
                            }
                          />
                        </FormControl>
                        <FormMessage className='text-red-500 text-xs' />
                        {isOperatorRole() &&
                          selectedRegulatorId &&
                          operators.length === 0 &&
                          !loadingOperators && (
                            <p className='text-amber-600 text-xs mt-1 flex items-center space-x-1'>
                              <svg
                                className='w-4 h-4'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                                />
                              </svg>
                              <span>
                                No operators available for the selected
                                regulator
                              </span>
                            </p>
                          )}
                      </FormItem>
                    )}
                  />
                )}

                {/* Password fields only shown in create mode */}
                {!editMode && (
                  <div className='border-t border-gray-100 pt-6'>
                    <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2'>
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
                          d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                        />
                      </svg>
                      <span>Security Settings</span>
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='Password'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-sm font-semibold text-gray-700'>
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Enter secure password'
                                type='password'
                                {...field}
                                className='h-11 px-4 border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg text-sm'
                              />
                            </FormControl>
                            <FormMessage className='text-red-500 text-xs' />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='ConfirmPassword'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-sm font-semibold text-gray-700'>
                              Confirm Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder='Confirm password'
                                type='password'
                                {...field}
                                className='h-11 px-4 border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg text-sm'
                              />
                            </FormControl>
                            <FormMessage className='text-red-500 text-xs' />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className='flex justify-end gap-3 pt-6 border-t border-gray-100'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => handleOpenChange(false)}
                  className='px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading}
                  className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200'
                >
                  {isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <svg
                        className='animate-spin h-4 w-4 text-white'
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
                      <span>{editMode ? "Updating..." : "Creating..."}</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                      <span>{editMode ? "Update User" : "Create User"}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading && <Loader />}
    </>
  );
}
