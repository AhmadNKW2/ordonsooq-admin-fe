import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { FieldWrapper, getFieldClassesBySize, FIELD_RIGHT_ICON_COLOR } from './field-wrapper';

interface DatePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string | boolean;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange?: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  /** ISO format "YYYY-MM-DD" — dates before this are disabled */
  min?: string;
  /** ISO format "YYYY-MM-DD" — dates after this are disabled */
  max?: string;
  /** @deprecated use min instead */
  minDate?: string;
  /** @deprecated use max instead */
  maxDate?: string;
  placeholder?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Parse an ISO "YYYY-MM-DD" string in local time (avoids UTC shift off-by-one). */
function parseLocal(str?: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ label, error, className = '', value, onChange, onClear, disabled = false, min, max, minDate, maxDate, placeholder, ...props }, ref) => {
    const resolvedMin = min || minDate;
    const resolvedMax = max || maxDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minParsed = parseLocal(resolvedMin);
    const maxParsed = parseLocal(resolvedMax);
    const selected = parseLocal(value);

    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

    const containerRef = useRef<HTMLDivElement>(null);
    const hasValue = Boolean(selected);

    // Keep calendar view in sync when value changes externally
    useEffect(() => {
      if (selected) {
        setViewYear(selected.getFullYear());
        setViewMonth(selected.getMonth());
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setIsFocused(false);
        }
      };
      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const openCalendar = () => {
      if (disabled) return;
      setIsOpen(true);
      setIsFocused(true);
    };

    const closeCalendar = () => {
      setIsOpen(false);
      setIsFocused(false);
    };

    const handleToggle = () => (isOpen ? closeCalendar() : openCalendar());

    const handleClear = () => {
      onClear?.();
      onChange?.('');
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
      else setViewMonth((m) => m - 1);
    };

    const handleNextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
      else setViewMonth((m) => m + 1);
    };

    const handleSelectDay = (year: number, month: number, day: number) => {
      const d = new Date(year, month, day);
      onChange?.(toISO(d));
      closeCalendar();
    };

    const isDisabled = (year: number, month: number, day: number): boolean => {
      const d = new Date(year, month, day);
      if (minParsed && d < minParsed) return true;
      if (maxParsed && d > maxParsed) return true;
      return false;
    };

    const isTodayCell = (year: number, month: number, day: number): boolean =>
      day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isSelectedCell = (year: number, month: number, day: number): boolean =>
      !!selected &&
      day === selected.getDate() &&
      month === selected.getMonth() &&
      year === selected.getFullYear();

    // Build 6×7 grid with leading/trailing days from adjacent months
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const totalCurrent = daysInMonth(viewYear, viewMonth);
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const totalPrev = daysInMonth(prevYear, prevMonthIdx);
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;

    type Cell = { year: number; month: number; day: number; current: boolean };
    const cells: Cell[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--)
      cells.push({ year: prevYear, month: prevMonthIdx, day: totalPrev - i, current: false });
    for (let d = 1; d <= totalCurrent; d++)
      cells.push({ year: viewYear, month: viewMonth, day: d, current: true });
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++)
      cells.push({ year: nextYear, month: nextMonthIdx, day: d, current: false });

    // Trigger classes — identical source as Input and Select
    const triggerClasses = getFieldClassesBySize('default', error, hasValue, false, false, className);

    const chevron = (
      <ChevronDown
        className={`h-4 w-4 ${FIELD_RIGHT_ICON_COLOR} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    );

    return (
      <div ref={containerRef} className="relative w-full">
        <FieldWrapper
          label={label}
          error={error}
          isFocused={isFocused}
          hasValue={hasValue}
          onClear={handleClear}
          rightIcon={chevron}
          isClearButton
          disabled={disabled}
        >
          <div
            ref={ref}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={handleToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); }
              if (e.key === 'Escape') closeCalendar();
            }}
            className={`${triggerClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={hasValue ? 'text-primary' : 'text-transparent select-none'}>
              {selected ? formatDisplay(selected) : 'placeholder'}
            </span>
          </div>
        </FieldWrapper>

        {/* ─── Calendar dropdown ─── */}
        <div
          role="dialog"
          aria-label="Date picker"
          className={`absolute z-50 mt-1 left-0 w-72 bg-white border border-primary/20 rounded-r1 shadow-s1 
            transition-all duration-300 origin-top
            ${isOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-primary/20">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-r1 hover:bg-primary/10 text-primary/50 hover:text-primary transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-semibold text-primary select-none">
              {MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-r1 hover:bg-primary/10 text-primary/50 hover:text-primary transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 px-2 pt-2.5 pb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-xs font-medium text-primary/40 py-0.5">
                {wd}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
            {cells.map((cell, idx) => {
              if (!cell.current) {
                return (
                  <div key={idx} className="h-8 w-8 mx-auto flex items-center justify-center text-sm text-primary/20 select-none">
                    {cell.day}
                  </div>
                );
              }

              const cellDisabled = isDisabled(cell.year, cell.month, cell.day);
              const cellSelected = isSelectedCell(cell.year, cell.month, cell.day);
              const cellToday = isTodayCell(cell.year, cell.month, cell.day);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={cellDisabled}
                  onClick={() => !cellDisabled && handleSelectDay(cell.year, cell.month, cell.day)}
                  aria-label={`${cell.day} ${MONTHS[cell.month]} ${cell.year}`}
                  aria-pressed={cellSelected}
                  aria-disabled={cellDisabled}
                  className={[
                    'h-8 w-8 mx-auto flex items-center justify-center rounded-r1 text-sm transition-colors',
                    cellSelected
                      ? 'bg-primary text-white font-semibold hover:bg-primary/90'
                      : cellDisabled
                      ? 'text-primary/20 cursor-not-allowed'
                      : cellToday
                      ? 'ring-1 ring-primary/40 font-semibold text-primary hover:bg-primary/10 cursor-pointer'
                      : 'text-primary hover:bg-primary/10 cursor-pointer',
                  ].join(' ')}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer: Today + Clear */}
          <div className="border-t border-primary/20 px-3 py-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const ok = (!minParsed || today >= minParsed) && (!maxParsed || today <= maxParsed);
                if (ok) { onChange?.(toISO(today)); closeCalendar(); }
              }}
              className="flex items-center gap-1 text-xs text-primary/50 hover:text-primary transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Today
            </button>

            {hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-danger/60 hover:text-danger transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
