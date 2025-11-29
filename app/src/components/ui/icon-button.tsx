import React from 'react';
import { Eye, Edit, Trash2, Check, X, LogOut } from 'lucide-react';

interface IconButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'view' | 'edit' | 'delete' | 'check' | 'cancel' | 'logout';
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
    view: { icon: Eye, styles: 'text-secondary hover:bg-secondary/15 hover:text-secondary active:bg-secondary/20' },
    edit: { icon: Edit, styles: 'text-primary hover:bg-primary/15 hover:text-primary active:bg-primary/20' },
    delete: { icon: Trash2, styles: 'text-danger hover:bg-danger/15 hover:text-danger active:bg-danger/20' },
    check: { icon: Check, styles: 'text-success hover:bg-success/15 active:bg-success/20' },
    logout: { icon: LogOut, styles: 'text-[#4a5565] hover:bg-[#4a5565]/10 hover:text-[#4a5565] active:bg-[#4a5565]/15' },
    cancel: { icon: X, styles: 'text-danger hover:bg-danger/15 hover:text-danger active:bg-danger/20' },
  };

  const { icon: Icon, styles } = variantConfig[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`z-10 p-2 rounded-full inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      <Icon className="w-4 h-4 " />
    </button>
  );
};
