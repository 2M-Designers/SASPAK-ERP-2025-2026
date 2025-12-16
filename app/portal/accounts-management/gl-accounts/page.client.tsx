"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  FolderTree,
  FileText,
  Filter,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  TrendingUp,
  Calculator,
  CreditCard,
  Building,
  Users,
  ShoppingCart,
  Truck,
  Warehouse,
  Banknote,
  PieChart,
  Briefcase,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface GLAccount {
  accountId: number;
  companyId: number;
  parentAccountId: number | null;
  accountCode: string;
  accountName: string;
  description: string;
  accountLevel: number;
  accountType: string;
  accountNature: string;
  isHeader: boolean;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  children?: GLAccount[];
  expanded?: boolean;
}

interface AccountType {
  value: string;
  label: string;
  icon: any;
  color: string;
}

// Validation Schema for Account Form
const formSchema = z.object({
  accountId: z.number().optional(),
  companyId: z.number().optional(),
  parentAccountId: z.number().nullable().optional(),
  accountCode: z.string().min(1, "Account Code is required"),
  accountName: z.string().min(1, "Account Name is required"),
  description: z.string().optional(),
  accountType: z.string().min(1, "Account Type is required"),
  accountNature: z.string().optional(),
  isHeader: z.boolean().default(false),
  isActive: z.boolean().default(true),
  version: z.number().optional(),
});

const accountTypes: AccountType[] = [
  { value: "ASSET", label: "Asset", icon: Building, color: "bg-blue-500" },
  {
    value: "LIABILITY",
    label: "Liability",
    icon: CreditCard,
    color: "bg-red-500",
  },
  { value: "EQUITY", label: "Equity", icon: TrendingUp, color: "bg-green-500" },
  {
    value: "REVENUE",
    label: "Revenue",
    icon: PieChart,
    color: "bg-purple-500",
  },
  {
    value: "EXPENSE",
    label: "Expense",
    icon: ShoppingCart,
    color: "bg-orange-500",
  },
  { value: "BANK", label: "Bank", icon: Banknote, color: "bg-emerald-500" },
  { value: "CASH", label: "Cash", icon: Calculator, color: "bg-amber-500" },
  {
    value: "RECEIVABLE",
    label: "Receivable",
    icon: Users,
    color: "bg-indigo-500",
  },
  { value: "PAYABLE", label: "Payable", icon: Briefcase, color: "bg-rose-500" },
  {
    value: "INVENTORY",
    label: "Inventory",
    icon: Warehouse,
    color: "bg-teal-500",
  },
  { value: "COST", label: "Cost", icon: Truck, color: "bg-slate-500" },
];

// Account Form Dialog Component
function GLAccountDialog({
  type,
  defaultState,
  handleAddEdit,
  parentAccounts,
  children,
  onOpenChange,
  open,
}: {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  parentAccounts: { value: string; label: string }[];
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: defaultState.accountId || undefined,
      companyId: defaultState.companyId || 1,
      parentAccountId: defaultState.parentAccountId || null,
      accountCode: defaultState.accountCode || "",
      accountName: defaultState.accountName || "",
      description: defaultState.description || "",
      accountType: defaultState.accountType || "",
      accountNature: defaultState.accountNature || "",
      isHeader:
        defaultState.isHeader !== undefined ? defaultState.isHeader : false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      console.log("Setting form values for:", defaultState);
      form.reset({
        accountId: defaultState.accountId || undefined,
        companyId: defaultState.companyId || 1,
        parentAccountId: defaultState.parentAccountId || null,
        accountCode: defaultState.accountCode || "",
        accountName: defaultState.accountName || "",
        description: defaultState.description || "",
        accountType: defaultState.accountType || "",
        accountNature: defaultState.accountNature || "",
        isHeader:
          defaultState.isHeader !== undefined ? defaultState.isHeader : false,
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        version: defaultState.version || 0,
      });
    }
  }, [open, defaultState, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userId = 0;
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        // Try multiple possible property names for user ID
        userId = u?.userId || u?.userID || u?.id || 0;
        companyId = u?.companyId || 1;
        console.log("Extracted user info:", { userId, companyId });
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Prepare payload
    const payload: any = {
      accountId: values.accountId || 0,
      companyId: companyId,
      parentAccountId: values.parentAccountId,
      accountCode: isUpdate ? values.accountCode : "0", // Send "0" for add, actual code for edit
      accountName: values.accountName,
      description: values.description || "",
      accountType: values.accountType,
      accountNature: values.accountNature || "",
      isHeader: values.isHeader,
      isActive: values.isActive,
      version: values.version || 0,
      accountLevel: values.parentAccountId ? 2 : 1,
      createdBy: userId, // Always include createdBy
    };

    // For add operation
    if (!isUpdate) {
      payload.createdBy = userId;
      payload.createdAt = new Date().toISOString();
    } else {
      payload.updatedBy = userId;
      payload.updatedAt = new Date().toISOString();
    }

    console.log("GL Account Payload:", payload);
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}GlAccount`, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (responseData?.statusCode >= 400) {
        throw new Error(responseData.message || "Unknown error occurred");
      }

      if (onOpenChange) onOpenChange(false);

      // Prepare the response data
      const responseItem = {
        ...values,
        ...responseData,
        accountId: responseData.accountId || values.accountId,
      };

      handleAddEdit(responseItem);

      toast({
        title: `Account ${type === "edit" ? "updated" : "added"} successfully.`,
      });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {type === "edit" ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            New Account
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Account" : "Add New Account"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update account information."
              : "Add a new account to the chart of accounts."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Company Info */}
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
                          return u?.companyName || "SASPAK CARGO";
                        } catch (error) {
                          return "SASPAK CARGO";
                        }
                      }
                      return "SASPAK CARGO";
                    })()}
                  </div>
                </div>

                <div>
                  <FormLabel className='text-sm font-medium text-gray-600'>
                    Account Level
                  </FormLabel>
                  <div className='mt-1 text-sm text-gray-900'>
                    {form.watch("parentAccountId")
                      ? "Level 2 (Child)"
                      : "Level 1 (Root)"}
                  </div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Account Code - Readonly in edit mode */}
              <FormField
                control={form.control}
                name='accountCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Account Code {type === "edit" ? "(Read-only)" : ""}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={type === "add" ? "Auto-generated" : ""}
                        {...field}
                        readOnly={type === "edit"}
                        className={
                          type === "edit"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }
                      />
                    </FormControl>
                    {type === "add" && (
                      <p className='text-xs text-gray-500'>
                        Account code will be auto-generated by the system
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent Account - Disabled for edit mode */}
              <FormField
                control={form.control}
                name='parentAccountId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Parent Account{" "}
                      {type === "edit" ? "(Cannot be changed)" : ""}
                    </FormLabel>
                    <FormControl>
                      <select
                        className={`w-full p-2 border rounded-md ${
                          type === "edit"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        value={field.value || ""}
                        onChange={(e) => {
                          if (type === "edit") return; // Prevent changes in edit mode
                          const value =
                            e.target.value === ""
                              ? null
                              : Number(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={type === "edit"}
                      >
                        <option value=''>No Parent (Root Account)</option>
                        {parentAccounts.map((account) => (
                          <option key={account.value} value={account.value}>
                            {account.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {type === "edit" && (
                      <p className='text-xs text-gray-500'>
                        Parent account cannot be changed after creation
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Account Name */}
            <FormField
              control={form.control}
              name='accountName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., Cash & Bank, Accounts Receivable'
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
                    <Input
                      placeholder='Brief description of the account'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Account Type */}
              <FormField
                control={form.control}
                name='accountType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={type === "edit"} // Disable in edit mode
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select account type' />
                        </SelectTrigger>
                        <SelectContent>
                          {accountTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className='flex items-center gap-2'>
                                <type.icon className='h-4 w-4' />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {type === "edit" && (
                      <p className='text-xs text-gray-500'>
                        Account type cannot be changed after creation
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Nature */}
              <FormField
                control={form.control}
                name='accountNature'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Nature</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select nature' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='DEBIT'>Debit</SelectItem>
                          <SelectItem value='CREDIT'>Credit</SelectItem>
                          <SelectItem value='BOTH'>Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Is Header */}
              <FormField
                control={form.control}
                name='isHeader'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header Account</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          disabled={type === "edit"} // Disable in edit mode
                        />
                        <span className='text-sm font-medium'>
                          This is a header account
                        </span>
                      </div>
                    </FormControl>
                    {type === "edit" && (
                      <p className='text-xs text-gray-500'>
                        Header status cannot be changed after creation
                      </p>
                    )}
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
                  name='accountId'
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
                onClick={() => {
                  if (onOpenChange) onOpenChange(false);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && (
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                )}
                {type === "edit" ? "Update Account" : "Add Account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function GLAccountsPage({
  initialData = [],
}: {
  initialData?: GLAccount[];
}) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<GLAccount[]>(initialData);
  const [filteredAccounts, setFilteredAccounts] =
    useState<GLAccount[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<GLAccount | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [showInactive, setShowInactive] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    assets: 0,
    liabilities: 0,
    revenue: 0,
    expense: 0,
    headerAccounts: 0,
    detailAccounts: 0,
  });

  // State for managing edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<GLAccount | null>(null);

  // Build hierarchical tree structure
  const buildAccountTree = (accounts: GLAccount[]): GLAccount[] => {
    const accountMap = new Map<number, GLAccount>();
    const tree: GLAccount[] = [];

    // Create map and add children array
    accounts.forEach((account) => {
      accountMap.set(account.accountId, { ...account, children: [] });
    });

    // Build tree structure
    accounts.forEach((account) => {
      const node = accountMap.get(account.accountId)!;
      if (account.parentAccountId && accountMap.has(account.parentAccountId)) {
        const parent = accountMap.get(account.parentAccountId)!;
        parent.children!.push(node);
      } else {
        tree.push(node);
      }
    });

    // Sort children by account code
    const sortAccounts = (nodes: GLAccount[]) => {
      nodes.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortAccounts(node.children);
        }
      });
    };

    sortAccounts(tree);
    return tree;
  };

  // Calculate statistics
  const calculateStats = (accounts: GLAccount[]) => {
    let total = 0;
    let active = 0;
    let assets = 0;
    let liabilities = 0;
    let revenue = 0;
    let expense = 0;
    let headerAccounts = 0;
    let detailAccounts = 0;

    const traverse = (nodes: GLAccount[]) => {
      nodes.forEach((account) => {
        total++;
        if (account.isActive) active++;
        if (account.isHeader) headerAccounts++;
        else detailAccounts++;

        switch (account.accountType) {
          case "ASSET":
            assets++;
            break;
          case "LIABILITY":
            liabilities++;
            break;
          case "REVENUE":
            revenue++;
            break;
          case "EXPENSE":
            expense++;
            break;
        }

        if (account.children) {
          traverse(account.children);
        }
      });
    };

    traverse(accounts);
    setStats({
      total,
      active,
      assets,
      liabilities,
      revenue,
      expense,
      headerAccounts,
      detailAccounts,
    });
  };

  // Fetch GL Accounts
  const fetchGLAccounts = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}GlAccount/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select:
            "AccountId,CompanyId,ParentAccountId,AccountCode,AccountName,Description,AccountLevel,AccountType,AccountNature,IsHeader,IsActive,CreatedBy,CreatedAt,UpdatedAt,Version",
          where: "",
          sortOn: "AccountCode",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched accounts:", data);
        const accountsTree = buildAccountTree(data);
        setAccounts(accountsTree);
        setFilteredAccounts(accountsTree);
        calculateStats(accountsTree);
      } else {
        throw new Error("Failed to fetch GL Accounts");
      }
    } catch (error) {
      console.error("Error fetching GL Accounts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load Chart of Accounts",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const accountsTree = buildAccountTree(initialData);
      setAccounts(accountsTree);
      setFilteredAccounts(accountsTree);
      calculateStats(accountsTree);
    }
  }, [initialData]);

  // Filter and search
  useEffect(() => {
    let result = [...accounts];

    // Apply type filter
    if (selectedType !== "ALL") {
      const filterByType = (nodes: GLAccount[]): GLAccount[] => {
        const filteredNodes: GLAccount[] = [];

        nodes.forEach((node) => {
          const matchesType = node.accountType === selectedType;
          const filteredChildren = node.children
            ? filterByType(node.children)
            : [];

          if (matchesType || filteredChildren.length > 0) {
            const filteredNode = { ...node, children: filteredChildren };
            filteredNodes.push(filteredNode);
          }
        });

        return filteredNodes;
      };
      result = filterByType(result);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const searchAccounts = (nodes: GLAccount[]): GLAccount[] => {
        const filteredNodes: GLAccount[] = [];

        nodes.forEach((node) => {
          const matchesSearch =
            node.accountCode.toLowerCase().includes(searchLower) ||
            node.accountName.toLowerCase().includes(searchLower) ||
            (node.description &&
              node.description.toLowerCase().includes(searchLower));

          const filteredChildren = node.children
            ? searchAccounts(node.children)
            : [];

          if (matchesSearch || filteredChildren.length > 0) {
            const filteredNode = { ...node, children: filteredChildren };
            filteredNodes.push(filteredNode);
          }
        });

        return filteredNodes;
      };
      result = searchAccounts(result);
    }

    // Apply inactive filter
    if (!showInactive) {
      const filterActive = (nodes: GLAccount[]): GLAccount[] => {
        const filteredNodes: GLAccount[] = [];

        nodes.forEach((node) => {
          const filteredChildren = node.children
            ? filterActive(node.children)
            : [];

          if (node.isActive || filteredChildren.length > 0) {
            const filteredNode = { ...node, children: filteredChildren };
            filteredNodes.push(filteredNode);
          }
        });

        return filteredNodes;
      };
      result = filterActive(result);
    }

    setFilteredAccounts(result);
  }, [accounts, searchTerm, selectedType, showInactive]);

  // Handle Add/Edit
  const handleAddEdit = (updatedItem: any) => {
    fetchGLAccounts(); // Refresh data
    setEditDialogOpen(false);
    setAccountToEdit(null);
  };

  // Handle Edit button click
  const handleEditClick = (account: GLAccount) => {
    console.log("Edit clicked for account:", account);
    setAccountToEdit(account);
    setEditDialogOpen(true);
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedAccount) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(
        `${baseUrl}GlAccount/${selectedAccount.accountId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Account deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setSelectedAccount(null);
        fetchGLAccounts();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete account");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  // Toggle account expansion
  const toggleAccount = (accountId: number) => {
    setExpandedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Get all parent accounts for dropdown
  const getParentAccounts = () => {
    const parents: { value: string; label: string }[] = [
      { value: "", label: "No Parent (Root Account)" },
    ];

    const traverse = (nodes: GLAccount[], level: number) => {
      nodes.forEach((node) => {
        if (node.isHeader) {
          const prefix = "—".repeat(level);
          parents.push({
            value: node.accountId.toString(),
            label: `${prefix} ${node.accountCode} - ${node.accountName}`,
          });
        }
        if (node.children) {
          traverse(node.children, level + 1);
        }
      });
    };

    traverse(accounts, 0);
    return parents;
  };

  // Render account tree
  const renderAccountTree = (accounts: GLAccount[], level = 0) => {
    return accounts.map((account) => {
      const isExpanded = expandedAccounts.includes(account.accountId);
      const hasChildren = account.children && account.children.length > 0;
      const Icon =
        accountTypes.find((t) => t.value === account.accountType)?.icon ||
        FileText;
      const accountType = accountTypes.find(
        (t) => t.value === account.accountType
      );

      return (
        <div key={account.accountId}>
          <div
            className={`flex items-center p-3 hover:bg-gray-50 border-b`}
            style={{ paddingLeft: `${level * 24 + 16}px` }}
          >
            <div className='flex items-center flex-1 min-w-0'>
              {hasChildren ? (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0 mr-2'
                  onClick={() => toggleAccount(account.accountId)}
                >
                  {isExpanded ? (
                    <ChevronDown className='h-4 w-4' />
                  ) : (
                    <ChevronRight className='h-4 w-4' />
                  )}
                </Button>
              ) : (
                <div className='w-6 mr-2' />
              )}

              <div
                className={`p-2 rounded-md mr-3 ${
                  accountType?.color || "bg-gray-500"
                } bg-opacity-10`}
              >
                <Icon
                  className={`h-4 w-4 ${accountType?.color?.replace(
                    "bg-",
                    "text-"
                  )}`}
                />
              </div>

              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='font-mono font-medium text-sm'>
                    {account.accountCode}
                  </span>
                  <span className='text-sm font-medium truncate'>
                    {account.accountName}
                  </span>
                  {account.isHeader && (
                    <Badge variant='outline' className='text-xs'>
                      Header
                    </Badge>
                  )}
                  {!account.isActive && (
                    <Badge variant='secondary' className='text-xs'>
                      Inactive
                    </Badge>
                  )}
                </div>
                {account.description && (
                  <p className='text-xs text-gray-500 truncate mt-1'>
                    {account.description}
                  </p>
                )}
              </div>

              <div className='flex items-center gap-2 ml-4'>
                <Badge variant='outline' className='text-xs capitalize'>
                  {account.accountType?.toLowerCase()}
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleEditClick(account)}
                >
                  <Edit className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-red-600 hover:text-red-700'
                  onClick={() => {
                    setSelectedAccount(account);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div>{renderAccountTree(account.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  // Render list view
  const renderListView = () => {
    const flattenAccounts = (accounts: GLAccount[]): GLAccount[] => {
      let result: GLAccount[] = [];
      const traverse = (nodes: GLAccount[]) => {
        nodes.forEach((node) => {
          result.push(node);
          if (node.children) {
            traverse(node.children);
          }
        });
      };
      traverse(accounts);
      return result;
    };

    const flatAccounts = flattenAccounts(filteredAccounts);

    return (
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-32'>Account Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead className='w-32'>Type</TableHead>
              <TableHead className='w-32'>Nature</TableHead>
              <TableHead className='w-24'>Level</TableHead>
              <TableHead className='w-24'>Status</TableHead>
              <TableHead className='w-20'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatAccounts.map((account) => {
              const accountType = accountTypes.find(
                (t) => t.value === account.accountType
              );
              const Icon = accountType?.icon || FileText;

              return (
                <TableRow key={account.accountId}>
                  <TableCell className='font-mono font-medium'>
                    {account.accountCode}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`p-1.5 rounded ${
                          accountType?.color || "bg-gray-500"
                        } bg-opacity-10`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 ${accountType?.color?.replace(
                            "bg-",
                            "text-"
                          )}`}
                        />
                      </div>
                      <span>{account.accountName}</span>
                      {account.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Eye className='h-3.5 w-3.5 text-gray-400' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='max-w-xs'>{account.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className='capitalize'>
                      {account.accountType?.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className='text-sm capitalize'>
                      {account.accountNature?.toLowerCase() || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>
                      Level {account.accountLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.isActive ? (
                      <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
                        Active
                      </Badge>
                    ) : (
                      <Badge variant='secondary'>Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleEditClick(account)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-red-600 hover:text-red-700'
                              onClick={() => {
                                setSelectedAccount(account);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Account</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading && accounts.length === 0) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 animate-spin mx-auto text-blue-600' />
          <p className='mt-2 text-gray-600'>Loading Chart of Accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Chart of Accounts
          </h1>
          <p className='text-gray-600 mt-1'>
            Manage your General Ledger accounts with hierarchical structure
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={fetchGLAccounts}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <GLAccountDialog
            type='add'
            defaultState={{}}
            handleAddEdit={handleAddEdit}
            parentAccounts={getParentAccounts()}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='border-l-4 border-l-blue-500'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Accounts
                </p>
                <h3 className='text-2xl font-bold mt-1'>{stats.total}</h3>
              </div>
              <Layers className='h-8 w-8 text-blue-500' />
            </div>
            <Progress
              value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
              className='mt-4'
            />
            <p className='text-xs text-gray-500 mt-2'>
              {stats.active} active • {stats.total - stats.active} inactive
            </p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-green-500'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Assets</p>
                <h3 className='text-2xl font-bold mt-1'>{stats.assets}</h3>
              </div>
              <Building className='h-8 w-8 text-green-500' />
            </div>
            <Progress
              value={stats.total > 0 ? (stats.assets / stats.total) * 100 : 0}
              className='mt-4'
            />
            <p className='text-xs text-gray-500 mt-2'>
              {stats.total > 0
                ? ((stats.assets / stats.total) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-purple-500'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Revenue</p>
                <h3 className='text-2xl font-bold mt-1'>{stats.revenue}</h3>
              </div>
              <PieChart className='h-8 w-8 text-purple-500' />
            </div>
            <Progress
              value={stats.total > 0 ? (stats.revenue / stats.total) * 100 : 0}
              className='mt-4'
            />
            <p className='text-xs text-gray-500 mt-2'>
              Income generating accounts
            </p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-amber-500'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Structure</p>
                <h3 className='text-2xl font-bold mt-1'>
                  {stats.headerAccounts}:{stats.detailAccounts}
                </h3>
              </div>
              <FolderTree className='h-8 w-8 text-amber-500' />
            </div>
            <div className='flex items-center gap-2 mt-4'>
              <Badge variant='outline' className='text-xs'>
                {stats.headerAccounts} Headers
              </Badge>
              <Badge variant='secondary' className='text-xs'>
                {stats.detailAccounts} Details
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
            <div className='flex-1 max-w-2xl'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by account code, name, or description...'
                  className='pl-10'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4 text-gray-500' />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Filter by type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>All Types</SelectItem>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className='flex items-center gap-2'>
                          <type.icon className='h-4 w-4' />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='show-inactive'
                  className='text-sm text-gray-600'
                >
                  Show Inactive
                </Label>
                <Switch
                  id='show-inactive'
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
              </div>

              <div className='flex border rounded-lg overflow-hidden'>
                <Button
                  variant={viewMode === "tree" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => setViewMode("tree")}
                  className='rounded-none'
                >
                  <FolderTree className='h-4 w-4 mr-2' />
                  Tree View
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => setViewMode("list")}
                  className='rounded-none'
                >
                  <FileText className='h-4 w-4 mr-2' />
                  List View
                </Button>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between mt-4'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-sm'>
                {filteredAccounts.length} Accounts
              </Badge>
              {searchTerm && (
                <Badge variant='secondary' className='text-sm'>
                  Search: &quot;{searchTerm}&quot;
                </Badge>
              )}
              {selectedType !== "ALL" && (
                <Badge variant='secondary' className='text-sm'>
                  Type:{" "}
                  {accountTypes.find((t) => t.value === selectedType)?.label}
                </Badge>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
              <Button variant='outline' size='sm'>
                <Upload className='h-4 w-4 mr-2' />
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Display */}
      {viewMode === "tree" ? (
        <Card>
          <CardContent className='p-0'>
            {filteredAccounts.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <Sparkles className='h-12 w-12 text-gray-300 mb-4' />
                <h3 className='text-lg font-medium text-gray-900'>
                  No accounts found
                </h3>
                <p className='text-gray-500 mt-1'>
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first account to get started"}
                </p>
              </div>
            ) : (
              <div className='divide-y'>
                {renderAccountTree(filteredAccounts)}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='p-0'>
            {filteredAccounts.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <Sparkles className='h-12 w-12 text-gray-300 mb-4' />
                <h3 className='text-lg font-medium text-gray-900'>
                  No accounts found
                </h3>
                <p className='text-gray-500 mt-1'>
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first account to get started"}
                </p>
              </div>
            ) : (
              renderListView()
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {accountToEdit && (
        <GLAccountDialog
          key={accountToEdit.accountId}
          type='edit'
          defaultState={accountToEdit}
          handleAddEdit={handleAddEdit}
          parentAccounts={getParentAccounts()}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setAccountToEdit(null);
            }
          }}
          open={editDialogOpen}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              account
              {selectedAccount?.children &&
                selectedAccount.children.length > 0 && (
                  <span> and all its child accounts</span>
                )}
              .
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <p className='text-gray-600'>
              Are you sure you want to delete account{" "}
              <span className='font-semibold'>
                {selectedAccount?.accountCode} - {selectedAccount?.accountName}
              </span>
              ?
            </p>
            {selectedAccount?.children &&
              selectedAccount.children.length > 0 && (
                <div className='mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md'>
                  <p className='text-amber-800 text-sm'>
                    ⚠️ This account has {selectedAccount.children.length} child
                    account(s). Deleting it will also delete all child accounts.
                  </p>
                </div>
              )}
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
