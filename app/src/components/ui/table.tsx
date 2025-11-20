import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-auto rounded-rounded1 border border-primary">
      <table className={`w-full border-collapse ${className}`}>
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
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-bw1 divide-y divide-bw2 ${className}`}>
      {children}
    </tbody>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <th className={`px-6 py-4 text-left text-sm font-semibold tracking-wider ${className}`}>
      {children}
    </th>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 text-sm text-gray-900 text-start ${className}`}>
      {children}
    </td>
  );
};

// Variant 2 - Centered with gray background
interface Table2Props {
  children: React.ReactNode;
  className?: string;
}

export const Table2: React.FC<Table2Props> = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-auto rounded-rounded1 border-2 border-gray-200">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
};

interface TableHeader2Props {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader2: React.FC<TableHeader2Props> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-50 border-b-2 border-gray-200 ${className}`}>
      {children}
    </thead>
  );
};

interface TableBody2Props {
  children: React.ReactNode;
  className?: string;
}

export const TableBody2: React.FC<TableBody2Props> = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
};

interface TableRow2Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow2: React.FC<TableRow2Props> = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableHead2Props {
  children: React.ReactNode;
  className?: string;
}

export const TableHead2: React.FC<TableHead2Props> = ({ children, className = '' }) => {
  return (
    <th className={`px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

interface TableCell2Props {
  children: React.ReactNode;
  className?: string;
}

export const TableCell2: React.FC<TableCell2Props> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 text-sm text-gray-900 text-center ${className}`}>
      {children}
    </td>
  );
};
