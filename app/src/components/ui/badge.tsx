import React from 'react';

type BadgeVariant = 'default' | 'success' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-fourth text-fourth border-fourth/40',
  success: 'bg-success/15 text-success border-success/40',
  danger: 'bg-danger/15 text-danger border-danger/40',
};

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => {
  return (
    <span className={`
      inline-flex items-center 
      px-3 py-1 
      rounded-full 
      text-xs font-semibold 
      border
      transition-all duration-200
      ${variantStyles[variant]} 
      ${className}
    `}>
      {children}
    </span>
  );
};
