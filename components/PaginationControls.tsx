// ============================================
// COMPONENT: Pagination Controls
// File: @/components/PaginationControls.tsx
// ============================================

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className='flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200'>
      <div className='flex items-center gap-2'>
        <p className='text-sm text-gray-700'>
          Page <span className='font-medium'>{currentPage}</span> of{" "}
          <span className='font-medium'>{totalPages}</span>
        </p>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className='h-4 w-4' />
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
