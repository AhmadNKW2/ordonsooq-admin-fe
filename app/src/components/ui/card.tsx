import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-5 p-5 rounded-rounded1 bg-secondary shadow-shadow1 w-full ${className}`}>
      {children}
    </div>
  );
};