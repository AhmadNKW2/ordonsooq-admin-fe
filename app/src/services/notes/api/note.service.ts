import { httpClient } from "../../../lib/api/http-client";
import type { Note, NoteListParams, NoteListResponse } from "../types/note.types";

class NoteService {
  private endpoint = "/notes"; // Adjust endpoint as necessary, e.g. "/admin/notes"

  listNotes(params?: NoteListParams): Promise<NoteListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return httpClient.get<NoteListResponse>(qs ? `${this.endpoint}?${qs}` : this.endpoint);
  }

  getNote(id: number): Promise<Note> {
    return httpClient.get<Note>(`${this.endpoint}/${id}`);
  }

  deleteNote(id: number): Promise<void> {
    return httpClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const noteService = new NoteService();
