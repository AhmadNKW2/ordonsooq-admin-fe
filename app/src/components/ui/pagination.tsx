import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select } from './select'; // Ensure this imports your FIXED Select component
import { Button } from './button';
import { Input } from './input';
import { Card } from './card';

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
    className="w-8 h-8 p-1 flex justify-center items-center rounded-r1 border border-primary2 text-primary2 hover:bg-primary2 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duaration-300"
    title={title}
  >
    {icon}
  </button>
);

interface PageNumberProps {
  page: number;
  isActive: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  index: number;
}

const PageNumber: React.FC<PageNumberProps> = ({ page, isActive, currentPage, onPageChange }) => {
  const pageNumber = page as number;

  return (
    <Button
      key={pageNumber}
      onClick={() => onPageChange(pageNumber)}
      variant={isActive ? "solid" : "outline"}
      isSquare
      color={isActive ? 'var(--color-secondary)' : 'var(--color-primary2)'}
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
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

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
    <Card>
      <div className={`flex items-center justify-between gap-5 ${className}`}>
        {/* Left: Rows per page */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm  whitespace-nowrap">
              Rows per page:
            </span>
            <div className="w-18"> {/* Slightly wider to fit "100" cleanly */}
              <Select
                value={String(pageSize)}
                onChange={(value) => onPageSizeChange(Number(value))}
                options={pageSizeOptions.map(option => ({
                  value: String(option),
                  label: String(option),
                  disabled: 
                    (option === 10 && totalItems < 10) ||
                    (option === 20 && totalItems < 10) ||
                    (option === 50 && totalItems <= 20) ||
                    (option === 100 && totalItems <= 50)
                }))}
                search={false}
                disabled={totalItems < 10}
                size='sm'
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
                isActive={page === currentPage}
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
          <span className="text-sm  whitespace-nowrap">
            Go to page:
          </span>
          <Input
            type="text"
            value={goToPage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoToPage(e.target.value)}
            onKeyDown={handleGoToPageKeyDown}
            isNum={true}
            size="sm"
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
    </Card>
  );
};