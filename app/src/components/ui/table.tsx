import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto overflow-y-visible rounded-rounded1 border border-primary shadow-shadow1">
      <table className={`w-full border-collapse table-layout-fixed bg-white ${className}`} style={{ tableLayout: 'fixed' }}>
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return (
    <thead className={`rounded-rounded1 bg-fourth p-3 text-white ${className}`}>
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '', emptyMessage = "No data available" }) => {
  const isEmpty = React.Children.count(children) === 0;

  return (
    <tbody className={`${className}`}>
      {isEmpty ? (
        <tr>
          <td colSpan={100} className="h-96 text-center">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="bg-gray-50 p-4 rounded-full mb-3">
                <Inbox className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">{emptyMessage}</p>
              <p className="text-sm text-gray-500 mt-1">
                There are no items to display at the moment.
              </p>
            </div>
          </td>
        </tr>
      ) : (
        children
      )}
    </tbody>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = '', onClick, style }, ref) => {
    return (
      <tr
        ref={ref}
        className={`transition-all duration-200 border-b border-fifth last:border-b-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
        style={{ height: '65px', ...style }}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  width?: string;
  sortable?: boolean;
  sortKey?: string;
  currentSort?: { key: string; order: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className = '',
  width,
  sortable = false,
  sortKey,
  currentSort,
  onSort
}) => {
  const isSorted = currentSort?.key === sortKey;
  const sortOrder = isSorted ? currentSort?.order : null;

  const handleClick = () => {
    if (sortable && sortKey && onSort) {
      onSort(sortKey);
    }
  };

  return (
    <th
      className={`px-6 py-2 text-left text-sm font-semibold tracking-wider ${sortable ? 'cursor-pointer select-none hover:bg-fourth/90' : ''} ${className}`}
      style={{ width }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="inline-flex">
            {!isSorted && <ArrowUpDown className="w-4 h-4 opacity-50" />}
            {isSorted && sortOrder === 'asc' && <ArrowUp className="w-4 h-4" />}
            {isSorted && sortOrder === 'desc' && <ArrowDown className="w-4 h-4" />}
          </span>
        )}
      </div>
    </th>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  width?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '', width }) => {
  return (
    <td className={`px-6 py-2 text-sm text-gray-900 text-start overflow-visible ${className}`} style={{ width }}>
      {children}
    </td>
  );
};

