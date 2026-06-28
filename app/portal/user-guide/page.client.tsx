"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FiSearch,
  FiX,
  FiChevronRight,
  FiPrinter,
  FiBook,
  FiSettings,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiDollarSign,
  FiBarChart2,
  FiHome,
  FiShield,
  FiList,
  FiPackage,
  FiAnchor,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  topics: Topic[];
};

type Topic = {
  id: string;
  title: string;
  description: string;
  steps?: string[];
  notes?: string[];
};

// ─── Content ──────────────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <FiHome size={18} />,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    border: "border-blue-200",
    topics: [
      {
        id: "login",
        title: "Logging In",
        description:
          "Access the SASPAK Cargo ERP system using your company-issued credentials.",
        steps: [
          "Open your web browser and navigate to the SASPAK ERP URL provided by your administrator.",
          "Enter your Username (email address) and Password in the login form.",
          "Click the Sign In button to access the portal.",
          "If this is your first login, change your password immediately via My Profile.",
        ],
        notes: [
          "Contact your system administrator if you forget your password or your account is locked.",
          "Sessions expire after a period of inactivity — save your work regularly.",
        ],
      },
      {
        id: "navigation",
        title: "Navigating the Portal",
        description:
          "The portal uses a left sidebar for navigation and a top bar for quick access to key actions.",
        steps: [
          "Use the left sidebar to browse modules — click any module heading to expand its sub-pages.",
          "The top breadcrumb shows your current location in the system.",
          "Use the search box at the top of the sidebar to quickly find any page by name.",
          "Click your name/avatar in the top-right corner to access your profile or logout.",
        ],
        notes: [
          "Menus are permission-based — you will only see pages your role has access to.",
          "The sidebar can be collapsed on smaller screens by clicking the menu icon.",
        ],
      },
      {
        id: "common-actions",
        title: "Common Actions Across All Pages",
        description:
          "Most list pages share a consistent set of actions and controls.",
        steps: [
          "New / Add — opens a blank form to create a new record.",
          "Edit (pencil icon) — opens the selected record for editing.",
          "View (eye icon) — opens a read-only detail view.",
          "Delete (trash icon) — permanently removes a record (requires confirmation).",
          "Print / PDF (printer icon) — generates a printable PDF of the record.",
          "Refresh — reloads the latest data from the server.",
          "Search — type in the search box to filter the list in real time.",
          "Tabs — many pages have tab filters (e.g., Draft / Approved / Processed) to narrow results.",
        ],
        notes: [
          "Posted or system-generated records may have their Edit button disabled.",
          "Deleted records cannot be recovered — confirm before deleting.",
        ],
      },
    ],
  },

  {
    id: "general-setups",
    title: "General Setups",
    icon: <FiSettings size={18} />,
    color: "bg-gray-50 border-gray-200 text-gray-700",
    border: "border-gray-300",
    topics: [
      {
        id: "currency",
        title: "Currency",
        description:
          "Manage the currencies used across the system for invoicing, billing, and financial transactions.",
        steps: [
          "Go to General Setups → Currency.",
          "Click New to add a currency. Enter Currency Code (e.g., USD), Currency Name, Symbol, and mark if it is the Default currency.",
          "Only one currency can be marked as Default — this is the local currency (PKR for Pakistan operations).",
          "Edit or delete existing currencies as needed.",
        ],
        notes: ["The default currency is used for LC (local currency) calculations throughout the system."],
      },
      {
        id: "exchange-rates",
        title: "Exchange Rates",
        description:
          "Set daily or periodic exchange rates for foreign currencies against the base currency.",
        steps: [
          "Go to General Setups → Exchange Rates.",
          "Click New and select the Currency, enter the Rate, and set the effective Date.",
          "The most recent rate for a currency is automatically applied when creating invoices or vouchers.",
        ],
        notes: ["Always update exchange rates before processing transactions in foreign currencies."],
      },
      {
        id: "charges-master",
        title: "Charges Master",
        description:
          "Define charge types (e.g., Freight, THC, Documentation) used across invoices and bills.",
        steps: [
          "Go to General Setups → Charges Master.",
          "Click New to add a charge. Enter Charge Name, GL Account linkages, and applicable tax rates.",
          "These charges appear as selectable line items when creating GL Invoices, GL Bills, and GL Receipts/Payments.",
        ],
      },
      {
        id: "cost-centers",
        title: "Cost Centers",
        description:
          "Organize financial transactions by department, project, or business unit.",
        steps: [
          "Go to General Setups → Cost Centers.",
          "Click New and enter the Cost Center Name and Code.",
          "Assign cost centers to detail lines when creating vouchers or invoices.",
        ],
      },
      {
        id: "banks",
        title: "Banks",
        description: "Maintain a master list of banks used for payments and receipts.",
        steps: [
          "Go to General Setups → Banks.",
          "Click New to add a bank. Enter Bank Name, Branch, Account Number, and IBAN/SWIFT if applicable.",
        ],
      },
      {
        id: "vessel-master",
        title: "Vessel Master",
        description: "Manage vessel information for sea freight shipments.",
        steps: [
          "Go to General Setups → Vessel Master.",
          "Add vessels with their name, IMO number, and type.",
          "Vessels are linked to BL (Bill of Lading) records in Jobs Management.",
        ],
      },
      {
        id: "un-location",
        title: "UN Location & Airports",
        description:
          "Standard UN/LOCODE locations and IATA airport codes used on shipping documents.",
        steps: [
          "Go to General Setups → UN Location or UN Airports.",
          "These are typically pre-loaded from standard datasets. Add custom entries if needed.",
          "Locations are referenced on AWB, BL, and Job Order documents.",
        ],
      },
      {
        id: "hs-code",
        title: "HS Code",
        description: "Harmonized System tariff codes for commodity classification.",
        steps: [
          "Go to General Setups → HS Code.",
          "Add or import HS codes with their descriptions.",
          "HS codes are assigned to cargo items on job orders and shipping documents.",
        ],
      },
      {
        id: "container",
        title: "Container Size & Type",
        description: "Define container dimensions and types for sea freight jobs.",
        steps: [
          "Go to General Setups → Container Size or Container Type.",
          "Add sizes (20ft, 40ft, 40HC, etc.) and types (Dry, Reefer, Open Top, etc.).",
        ],
      },
      {
        id: "party-locations",
        title: "Party Locations",
        description: "Predefined shipping locations linked to parties.",
        steps: [
          "Go to General Setups → Party Locations.",
          "Link standard origin/destination locations to specific parties for faster data entry.",
        ],
      },
    ],
  },

  {
    id: "company-management",
    title: "Company Management",
    icon: <FiHome size={18} />,
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
    border: "border-indigo-200",
    topics: [
      {
        id: "company",
        title: "Company",
        description:
          "Configure the primary company profile — name, address, logo, and registration details.",
        steps: [
          "Go to Company Management → Company.",
          "Update the Company Name, Address, Phone, Email, NTN, and STRN fields.",
          "Upload the company logo — it appears on all printed documents.",
          "Save changes to apply them system-wide.",
        ],
        notes: ["Only administrators should modify company settings."],
      },
      {
        id: "branch",
        title: "Branch",
        description:
          "Manage multiple office branches or locations under the same company.",
        steps: [
          "Go to Company Management → Branch.",
          "Click New to create a branch. Enter Branch Name, Address, and assign it to the Company.",
          "Branches are used to segregate operations and financial reports by location.",
        ],
      },
    ],
  },

  {
    id: "parties-management",
    title: "Parties Management",
    icon: <FiUsers size={18} />,
    color: "bg-green-50 border-green-200 text-green-700",
    border: "border-green-200",
    topics: [
      {
        id: "parties",
        title: "Parties",
        description:
          "The central master record for all business partners — customers, vendors, agents, airlines, shipping lines, and more.",
        steps: [
          "Go to Parties Management → Parties.",
          "Click New to add a party. Fill in Party Name, Party Code, Party Type (Customer / Vendor / Agent / etc.), Address, Phone, and Email.",
          "Assign the applicable GL Account for AR (Accounts Receivable) or AP (Accounts Payable).",
          "Mark the party as Active or Inactive.",
          "Use the Search bar to quickly locate existing parties by name or code.",
        ],
        notes: [
          "Party Type determines where the party appears — e.g., Customers appear in GL Invoice, Vendors in GL Bill.",
          "Deactivating a party hides it from new transaction dropdowns but preserves historical data.",
        ],
      },
      {
        id: "contract",
        title: "Contracts",
        description:
          "Manage commercial agreements between your company and parties, including agreed rate schedules.",
        steps: [
          "Go to Parties Management → Contracts.",
          "Click New to create a contract. Select the Party, set the Contract Date range, and add rate line items.",
          "Contracts can be referenced when creating job orders to auto-apply agreed rates.",
        ],
      },
    ],
  },

  {
    id: "hr-management",
    title: "HR Management",
    icon: <FiUsers size={18} />,
    color: "bg-orange-50 border-orange-200 text-orange-700",
    border: "border-orange-200",
    topics: [
      {
        id: "department",
        title: "Departments",
        description: "Organize employees into functional departments.",
        steps: [
          "Go to HR Management → Department.",
          "Click New and enter the Department Name and any relevant details.",
          "Departments are linked to employees and cost centers for payroll allocation.",
        ],
      },
      {
        id: "designation",
        title: "Designations",
        description: "Define job titles and designations within the organization.",
        steps: [
          "Go to HR Management → Designation.",
          "Add designations such as Manager, Executive, Officer, etc.",
          "Designations are assigned to employees and appear on HR reports.",
        ],
      },
      {
        id: "employee",
        title: "Employees",
        description:
          "Maintain complete employee records including personal details, job assignment, and salary information.",
        steps: [
          "Go to HR Management → Employee.",
          "Click New to add an employee. Fill in Personal Info (Name, CNIC, Date of Birth), Employment Info (Department, Designation, Join Date), and Salary details.",
          "Upload employee photo and documents as needed.",
          "Mark employees as Active or Inactive.",
        ],
        notes: ["Employee records are linked to user accounts for portal login access."],
      },
    ],
  },

  {
    id: "jobs-management",
    title: "Jobs Management",
    icon: <FiPackage size={18} />,
    color: "bg-cyan-50 border-cyan-200 text-cyan-700",
    border: "border-cyan-200",
    topics: [
      {
        id: "job-order",
        title: "Job Order",
        description:
          "The core logistics record that tracks a shipment from origin to destination. All other jobs documents (AWB, BL) and financial transactions (Invoices, Bills) link back to a Job Order.",
        steps: [
          "Go to Jobs Management → Job Order.",
          "Click New to create a job. Select Service Type (Air, Sea, Land), Job Type (Import / Export / Local), and fill in Consignee, Shipper, Agent details.",
          "Add cargo details: commodity, weight, volume, packages.",
          "Add route information: Port of Loading, Port of Discharge, Final Destination.",
          "Save the Job — a unique Job Number is auto-generated.",
          "From the Job detail, create linked AWB or BL documents as required.",
        ],
        notes: [
          "Job Number is referenced across all invoices, bills, and fund requests.",
          "Job status progresses: Draft → In Progress → Completed → Closed.",
        ],
      },
      {
        id: "awb",
        title: "Air Waybill (AWB)",
        description:
          "Generate Air Waybill documents for air freight shipments linked to a Job Order.",
        steps: [
          "Go to Jobs Management → AWB, or create directly from a Job Order.",
          "Select the Job Order, Airline, and flight details.",
          "Enter AWB Number, Origin, Destination, Commodity, and weight/piece counts.",
          "Save and print the AWB for submission to the airline.",
        ],
      },
      {
        id: "bl",
        title: "Bill of Lading (BL)",
        description:
          "Generate Bill of Lading documents for sea freight shipments.",
        steps: [
          "Go to Jobs Management → BL, or create from a Job Order.",
          "Select the Job Order, Vessel, Voyage, Port of Loading, and Port of Discharge.",
          "Enter container details, commodity, and weight.",
          "Save and print the BL for submission to the shipping line.",
        ],
      },
      {
        id: "bank-letter",
        title: "Bank Letter",
        description:
          "Generate bank guarantee or assurance letters required for customs clearance.",
        steps: [
          "Go to Jobs Management → Bank Letter.",
          "Select the Job Order and Bank. Enter the guarantee amount and validity period.",
          "Save and print the letter on company letterhead.",
        ],
      },
      {
        id: "fund-requests",
        title: "Fund Requests (Internal & External)",
        description:
          "Manage cash and bank fund requests for job-related expenses.",
        steps: [
          "Go to Jobs Management → Internal Fund Request (Cash or Bank) or External Fund Request.",
          "Click New, select the Job Order, and enter the expense details and amount.",
          "Submit for approval. Approved requests move to the Approved tab.",
          "Once disbursed, mark as Settled.",
        ],
        notes: [
          "Internal Cash requests are for petty cash disbursements.",
          "Internal Bank requests trigger bank transfer instructions.",
          "External Fund Requests are for amounts payable to third parties.",
        ],
      },
    ],
  },

  {
    id: "accounts-management",
    title: "Accounts Management",
    icon: <FiDollarSign size={18} />,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    border: "border-purple-200",
    topics: [
      {
        id: "gl-accounts",
        title: "GL Accounts (Chart of Accounts)",
        description:
          "The chart of accounts defines all ledger accounts used in financial transactions. Every debit and credit in the system posts to a GL account.",
        steps: [
          "Go to Accounts Management → GL Accounts.",
          "Accounts are organized in a hierarchy: Group → Sub-Group → Account.",
          "Click New to add an account. Enter Account Name, Account Code, Account Type (Asset, Liability, Equity, Revenue, Expense), and Parent Group.",
          "Mark accounts as Active/Inactive.",
        ],
        notes: [
          "Do not modify or delete accounts that already have transactions posted against them.",
          "Standard accounts (AR, AP, Cash, Bank) are pre-configured during initial setup.",
        ],
      },
      {
        id: "gl-invoice",
        title: "GL Invoice",
        description:
          "Raise sales invoices to customers for services rendered (freight, handling, documentation charges, etc.).",
        steps: [
          "Go to Accounts Management → GL Invoice.",
          "Click New. Select Invoice Type (Sales Invoice).",
          "Select the Job Order (optional) and Billing Party (customer).",
          "Choose the Currency and Exchange Rate.",
          "Add detail lines: select a Charge, enter Cost, Quantity, Tax, and Discount. The Customer GL Account and Revenue GL Account are populated from the Charge Master.",
          "Review the totals and click Save (Draft).",
          "Once verified, click Process to finalize the invoice — processed invoices cannot be edited.",
          "Print or download the invoice PDF using the printer icon.",
        ],
        notes: [
          "Only Processed invoices appear in the GL Receipt/Payment dropdown.",
          "Job Order is optional — you can invoice without linking to a specific job.",
        ],
      },
      {
        id: "gl-bill",
        title: "GL Bill",
        description:
          "Record vendor/supplier bills for costs incurred (freight payable, agent charges, port charges, etc.).",
        steps: [
          "Go to Accounts Management → GL Bill.",
          "Click New. Bill Type is fixed to Purchase Invoice.",
          "Select the Job Order (optional) and Vendor (Pay To Party).",
          "Choose the Currency and Exchange Rate.",
          "Add detail lines: select a Charge, enter Cost, Quantity, Tax, and Discount.",
          "Save as Draft. Review and then click Process to finalise.",
          "Processed bills appear in the GL Payment dropdown for payment processing.",
        ],
        notes: [
          "Bill Type is locked to Purchase Invoice and cannot be changed.",
          "Processed bills cannot be edited — raise a credit note to correct errors.",
        ],
      },
      {
        id: "gl-receipt-payment",
        title: "GL Receipt / Payment",
        description:
          "Record cash or bank receipts from customers (Receipt) and payments to vendors (Payment). These automatically link to processed GL Invoices or GL Bills.",
        steps: [
          "Go to Accounts Management → GL Receipt/Payment.",
          "Click New. Select the Type: Receipt (from customer) or Payment (to vendor).",
          "Select Job Order (optional) — this filters the GL Invoice/Bill dropdown.",
          "Select the Pay To Party — for Receipt this is the customer; for Payment this is the vendor.",
          "Set the Currency, Exchange Rate, and Date.",
          "In the detail table, select the GL Invoice No (for Receipt) or GL Bill No (for Payment) — detail lines auto-fill from the selected document.",
          "Adjust amounts if making a partial payment/receipt.",
          "Save as Draft → get approval → Bulk Post to create the GL Voucher.",
        ],
        notes: [
          "Only Processed GL Invoices / GL Bills appear in the dropdown.",
          "If a Job Order is selected, only invoices/bills for that job are shown.",
          "If no job is selected but a party is selected, only that party's invoices/bills are shown.",
          "Bulk Post is restricted to Approved records only.",
          "Once posted, a General Voucher (RC-XXXX for Receipt, PY-XXXX for Payment) is auto-created.",
        ],
      },
      {
        id: "general-voucher",
        title: "General Voucher",
        description:
          "Manual double-entry journal vouchers for adjustments, accruals, and entries not covered by invoices or receipts.",
        steps: [
          "Go to Accounts Management → General Voucher.",
          "Click New. Enter Voucher Date, Reference Number, and Narration.",
          "Add detail lines with From Account, To Account, Amount, and Cost Center.",
          "Save as Draft. Review, then Post the voucher to commit it to the ledger.",
          "Posted vouchers cannot be edited.",
        ],
        notes: [
          "Vouchers with references starting PY- or RC- are system-generated from GL Receipt/Payment and cannot be edited manually.",
          "Posted vouchers cannot be edited regardless of source.",
          "Always enter both debit and credit lines to maintain double-entry balance.",
        ],
      },
    ],
  },

  {
    id: "user-management",
    title: "User Management",
    icon: <FiShield size={18} />,
    color: "bg-red-50 border-red-200 text-red-700",
    border: "border-red-200",
    topics: [
      {
        id: "users",
        title: "Users",
        description:
          "Manage portal user accounts — who can log in and what they can access.",
        steps: [
          "Go to User Management → Users.",
          "Click New to create a user. Enter Full Name, Email (used as login username), and set a temporary Password.",
          "Assign the user to a Role.",
          "Mark the user as Active.",
          "The user will receive login credentials and should change their password on first login.",
        ],
        notes: [
          "Deactivating a user prevents login but preserves their historical records.",
          "Each user must be assigned at least one Role to access any module.",
        ],
      },
      {
        id: "role",
        title: "Roles",
        description:
          "Roles are permission groups. Assign users to roles to control their access to modules and pages.",
        steps: [
          "Go to User Management → Roles.",
          "Click New to create a role. Enter a Role Name (e.g., Accounts Manager, Operations Staff).",
          "After creating the role, assign permissions via Role Rights.",
        ],
      },
      {
        id: "role-rights",
        title: "Role Rights",
        description:
          "Define which modules and pages each role can access, and what actions they can perform (View, Add, Edit, Delete, Post).",
        steps: [
          "Go to User Management → Role Rights.",
          "Select the Role from the dropdown.",
          "Check or uncheck permissions for each module and page.",
          "Save the configuration — changes take effect on the user's next login.",
        ],
        notes: [
          "Always follow the principle of least privilege — grant only the permissions a role needs.",
          "Test permissions by logging in with a test account assigned to the role.",
        ],
      },
    ],
  },

  {
    id: "reports",
    title: "Reports & Logs",
    icon: <FiBarChart2 size={18} />,
    color: "bg-teal-50 border-teal-200 text-teal-700",
    border: "border-teal-200",
    topics: [
      {
        id: "audit-logs",
        title: "Audit Logs",
        description:
          "Track every create, edit, and delete action performed by users across the system.",
        steps: [
          "Go to Reports → Audit Logs.",
          "Filter by Date Range, User, or Module to narrow results.",
          "Each log entry shows the User, Action, Module, Record ID, timestamp, and data changes.",
        ],
        notes: ["Audit logs are read-only and cannot be deleted."],
      },
      {
        id: "error-logs",
        title: "Error Logs",
        description:
          "View system-level errors and API failures for troubleshooting.",
        steps: [
          "Go to Reports → Error Logs.",
          "Filter by date or error type.",
          "Share error details with your system administrator or NJ IT Solutions support.",
        ],
      },
      {
        id: "notifications",
        title: "Notifications",
        description: "View system-generated alerts and workflow notifications.",
        steps: [
          "Go to Reports → Notifications.",
          "Notifications include approval requests, status changes, and system alerts.",
          "Mark notifications as read or archive them.",
        ],
      },
      {
        id: "group-rights",
        title: "Group Rights Report",
        description: "Review a consolidated view of all role permissions across the system.",
        steps: [
          "Go to Reports → Group Rights.",
          "Select a role or view all roles in a matrix format.",
          "Use this report to audit permissions before onboarding new users.",
        ],
      },
    ],
  },

  {
    id: "profile",
    title: "My Profile",
    icon: <FiUsers size={18} />,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    border: "border-yellow-200",
    topics: [
      {
        id: "profile-settings",
        title: "Profile Settings",
        description: "Update your personal details, display name, and password.",
        steps: [
          "Click your name/avatar in the top-right corner and select My Profile, or go to Management → Profile.",
          "Update your Display Name, Phone, and Profile Photo.",
          "To change your password: enter your Current Password, then the New Password (twice), and click Save.",
        ],
        notes: ["Use a strong password with at least 8 characters including numbers and symbols."],
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserGuideClient() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const lc = search.toLowerCase();
  const filtered = search
    ? sections
        .map((s) => ({
          ...s,
          topics: s.topics.filter(
            (t) =>
              t.title.toLowerCase().includes(lc) ||
              t.description.toLowerCase().includes(lc) ||
              s.title.toLowerCase().includes(lc) ||
              (t.steps || []).some((step) => step.toLowerCase().includes(lc)),
          ),
        }))
        .filter((s) => s.topics.length > 0)
    : sections;

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { threshold: 0.2 },
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className='flex min-h-screen bg-gray-50'>
      {/* ── Left TOC sidebar ─────────────────────────────────────────────── */}
      <aside className='hidden lg:flex flex-col w-60 shrink-0 border-r bg-white sticky top-0 h-screen overflow-y-auto'>
        <div className='p-4 border-b'>
          <div className='flex items-center gap-2 mb-3'>
            <FiBook className='text-blue-600' size={18} />
            <span className='font-bold text-sm text-gray-800'>User Guide</span>
          </div>
          <div className='relative'>
            <FiSearch size={13} className='absolute left-2.5 top-2.5 text-gray-400' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search guide...'
              className='pl-8 h-8 text-xs'
            />
            {search && (
              <button
                className='absolute right-2 top-2 text-gray-400 hover:text-gray-600'
                onClick={() => setSearch("")}
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        </div>
        <nav className='p-3 space-y-0.5 flex-1'>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors ${
                activeSection === s.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className={activeSection === s.id ? "text-blue-600" : "text-gray-400"}>
                {s.icon}
              </span>
              {s.title}
            </button>
          ))}
        </nav>
        <div className='p-3 border-t text-[10px] text-gray-400 text-center'>
          SASPAK Cargo ERP &copy; {new Date().getFullYear()}
          <br />Powered by NJ IT Solutions
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className='flex-1 overflow-auto'>
        {/* Header */}
        <div className='sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <FiBook className='text-blue-600' size={20} />
            <div>
              <h1 className='text-base font-bold text-gray-900'>SASPAK Cargo ERP — User Guide</h1>
              <p className='text-[11px] text-gray-500'>Complete reference for all modules and features</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='text-[10px] text-gray-500'>
              Last Updated: {new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
            </Badge>
            <Button
              size='sm'
              variant='outline'
              className='gap-1.5 text-xs'
              onClick={() => window.print()}
            >
              <FiPrinter size={13} /> Print
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className='lg:hidden px-4 pt-4'>
          <div className='relative'>
            <FiSearch size={13} className='absolute left-3 top-2.5 text-gray-400' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search user guide...'
              className='pl-9 text-xs'
            />
            {search && (
              <button
                className='absolute right-3 top-2.5 text-gray-400'
                onClick={() => setSearch("")}
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        </div>

        <div className='px-6 py-6 max-w-4xl space-y-10'>
          {/* Intro card */}
          {!search && (
            <Card className='border-blue-200 bg-blue-50/60'>
              <CardContent className='pt-5 pb-4'>
                <div className='flex gap-4'>
                  <div className='p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0'>
                    <FiBook size={22} />
                  </div>
                  <div>
                    <h2 className='text-sm font-bold text-gray-900 mb-1'>Welcome to SASPAK Cargo ERP</h2>
                    <p className='text-xs text-gray-600 leading-relaxed'>
                      This guide covers every module and page in the system — from initial setup to
                      day-to-day operations. Use the sidebar on the left to jump directly to any
                      section, or use the search box to find a specific topic. This guide is updated
                      continuously as new features are added.
                    </p>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {sections.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => scrollTo(s.id)}
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors ${s.color} hover:opacity-80`}
                        >
                          {s.icon}
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search results info */}
          {search && (
            <div className='flex items-center gap-2 text-xs text-gray-500'>
              <FiSearch size={13} />
              Showing results for <span className='font-medium text-gray-800'>"{search}"</span>
              &mdash; {filtered.reduce((a, s) => a + s.topics.length, 0)} topic(s) found
            </div>
          )}

          {/* Sections */}
          {filtered.map((section) => (
            <div
              key={section.id}
              id={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
            >
              {/* Section header */}
              <div className={`flex items-center gap-2.5 mb-4 pb-2 border-b-2 ${section.border}`}>
                <span className={`p-1.5 rounded-md ${section.color}`}>{section.icon}</span>
                <h2 className='text-base font-bold text-gray-900'>{section.title}</h2>
                <Badge variant='outline' className='text-[10px] ml-auto'>
                  {section.topics.length} topic{section.topics.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Topics */}
              <div className='space-y-5'>
                {section.topics.map((topic) => (
                  <div
                    key={topic.id}
                    id={topic.id}
                    className='rounded-lg border bg-white shadow-sm overflow-hidden'
                  >
                    <div className='px-5 py-3 border-b bg-gray-50/70 flex items-center gap-2'>
                      <FiChevronRight size={13} className='text-gray-400' />
                      <h3 className='text-sm font-semibold text-gray-800'>{topic.title}</h3>
                    </div>
                    <div className='px-5 py-4 space-y-3'>
                      <p className='text-xs text-gray-600 leading-relaxed'>{topic.description}</p>

                      {topic.steps && topic.steps.length > 0 && (
                        <div>
                          <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                            Step-by-Step
                          </p>
                          <ol className='space-y-1.5'>
                            {topic.steps.map((step, i) => (
                              <li key={i} className='flex gap-3 text-xs text-gray-700'>
                                <span className='shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center'>
                                  {i + 1}
                                </span>
                                <span className='leading-relaxed pt-0.5'>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {topic.notes && topic.notes.length > 0 && (
                        <div className='rounded-md bg-amber-50 border border-amber-200 px-4 py-2.5 space-y-1'>
                          <p className='text-[10px] font-bold text-amber-700 uppercase tracking-wide'>Notes</p>
                          {topic.notes.map((note, i) => (
                            <p key={i} className='text-[11px] text-amber-800 leading-relaxed'>
                              &bull; {note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className='text-center py-16 text-gray-400'>
              <FiSearch size={32} className='mx-auto mb-3 opacity-40' />
              <p className='text-sm'>No results found for "{search}"</p>
              <button
                className='mt-2 text-xs text-blue-500 hover:underline'
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            </div>
          )}

          {/* Footer */}
          {!search && (
            <div className='border-t pt-6 text-center text-[11px] text-gray-400 space-y-1'>
              <p className='font-medium text-gray-500'>SASPAK Cargo ERP &mdash; User Guide</p>
              <p>Powered by NJ IT Solutions &bull; This guide is updated as new features are released.</p>
              <p>For technical support, contact your system administrator.</p>
            </div>
          )}
        </div>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          aside, button, .sticky { display: none !important; }
          main { overflow: visible !important; }
          .rounded-lg, .border { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
