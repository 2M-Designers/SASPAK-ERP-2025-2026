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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  AlertCircle,
  CheckCircle2,
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  account,
  parentAccount,
  isOpen,
  onClose,
  onSuccess,
  parentAccounts,
}: {
  type: "add" | "edit" | "add-child";
  account?: GLAccount | null;
  parentAccount?: GLAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentAccounts: { value: string; label: string }[];
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    accountId: 0,
    companyId: 1,
    parentAccountId: null as number | null,
    accountCode: "",
    accountName: "",
    description: "",
    accountType: "",
    accountNature: "",
    isHeader: false,
    isActive: true,
    version: 0,
  });

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (type === "edit" && account) {
        setFormData({
          accountId: account.accountId,
          companyId: account.companyId,
          parentAccountId: account.parentAccountId,
          accountCode: account.accountCode,
          accountName: account.accountName,
          description: account.description || "",
          accountType: account.accountType,
          accountNature: account.accountNature || "",
          isHeader: account.isHeader,
          isActive: account.isActive,
          version: account.version,
        });
      } else if (type === "add-child" && parentAccount) {
        setFormData({
          accountId: 0,
          companyId: parentAccount.companyId,
          parentAccountId: parentAccount.accountId,
          accountCode: "",
          accountName: "",
          description: "",
          accountType: parentAccount.accountType,
          accountNature: "",
          isHeader: false,
          isActive: true,
          version: 0,
        });
      } else {
        // Reset for new account
        setFormData({
          accountId: 0,
          companyId: 1,
          parentAccountId: null,
          accountCode: "",
          accountName: "",
          description: "",
          accountType: "",
          accountNature: "",
          isHeader: false,
          isActive: true,
          version: 0,
        });
      }
      setErrors({});
    }
  }, [isOpen, type, account, parentAccount]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = "Account name is required";
    }

    if (!formData.accountType) {
      newErrors.accountType = "Account type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const user = localStorage.getItem("user");
    let userId = 0;
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        userId = u?.userId || u?.userID || u?.id || 0;
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    const payload: any = {
      accountId: formData.accountId || 0,
      companyId: companyId,
      parentAccountId: formData.parentAccountId,
      accountCode: isUpdate ? formData.accountCode : "0",
      accountName: formData.accountName,
      description: formData.description || "",
      accountType: formData.accountType,
      accountNature: formData.accountNature || "",
      isHeader: formData.isHeader,
      isActive: formData.isActive,
      version: formData.version || 0,
      accountLevel: formData.parentAccountId ? 2 : 1,
      createdBy: userId,
    };

    if (!isUpdate) {
      payload.createdAt = new Date().toISOString();
    } else {
      payload.updatedBy = userId;
      payload.updatedAt = new Date().toISOString();
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
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

      if (responseData?.statusCode >= 400) {
        throw new Error(responseData.message || "Unknown error occurred");
      }

      toast({
        title: "Success!",
        description: `Account ${
          type === "edit" ? "updated" : "created"
        } successfully.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDialogTitle = () => {
    if (type === "edit") return "Edit Account";
    if (type === "add-child")
      return `Add Child Account under ${parentAccount?.accountName}`;
    return "Add New Account";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update account information. Some fields cannot be changed after creation."
              : "Create a new general ledger account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {/* Company Info */}
          <div className='p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label className='text-sm font-medium text-gray-600'>
                  Company
                </Label>
                <div className='mt-1 text-sm font-semibold text-gray-900'>
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
                <Label className='text-sm font-medium text-gray-600'>
                  Account Level
                </Label>
                <div className='mt-1'>
                  <Badge
                    variant={formData.parentAccountId ? "default" : "secondary"}
                  >
                    {formData.parentAccountId
                      ? "Level 2 (Child)"
                      : "Level 1 (Root)"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Account Code */}
            <div>
              <Label htmlFor='accountCode'>
                Account Code {type === "edit" && "(Read-only)"}
              </Label>
              <Input
                id='accountCode'
                placeholder={type === "edit" ? "" : "Auto-generated"}
                value={formData.accountCode}
                onChange={(e) =>
                  setFormData({ ...formData, accountCode: e.target.value })
                }
                readOnly={type === "edit"}
                className={
                  type === "edit" ? "bg-gray-100 cursor-not-allowed" : ""
                }
              />
              {type !== "edit" && (
                <p className='text-xs text-gray-500 mt-1'>
                  Will be auto-generated by the system
                </p>
              )}
            </div>

            {/* Parent Account */}
            <div>
              <Label htmlFor='parentAccount'>
                Parent Account {type === "edit" && "(Cannot be changed)"}
              </Label>
              <select
                id='parentAccount'
                className={`w-full p-2 border rounded-md ${
                  type === "edit" || type === "add-child"
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
                value={formData.parentAccountId || ""}
                onChange={(e) => {
                  if (type === "edit" || type === "add-child") return;
                  const value =
                    e.target.value === "" ? null : Number(e.target.value);
                  setFormData({ ...formData, parentAccountId: value });
                }}
                disabled={type === "edit" || type === "add-child"}
              >
                <option value=''>No Parent (Root Account)</option>
                {parentAccounts.map((acc) => (
                  <option key={acc.value} value={acc.value}>
                    {acc.label}
                  </option>
                ))}
              </select>
              {type === "edit" && (
                <p className='text-xs text-gray-500 mt-1'>
                  Cannot be changed after creation
                </p>
              )}
            </div>
          </div>

          {/* Account Name */}
          <div>
            <Label htmlFor='accountName'>
              Account Name <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='accountName'
              placeholder='e.g., Cash & Bank, Accounts Receivable'
              value={formData.accountName}
              onChange={(e) =>
                setFormData({ ...formData, accountName: e.target.value })
              }
              className={errors.accountName ? "border-red-500" : ""}
            />
            {errors.accountName && (
              <p className='text-xs text-red-500 mt-1'>{errors.accountName}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              placeholder='Brief description of the account'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Account Type */}
            <div>
              <Label htmlFor='accountType'>
                Account Type <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountType: value })
                }
                disabled={type === "edit" || type === "add-child"}
              >
                <SelectTrigger
                  className={errors.accountType ? "border-red-500" : ""}
                >
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
              {errors.accountType && (
                <p className='text-xs text-red-500 mt-1'>
                  {errors.accountType}
                </p>
              )}
              {type === "edit" && (
                <p className='text-xs text-gray-500 mt-1'>Cannot be changed</p>
              )}
            </div>

            {/* Account Nature */}
            <div>
              <Label htmlFor='accountNature'>Account Nature</Label>
              <Select
                value={formData.accountNature || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountNature: value })
                }
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
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Is Header */}
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='isHeader'
                checked={formData.isHeader}
                onChange={(e) =>
                  setFormData({ ...formData, isHeader: e.target.checked })
                }
                disabled={type === "edit"}
                className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <Label htmlFor='isHeader' className='cursor-pointer'>
                Header Account
                {type === "edit" && " (Cannot be changed)"}
              </Label>
            </div>

            {/* Is Active */}
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='isActive'
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className='w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <Label htmlFor='isActive' className='cursor-pointer'>
                {formData.isActive ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading && <RefreshCw className='mr-2 h-4 w-4 animate-spin' />}
              {type === "edit" ? "Update Account" : "Create Account"}
            </Button>
          </div>
        </form>
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

  // Dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: "add" | "edit" | "add-child";
    account: GLAccount | null;
    parentAccount: GLAccount | null;
  }>({
    isOpen: false,
    type: "add",
    account: null,
    parentAccount: null,
  });

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

  // Build hierarchical tree structure
  const buildAccountTree = (accounts: GLAccount[]): GLAccount[] => {
    const accountMap = new Map<number, GLAccount>();
    const tree: GLAccount[] = [];

    accounts.forEach((account) => {
      accountMap.set(account.accountId, { ...account, children: [] });
    });

    accounts.forEach((account) => {
      const node = accountMap.get(account.accountId)!;
      if (account.parentAccountId && accountMap.has(account.parentAccountId)) {
        const parent = accountMap.get(account.parentAccountId)!;
        parent.children!.push(node);
      } else {
        tree.push(node);
      }
    });

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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
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
    } else {
      fetchGLAccounts();
    }
  }, [initialData]);

  // Filter and search
  useEffect(() => {
    let result = [...accounts];

    if (selectedType !== "ALL") {
      const filterByType = (nodes: GLAccount[]): GLAccount[] => {
        const filteredNodes: GLAccount[] = [];
        nodes.forEach((node) => {
          const matchesType = node.accountType === selectedType;
          const filteredChildren = node.children
            ? filterByType(node.children)
            : [];
          if (matchesType || filteredChildren.length > 0) {
            filteredNodes.push({ ...node, children: filteredChildren });
          }
        });
        return filteredNodes;
      };
      result = filterByType(result);
    }

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
            filteredNodes.push({ ...node, children: filteredChildren });
          }
        });
        return filteredNodes;
      };
      result = searchAccounts(result);
    }

    if (!showInactive) {
      const filterActive = (nodes: GLAccount[]): GLAccount[] => {
        const filteredNodes: GLAccount[] = [];
        nodes.forEach((node) => {
          const filteredChildren = node.children
            ? filterActive(node.children)
            : [];
          if (node.isActive || filteredChildren.length > 0) {
            filteredNodes.push({ ...node, children: filteredChildren });
          }
        });
        return filteredNodes;
      };
      result = filterActive(result);
    }

    setFilteredAccounts(result);
  }, [accounts, searchTerm, selectedType, showInactive]);

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedAccount) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
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
    const parents: { value: string; label: string }[] = [];
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
            className='flex items-center p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent border-b transition-all duration-200 group'
            style={{ paddingLeft: `${level * 24 + 16}px` }}
          >
            <div className='flex items-center flex-1 min-w-0'>
              {hasChildren ? (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0 mr-2 hover:bg-blue-100'
                  onClick={() => toggleAccount(account.accountId)}
                >
                  {isExpanded ? (
                    <ChevronDown className='h-4 w-4 text-blue-600' />
                  ) : (
                    <ChevronRight className='h-4 w-4 text-gray-600' />
                  )}
                </Button>
              ) : (
                <div className='w-6 mr-2' />
              )}

              <div
                className={`p-2 rounded-lg mr-3 ${
                  accountType?.color || "bg-gray-500"
                } bg-opacity-10 group-hover:bg-opacity-20 transition-all`}
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
                  <span className='font-mono font-semibold text-sm text-gray-700'>
                    {account.accountCode}
                  </span>
                  <span className='text-sm font-medium truncate'>
                    {account.accountName}
                  </span>
                  {account.isHeader && (
                    <Badge variant='outline' className='text-xs bg-blue-50'>
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

              <div className='flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600'
                        onClick={() =>
                          setDialogState({
                            isOpen: true,
                            type: "edit",
                            account: account,
                            parentAccount: null,
                          })
                        }
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Account</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {account.isHeader && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600'
                          onClick={() =>
                            setDialogState({
                              isOpen: true,
                              type: "add-child",
                              account: null,
                              parentAccount: account,
                            })
                          }
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add Child Account</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600'
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
      <div className='border rounded-lg overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead className='w-32 font-semibold'>Code</TableHead>
              <TableHead className='font-semibold'>Account Name</TableHead>
              <TableHead className='w-32 font-semibold'>Type</TableHead>
              <TableHead className='w-24 font-semibold'>Level</TableHead>
              <TableHead className='w-24 font-semibold'>Status</TableHead>
              <TableHead className='w-24 text-center font-semibold'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatAccounts.map((account) => {
              const accountType = accountTypes.find(
                (t) => t.value === account.accountType
              );
              const Icon = accountType?.icon || FileText;

              return (
                <TableRow
                  key={account.accountId}
                  className='hover:bg-gray-50 group'
                >
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
                      <div>
                        <div className='font-medium'>{account.accountName}</div>
                        {account.description && (
                          <div className='text-xs text-gray-500 truncate max-w-xs'>
                            {account.description}
                          </div>
                        )}
                      </div>
                      {account.isHeader && (
                        <Badge variant='outline' className='text-xs'>
                          Header
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className='capitalize'>
                      {account.accountType?.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>L{account.accountLevel}</Badge>
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
                    <div className='flex items-center justify-center gap-1'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              setDialogState({
                                isOpen: true,
                                type: "edit",
                                account: account,
                                parentAccount: null,
                              })
                            }
                          >
                            <Edit className='h-4 w-4 mr-2' />
                            Edit
                          </DropdownMenuItem>
                          {account.isHeader && (
                            <DropdownMenuItem
                              onClick={() =>
                                setDialogState({
                                  isOpen: true,
                                  type: "add-child",
                                  account: null,
                                  parentAccount: account,
                                })
                              }
                            >
                              <Plus className='h-4 w-4 mr-2' />
                              Add Child
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className='text-red-600'
                            onClick={() => {
                              setSelectedAccount(account);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className='h-4 w-4 mr-2' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          <p className='mt-4 text-gray-600 font-medium'>
            Loading Chart of Accounts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
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
          <Button
            className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            onClick={() =>
              setDialogState({
                isOpen: true,
                type: "add",
                account: null,
                parentAccount: null,
              })
            }
          >
            <Plus className='h-4 w-4 mr-2' />
            New Account
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Accounts
                </p>
                <h3 className='text-3xl font-bold mt-1 text-blue-600'>
                  {stats.total}
                </h3>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Layers className='h-6 w-6 text-blue-600' />
              </div>
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

        <Card className='border-l-4 border-l-green-500 hover:shadow-lg transition-shadow'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Assets</p>
                <h3 className='text-3xl font-bold mt-1 text-green-600'>
                  {stats.assets}
                </h3>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <Building className='h-6 w-6 text-green-600' />
              </div>
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

        <Card className='border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Revenue</p>
                <h3 className='text-3xl font-bold mt-1 text-purple-600'>
                  {stats.revenue}
                </h3>
              </div>
              <div className='p-3 bg-purple-100 rounded-full'>
                <PieChart className='h-6 w-6 text-purple-600' />
              </div>
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

        <Card className='border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Structure</p>
                <h3 className='text-3xl font-bold mt-1 text-amber-600'>
                  {stats.headerAccounts}:{stats.detailAccounts}
                </h3>
              </div>
              <div className='p-3 bg-amber-100 rounded-full'>
                <FolderTree className='h-6 w-6 text-amber-600' />
              </div>
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
                <Switch
                  id='show-inactive'
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label
                  htmlFor='show-inactive'
                  className='text-sm text-gray-600 cursor-pointer'
                >
                  Show Inactive
                </Label>
              </div>

              <div className='flex border rounded-lg overflow-hidden'>
                <Button
                  variant={viewMode === "tree" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => setViewMode("tree")}
                  className='rounded-none'
                >
                  <FolderTree className='h-4 w-4 mr-2' />
                  Tree
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => setViewMode("list")}
                  className='rounded-none'
                >
                  <FileText className='h-4 w-4 mr-2' />
                  List
                </Button>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between mt-4'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-sm'>
                {(() => {
                  const flattenAccounts = (
                    accounts: GLAccount[]
                  ): GLAccount[] => {
                    let result: GLAccount[] = [];
                    const traverse = (nodes: GLAccount[]) => {
                      nodes.forEach((node) => {
                        result.push(node);
                        if (node.children) traverse(node.children);
                      });
                    };
                    traverse(accounts);
                    return result;
                  };
                  return flattenAccounts(filteredAccounts).length;
                })()}{" "}
                Accounts
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
        <Card className='overflow-hidden'>
          <CardContent className='p-0'>
            {filteredAccounts.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16'>
                <div className='p-4 bg-gray-100 rounded-full mb-4'>
                  <Sparkles className='h-12 w-12 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  No accounts found
                </h3>
                <p className='text-gray-500 mt-1 mb-4'>
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first account to get started"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() =>
                      setDialogState({
                        isOpen: true,
                        type: "add",
                        account: null,
                        parentAccount: null,
                      })
                    }
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Create First Account
                  </Button>
                )}
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
              <div className='flex flex-col items-center justify-center py-16'>
                <div className='p-4 bg-gray-100 rounded-full mb-4'>
                  <Sparkles className='h-12 w-12 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  No accounts found
                </h3>
                <p className='text-gray-500 mt-1 mb-4'>
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first account to get started"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() =>
                      setDialogState({
                        isOpen: true,
                        type: "add",
                        account: null,
                        parentAccount: null,
                      })
                    }
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Create First Account
                  </Button>
                )}
              </div>
            ) : (
              renderListView()
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Dialog */}
      <GLAccountDialog
        type={dialogState.type}
        account={dialogState.account}
        parentAccount={dialogState.parentAccount}
        isOpen={dialogState.isOpen}
        onClose={() =>
          setDialogState({
            isOpen: false,
            type: "add",
            account: null,
            parentAccount: null,
          })
        }
        onSuccess={fetchGLAccounts}
        parentAccounts={getParentAccounts()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertCircle className='h-5 w-5' />
              Delete Account
            </DialogTitle>
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
            <Alert variant='destructive' className='mb-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Are you sure you want to delete account{" "}
                <span className='font-semibold'>
                  {selectedAccount?.accountCode} -{" "}
                  {selectedAccount?.accountName}
                </span>
                ?
              </AlertDescription>
            </Alert>
            {selectedAccount?.children &&
              selectedAccount.children.length > 0 && (
                <Alert className='bg-amber-50 border-amber-200'>
                  <AlertCircle className='h-4 w-4 text-amber-600' />
                  <AlertDescription className='text-amber-800'>
                    This account has {selectedAccount.children.length} child
                    account(s). Deleting it will also delete all child accounts.
                  </AlertDescription>
                </Alert>
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
              <Trash2 className='h-4 w-4 mr-2' />
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
