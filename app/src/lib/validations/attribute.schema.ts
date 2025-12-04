/**
 * Attribute Validation Schemas
 * Shared between client and server for DRY validation
 */

import { z } from "zod";

// Regex patterns for language validation
const ENGLISH_PATTERN = /^[a-zA-Z0-9\s\p{P}]+$/u;
const ARABIC_PATTERN = /^[\u0600-\u06FF0-9\s\p{P}]+$/u;
const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// ============================================
// Attribute Value Schema
// ============================================
export const attributeValueSchema = z.object({
  value_en: z
    .string()
    .min(1, "Required")
    .regex(ENGLISH_PATTERN, "Must be in English"),
  value_ar: z
    .string()
    .min(1, "Required")
    .regex(ARABIC_PATTERN, "Must be in Arabic"),
  color_code: z
    .string()
    .nullable()
    .optional(),
});

// Schema with conditional color validation
export const createAttributeValueSchema = (isColor: boolean) =>
  attributeValueSchema.superRefine((data, ctx) => {
    if (isColor && (!data.color_code || data.color_code.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["color_code"],
      });
    }
    if (isColor && data.color_code && !HEX_COLOR_PATTERN.test(data.color_code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid hex color format (e.g., #FF0000)",
        path: ["color_code"],
      });
    }
  });

// Type inference
export type AttributeValueFormData = z.infer<typeof attributeValueSchema>;

// ============================================
// Attribute Schema
// ============================================
export const attributeSchema = z.object({
  name_en: z
    .string()
    .min(1, "Required")
    .regex(ENGLISH_PATTERN, "Must be in English"),
  name_ar: z
    .string()
    .min(1, "Required")
    .regex(ARABIC_PATTERN, "Must be in Arabic"),
  is_color: z.boolean(),
  is_active: z.boolean(),
});

// Type inference
export type AttributeFormData = z.infer<typeof attributeSchema>;

// ============================================
// Create Attribute DTO Schema (with values)
// ============================================
export const createAttributeSchema = attributeSchema.extend({
  values: z.array(attributeValueSchema).optional(),
});

export type CreateAttributeFormData = z.infer<typeof createAttributeSchema>;
