"use client";

import { useState, useEffect } from "react";
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
  Check,
  X,
  Eye,
  EyeOff,
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

type TreeNode = {
  id: string;
  label: string;
  type: "module" | "right";
  children?: TreeNode[];
  rightId?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  count?: number;
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
  const [assignedRights, setAssignedRights] = useState<Set<number>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Map<number, boolean>>(
    new Map()
  );
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);

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

      // Extract unique modules
      const uniqueModules = Array.from(
        new Set(data.map((right: Right) => right.module).filter(Boolean))
      ) as string[];
      setModules(["all", ...uniqueModules]);

      buildTreeData(data);
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
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
      }
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

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://188.245.83.20:9001/api/";
      const response = await fetch(`${baseUrl}Role/GetAllRights`);
      if (!response.ok) throw new Error("Failed to fetch role rights");
      const allRights = await response.json();

      // Extract assigned rights for this role
      const assignedSet = new Set<number>();
      allRights.forEach((right: Right) => {
        if (
          right.roleRights &&
          right.roleRights.some((rr) => rr.roleId === selectedRole.roleId)
        ) {
          assignedSet.add(right.rightId);
        }
      });

      setAssignedRights(assignedSet);
      setPendingChanges(new Map());
      updateTreeSelection(assignedSet);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assigned rights",
      });
    }
  };

  // Build tree data from rights (only module level)
  const buildTreeData = (rightsData: Right[]) => {
    const moduleMap = new Map<string, Right[]>();

    // Group by module only
    rightsData.forEach((right) => {
      if (!moduleMap.has(right.module)) {
        moduleMap.set(right.module, []);
      }
      moduleMap.get(right.module)!.push(right);
    });

    const treeNodes: TreeNode[] = [];

    // Create module nodes with direct rights as children
    Array.from(moduleMap.entries()).forEach(([moduleName, moduleRights]) => {
      const moduleNode: TreeNode = {
        id: `module-${moduleName}`,
        label: moduleName,
        type: "module",
        isExpanded: expandedNodes.has(`module-${moduleName}`),
        children: [],
        count: moduleRights.length,
      };

      // Create right nodes directly under module
      moduleRights.forEach((right) => {
        const rightNode: TreeNode = {
          id: `right-${right.rightId}`,
          label: `${right.displayName} (${right.category})`,
          type: "right",
          rightId: right.rightId,
          isSelected: false,
        };
        moduleNode.children!.push(rightNode);
      });

      treeNodes.push(moduleNode);
    });

    setTreeData(treeNodes);
  };

  // Update tree selection based on assigned rights
  const updateTreeSelection = (assignedSet: Set<number>) => {
    const updateNodeSelection = (node: TreeNode): TreeNode => {
      if (node.type === "right") {
        const isAssigned = assignedSet.has(node.rightId!);
        const isPending = pendingChanges.has(node.rightId!);
        const pendingValue = pendingChanges.get(node.rightId!);

        return {
          ...node,
          isSelected: isPending ? pendingValue! : isAssigned,
          isIndeterminate: false,
        };
      }

      if (node.children) {
        const updatedChildren = node.children.map(updateNodeSelection);
        const selectedChildren = updatedChildren.filter(
          (child) => child.isSelected
        );
        const indeterminateChildren = updatedChildren.filter(
          (child) => child.isIndeterminate
        );

        return {
          ...node,
          children: updatedChildren,
          isSelected: selectedChildren.length === updatedChildren.length,
          isIndeterminate:
            (selectedChildren.length > 0 &&
              selectedChildren.length < updatedChildren.length) ||
            indeterminateChildren.length > 0,
        };
      }

      return node;
    };

    setTreeData((prev) => prev.map(updateNodeSelection));
  };

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

  // Handle checkbox change
  const handleCheckboxChange = (node: TreeNode) => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a role first",
      });
      return;
    }

    if (node.type === "right") {
      const currentlyAssigned = assignedRights.has(node.rightId!);
      const pendingValue = pendingChanges.get(node.rightId!);
      const newValue =
        pendingValue === undefined ? !currentlyAssigned : !pendingValue;

      const newPendingChanges = new Map(pendingChanges);
      if (newValue === currentlyAssigned) {
        newPendingChanges.delete(node.rightId!);
      } else {
        newPendingChanges.set(node.rightId!, newValue);
      }
      setPendingChanges(newPendingChanges);
      updateTreeSelection(assignedRights);
    } else {
      // For module, select/deselect all children
      const getAllRightIds = (node: TreeNode): number[] => {
        if (node.type === "right" && node.rightId) {
          return [node.rightId];
        }
        if (node.children) {
          return node.children.flatMap(getAllRightIds);
        }
        return [];
      };

      const rightIds = getAllRightIds(node);
      const allAssigned = rightIds.every((id) => assignedRights.has(id));
      const newPendingChanges = new Map(pendingChanges);

      rightIds.forEach((rightId) => {
        if (allAssigned) {
          // Deselect all
          newPendingChanges.set(rightId, false);
        } else {
          // Select all
          newPendingChanges.set(rightId, true);
        }
      });

      setPendingChanges(newPendingChanges);
      updateTreeSelection(assignedRights);
    }
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

    setIsSaving(true);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://188.245.83.20:9001/api/";
    const errors: string[] = [];

    // Process each pending change
    for (const [rightId, shouldAssign] of pendingChanges) {
      try {
        const endpoint = shouldAssign
          ? "addRightToRole"
          : "deleteRightFromRole";
        const url = `${baseUrl}Role/${endpoint}?roleId=${selectedRole.roleId}&rightId=${rightId}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const right = rights.find((r) => r.rightId === rightId);
          errors.push(
            `Failed to ${shouldAssign ? "assign" : "remove"} "${
              right?.displayName || rightId
            }"`
          );
        }
      } catch (error) {
        errors.push(`Error processing right ${rightId}`);
      }
    }

    setIsSaving(false);

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Partial Success",
        description: `${errors.length} operation(s) failed. ${errors.join(
          ", "
        )}`,
      });
    } else if (pendingChanges.size > 0) {
      toast({
        title: "Success",
        description: `All changes saved successfully for ${selectedRole.roleName}`,
      });
      // Refresh assigned rights
      fetchAssignedRights();
    } else {
      toast({
        title: "Info",
        description: "No changes to save",
      });
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = rights;

    if (searchTerm) {
      filtered = filtered.filter(
        (right) =>
          right.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          right.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          right.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
          right.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedModule !== "all") {
      filtered = filtered.filter((right) => right.module === selectedModule);
    }

    buildTreeData(filtered);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedModule("all");
    buildTreeData(rights);
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

  // Render tree node
  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-md transition-colors",
            depth === 0 ? "font-semibold" : "",
            depth === 1 ? "ml-4" : ""
          )}
        >
          {hasChildren && (
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6 p-0'
              onClick={() => toggleNode(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              )}
            </Button>
          )}
          {!hasChildren && <div className='w-6' />}

          <Checkbox
            checked={node.isSelected}
            onCheckedChange={() => handleCheckboxChange(node)}
            className={cn(
              node.type === "module" ? "h-5 w-5" : "",
              node.type === "right" ? "h-4 w-4" : ""
            )}
            ref={(el) => {
              if (el && node.isIndeterminate) {
                (el as HTMLInputElement).indeterminate = true;
              }
            }}
          />

          <div className='flex-1 flex items-center gap-2'>
            <span className='text-sm'>{node.label}</span>
            {node.count !== undefined && (
              <Badge variant='secondary' className='ml-auto'>
                {node.count}
              </Badge>
            )}
            {node.type === "right" &&
              node.rightId &&
              pendingChanges.has(node.rightId) && (
                <Badge variant='outline' className='ml-auto'>
                  Pending
                </Badge>
              )}
          </div>
        </div>

        {isExpanded && hasChildren && node.children && (
          <div className='ml-6'>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchRights();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchAssignedRights();
    }
  }, [selectedRole]);

  useEffect(() => {
    applyFilters();
  }, [rights, searchTerm, selectedModule]);

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
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
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isLoading || loadingRoles ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
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
                value={selectedRole?.roleName.toString() || ""}
                onValueChange={(value) => {
                  const role = roles.find((r) => r.roleId.toString() === value);
                  setSelectedRole(role || null);
                }}
                disabled={loadingRoles}
              >
                <SelectTrigger className='w-full sm:w-[300px]'>
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
                        <span>{role.roleName}</span>
                        {role.isSystemRole && (
                          <Badge variant='outline' className='ml-2'>
                            System
                          </Badge>
                        )}
                        {!role.isActive && (
                          <Badge variant='secondary' className='ml-2'>
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
              <div className='flex flex-col sm:flex-row gap-3'>
                <div className='flex items-center gap-2 px-3 py-2 bg-muted rounded-md'>
                  <Badge
                    variant={selectedRole.isActive ? "default" : "secondary"}
                  >
                    {selectedRole.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {selectedRole.isSystemRole && (
                    <Badge variant='outline'>System Role</Badge>
                  )}
                  <span className='text-sm text-muted-foreground'>
                    {assignedRights.size} rights assigned
                  </span>
                </div>

                {pendingChanges.size > 0 && (
                  <Button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className='gap-2'
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

      {/* Filters Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
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

        {selectedRole && pendingChanges.size > 0 && showFilters && (
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPendingChanges(new Map())}
            >
              <X className='h-4 w-4 mr-2' />
              Discard Changes
            </Button>
            <Button
              size='sm'
              onClick={saveChanges}
              disabled={isSaving}
              className='gap-2'
            >
              <Save className='h-4 w-4' />
              Save Changes
              {isSaving && (
                <div className='ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Filters Card - Conditionally Rendered */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Filter className='h-5 w-5' />
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

              <Select value={selectedModule} onValueChange={setSelectedModule}>
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

              <div className='flex gap-2'>
                <Button variant='outline' onClick={resetFilters}>
                  Clear
                </Button>
                <Button variant='outline' onClick={expandAll}>
                  Expand All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tree View */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div>
              <CardTitle>Permissions Tree View</CardTitle>
              <CardDescription>
                {selectedRole
                  ? `Managing permissions for: ${selectedRole.roleName}`
                  : "Select a role to manage permissions"}
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant={selectedRole?.isActive ? "default" : "secondary"}>
                {selectedRole?.isActive ? "Role Active" : "Role Inactive"}
              </Badge>
              {selectedRole?.isSystemRole && (
                <Badge variant='outline'>System Role</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedRole ? (
            <div className='text-center py-12'>
              <Shield className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-lg font-medium'>No Role Selected</h3>
              <p className='text-muted-foreground mt-2'>
                Please select a role from the dropdown above to manage
                permissions
              </p>
            </div>
          ) : isLoading ? (
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
              <Button variant='outline' onClick={resetFilters} className='mt-4'>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <ScrollArea className='h-[600px] pr-4'>
              <div className='space-y-1'>
                {treeData.map((node) => renderTreeNode(node))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pending Changes Summary */}
      {selectedRole && pendingChanges.size > 0 && (
        <Card className='border-blue-300 bg-blue-50 dark:bg-blue-900/20'>
          <CardHeader>
            <CardTitle className='text-blue-700 dark:text-blue-300'>
              Pending Changes Summary
            </CardTitle>
            <CardDescription>
              {pendingChanges.size} permission(s) will be updated for{" "}
              {selectedRole.roleName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                <div className='bg-green-50 dark:bg-green-900/20 p-3 rounded-md'>
                  <div className='flex items-center gap-2'>
                    <Check className='h-4 w-4 text-green-600' />
                    <span className='font-medium text-green-700 dark:text-green-300'>
                      To be assigned:{" "}
                      {
                        Array.from(pendingChanges.values()).filter(Boolean)
                          .length
                      }
                    </span>
                  </div>
                </div>
                <div className='bg-red-50 dark:bg-red-900/20 p-3 rounded-md'>
                  <div className='flex items-center gap-2'>
                    <X className='h-4 w-4 text-red-600' />
                    <span className='font-medium text-red-700 dark:text-red-300'>
                      To be removed:{" "}
                      {
                        Array.from(pendingChanges.values()).filter((v) => !v)
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div className='text-sm text-muted-foreground'>
                <p>Note: Changes will be applied when you click Save Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
