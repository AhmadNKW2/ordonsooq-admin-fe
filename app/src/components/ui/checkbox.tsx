/**
 * Custom Checkbox Component
 */

"use client";

import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}) => {
  const uniqueId = React.useId();
  const checkboxId = `checkbox-${uniqueId}`;

  const inputClasses = `
    peer appearance-none h-[21px] w-[21px] outline-none inline-block align-top relative m-0 cursor-pointer
    border border-[#BBC1E1] bg-white rounded-[7px] transition-all duration-300
    checked:bg-fifth checked:border-fifth
    hover:enabled:border-fifth
    focus:ring-2 focus:ring-fifth/30
    disabled:bg-[#F6F8FF] disabled:cursor-not-allowed disabled:opacity-90
    disabled:checked:bg-[#E1E6F9] disabled:checked:border-[#BBC1E1]
    
    after:content-[''] after:block after:absolute after:left-[7px] after:top-[4px] 
    after:w-[5px] after:h-[9px] after:border-2 after:border-white 
    after:border-t-0 after:border-l-0 after:rotate-[20deg] after:opacity-0 
    after:transition-all after:duration-300
    
    checked:after:opacity-100 checked:after:rotate-[43deg]
  `.replace(/\s+/g, ' ').trim();

  const labelClasses = `
    inline-block align-middle cursor-pointer ml-2
    peer-disabled:cursor-not-allowed
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={`${className} inline-flex items-center`}>
      <input
        id={checkboxId}
        type="checkbox"
        className={inputClasses}
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      {label && (
        <label htmlFor={checkboxId} className={labelClasses}>
          {label}
        </label>
      )}
    </div>
  );
};
