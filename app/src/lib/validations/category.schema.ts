/**
 * Category Validation Schema
 * Shared validation for category forms
 */

import { z } from "zod";

// Regex patterns for language validation
const ENGLISH_PATTERN = /^[a-zA-Z0-9\s\p{P}\-_&'".!?,;:()[\]{}@#$%^*+=<>\/\\|`~]+$/u;
const ARABIC_PATTERN = /^[\u0600-\u06FF0-9\s\p{P}\-_&'".!?,;:()[\]{}@#$%^*+=<>\/\\|`~]+$/u;

// ============================================
// Category Form Schema
// ============================================
export const categoryFormSchema = z.object({
  name_en: z
    .string()
    .min(1, "English name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(ENGLISH_PATTERN, "Name must be in English"),
  
  name_ar: z
    .string()
    .min(1, "Arabic name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  description_en: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .regex(ENGLISH_PATTERN, "Description must be in English")
    .optional()
    .or(z.literal("")),
  
  description_ar: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  parent_id: z
    .number()
    .nullable()
    .optional(),
  
  visible: z.boolean().default(true),
  
  is_active: z.boolean().default(true),
  
  image: z
    .instanceof(File)
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "Image must be less than 5MB"
    )
    .refine(
      (file) => !file || ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type),
      "Only JPEG, PNG, GIF, and WebP images are allowed"
    )
    .nullable()
    .optional(),
});

// Create category schema (more strict)
export const createCategorySchema = categoryFormSchema.extend({
  name_en: z
    .string()
    .min(1, "English name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  name_ar: z
    .string()
    .min(1, "Arabic name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
});

// Update category schema (allows partial updates)
export const updateCategorySchema = categoryFormSchema.partial();

// Type inference
export type CategoryFormData = z.infer<typeof categoryFormSchema>;
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

// ============================================
// Validation Helper for Simple Forms
// ============================================
export interface CategoryFormErrors {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  image?: string;
  parent_id?: string;
}

/**
 * Validates category form data and returns errors object
 */
export function validateCategoryForm(data: {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  image?: File | null;
}): { isValid: boolean; errors: CategoryFormErrors } {
  const errors: CategoryFormErrors = {};

  // Name English validation
  if (!data.name_en || !data.name_en.trim()) {
    errors.name_en = "English name is required";
  } else if (data.name_en.length < 2) {
    errors.name_en = "Name must be at least 2 characters";
  } else if (data.name_en.length > 100) {
    errors.name_en = "Name must be less than 100 characters";
  } else if (!ENGLISH_PATTERN.test(data.name_en)) {
    errors.name_en = "Name must be in English";
  }

  // Name Arabic validation
  if (!data.name_ar || !data.name_ar.trim()) {
    errors.name_ar = "Arabic name is required";
  } else if (data.name_ar.length < 2) {
    errors.name_ar = "Name must be at least 2 characters";
  } else if (data.name_ar.length > 100) {
    errors.name_ar = "Name must be less than 100 characters";
  }

  // Description English validation (optional)
  if (data.description_en && data.description_en.length > 500) {
    errors.description_en = "Description must be less than 500 characters";
  } else if (data.description_en && !ENGLISH_PATTERN.test(data.description_en)) {
    errors.description_en = "Description must be in English";
  }

  // Description Arabic validation (optional)
  if (data.description_ar && data.description_ar.length > 500) {
    errors.description_ar = "Description must be less than 500 characters";
  }

  // Image validation (optional)
  if (data.image) {
    if (data.image.size > 5 * 1024 * 1024) {
      errors.image = "Image must be less than 5MB";
    } else if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(data.image.type)) {
      errors.image = "Only JPEG, PNG, GIF, and WebP images are allowed";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
