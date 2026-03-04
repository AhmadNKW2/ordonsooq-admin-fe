import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query-keys";
import { showSuccessToast } from "../../../lib/toast";
import { conceptService } from "../api/concept.service";
import type {
  ConceptListParams,
  CreateConceptDto,
  UpdateConceptDto,
} from "../types/concept.types";

export const useConcepts = (params?: ConceptListParams) => {
  return useQuery({
    queryKey: queryKeys.concepts.list(params),
    queryFn: () => conceptService.listConcepts(params),
    select: (response: any) => response?.data ?? response,
  });
};

export const useConcept = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.concepts.detail(id),
    queryFn: () => conceptService.getConcept(id),
    enabled: options?.enabled ?? !!id,
    select: (response: any) => response?.data ?? response,
  });
};

export const useCreateConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConceptDto) => conceptService.createConcept(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.lists() });
      showSuccessToast("Concept created successfully");
    },
  });
};

export const useUpdateConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConceptDto }) =>
      conceptService.updateConcept(id, data),
    onSuccess: (concept) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.detail(concept.id) });
      showSuccessToast("Concept updated successfully");
    },
  });
};

export const useApproveConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conceptService.approveConcept(id),
    onSuccess: (concept) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.detail(concept.id) });
      showSuccessToast("Concept approved and synced to Typesense");
    },
  });
};

export const useRejectConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conceptService.rejectConcept(id),
    onSuccess: (concept) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.detail(concept.id) });
      showSuccessToast("Concept rejected");
    },
  });
};

export const useDisableConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conceptService.disableConcept(id),
    onSuccess: (concept) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.detail(concept.id) });
      showSuccessToast("Concept disabled — synonym removed from Typesense");
    },
  });
};

export const useDeleteConcept = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conceptService.deleteConcept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.concepts.lists() });
      showSuccessToast("Concept deleted successfully");
    },
  });
};
