import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface FieldWrapperProps {
    label?: string;
    error?: string;
    isFocused: boolean;
    hasValue: boolean;
    onClear?: () => void;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    isClearButton?: boolean;
    children: ReactNode;
    className?: string;
    labelLeftOffset?: string;
    disabled?: boolean;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
    label,
    error,
    isFocused,
    hasValue,
    onClear,
    leftIcon,
    rightIcon,
    isClearButton = true,
    children,
    className = '',
    labelLeftOffset = 'left-8',
    disabled = false,
}) => {
    const showLabel = isFocused || hasValue;
    const showClear = isClearButton && hasValue && onClear;

    return (
        <div className="w-full">
            <div className={`relative w-full ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        {leftIcon}
                    </div>
                )}

                {children}

                {/* Right icon always shown if provided */}
                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        {rightIcon}
                    </div>
                )}

                {/* Clear button positioned separately, next to right icon */}
                {showClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className={`absolute ${rightIcon ? 'right-9' : 'right-5'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                {label && (
                    <label
                        className={`absolute ${labelLeftOffset} px-1 bg-secondary font-medium transition-all duration-200 pointer-events-none z-10 ${showLabel
                            ? 'top-0 -translate-y-1/2 text-third text-xs'
                            : 'top-1/2 -translate-y-1/2 text-third/60 text-sm'
                            } ${error && showLabel ? 'text-danger' : ''}`}
                    >
                        {label}
                    </label>
                )}
            </div>
            {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
        </div >

    );
};

// Shared field styles constant
export const FIELD_BASE_CLASSES = 'w-full border-2 rounded-rounded1 placeholder-transparent bg-secondary focus:outline-none focus:ring-2 focus:ring-fifth focus:border-transparent transition-[border-color,box-shadow,background-color] disabled:opacity-50 disabled:cursor-not-allowed';

// Shared icon styles for consistent appearance across all field components
export const FIELD_ICON_CLASSES = 'h-4 w-4 text-gray-400';

export const getFieldClasses = (error?: string, hasValue?: boolean, hasLeftIcon?: boolean, hasRightIcon?: boolean, className?: string) => {
    const leftPadding = hasLeftIcon ? 'pl-9' : 'pl-4';
    const rightPadding = hasRightIcon ? 'pr-15' : 'pr-4';
    const horizontalPadding = `${leftPadding} ${rightPadding}`;
    
    const borderColor = error ? 'border-danger' : 'border-primary';
    const verticalPadding = 'py-2';

    return `${FIELD_BASE_CLASSES} ${verticalPadding} ${horizontalPadding} ${borderColor} ${className || ''}`;
};
