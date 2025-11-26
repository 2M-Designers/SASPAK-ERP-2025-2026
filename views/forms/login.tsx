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
} from "lucide-react";
import { useRouter } from "next/navigation";

// Define types based on the actual API response
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

interface Menu {
  menuID: number;
  name: string;
  title: string;
  menuLink: string | null;
  parentID: number | null;
  subMenus?: Menu[];
}

interface LoginResponse {
  token: string;
  user: User;
  menus?: Menu[];
}

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

  const API_BASE_URL = "http://188.245.83.20:9001/api";

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Validate inputs
      if (!formData.username.trim() || !formData.password.trim()) {
        setError("Please enter both username and password");
        setIsLoading(false);
        return;
      }

      console.log("Attempting login with:", { username: formData.username });

      // Step 1: Authenticate user
      const loginResponse = await fetch(
        `${API_BASE_URL}/Authentication/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        }
      );

      console.log("Login response status:", loginResponse.status);

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error("Login failed:", loginResponse.status, errorText);

        let errorMessage = "Login failed. Please try again.";
        if (loginResponse.status === 401) {
          errorMessage = "Invalid username or password";
        } else if (loginResponse.status === 400) {
          errorMessage = "Please check your credentials and try again";
        } else if (loginResponse.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        throw new Error(errorMessage);
      }

      const loginData: LoginResponse = await loginResponse.json();
      console.log("Login successful:", loginData);

      // Step 2: Get menus for the authenticated user
      let menusData: Menu[] = [];

      try {
        console.log("Fetching menus...");
        const menusResponse = await fetch(
          `${API_BASE_URL}/Authentication/GetMenus`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${loginData.token}`,
            },
          }
        );

        console.log("Menus response status:", menusResponse.status);

        if (menusResponse.ok) {
          menusData = await menusResponse.json();
          console.log("Menus retrieved:", menusData);
        } else {
          console.warn("Failed to fetch menus, using empty array");
          // If menus API fails, use menus from login response if available
          if (loginData.menus && Array.isArray(loginData.menus)) {
            menusData = loginData.menus;
            console.log("Using menus from login response:", menusData);
          }
        }
      } catch (menuError) {
        console.warn("Error fetching menus:", menuError);
        // Use menus from login response if available
        if (loginData.menus && Array.isArray(loginData.menus)) {
          menusData = loginData.menus;
          console.log(
            "Using menus from login response after error:",
            menusData
          );
        }
      }

      // Process menus to create hierarchical structure
      const processMenus = (menus: Menu[]): Menu[] => {
        if (!menus || !Array.isArray(menus)) {
          console.warn("No menus data available");
          return [];
        }

        const mainMenus = menus.filter((menu) => menu.parentID === null);

        const processedMenus = mainMenus.map((mainMenu) => ({
          ...mainMenu,
          subMenus: menus.filter((menu) => menu.parentID === mainMenu.menuID),
        }));

        console.log("Processed menus structure:", processedMenus);
        return processedMenus;
      };

      const processedMenus = processMenus(menusData);

      // Store ALL data in localStorage as per API response
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      localStorage.setItem("menus", JSON.stringify(processedMenus));

      // Store individual user properties for easy access
      localStorage.setItem("userId", loginData.user.userId.toString());
      localStorage.setItem("fullName", loginData.user.fullName);
      localStorage.setItem("username", loginData.user.username);
      localStorage.setItem("email", loginData.user.email);
      localStorage.setItem("companyId", loginData.user.companyId.toString());
      localStorage.setItem("branchId", loginData.user.branchId.toString());
      localStorage.setItem(
        "departmentId",
        loginData.user.departmentId.toString()
      );

      // Store nullable properties with null check
      if (loginData.user.companyName) {
        localStorage.setItem("companyName", loginData.user.companyName);
      } else {
        localStorage.removeItem("companyName");
      }

      if (loginData.user.branchName) {
        localStorage.setItem("branchName", loginData.user.branchName);
      } else {
        localStorage.removeItem("branchName");
      }

      if (loginData.user.departmentName) {
        localStorage.setItem("departmentName", loginData.user.departmentName);
      } else {
        localStorage.removeItem("departmentName");
      }

      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
        // Also store credentials if remember me is checked (optional - consider security implications)
        localStorage.setItem("savedUsername", formData.username);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedUsername");
      }

      // Store login timestamp
      localStorage.setItem("loginTime", new Date().toISOString());

      // Debug stored data
      console.log("=== STORED DATA IN LOCALSTORAGE ===");
      console.log("Token:", localStorage.getItem("token"));
      console.log("User:", JSON.parse(localStorage.getItem("user") || "{}"));
      console.log("Menus:", JSON.parse(localStorage.getItem("menus") || "[]"));
      console.log("UserId:", localStorage.getItem("userId"));
      console.log("FullName:", localStorage.getItem("fullName"));
      console.log("Username:", localStorage.getItem("username"));
      console.log("Email:", localStorage.getItem("email"));
      console.log("CompanyId:", localStorage.getItem("companyId"));
      console.log("BranchId:", localStorage.getItem("branchId"));
      console.log("DepartmentId:", localStorage.getItem("departmentId"));
      console.log("CompanyName:", localStorage.getItem("companyName"));
      console.log("BranchName:", localStorage.getItem("branchName"));
      console.log("DepartmentName:", localStorage.getItem("departmentName"));
      console.log("RememberMe:", localStorage.getItem("rememberMe"));
      console.log("LoginTime:", localStorage.getItem("loginTime"));
      console.log("===================================");

      // Show success message
      console.log("Login successful! Redirecting to portal...");

      // Redirect to dashboard
      router.push("/portal");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
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
                  disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A94D4] transition-colors disabled:opacity-50'
                    disabled={isLoading}
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
                  disabled={isLoading}
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
                className='w-full h-12 bg-gradient-to-r from-[#0B4F6C] to-[#1A94D4] hover:from-[#094159] hover:to-[#1681b8] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin mr-2' />
                    Signing in...
                  </>
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
