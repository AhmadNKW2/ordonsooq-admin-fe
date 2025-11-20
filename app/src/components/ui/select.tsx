import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { FieldWrapper, getFieldClasses, FIELD_ICON_CLASSES } from './field-wrapper';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onClear?: () => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  search?: boolean;
  multiple?: boolean;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ label, error, className = '', value, onChange, onClear, options, placeholder, disabled = false, search = true, multiple = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    const selectedValues = multiple 
      ? (Array.isArray(value) ? value : [])
      : (value ? [value as string] : []);
    
    const hasValue = selectedValues.length > 0;

    const getDisplayValue = () => {
      if (!hasValue) return '';
      
      if (multiple) {
        const selectedLabels = selectedValues
          .map(val => options.find(opt => opt.value === val)?.label)
          .filter(Boolean);
        return selectedLabels.join(', ');
      }
      
      return options.find(opt => opt.value === selectedValues[0])?.label || '';
    };

    const displayValue = getDisplayValue();

    // Filter options based on search query
    const filteredOptions = search && searchQuery
      ? options.filter(opt => 
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setIsFocused(false);
          setSearchQuery('');
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        // Focus search input when dropdown opens
        if (search) {
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, search]);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setIsFocused(!isOpen);
        if (isOpen) {
          setSearchQuery('');
        }
      }
    };

    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
        setIsOpen(false);
        setIsFocused(false);
        setSearchQuery('');
      }
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        onChange?.(multiple ? [] : '');
      }
      setSearchQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setIsFocused(true);
        }
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsFocused(false);
        setSearchQuery('');
      } else if (e.key === 'ArrowDown' && isOpen && !search) {
        e.preventDefault();
        // Focus first option
        const firstOption = containerRef.current?.querySelector('[role="option"]:not([aria-disabled="true"])') as HTMLElement;
        firstOption?.focus();
      }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent, optionValue: string, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(optionValue);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextOption = containerRef.current?.querySelectorAll('[role="option"]:not([aria-disabled="true"])')[index + 1] as HTMLElement;
        if (nextOption) {
          nextOption.focus();
        } else if (search) {
          searchInputRef.current?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (index === 0) {
          if (search) {
            searchInputRef.current?.focus();
          } else {
            (containerRef.current?.querySelector('[role="combobox"]') as HTMLElement)?.focus();
          }
        } else {
          const prevOption = containerRef.current?.querySelectorAll('[role="option"]:not([aria-disabled="true"])')[index - 1] as HTMLElement;
          prevOption?.focus();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
        setSearchQuery('');
        (containerRef.current?.querySelector('[role="combobox"]') as HTMLElement)?.focus();
      }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const firstOption = containerRef.current?.querySelector('[role="option"]:not([aria-disabled="true"])') as HTMLElement;
        firstOption?.focus();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
        setSearchQuery('');
        (containerRef.current?.querySelector('[role="combobox"]') as HTMLElement)?.focus();
      }
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <FieldWrapper
          label={label}
          error={error}
          isFocused={isFocused}
          hasValue={hasValue}
          onClear={handleClear}
          rightIcon={<ChevronDown className={`${FIELD_ICON_CLASSES} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
          isClearButton={true}
          disabled={disabled}
        >
          <div
            ref={ref}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="select-dropdown"
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={`${getFieldClasses(error, hasValue, false, true, className)} ${disabled ? '' : 'cursor-pointer'} ${multiple && hasValue ? 'py-1.5!' : ''}`}
            {...props}
          >
            {multiple && hasValue ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedValues.map((val) => {
                  const option = options.find(opt => opt.value === val);
                  return (
                    <div
                      key={val}
                      className="inline-flex items-center bg-sixth/10 text-sixth rounded-full px-2.5 py-1 text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <span>{option?.label || val}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(val);
                        }}
                        className="ml-1.5 text-sixth hover:text-sixth/80 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className={hasValue ? 'text-third' : 'text-transparent'}>
                {displayValue || 'placeholder'}
              </span>
            )}
          </div>
        </FieldWrapper>

        {/* Dropdown Menu */}
        <div
          id="select-dropdown"
          role="listbox"
          aria-multiselectable={multiple}
          className={`absolute z-20 w-full mt-1 bg-secondary border-2 border-primary overflow-hidden rounded-rounded1 shadow-lg transition-all duration-200 origin-top ${
            isOpen
              ? 'opacity-100 scale-y-100 visible'
              : 'opacity-0 scale-y-95 invisible'
          }`}
        >
          {/* Search Input */}
          {search && (
            <div className="p-2 border-b-2 border-primary">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${FIELD_ICON_CLASSES} pointer-events-none`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search..."
                  className={`w-full pl-9 pr-3 py-2 border-2 border-primary rounded-rounded1 bg-secondary text-third placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fifth focus:border-transparent transition-[border-color,box-shadow,background-color]`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto max-h-60">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                {search && searchQuery ? 'No results found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    tabIndex={option.disabled ? -1 : 0}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    onKeyDown={(e) => !option.disabled && handleOptionKeyDown(e, option.value, index)}
                    className={`cursor-pointer transition-colors flex items-center gap-2 px-4 py-3 ${
                      option.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-primary focus:bg-primary focus:outline-none'
                    } ${isSelected ? 'bg-primary text-fourth font-medium' : 'text-third'}`}
                  >
                    {multiple && (
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-fourth border-fourth' : 'border-primary'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                    <span>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
