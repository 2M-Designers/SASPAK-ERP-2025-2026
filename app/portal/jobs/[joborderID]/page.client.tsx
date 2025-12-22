"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import AppLoader from "@/components/app-loader";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";

// Add proper type for props with children
interface TableCellProps {
  children: ReactNode;
  className?: string;
}

const TableCell = ({ children, className = "" }: TableCellProps) => (
  <div className={className}>{children}</div>
);

type JobOrderManagementProps = {
  initialData?: any[];
  companies?: any[];
  parties?: any[];
  ports?: any[];
};

// Dummy data based on your schema
const dummyJobOrders = [
  {
    JobId: 1,
    CompanyId: 1,
    JobNumber: "JOB-2024-001",
    OperationType: "Import",
    JobSubType: "FCL",
    FclLclType: "FCL",
    PartyId: 1,
    ShipperPartyId: 2,
    ConsigneePartyId: 3,
    NotifyParty1Id: 4,
    NotifyParty2Id: null,
    PrincipalId: 5,
    OverseasAgentId: 6,
    TransporterPartyId: 7,
    DepositorPartyId: 8,
    OriginPortId: 1,
    DestinationPortId: 2,
    VesselName: "MAERSK KOWLOON",
    VoyageNo: "2415E",
    EtdDate: "2024-01-15T00:00:00",
    EtaDate: "2024-02-01T00:00:00",
    VesselArrival: "2024-02-01T08:00:00",
    DeliverDate: "2024-02-05T00:00:00",
    FreeDays: 7,
    LastFreeDay: "2024-02-08T00:00:00",
    AdvanceRentPaidUpto: "2024-02-15T00:00:00",
    DispatchAddress: "Karachi Warehouse, SITE Area",
    GdType: "HC",
    OriginalDocsReceivedOn: "2024-01-20T00:00:00",
    CopyDocsReceivedOn: "2024-01-18T00:00:00",
    JobDescription: "Import of Electronics - FCL Container",
    LcNumber: "LC20240001",
    IgmNumber: "IGM-2024-12345",
    HblNumber: "HBLMAE2415001",
    MawbNumber: null,
    HawbNumber: null,
    Status: "In Progress",
    Remarks: "Awaiting customs clearance",
    CreatedBy: "admin",
    CreatedAt: "2024-01-10T10:00:00",
    UpdatedAt: "2024-01-25T14:30:00",
    Version: 1,
    CompanyName: "ABC Logistics",
    ShipperName: "Global Electronics Inc.",
    ConsigneeName: "Tech Importers Ltd.",
    OriginPortName: "Shanghai",
    DestinationPortName: "Karachi",
  },
  {
    JobId: 2,
    CompanyId: 2,
    JobNumber: "JOB-2024-002",
    OperationType: "Export",
    JobSubType: "LCL",
    FclLclType: "LCL",
    PartyId: 3,
    ShipperPartyId: 4,
    ConsigneePartyId: 5,
    NotifyParty1Id: 6,
    NotifyParty2Id: null,
    PrincipalId: 7,
    OverseasAgentId: 8,
    TransporterPartyId: 9,
    DepositorPartyId: 10,
    OriginPortId: 2,
    DestinationPortId: 3,
    VesselName: "MSC DIANA",
    VoyageNo: "152W",
    EtdDate: "2024-01-20T00:00:00",
    EtaDate: "2024-02-10T00:00:00",
    VesselArrival: "2024-02-09T12:00:00",
    DeliverDate: "2024-02-12T00:00:00",
    FreeDays: 5,
    LastFreeDay: "2024-02-14T00:00:00",
    AdvanceRentPaidUpto: "2024-02-20T00:00:00",
    DispatchAddress: "Factory Outlet, Industrial Zone",
    GdType: "IB",
    OriginalDocsReceivedOn: "2024-01-25T00:00:00",
    CopyDocsReceivedOn: "2024-01-22T00:00:00",
    JobDescription: "Export of Textile Goods - LCL Shipment",
    LcNumber: "LC20240002",
    IgmNumber: "IGM-2024-12346",
    HblNumber: "HBLMSC2415002",
    MawbNumber: null,
    HawbNumber: null,
    Status: "Completed",
    Remarks: "Shipment delivered successfully",
    CreatedBy: "manager",
    CreatedAt: "2024-01-15T09:00:00",
    UpdatedAt: "2024-02-12T16:45:00",
    Version: 1,
    CompanyName: "XYZ Freight",
    ShipperName: "Textile Manufacturers Co.",
    ConsigneeName: "Fashion Retailers Inc.",
    OriginPortName: "Karachi",
    DestinationPortName: "Dubai",
  },
  {
    JobId: 3,
    CompanyId: 1,
    JobNumber: "JOB-2024-003",
    OperationType: "Import",
    JobSubType: "Air",
    FclLclType: "AIR",
    PartyId: 5,
    ShipperPartyId: 6,
    ConsigneePartyId: 7,
    NotifyParty1Id: 8,
    NotifyParty2Id: 9,
    PrincipalId: 10,
    OverseasAgentId: 11,
    TransporterPartyId: 12,
    DepositorPartyId: 13,
    OriginPortId: 4,
    DestinationPortId: 2,
    VesselName: null,
    VoyageNo: null,
    EtdDate: "2024-01-25T00:00:00",
    EtaDate: "2024-01-26T00:00:00",
    VesselArrival: "2024-01-26T06:00:00",
    DeliverDate: "2024-01-27T00:00:00",
    FreeDays: 3,
    LastFreeDay: "2024-01-29T00:00:00",
    AdvanceRentPaidUpto: "2024-02-05T00:00:00",
    DispatchAddress: "Air Cargo Terminal, JIAP",
    GdType: "SB",
    OriginalDocsReceivedOn: "2024-01-26T00:00:00",
    CopyDocsReceivedOn: "2024-01-25T00:00:00",
    JobDescription: "Urgent Import of Pharmaceutical Samples",
    LcNumber: "LC20240003",
    IgmNumber: "IGM-2024-12347",
    HblNumber: null,
    MawbNumber: "MAWB12345678",
    HawbNumber: "HAWB87654321",
    Status: "In Progress",
    Remarks: "Customs inspection required",
    CreatedBy: "admin",
    CreatedAt: "2024-01-22T11:00:00",
    UpdatedAt: "2024-01-26T10:15:00",
    Version: 1,
    CompanyName: "ABC Logistics",
    ShipperName: "Pharma Solutions Inc.",
    ConsigneeName: "Medical Distributors Ltd.",
    OriginPortName: "Frankfurt",
    DestinationPortName: "Karachi",
  },
];

export default function JobOrderManagement({
  initialData = dummyJobOrders,
  companies = [],
  parties = [],
  ports = [],
}: JobOrderManagementProps) {
  const router = useRouter();

  const [data, setData] = useState<any[]>(initialData);
  const [filteredData, setFilteredData] = useState<any[]>(initialData);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  // State for filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [operationTypeFilter, setOperationTypeFilter] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<any>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<any>(null);
  const [companyFilter, setCompanyFilter] = useState<any>(null);

  // Fetch Job Orders
  const fetchJobData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setData(dummyJobOrders);
        setFilteredData(dummyJobOrders);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching job orders:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, []);

  // Handle search & filters
  useEffect(() => {
    let result = [...data];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.JobNumber?.toLowerCase().includes(searchLower) ||
          item.VesselName?.toLowerCase().includes(searchLower) ||
          item.JobDescription?.toLowerCase().includes(searchLower) ||
          item.HblNumber?.toLowerCase().includes(searchLower) ||
          item.MawbNumber?.toLowerCase().includes(searchLower)
      );
    }

    if (operationTypeFilter) {
      result = result.filter(
        (item) => item.OperationType === operationTypeFilter.value
      );
    }
    if (statusFilter) {
      result = result.filter((item) => item.Status === statusFilter.value);
    }
    if (jobTypeFilter) {
      result = result.filter((item) => item.JobSubType === jobTypeFilter.value);
    }
    if (companyFilter) {
      result = result.filter((item) => item.CompanyId === companyFilter.value);
    }

    setFilteredData(result);
  }, [
    searchText,
    operationTypeFilter,
    statusFilter,
    jobTypeFilter,
    companyFilter,
    data,
  ]);

  // Reset filters and refresh data
  const handleRefresh = () => {
    setSearchText("");
    setOperationTypeFilter(null);
    setStatusFilter(null);
    setJobTypeFilter(null);
    setCompanyFilter(null);
    fetchJobData();
  };

  // Handle delete job
  const handleDeleteJob = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job order?")) return;

    setDeletingJobId(jobId);
    try {
      // Simulate API call
      setTimeout(() => {
        const updatedData = data.filter((job) => job.JobId !== jobId);
        setData(updatedData);
        setFilteredData(updatedData);
        alert("Job order deleted successfully!");
        setDeletingJobId(null);
      }, 500);
    } catch (error) {
      console.error("Error deleting job order:", error);
      alert("Error deleting job order.");
      setDeletingJobId(null);
    }
  };

  // Handle navigation to create job
  const handleCreateJob = () => {
    router.push("/portal/job-orders/create");
  };

  // Handle navigation to edit job
  const handleEditJob = (job: any) => {
    router.push(`/job-orders/edit/${job.JobId}`);
  };

  // Handle navigation to view job details
  const handleViewJob = (job: any) => {
    router.push(`/job-orders/${job.JobId}`);
  };

  // Summary
  const summary = {
    total: filteredData.length,
    import: filteredData.filter((j) => j.OperationType === "Import").length,
    export: filteredData.filter((j) => j.OperationType === "Export").length,
    inProgress: filteredData.filter((j) => j.Status === "In Progress").length,
    completed: filteredData.filter((j) => j.Status === "Completed").length,
  };

  // Custom select styles for react-select
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
      minHeight: "42px",
      borderRadius: "8px",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#eff6ff"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#eff6ff",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  // Filter options
  const operationTypeOptions = [
    { value: "Import", label: "Import" },
    { value: "Export", label: "Export" },
  ];

  const statusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Pending", label: "Pending" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const jobTypeOptions = [
    { value: "FCL", label: "FCL" },
    { value: "LCL", label: "LCL" },
    { value: "Air", label: "Air" },
    { value: "BB", label: "BB" },
  ];

  const companyOptions =
    companies.length > 0
      ? companies
      : [
          { value: 1, label: "ABC Logistics" },
          { value: 2, label: "XYZ Freight" },
        ];

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "row",
      header: "S.No",
      cell: ({ row }) => (
        <TableCell className='text-center text-sm font-medium text-gray-600'>
          {parseInt(row.id) + 1}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "JobNumber",
      header: "Job Number",
      cell: ({ row }) => (
        <TableCell className='font-semibold text-gray-900'>
          {row.getValue("JobNumber")}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "OperationType",
      header: "Operation Type",
      cell: ({ row }) => {
        const operationType = row.getValue("OperationType") as string;
        const isImport = operationType === "Import";
        return (
          <TableCell>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                isImport
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {operationType}
            </span>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "JobSubType",
      header: "Job Type",
      cell: ({ row }) => (
        <TableCell>
          <span className='inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md text-xs font-medium'>
            {row.getValue("JobSubType")}
          </span>
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "VesselName",
      header: "Vessel/Flight",
      cell: ({ row }) => (
        <TableCell className='text-sm text-gray-700'>
          {row.getValue("VesselName") || "N/A"}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "VoyageNo",
      header: "Voyage No",
      cell: ({ row }) => (
        <TableCell className='text-sm text-gray-700'>
          {row.getValue("VoyageNo") || "N/A"}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "OriginPortName",
      header: "Origin",
      cell: ({ row }) => (
        <TableCell className='text-sm text-gray-700'>
          {row.getValue("OriginPortName")}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "DestinationPortName",
      header: "Destination",
      cell: ({ row }) => (
        <TableCell className='text-sm text-gray-700'>
          {row.getValue("DestinationPortName")}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "EtaDate",
      header: "ETA",
      cell: ({ row }) => {
        const etaDate = row.getValue("EtaDate");
        return (
          <TableCell>
            <div className='text-xs text-gray-600 font-medium'>
              {etaDate ? moment(etaDate).format("MMM DD, YYYY") : "N/A"}
            </div>
            <div className='text-xs text-gray-400'>
              {etaDate ? moment(etaDate).format("HH:mm A") : ""}
            </div>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "Status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("Status");
        const getStatusStyles = (status: string) => {
          switch (status) {
            case "Completed":
              return "bg-green-50 text-green-700 border-green-200";
            case "In Progress":
              return "bg-blue-50 text-blue-700 border-blue-200";
            case "Pending":
              return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "Cancelled":
              return "bg-red-50 text-red-700 border-red-200";
            default:
              return "bg-gray-50 text-gray-700 border-gray-200";
          }
        };

        return (
          <TableCell>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(
                status as string
              )}`}
            >
              {String(status)}
            </span>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "HblNumber",
      header: "HBL Number",
      cell: ({ row }) => (
        <TableCell className='text-sm text-gray-700 font-mono'>
          {row.getValue("HblNumber") || "N/A"}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "MawbNumber",
      header: "MAWB Number",
      cell: ({ row }) => (
        <TableCell className='text-sm text-gray-700 font-mono'>
          {row.getValue("MawbNumber") || "N/A"}
        </TableCell>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "CreatedAt",
      header: "Created On",
      cell: ({ row }) => {
        const createdAt = row.getValue("CreatedAt");
        return (
          <TableCell>
            <div className='text-xs text-gray-600 font-medium'>
              {createdAt ? moment(createdAt).format("MMM DD, YYYY") : "N/A"}
            </div>
            <div className='text-xs text-gray-400'>
              {createdAt ? moment(createdAt).format("HH:mm A") : ""}
            </div>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "actions",
      header: () => (
        <TableCell className='text-center text-xs font-semibold text-gray-600 uppercase tracking-wide'>
          Actions
        </TableCell>
      ),
      cell: ({ row }) => {
        const job = row.original;
        const isDeleting = deletingJobId === job.JobId;

        return (
          <TableCell>
            <div className='flex justify-center items-center space-x-2'>
              {/* Edit Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleEditJob(job)}
                className='h-8 w-8 p-0 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 hover:scale-105'
                title='Edit Job'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              </Button>

              {/* View Details Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleViewJob(job)}
                className='h-8 w-8 p-0 bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all duration-200 hover:scale-105'
                title='View Details'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                  />
                </svg>
              </Button>

              {/* Delete Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleDeleteJob(job.JobId)}
                disabled={isDeleting}
                className='h-8 w-8 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 transition-all duration-200 hover:scale-105'
                title='Delete Job'
              >
                {isDeleting ? (
                  <svg
                    className='animate-spin h-4 w-4 text-red-600'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    />
                  </svg>
                )}
              </Button>
            </div>
          </TableCell>
        );
      },
      enableColumnFilter: false,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-6'>
      <div className='max-w-8xl mx-auto'>
        {/* Header Section */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-6 mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between mb-4'>
            <div className='mb-4 lg:mb-0'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl'>
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2'
                    />
                  </svg>
                </div>
                <div>
                  <h1 className='text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
                    Job Order Management
                  </h1>
                  <p className='text-gray-600 text-sm'>
                    Manage shipping and logistics job orders
                  </p>
                </div>
              </div>
            </div>
            <div className='flex-shrink-0'>
              <Button
                onClick={handleCreateJob}
                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 rounded-lg px-6 py-2.5 transition-all duration-200 hover:shadow-lg flex items-center gap-2'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                Add New Job
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className='grid grid-cols-5 gap-4'>
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-600 font-medium text-xs uppercase tracking-wide'>
                    Total Jobs
                  </p>
                  <p className='text-2xl font-bold text-blue-700'>
                    {summary.total}
                  </p>
                </div>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-blue-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2'
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-green-600 font-medium text-xs uppercase tracking-wide'>
                    Import
                  </p>
                  <p className='text-2xl font-bold text-green-700'>
                    {summary.import}
                  </p>
                </div>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-green-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-orange-600 font-medium text-xs uppercase tracking-wide'>
                    Export
                  </p>
                  <p className='text-2xl font-bold text-orange-700'>
                    {summary.export}
                  </p>
                </div>
                <div className='p-2 bg-orange-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-orange-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-blue-50 to-cyan-50 border border-cyan-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-cyan-600 font-medium text-xs uppercase tracking-wide'>
                    In Progress
                  </p>
                  <p className='text-2xl font-bold text-cyan-700'>
                    {summary.inProgress}
                  </p>
                </div>
                <div className='p-2 bg-cyan-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-cyan-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-green-600 font-medium text-xs uppercase tracking-wide'>
                    Completed
                  </p>
                  <p className='text-2xl font-bold text-green-700'>
                    {summary.completed}
                  </p>
                </div>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <svg
                    className='w-4 h-4 text-green-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 mb-6'>
          {/* Filter Header with Toggle */}
          <div className='p-4 border-b border-gray-100'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-gray-100 rounded-lg'>
                  <svg
                    className='w-5 h-5 text-gray-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-800'>
                    Search & Filters
                  </h2>
                  <p className='text-gray-500 text-sm'>
                    Filter job orders by various criteria
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                {/* Active filters indicator */}
                {(operationTypeFilter ||
                  statusFilter ||
                  jobTypeFilter ||
                  companyFilter ||
                  searchText) && (
                  <div className='flex items-center space-x-2'>
                    <span className='bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium'>
                      {
                        [
                          operationTypeFilter,
                          statusFilter,
                          jobTypeFilter,
                          companyFilter,
                          searchText,
                        ].filter(Boolean).length
                      }{" "}
                      active
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleRefresh}
                      className='text-xs h-7 px-2 text-gray-600 hover:text-gray-800'
                    >
                      Clear all
                    </Button>
                  </div>
                )}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowFilters(!showFilters)}
                  className='flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                >
                  <span>{showFilters ? "Hide" : "Show"} Filters</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible Filter Content */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <div className='p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
                {/* Search Input */}
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='Search job orders...'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='pl-10 h-[42px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg'
                  />
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      className='h-5 w-5 text-gray-400'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </div>
                </div>

                {/* Operation Type Filter */}
                <Select
                  options={operationTypeOptions}
                  value={operationTypeFilter}
                  onChange={setOperationTypeFilter}
                  placeholder='Operation Type'
                  isClearable
                  styles={selectStyles}
                />

                {/* Status Filter */}
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder='Status'
                  isClearable
                  styles={selectStyles}
                />

                {/* Job Type Filter */}
                <Select
                  options={jobTypeOptions}
                  value={jobTypeFilter}
                  onChange={setJobTypeFilter}
                  placeholder='Job Type'
                  isClearable
                  styles={selectStyles}
                />

                {/* Company Filter */}
                <Select
                  options={companyOptions}
                  value={companyFilter}
                  onChange={setCompanyFilter}
                  placeholder='Company'
                  isClearable
                  styles={selectStyles}
                />
              </div>

              {/* Action buttons in filter section */}
              <div className='flex justify-end mt-4 pt-4 border-t border-gray-100'>
                <Button
                  onClick={handleRefresh}
                  className='bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white border-0 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center gap-2'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-50 rounded-lg'>
                <svg
                  className='w-5 h-5 text-blue-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-800'>
                  Job Orders Directory
                </h2>
                <p className='text-gray-600 text-sm'>
                  Showing {filteredData.length} of {data.length} job orders
                </p>
              </div>
            </div>
          </div>

          <div className='overflow-hidden'>
            <AppDataTable
              data={filteredData ?? []}
              loading={isLoading}
              columns={columns}
            />
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-2xl p-8 shadow-2xl'>
              <AppLoader />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
