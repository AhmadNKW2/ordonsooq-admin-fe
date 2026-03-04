import { httpClient } from "../../../lib/api/http-client";
import type {
  Tag,
  TagListParams,
  TagListResponse,
  CreateTagDto,
  LinkConceptDto,
} from "../types/tag.types";

class TagService {
  private endpoint = "/admin/tags";

  listTags(params?: TagListParams): Promise<TagListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    const qs = query.toString();
    return httpClient.get<TagListResponse>(qs ? `${this.endpoint}?${qs}` : this.endpoint);
  }

  getTag(id: number): Promise<Tag> {
    return httpClient.get<Tag>(`${this.endpoint}/${id}`);
  }

  createTag(data: CreateTagDto): Promise<Tag> {
    return httpClient.post<Tag>(this.endpoint, data);
  }

  deleteTag(id: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/${id}`);
  }

  linkConcept(tagId: number, data: LinkConceptDto): Promise<Tag> {
    return httpClient.post<Tag>(`${this.endpoint}/${tagId}/concepts`, data);
  }

  unlinkConcept(tagId: number, conceptId: string): Promise<Tag> {
    return httpClient.delete<Tag>(`${this.endpoint}/${tagId}/concepts/${conceptId}`);
  }
}

export const tagService = new TagService();
