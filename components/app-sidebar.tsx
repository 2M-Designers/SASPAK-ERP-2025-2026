"use client";

import {
  ChevronDown,
  FolderOpen,
  Folder,
  LayoutDashboard,
  Users,
  Cog,
  Settings,
  Package,
  Ship,
  Plane,
  Truck,
  MapPin,
  Calendar,
  BarChart3,
  FileText,
  DollarSign,
  Building2,
  User,
  Briefcase,
  Network,
  Shield,
  Database,
  RefreshCw,
  AlertCircle,
  Calculator,
  Banknote,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileSearch,
  Globe,
  Landmark,
  List,
  PieChart,
  Receipt,
  Scale,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface User {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  companyId: number;
  branchId: number;
  departmentId: number;
  companyName: string | null;
  branchName: string | null;
  departmentName: string | null;
}

interface MenuRight {
  rightId: number;
  rightCode: string;
  tableName: string;
  displayName: string;
  category: string;
  module: string;
  description: string;
}

interface ProcessedMenu {
  menuID: number;
  name: string;
  title: string;
  menuLink: string | null;
  parentID: number | null;
  subMenus?: ProcessedMenu[];
}

// Enhanced icon mapping for different menu types based on your API response
const getMenuIcon = (displayName: string, isOpen: boolean) => {
  const name = displayName.toLowerCase();

  // Accounting & Finance
  if (name.includes("accounting") || name.includes("period")) return Calendar;
  if (name.includes("fiscal") || name.includes("year")) return Calendar;
  if (name.includes("voucher")) return Receipt;
  if (name.includes("opening") || name.includes("balance")) return Calculator;
  if (name.includes("chart") || name.includes("account")) return PieChart;
  if (name.includes("currency") || name.includes("exchange")) return DollarSign;
  if (name.includes("cost") || name.includes("center")) return DollarSign;

  // HR & Employee Management
  if (name.includes("employee")) return User;
  if (name.includes("department")) return Briefcase;
  if (name.includes("salary") || name.includes("pay")) return Banknote;
  if (name.includes("leave")) return ClipboardList;
  if (name.includes("designation")) return User;
  if (name.includes("attendance")) return Calendar;
  if (name.includes("holiday")) return Calendar;

  // Company & Setup
  if (name.includes("company")) return Building2;
  if (name.includes("branch")) return MapPin;
  if (name.includes("charge")) return CreditCard;
  if (name.includes("party")) return Users;

  // System & Admin
  if (name.includes("system") || name.includes("admin")) return Shield;
  if (name.includes("setting")) return Settings;
  if (name.includes("right") || name.includes("role")) return Shield;
  if (name.includes("user")) return Users;
  if (name.includes("audit") || name.includes("log")) return FileSearch;
  if (name.includes("error")) return AlertCircle;

  // Logistics & Operations
  if (name.includes("awb") || name.includes("air")) return Plane;
  if (name.includes("bl") || name.includes("sea")) return Ship;
  if (name.includes("job") || name.includes("inquiry")) return FileText;
  if (name.includes("container")) return Truck;
  if (name.includes("port") || name.includes("location")) return MapPin;
  if (name.includes("hs code") || name.includes("hscode")) return BookOpen;

  // Purchase & Orders
  if (name.includes("purchase") || name.includes("order")) return FileText;

  // Default icons
  if (name.includes("dashboard")) return LayoutDashboard;
  if (name.includes("report") || name.includes("analytics")) return BarChart3;
  if (name.includes("list") || name.includes("master")) return List;

  // Default icons for folders
  return isOpen ? FolderOpen : Folder;
};

export function AppSidebar() {
  const [menus, setMenus] = useState<ProcessedMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  const API_BASE_URL = "http://188.245.83.20:9001/api";

  // Get user data and token from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        if (typeof window !== "undefined") {
          const userData = localStorage.getItem("user");
          console.log("User data from localStorage:", userData);

          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          } else {
            console.warn("No user data found in localStorage");
          }
        }
      } catch (err) {
        console.error("Failed to parse user data from localStorage:", err);
      }
    };

    loadUserData();
  }, []);

  // Function to convert rights data to menu structure
  const convertRightsToMenus = (rights: MenuRight[]): ProcessedMenu[] => {
    if (!rights || rights.length === 0) {
      return [];
    }

    console.log("Converting rights to menus:", rights);

    // Group by module first
    const modules = [
      ...new Set(rights.map((right) => right.module || "General")),
    ];

    const menuStructure: ProcessedMenu[] = [];

    modules.forEach((module, moduleIndex) => {
      const moduleRights = rights.filter(
        (right) => (right.module || "General") === module
      );

      // Group module rights by category
      const categories = [
        ...new Set(moduleRights.map((right) => right.category || "General")),
      ];

      console.log(`Module: ${module}, Categories:`, categories);

      // If only one category and it's empty or "General", create flat structure
      if (
        categories.length === 1 &&
        (categories[0] === "" || categories[0] === "General")
      ) {
        const menuItems = moduleRights.map((right, index) => ({
          menuID: right.rightId,
          name: right.displayName,
          title: right.displayName,
          menuLink:
            right.description && right.description !== ""
              ? right.description.startsWith("/")
                ? `/portal${right.description}`
                : `/portal/${right.description}`
              : null,
          parentID: null,
        }));

        // If there are multiple items, create a parent menu for the module
        if (menuItems.length > 1) {
          const parentMenu: ProcessedMenu = {
            menuID: 1000 + moduleIndex,
            name: module,
            title: module,
            menuLink: null,
            parentID: null,
            subMenus: menuItems,
          };
          menuStructure.push(parentMenu);
        } else {
          // If only one item, add it directly
          menuStructure.push(...menuItems);
        }
      } else {
        // Multiple categories - create hierarchical structure
        const parentMenu: ProcessedMenu = {
          menuID: 1000 + moduleIndex,
          name: module,
          title: module,
          menuLink: null,
          parentID: null,
          subMenus: [],
        };

        categories.forEach((category, categoryIndex) => {
          const categoryRights = moduleRights.filter(
            (right) => (right.category || "General") === category
          );

          if (categoryRights.length > 0) {
            // If category has multiple items or is not "General", create submenu
            if (categoryRights.length > 1 || category !== "General") {
              const categoryMenu: ProcessedMenu = {
                menuID: 2000 + moduleIndex * 100 + categoryIndex,
                name: category || "General",
                title: category || "General",
                menuLink: null,
                parentID: parentMenu.menuID,
                subMenus: categoryRights.map((right) => ({
                  menuID: right.rightId,
                  name: right.displayName,
                  title: right.displayName,
                  menuLink:
                    right.description && right.description !== ""
                      ? right.description.startsWith("/")
                        ? `/portal${right.description}`
                        : `/portal/${right.description}`
                      : null,
                  parentID: 2000 + moduleIndex * 100 + categoryIndex,
                })),
              };
              parentMenu.subMenus!.push(categoryMenu);
            } else {
              // Single item in category, add directly to parent
              const right = categoryRights[0];
              parentMenu.subMenus!.push({
                menuID: right.rightId,
                name: right.displayName,
                title: right.displayName,
                menuLink:
                  right.description && right.description !== ""
                    ? right.description.startsWith("/")
                      ? `/portal${right.description}`
                      : `/portal/${right.description}`
                    : null,
                parentID: parentMenu.menuID,
              });
            }
          }
        });

        // Only add parent menu if it has submenus
        if (parentMenu.subMenus!.length > 0) {
          menuStructure.push(parentMenu);
        }
      }
    });

    console.log("Final converted menu structure:", menuStructure);
    return menuStructure;
  };

  // Function to fetch menus from API
  const fetchMenus = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      console.log("Fetching menus from API...");

      const response = await fetch(`${API_BASE_URL}/Authentication/GetMenus`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Menus API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch menus:", response.status, errorText);

        if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else if (response.status === 403) {
          throw new Error("Access denied. Insufficient permissions.");
        } else {
          throw new Error(`Failed to load menus: ${response.status}`);
        }
      }

      const rightsData: MenuRight[] = await response.json();
      console.log("Rights data from API:", rightsData);

      if (!Array.isArray(rightsData)) {
        throw new Error("Invalid rights data format received from API");
      }

      if (rightsData.length === 0) {
        throw new Error("No menu rights available for this user");
      }

      // Convert rights data to menu structure
      const menuStructure = convertRightsToMenus(rightsData);

      if (menuStructure.length === 0) {
        throw new Error("No valid menus could be generated from user rights");
      }

      // Update state and localStorage
      setMenus(menuStructure);
      localStorage.setItem("menus", JSON.stringify(menuStructure));

      // Auto-expand first menu for better UX
      const autoExpand = new Set<string>();
      if (menuStructure.length > 0) {
        autoExpand.add(`menu-${menuStructure[0].menuID}`);
      }
      setExpandedItems(autoExpand);
    } catch (err) {
      console.error("Error fetching menus:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load menus";
      setError(errorMessage);

      // Fallback to localStorage menus if available
      try {
        const storedMenus = localStorage.getItem("menus");
        if (storedMenus) {
          const parsedMenus = JSON.parse(storedMenus);
          if (Array.isArray(parsedMenus) && parsedMenus.length > 0) {
            setMenus(parsedMenus);
            setError("Using cached menus (" + errorMessage + ")");
            return;
          }
        }
      } catch (parseError) {
        console.error("Error parsing stored menus:", parseError);
      }

      // No fallback menus available
      setMenus([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load menus on component mount
  useEffect(() => {
    // Try to load from localStorage first for faster rendering
    const loadFromLocalStorage = () => {
      try {
        const storedMenus = localStorage.getItem("menus");
        if (storedMenus) {
          const parsedMenus = JSON.parse(storedMenus);
          if (Array.isArray(parsedMenus) && parsedMenus.length > 0) {
            setMenus(parsedMenus);
            setIsLoading(false);
            console.log("Loaded menus from localStorage:", parsedMenus);
            return true;
          }
        }
      } catch (error) {
        console.error("Error loading menus from localStorage:", error);
      }
      return false;
    };

    if (!loadFromLocalStorage()) {
      fetchMenus();
    }
  }, []);

  // Load language preference
  useEffect(() => {
    const loadLanguage = () => {
      try {
        const savedLang = localStorage.getItem("lang");
        if (savedLang && i18n.language !== savedLang) {
          i18n.changeLanguage(savedLang);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      }
    };

    loadLanguage();
  }, [i18n]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleRefreshMenus = () => {
    fetchMenus(true);
  };

  // Filter out menus that don't have proper structure
  const validMenus = menus.filter(
    (menu) =>
      menu && typeof menu.menuID === "number" && typeof menu.name === "string"
  );

  // Render menu items recursively
  const renderMenuItems = (menuItems: ProcessedMenu[], level = 0) => {
    return menuItems.map((item) => {
      const isOpen = expandedItems.has(`menu-${item.menuID}`);
      const IconComponent = getMenuIcon(item.name, isOpen);
      const hasSubMenus = item.subMenus && item.subMenus.length > 0;
      const isLinkable = !!item.menuLink && !hasSubMenus;

      const paddingLeft = level * 12 + 12; // Base padding + level-based indentation

      // If it's a linkable item without submenus, render as link
      if (isLinkable) {
        return (
          <div
            key={item.menuID}
            className='border-b border-white/10 pb-2 last:border-b-0'
          >
            <Link
              href={item.menuLink as string}
              className='w-full flex items-center px-3 py-2.5 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group border border-transparent hover:border-white/20'
              style={{ paddingLeft: `${paddingLeft}px` }}
            >
              <div className='flex items-center gap-2'>
                <IconComponent size={18} className='text-white' />
                <span className='font-semibold text-sm'>
                  {item.title || item.name}
                </span>
              </div>
            </Link>
          </div>
        );
      }

      // If it has submenus, render as collapsible
      return (
        <div
          key={item.menuID}
          className='border-b border-white/10 pb-2 last:border-b-0'
        >
          <Collapsible
            open={isOpen}
            onOpenChange={() => toggleExpanded(`menu-${item.menuID}`)}
          >
            <CollapsibleTrigger asChild>
              <button
                className='w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group border border-transparent hover:border-white/20'
                style={{ paddingLeft: `${paddingLeft}px` }}
              >
                <div className='flex items-center gap-2'>
                  <IconComponent size={18} className='text-white' />
                  <span className='font-semibold text-sm'>
                    {item.title || item.name}
                  </span>
                </div>
                {hasSubMenus && (
                  <ChevronDown
                    size={16}
                    className={`text-white/70 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            </CollapsibleTrigger>

            {/* Submenu Items */}
            {hasSubMenus && (
              <CollapsibleContent className='mt-1'>
                <div className='space-y-0.5'>
                  {renderMenuItems(item.subMenus!, level + 1)}
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>
        </div>
      );
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Sidebar className='w-64 bg-gradient-to-b from-[#0B4F6C] to-[#1A94D4] border-r border-white/20 shadow-2xl'>
        <SidebarHeader className='h-20 bg-white/10 backdrop-blur-md border-b border-white/20 flex items-center justify-center'>
          <div className='w-full h-full flex items-center justify-center p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30'>
                <Package className='w-8 h-8 text-white' />
              </div>
              <div className='text-white'>
                <h2 className='text-lg font-bold leading-tight'>SASPAK</h2>
                <p className='text-xs text-white/80 leading-tight'>CARGO</p>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className='bg-transparent px-4 py-6 flex flex-col items-center justify-center'>
          <RefreshCw className='w-6 h-6 text-white/70 animate-spin mb-2' />
          <div className='text-white/70 text-sm'>Loading menus...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className='w-64 bg-gradient-to-b from-[#0B4F6C] to-[#1A94D4] border-r border-white/20 shadow-2xl backdrop-blur-sm'>
      {/* Header */}
      <SidebarHeader className='h-20 bg-white/10 backdrop-blur-md border-b border-white/20 flex items-center justify-center'>
        <Link
          href='/portal'
          className='w-full h-full flex items-center justify-center hover:bg-white/5 transition-all duration-300 p-4'
        >
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30'>
              <Package className='w-8 h-8 text-white' />
            </div>
            <div className='text-white'>
              <h2 className='text-lg font-bold leading-tight'>SASPAK</h2>
              <p className='text-xs text-white/80 leading-tight'>CARGO</p>
              {user && (
                <p className='text-xs text-white/60 mt-1 truncate max-w-[120px]'>
                  {user.fullName || user.username}
                </p>
              )}
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className='bg-transparent px-3 py-4'>
        {/* Error Message */}
        {error && (
          <div className='mb-4 mx-2 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-200 text-xs'>
            <div className='flex items-center gap-2 mb-1'>
              <AlertCircle size={14} />
              <span className='font-semibold'>Notice</span>
            </div>
            <p className='mb-2'>{error}</p>
            <button
              onClick={handleRefreshMenus}
              disabled={isRefreshing}
              className='w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-yellow-500/30 hover:bg-yellow-500/40 rounded-lg text-yellow-100 text-xs transition-all disabled:opacity-50'
            >
              <RefreshCw
                size={12}
                className={isRefreshing ? "animate-spin" : ""}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Menus"}
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <div className='mb-4 mx-2'>
          <button
            onClick={handleRefreshMenus}
            disabled={isRefreshing}
            className='w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white text-sm transition-all disabled:opacity-50 border border-white/20'
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Menus"}
          </button>
        </div>

        <div className='space-y-1'>
          {validMenus.length > 0 ? (
            renderMenuItems(validMenus)
          ) : (
            <div className='text-center text-white/60 py-8 text-sm bg-white/10 rounded-xl mx-2'>
              <AlertCircle className='w-8 h-8 text-white/40 mx-auto mb-2' />
              <p className='mb-2'>No menus available</p>
              <p className='text-xs text-white/40 mb-4'>
                Please check your permissions or contact administrator
              </p>
              <button
                onClick={handleRefreshMenus}
                disabled={isRefreshing}
                className='px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs transition-all disabled:opacity-50'
              >
                {isRefreshing ? "Refreshing..." : "Try Again"}
              </button>
            </div>
          )}
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className='h-16 bg-white/10 backdrop-blur-md border-t border-white/20 flex items-center justify-center'>
        <div className='flex items-center justify-center p-4'>
          <div className='text-center'>
            <p className='text-xs text-white/60 mb-1'>Powered by</p>
            <p className='text-sm font-semibold text-white'>NJ IT Solutions</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
