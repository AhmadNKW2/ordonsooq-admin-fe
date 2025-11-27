import { useState, useCallback } from 'react';

export type ValidationRule = 'required' | 'isNum' | 'isAr' | 'isEn';

export type ValidationSchema = Record<string, ValidationRule[]>;

// Helper to get value by path
const getValueByPath = (obj: any, path: string) => {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const useFormValidation = (schema: ValidationSchema) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateValue = useCallback((value: any, rules: ValidationRule[], isSubmitted: boolean) => {
        if (!rules) return null;

        // Immediate checks (format) - only if value exists
        if (value !== null && value !== undefined && value !== '') {
            const strVal = String(value);
            if (rules.includes('isNum') && !/^\d*\.?\d*$/.test(strVal)) {
                return "Must be a number";
            }
            if (rules.includes('isEn') && !/^[a-zA-Z0-9\s\p{P}]+$/u.test(strVal)) {
                return "Must be in English";
            }
            if (rules.includes('isAr') && !/^[\u0600-\u06FF0-9\s\p{P}]+$/u.test(strVal)) {
                return "Must be in Arabic";
            }
        }

        // Required check (only on submit)
        if (isSubmitted && rules.includes('required')) {
            if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
                return "This field is required";
            }
        }

        return null;
    }, []);

    const validateField = useCallback((name: string, value: any) => {
        // Find rule for this specific field name
        // We need to handle array indices in name for wildcard matching
        // e.g. name="variantPricing.0.cost", schema="variantPricing.$.cost"
        
        let rules = schema[name];
        
        if (!rules) {
            // Try to match wildcard
            const wildcardKey = Object.keys(schema).find(key => {
                if (!key.includes('$')) return false;
                const regex = new RegExp('^' + key.replace('$', '\\d+') + '$');
                return regex.test(name);
            });
            if (wildcardKey) {
                rules = schema[wildcardKey];
            }
        }

        if (!rules) return;

        const error = validateValue(value, rules, isSubmitted);
        
        setErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[name] = error;
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });
    }, [schema, isSubmitted, validateValue]);

    const handleValidationChange = useCallback((field: string, value: any) => {
        // 1. Validate the field itself (if it's a leaf node in schema)
        validateField(field, value);
        
        // 2. If 'field' is an object/parent, we might need to validate its children
        // e.g. field='singlePricing', schema has 'singlePricing.cost'
        // We iterate schema to find children
        Object.keys(schema).forEach(key => {
            if (key.startsWith(`${field}.`) && !key.includes('$')) {
                const subPath = key.slice(field.length + 1);
                const subValue = getValueByPath(value, subPath);
                validateField(key, subValue);
            }
        });
    }, [schema, validateField]);

    const validateForm = useCallback((data: any) => {
        console.log('=== DEBUG: validateForm called ===');
        console.log('data:', data);
        console.log('schema:', schema);
        
        setIsSubmitted(true);
        const newErrors: Record<string, string> = {};
        let isValid = true;
        let firstErrorKey = '';

        Object.keys(schema).forEach(key => {
            if (key.includes('$')) {
                // Handle array wildcard
                // e.g. variantPricing.$.cost
                const parts = key.split('.$.');
                const arrayPath = parts[0];
                const itemPath = parts[1];
                
                const array = getValueByPath(data, arrayPath);
                console.log(`Validating array field: ${key}, arrayPath: ${arrayPath}, array:`, array);
                
                if (Array.isArray(array)) {
                    array.forEach((item, index) => {
                        const itemValue = getValueByPath(item, itemPath);
                        const error = validateValue(itemValue, schema[key], true);
                        console.log(`  [${index}].${itemPath} = ${itemValue}, error: ${error}`);
                        if (error) {
                            const errorKey = `${arrayPath}.${index}.${itemPath}`;
                            newErrors[errorKey] = error;
                            if (!firstErrorKey) firstErrorKey = errorKey;
                            isValid = false;
                        }
                    });
                }
            } else {
                // Normal key
                const value = getValueByPath(data, key);
                const error = validateValue(value, schema[key], true);
                console.log(`Validating field: ${key} = ${JSON.stringify(value)}, error: ${error}`);
                if (error) {
                    newErrors[key] = error;
                    if (!firstErrorKey) firstErrorKey = key;
                    isValid = false;
                }
            }
        });

        console.log('=== Validation Result ===');
        console.log('isValid:', isValid);
        console.log('newErrors:', newErrors);
        console.log('firstErrorKey:', firstErrorKey);
        
        setErrors(newErrors);
        
        if (firstErrorKey) {
            // Scroll to error
            // We need to wait for render potentially, but usually inputs are there
            setTimeout(() => {
                const element = document.getElementById(firstErrorKey);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                }
            }, 100);
        }

        return isValid;
    }, [schema, validateValue]);

    return {
        errors,
        handleValidationChange,
        validateForm,
        isSubmitted
    };
};
