import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectOption } from './select';
import { Button } from './button';
import { Input } from './input';

export interface PaginationData {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  className?: string;
}

interface PaginationButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  title: string;
}

const PaginationButton: React.FC<PaginationButtonProps> = ({ onClick, disabled, icon, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-8 h-8 p-1 flex justify-center items-center rounded-rounded1 border border-fourth text-fourth hover:bg-fourth disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
    title={title}
  >
    {icon}
  </button>
);

interface PageNumberProps {
  page: number | string;
  isActive: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  index: number;
}

const PageNumber: React.FC<PageNumberProps> = ({ page, isActive, currentPage, onPageChange, index }) => {
  if (page === '...') {
    return <span className="px-3 py-2 text-gray-400">...</span>;
  }

  const pageNumber = page as number;

  return (
    <Button
      key={pageNumber}
      onClick={() => onPageChange(pageNumber)}
      isSquare
    >
      {pageNumber}
    </Button>
  );
};

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  className = '',
}) => {
  const { currentPage, totalPages, totalItems, pageSize, hasNextPage, hasPreviousPage } = pagination;
  const [goToPage, setGoToPage] = useState('');

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Number of page buttons to show

    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setGoToPage('');
    }
  };

  const handleGoToPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  return (
    <div className={`flex items-center justify-between gap-5 ${className}`}>
      {/* Left: Rows per page */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">
            Rows per page:
          </span>
          <div className="w-15">
            <Select
              value={String(pageSize)}
              onChange={(value) => onPageSizeChange(Number(value))}
              options={pageSizeOptions.map(option => ({
                value: String(option),
                label: String(option),
                disabled: totalItems < 10 ? true : (totalItems < 50 && option >= 50) || (totalItems >= 10 && totalItems < 50 && option === 10)
              }))}
              search={false}
              size="sm"
              disabled={totalItems < 10}
            />
          </div>
        </div>
      )}

      {/* Middle: Page controls */}
      <div className="flex items-center gap-2">
        <PaginationButton
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
          icon={<ChevronsLeft className="h-4 w-4" />}
          title="First page"
        />

        <PaginationButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          icon={<ChevronLeft className="h-4 w-4" />}
          title="Previous page"
        />

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => (
            <PageNumber
              key={`page-${index}`}
              page={page}
              isActive={page !== '...' && (page as number) === currentPage}
              currentPage={currentPage}
              onPageChange={onPageChange}
              index={index}
            />
          ))}
        </div>

        <PaginationButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          icon={<ChevronRight className="h-4 w-4" />}
          title="Next page"
        />

        <PaginationButton
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          icon={<ChevronsRight className="h-4 w-4" />}
          title="Last page"
        />
      </div>

      {/* Right: Go to page */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          Go to page:
        </span>
        <Input
          type="text"
          value={goToPage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoToPage(e.target.value)}
          onKeyDown={handleGoToPageKeyDown}
          placeholder="#"
          isNum={true}
          size="sm"
          className="w-15!"
          disabled={totalPages <= 1}
        />
        <div className='w-full'>
          <Button
            onClick={handleGoToPage}
            disabled={totalPages <= 1 || !goToPage || parseInt(goToPage, 10) < 1 || parseInt(goToPage, 10) > totalPages}
            isSquare={true}
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
};
