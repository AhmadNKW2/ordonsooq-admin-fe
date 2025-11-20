import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { FieldWrapper, getFieldClasses, FIELD_ICON_CLASSES } from './field-wrapper';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  variant?: 'default' | 'search';
  onClear?: () => void;
  isNum?: boolean;
  size?: 'default' | 'sm';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', value, onChange, onFocus, onBlur, variant = 'default', onClear, isNum = false, size = 'default', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(value && String(value).length > 0);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const isSearch = variant === 'search';
    const hasRightIcon = isNum;

    const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNum) {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
          onChange?.(e);
        }
      } else {
        onChange?.(e);
      }
    };

    return (
      <FieldWrapper
        label={label}
        error={error}
        isFocused={isFocused}
        hasValue={hasValue}
        onClear={handleClear}
        leftIcon={isSearch ? <Search className={FIELD_ICON_CLASSES} /> : undefined}
        rightIcon={isNum ? <span className={`${FIELD_ICON_CLASSES} inline-block`}>#</span> : undefined}
        labelLeftOffset={isSearch ? 'left-9' : 'left-8'}
        isClearButton={size === 'sm' ? false : true}
        size={size}
      >
        <input
          ref={ref}
          value={value}
          onChange={handleNumChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=" "
          className={getFieldClasses(error, hasValue, isSearch, hasRightIcon, className, size)}
          {...props}
        />
      </FieldWrapper>
    );
  }
);

Input.displayName = 'Input';
