/**
 * Specification Types and Interfaces
 */

// Specification Value type (matches backend)
export interface SpecificationValue {
  id: number;
  specification_id: number;
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

// Specification type (matches backend)
export interface Specification {
  id: number;
  name_en: string;
  name_ar: string;
  ;
  ;
  specification_type?: string | null;
  list_separately?: boolean;
  unit_en?: string | null;
  unit_ar?: string | null;
  parent_id?: number | null;
  parent_value_id?: number | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  values?: SpecificationValue[];
  children?: Specification[];
}

// DTOs for API operations

// Create Specification DTO
export interface CreateSpecificationDto {
  name_en: string;
  name_ar: string;
  unit_en?: string;
  unit_ar?: string;
  parent_id?: number | null;
  parent_value_id?: number | null;
  is_active?: boolean;
  specification_type?: string | null;
  list_separately?: boolean;
  values?: CreateSpecificationValueDto[];
}

// Create Specification Value DTO
export interface CreateSpecificationValueDto {
  value_en: string;
  value_ar: string;
  parent_value_id?: number | null;
  color_code?: string | null;
  is_active?: boolean;
}

// Update Specification Value in Specification DTO (for batch update)
export interface UpdateSpecificationValueInDto {
  id?: number; // Optional for new values
  value_en?: string;
  value_ar?: string;
  parent_value_id?: number | null;
  color_code?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

// Update Specification DTO
export interface UpdateSpecificationDto {
  name_en?: string;
  name_ar?: string;
  unit_en?: string;
  unit_ar?: string;
  parent_id?: number | null;
  parent_value_id?: number | null;
  is_active?: boolean;
  specification_type?: string | null;
  list_separately?: boolean;
  sort_order?: number;
  values?: UpdateSpecificationValueInDto[];
}

// Add Value to Specification DTO
export interface AddSpecificationValueDto {
  value_en: string;
  value_ar: string;
  color_code?: string | null;
  is_active?: boolean;
}

// Update Specification Value DTO
export interface UpdateSpecificationValueDto {
  value_en?: string;
  value_ar?: string;
  color_code?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

// For reordering specifications/values via drag and drop
export interface ReorderSpecificationDto {
  id: number;
  sort_order: number;
}

export interface ReorderSpecificationValueDto {
  id: number;
  sort_order: number;
}
