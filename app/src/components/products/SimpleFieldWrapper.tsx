/**
 * Simple Field Wrapper for Form Fields
 * Simplified version for product form without focus/value state requirements
 */

import React, { ReactNode } from "react";

interface SimpleFieldWrapperProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const SimpleFieldWrapper: React.FC<SimpleFieldWrapperProps> = ({
  label,
  error,
  required,
  children,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};
