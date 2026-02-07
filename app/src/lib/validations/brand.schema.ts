/**
 * Brand Validation Schema
 * Mirrors vendor validation rules for names, descriptions, and logo upload
 */

import { z } from "zod";

// Regex patterns for language validation
const ENGLISH_PATTERN = /^[a-zA-Z0-9\s\p{P}\-_&'".!?,;:()[\]{}@#$%^*+=<>\/\\|`~]+$/u;
const ARABIC_PATTERN = /^[\u0600-\u06FF0-9\s\p{P}\-_&'".!?,;:()[\]{}@#$%^*+=<>\/\\|`~]+$/u;

export const brandFormSchema = z.object({
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
    .max(1000, "Description must be less than 1000 characters")
    .regex(ENGLISH_PATTERN, "Description must be in English")
    .optional()
    .or(z.literal("")),

  description_ar: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),

  visible: z.boolean().default(true),

  logo: z
    .instanceof(File)
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "Logo must be less than 5MB"
    )
    .refine(
      (file) => !file || ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"].includes(file.type),
      "Only JPEG, PNG, GIF, WebP, and SVG images are allowed"
    )
    .nullable()
    .optional(),
});

export const createBrandSchema = brandFormSchema.extend({
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

export const updateBrandSchema = brandFormSchema.partial();

export type BrandFormData = z.infer<typeof brandFormSchema>;
export type CreateBrandFormData = z.infer<typeof createBrandSchema>;
export type UpdateBrandFormData = z.infer<typeof updateBrandSchema>;

export interface BrandFormErrors {
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  logo?: string;
}

export function validateBrandForm(data: {
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  logo?: File | null;
}): { isValid: boolean; errors: BrandFormErrors } {
  const errors: BrandFormErrors = {};

  if (!data.name_en || !data.name_en.trim()) {
    errors.name_en = "English name is required";
  } else if (data.name_en.length < 2) {
    errors.name_en = "Name must be at least 2 characters";
  } else if (data.name_en.length > 100) {
    errors.name_en = "Name must be less than 100 characters";
  } else if (!ENGLISH_PATTERN.test(data.name_en)) {
    errors.name_en = "Name must be in English";
  }

  if (!data.name_ar || !data.name_ar.trim()) {
    errors.name_ar = "Arabic name is required";
  } else if (data.name_ar.length < 2) {
    errors.name_ar = "Name must be at least 2 characters";
  } else if (data.name_ar.length > 100) {
    errors.name_ar = "Name must be less than 100 characters";
  }

  if (data.description_en && data.description_en.length > 1000) {
    errors.description_en = "Description must be less than 1000 characters";
  } else if (data.description_en && !ENGLISH_PATTERN.test(data.description_en)) {
    errors.description_en = "Description must be in English";
  }

  if (data.description_ar && data.description_ar.length > 1000) {
    errors.description_ar = "Description must be less than 1000 characters";
  }

  if (data.logo) {
    if (data.logo.size > 5 * 1024 * 1024) {
      errors.logo = "Logo must be less than 5MB";
    } else if (!["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"].includes(data.logo.type)) {
      errors.logo = "Only JPEG, PNG, GIF, WebP, and SVG images are allowed";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
