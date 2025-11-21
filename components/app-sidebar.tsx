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
  userID: number;
  username: string;
  roleID: number;
  displayname: string;
  operatorID?: number;
}

// Default menus structure for SASPAK Cargo
const defaultMenus = [
  {
    menuID: 1,
    name: "Dashboard",
    title: "Dashboard",
    menuLink: "/portal",
    parentID: null,
    subMenus: [],
  },
  {
    menuID: 2,
    name: "Job Management",
    title: "Job Management",
    parentID: null,
    subMenus: [
      {
        menuID: 21,
        name: "Create Job",
        title: "Create Job",
        menuLink: "/portal/jobs/create",
        parentID: 2,
      },
      {
        menuID: 22,
        name: "Active Jobs",
        title: "Active Jobs",
        menuLink: "/portal/jobs/active",
        parentID: 2,
      },
      {
        menuID: 23,
        name: "Job History",
        title: "Job History",
        menuLink: "/portal/jobs/history",
        parentID: 2,
      },
    ],
  },
  {
    menuID: 3,
    name: "Freight Forwarding",
    title: "Freight Forwarding",
    parentID: null,
    subMenus: [
      {
        menuID: 31,
        name: "Sea Freight",
        title: "Sea Freight",
        menuLink: "/portal/freight/sea",
        parentID: 3,
      },
      {
        menuID: 32,
        name: "Air Freight",
        title: "Air Freight",
        menuLink: "/portal/freight/air",
        parentID: 3,
      },
    ],
  },
];

// Icon mapping for different menu types with SASPAK theme
const getMenuIcon = (menuName: string, isOpen: boolean) => {
  const name = menuName.toLowerCase();
  if (name.includes("dashboard")) return LayoutDashboard;
  if (name.includes("job") || name.includes("management")) return FileText;
  if (name.includes("freight")) return Ship;
  if (name.includes("custom") || name.includes("clearance")) return Package;
  if (name.includes("transport")) return Truck;
  if (name.includes("billing") || name.includes("finance")) return DollarSign;
  if (name.includes("crm") || name.includes("customer")) return Users;
  if (name.includes("company")) return Building2; // NEW: Company Management icon
  if (name.includes("report") || name.includes("analytics")) return BarChart3;
  if (name.includes("system") || name.includes("admin")) return Cog;
  if (name.includes("setting")) return Settings;
  if (name.includes("location") || name.includes("branch")) return MapPin;
  if (name.includes("fiscal") || name.includes("year")) return Calendar;
  return isOpen ? FolderOpen : Folder;
};

export function AppSidebar() {
  const [menus, setMenus] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const { t, i18n } = useTranslation();

  // Get user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (err) {
          console.error("Failed to parse user data from localStorage:", err);
        }
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load language from localStorage
        const savedLang = localStorage.getItem("lang");
        if (savedLang && i18n.language !== savedLang) {
          i18n.changeLanguage(savedLang);
        }

        // Load normal menus from localStorage
        const menusData = localStorage.getItem("menus");
        console.log("Raw menus data from localStorage:", menusData); // Debug log

        if (menusData) {
          const parsedMenus = JSON.parse(menusData);
          console.log("Parsed menus:", parsedMenus); // Debug log

          // Check if menus have proper structure
          if (Array.isArray(parsedMenus) && parsedMenus.length > 0) {
            // Process menus to ensure they have the correct structure
            const processedMenus = parsedMenus.map((menu: any) => ({
              ...menu,
              subMenus: menu.subMenus || [],
            }));
            setMenus(processedMenus);
          } else {
            console.log("Menus data is empty or invalid, using default menus");
            setMenus(defaultMenus);
            localStorage.setItem("menus", JSON.stringify(defaultMenus));
          }
        } else {
          console.log("No menus in localStorage, using default menus");
          setMenus(defaultMenus);
          localStorage.setItem("menus", JSON.stringify(defaultMenus));
        }
      } catch (error) {
        console.error("Error loading sidebar data:", error);
        // Fallback to default menus
        setMenus(defaultMenus);
        localStorage.setItem("menus", JSON.stringify(defaultMenus));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

  // Process menus for rendering
  const renderMenus = menus.map((item: any) => {
    const isOpen = expandedItems.has(`menu-${item.menuID}`);
    const IconComponent = getMenuIcon(item.name, isOpen);
    const hasSubMenus = item.subMenus && item.subMenus.length > 0;

    console.log(`Menu ${item.name}:`, {
      hasSubMenus,
      subMenuCount: item.subMenus?.length,
      subMenus: item.subMenus,
    }); // Debug log

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
            <button className='w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group border border-transparent hover:border-white/20'>
              <div className='flex items-center gap-2'>
                <IconComponent size={18} className='text-white' />
                <span className='font-semibold text-sm'>{t(item.name)}</span>
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
              <div className='ml-2 pl-6 space-y-0.5 border-l border-white/20'>
                {item.subMenus.map((element: any) => (
                  <Link
                    key={element.menuID}
                    href={element.menuLink || "#"}
                    className='flex items-center gap-2 px-2 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-all duration-200 text-sm group'
                  >
                    <div className='w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white transition-colors duration-200'></div>
                    <span className='font-normal'>{t(element.name)}</span>
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  });

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
        <SidebarContent className='bg-transparent px-4 py-6 flex items-center justify-center'>
          <div className='text-white/70 text-sm'>Loading...</div>
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
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className='bg-transparent px-3 py-4'>
        <div className='space-y-1'>
          {menus.length > 0 ? (
            renderMenus
          ) : (
            <div className='text-center text-white/60 py-4 text-sm bg-white/10 rounded-xl mx-2'>
              No menus available
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
