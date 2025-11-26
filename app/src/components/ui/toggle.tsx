/**
 * Custom Toggle Component
 */

"use client";

import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}) => {
  return (
    <label
      className={`flex items-center space-x-3 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-14 h-7 rounded-full transition-colors ${
            checked ? "bg-fourth" : "bg-gray-300"
          } ${disabled ? "cursor-not-allowed" : ""}`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
              checked ? "translate-x-7 mt-0.5" : "translate-x-0.5 mt-0.5"
            }`}
          />
        </div>
      </div>
    </label>
  );
};
