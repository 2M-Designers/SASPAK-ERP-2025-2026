"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Settings,
  Globe,
  Package,
  Ship,
  Plane,
  Truck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import i18n from "@/i18n/client";
import { I18nextProvider } from "react-i18next";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronDown } from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  const pathname = usePathname();
  const router = useRouter();

  const [displayName, setDisplayName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("");
  const [language, setLanguage] = useState<string>(i18n.language || "en");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Auth Guard + Load User Data
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      setIsAuthenticated(false);
      router.replace("/");
      return;
    }

    try {
      const u = JSON.parse(user);
      // Try multiple possible field names for display name
      const name = u?.fullName || u?.displayname || u?.username || "Guest";
      const email = u?.email || "";

      setDisplayName(name);
      setUserEmail(email);

      if (u?.language) {
        setLanguage(u.language);
        i18n.changeLanguage(u.language);
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error parsing user JSON:", error);
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      router.replace("/login");
    }
  }, [router]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0B4F6C] via-[#0D5C7D] to-[#1A94D4] text-white'>
        <div className='w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 mb-3'>
          <Package className='w-8 h-8 text-white animate-pulse' />
        </div>
        <h2 className='text-base font-semibold mb-1.5'>SASPAK CARGO</h2>
        <p className='text-sm text-white/80'>
          {t("Loading...") || "Loading..."}
        </p>
      </div>
    );
  }

  const pathNameMapping: { [key: string]: string } = {
    management: "Inspection / Audit Management",
    audits: "In Progress",
    auditsforQAQC: "Approval Authority",
    auditsforVOE: "Technical Authority Approval",
    auditforOperators: "Operator Pending",
    regulators: "Regulators",
    operators: "Operators",
    blockoperators: "Blocks",
    installations: "Assets Management",
    installation_view: "Assets Management",
    reports: "Setting Management",
    users: "Users List",
    "group-rights": "Access Permission",
  };

  const pathSegments = pathname.split("/");
  const secondSegment = pathSegments[3];
  const firstSegment = pathSegments[2];

  const first =
    pathname === "/portal"
      ? "Dashboard"
      : secondSegment &&
        (secondSegment === "regulators" || secondSegment === "operators")
      ? "Stakeholder Management"
      : secondSegment &&
        (secondSegment === "blockoperators" ||
          pathNameMapping[secondSegment] === "Assets Management")
      ? "System Administration"
      : pathNameMapping[firstSegment] ||
        firstSegment?.replace(/-/g, " ").toUpperCase();

  const second =
    pathname === "/portal"
      ? null
      : secondSegment
      ? pathNameMapping[secondSegment] ||
        secondSegment.replace(/-/g, " ").toUpperCase()
      : null;

  // Language Switch
  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    localStorage.setItem("lang", lng);

    const user = localStorage.getItem("user");
    if (user) {
      try {
        const u = JSON.parse(user);
        localStorage.setItem("user", JSON.stringify({ ...u, language: lng }));
      } catch (e) {
        console.error("Error updating user language:", e);
      }
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("menus");
    localStorage.removeItem("rememberMe");
    router.push("/");
  };

  return (
    <I18nextProvider i18n={i18n}>
      {/* Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&libraries=places`}
        strategy='beforeInteractive'
      />

      {/* Background Container */}
      <div className='fixed inset-0 -z-10'>
        {/* Globe Background Image */}
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
          }}
        >
          {/* Overlay gradient matching login page */}
          <div className='absolute inset-0 bg-gradient-to-br from-[#0B4F6C]/95 via-[#0D5C7D]/90 to-[#1A94D4]/85'></div>
        </div>

        {/* Animated Background Elements */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse'></div>
        </div>
      </div>

      <div className='flex flex-col h-screen relative z-10'>
        <SidebarProvider>
          <AppSidebar />

          <SidebarInset>
            {/* Compact Header */}
            <header className='flex h-14 shrink-0 items-center justify-between border-b border-white/20 px-4 bg-gradient-to-r from-[#0B4F6C] via-[#1A94D4] to-[#0B4F6C] text-white shadow-xl backdrop-blur-md'>
              {/* Left: Sidebar + Breadcrumb */}
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <SidebarTrigger className='-ml-1 text-white hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200 border border-white/30 backdrop-blur-sm' />
                  <Separator
                    orientation='vertical'
                    className='h-5 w-[1px] bg-white/40'
                  />
                </div>

                <Breadcrumb>
                  <BreadcrumbList className='flex gap-1.5 text-xs font-medium'>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href='#'
                        className='text-white/90 hover:text-white transition-colors duration-200 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/20'
                      >
                        <div className='w-1.5 h-1.5 rounded-full bg-white/80'></div>
                        <span className='truncate max-w-[150px]'>{first}</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {second && (
                      <>
                        <BreadcrumbSeparator className='text-white/60 font-medium mx-0.5'>
                          <ChevronRight size={14} />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                          <BreadcrumbPage className='text-white font-semibold flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/30'>
                            <div className='w-1.5 h-1.5 rounded-full bg-white'></div>
                            <span className='truncate max-w-[150px]'>
                              {second}
                            </span>
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Right: Service Icons + User */}
              <div className='flex items-center gap-2'>
                {/* Service Icons - Compact */}
                <div className='hidden lg:flex items-center gap-1.5 mr-2'>
                  <div className='flex flex-col items-center gap-0.5 p-1.5 bg-white/10 backdrop-blur-sm rounded-md border border-white/20 hover:bg-white/20 transition-all cursor-pointer group'>
                    <Ship className='w-3.5 h-3.5 group-hover:scale-110 transition-transform' />
                    <span className='text-[9px] font-medium'>Sea</span>
                  </div>
                  <div className='flex flex-col items-center gap-0.5 p-1.5 bg-white/10 backdrop-blur-sm rounded-md border border-white/20 hover:bg-white/20 transition-all cursor-pointer group'>
                    <Plane className='w-3.5 h-3.5 group-hover:scale-110 transition-transform' />
                    <span className='text-[9px] font-medium'>Air</span>
                  </div>
                  <div className='flex flex-col items-center gap-0.5 p-1.5 bg-white/10 backdrop-blur-sm rounded-md border border-white/20 hover:bg-white/20 transition-all cursor-pointer group'>
                    <Truck className='w-3.5 h-3.5 group-hover:scale-110 transition-transform' />
                    <span className='text-[9px] font-medium'>Land</span>
                  </div>
                </div>

                {/* Language Switcher - Compact */}
                <DropdownMenu>
                  <DropdownMenuTrigger className='flex items-center gap-2 bg-white/15 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md hover:bg-white/25 transition-all duration-300 border border-white/30 group'>
                    <div className='w-6 h-6 rounded-full bg-white/20 flex items-center justify-center'>
                      <Globe
                        size={14}
                        className='text-white group-hover:text-white transition-colors duration-200'
                      />
                    </div>
                    <span className='text-[11px] font-semibold text-white uppercase tracking-wide'>
                      {language}
                    </span>
                    <ChevronDown
                      size={12}
                      className='text-white/80 group-hover:text-white transition-all duration-200 group-hover:rotate-180'
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    className='w-40 bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-lg p-1.5 mt-1'
                  >
                    <DropdownMenuLabel className='text-gray-700 font-semibold px-2.5 py-1.5 flex items-center gap-1.5 text-xs'>
                      <Globe className='w-3.5 h-3.5 text-[#1A94D4]' />
                      {t("language") || "Language"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className='bg-gray-200/80 my-1' />
                    <DropdownMenuItem
                      onClick={() => handleLanguageChange("en")}
                      className='rounded-md hover:bg-[#1A94D4]/10 transition-colors duration-200 px-2.5 py-1.5 cursor-pointer group text-xs'
                    >
                      <span className='flex items-center gap-2 text-gray-700 font-medium'>
                        <div className='w-5 h-5 rounded-full bg-[#1A94D4] flex items-center justify-center text-white text-[10px] font-bold'>
                          EN
                        </div>
                        {t("english") || "English"}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleLanguageChange("pt")}
                      className='rounded-md hover:bg-[#1A94D4]/10 transition-colors duration-200 px-2.5 py-1.5 cursor-pointer group text-xs'
                    >
                      <span className='flex items-center gap-2 text-gray-700 font-medium'>
                        <div className='w-5 h-5 rounded-full bg-[#0B4F6C] flex items-center justify-center text-white text-[10px] font-bold'>
                          PT
                        </div>
                        {t("portuguese") || "Portuguese"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu - Compact */}
                <DropdownMenu>
                  <DropdownMenuTrigger className='flex items-center gap-2 bg-white/15 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md hover:bg-white/25 transition-all duration-300 border border-white/30 group'>
                    <div className='w-7 h-7 rounded-full bg-gradient-to-r from-[#1A94D4] to-[#0B4F6C] flex items-center justify-center shadow-md'>
                      <User size={14} className='text-white' />
                    </div>
                    <div className='hidden md:flex flex-col items-start'>
                      <span className='text-xs font-bold text-white leading-tight truncate max-w-[120px]'>
                        {displayName}
                      </span>
                      {userEmail && (
                        <span className='text-[9px] text-white/80 leading-tight truncate max-w-[120px]'>
                          {userEmail}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={12}
                      className='text-white/80 group-hover:text-white transition-all duration-200 group-hover:rotate-180'
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    className='w-56 bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-lg p-1.5 mt-1'
                  >
                    <DropdownMenuLabel className='px-2.5 py-2 border-b border-gray-200/80'>
                      <div className='flex items-center gap-2 mb-1.5'>
                        <div className='w-8 h-8 rounded-full bg-gradient-to-r from-[#1A94D4] to-[#0B4F6C] flex items-center justify-center'>
                          <User size={16} className='text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-xs font-bold text-gray-800 truncate'>
                            {displayName}
                          </p>
                          {userEmail && (
                            <p className='text-[10px] text-gray-500 truncate'>
                              {userEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className='text-[10px] text-gray-500 flex items-center gap-1'>
                        <div className='w-1.5 h-1.5 rounded-full bg-green-500'></div>
                        Active
                      </p>
                    </DropdownMenuLabel>
                    <div className='py-1'>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push("/portal/management/profile")
                        }
                        className='rounded-md hover:bg-[#1A94D4]/10 transition-colors duration-200 px-2.5 py-1.5 cursor-pointer group'
                      >
                        <div className='flex items-center gap-2'>
                          <div className='w-6 h-6 rounded-md bg-[#1A94D4]/20 flex items-center justify-center group-hover:bg-[#1A94D4]/30 transition-colors duration-200'>
                            <Settings className='h-3 w-3 text-[#1A94D4]' />
                          </div>
                          <span className='text-gray-700 font-medium text-xs'>
                            {t("profile") || "Profile Settings"}
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className='rounded-md hover:bg-red-50 transition-colors duration-200 px-2.5 py-1.5 cursor-pointer group'
                      >
                        <div className='flex items-center gap-2'>
                          <div className='w-6 h-6 rounded-md bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200'>
                            <LogOut className='h-3 w-3 text-red-600' />
                          </div>
                          <span className='text-gray-700 font-medium text-xs'>
                            {t("logout") || "Logout"}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Page Content */}
            <main className='flex-grow overflow-y-auto bg-white/80 backdrop-blur-sm'>
              {children}
            </main>

            {/* Compact Footer */}
            <footer className='bg-white/90 backdrop-blur-sm border-t border-gray-200/50 py-2.5 px-4'>
              <div className='flex items-center justify-between text-xs text-gray-600'>
                <div className='flex items-center gap-3'>
                  <span className='font-medium'>
                    © 2025 SASPAK Cargo (Pvt) Ltd.
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='text-[10px] text-gray-500'>Powered by</span>
                  <span className='font-semibold text-[#0B4F6C] text-xs'>
                    NJ IT Solutions
                  </span>
                </div>
              </div>
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </I18nextProvider>
  );
}
