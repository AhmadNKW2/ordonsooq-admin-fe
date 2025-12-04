/**
 * @deprecated This file is deprecated. Use useZodValidation hook and Zod schemas instead.
 * 
 * For new forms, use:
 * - app/src/hooks/use-zod-validation.ts - for dynamic form validation
 * - app/src/lib/validations/*.ts - for Zod schemas
 * 
 * Migration examples:
 * - AttributeForm: uses react-hook-form + zodResolver
 * - ProductForm: uses useZodValidation with createProductSchema
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ============================================
// Validators - Reusable validation functions
// ============================================
export const Validators = {
  required: (value: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return null;
  },
  requiredIf: (condition: boolean) => (value: any) => {
    return condition ? Validators.required(value) : null;
  },
  isEn: (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    if (!/^[a-zA-Z0-9\s\p{P}]+$/u.test(String(value))) return "Must be in English";
    return null;
  },
  isAr: (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    if (!/^[\u0600-\u06FF0-9\s\p{P}]+$/u.test(String(value))) return "Must be in Arabic";
    return null;
  }
};

// ============================================
// Simple Validation Hook (for inline forms)
// ============================================
export type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K], formData: T) => string | boolean | null;
};

export function useSimpleValidation<T extends Record<string, any>>(initialValues: T, rules: ValidationRules<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string | boolean>>>({});
  
  // Use ref to always have latest rules without recreating callbacks
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  const validate = useCallback((data: T = values): boolean => {
    const currentRules = rulesRef.current;
    const newErrors: Partial<Record<keyof T, string | boolean>> = {};
    let isValid = true;
    let firstErrorKey = '';

    (Object.keys(currentRules) as Array<keyof T>).forEach((key) => {
      const rule = currentRules[key];
      if (rule) {
        const error = rule(data[key], data);
        if (error) {
          newErrors[key] = error;
          if (!firstErrorKey) firstErrorKey = String(key);
          isValid = false;
        }
      }
    });

    setErrors(newErrors);

    // Smooth scroll to first error
    if (firstErrorKey) {
      setTimeout(() => {
        const element = document.getElementById(firstErrorKey) ||
          document.querySelector(`[name="${firstErrorKey}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus?.();
        }
      }, 100);
    }

    return isValid;
  }, [values]);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const setValuesAndErrors = useCallback((newValues: T, newErrors: Partial<Record<keyof T, string | boolean>> = {}) => {
    setValues(newValues);
    setErrors(newErrors);
  }, []);

  return {
    values,
    errors,
    setValues,
    handleChange,
    validate,
    reset,
    setValuesAndErrors
  };
}

// ============================================
// Form Validation Hook (for complex forms with schema)
// ============================================
export type ValidationRule = 'required' | 'isAr' | 'isEn' | 'optional';

export type FieldConfig = {
  rules?: ValidationRule[];
  optional?: boolean;
};

export type ValidationSchema = Record<string, ValidationRule[] | FieldConfig>;

// Helper to get value by path
const getValueByPath = (obj: any, path: string) => {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// Helper to normalize field config
const normalizeConfig = (config: ValidationRule[] | FieldConfig): { rules: ValidationRule[], optional: boolean } => {
  if (Array.isArray(config)) {
    return { rules: config, optional: config.includes('optional') };
  }
  return {
    rules: config.rules || [],
    optional: config.optional || config.rules?.includes('optional') || false
  };
};

export const useFormValidation = <T extends Record<string, any>>(schema: ValidationSchema) => {
  const [errors, setErrors] = useState<Record<string, string | boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateValue = useCallback((value: any, rules: ValidationRule[], isOptional: boolean, checkRequired: boolean) => {
    if (!rules || rules.length === 0) {
      // If no rules specified and not optional, treat as required
      if (!isOptional && checkRequired) {
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          return true;
        }
      }
      return null;
    }

    // Check format rules first (only if value exists)
    if (value !== null && value !== undefined && value !== '') {
      const strVal = String(value);
      if (rules.includes('isEn') && !/^[a-zA-Z0-9\s\p{P}]+$/u.test(strVal)) {
        return "Must be in English";
      }
      if (rules.includes('isAr') && !/^[\u0600-\u06FF0-9\s\p{P}]+$/u.test(strVal)) {
        return "Must be in Arabic";
      }
    }

    // Required check - if not optional and checking required
    const isRequired = rules.includes('required') || (!isOptional && !rules.includes('optional'));
    if (checkRequired && isRequired) {
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        return true;
      }
    }

    return null;
  }, []);

  const validateField = useCallback((name: string, value: any, checkRequired = false) => {
    // Find rule for this specific field name
    let config = schema[name];

    if (!config) {
      // Try to match wildcard
      const wildcardKey = Object.keys(schema).find(key => {
        if (!key.includes('$')) return false;
        const regex = new RegExp('^' + key.replace(/\$/g, '\\d+') + '$');
        return regex.test(name);
      });
      if (wildcardKey) {
        config = schema[wildcardKey];
      }
    }

    // If field not in schema, it's required by default (unless it's a nested field)
    const { rules, optional } = config ? normalizeConfig(config) : { rules: [], optional: false };
    const error = validateValue(value, rules, optional, checkRequired);

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });

    return error;
  }, [schema, validateValue]);

  const handleValidationChange = useCallback((field: string, value: any) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    // Validate with format rules only (not required) during typing
    validateField(field, value, isSubmitted);

    // If 'field' is an object/parent, validate its children
    Object.keys(schema).forEach(key => {
      if (key.startsWith(`${field}.`) && !key.includes('$')) {
        const subPath = key.slice(field.length + 1);
        const subValue = getValueByPath(value, subPath);
        validateField(key, subValue, isSubmitted);
      }
    });
  }, [schema, validateField, isSubmitted]);

  const validateForm = useCallback((data: T): boolean => {
    setIsSubmitted(true);
    const newErrors: Record<string, string | boolean> = {};
    let isValid = true;
    let firstErrorKey = '';

    // Validate schema-defined fields
    Object.keys(schema).forEach(key => {
      if (key.includes('$')) {
        // Handle array wildcard
        const parts = key.split('.$.');
        const arrayPath = parts[0];
        const itemPath = parts.slice(1).join('.');

        const array = getValueByPath(data, arrayPath);

        if (Array.isArray(array)) {
          array.forEach((item, index) => {
            const itemValue = itemPath ? getValueByPath(item, itemPath) : item;
            const { rules, optional } = normalizeConfig(schema[key]);
            const error = validateValue(itemValue, rules, optional, true);
            if (error) {
              const errorKey = itemPath ? `${arrayPath}.${index}.${itemPath}` : `${arrayPath}.${index}`;
              newErrors[errorKey] = error;
              if (!firstErrorKey) firstErrorKey = errorKey;
              isValid = false;
            }
          });
        }
      } else {
        // Normal key
        const value = getValueByPath(data, key);
        const { rules, optional } = normalizeConfig(schema[key]);
        const error = validateValue(value, rules, optional, true);
        if (error) {
          newErrors[key] = error;
          if (!firstErrorKey) firstErrorKey = key;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);

    if (firstErrorKey) {
      setTimeout(() => {
        const element = document.getElementById(firstErrorKey) ||
          document.querySelector(`[name="${firstErrorKey}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus?.();
        }
      }, 100);
    }

    return isValid;
  }, [schema, validateValue]);

  const getFieldError = useCallback((field: string): string | boolean | undefined => {
    return errors[field];
  }, [errors]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const resetValidation = useCallback(() => {
    setErrors({});
    setIsSubmitted(false);
    setTouched({});
  }, []);

  return {
    errors,
    handleValidationChange,
    validateForm,
    validateField,
    getFieldError,
    hasErrors,
    isSubmitted,
    touched,
    resetValidation,
  };
};
