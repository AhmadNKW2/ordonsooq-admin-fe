import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  reorderBanners,
} from "../banner.service";
import { showSuccessToast } from "../../../lib/toast";

export const useBanners = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["banners", params],
    queryFn: () => getBanners(params),
  });
};

export const useBanner = (id: number) => {
  return useQuery({
    queryKey: ["banners", id],
    queryFn: () => getBannerById(id),
    enabled: !!id,
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createBanner(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      showSuccessToast("Banner created successfully");
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      updateBanner(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", variables.id] });
      showSuccessToast("Banner updated successfully");
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      showSuccessToast("Banner deleted successfully");
    },
  });
};

export const useToggleBannerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleBannerStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      showSuccessToast("Banner status updated successfully");
    },
  });
};

export const useReorderBanners = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bannerIds: number[]) => reorderBanners(bannerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      showSuccessToast("Banners reordered successfully");
    },
  });
};
