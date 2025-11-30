import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'nested';
  noFlex?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default', noFlex = false }) => {
  const baseStyles = noFlex ? 'w-full' : 'flex flex-col gap-5 w-full';
  const variantStyles = variant === 'nested'
    ? 'bg-primary/5 p-4 rounded-r1 border border-primary/20'
    : 'p-5 rounded-r1 bg-white shadow-s1';

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </div>
  );
};