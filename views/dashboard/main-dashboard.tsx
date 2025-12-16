"use client";
import React, { useState, useEffect } from "react";
import {
  Package,
  Ship,
  Plane,
  Truck,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
  Filter,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  CreditCard,
  BarChart3,
  Shield,
  Calculator,
} from "lucide-react";

export default function SASPAKDashboard() {
  const [userRoleId, setUserRoleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("management");
  const [showFinancials, setShowFinancials] = useState(true);
  const [dateRange, setDateRange] = useState("current-month");
  const [startDate, setStartDate] = useState("2024-10-01");
  const [endDate, setEndDate] = useState("2024-10-31");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedCRE, setSelectedCRE] = useState("all");

  // Get user role from localStorage on component mount
  useEffect(() => {
    // Try to parse the user object from localStorage
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserRoleId(user.roleId || null);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Alternative: Check if roleId is stored directly in localStorage
    const roleId = localStorage.getItem("roleId");
    if (roleId) {
      setUserRoleId(parseInt(roleId));
    }
  }, []);

  // Initialize active tab based on roleId
  useEffect(() => {
    if (userRoleId !== null) {
      if (userRoleId !== 1) {
        // If not management, set default to CRE tab (or another appropriate tab)
        setActiveTab("cre");
      }
    }
  }, [userRoleId]);

  // User Role Selection - Filter management tab if roleId is not 1
  const userRoles = [
    { id: "management", label: "Management", icon: Building },
    { id: "cre", label: "CRE", icon: UserCheck },
    { id: "cre-manager", label: "CRE Manager", icon: Shield },
    { id: "shipping", label: "Shipping", icon: Ship },
    { id: "billing", label: "Billing", icon: CreditCard },
  ].filter((role) => {
    // If roleId is not 1, hide management tab
    if (role.id === "management" && userRoleId !== 1) {
      return false;
    }
    return true;
  });

  // Companies and Branches
  const companies = [
    { id: "all", name: "All Companies" },
    { id: "saspak", name: "SASPAK Cargo" },
    { id: "saspak-logistics", name: "SASPAK Logistics" },
  ];

  const branches = [
    { id: "all", name: "All Branches" },
    { id: "karachi", name: "Karachi" },
    { id: "islamabad", name: "Islamabad" },
    { id: "lahore", name: "Lahore" },
  ];

  const creStaff = [
    { id: "all", name: "All CREs" },
    { id: "cre-1", name: "Ahmed Khan" },
    { id: "cre-2", name: "Sara Ali" },
    { id: "cre-3", name: "Usman Malik" },
  ];

  // ===================== MANAGEMENT DATA =====================
  const managementData = {
    companyWorth: {
      date: "2024-10-31",
      bankBalance: "15.2M PKR",
      cashInHand: "2.8M PKR",
      workInProgress: "8.5M PKR",
      receivables: "12.3M PKR",
      payables: "6.7M PKR",
      totalWorth: "32.1M PKR",
    },
    branchPerformance: [
      {
        branch: "Karachi",
        jobs: 156,
        containers: 89,
        cbm: 2450,
        weight: 15600,
        revenue: "8.2M PKR",
        profit: "2.1M PKR",
      },
      {
        branch: "Islamabad",
        jobs: 67,
        containers: 34,
        cbm: 890,
        weight: 5400,
        revenue: "3.1M PKR",
        profit: "0.8M PKR",
      },
      {
        branch: "Lahore",
        jobs: 45,
        containers: 23,
        cbm: 670,
        weight: 3200,
        revenue: "2.2M PKR",
        profit: "0.5M PKR",
      },
    ],
    departmentPerformance: [
      {
        department: "Sea Freight",
        jobs: 124,
        containers: 89,
        cbm: 2850,
        revenue: "9.8M PKR",
        profit: "2.4M PKR",
      },
      {
        department: "Air Freight",
        jobs: 67,
        weight: 15600,
        revenue: "6.2M PKR",
        profit: "1.5M PKR",
      },
      {
        department: "Customs",
        jobs: 247,
        revenue: "1.8M PKR",
        profit: "0.9M PKR",
      },
    ],
    receivables: [
      {
        client: "TechGlobal Inc.",
        amount: "1.2M PKR",
        age: 45,
        status: "Overdue",
      },
      {
        client: "MediCare Supplies",
        amount: "850K PKR",
        age: 30,
        status: "Due",
      },
      {
        client: "AutoParts Ltd.",
        amount: "620K PKR",
        age: 15,
        status: "Pending",
      },
      {
        client: "FashionRetail Co.",
        amount: "450K PKR",
        age: 5,
        status: "Pending",
      },
    ],
    payables: [
      {
        vendor: "Maersk Line",
        amount: "2.1M PKR",
        age: 30,
        dueDate: "2024-11-15",
      },
      {
        vendor: "Port Qasim Authority",
        amount: "1.5M PKR",
        age: 15,
        dueDate: "2024-11-10",
      },
      {
        vendor: "Pakistan Customs",
        amount: "980K PKR",
        age: 7,
        dueDate: "2024-11-05",
      },
      {
        vendor: "Local Transport",
        amount: "450K PKR",
        age: 3,
        dueDate: "2024-11-01",
      },
    ],
    clientPerformance: [
      {
        client: "TechGlobal Inc.",
        volume: 45,
        revenue: "4.5M PKR",
        profit: "1.2M PKR",
      },
      {
        client: "MediCare Supplies",
        volume: 38,
        revenue: "3.2M PKR",
        profit: "850K PKR",
      },
      {
        client: "AutoParts Ltd.",
        volume: 32,
        revenue: "2.8M PKR",
        profit: "720K PKR",
      },
      {
        client: "FashionRetail Co.",
        volume: 28,
        revenue: "2.1M PKR",
        profit: "550K PKR",
      },
    ],
    monthlyForecast: [
      {
        month: "Nov 2024",
        jobs: 280,
        revenue: "15.5M PKR",
        profit: "3.8M PKR",
      },
      {
        month: "Dec 2024",
        jobs: 265,
        revenue: "14.2M PKR",
        profit: "3.5M PKR",
      },
      {
        month: "Jan 2025",
        jobs: 295,
        revenue: "16.1M PKR",
        profit: "4.0M PKR",
      },
    ],
  };

  // ===================== CRE DATA =====================
  const creData = {
    jobsByETA: [
      {
        job: "SA-2024-00150",
        client: "TechGlobal Inc.",
        eta: "2024-11-05",
        gdDue: "2024-11-01",
        status: "Pending GD",
      },
      {
        job: "SA-2024-00149",
        client: "MediCare Supplies",
        eta: "2024-11-08",
        gdDue: "2024-11-03",
        status: "GD Filed",
      },
      {
        job: "SA-2024-00148",
        client: "AutoParts Ltd.",
        eta: "2024-11-12",
        gdDue: "2024-11-07",
        status: "Pending GD",
      },
      {
        job: "SA-2024-00147",
        client: "FashionRetail Co.",
        eta: "2024-11-15",
        gdDue: "2024-11-10",
        status: "GD Filed",
      },
    ],
    unclearedJobs: [
      {
        job: "SA-2024-00140",
        client: "TechGlobal Inc.",
        gdDate: "2024-10-25",
        status: "Customs Hold",
      },
      {
        job: "SA-2024-00139",
        client: "MediCare Supplies",
        gdDate: "2024-10-26",
        status: "Documentation Pending",
      },
      {
        job: "SA-2024-00138",
        client: "AutoParts Ltd.",
        gdDate: "2024-10-28",
        status: "Payment Pending",
      },
    ],
    payOrderStatus: [
      {
        poNumber: "PO-001245",
        amount: "450K PKR",
        requested: "2024-10-25",
        status: "Pending Approval",
        client: "TechGlobal Inc.",
      },
      {
        poNumber: "PO-001246",
        amount: "320K PKR",
        requested: "2024-10-26",
        status: "At Client",
        client: "MediCare Supplies",
      },
      {
        poNumber: "PO-001247",
        amount: "280K PKR",
        requested: "2024-10-27",
        status: "Pending Approval",
        client: "AutoParts Ltd.",
      },
    ],
    clientOutstanding: [
      {
        client: "TechGlobal Inc.",
        amount: "1.2M PKR",
        age: 45,
        lastPayment: "2024-09-15",
      },
      {
        client: "MediCare Supplies",
        amount: "850K PKR",
        age: 30,
        lastPayment: "2024-09-25",
      },
      {
        client: "AutoParts Ltd.",
        amount: "620K PKR",
        age: 15,
        lastPayment: "2024-10-10",
      },
    ],
    expiredFI: [
      {
        fiNumber: "FI-2024-0456",
        arrivalDate: "2024-10-20",
        expiryDate: "2024-10-25",
        status: "Expired",
      },
      {
        fiNumber: "FI-2024-0457",
        arrivalDate: "2024-10-22",
        expiryDate: "2024-10-27",
        status: "Expired",
      },
      {
        fiNumber: "FI-2024-0458",
        arrivalDate: "2024-10-25",
        expiryDate: "2024-10-30",
        status: "Expiring Soon",
      },
    ],
    pendingSecurities: [
      {
        type: "IB",
        number: "IB-2024-0789",
        amount: "2.5M PKR",
        date: "2024-10-15",
        status: "Pending",
      },
      {
        type: "492",
        number: "492-2024-0456",
        amount: "1.8M PKR",
        date: "2024-10-18",
        status: "Under Process",
      },
      {
        type: "TI",
        number: "TI-2024-0234",
        amount: "3.2M PKR",
        date: "2024-10-20",
        status: "Pending",
      },
    ],
  };

  // ===================== CRE MANAGER DATA =====================
  const creManagerData = {
    crePerformance: [
      {
        name: "Ahmed Khan",
        jobs: 45,
        avgClearanceTime: "2.5 days",
        attendance: "98%",
        fclContainers: 23,
        cbm: 1250,
      },
      {
        name: "Sara Ali",
        jobs: 38,
        avgClearanceTime: "2.8 days",
        attendance: "95%",
        fclContainers: 19,
        cbm: 980,
      },
      {
        name: "Usman Malik",
        jobs: 42,
        avgClearanceTime: "2.2 days",
        attendance: "96%",
        fclContainers: 21,
        cbm: 1100,
      },
    ],
  };

  // ===================== BILLING DATA =====================
  const billingData = {
    unbilledExpenses: [
      {
        type: "Pay Order",
        amount: "450K PKR",
        date: "2024-10-25",
        job: "SA-2024-00145",
        client: "TechGlobal Inc.",
      },
      {
        type: "Cash Expense",
        amount: "120K PKR",
        date: "2024-10-26",
        job: "SA-2024-00144",
        client: "MediCare Supplies",
      },
      {
        type: "Pay Order",
        amount: "280K PKR",
        date: "2024-10-27",
        job: "SA-2024-00143",
        client: "AutoParts Ltd.",
      },
    ],
    contracts: [
      {
        client: "TechGlobal Inc.",
        type: "Sea Freight",
        expiry: "2024-12-31",
        status: "Active",
      },
      {
        client: "MediCare Supplies",
        type: "Air Freight",
        expiry: "2024-11-30",
        status: "Expiring Soon",
      },
      {
        client: "AutoParts Ltd.",
        type: "Sea Freight",
        expiry: "2025-01-31",
        status: "Active",
      },
      {
        client: "FashionRetail Co.",
        type: "Customs",
        expiry: "2024-10-31",
        status: "Expired",
      },
    ],
    unchangedContracts: [
      {
        client: "MediCare Supplies",
        lastUpdate: "2023-08-15",
        type: "Air Freight",
        status: "Needs Review",
      },
      {
        client: "FashionRetail Co.",
        lastUpdate: "2023-06-20",
        type: "Customs",
        status: "Needs Review",
      },
    ],
    clearedPendingBilling: [
      {
        job: "SA-2024-00142",
        client: "FashionRetail Co.",
        clearanceDate: "2024-10-24",
        amount: "85K PKR",
      },
      {
        job: "SA-2024-00141",
        client: "TechGlobal Inc.",
        clearanceDate: "2024-10-25",
        amount: "120K PKR",
      },
      {
        job: "SA-2024-00140",
        client: "MediCare Supplies",
        clearanceDate: "2024-10-26",
        amount: "95K PKR",
      },
    ],
    pendingBillsAdvance: [
      {
        job: "SA-2024-00139",
        client: "AutoParts Ltd.",
        advance: "200K PKR",
        billing: "320K PKR",
        pending: "120K PKR",
      },
      {
        job: "SA-2024-00138",
        client: "TechGlobal Inc.",
        advance: "150K PKR",
        billing: "280K PKR",
        pending: "130K PKR",
      },
    ],
    pendingBillsRent: [
      {
        job: "SA-2024-00137",
        client: "MediCare Supplies",
        rentDays: 5,
        amount: "75K PKR",
        status: "Pending Invoice",
      },
      {
        job: "SA-2024-00136",
        client: "FashionRetail Co.",
        rentDays: 3,
        amount: "45K PKR",
        status: "Pending Invoice",
      },
    ],
  };

  // ===================== DEPOSITS DATA =====================
  const depositsData = {
    pendingDeposits: [
      {
        type: "Paid",
        container: "MSKU-1234567",
        days: 45,
        amount: "150K PKR",
        status: "Oldest",
      },
      {
        type: "Free",
        container: "CMAU-7654321",
        days: 38,
        amount: "0 PKR",
        status: "Pending",
      },
      {
        type: "Paid",
        container: "TGHU-9876543",
        days: 25,
        amount: "120K PKR",
        status: "Pending",
      },
    ],
    depositsByLine: [
      { line: "Maersk", containers: 12, amount: "1.8M PKR", tues: 24 },
      { line: "MSC", containers: 8, amount: "1.2M PKR", tues: 16 },
      { line: "COSCO", containers: 6, amount: "980K PKR", tues: 12 },
    ],
    pendingEIR: [
      {
        transporter: "National Logistics",
        containers: 3,
        since: "2024-10-20",
        job: "SA-2024-00145",
      },
      {
        transporter: "Quick Transport",
        containers: 2,
        since: "2024-10-22",
        job: "SA-2024-00144",
      },
    ],
    pendingRentInvoices: [
      {
        line: "Maersk",
        containers: 5,
        amount: "375K PKR",
        since: "2024-10-18",
      },
      { line: "MSC", containers: 3, amount: "225K PKR", since: "2024-10-20" },
    ],
    freeDaysAlert: [
      {
        container: "MSKU-1234567",
        freeDays: 18,
        alert: "3 days left",
        client: "TechGlobal Inc.",
      },
      {
        container: "CMAU-7654321",
        freeDays: 19,
        alert: "2 days left",
        client: "MediCare Supplies",
      },
    ],
    nocValidation: [
      {
        container: "TGHU-9876543",
        validationDate: "2024-11-02",
        alert: "2 days before",
        status: "Pending",
      },
      {
        container: "MSKU-1122334",
        validationDate: "2024-11-03",
        alert: "3 days before",
        status: "Pending",
      },
    ],
    linePerformance: [
      {
        line: "Maersk",
        invoiceTime: "3 days",
        refundTime: "15 days",
        damageCharges: "45K PKR",
        avgDOCharges: "25K PKR",
        cancelledPO: 2,
      },
      {
        line: "MSC",
        invoiceTime: "4 days",
        refundTime: "18 days",
        damageCharges: "38K PKR",
        avgDOCharges: "28K PKR",
        cancelledPO: 1,
      },
    ],
  };

  // Component: Simple Metric Card
  interface MetricCardProps {
    label: string;
    value: string;
    icon: React.ComponentType<any>;
    color?: string;
    textColor?: string;
    currency?: string;
  }

  const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    icon: Icon,
    color,
    textColor,
    currency,
  }) => {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300'>
        <div className='flex justify-between items-start'>
          <div>
            <p className='text-gray-600 text-sm font-medium'>{label}</p>
            <div className='flex items-baseline gap-2 mt-2'>
              <p className='text-3xl font-bold text-gray-900'>{value}</p>
              {currency && (
                <span className='text-gray-500 text-sm'>{currency}</span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className={`w-6 h-6 ${textColor}`} />
          </div>
        </div>
      </div>
    );
  };

  // Component: Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles: Record<string, string> = {
      Active: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      "In Transit": "bg-blue-100 text-blue-800",
      Cleared: "bg-emerald-100 text-emerald-800",
      Delivered: "bg-green-100 text-green-800",
      "GD Filed": "bg-cyan-100 text-cyan-800",
      Overdue: "bg-red-100 text-red-800",
      Due: "bg-orange-100 text-orange-800",
      Expired: "bg-red-100 text-red-800",
      "Expiring Soon": "bg-orange-100 text-orange-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          statusStyles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  // Component: Date Range Selector
  const DateRangeSelector = () => (
    <div className='flex gap-4 items-center'>
      <div className='flex items-center gap-2'>
        <Calendar size={16} className='text-gray-500' />
        <input
          type='date'
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className='px-3 py-2 border border-gray-300 rounded-lg text-sm'
        />
        <span className='text-gray-500'>to</span>
        <input
          type='date'
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className='px-3 py-2 border border-gray-300 rounded-lg text-sm'
        />
      </div>
    </div>
  );

  // Show loading state while fetching roleId
  if (userRoleId === null) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm'>
        <div className='px-6 py-5'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
              <p className='text-gray-500 text-sm mt-1'>
                SASPAK Cargo - Multi-Role Operations Dashboard
              </p>
              {/* Show current role info */}
              <p className='text-xs text-gray-400 mt-1'>
                Logged in as:{" "}
                {userRoleId === 1 ? "Management" : "Operations Administrator"}{" "}
                (Role ID: {userRoleId})
              </p>
            </div>
            <div className='flex items-center gap-3 w-full md:w-auto flex-col md:flex-row'>
              <DateRangeSelector />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowFinancials(!showFinancials)}
                className='flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap'
              >
                {showFinancials ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className='hidden sm:inline'>
                  {showFinancials ? "Hide" : "Show"} Financials
                </span>
              </button>
              <button className='p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'>
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-6 py-8'>
        {/* Role Navigation */}
        <div className='flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto pb-2'>
          {userRoles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => setActiveTab(role.id)}
                className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === role.id
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Role-based Filters */}
        {(activeTab === "management" || activeTab === "cre-manager") &&
          userRoleId === 1 && (
            <div className='flex gap-4 mb-6 flex-wrap'>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white'
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {activeTab === "cre-manager" && (
                <select
                  value={selectedCRE}
                  onChange={(e) => setSelectedCRE(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white'
                >
                  {creStaff.map((cre) => (
                    <option key={cre.id} value={cre.id}>
                      {cre.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

        {/* ===================== MANAGEMENT DASHBOARD ===================== */}
        {activeTab === "management" && userRoleId === 1 && (
          <div className='space-y-8'>
            {/* Company Worth */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6 flex items-center gap-2'>
                <Calculator size={20} className='text-blue-600' />
                Company Worth as of {managementData.companyWorth.date}
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <p className='text-sm text-gray-600'>Bank Balance</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {managementData.companyWorth.bankBalance}
                  </p>
                </div>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <p className='text-sm text-gray-600'>Cash in Hand</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {managementData.companyWorth.cashInHand}
                  </p>
                </div>
                <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                  <p className='text-sm text-gray-600'>Work in Progress</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {managementData.companyWorth.workInProgress}
                  </p>
                </div>
                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <p className='text-sm text-gray-600'>Receivables</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {managementData.companyWorth.receivables}
                  </p>
                </div>
                <div className='text-center p-4 bg-red-50 rounded-lg'>
                  <p className='text-sm text-gray-600'>Payables</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {managementData.companyWorth.payables}
                  </p>
                </div>
              </div>
              <div className='mt-6 p-4 bg-gray-50 rounded-lg border'>
                <p className='text-lg font-bold text-center text-gray-900'>
                  Total Company Worth: {managementData.companyWorth.totalWorth}
                </p>
              </div>
            </div>

            {/* Branch Performance */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Branch Performance
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Branch
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Jobs
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Containers
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        CBM/Weight
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Revenue
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {managementData.branchPerformance.map((branch, idx) => (
                      <tr
                        key={idx}
                        className='border-b border-gray-100 hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 font-medium text-gray-900'>
                          {branch.branch}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {branch.jobs}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {branch.containers}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {branch.cbm} CBM / {branch.weight} kg
                        </td>
                        <td className='px-6 py-4 font-semibold text-gray-900'>
                          {branch.revenue}
                        </td>
                        <td className='px-6 py-4 font-semibold text-green-600'>
                          {branch.profit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Receivables & Payables */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Receivables */}
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-6'>
                  Receivables
                </h3>
                <div className='space-y-3'>
                  {managementData.receivables.map((item, idx) => (
                    <div
                      key={idx}
                      className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'
                    >
                      <div>
                        <p className='font-medium text-gray-900'>
                          {item.client}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Age: {item.age} days
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-gray-900'>{item.amount}</p>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payables */}
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-6'>
                  Payables
                </h3>
                <div className='space-y-3'>
                  {managementData.payables.map((item, idx) => (
                    <div
                      key={idx}
                      className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'
                    >
                      <div>
                        <p className='font-medium text-gray-900'>
                          {item.vendor}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Due: {item.dueDate}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-gray-900'>{item.amount}</p>
                        <p className='text-sm text-gray-600'>
                          Age: {item.age} days
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Client Performance */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Client Performance
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Client
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Volume
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Revenue
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {managementData.clientPerformance.map((client, idx) => (
                      <tr
                        key={idx}
                        className='border-b border-gray-100 hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 font-medium text-gray-900'>
                          {client.client}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {client.volume} jobs
                        </td>
                        <td className='px-6 py-4 font-semibold text-gray-900'>
                          {client.revenue}
                        </td>
                        <td className='px-6 py-4 font-semibold text-green-600'>
                          {client.profit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Show message if trying to access management without permission */}
        {activeTab === "management" && userRoleId !== 1 && (
          <div className='bg-white rounded-lg border border-gray-200 p-8 text-center'>
            <Shield size={48} className='mx-auto text-gray-400 mb-4' />
            <h3 className='text-lg font-bold text-gray-900 mb-2'>
              Access Denied
            </h3>
            <p className='text-gray-600'>
              You dont have permission to access the Management dashboard.
            </p>
            <button
              onClick={() => setActiveTab("cre")}
              className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Go to CRE Dashboard
            </button>
          </div>
        )}

        {/* ===================== CRE DASHBOARD ===================== */}
        {activeTab === "cre" && (
          <div className='space-y-8'>
            {/* Jobs by ETA */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Jobs by ETA (GD Filing Reminder)
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Job #
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Client
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        ETA
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        GD Due
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {creData.jobsByETA.map((job, idx) => (
                      <tr
                        key={idx}
                        className='border-b border-gray-100 hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 font-medium text-blue-600'>
                          {job.job}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {job.client}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>{job.eta}</td>
                        <td className='px-6 py-4 text-gray-600'>{job.gdDue}</td>
                        <td className='px-6 py-4'>
                          <StatusBadge status={job.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pay Order Status */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Pay Order Status
              </h3>
              <div className='space-y-3'>
                {creData.payOrderStatus.map((po, idx) => (
                  <div
                    key={idx}
                    className='flex justify-between items-center p-4 bg-gray-50 rounded-lg border'
                  >
                    <div>
                      <p className='font-medium text-gray-900'>
                        {po.poNumber} - {po.client}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Requested: {po.requested}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold text-gray-900'>{po.amount}</p>
                      <StatusBadge status={po.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Outstanding */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Client Outstanding
              </h3>
              <div className='space-y-3'>
                {creData.clientOutstanding.map((client, idx) => (
                  <div
                    key={idx}
                    className='flex justify-between items-center p-4 bg-gray-50 rounded-lg border'
                  >
                    <div>
                      <p className='font-medium text-gray-900'>
                        {client.client}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Last Payment: {client.lastPayment}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold text-gray-900'>{client.amount}</p>
                      <p className='text-sm text-gray-600'>
                        Age: {client.age} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== CRE MANAGER DASHBOARD ===================== */}
        {activeTab === "cre-manager" && (
          <div className='space-y-8'>
            {/* CRE Performance */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                CRE Performance
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        CRE Name
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Jobs
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Avg Clearance Time
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        FCL Containers
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        CBM Handled
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {creManagerData.crePerformance.map((cre, idx) => (
                      <tr
                        key={idx}
                        className='border-b border-gray-100 hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 font-medium text-gray-900'>
                          {cre.name}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>{cre.jobs}</td>
                        <td className='px-6 py-4 text-gray-600'>
                          {cre.avgClearanceTime}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {cre.fclContainers}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>{cre.cbm}</td>
                        <td className='px-6 py-4 text-gray-600'>
                          {cre.attendance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Include all CRE reports */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                CRE Team Reports
              </h3>
              <div className='text-gray-600'>
                <p>
                  All CRE reports are available for monitoring and analysis.
                </p>
                {/* You can add specific CRE team reports here */}
              </div>
            </div>
          </div>
        )}

        {/* ===================== BILLING DASHBOARD ===================== */}
        {activeTab === "billing" && (
          <div className='space-y-8'>
            {/* Unbilled Expenses */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Unbilled Expenses
              </h3>
              <div className='space-y-3'>
                {billingData.unbilledExpenses.map((expense, idx) => (
                  <div
                    key={idx}
                    className='flex justify-between items-center p-4 bg-gray-50 rounded-lg border'
                  >
                    <div>
                      <p className='font-medium text-gray-900'>
                        {expense.type} - {expense.job}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {expense.client} • {expense.date}
                      </p>
                    </div>
                    <p className='font-bold text-gray-900'>{expense.amount}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contracts */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Contracts
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-gray-200 bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Client
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Type
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Expiry Date
                      </th>
                      <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData.contracts.map((contract, idx) => (
                      <tr
                        key={idx}
                        className='border-b border-gray-100 hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 font-medium text-gray-900'>
                          {contract.client}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {contract.type}
                        </td>
                        <td className='px-6 py-4 text-gray-600'>
                          {contract.expiry}
                        </td>
                        <td className='px-6 py-4'>
                          <StatusBadge status={contract.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cleared Shipments Pending Billing */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Cleared Shipments Pending Billing
              </h3>
              <div className='space-y-3'>
                {billingData.clearedPendingBilling.map((shipment, idx) => (
                  <div
                    key={idx}
                    className='flex justify-between items-center p-4 bg-gray-50 rounded-lg border'
                  >
                    <div>
                      <p className='font-medium text-gray-900'>
                        {shipment.job} - {shipment.client}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Cleared: {shipment.clearanceDate}
                      </p>
                    </div>
                    <p className='font-bold text-gray-900'>{shipment.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== SHIPPING DASHBOARD ===================== */}
        {activeTab === "shipping" && (
          <div className='space-y-8'>
            {/* Deposits Management */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h3 className='text-lg font-bold text-gray-900 mb-6'>
                Deposits Management
              </h3>

              {/* Pending Deposits */}
              <div className='mb-8'>
                <h4 className='font-semibold text-gray-900 mb-4'>
                  Pending Deposits
                </h4>
                <div className='space-y-3'>
                  {depositsData.pendingDeposits.map((deposit, idx) => (
                    <div
                      key={idx}
                      className='flex justify-between items-center p-4 bg-gray-50 rounded-lg border'
                    >
                      <div>
                        <p className='font-medium text-gray-900'>
                          {deposit.container} ({deposit.type})
                        </p>
                        <p className='text-sm text-gray-600'>
                          Pending for {deposit.days} days
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-gray-900'>
                          {deposit.amount}
                        </p>
                        <StatusBadge status={deposit.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free Days Alert */}
              <div className='mb-8'>
                <h4 className='font-semibold text-gray-900 mb-4'>
                  Free Days Alert
                </h4>
                <div className='space-y-3'>
                  {depositsData.freeDaysAlert.map((alert, idx) => (
                    <div
                      key={idx}
                      className='flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200'
                    >
                      <div>
                        <p className='font-medium text-gray-900'>
                          {alert.container}
                        </p>
                        <p className='text-sm text-gray-600'>{alert.client}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-orange-700'>
                          {alert.freeDays} free days
                        </p>
                        <p className='text-sm text-orange-600'>{alert.alert}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Performance */}
              <div>
                <h4 className='font-semibold text-gray-900 mb-4'>
                  Line Performance
                </h4>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='border-b border-gray-200 bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                          Line
                        </th>
                        <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                          Invoice Time
                        </th>
                        <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                          Refund Time
                        </th>
                        <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                          Damage Charges
                        </th>
                        <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                          Avg DO Charges
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {depositsData.linePerformance.map((line, idx) => (
                        <tr
                          key={idx}
                          className='border-b border-gray-100 hover:bg-gray-50'
                        >
                          <td className='px-6 py-4 font-medium text-gray-900'>
                            {line.line}
                          </td>
                          <td className='px-6 py-4 text-gray-600'>
                            {line.invoiceTime}
                          </td>
                          <td className='px-6 py-4 text-gray-600'>
                            {line.refundTime}
                          </td>
                          <td className='px-6 py-4 text-gray-600'>
                            {line.damageCharges}
                          </td>
                          <td className='px-6 py-4 text-gray-600'>
                            {line.avgDOCharges}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
