import React from 'react';

export type BadgeVariant = 'default' | 'default2' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' ;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary/15 text-primary border-primary/40',
  default2: 'bg-secondary/15 text-secondary border-secondary/40',
  primary: 'bg-primary text-white border-primary',
  secondary: 'bg-secondary text-white border-secondary',
  success: 'bg-success/15 text-success border-success/40',
  danger: 'bg-danger/15 text-danger border-danger/40',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
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
      transition-all duaration-300
      ${variantStyles[variant]} 
      ${className}
    `}>
      {children}
    </span>
  );
};
