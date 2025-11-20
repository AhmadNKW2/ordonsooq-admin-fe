/**
 * React Query hooks for categories
 */

import { useQuery } from "@tanstack/react-query";
import { categoryService } from "../api/category.service";
import { queryKeys } from "../../../lib/query-keys";

export const useCategories = () => {
  return useQuery({
    queryKey: [queryKeys.categories.all],
    queryFn: () => categoryService.getCategories(),
    select: (response) => response.data,
  });
};

export const useCategoryTree = () => {
  return useQuery({
    queryKey: [queryKeys.categories.tree],
    queryFn: () => categoryService.getCategoryTree(),
    select: (response) => response.data,
  });
};

export const useMainCategories = () => {
  return useQuery({
    queryKey: [queryKeys.categories.main],
    queryFn: () => categoryService.getMainCategories(),
    select: (response) => response.data,
  });
};
