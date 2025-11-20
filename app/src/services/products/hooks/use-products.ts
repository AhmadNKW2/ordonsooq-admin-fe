/**
 * Product Query Hooks
 * Custom hooks for products using TanStack Query
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { productService } from "../api/product.service";
import { queryKeys } from "../../../lib/query-keys";
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
} from "../types/product.types";
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  ApiError,
} from "../../../types/common.types";

/**
 * Hook to fetch products list with pagination and filters
 */
export function useProducts(
  params?: ProductFilters,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<PaginatedResponse<Product>>,
      ApiError,
      ApiResponse<PaginatedResponse<Product>>,
      ReturnType<typeof queryKeys.products.list>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productService.getProducts(params),
    ...options,
  });
}

/**
 * Hook to fetch a single product
 */
export function useProduct(
  id: string | number,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<Product>,
      ApiError,
      ApiResponse<Product>,
      ReturnType<typeof queryKeys.products.detail>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a product
 */
export function useCreateProduct(
  options?: UseMutationOptions<
    ApiResponse<Product>,
    ApiError,
    CreateProductDto
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => productService.createProduct(data),
    onSuccess: (...args) => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

      // Call onSuccess from options if provided
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct(
  options?: UseMutationOptions<
    ApiResponse<Product>,
    ApiError,
    { id: string | number; data: UpdateProductDto }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data),
    onSuccess: (response, variables, ...rest) => {
      // Invalidate specific product and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

      // Call onSuccess from options if provided
      options?.onSuccess?.(response, variables, ...rest);
    },
    ...options,
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct(
  options?: UseMutationOptions<ApiResponse<void>, ApiError, string | number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => productService.deleteProduct(id),
    onSuccess: (...args) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

      // Remove specific product from cache
      const [, variables] = args;
      queryClient.removeQueries({
        queryKey: queryKeys.products.detail(variables),
      });

      // Call onSuccess from options if provided
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook to toggle product status
 */
export function useToggleProductStatus(
  options?: UseMutationOptions<
    ApiResponse<Product>,
    ApiError,
    { id: string | number; isActive: boolean }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }) =>
      productService.toggleProductStatus(id, isActive),
    onSuccess: (response, variables, ...rest) => {
      // Invalidate specific product and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

      // Call onSuccess from options if provided
      options?.onSuccess?.(response, variables, ...rest);
    },
    ...options,
  });
}
