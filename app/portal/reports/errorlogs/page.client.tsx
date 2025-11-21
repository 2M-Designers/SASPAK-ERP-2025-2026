"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppDataTable } from "@/components/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import AppLoader from "@/components/app-loader";
import Link from "next/link";
import { Edit, Flag } from "lucide-react";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type HomePageClientProps = {
  initialData: any[];
};

export default function ClientComponent({ initialData }: HomePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<any[]>(initialData);
  const [filteredData, setFilteredData] = useState<any[]>(initialData);
  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(
    searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : null
  );
  const [toDate, setToDate] = useState<Date | null>(
    searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFilteredData(initialData);
  }, [initialData]);

  // Function to fetch data based on date filters
  const fetchFilteredData = async () => {
    setIsLoading(true);

    const params = new URLSearchParams();
    //params.append("taskStatusID", "1"); // Default parameter for pending tasks

    if (fromDate)
      params.append("dateFrom", moment(fromDate).format("YYYY-MM-DD"));
    if (toDate) params.append("dateTo", moment(toDate).format("YYYY-MM-DD"));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}Utility/GetAllErrorLogs`
      );
      if (response.ok) {
        const result = await response.json();
        setFilteredData(result);
      }
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }

    setIsLoading(false);
  };

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchText(text);
    const filtered = data.filter((item) =>
      item.licensePlate?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  // Reset filters and refresh data
  const handleRefresh = () => {
    setFromDate(null);
    setToDate(null);
    setSearchText("");
    setFilteredData(data);
    router.push("/portal/reports/errorlogs");
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "row",
      header: "S.No",
      cell: ({ row }) => parseInt(row.id) + 1,
      enableColumnFilter: false,
    },
    {
      accessorKey: "errorLogID",
      header: "Error Log ID",
      cell: ({ row }) => row.getValue("errorLogID"),
      enableColumnFilter: false,
    },
    {
      accessorKey: "errorMessage",
      header: "Error Message",
      cell: ({ row }) => row.getValue("errorMessage"),
      enableColumnFilter: false,
    },
    {
      accessorKey: "additionalInfo",
      header: "Additional Information",
      cell: ({ row }) => row.getValue("additionalInfo"),
      enableColumnFilter: false,
    },
    {
      accessorKey: "errorTime",
      header: "Entered On",
      cell: ({ row }) =>
        moment(row.getValue("errorTime")).format("YYYY-MM-DD HH:mm A"), // Date + Time Format
      enableColumnFilter: false,
    },
  ];

  return (
    <div className='p-6 bg-white shadow-md rounded-md'>
      <h1 className='text-2xl font-bold mb-4'>Error Logs</h1>

      {/* Date Filters 
      <div className='flex flex-wrap gap-4 mb-4'>
        <DatePicker
          selected={fromDate}
          onChange={(date) => setFromDate(date)}
          placeholderText='📅 From Date'
          className='px-3 py-2 border rounded-md'
        />
        <DatePicker
          selected={toDate}
          onChange={(date) => setToDate(date)}
          placeholderText='📅 To Date'
          className='px-3 py-2 border rounded-md'
        />
        <Button onClick={fetchFilteredData}>🔍 Apply Filter</Button>
      </div>
      */}

      {/* Search & Actions */}
      <div className='flex justify-between mb-4'>
        <Input
          type='text'
          placeholder='🔍 Search by Error Message'
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <div className='flex gap-3'>
          <Button onClick={handleRefresh}>🔄 Refresh</Button>
          {/*<Link href='/portal/management/tasks/add'>
            <Button>➕ Add Task to Cleaner</Button>
          </Link>*/}
        </div>
      </div>

      {/* Data Table */}
      <AppDataTable
        data={filteredData ?? []}
        loading={isLoading}
        columns={columns}
      />

      {isLoading && <AppLoader />}
    </div>
  );
}
