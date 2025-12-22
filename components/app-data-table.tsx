/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  GroupingState,
  getGroupedRowModel,
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import AppLoader from "./app-loader";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

export function AppDataTable({
  data,
  columns,
  searchText,
  searchBy,
  loading,
  handleSelect = () => {},
  isPage = false,
  groupBy = [],
  isMultiSearch = false,
}: any) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  // Initialize component mount state
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle search text changes - only after mount
  React.useEffect(() => {
    if (isMounted && searchBy) {
      const column = table.getColumn(searchBy);
      if (column) {
        column.setFilterValue(searchText);
      }
    }
  }, [searchText, searchBy, isMounted]);

  // Handle row selection changes - only after mount
  React.useEffect(() => {
    if (isMounted) {
      handleSelect(rowSelection);
    }
  }, [rowSelection, isMounted, handleSelect]);

  // Handle groupBy changes - only after mount
  React.useEffect(() => {
    if (isMounted && groupBy.length > 0) {
      setGrouping(groupBy);
    }
  }, [groupBy, isMounted]);

  const table = useReactTable({
    data,
    columns,
    autoResetExpanded: false,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: isPage ? getPaginationRowModel() : undefined,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      rowSelection,
      grouping,
      expanded,
    },
  });

  // Don't render table until mounted to prevent state updates during initial render
  if (!isMounted) {
    return <AppLoader />;
  }

  if (loading) {
    return <AppLoader />;
  }

  return (
    <div className='w-full'>
      <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
        <Table>
          <TableHeader className='bg-gradient-to-r from-[#1A94D4] to-[#1A94D4]'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='hover:bg-transparent border-b border-blue-500'
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={`text-white font-semibold text-xs py-3 px-3 ${
                        isMultiSearch &&
                        header.column.getCanFilter() &&
                        "space-y-1.5"
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                      {header.column.getCanFilter() && isMultiSearch ? (
                        <input
                          type='text'
                          placeholder='Filter...'
                          className='w-full border border-blue-400 rounded px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white'
                          value={
                            (header.column.getFilterValue() || "") as string
                          }
                          onChange={(e) =>
                            header.column.setFilterValue(e.target.value)
                          }
                        />
                      ) : null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`
                    ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    hover:bg-blue-50 transition-colors border-b border-gray-100
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className='py-2.5 px-3 text-sm text-gray-700'
                      {...{
                        style: {
                          background: cell.getIsGrouped()
                            ? "#1e40af"
                            : cell.getIsAggregated()
                            ? "#f3f4f6"
                            : cell.getIsPlaceholder()
                            ? "#f9fafb"
                            : undefined,
                        },
                      }}
                    >
                      {cell.getIsGrouped() ? (
                        <div className='flex items-center'>
                          <button
                            {...{
                              onClick: row.getToggleExpandedHandler(),
                              className: `flex items-center gap-2 text-white font-medium text-sm py-1.5 px-3 rounded hover:bg-blue-800 transition-colors ${
                                row.getCanExpand()
                                  ? "cursor-pointer"
                                  : "cursor-default"
                              }`,
                            }}
                          >
                            <span className='text-base'>
                              {row.getIsExpanded() ? "▼" : "▶"}
                            </span>
                            <span>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </span>
                            <span className='ml-2 bg-white text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold'>
                              {row.subRows.length}
                            </span>
                          </button>
                        </div>
                      ) : cell.getIsAggregated() ? (
                        <span className='font-medium text-gray-900'>
                          {flexRender(
                            cell.column.columnDef.aggregatedCell ??
                              cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </span>
                      ) : cell.getIsPlaceholder() ? null : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow key={1} className='hover:bg-transparent'>
                <TableCell
                  colSpan={columns.length}
                  className='h-32 text-center bg-gray-50'
                >
                  <div className='flex flex-col items-center justify-center text-gray-500'>
                    <svg
                      className='w-12 h-12 mb-2 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                    <p className='text-sm font-medium'>No results found</p>
                    <p className='text-xs text-gray-400 mt-1'>
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isPage && (
        <div className='flex flex-col sm:flex-row justify-between items-center gap-3 py-3 px-1'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-gray-600 font-medium'>
              Showing{" "}
              <span className='font-semibold text-gray-900'>
                {table.getFilteredRowModel().rows?.length}
              </span>{" "}
              record{table.getFilteredRowModel().rows?.length !== 1 ? "s" : ""}
            </span>
            {table.getFilteredRowModel().rows?.length > 0 && (
              <span className='text-xs text-gray-500'>
                (Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()})
              </span>
            )}
          </div>

          <div className='flex items-center gap-1.5'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50'
            >
              <FiChevronsLeft className='h-3.5 w-3.5' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className='h-8 px-3 text-xs hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50'
            >
              <FiChevronLeft className='h-3.5 w-3.5 mr-1' />
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className='h-8 px-3 text-xs hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50'
            >
              Next
              <FiChevronRight className='h-3.5 w-3.5 ml-1' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50'
            >
              <FiChevronsRight className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
