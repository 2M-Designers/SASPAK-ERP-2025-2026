"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Package,
  Ship,
  Plane,
  Truck,
  Building2,
  MapPin,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SaspakLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock authentication - accept any non-empty username and password
      if (!formData.username.trim() || !formData.password.trim()) {
        setError("Please enter both username and password");
        setIsLoading(false);
        return;
      }

      // Mock user data - ADDED companyId HERE
      const mockUser = {
        userID: 6,
        username: formData.username,
        displayname: formData.username,
        roleID: 1,
        email: `${formData.username}@saspak.com`,
        operatorID: 1,
        isReadOnlyMode: false,
        language: "en",
        companyId: 1, // ADDED THIS LINE - Company ID for SASPAK CARGO
        companyName: "SASPAK CARGO", // Optional: Also store company name
      };

      // Mock menu data for SASPAK Cargo - WITH COMPANY MANAGEMENT
      const mockMenus = [
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
            {
              menuID: 24,
              name: "Track Shipment",
              title: "Track Shipment",
              menuLink: "/portal/jobs/tracking",
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
            {
              menuID: 33,
              name: "Booking Management",
              title: "Booking Management",
              menuLink: "/portal/freight/bookings",
              parentID: 3,
            },
            {
              menuID: 34,
              name: "Vessel Schedule",
              title: "Vessel Schedule",
              menuLink: "/portal/freight/schedule",
              parentID: 3,
            },
          ],
        },
        {
          menuID: 4,
          name: "Customs Clearance",
          title: "Customs Clearance",
          parentID: null,
          subMenus: [
            {
              menuID: 41,
              name: "GD Filing",
              title: "GD Filing",
              menuLink: "/portal/customs/gd-filing",
              parentID: 4,
            },
            {
              menuID: 42,
              name: "Duty Calculation",
              title: "Duty Calculation",
              menuLink: "/portal/customs/duty-calculation",
              parentID: 4,
            },
            {
              menuID: 43,
              name: "Clearance Status",
              title: "Clearance Status",
              menuLink: "/portal/customs/status",
              parentID: 4,
            },
            {
              menuID: 44,
              name: "Document Management",
              title: "Document Management",
              menuLink: "/portal/customs/documents",
              parentID: 4,
            },
          ],
        },
        {
          menuID: 5,
          name: "Transport Operations",
          title: "Transport Operations",
          parentID: null,
          subMenus: [
            {
              menuID: 51,
              name: "Vehicle Management",
              title: "Vehicle Management",
              menuLink: "/portal/transport/vehicles",
              parentID: 5,
            },
            {
              menuID: 52,
              name: "POD Management",
              title: "POD Management",
              menuLink: "/portal/transport/pod",
              parentID: 5,
            },
            {
              menuID: 53,
              name: "Container Tracking",
              title: "Container Tracking",
              menuLink: "/portal/transport/containers",
              parentID: 5,
            },
            {
              menuID: 54,
              name: "Delivery Schedule",
              title: "Delivery Schedule",
              menuLink: "/portal/transport/schedule",
              parentID: 5,
            },
          ],
        },
        {
          menuID: 6,
          name: "Billing & Finance",
          title: "Billing & Finance",
          parentID: null,
          subMenus: [
            {
              menuID: 61,
              name: "Invoice Generation",
              title: "Invoice Generation",
              menuLink: "/portal/billing/invoices",
              parentID: 6,
            },
            {
              menuID: 62,
              name: "Payment Tracking",
              title: "Payment Tracking",
              menuLink: "/portal/billing/payments",
              parentID: 6,
            },
            {
              menuID: 63,
              name: "Financial Reports",
              title: "Financial Reports",
              menuLink: "/portal/billing/reports",
              parentID: 6,
            },
            {
              menuID: 64,
              name: "Expense Management",
              title: "Expense Management",
              menuLink: "/portal/billing/expenses",
              parentID: 6,
            },
          ],
        },
        {
          menuID: 7,
          name: "CRM",
          title: "Customer Relationship Management",
          parentID: null,
          subMenus: [
            {
              menuID: 71,
              name: "Client Management",
              title: "Client Management",
              menuLink: "/portal/crm/clients",
              parentID: 7,
            },
            {
              menuID: 72,
              name: "Quotations",
              title: "Quotations",
              menuLink: "/portal/crm/quotations",
              parentID: 7,
            },
            {
              menuID: 73,
              name: "Communication Log",
              title: "Communication Log",
              menuLink: "/portal/crm/communications",
              parentID: 7,
            },
            {
              menuID: 74,
              name: "Lead Management",
              title: "Lead Management",
              menuLink: "/portal/crm/leads",
              parentID: 7,
            },
          ],
        },
        {
          menuID: 8,
          name: "Company Management",
          title: "Company Management",
          parentID: null,
          subMenus: [
            {
              menuID: 81,
              name: "Company Profile",
              title: "Company Profile",
              menuLink: "/portal/company-management/company",
              parentID: 8,
            },
            {
              menuID: 82,
              name: "Branch Management",
              title: "Branch Management",
              menuLink: "/portal/company-management/branch",
              parentID: 8,
            },
            {
              menuID: 83,
              name: "Department Setup",
              title: "Department Setup",
              menuLink: "/portal/hr-management/department",
              parentID: 8,
            },
            {
              menuID: 84,
              name: "Cost Centers",
              title: "Cost Centers",
              menuLink: "/portal/general-setups/cost-centers",
              parentID: 8,
            },
            {
              menuID: 85,
              name: "Fiscal Year",
              title: "Fiscal Year",
              menuLink: "/portal/general-setups/fiscal-year",
              parentID: 8,
            },
            {
              menuID: 86,
              name: "UN Locations",
              title: "UN Locations",
              menuLink: "/portal/general-setups/un-location",
              parentID: 8,
            },
            {
              menuID: 87,
              name: "Currency",
              title: "Currency",
              menuLink: "/portal/general-setups/currency",
              parentID: 8,
            },
            {
              menuID: 88,
              name: "HS Code",
              title: "HS Code",
              menuLink: "/portal/general-setups/hs-code",
              parentID: 8,
            },
            {
              menuID: 89,
              name: "Designation",
              title: "Designation",
              menuLink: "/portal/hr-management/designation",
              parentID: 8,
            },
            {
              menuID: 90,
              name: "Employee",
              title: "Employee",
              menuLink: "/portal/hr-management/employee",
              parentID: 8,
            },
            {
              menuID: 91,
              name: "User Management",
              title: "User Management",
              menuLink: "/portal/user-management/users",
              parentID: 8,
            },
          ],
        },
        {
          menuID: 9,
          name: "Reports & Analytics",
          title: "Reports & Analytics",
          parentID: null,
          subMenus: [
            {
              menuID: 91,
              name: "Operational Reports",
              title: "Operational Reports",
              menuLink: "/portal/reports/operational",
              parentID: 9,
            },
            {
              menuID: 92,
              name: "Financial Analytics",
              title: "Financial Analytics",
              menuLink: "/portal/reports/financial",
              parentID: 9,
            },
            {
              menuID: 93,
              name: "Performance Dashboard",
              title: "Performance Dashboard",
              menuLink: "/portal/reports/performance",
              parentID: 9,
            },
            {
              menuID: 94,
              name: "Custom Reports",
              title: "Custom Reports",
              menuLink: "/portal/reports/custom",
              parentID: 9,
            },
          ],
        },
        {
          menuID: 10,
          name: "System Administration",
          title: "System Administration",
          parentID: null,
          subMenus: [
            {
              menuID: 101,
              name: "User Management",
              title: "User Management",
              menuLink: "/portal/admin/users",
              parentID: 10,
            },
            {
              menuID: 102,
              name: "Role Permissions",
              title: "Role Permissions",
              menuLink: "/portal/admin/roles",
              parentID: 10,
            },
            {
              menuID: 103,
              name: "System Settings",
              title: "System Settings",
              menuLink: "/portal/admin/settings",
              parentID: 10,
            },
            {
              menuID: 104,
              name: "Audit Logs",
              title: "Audit Logs",
              menuLink: "/portal/admin/audit",
              parentID: 10,
            },
            {
              menuID: 105,
              name: "Backup & Restore",
              title: "Backup & Restore",
              menuLink: "/portal/admin/backup",
              parentID: 10,
            },
          ],
        },
      ];

      // FIXED: Process menus correctly - just use the mockMenus as they already have proper structure
      const tree = mockMenus.map((menu) => ({
        ...menu,
        // Ensure subMenus is always an array
        subMenus: menu.subMenus || [],
      }));

      // Store mock data in localStorage
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("menus", JSON.stringify(tree));

      // Debug: Check what's being stored
      console.log("Storing user data:", mockUser);
      console.log("Company ID in user:", mockUser.companyId); // Verify companyId is included
      console.log("Storing menus:", tree);

      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", JSON.stringify(true));
      } else {
        localStorage.removeItem("rememberMe");
      }

      // Show success message
      console.log("Login successful! Redirecting to portal...");

      // Redirect to dashboard
      router.push("/portal");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin2 = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock authentication - accept any non-empty username and password
      if (!formData.username.trim() || !formData.password.trim()) {
        setError("Please enter both username and password");
        setIsLoading(false);
        return;
      }

      // Mock user data
      const mockUser = {
        userID: 6,
        username: formData.username,
        displayname: formData.username,
        roleID: 1,
        email: `${formData.username}@saspak.com`,
        operatorID: 1,
        isReadOnlyMode: false,
        language: "en",
      };

      // Mock menu data for SASPAK Cargo - WITH COMPANY MANAGEMENT
      const mockMenus = [
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
            {
              menuID: 24,
              name: "Track Shipment",
              title: "Track Shipment",
              menuLink: "/portal/jobs/tracking",
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
            {
              menuID: 33,
              name: "Booking Management",
              title: "Booking Management",
              menuLink: "/portal/freight/bookings",
              parentID: 3,
            },
            {
              menuID: 34,
              name: "Vessel Schedule",
              title: "Vessel Schedule",
              menuLink: "/portal/freight/schedule",
              parentID: 3,
            },
          ],
        },
        {
          menuID: 4,
          name: "Customs Clearance",
          title: "Customs Clearance",
          parentID: null,
          subMenus: [
            {
              menuID: 41,
              name: "GD Filing",
              title: "GD Filing",
              menuLink: "/portal/customs/gd-filing",
              parentID: 4,
            },
            {
              menuID: 42,
              name: "Duty Calculation",
              title: "Duty Calculation",
              menuLink: "/portal/customs/duty-calculation",
              parentID: 4,
            },
            {
              menuID: 43,
              name: "Clearance Status",
              title: "Clearance Status",
              menuLink: "/portal/customs/status",
              parentID: 4,
            },
            {
              menuID: 44,
              name: "Document Management",
              title: "Document Management",
              menuLink: "/portal/customs/documents",
              parentID: 4,
            },
          ],
        },
        {
          menuID: 5,
          name: "Transport Operations",
          title: "Transport Operations",
          parentID: null,
          subMenus: [
            {
              menuID: 51,
              name: "Vehicle Management",
              title: "Vehicle Management",
              menuLink: "/portal/transport/vehicles",
              parentID: 5,
            },
            {
              menuID: 52,
              name: "POD Management",
              title: "POD Management",
              menuLink: "/portal/transport/pod",
              parentID: 5,
            },
            {
              menuID: 53,
              name: "Container Tracking",
              title: "Container Tracking",
              menuLink: "/portal/transport/containers",
              parentID: 5,
            },
            {
              menuID: 54,
              name: "Delivery Schedule",
              title: "Delivery Schedule",
              menuLink: "/portal/transport/schedule",
              parentID: 5,
            },
          ],
        },
        {
          menuID: 6,
          name: "Billing & Finance",
          title: "Billing & Finance",
          parentID: null,
          subMenus: [
            {
              menuID: 61,
              name: "Invoice Generation",
              title: "Invoice Generation",
              menuLink: "/portal/billing/invoices",
              parentID: 6,
            },
            {
              menuID: 62,
              name: "Payment Tracking",
              title: "Payment Tracking",
              menuLink: "/portal/billing/payments",
              parentID: 6,
            },
            {
              menuID: 63,
              name: "Financial Reports",
              title: "Financial Reports",
              menuLink: "/portal/billing/reports",
              parentID: 6,
            },
            {
              menuID: 64,
              name: "Expense Management",
              title: "Expense Management",
              menuLink: "/portal/billing/expenses",
              parentID: 6,
            },
          ],
        },
        {
          menuID: 7,
          name: "CRM",
          title: "Customer Relationship Management",
          parentID: null,
          subMenus: [
            {
              menuID: 71,
              name: "Client Management",
              title: "Client Management",
              menuLink: "/portal/crm/clients",
              parentID: 7,
            },
            {
              menuID: 72,
              name: "Quotations",
              title: "Quotations",
              menuLink: "/portal/crm/quotations",
              parentID: 7,
            },
            {
              menuID: 73,
              name: "Communication Log",
              title: "Communication Log",
              menuLink: "/portal/crm/communications",
              parentID: 7,
            },
            {
              menuID: 74,
              name: "Lead Management",
              title: "Lead Management",
              menuLink: "/portal/crm/leads",
              parentID: 7,
            },
          ],
        },
        {
          menuID: 8,
          name: "Company Management",
          title: "Company Management",
          parentID: null,
          subMenus: [
            {
              menuID: 81,
              name: "Company Profile",
              title: "Company Profile",
              menuLink: "/portal/company/profile",
              parentID: 8,
            },
            {
              menuID: 82,
              name: "Branch Management",
              title: "Branch Management",
              menuLink: "/portal/company/branches",
              parentID: 8,
            },
            {
              menuID: 83,
              name: "Department Setup",
              title: "Department Setup",
              menuLink: "/portal/company/department",
              parentID: 8,
            },
            {
              menuID: 84,
              name: "Cost Centers",
              title: "Cost Centers",
              menuLink: "/portal/company/cost-centers",
              parentID: 8,
            },
            {
              menuID: 85,
              name: "Fiscal Year",
              title: "Fiscal Year",
              menuLink: "/portal/company/fiscal-year",
              parentID: 8,
            },
            {
              menuID: 86,
              name: "Organization Chart",
              title: "Organization Chart",
              menuLink: "/portal/company/org-chart",
              parentID: 8,
            },
          ],
        },
        {
          menuID: 9,
          name: "Reports & Analytics",
          title: "Reports & Analytics",
          parentID: null,
          subMenus: [
            {
              menuID: 91,
              name: "Operational Reports",
              title: "Operational Reports",
              menuLink: "/portal/reports/operational",
              parentID: 9,
            },
            {
              menuID: 92,
              name: "Financial Analytics",
              title: "Financial Analytics",
              menuLink: "/portal/reports/financial",
              parentID: 9,
            },
            {
              menuID: 93,
              name: "Performance Dashboard",
              title: "Performance Dashboard",
              menuLink: "/portal/reports/performance",
              parentID: 9,
            },
            {
              menuID: 94,
              name: "Custom Reports",
              title: "Custom Reports",
              menuLink: "/portal/reports/custom",
              parentID: 9,
            },
          ],
        },
        {
          menuID: 10,
          name: "System Administration",
          title: "System Administration",
          parentID: null,
          subMenus: [
            {
              menuID: 101,
              name: "User Management",
              title: "User Management",
              menuLink: "/portal/admin/users",
              parentID: 10,
            },
            {
              menuID: 102,
              name: "Role Permissions",
              title: "Role Permissions",
              menuLink: "/portal/admin/roles",
              parentID: 10,
            },
            {
              menuID: 103,
              name: "System Settings",
              title: "System Settings",
              menuLink: "/portal/admin/settings",
              parentID: 10,
            },
            {
              menuID: 104,
              name: "Audit Logs",
              title: "Audit Logs",
              menuLink: "/portal/admin/audit",
              parentID: 10,
            },
            {
              menuID: 105,
              name: "Backup & Restore",
              title: "Backup & Restore",
              menuLink: "/portal/admin/backup",
              parentID: 10,
            },
          ],
        },
      ];

      // FIXED: Process menus correctly - just use the mockMenus as they already have proper structure
      const tree = mockMenus.map((menu) => ({
        ...menu,
        // Ensure subMenus is always an array
        subMenus: menu.subMenus || [],
      }));

      // Store mock data in localStorage
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("menus", JSON.stringify(tree));

      // Debug: Check what's being stored
      console.log("Storing menus:", tree);
      console.log("Menu with submenus example:", tree[1]); // Job Management

      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", JSON.stringify(true));
      } else {
        localStorage.removeItem("rememberMe");
      }

      // Show success message
      console.log("Login successful! Redirecting to portal...");

      // Redirect to dashboard
      router.push("/portal");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActualLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "Authentication/login",
        {
          method: "POST",
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
          headers: {
            "Content-type": "application/json;",
          },
        }
      );

      if (res.status === 200) {
        const body = await res.json();

        // Process menus and store user data
        const mainMenus =
          body.menus?.filter((item: any) => item.parentID === null) || [];

        const tree = mainMenus.map((mainMenu: any) => {
          return {
            ...mainMenu,
            title: mainMenu.title, // Remove translation for now, add your t() function if needed
            subMenus:
              body.menus
                ?.filter((element: any) => element.parentID === mainMenu.menuID)
                ?.map((sub: any) => ({
                  ...sub,
                  title: sub.title, // Remove translation for now
                })) || [],
          };
        });

        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(body.user));
        localStorage.setItem("menus", JSON.stringify(tree));

        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", JSON.stringify(true));
        } else {
          localStorage.removeItem("rememberMe");
        }

        // Redirect to dashboard
        router.push("/portal");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && formData.username && formData.password) {
      handleLogin();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className='min-h-screen flex'>
      {/* Left Section - Branding with Globe Background */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
        {/* Globe Background Image */}
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
          }}
        >
          {/* Overlay gradient */}
          <div className='absolute inset-0 bg-gradient-to-br from-[#0B4F6C]/95 via-[#0D5C7D]/90 to-[#1A94D4]/85'></div>
        </div>

        {/* Animated Background Elements */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse'></div>
        </div>

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-between p-12 text-white w-full'>
          {/* Logo and Company Name */}
          <div>
            <div className='flex items-center gap-3 mb-8'>
              <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30'>
                <Package className='w-10 h-10' />
              </div>
              <div>
                <h1 className='text-2xl font-bold'>SASPAK CARGO</h1>
                <p className='text-sm text-white/80'>(Pvt) Limited</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='space-y-8'>
            <div>
              <h2 className='text-5xl font-bold mb-4 leading-tight'>
                Welcome to Your
                <br />
                Logistics Hub
              </h2>
              <p className='text-xl text-white/90 leading-relaxed'>
                Streamline your customs clearance, freight forwarding,
                <br />
                and transportation operations with our comprehensive ERP system
              </p>
            </div>

            {/* Service Icons */}
            <div className='grid grid-cols-4 gap-4 pt-8'>
              <div className='flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer'>
                <Package className='w-8 h-8' />
                <span className='text-xs text-center'>Custom Clearance</span>
              </div>
              <div className='flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer'>
                <Ship className='w-8 h-8' />
                <span className='text-xs text-center'>Sea Freight</span>
              </div>
              <div className='flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer'>
                <Plane className='w-8 h-8' />
                <span className='text-xs text-center'>Air Freight</span>
              </div>
              <div className='flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer'>
                <Truck className='w-8 h-8' />
                <span className='text-xs text-center'>Transportation</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='text-sm text-white/70'>
            <p>© 2025 SASPAK Cargo (Pvt) Limited. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo */}
          <div className='lg:hidden text-center mb-8'>
            <div className='inline-flex items-center gap-3 mb-4'>
              <div className='w-12 h-12 bg-[#0B4F6C] rounded-xl flex items-center justify-center'>
                <Package className='w-8 h-8 text-white' />
              </div>
              <div className='text-left'>
                <h1 className='text-xl font-bold text-[#0B4F6C]'>
                  SASPAK CARGO
                </h1>
                <p className='text-xs text-gray-600'>(Pvt) Limited</p>
              </div>
            </div>
          </div>

          {/* Card Container */}
          <div className='bg-white rounded-2xl shadow-xl p-8 border border-gray-100'>
            {/* Login Step */}
            <div className='text-center mb-8'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0B4F6C] to-[#1A94D4] rounded-2xl mb-4 shadow-lg'>
                <Package className='w-8 h-8 text-white' />
              </div>
              <h2 className='text-3xl font-bold text-gray-900 mb-2'>Sign In</h2>
              <p className='text-gray-600'>
                Enter your credentials to access your account
              </p>
            </div>

            <div className='space-y-6'>
              {/* Username Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='username'
                  className='block text-sm font-medium text-gray-700'
                >
                  Username or Email
                </label>
                <input
                  type='text'
                  id='username'
                  name='username'
                  value={formData.username}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder='Enter your username or email'
                  className='w-full h-12 px-4 border border-gray-300 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#1A94D4] focus:border-transparent transition-all'
                />
              </div>

              {/* Password Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-gray-700'
                >
                  Password
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? "text" : "password"}
                    id='password'
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder='Enter your password'
                    className='w-full h-12 px-4 pr-12 border border-gray-300 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#1A94D4] focus:border-transparent transition-all'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A94D4] transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='rememberMe'
                  name='rememberMe'
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className='w-4 h-4 text-[#1A94D4] border-gray-300 rounded focus:ring-[#1A94D4]'
                />
                <label htmlFor='rememberMe' className='text-sm text-gray-700'>
                  Remember me
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm'>
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading || !formData.username || !formData.password}
                className='w-full h-12 bg-gradient-to-r from-[#0B4F6C] to-[#1A94D4] hover:from-[#094159] hover:to-[#1681b8] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </div>

          {/* Powered By */}
          <div className='text-center mt-6'>
            <p className='text-sm text-gray-500'>
              Powered by{" "}
              <span className='font-semibold text-[#0B4F6C]'>
                NJ IT Solutions
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
