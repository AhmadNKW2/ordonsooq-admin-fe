import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query-keys";
import { showSuccessToast } from "../../../lib/toast";
import { tagService } from "../api/tag.service";
import type { CreateTagDto, LinkConceptDto, TagListParams } from "../types/tag.types";

export const useTags = (params?: TagListParams) => {
  return useQuery({
    queryKey: queryKeys.tags.list(params),
    queryFn: () => tagService.listTags(params),
    select: (response: any) => response?.data ?? response,
  });
};

export const useTag = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tags.detail(id),
    queryFn: () => tagService.getTag(id),
    enabled: options?.enabled ?? !!id,
    select: (response: any) => response?.data ?? response,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagDto) => tagService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      showSuccessToast("Tag created successfully");
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      showSuccessToast("Tag deleted successfully");
    },
  });
};

export const useLinkConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, data }: { tagId: number; data: LinkConceptDto }) =>
      tagService.linkConcept(tagId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.detail(variables.tagId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      showSuccessToast("Concept linked to tag");
    },
  });
};

export const useUnlinkConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, conceptId }: { tagId: number; conceptId: string }) =>
      tagService.unlinkConcept(tagId, conceptId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.detail(variables.tagId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      showSuccessToast("Concept unlinked from tag");
    },
  });
};
