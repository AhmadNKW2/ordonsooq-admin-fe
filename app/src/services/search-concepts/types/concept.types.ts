export type ConceptStatus = "pending" | "approved" | "rejected";
export type ConceptSource = "ai" | "manual";

export interface Concept {
  id: string;
  concept_key: string;
  concept_key_ar: string | null;
  terms_en: string[];
  terms_ar: string[];
  status: ConceptStatus;
  source: ConceptSource;
  typesense_synonym_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConceptListParams {
  status?: ConceptStatus;
  page?: number;
  per_page?: number;
}

export interface ConceptListResponse {
  items: Concept[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateConceptDto {
  concept_key: string;
  concept_key_ar?: string | null;
  terms_en: string[];
  terms_ar: string[];
}

export interface UpdateConceptDto {
  concept_key?: string;
  concept_key_ar?: string | null;
  terms_en?: string[];
  terms_ar?: string[];
}
