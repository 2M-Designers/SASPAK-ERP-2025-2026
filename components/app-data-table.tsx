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
      <div className='border'>
        <Table>
          <TableHeader className='bg-[#1A94D4]'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={`text-white ${
                        isMultiSearch &&
                        header.column.getCanFilter() &&
                        "flex items-center justify-center"
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanFilter() && isMultiSearch ? (
                        <input
                          type='text'
                          className='ml-auto w-34 border shadow pl-1 text-black'
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      {...{
                        style: {
                          background: cell.getIsGrouped()
                            ? "#06163C"
                            : cell.getIsAggregated()
                            ? "#E1E3E5"
                            : cell.getIsPlaceholder()
                            ? "#E1E3E5"
                            : "#F5F5F5",
                        },
                      }}
                    >
                      {cell.getIsGrouped() ? (
                        <div className='flex items-center justify-center'>
                          <button
                            {...{
                              onClick: row.getToggleExpandedHandler(),
                              style: {
                                cursor: row.getCanExpand()
                                  ? "pointer"
                                  : "normal",
                                color: "white",
                              },
                            }}
                          >
                            {row.getIsExpanded() ? "👇" : "👉"}{" "}
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}{" "}
                            ({row.subRows.length})
                          </button>
                        </div>
                      ) : cell.getIsAggregated() ? (
                        flexRender(
                          cell.column.columnDef.aggregatedCell ??
                            cell.column.columnDef.cell,
                          cell.getContext()
                        )
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
              <TableRow key={1}>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center bg-[#F5F5F5]'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isPage && (
        <div className='flex justify-between items-center py-4'>
          <div>
            <span>{table.getFilteredRowModel().rows?.length} Record(s)</span>
          </div>

          <div className='space-x-2'>
            <Button
              variant='outline'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
