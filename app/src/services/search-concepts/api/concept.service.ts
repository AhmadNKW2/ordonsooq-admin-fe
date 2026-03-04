import { httpClient } from "../../../lib/api/http-client";
import type {
  Concept,
  ConceptListParams,
  ConceptListResponse,
  CreateConceptDto,
  UpdateConceptDto,
} from "../types/concept.types";

class ConceptService {
  private endpoint = "/admin/search/concepts";

  listConcepts(params?: ConceptListParams): Promise<ConceptListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    const qs = query.toString();
    return httpClient.get<ConceptListResponse>(qs ? `${this.endpoint}?${qs}` : this.endpoint);
  }

  getConcept(id: string): Promise<Concept> {
    return httpClient.get<Concept>(`${this.endpoint}/${id}`);
  }

  createConcept(data: CreateConceptDto): Promise<Concept> {
    return httpClient.post<Concept>(this.endpoint, data);
  }

  updateConcept(id: string, data: UpdateConceptDto): Promise<Concept> {
    return httpClient.put<Concept>(`${this.endpoint}/${id}`, data);
  }

  approveConcept(id: string): Promise<Concept> {
    return httpClient.post<Concept>(`${this.endpoint}/${id}/approve`, {});
  }

  rejectConcept(id: string): Promise<Concept> {
    return httpClient.post<Concept>(`${this.endpoint}/${id}/reject`, {});
  }

  disableConcept(id: string): Promise<Concept> {
    return httpClient.post<Concept>(`${this.endpoint}/${id}/disable`, {});
  }

  deleteConcept(id: string): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const conceptService = new ConceptService();
