/**
 * React Query hooks for vendors
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorService } from "../api/vendor.service";
import { queryKeys } from "../../../lib/query-keys";
import {
  CreateVendorDto,
  UpdateVendorDto,
  ReorderVendorsDto,
  PermanentDeleteVendorDto,
  RestoreVendorDto,
} from "../types/vendor.types";
import { showSuccessToast } from "../../../lib/toast";

export const useVendors = () => {
  return useQuery({
    queryKey: [queryKeys.vendors.all],
    queryFn: () => vendorService.getVendors(),
    select: (response) => response.data,
  });
};

export const useVendor = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: () => vendorService.getVendor(id),
    select: (response) => response.data,
    enabled: options?.enabled ?? true,
  });
};

export const useArchivedVendors = () => {
  return useQuery({
    queryKey: [queryKeys.vendors.archived],
    queryFn: () => vendorService.getArchivedVendors(),
    select: (response) => response.data,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVendorDto) => vendorService.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.all] });
      showSuccessToast("Vendor created successfully");
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVendorDto }) =>
      vendorService.updateVendor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.all] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendors.detail(variables.id),
      });
      showSuccessToast("Vendor updated successfully");
    },
  });
};

export const useReorderVendors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderVendorsDto) => vendorService.reorderVendors(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.all] });
      showSuccessToast("Vendors reordered successfully");
    },
  });
};

export const useArchiveVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => vendorService.archiveVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.archived] });
      showSuccessToast("Vendor archived successfully");
    },
  });
};

export const useRestoreVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: RestoreVendorDto }) => 
      vendorService.restoreVendor(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.archived] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.products.all] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.products.archived] });
      const restoredProducts = result.data?.restoredProducts || 0;
      const message = restoredProducts > 0 
        ? `Vendor restored with ${restoredProducts} product(s)`
        : "Vendor restored successfully";
      showSuccessToast(message);
    },
  });
};

export const usePermanentDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: PermanentDeleteVendorDto }) =>
      vendorService.permanentDeleteVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.vendors.archived] });
      showSuccessToast("Vendor permanently deleted");
    },
  });
};

/**
 * @deprecated Use useArchiveVendor instead
 */
export const useDeleteVendor = () => {
  return useArchiveVendor();
};

// ============================================
// Vendor Products Hooks
// ============================================

export const useVendorProducts = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.vendors.products(id),
    queryFn: () => vendorService.getProducts(id),
    select: (response) => response.data,
    enabled: options?.enabled ?? !!id,
  });
};

export const useAssignProductsToVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, product_ids }: { vendorId: number; product_ids: number[] }) =>
      vendorService.assignProducts(vendorId, product_ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.products(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: [queryKeys.products.all] });
      showSuccessToast("Products assigned to vendor successfully");
    },
  });
};

export const useRemoveProductsFromVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, product_ids }: { vendorId: number; product_ids: number[] }) =>
      vendorService.removeProducts(vendorId, product_ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.products(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: [queryKeys.products.all] });
      showSuccessToast("Products removed from vendor successfully");
    },
  });
};
