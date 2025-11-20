import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { FieldWrapper, getFieldClasses } from './field-wrapper';

interface DatePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange?: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ label, error, className = '', value, onChange, onClear, disabled = false, minDate, maxDate, placeholder, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Parse date string in local timezone to avoid off-by-one errors
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const selectedDate = value ? parseLocalDate(value) : null;
    const [viewDate, setViewDate] = useState(selectedDate || new Date());
    
    const hasValue = Boolean(value);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setIsFocused(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const formatDate = (date: Date | null) => {
      if (!date) return '';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setIsFocused(!isOpen);
      }
    };

    const handleDateSelect = (date: Date) => {
      // Format as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      onChange?.(isoDate);
      setIsOpen(false);
      setIsFocused(false);
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        onChange?.('');
      }
    };

    const isDateDisabled = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      if (minDate && dateStr < minDate) return true;
      if (maxDate && dateStr > maxDate) return true;
      return false;
    };

    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
    };

    const generateCalendar = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);

      const days: (Date | null)[] = [];

      // Add empty cells for days before month starts
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }

      return days;
    };

    const goToPreviousMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const isToday = (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
      if (!selectedDate) return false;
      return date.toDateString() === selectedDate.toDateString();
    };

    const calendarDays = generateCalendar();

    return (
      <div ref={containerRef} className="relative">
        <FieldWrapper
          label={label}
          error={error}
          isFocused={isFocused}
          hasValue={hasValue}
          onClear={handleClear}
          rightIcon={<Calendar className="h-4 w-4" />}
          isClearButton={hasValue}
        >
          <div
            ref={ref}
            role="button"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={handleToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
              }
            }}
            className={`${getFieldClasses(error, hasValue, false, true, className)} cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            {...props}
          >
            <span className={hasValue ? 'text-third' : 'text-transparent'}>
              {formatDate(selectedDate) || 'placeholder'}
            </span>
          </div>
        </FieldWrapper>

        {/* Calendar Dropdown */}
        <div
          role="dialog"
          aria-label="Calendar"
          className={`absolute z-20 w-80 mt-1 bg-secondary border-2 border-primary rounded-rounded1 shadow-lg transition-all duration-200 origin-top ${
            isOpen
              ? 'opacity-100 scale-y-100 visible'
              : 'opacity-0 scale-y-95 invisible'
          }`}
        >
          <div className="p-4">
            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-primary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-fifth"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-third" />
              </button>
              <div className="text-third font-semibold">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-primary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-fifth"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5 text-third" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const disabled = isDateDisabled(date);
                const selected = isSelected(date);
                const today = isToday(date);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !disabled && handleDateSelect(date)}
                    disabled={disabled}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-fifth ${
                      disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : selected
                        ? 'bg-fifth text-white'
                        : today
                        ? 'bg-primary border-2 border-fifth text-fifth'
                        : 'text-third hover:bg-primary'
                    }`}
                    aria-label={formatDate(date)}
                    aria-selected={selected}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
