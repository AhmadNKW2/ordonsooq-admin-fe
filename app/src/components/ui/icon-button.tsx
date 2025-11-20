import React from 'react';
import { Eye, Edit, Trash2, Plus, Search, X, Check, Download, Upload, Save, Printer, RefreshCw } from 'lucide-react';

interface IconButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'view' | 'edit' | 'delete';
  disabled?: boolean;
  className?: string;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  variant = 'view',
  disabled = false,
  className = '',
  title,
}) => {
  const variantConfig = {
    view: { icon: Eye, styles: 'text-fifth hover:bg-fifth/15 hover:text-fifth active:bg-fifth/20' },
    edit: { icon: Edit, styles: 'text-sixth hover:bg-sixth/15 hover:text-sixth active:bg-sixth/20' },
    delete: { icon: Trash2, styles: 'text-danger hover:bg-danger/15 hover:text-danger active:bg-danger/20' },
  };

  const { icon: Icon, styles } = variantConfig[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-full inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      <Icon className="w-4 h-4 " />
    </button>
  );
};
