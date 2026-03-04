import type { Concept } from "../../search-concepts/types/concept.types";

export type { Concept };

export interface Tag {
  id: number;
  name: string;
  concepts: Concept[];
  created_at: string;
  updated_at: string;
}

export interface TagListParams {
  page?: number;
  per_page?: number;
}

export interface TagListResponse {
  items: Tag[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateTagDto {
  name: string;
}

export interface LinkConceptDto {
  concept_id: string;
}
