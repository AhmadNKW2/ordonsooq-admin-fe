/**
 * Attribute Types and Interfaces
 */

// Attribute Value type (matches backend)
export interface AttributeValue {
  id: number;
  attribute_id: number;
  value_en: string;
  value_ar: string;
  parent_value_id?: number | null;
  color_code: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttributeCategorySummary {
  id: number;
  name_en?: string | null;
  name_ar?: string | null;
}

// Attribute type (matches backend)
export interface Attribute {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  is_color: boolean;
  attribute_type?: string | null;
  list_separately?: boolean;
  unit_en?: string | null;
  unit_ar?: string | null;
  parent_id?: number | null;
  parent_value_id?: number | null;
  sort_order: number;
  is_active: boolean;
  category_ids?: number[];
  categories?: AttributeCategorySummary[];
  created_at?: string;
  updated_at?: string;
  values?: AttributeValue[];
  children?: Attribute[];
}

// DTOs for API operations

// Create Attribute DTO
export interface CreateAttributeDto {
  name_en: string;
  name_ar: string;
  unit_en?: string;
  unit_ar?: string;
  parent_id?: number | null;
  parent_value_id?: number | null;
  is_color?: boolean;
  is_active?: boolean;
  attribute_type?: string | null;
  list_separately?: boolean;
  category_ids?: number[];
  values?: CreateAttributeValueDto[];
}

// Create Attribute Value DTO
export interface CreateAttributeValueDto {
  value_en: string;
  value_ar: string;
  parent_value_id?: number | null;
  color_code?: string | null;
  is_active?: boolean;
}

// Update Attribute Value in Attribute DTO (for batch update)
export interface UpdateAttributeValueInDto {
  id?: number; // Optional for new values
  value_en?: string;
  value_ar?: string;
  parent_value_id?: number | null;
  color_code?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

// Update Attribute DTO
export interface UpdateAttributeDto {
  name_en?: string;
  name_ar?: string;
  unit_en?: string;
  unit_ar?: string;
  parent_id?: number | null;
  parent_value_id?: number | null;
  is_color?: boolean;
  is_active?: boolean;
  attribute_type?: string | null;
  list_separately?: boolean;
  category_ids?: number[];
  sort_order?: number;
  values?: UpdateAttributeValueInDto[];
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
