/**
 * useZodValidation Hook
 * Bridges Zod validation with React state management for complex dynamic forms
 * Provides React Hook Form-like API with Zod schema validation
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { z, ZodSchema, ZodError } from "zod";

export type ValidationErrors = Record<string, string | boolean>;

interface UseZodValidationOptions<T> {
  schema: ZodSchema<T>;
  onValidationChange?: (errors: ValidationErrors) => void;
}

interface UseZodValidationReturn<T> {
  errors: ValidationErrors;
  validateForm: (data: T) => boolean;
  validateField: (field: string, value: any, fullData?: T) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  setErrors: (errors: ValidationErrors) => void;
  isSubmitted: boolean;
  setIsSubmitted: (value: boolean) => void;
}

/**
 * Flattens Zod errors into a flat object with dot-notation keys
 */
const flattenZodErrors = (error: ZodError): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    // Use the message if it's custom, otherwise just use `true` to indicate error
    errors[path] = issue.message !== "Required" ? issue.message : true;
  }
  
  return errors;
};

/**
 * Gets a value from an object using dot notation path
 */
const getValueByPath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, part) => {
    if (acc === null || acc === undefined) return undefined;
    // Handle array index
    const arrayMatch = part.match(/^(\d+)$/);
    if (arrayMatch) {
      return acc[parseInt(arrayMatch[1])];
    }
    return acc[part];
  }, obj);
};

export function useZodValidation<T extends Record<string, any>>(
  options: UseZodValidationOptions<T>
): UseZodValidationReturn<T> {
  const { schema, onValidationChange } = options;
  
  const [errors, setErrorsState] = useState<ValidationErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Use ref to track the latest schema without causing re-renders
  const schemaRef = useRef(schema);
  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  const setErrors = useCallback((newErrors: ValidationErrors) => {
    setErrorsState(newErrors);
    onValidationChange?.(newErrors);
  }, [onValidationChange]);

  const validateForm = useCallback((data: T): boolean => {
    setIsSubmitted(true);
    
    try {
      schemaRef.current.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const flatErrors = flattenZodErrors(error);
        setErrors(flatErrors);
        
        // Scroll to first error
        const firstErrorKey = Object.keys(flatErrors)[0];
        if (firstErrorKey) {
          setTimeout(() => {
            const element = document.getElementById(firstErrorKey) ||
              document.querySelector(`[name="${firstErrorKey}"]`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              (element as HTMLElement).focus?.();
            }
          }, 100);
        }
        
        return false;
      }
      throw error;
    }
  }, [setErrors]);

  const validateField = useCallback((field: string, value: any, fullData?: T) => {
    // Only validate if form has been submitted once
    if (!isSubmitted) {
      // Clear error on change before submission
      setErrorsState((prev) => {
        if (prev[field]) {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
        return prev;
      });
      return;
    }

    // Re-validate the full form to get accurate errors
    // This is needed because Zod validation works on the full object
    if (fullData) {
      try {
        schemaRef.current.parse(fullData);
        // Clear errors for this field if validation passes
        setErrorsState((prev) => {
          const newErrors = { ...prev };
          // Clear all errors starting with this field path
          Object.keys(newErrors).forEach((key) => {
            if (key === field || key.startsWith(`${field}.`)) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
      } catch (error) {
        if (error instanceof ZodError) {
          const flatErrors = flattenZodErrors(error);
          setErrorsState((prev) => {
            const newErrors = { ...prev };
            // Remove old errors for this field
            Object.keys(newErrors).forEach((key) => {
              if (key === field || key.startsWith(`${field}.`)) {
                delete newErrors[key];
              }
            });
            // Add new errors for this field
            Object.entries(flatErrors).forEach(([key, value]) => {
              if (key === field || key.startsWith(`${field}.`)) {
                newErrors[key] = value;
              }
            });
            return newErrors;
          });
        }
      }
    }
  }, [isSubmitted]);

  const clearFieldError = useCallback((field: string) => {
    setErrorsState((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setIsSubmitted(false);
  }, [setErrors]);

  return {
    errors,
    validateForm,
    validateField,
    clearFieldError,
    clearAllErrors,
    setErrors,
    isSubmitted,
    setIsSubmitted,
  };
}

/**
 * Creates a dynamic Zod schema builder for forms with conditional validation
 */
export function createDynamicSchema<T>(
  baseSchema: ZodSchema<any>,
  conditionalFields: (data: Partial<T>) => Record<string, ZodSchema<any>>
) {
  return (data: Partial<T>) => {
    const conditionals = conditionalFields(data);
    return baseSchema.and(z.object(conditionals).partial());
  };
}
