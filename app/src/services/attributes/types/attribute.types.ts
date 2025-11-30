/**
 * Attribute Types and Interfaces
 */

// Attribute Value type (matches backend)
export interface AttributeValue {
  id: number;
  attribute_id: number;
  value_en: string;
  value_ar: string;
  color_code: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Attribute type (matches backend)
export interface Attribute {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  values?: AttributeValue[];
}

// DTOs for API operations

// Create Attribute DTO
export interface CreateAttributeDto {
  name_en: string;
  name_ar: string;
  is_active?: boolean;
  values?: CreateAttributeValueDto[];
}

// Create Attribute Value DTO
export interface CreateAttributeValueDto {
  value_en: string;
  value_ar: string;
  color_code?: string | null;
  is_active?: boolean;
}

// Update Attribute DTO
export interface UpdateAttributeDto {
  name_en?: string;
  name_ar?: string;
  is_active?: boolean;
  sort_order?: number;
}

// Add Value to Attribute DTO
export interface AddAttributeValueDto {
  value_en: string;
  value_ar: string;
  color_code?: string | null;
  is_active?: boolean;
}

// Update Attribute Value DTO
export interface UpdateAttributeValueDto {
  value_en?: string;
  value_ar?: string;
  color_code?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

// For reordering attributes/values via drag and drop
export interface ReorderAttributeDto {
  id: number;
  sort_order: number;
}

export interface ReorderAttributeValueDto {
  id: number;
  sort_order: number;
}
