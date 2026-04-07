import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/query-keys";
import { categoryUrlService } from "../api/category-url.service";
import {
  CategoryUrlMapping,
  CategoryUrlMappingsQueryParams,
} from "../types/category-url.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractMappingsArray = (payload: unknown): CategoryUrlMapping[] => {
  if (Array.isArray(payload)) {
    return payload as CategoryUrlMapping[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.urls,
    payload.mappings,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as CategoryUrlMapping[];
    }
  }

  return [];
};

export const useVendorCategoryUrls = (
  vendorId?: number,
  params?: CategoryUrlMappingsQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.categories.vendorUrls(vendorId ?? "new", params),
    queryFn: () => categoryUrlService.getVendorCategoryUrls(vendorId as number, params),
    select: (response) => extractMappingsArray(response.data),
    enabled: (options?.enabled ?? true) && !!vendorId,
    refetchOnWindowFocus: false,
  });
};