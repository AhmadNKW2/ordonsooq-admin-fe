/**
 * Custom Toggle Component
 */

"use client";

import React from "react";

// Cross icon SVG component
const CrossIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 365.696 365.696"
    width="6"
    height="6"
  >
    <path
      fill="currentColor"
      d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25zm0 0"
    />
  </svg>
);

// Checkmark icon SVG component
const CheckmarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="10"
    height="10"
  >
    <path
      fill="currentColor"
      d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z"
    />
  </svg>
);

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
      className={`inline-flex items-center gap-3 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {label && <span className="text-sm font-medium">{label}</span>}
      <span className="inline-block">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="hidden peer"
        />
        {/* Slider */}
        <div
          className={`
            box-border w-[46px] h-6 rounded-full flex items-center relative cursor-pointer
            transition-all duaration-300 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
            ${checked ? "bg-[rgb(0,218,80)]" : "bg-[rgb(131,131,131)]"}
          `}
        >
          {/* Effect line */}
          <div
            className={`
              absolute w-[9px] h-[3.5px] bg-white rounded-[1px]
              transition-all duaration-300 ease-in-out
              ${checked ? "left-[calc(100%-9px-4.5px-3px)]" : "left-[calc(3px+4.5px)]"}
            `}
          />
          {/* Circle */}
          <div
            className={`
              w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center
              absolute z-1
              transition-all duaration-300 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
              ${checked 
                ? "left-[calc(100%-18px-3px)] shadow-[-1px_1px_2px_rgba(163,163,163,0.45)]" 
                : "left-[3px] shadow-[1px_1px_2px_rgba(146,146,146,0.45)]"
              }
            `}
          >
            <CrossIcon
              className={`
                absolute h-auto transition-all duaration-300 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
                w-1.5 text-[rgb(131,131,131)]
                ${checked ? "scale-0" : "scale-100"}
              `}
            />
            <CheckmarkIcon
              className={`
                absolute h-auto transition-all duaration-300 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
                w-2.5 text-[rgb(0,218,80)]
                ${checked ? "scale-100" : "scale-0"}
              `}
            />
          </div>
        </div>
      </span>
    </label>
  );
};
