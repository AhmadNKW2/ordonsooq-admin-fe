/**
 * React Query hooks for specifications
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query-keys";
import { showSuccessToast } from "../../../lib/toast";
import { specificationService } from "../api/specification.service";
import {
  AddSpecificationValueDto,
  CreateSpecificationDto,
  UpdateSpecificationDto,
  UpdateSpecificationValueDto,
} from "../types/specification.types";

export const useSpecifications = () => {
  return useQuery({
    queryKey: [queryKeys.specifications.all],
    queryFn: () => specificationService.getSpecifications(),
    select: (data) => {
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === "object" && "data" in data) {
        return (data as any).data;
      }
      return [];
    },
  });
};

export const useSpecification = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.specifications.detail(id),
    queryFn: () => specificationService.getSpecification(id),
    enabled: options?.enabled ?? !!id,
    select: (data) => {
      if (data && typeof data === "object" && "data" in data) {
        return (data as any).data;
      }
      return data;
    },
  });
};

export const useCreateSpecification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpecificationDto) => specificationService.createSpecification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.specifications.all] });
      showSuccessToast("Specification created successfully");
    },
  });
};

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