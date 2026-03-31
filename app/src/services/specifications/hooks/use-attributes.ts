/**
 * React Query hooks for specifications
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { specificationService } from "../api/specification.service";
import { queryKeys } from "../../../lib/query-keys";
import { showSuccessToast } from "../../../lib/toast";
import {
  CreateSpecificationDto,
  UpdateSpecificationDto,
  AddSpecificationValueDto,
  UpdateSpecificationValueDto,
} from "../types/specification.types";

// Get all specifications
export const useSpecifications = () => {
  return useQuery({
    queryKey: [queryKeys.specifications.all],
    queryFn: () => specificationService.getSpecifications(),
    select: (data) => {
      // Handle both array and object with data property
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'data' in data) {
        return (data as any).data;
      }
      return [];
    },
  });
};

// Get single specification by ID
export const useSpecification = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.specifications.detail(id),
    queryFn: () => specificationService.getSpecification(id),
    enabled: options?.enabled ?? !!id,
    select: (data) => {
      // Handle both direct object and object with data property
      if (data && typeof data === 'object' && 'data' in data) {
        return (data as any).data;
      }
      return data;
    },
  });
};

// Create specification
export const useCreateSpecification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpecificationDto) =>
      specificationService.createSpecification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      showSuccessToast("Specification created successfully");
    },
  });
};

// Update specification
export const useUpdateSpecification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSpecificationDto }) =>
      specificationService.updateSpecification(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.specifications.detail(variables.id),
      });
      showSuccessToast("Specification updated successfully");
    },
  });
};

// Delete specification
export const useDeleteSpecification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => specificationService.deleteSpecification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      showSuccessToast("Specification deleted successfully");
    },
  });
};

// Add value to specification
export const useAddSpecificationValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      specificationId,
      data,
    }: {
      specificationId: number;
      data: AddSpecificationValueDto;
    }) => specificationService.addSpecificationValue(specificationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.specifications.detail(variables.specificationId),
      });
      showSuccessToast("Value added successfully");
    },
  });
};

// Update specification value
export const useUpdateSpecificationValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      valueId,
      data,
      specificationId,
    }: {
      valueId: number;
      data: UpdateSpecificationValueDto;
      specificationId?: number;
    }) => specificationService.updateSpecificationValue(valueId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      if (variables.specificationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.specifications.detail(variables.specificationId),
        });
      }
      showSuccessToast("Value updated successfully");
    },
  });
};

// Delete specification value
export const useDeleteSpecificationValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      valueId,
      specificationId,
    }: {
      valueId: number;
      specificationId?: number;
    }) => specificationService.deleteSpecificationValue(valueId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      if (variables.specificationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.specifications.detail(variables.specificationId),
        });
      }
      showSuccessToast("Value deleted successfully");
    },
  });
};

// Reorder specifications
export const useReorderSpecifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orders: { id: number; sort_order: number }[]) =>
      specificationService.reorderSpecifications(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      showSuccessToast("Specifications reordered successfully");
    },
  });
};

// Reorder specification values
export const useReorderSpecificationValues = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orders,
      specificationId,
    }: {
      orders: { id: number; sort_order: number }[];
      specificationId: number;
    }) => specificationService.reorderSpecificationValues(specificationId, orders),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.specifications.detail(variables.specificationId),
      });
      showSuccessToast("Values reordered successfully");
    },
  });
};
