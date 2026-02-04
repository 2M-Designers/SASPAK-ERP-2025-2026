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
import { Loader2, Plus, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  chargeId: z.number().optional(),
  companyId: z.number().optional(),
  chargeCode: z.string().min(1, "Charge Code is required"),
  chargeName: z.string().min(1, "Charge Name is required"),
  chargeType: z.string().min(1, "Charge Type is required"),
  chargeGroup: z.string().min(1, "Charge Group is required"),
  revenueGLAccountId: z.number().min(1, "Revenue GL Account is required"),
  costGLAccountId: z.number().min(1, "Cost GL Account is required"),
  isTaxable: z.boolean().default(false),
  defaultTaxPercentage: z
    .union([
      z
        .number()
        .min(0, "Tax percentage cannot be negative")
        .max(100, "Tax percentage cannot exceed 100"),
      z.nan(),
    ])
    .optional()
    .transform((val) => (isNaN(val as number) ? 0 : val)),
  isReimbursable: z.boolean().default(false),
  isActive: z.boolean().default(true),
  remarks: z.string().optional(),
  version: z.number().default(0),
});

// GL Account interface based on API response
interface GLAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  isActive?: boolean;
}

// Charge Types
const chargeTypes = [
  "Freight",
  "Handling",
  "Customs",
  "Insurance",
  "Storage",
  "Documentation",
  "Other",
];

interface ChargesDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

// Searchable Select Component
interface SearchableSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: GLAccount[];
  placeholder: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder,
  isLoading = false,
  disabled = false,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter(
    (option) =>
      option.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.accountName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get selected option
  const selectedOption = options.find((option) => option.accountId === value);

  // Clear search when dropdown closes
  const handleDropdownToggle = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
      if (isOpen) {
        setSearchTerm("");
      }
    }
  };

  const handleSelect = (accountId: number) => {
    onChange(accountId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
    setSearchTerm("");
  };

  return (
    <div className='relative' ref={dropdownRef}>
      <div
        className={`w-full p-2 border rounded-md cursor-pointer ${
          disabled || isLoading
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:border-gray-400"
        } flex items-center justify-between`}
        onClick={handleDropdownToggle}
      >
        <div className='truncate'>
          {selectedOption ? (
            <span className='text-sm'>
              {selectedOption.accountCode} - {selectedOption.accountName}
            </span>
          ) : (
            <span className='text-gray-500'>{placeholder}</span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          {value !== 0 && !disabled && !isLoading && (
            <X
              className='h-4 w-4 text-gray-400 hover:text-gray-600'
              onClick={clearSelection}
            />
          )}
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
          ) : (
            <Search className='h-4 w-4 text-gray-400' />
          )}
        </div>
      </div>

      {isOpen && (
        <div className='absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto'>
          {/* Search Input */}
          <div className='sticky top-0 bg-white border-b p-2'>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-400' />
              <input
                ref={searchInputRef}
                type='text'
                placeholder='Search by code or name...'
                className='w-full pl-8 pr-8 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <X
                  className='absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer'
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
          </div>

          {/* Options List */}
          <div className='py-1'>
            {filteredOptions.length === 0 ? (
              <div className='px-3 py-2 text-sm text-gray-500 text-center'>
                No accounts found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.accountId}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    value === option.accountId ? "bg-blue-50 text-blue-600" : ""
                  }`}
                  onClick={() => handleSelect(option.accountId)}
                >
                  <div className='font-medium'>{option.accountCode}</div>
                  <div className='text-gray-600 truncate'>
                    {option.accountName}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Function to parse API error messages
const parseErrorMessage = (error: any): string => {
  if (!error) return "An unknown error occurred";

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle array of error messages (like ["Charge Code is already exist.", "Charge Name is already exist."])
  if (Array.isArray(error)) {
    // Filter out empty/null messages and join with line breaks
    const messages = error.filter((msg) => msg && typeof msg === "string");
    if (messages.length === 0) return "Validation failed";

    // Format array messages
    if (messages.length === 1) {
      return messages[0];
    } else {
      return messages.map((msg, index) => `${index + 1}. ${msg}`).join("\n");
    }
  }

  // Handle object errors
  if (typeof error === "object") {
    // Check for common error message fields
    if (error.message) return error.message;
    if (error.error) return error.error;
    if (error.title) return error.title;
    if (error.errors) {
      // Handle validation errors object
      const errorMessages: string[] = [];
      Object.keys(error.errors).forEach((key) => {
        if (Array.isArray(error.errors[key])) {
          errorMessages.push(...error.errors[key]);
        } else if (typeof error.errors[key] === "string") {
          errorMessages.push(error.errors[key]);
        }
      });
      if (errorMessages.length > 0) {
        return errorMessages.join("\n");
      }
    }

    // Try to stringify if nothing else works
    try {
      const errorStr = JSON.stringify(error);
      if (errorStr !== "{}") return errorStr;
    } catch {
      // If stringify fails, return generic message
    }
  }

  return "An unexpected error occurred. Please try again.";
};

export default function ChargesDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: ChargesDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [isLoadingGLAccounts, setIsLoadingGLAccounts] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chargeId: defaultState.chargeId || undefined,
      companyId: defaultState.companyId || 1,
      chargeCode: defaultState.chargeCode || "",
      chargeName: defaultState.chargeName || "",
      chargeType: defaultState.chargeType || "",
      chargeGroup: defaultState.chargeGroup || "",
      revenueGLAccountId: defaultState.revenueGLAccountId || 0,
      costGLAccountId: defaultState.costGLAccountId || 0,
      isTaxable:
        defaultState.isTaxable !== undefined ? defaultState.isTaxable : false,
      defaultTaxPercentage: defaultState.defaultTaxPercentage || 0,
      isReimbursable:
        defaultState.isReimbursable !== undefined
          ? defaultState.isReimbursable
          : false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      remarks: defaultState.remarks || "",
      version: defaultState.version || 0,
    },
  });

  // Watch isTaxable to conditionally show tax percentage
  const isTaxable = form.watch("isTaxable");

  // Fetch GL Accounts when dialog opens
  useEffect(() => {
    const fetchGLAccounts = async () => {
      if (!open) return;

      setIsLoadingGLAccounts(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}GlAccount/GetList`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            select: "AccountId,AccountCode,AccountName",
            where: "",
            sortOn: "AccountCode",
            page: "1",
            pageSize: "100",
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch GL accounts: ${response.status}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data)) {
          // Get all accounts without filtering
          setGlAccounts(data);
        } else {
          setGlAccounts([]);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Invalid GL accounts data format",
          });
        }
      } catch (error: any) {
        console.error("Error fetching GL accounts:", error);
        setGlAccounts([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: parseErrorMessage(error),
        });
      } finally {
        setIsLoadingGLAccounts(false);
      }
    };

    fetchGLAccounts();
  }, [open, toast]);

  // Reset form when dialog opens/closes or defaultState changes
  useEffect(() => {
    if (open) {
      const user = localStorage.getItem("user");
      let companyId = 1;

      if (user) {
        try {
          const u = JSON.parse(user);
          companyId = u?.companyId || 1;
        } catch (error) {
          console.error("Error parsing user JSON:", error);
        }
      }

      form.reset({
        chargeId: defaultState.chargeId || undefined,
        companyId: companyId,
        chargeCode: defaultState.chargeCode || "",
        chargeName: defaultState.chargeName || "",
        chargeType: defaultState.chargeType || "",
        chargeGroup: defaultState.chargeGroup || "",
        revenueGLAccountId: defaultState.revenueGLAccountId || 0,
        costGLAccountId: defaultState.costGLAccountId || 0,
        isTaxable:
          defaultState.isTaxable !== undefined ? defaultState.isTaxable : false,
        defaultTaxPercentage: defaultState.defaultTaxPercentage || 0,
        isReimbursable:
          defaultState.isReimbursable !== undefined
            ? defaultState.isReimbursable
            : false,
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        remarks: defaultState.remarks || "",
        version: defaultState.version || 0,
      });
    }
  }, [open, defaultState, form]);

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

    // Prepare payload according to API requirements
    const payload: any = {
      ChargeCode: values.chargeCode,
      ChargeName: values.chargeName,
      ChargeType: values.chargeType,
      ChargeGroup: values.chargeGroup,
      RevenueGlaccountId: values.revenueGLAccountId,
      CostGlaccountId: values.costGLAccountId,
      IsTaxable: values.isTaxable,
      DefaultTaxPercentage: values.isTaxable
        ? values.defaultTaxPercentage || 0
        : 0,
      IsReimbursable: values.isReimbursable,
      IsActive: values.isActive,
      Remarks: values.remarks || "",
      Version: values.version || 0,
    };

    // For add operation
    if (!isUpdate) {
      payload.CompanyId = companyId;
    } else {
      // For edit operation - include the ID
      payload.ChargeId = values.chargeId;
      payload.CompanyId = values.companyId;
    }

    // Add user tracking
    if (isUpdate) {
      payload.UpdatedBy = userID;
    } else {
      payload.CreatedBy = userID;
    }

    console.log("Charges Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "ChargesMaster",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      let errorData;

      if (!response.ok) {
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          throw new Error(
            `HTTP Error ${response.status}: ${errorText || "Unknown error"}`,
          );
        }

        // Parse the error data for user-friendly messages
        const errorMessage = parseErrorMessage(errorData);
        throw new Error(errorMessage);
      }

      const responseData = await response.text();
      let jsonData;

      if (responseData) {
        try {
          jsonData = JSON.parse(responseData);

          // Check for API-level errors (even if HTTP status is 200)
          if (jsonData?.statusCode >= 400) {
            const errorMessage = parseErrorMessage(
              jsonData.message || jsonData,
            );
            throw new Error(errorMessage);
          }
        } catch {
          jsonData = { success: true };
        }
      }

      setOpen(false);

      // Call the parent handler with the response data
      handleAddEdit(
        jsonData || {
          ...payload,
          chargeId: jsonData?.chargeId || values.chargeId,
        },
      );

      toast({
        title: `Charge ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("API Error:", error);

      // Check for duplicate errors and highlight specific fields
      const errorMessage =
        error.message || "Failed to process charge operation";

      if (errorMessage.includes("Charge Code is already exist")) {
        // Set error on charge code field
        form.setError("chargeCode", {
          type: "manual",
          message:
            "This charge code already exists. Please use a different code.",
        });
      }

      if (errorMessage.includes("Charge Name is already exist")) {
        // Set error on charge name field
        form.setError("chargeName", {
          type: "manual",
          message:
            "This charge name already exists. Please use a different name.",
        });
      }

      // Show toast with formatted error message
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    // Clear form errors when dialog closes
    if (!open) {
      form.clearErrors();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add Charge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Charge" : "Add New Charge"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update charge information."
              : "Add a new charge to the system."}
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Charge Code */}
              <FormField
                control={form.control}
                name='chargeCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter charge code'
                        {...field}
                        className='uppercase'
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                          // Clear field-specific error when user starts typing
                          if (
                            form.formState.errors.chargeCode?.type === "manual"
                          ) {
                            form.clearErrors("chargeCode");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Charge Name */}
              <FormField
                control={form.control}
                name='chargeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter charge name'
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Clear field-specific error when user starts typing
                          if (
                            form.formState.errors.chargeName?.type === "manual"
                          ) {
                            form.clearErrors("chargeName");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Charge Type */}
              <FormField
                control={form.control}
                name='chargeType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Type *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || ""}
                        onChange={field.onChange}
                      >
                        <option value=''>Select Charge Type</option>
                        {chargeTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Charge Group */}
              <FormField
                control={form.control}
                name='chargeGroup'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Group *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter charge group' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Revenue GL Account */}
              <FormField
                control={form.control}
                name='revenueGLAccountId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue GL Account *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value || 0}
                        onChange={field.onChange}
                        options={glAccounts}
                        placeholder='Select Revenue Account'
                        isLoading={isLoadingGLAccounts}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost GL Account */}
              <FormField
                control={form.control}
                name='costGLAccountId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost GL Account *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value || 0}
                        onChange={field.onChange}
                        options={glAccounts}
                        placeholder='Select Cost Account'
                        isLoading={isLoadingGLAccounts}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Is Taxable */}
              <FormField
                control={form.control}
                name='isTaxable'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Taxable</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        Charge is taxable
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Reimbursable */}
              <FormField
                control={form.control}
                name='isReimbursable'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Reimbursable</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        Charge is reimbursable
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Active */}
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Status</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        {field.value ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Default Tax Percentage (conditionally shown) */}
            {isTaxable && (
              <FormField
                control={form.control}
                name='defaultTaxPercentage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tax Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter tax percentage'
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        min={0}
                        max={100}
                        step={0.01}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Remarks */}
            <FormField
              control={form.control}
              name='remarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any remarks...'
                      {...field}
                      rows={3}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields */}
            <div className='hidden'>
              <FormField
                control={form.control}
                name='chargeId'
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
                name='version'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
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
              <Button type='submit' disabled={isLoading || isLoadingGLAccounts}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {type === "edit" ? "Update Charge" : "Add Charge"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
