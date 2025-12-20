"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Save,
  RefreshCw,
  Shield,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  List,
  Printer,
  Key,
  AlertCircle,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import AppLoader from "@/components/app-loader";

type Right = {
  rightId: number;
  rightCode: string;
  tableName: string;
  displayName: string;
  description: string;
  module: string;
  category: string;
  isActive: boolean | null;
  roleRights: any[];
};

type Role = {
  roleId: number;
  companyId: number;
  roleName: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

type RoleRight = {
  roleId: number;
  rightId: number;
  rightCode: string;
  tableName: string;
  displayName: string;
  category: string;
  module: string;
  description: string;
  allowInsert: boolean | null;
  allowUpdate: boolean | null;
  allowDelete: boolean | null;
  allowGetList: boolean | null;
  allowPrint: boolean | null;
};

type TreeNode = {
  id: string;
  label: string;
  type: "module" | "right";
  children?: TreeNode[];
  rightId?: number;
  right?: RoleRight;
  isExpanded?: boolean;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  count?: number;
  allowInsert?: boolean;
  allowUpdate?: boolean;
  allowDelete?: boolean;
  allowGetList?: boolean;
  allowPrint?: boolean;
};

type PendingChange = {
  type: "add" | "update" | "delete";
  rightId: number;
  permissions?: {
    allowInsert: boolean;
    allowUpdate: boolean;
    allowDelete: boolean;
    allowGetList: boolean;
    allowPrint: boolean;
  };
};

export default function RolesRightsPage() {
  const { toast } = useToast();
  const [rights, setRights] = useState<Right[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignedRights, setAssignedRights] = useState<Map<number, RoleRight>>(
    new Map()
  );
  const [pendingChanges, setPendingChanges] = useState<
    Map<number, PendingChange>
  >(new Map());
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [expandedPermissions, setExpandedPermissions] = useState<Set<number>>(
    new Set()
  );
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Refs for indeterminate checkboxes
  const moduleCheckboxRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Fetch all rights
  const fetchRights = async () => {
    setIsLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://188.245.83.20:9001/api/";
      const response = await fetch(`${baseUrl}Role/GetAllRights`);
      if (!response.ok) throw new Error("Failed to fetch rights");
      const data = await response.json();
      setRights(data);

      const uniqueModules = Array.from(
        new Set(data.map((right: Right) => right.module).filter(Boolean))
      ) as string[];
      setModules(["all", ...uniqueModules]);
      setInitialDataLoaded(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load rights",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch roles using GetList API
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://188.245.83.20:9001/api/";

      const requestBody = {
        select:
          "RoleId,CompanyId,RoleName,Description,IsSystemRole,IsActive,CreatedBy,CreatedAt,UpdatedAt,Version",
        where: "",
        sortOn: "RoleName",
        page: "1",
        pageSize: "50",
      };

      const response = await fetch(`${baseUrl}Role/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load roles",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch assigned rights for selected role
  const fetchAssignedRights = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://188.245.83.20:9001/api/";
      const response = await fetch(
        `${baseUrl}Role/GetAllRightsToRole?roleId=${selectedRole.roleId}`
      );

      if (!response.ok) throw new Error("Failed to fetch role rights");
      const roleRights: RoleRight[] = await response.json();

      const assignedMap = new Map<number, RoleRight>();
      roleRights.forEach((right) => {
        assignedMap.set(right.rightId, right);
      });

      setAssignedRights(assignedMap);
      setPendingChanges(new Map());
      setExpandedPermissions(new Set());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assigned rights",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Build tree data from rights
  const buildTreeData = () => {
    if (rights.length === 0) return;

    const moduleMap = new Map<string, Right[]>();

    let filteredRights = rights;

    if (searchTerm) {
      filteredRights = filteredRights.filter(
        (right) =>
          right.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          right.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          right.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          right.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedModule !== "all") {
      filteredRights = filteredRights.filter(
        (right) => right.module === selectedModule
      );
    }

    filteredRights.forEach((right) => {
      if (!moduleMap.has(right.module)) {
        moduleMap.set(right.module, []);
      }
      moduleMap.get(right.module)!.push(right);
    });

    const treeNodes: TreeNode[] = [];

    Array.from(moduleMap.entries()).forEach(([moduleName, moduleRights]) => {
      const moduleNode: TreeNode = {
        id: `module-${moduleName}`,
        label: moduleName,
        type: "module",
        isExpanded: expandedNodes.has(`module-${moduleName}`),
        children: [],
        count: moduleRights.length,
        isSelected: false,
        isIndeterminate: false,
      };

      const rightNodes: TreeNode[] = [];
      let selectedRightsCount = 0;

      moduleRights.forEach((right) => {
        const assignedRight = assignedRights.get(right.rightId);
        const pendingChange = pendingChanges.get(right.rightId);

        let isSelected = false;
        let effectivePermissions = {
          allowInsert: false,
          allowUpdate: false,
          allowDelete: false,
          allowGetList: false,
          allowPrint: false,
        };

        if (assignedRight) {
          if (pendingChange?.type === "delete") {
            isSelected = false;
          } else {
            isSelected = true;
            selectedRightsCount++;

            effectivePermissions = {
              allowInsert: assignedRight.allowInsert ?? false,
              allowUpdate: assignedRight.allowUpdate ?? false,
              allowDelete: assignedRight.allowDelete ?? false,
              allowGetList: assignedRight.allowGetList ?? false,
              allowPrint: assignedRight.allowPrint ?? false,
            };

            if (pendingChange?.type === "update" && pendingChange.permissions) {
              effectivePermissions = {
                ...effectivePermissions,
                ...pendingChange.permissions,
              };
            }
          }
        } else {
          if (pendingChange?.type === "add") {
            isSelected = true;
            selectedRightsCount++;
            effectivePermissions = pendingChange.permissions || {
              allowInsert: true,
              allowUpdate: true,
              allowDelete: true,
              allowGetList: true,
              allowPrint: true,
            };
          }
        }

        const rightNode: TreeNode = {
          id: `right-${right.rightId}`,
          label: `${right.displayName}`,
          type: "right",
          rightId: right.rightId,
          right: assignedRight,
          isSelected: isSelected,
          allowInsert: effectivePermissions.allowInsert,
          allowUpdate: effectivePermissions.allowUpdate,
          allowDelete: effectivePermissions.allowDelete,
          allowGetList: effectivePermissions.allowGetList,
          allowPrint: effectivePermissions.allowPrint,
        };

        rightNodes.push(rightNode);
      });

      moduleNode.children = rightNodes;

      if (rightNodes.length > 0) {
        moduleNode.isSelected = selectedRightsCount === rightNodes.length;
        moduleNode.isIndeterminate =
          selectedRightsCount > 0 && selectedRightsCount < rightNodes.length;
      }

      treeNodes.push(moduleNode);
    });

    setTreeData(treeNodes);
  };

  // Update indeterminate state for module checkboxes after render
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      treeData.forEach((node) => {
        if (node.type === "module") {
          const checkboxEl = moduleCheckboxRefs.current.get(node.id);
          if (checkboxEl) {
            const inputEl = checkboxEl.querySelector(
              'input[type="checkbox"]'
            ) as HTMLInputElement;
            if (inputEl) {
              inputEl.indeterminate = node.isIndeterminate || false;
              // Force checked state
              if (node.isSelected) {
                inputEl.checked = true;
              }
            }
          }
        }
      });
    }, 10);

    return () => clearTimeout(timer);
  }, [treeData]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Toggle permissions visibility
  const togglePermissions = (rightId: number) => {
    const newExpanded = new Set(expandedPermissions);
    if (newExpanded.has(rightId)) {
      newExpanded.delete(rightId);
    } else {
      newExpanded.add(rightId);
    }
    setExpandedPermissions(newExpanded);
  };

  // Handle right checkbox change
  const handleRightCheckboxChange = (rightId: number, checked: boolean) => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a role first",
      });
      return;
    }

    const newPendingChanges = new Map(pendingChanges);
    const assignedRight = assignedRights.get(rightId);
    const existingPending = newPendingChanges.get(rightId);

    if (checked) {
      const isAssigned = assignedRight && existingPending?.type !== "delete";

      if (!isAssigned) {
        newPendingChanges.set(rightId, {
          type: "add",
          rightId,
          permissions: {
            allowInsert: true,
            allowUpdate: true,
            allowDelete: true,
            allowGetList: true,
            allowPrint: true,
          },
        });
      } else {
        if (existingPending?.type === "delete") {
          newPendingChanges.delete(rightId);
        }
      }
    } else {
      if (assignedRight) {
        newPendingChanges.set(rightId, {
          type: "delete",
          rightId,
        });
      } else {
        newPendingChanges.delete(rightId);
      }
    }

    setPendingChanges(newPendingChanges);
    // Force immediate rebuild
    requestAnimationFrame(() => buildTreeData());
  };

  // Handle module checkbox change
  const handleModuleCheckboxChange = (
    moduleNode: TreeNode,
    checked: boolean
  ) => {
    if (!selectedRole || !moduleNode.children) return;

    const newPendingChanges = new Map(pendingChanges);
    const rightIds = moduleNode.children
      .filter((child) => child.type === "right" && child.rightId)
      .map((child) => child.rightId!);

    rightIds.forEach((rightId) => {
      const assignedRight = assignedRights.get(rightId);
      const existingPending = newPendingChanges.get(rightId);

      if (checked) {
        const isAssigned = assignedRight && existingPending?.type !== "delete";

        if (!isAssigned) {
          newPendingChanges.set(rightId, {
            type: "add",
            rightId,
            permissions: {
              allowInsert: true,
              allowUpdate: true,
              allowDelete: true,
              allowGetList: true,
              allowPrint: true,
            },
          });
        } else {
          if (existingPending?.type === "delete") {
            newPendingChanges.delete(rightId);
          }
        }
      } else {
        if (assignedRight) {
          newPendingChanges.set(rightId, {
            type: "delete",
            rightId,
          });
        } else {
          newPendingChanges.delete(rightId);
        }
      }
    });

    setPendingChanges(newPendingChanges);
    // Force immediate rebuild
    requestAnimationFrame(() => buildTreeData());
  };

  // Handle permission checkbox change
  const handlePermissionCheckboxChange = (
    rightId: number,
    permission: keyof RoleRight,
    checked: boolean
  ) => {
    if (!selectedRole) return;

    const newPendingChanges = new Map(pendingChanges);
    const assignedRight = assignedRights.get(rightId);
    const existingPending = newPendingChanges.get(rightId);

    const currentPermissions = assignedRight
      ? {
          allowInsert: assignedRight.allowInsert ?? false,
          allowUpdate: assignedRight.allowUpdate ?? false,
          allowDelete: assignedRight.allowDelete ?? false,
          allowGetList: assignedRight.allowGetList ?? false,
          allowPrint: assignedRight.allowPrint ?? false,
        }
      : {
          allowInsert: false,
          allowUpdate: false,
          allowDelete: false,
          allowGetList: false,
          allowPrint: false,
        };

    const effectivePermissions = existingPending?.permissions
      ? { ...currentPermissions, ...existingPending.permissions }
      : currentPermissions;

    const newPermissions = {
      ...effectivePermissions,
      [permission]: checked,
    };

    const isCurrentlyAssigned =
      assignedRight && existingPending?.type !== "delete";

    if (!isCurrentlyAssigned) {
      newPendingChanges.set(rightId, {
        type: "add",
        rightId,
        permissions: newPermissions,
      });
    } else {
      const hasChanges = Object.keys(newPermissions).some(
        (key) =>
          newPermissions[key as keyof typeof newPermissions] !==
          currentPermissions[key as keyof typeof currentPermissions]
      );

      if (hasChanges) {
        newPendingChanges.set(rightId, {
          type: "update",
          rightId,
          permissions: newPermissions,
        });
      } else {
        newPendingChanges.delete(rightId);
      }
    }

    setPendingChanges(newPendingChanges);
    // Force immediate rebuild
    requestAnimationFrame(() => buildTreeData());
  };

  // Save all changes
  const saveChanges = async () => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a role first",
      });
      return;
    }

    if (pendingChanges.size === 0) {
      toast({
        title: "Info",
        description: "No changes to save",
      });
      return;
    }

    setIsSaving(true);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://188.245.83.20:9001/api/";
    const errors: string[] = [];
    const successes: string[] = [];

    const pendingArray = Array.from(pendingChanges.entries());

    for (const [rightId, change] of pendingArray) {
      try {
        const right = rights.find((r) => r.rightId === rightId);
        const rightName = right?.displayName || `Right ${rightId}`;

        if (change.type === "delete") {
          const url = `${baseUrl}Role/deleteRightFromRole?roleId=${selectedRole.roleId}&rightId=${rightId}`;
          const response = await fetch(url, {
            method: "DELETE",
          });

          if (response.ok) {
            successes.push(`Removed "${rightName}"`);
          } else {
            errors.push(`Failed to remove "${rightName}"`);
          }
        } else if (change.type === "add") {
          const permissions = change.permissions!;
          const url = `${baseUrl}Role/addRightToRole?roleId=${selectedRole.roleId}&rightId=${rightId}&allowInsert=${permissions.allowInsert}&allowUpdate=${permissions.allowUpdate}&allowDelete=${permissions.allowDelete}&allowGetList=${permissions.allowGetList}&allowPrint=${permissions.allowPrint}`;

          const response = await fetch(url, {
            method: "POST",
          });

          if (response.ok) {
            successes.push(`Added "${rightName}" with selected permissions`);
          } else {
            errors.push(`Failed to add "${rightName}"`);
          }
        } else if (change.type === "update") {
          const permissions = change.permissions!;
          const url = `${baseUrl}Role/updateRightToRole?roleId=${selectedRole.roleId}&rightId=${rightId}&allowInsert=${permissions.allowInsert}&allowUpdate=${permissions.allowUpdate}&allowDelete=${permissions.allowDelete}&allowGetList=${permissions.allowGetList}&allowPrint=${permissions.allowPrint}`;

          const response = await fetch(url, {
            method: "PUT",
          });

          if (response.ok) {
            successes.push(`Updated permissions for "${rightName}"`);
          } else {
            errors.push(`Failed to update "${rightName}"`);
          }
        }
      } catch (error) {
        errors.push(`Error processing right ${rightId}`);
      }
    }

    setIsSaving(false);

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: `Partial Success (${successes.length} succeeded, ${errors.length} failed)`,
        description: errors.join(", "),
      });
    } else {
      toast({
        title: "Success",
        description: `All ${successes.length} changes saved successfully for ${selectedRole.roleName}`,
      });
    }

    if (successes.length > 0) {
      setPendingChanges(new Map());
      await fetchAssignedRights();
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedModule("all");
  };

  // Expand all nodes
  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.type !== "right") {
          allNodeIds.add(node.id);
          if (node.children) {
            collectNodeIds(node.children);
          }
        }
      });
    };
    collectNodeIds(treeData);
    setExpandedNodes(allNodeIds);
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Render permission toggles
  const renderPermissionToggles = (rightId: number, node: TreeNode) => {
    const isExpanded = expandedPermissions.has(rightId);

    if (!node.isSelected) return null;

    const pendingChange = pendingChanges.get(rightId);
    const isPending = !!pendingChange;

    return (
      <div className='ml-10 space-y-2 mt-2'>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-xs w-full justify-start hover:bg-muted'
          onClick={() => togglePermissions(rightId)}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 mr-1 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
          {isExpanded ? "Hide Permissions" : "Show Permissions"}
          {isPending && (
            <Badge variant='outline' className='ml-2 text-[10px] px-1 py-0'>
              Modified
            </Badge>
          )}
        </Button>

        {isExpanded && (
          <div className='grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border-2 border-muted'>
            <div className='flex flex-col items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors'>
              <div className='flex items-center gap-1.5 mb-1'>
                <div className='p-1 rounded bg-green-100 dark:bg-green-900/30'>
                  <Plus className='h-3 w-3 text-green-600 dark:text-green-400' />
                </div>
                <span className='text-xs font-semibold'>Insert</span>
              </div>
              <Checkbox
                checked={node.allowInsert || false}
                onCheckedChange={(checked) =>
                  handlePermissionCheckboxChange(
                    rightId,
                    "allowInsert",
                    checked as boolean
                  )
                }
                className='h-6 w-6 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600'
              />
            </div>

            <div className='flex flex-col items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors'>
              <div className='flex items-center gap-1.5 mb-1'>
                <div className='p-1 rounded bg-blue-100 dark:bg-blue-900/30'>
                  <Edit className='h-3 w-3 text-blue-600 dark:text-blue-400' />
                </div>
                <span className='text-xs font-semibold'>Update</span>
              </div>
              <Checkbox
                checked={node.allowUpdate || false}
                onCheckedChange={(checked) =>
                  handlePermissionCheckboxChange(
                    rightId,
                    "allowUpdate",
                    checked as boolean
                  )
                }
                className='h-6 w-6 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-600'
              />
            </div>

            <div className='flex flex-col items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors'>
              <div className='flex items-center gap-1.5 mb-1'>
                <div className='p-1 rounded bg-red-100 dark:bg-red-900/30'>
                  <Trash2 className='h-3 w-3 text-red-600 dark:text-red-400' />
                </div>
                <span className='text-xs font-semibold'>Delete</span>
              </div>
              <Checkbox
                checked={node.allowDelete || false}
                onCheckedChange={(checked) =>
                  handlePermissionCheckboxChange(
                    rightId,
                    "allowDelete",
                    checked as boolean
                  )
                }
                className='h-6 w-6 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600'
              />
            </div>

            <div className='flex flex-col items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors'>
              <div className='flex items-center gap-1.5 mb-1'>
                <div className='p-1 rounded bg-purple-100 dark:bg-purple-900/30'>
                  <List className='h-3 w-3 text-purple-600 dark:text-purple-400' />
                </div>
                <span className='text-xs font-semibold'>View</span>
              </div>
              <Checkbox
                checked={node.allowGetList || false}
                onCheckedChange={(checked) =>
                  handlePermissionCheckboxChange(
                    rightId,
                    "allowGetList",
                    checked as boolean
                  )
                }
                className='h-6 w-6 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-600'
              />
            </div>

            <div className='flex flex-col items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors'>
              <div className='flex items-center gap-1.5 mb-1'>
                <div className='p-1 rounded bg-orange-100 dark:bg-orange-900/30'>
                  <Printer className='h-3 w-3 text-orange-600 dark:text-orange-400' />
                </div>
                <span className='text-xs font-semibold'>Print</span>
              </div>
              <Checkbox
                checked={node.allowPrint || false}
                onCheckedChange={(checked) =>
                  handlePermissionCheckboxChange(
                    rightId,
                    "allowPrint",
                    checked as boolean
                  )
                }
                className='h-6 w-6 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-600'
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render tree node
  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const pendingChange = node.rightId
      ? pendingChanges.get(node.rightId)
      : null;

    // Create a unique key that includes selection state
    const nodeKey = `${node.id}-${node.isSelected}-${node.isIndeterminate}`;

    return (
      <div key={nodeKey}>
        <div
          className={cn(
            "flex items-center gap-3 py-3 px-4 hover:bg-accent/50 rounded-lg transition-all group",
            depth === 0 &&
              "bg-gradient-to-r from-muted/50 to-muted/30 border shadow-sm",
            node.isSelected &&
              depth > 0 &&
              "bg-primary/5 border-l-2 border-primary/30",
            pendingChange && "ring-2 ring-blue-200 dark:ring-blue-800"
          )}
        >
          {hasChildren && (
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 p-0 hover:bg-background/80'
              onClick={() => toggleNode(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              )}
            </Button>
          )}
          {!hasChildren && <div className='w-7' />}

          {node.type === "module" ? (
            <Checkbox
              ref={(el) => {
                if (el) {
                  moduleCheckboxRefs.current.set(node.id, el);
                }
              }}
              checked={node.isSelected || false}
              onCheckedChange={(checked) => {
                handleModuleCheckboxChange(node, checked as boolean);
              }}
              className='h-5 w-5'
            />
          ) : node.type === "right" && node.rightId ? (
            <Checkbox
              checked={node.isSelected || false}
              onCheckedChange={(checked) => {
                handleRightCheckboxChange(node.rightId!, checked as boolean);
              }}
              className='h-4 w-4'
            />
          ) : null}

          <div className='flex-1 flex items-center gap-3'>
            <div className='flex flex-col'>
              <span
                className={cn(
                  "font-medium",
                  depth === 0 ? "text-base" : "text-sm",
                  node.isSelected && "text-primary"
                )}
              >
                {node.label}
              </span>
              {node.type === "right" && node.rightId && (
                <span className='text-xs text-muted-foreground'>
                  {rights.find((r) => r.rightId === node.rightId)?.category}
                </span>
              )}
            </div>

            <div className='flex items-center gap-2 ml-auto'>
              {node.type === "right" && node.rightId && pendingChange && (
                <Badge
                  variant='outline'
                  className={cn(
                    "text-xs",
                    pendingChange.type === "add" &&
                      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400",
                    pendingChange.type === "update" &&
                      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
                    pendingChange.type === "delete" &&
                      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                  )}
                >
                  {pendingChange.type === "add" && "To Add"}
                  {pendingChange.type === "update" && "Modified"}
                  {pendingChange.type === "delete" && "To Remove"}
                </Badge>
              )}

              {node.count !== undefined && (
                <Badge variant='secondary' className='text-xs font-semibold'>
                  {node.count}
                </Badge>
              )}

              {node.type === "right" && node.rightId && node.isSelected && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10'
                  onClick={() => togglePermissions(node.rightId!)}
                  title='Configure permissions'
                >
                  <Key className='h-3.5 w-3.5 text-primary' />
                </Button>
              )}
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && node.children && (
          <div className='ml-8 border-l-2 border-muted/30 pl-4 mt-1'>
            {node.children.map((child) => {
              if (child.type === "right" && child.rightId) {
                return (
                  <div key={child.id} className='space-y-1 mb-1'>
                    {renderTreeNode(child, depth + 1)}
                    {renderPermissionToggles(child.rightId, child)}
                  </div>
                );
              }
              return renderTreeNode(child, depth + 1);
            })}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (rights.length > 0 && initialDataLoaded) {
      buildTreeData();
    }
  }, [
    rights,
    assignedRights,
    pendingChanges,
    searchTerm,
    selectedModule,
    expandedNodes,
    initialDataLoaded,
  ]);

  useEffect(() => {
    fetchRights();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchAssignedRights();
    } else {
      setAssignedRights(new Map());
      setPendingChanges(new Map());
    }
  }, [selectedRole]);

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
            <Shield className='h-8 w-8 text-primary' />
            Roles & Permissions
          </h1>
          <p className='text-muted-foreground mt-2'>
            Manage role-based access control by assigning permissions to roles
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              fetchRights();
              fetchRoles();
              if (selectedRole) fetchAssignedRights();
            }}
            disabled={isLoading || loadingRoles}
            className='gap-2'
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (isLoading || loadingRoles) && "animate-spin"
              )}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Role Selection */}
      <Card className='shadow-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-primary' />
            Select Role
          </CardTitle>
          <CardDescription>
            Choose a role to manage its permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
            <div className='flex-1'>
              <Select
                value={selectedRole?.roleName?.toString() || ""}
                onValueChange={(value) => {
                  const role = roles.find((r) => r.roleId.toString() === value);
                  setSelectedRole(role || null);
                }}
                disabled={loadingRoles}
              >
                <SelectTrigger className='w-full sm:w-[350px]'>
                  <SelectValue
                    placeholder={
                      loadingRoles ? "Loading roles..." : "Select a role"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.roleId}
                      value={role.roleId.toString()}
                    >
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{role.roleName}</span>
                        {role.isSystemRole && (
                          <Badge variant='outline' className='ml-2 text-xs'>
                            System
                          </Badge>
                        )}
                        {!role.isActive && (
                          <Badge variant='secondary' className='ml-2 text-xs'>
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole && (
              <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap'>
                <div className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border'>
                  <Badge
                    variant={selectedRole.isActive ? "default" : "secondary"}
                    className='font-semibold'
                  >
                    {selectedRole.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {selectedRole.isSystemRole && (
                    <Badge variant='outline' className='font-semibold'>
                      System Role
                    </Badge>
                  )}
                  <span className='text-sm font-medium'>
                    {assignedRights.size} rights
                  </span>
                  {pendingChanges.size > 0 && (
                    <Badge
                      variant='outline'
                      className='bg-blue-50 text-blue-700 border-blue-300 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                    >
                      {pendingChanges.size} pending
                    </Badge>
                  )}
                </div>

                {pendingChanges.size > 0 && (
                  <Button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className='gap-2 shadow-md'
                    size='sm'
                  >
                    <Save className='h-4 w-4' />
                    Save {pendingChanges.size} Change
                    {pendingChanges.size !== 1 ? "s" : ""}
                    {isSaving && (
                      <div className='ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedRole && (
        <Card className='border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                  Please select a role to begin managing permissions
                </p>
                <p className='text-xs text-blue-700 dark:text-blue-300 mt-1'>
                  Choose a role from the dropdown above to view and modify its
                  assigned rights and permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedRole && (
        <>
          {/* Filters Header */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 flex-wrap'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowFilters(!showFilters)}
                className='gap-2'
              >
                {showFilters ? (
                  <>
                    <EyeOff className='h-4 w-4' />
                    Hide Filters
                  </>
                ) : (
                  <>
                    <Eye className='h-4 w-4' />
                    Show Filters
                  </>
                )}
              </Button>
              {showFilters && (
                <>
                  <Button variant='outline' size='sm' onClick={expandAll}>
                    Expand All
                  </Button>
                  <Button variant='outline' size='sm' onClick={collapseAll}>
                    Collapse All
                  </Button>
                  <Button variant='outline' size='sm' onClick={resetFilters}>
                    Clear Filters
                  </Button>
                </>
              )}
            </div>

            {pendingChanges.size > 0 && (
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setPendingChanges(new Map());
                  }}
                  className='gap-2'
                >
                  <X className='h-4 w-4' />
                  Discard
                </Button>
                <Button
                  size='sm'
                  onClick={saveChanges}
                  disabled={isSaving}
                  className='gap-2'
                >
                  <Save className='h-4 w-4' />
                  Save
                  {isSaving && (
                    <div className='ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Filters Card */}
          {showFilters && (
            <Card className='shadow-md'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Filter className='h-5 w-5 text-primary' />
                  Filters
                </CardTitle>
                <CardDescription>
                  Filter permissions by module or search term
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col sm:flex-row gap-4'>
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search permissions by name, description, or category...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>

                  <Select
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                  >
                    <SelectTrigger className='w-full sm:w-[200px]'>
                      <SelectValue placeholder='Module' />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module === "all" ? "All Modules" : module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tree View */}
          <Card className='shadow-md'>
            <CardHeader>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    Permissions Tree View
                    {isLoading && (
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Managing permissions for:{" "}
                    <span className='font-semibold text-foreground'>
                      {selectedRole.roleName}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex justify-center py-12'>
                  <AppLoader />
                </div>
              ) : treeData.length === 0 ? (
                <div className='text-center py-12'>
                  <Search className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                  <h3 className='text-lg font-medium'>No Permissions Found</h3>
                  <p className='text-muted-foreground mt-2'>
                    Try adjusting your search or filters
                  </p>
                  <Button
                    variant='outline'
                    onClick={resetFilters}
                    className='mt-4'
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <ScrollArea className='h-[600px] pr-4'>
                  <div className='space-y-2'>
                    {treeData.map((node) => renderTreeNode(node))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Pending Changes Summary */}
          {pendingChanges.size > 0 && (
            <Card className='border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 shadow-lg'>
              <CardHeader>
                <CardTitle className='text-blue-700 dark:text-blue-300 flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5' />
                  Pending Changes Summary
                </CardTitle>
                <CardDescription>
                  Review changes for{" "}
                  <span className='font-semibold'>{selectedRole.roleName}</span>{" "}
                  before saving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                    <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm'>
                      <div className='flex items-center gap-2'>
                        <div className='p-2 rounded-full bg-green-100 dark:bg-green-900/40'>
                          <Plus className='h-4 w-4 text-green-600 dark:text-green-400' />
                        </div>
                        <div>
                          <div className='text-xs text-green-600 dark:text-green-400 font-medium'>
                            TO ADD
                          </div>
                          <div className='text-2xl font-bold text-green-700 dark:text-green-300'>
                            {
                              Array.from(pendingChanges.values()).filter(
                                (c) => c.type === "add"
                              ).length
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm'>
                      <div className='flex items-center gap-2'>
                        <div className='p-2 rounded-full bg-blue-100 dark:bg-blue-900/40'>
                          <Edit className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                        </div>
                        <div>
                          <div className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
                            TO UPDATE
                          </div>
                          <div className='text-2xl font-bold text-blue-700 dark:text-blue-300'>
                            {
                              Array.from(pendingChanges.values()).filter(
                                (c) => c.type === "update"
                              ).length
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800 shadow-sm'>
                      <div className='flex items-center gap-2'>
                        <div className='p-2 rounded-full bg-red-100 dark:bg-red-900/40'>
                          <Trash2 className='h-4 w-4 text-red-600 dark:text-red-400' />
                        </div>
                        <div>
                          <div className='text-xs text-red-600 dark:text-red-400 font-medium'>
                            TO REMOVE
                          </div>
                          <div className='text-2xl font-bold text-red-700 dark:text-red-300'>
                            {
                              Array.from(pendingChanges.values()).filter(
                                (c) => c.type === "delete"
                              ).length
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='text-sm text-muted-foreground bg-white/70 dark:bg-background/50 p-4 rounded-lg border'>
                    <p className='font-semibold mb-2 text-foreground'>
                      Quick Guide:
                    </p>
                    <ul className='space-y-1.5'>
                      <li className='flex items-start gap-2'>
                        <Check className='h-4 w-4 mt-0.5 text-primary' />
                        <span>
                          Changes will be applied when you click{" "}
                          <strong>Save Changes</strong>
                        </span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <Check className='h-4 w-4 mt-0.5 text-primary' />
                        <span>
                          Use <strong>Show Permissions</strong> to configure
                          Insert, Update, Delete, View, and Print access
                        </span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <Check className='h-4 w-4 mt-0.5 text-primary' />
                        <span>
                          Module checkboxes select/deselect all rights within
                          that module
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className='flex gap-3 pt-2'>
                    <Button
                      variant='outline'
                      onClick={() => setPendingChanges(new Map())}
                      className='flex-1 gap-2'
                    >
                      <X className='h-4 w-4' />
                      Discard All Changes
                    </Button>
                    <Button
                      onClick={saveChanges}
                      disabled={isSaving}
                      className='flex-1 gap-2'
                    >
                      <Save className='h-4 w-4' />
                      Save {pendingChanges.size} Change
                      {pendingChanges.size !== 1 ? "s" : ""}
                      {isSaving && (
                        <div className='ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
