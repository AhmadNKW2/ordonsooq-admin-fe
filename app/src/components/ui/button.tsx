import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  // Accept native mouse event so consumers can access the event (e.g. stopPropagation)
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'outline' | 'solid';
  color?: string;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  isSquare?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'solid', color, disabled = false, className = '', type = 'button', isSquare = false }) => {

  const defaultVariantClasses = {
    solid: 'bg-secondary active:bg-secondary/75 hover:bg-secondary/80 text-white',
    outline: 'bg-white border border-primary2 text-primary2 hover:bg-primary2 hover:text-white active:bg-primary2 active:text-white',
  };

  const customVariantClasses = {
    solid: 'bg-[var(--button-color)] text-white hover:bg-[var(--button-color)] hover:opacity-80 active:bg-[var(--button-color)] active:opacity-70',
    outline: 'bg-white border border-[var(--button-color)] text-[var(--button-color)] hover:bg-[var(--button-color)] hover:text-white',
  };

  const variantClasses = color ? customVariantClasses : defaultVariantClasses;

  const buttonStyle: React.CSSProperties = color ? { '--button-color': color } as React.CSSProperties : {};

  const sizeClasses = isSquare ? 'w-11 h-11 p-0 flex items-center justify-center' : 'px-5 h-13';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`text-nowrap ${sizeClasses} rounded-r1 font-medium text-[16px] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      style={buttonStyle}
    >
      {children}
    </button>
  );
};