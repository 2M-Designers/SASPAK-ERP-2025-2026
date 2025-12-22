"use client";

import {
  ChevronDown,
  ChevronRight,
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
  Search,
  X,
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
import { useEffect, useState, useMemo } from "react";
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

// Enhanced icon mapping
const getMenuIcon = (displayName: string, isOpen: boolean) => {
  const name = displayName.toLowerCase();

  if (name.includes("accounting") || name.includes("period")) return Calendar;
  if (name.includes("fiscal") || name.includes("year")) return Calendar;
  if (name.includes("voucher")) return Receipt;
  if (name.includes("opening") || name.includes("balance")) return Calculator;
  if (name.includes("chart") || name.includes("account")) return PieChart;
  if (name.includes("currency") || name.includes("exchange")) return DollarSign;
  if (name.includes("cost") || name.includes("center")) return DollarSign;
  if (name.includes("employee")) return User;
  if (name.includes("department")) return Briefcase;
  if (name.includes("salary") || name.includes("pay")) return Banknote;
  if (name.includes("leave")) return ClipboardList;
  if (name.includes("designation")) return User;
  if (name.includes("attendance")) return Calendar;
  if (name.includes("holiday")) return Calendar;
  if (name.includes("company")) return Building2;
  if (name.includes("branch")) return MapPin;
  if (name.includes("charge")) return CreditCard;
  if (name.includes("party")) return Users;
  if (name.includes("system") || name.includes("admin")) return Shield;
  if (name.includes("setting")) return Settings;
  if (name.includes("right") || name.includes("role")) return Shield;
  if (name.includes("user")) return Users;
  if (name.includes("audit") || name.includes("log")) return FileSearch;
  if (name.includes("error")) return AlertCircle;
  if (name.includes("awb") || name.includes("air")) return Plane;
  if (name.includes("bl") || name.includes("sea")) return Ship;
  if (name.includes("job") || name.includes("inquiry")) return FileText;
  if (name.includes("container")) return Truck;
  if (name.includes("port") || name.includes("location")) return MapPin;
  if (name.includes("hs code") || name.includes("hscode")) return BookOpen;
  if (name.includes("purchase") || name.includes("order")) return FileText;
  if (name.includes("dashboard")) return LayoutDashboard;
  if (name.includes("report") || name.includes("analytics")) return BarChart3;
  if (name.includes("list") || name.includes("master")) return List;

  return isOpen ? FolderOpen : Folder;
};

export function AppSidebar() {
  const [menus, setMenus] = useState<ProcessedMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { t, i18n } = useTranslation();

  const API_BASE_URL = "http://188.245.83.20:9001/api";

  // Get user data and token from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        if (typeof window !== "undefined") {
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
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
    if (!rights || rights.length === 0) return [];

    const modules = [
      ...new Set(rights.map((right) => right.module || "General")),
    ];
    const menuStructure: ProcessedMenu[] = [];

    modules.forEach((module, moduleIndex) => {
      const moduleRights = rights.filter(
        (right) => (right.module || "General") === module
      );
      const categories = [
        ...new Set(moduleRights.map((right) => right.category || "General")),
      ];

      if (
        categories.length === 1 &&
        (categories[0] === "" || categories[0] === "General")
      ) {
        const menuItems = moduleRights.map((right) => ({
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
          menuStructure.push(...menuItems);
        }
      } else {
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

        if (parentMenu.subMenus!.length > 0) {
          menuStructure.push(parentMenu);
        }
      }
    });

    return menuStructure;
  };

  // Function to fetch menus from API
  const fetchMenus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/Authentication/GetMenus`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed");
        } else if (response.status === 403) {
          throw new Error("Access denied");
        } else {
          throw new Error(`Failed to load menus: ${response.status}`);
        }
      }

      const rightsData: MenuRight[] = await response.json();

      if (!Array.isArray(rightsData) || rightsData.length === 0) {
        throw new Error("No menu rights available");
      }

      const menuStructure = convertRightsToMenus(rightsData);
      setMenus(menuStructure);
      localStorage.setItem("menus", JSON.stringify(menuStructure));

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

      try {
        const storedMenus = localStorage.getItem("menus");
        if (storedMenus) {
          const parsedMenus = JSON.parse(storedMenus);
          if (Array.isArray(parsedMenus) && parsedMenus.length > 0) {
            setMenus(parsedMenus);
            return;
          }
        }
      } catch (parseError) {
        console.error("Error parsing stored menus:", parseError);
      }

      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load menus on component mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const storedMenus = localStorage.getItem("menus");
        if (storedMenus) {
          const parsedMenus = JSON.parse(storedMenus);
          if (Array.isArray(parsedMenus) && parsedMenus.length > 0) {
            setMenus(parsedMenus);
            setIsLoading(false);
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

  // Search functionality
  const flattenMenus = (menuItems: ProcessedMenu[]): ProcessedMenu[] => {
    let flat: ProcessedMenu[] = [];
    menuItems.forEach((item) => {
      flat.push(item);
      if (item.subMenus) {
        flat = flat.concat(flattenMenus(item.subMenus));
      }
    });
    return flat;
  };

  const filteredMenus = useMemo(() => {
    if (!searchQuery.trim()) return menus;

    const query = searchQuery.toLowerCase();
    const allMenus = flattenMenus(menus);
    const matchedMenus = allMenus.filter((menu) =>
      menu.name.toLowerCase().includes(query)
    );

    // Auto-expand parent menus of matched items
    const newExpanded = new Set<string>();
    matchedMenus.forEach((menu) => {
      if (menu.parentID) {
        newExpanded.add(`menu-${menu.parentID}`);
      }
    });
    setExpandedItems(newExpanded);

    return matchedMenus;
  }, [searchQuery, menus]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const validMenus = (searchQuery ? filteredMenus : menus).filter(
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
      const paddingLeft = level * 8 + 8;

      if (isLinkable) {
        return (
          <Link
            key={item.menuID}
            href={item.menuLink as string}
            className='flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/90 hover:bg-white/15 hover:text-white transition-all duration-150 group text-xs'
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <IconComponent
              size={14}
              className='text-white/80 group-hover:text-white flex-shrink-0'
            />
            <span className='font-medium truncate'>
              {item.title || item.name}
            </span>
          </Link>
        );
      }

      return (
        <div key={item.menuID}>
          <Collapsible
            open={isOpen}
            onOpenChange={() => toggleExpanded(`menu-${item.menuID}`)}
          >
            <CollapsibleTrigger asChild>
              <button
                className='w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-white/90 hover:bg-white/15 hover:text-white transition-all duration-150 group text-xs'
                style={{ paddingLeft: `${paddingLeft}px` }}
              >
                <div className='flex items-center gap-2 min-w-0'>
                  <IconComponent
                    size={14}
                    className='text-white/80 group-hover:text-white flex-shrink-0'
                  />
                  <span className='font-medium truncate'>
                    {item.title || item.name}
                  </span>
                </div>
                {hasSubMenus && (
                  <ChevronRight
                    size={12}
                    className={`text-white/60 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                )}
              </button>
            </CollapsibleTrigger>

            {hasSubMenus && (
              <CollapsibleContent className='mt-0.5'>
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

  if (isLoading) {
    return (
      <Sidebar className='w-64 bg-gradient-to-b from-[#0B4F6C] to-[#1A94D4] border-r border-white/20 shadow-2xl'>
        <SidebarHeader className='h-16 bg-white/10 backdrop-blur-md border-b border-white/20 flex items-center justify-center px-3'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30'>
              <Package className='w-5 h-5 text-white' />
            </div>
            <div className='text-white'>
              <h2 className='text-sm font-bold leading-tight'>SASPAK</h2>
              <p className='text-[10px] text-white/80 leading-tight'>CARGO</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className='bg-transparent px-3 py-4 flex flex-col items-center justify-center'>
          <RefreshCw className='w-5 h-5 text-white/70 animate-spin mb-2' />
          <div className='text-white/70 text-xs'>Loading...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className='w-64 bg-gradient-to-b from-[#0B4F6C] to-[#1A94D4] border-r border-white/20 shadow-2xl backdrop-blur-sm'>
      {/* Compact Header */}
      <SidebarHeader className='h-14 bg-white/10 backdrop-blur-md border-b border-white/20 flex items-center justify-center px-3'>
        <Link
          href='/portal'
          className='w-full flex items-center gap-2.5 hover:bg-white/5 transition-all duration-300 p-1.5 rounded-lg'
        >
          <div className='w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30 flex-shrink-0'>
            <Package className='w-5 h-5 text-white' />
          </div>
          <div className='text-white min-w-0 flex-1'>
            <h2 className='text-sm font-bold leading-tight'>SASPAK</h2>
            <p className='text-[10px] text-white/80 leading-tight'>CARGO</p>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className='bg-transparent px-2.5 py-3'>
        {/* Compact Search Bar */}
        <div className='mb-3'>
          <div
            className={`relative transition-all duration-200 ${
              isSearchFocused ? "ring-2 ring-white/30" : ""
            } rounded-lg`}
          >
            <Search
              size={14}
              className='absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none'
            />
            <input
              type='text'
              placeholder='Search menus...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className='w-full pl-8 pr-8 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-xs focus:outline-none focus:bg-white/15 transition-all'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors'
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Error Message - Compact */}
        {error && (
          <div className='mb-2 p-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg'>
            <div className='flex items-start gap-1.5'>
              <AlertCircle
                size={12}
                className='text-yellow-200 mt-0.5 flex-shrink-0'
              />
              <p className='text-yellow-200 text-[10px] leading-tight'>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Menu Items - Compact spacing */}
        <div className='space-y-0.5'>
          {validMenus.length > 0 ? (
            renderMenuItems(validMenus)
          ) : (
            <div className='text-center text-white/60 py-6 text-xs bg-white/5 rounded-lg'>
              <AlertCircle className='w-6 h-6 text-white/40 mx-auto mb-1.5' />
              <p className='mb-1 font-medium'>
                {searchQuery ? "No results found" : "No menus available"}
              </p>
              <p className='text-[10px] text-white/40'>
                {searchQuery
                  ? "Try a different search term"
                  : "Contact administrator"}
              </p>
            </div>
          )}
        </div>
      </SidebarContent>

      {/* Compact Footer */}
      <SidebarFooter className='h-12 bg-white/10 backdrop-blur-md border-t border-white/20 flex items-center justify-center px-3'>
        <div className='text-center'>
          <p className='text-[9px] text-white/50 leading-tight'>Powered by</p>
          <p className='text-[11px] font-semibold text-white leading-tight'>
            NJ IT Solutions
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
