/**
 * React Query hooks for attributes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attributeService } from "../api/attribute.service";
import { queryKeys } from "../../../lib/query-keys";
import { showSuccessToast } from "../../../lib/toast";
import {
  CreateAttributeDto,
  UpdateAttributeDto,
  AddAttributeValueDto,
  UpdateAttributeValueDto,
} from "../types/attribute.types";

// Get all attributes
export const useAttributes = () => {
  return useQuery({
    queryKey: [queryKeys.attributes.all],
    queryFn: () => attributeService.getAttributes(),
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

// Get single attribute by ID
export const useAttribute = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.attributes.detail(id),
    queryFn: () => attributeService.getAttribute(id),
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

// Create attribute
export const useCreateAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAttributeDto) =>
      attributeService.createAttribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      showSuccessToast("Attribute created successfully");
    },
  });
};

// Update attribute
export const useUpdateAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAttributeDto }) =>
      attributeService.updateAttribute(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.detail(variables.id),
      });
      showSuccessToast("Attribute updated successfully");
    },
  });
};

// Delete attribute
export const useDeleteAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => attributeService.deleteAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      showSuccessToast("Attribute deleted successfully");
    },
  });
};

// Add value to attribute
export const useAddAttributeValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attributeId,
      data,
    }: {
      attributeId: number;
      data: AddAttributeValueDto;
    }) => attributeService.addAttributeValue(attributeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.detail(variables.attributeId),
      });
      showSuccessToast("Value added successfully");
    },
  });
};

// Update attribute value
export const useUpdateAttributeValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      valueId,
      data,
      attributeId,
    }: {
      valueId: number;
      data: UpdateAttributeValueDto;
      attributeId?: number;
    }) => attributeService.updateAttributeValue(valueId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      if (variables.attributeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.attributes.detail(variables.attributeId),
        });
      }
      showSuccessToast("Value updated successfully");
    },
  });
};

// Delete attribute value
export const useDeleteAttributeValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      valueId,
      attributeId,
    }: {
      valueId: number;
      attributeId?: number;
    }) => attributeService.deleteAttributeValue(valueId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      if (variables.attributeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.attributes.detail(variables.attributeId),
        });
      }
      showSuccessToast("Value deleted successfully");
    },
  });
};

// Reorder attributes
export const useReorderAttributes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orders: { id: number; sort_order: number }[]) =>
      attributeService.reorderAttributes(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      showSuccessToast("Attributes reordered successfully");
    },
  });
};

// Reorder attribute values
export const useReorderAttributeValues = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orders,
      attributeId,
    }: {
      orders: { id: number; sort_order: number }[];
      attributeId: number;
    }) => attributeService.reorderAttributeValues(attributeId, orders),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.attributes.all] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attributes.detail(variables.attributeId),
      });
      showSuccessToast("Values reordered successfully");
    },
  });
};
