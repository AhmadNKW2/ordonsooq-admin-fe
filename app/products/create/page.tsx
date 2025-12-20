/**
 * Create Product Page
 * Page for creating new products with single-page form
 */

"use client";

import React from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "../../src/components/products/ProductForm";
import { ProductFormData } from "../../src/services/products/types/product-form.types";
import { useCategories } from "../../src/services/categories/hooks/use-categories";
import { useVendors } from "../../src/services/vendors/hooks/use-vendors";
import { useBrands } from "../../src/services/brands/hooks/use-brands";
import { useAttributes } from "../../src/services/attributes/hooks/use-attributes";
import { productService } from "../../src/services/products/api/product.service";
import { mediaService } from "../../src/services/media/api/media.service";
import { transformFormDataToDto, UploadedMediaReference } from "../../src/services/products/form/transform";
import { queryKeys } from "../../src/lib/query-keys";
import { MediaInputDto } from "../../src/services/products/types/product.types";
import { Attribute, AttributeValue } from "../../src/services/attributes/types/attribute.types";
import { finishToastError, finishToastSuccess, showLoadingToast, updateLoadingToast } from "../../src/lib/toast";

export default function CreateProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors();
  const { data: brandsData, isLoading: brandsLoading } = useBrands();
  const { data: attributesData, isLoading: attributesLoading } = useAttributes();

  // Transform backend data to frontend format
  const categories = categoriesData || [];

  const vendors = vendorsData?.map(vendor => ({
    id: vendor.id.toString(),
    name: vendor.name_en,
    nameEn: vendor.name_en,
    nameAr: vendor.name_ar,
  })) || [];

  const brands = brandsData?.map(brand => ({
    id: brand.id.toString(),
    name: brand.name_en,
    nameEn: brand.name_en,
    nameAr: brand.name_ar,
  })) || [];

  const attributes = attributesData?.map((attr: Attribute) => ({
    id: attr.id.toString(),
    name: attr.name_en,
    displayName: attr.name_ar,
    values: attr.values?.map((val: AttributeValue) => ({
      id: val.id.toString(),
      value: val.value_en,
      displayValue: val.value_ar,
    })) || [],
  })) || [];

  const handleSubmit = async (data: ProductFormData) => {
    const toastId = showLoadingToast("Creating product...");
    try {
      // Transform form data to DTO and extract media files
      const { dto, mediaFiles } = transformFormDataToDto(data);

      const totalUploads =
        (mediaFiles.singleMedia?.filter(m => !!m.file).length ?? 0) +
        (mediaFiles.variantMedia?.reduce((sum, group) => {
          return sum + (group.media?.filter(m => !!m.file).length ?? 0);
        }, 0) ?? 0);

      let completedUploads = 0;

      if (totalUploads > 0) {
        updateLoadingToast(toastId, {
          title: "Uploading media",
          subtitle: `0/${totalUploads} files`,
          progress: 0,
        });
      } else {
        updateLoadingToast(toastId, {
          title: "Creating product",
          subtitle: "Preparing request",
          progress: 0,
        });
      }
      
      // Step 1: Upload all media files first and collect media IDs
      const uploadedMedia: MediaInputDto[] = [];
      
      // Upload single media (non-variant)
      if (mediaFiles.singleMedia && mediaFiles.singleMedia.length > 0) {
        for (const media of mediaFiles.singleMedia) {
          if (media.file) {
            updateLoadingToast(toastId, {
              title: "Uploading media",
              subtitle: `${completedUploads + 1}/${totalUploads} files`,
              progress: totalUploads > 0 ? completedUploads / totalUploads : 0,
            });
            const uploadResult = await mediaService.uploadMedia(media.file);
            completedUploads += 1;
            updateLoadingToast(toastId, {
              title: "Uploading media",
              subtitle: `${completedUploads}/${totalUploads} files`,
              progress: totalUploads > 0 ? completedUploads / totalUploads : 0,
            });
            uploadedMedia.push({
              media_id: uploadResult.data.id,
              is_primary: media.isPrimary,
              sort_order: media.order,
            });
          }
        }
      }

      // Upload variant media (with combinations)
      if (mediaFiles.variantMedia && mediaFiles.variantMedia.length > 0) {
        // Get media-controlling attribute IDs
        const mediaControllingAttrIds = (data.attributes || [])
          .filter(attr => attr.controlsMedia)
          .map(attr => attr.id);

        for (const variantMediaData of mediaFiles.variantMedia) {
          // Build combination object with only media-controlling attributes
          const combination: Record<string, number> = {};
          for (const attrId of mediaControllingAttrIds) {
            const valueId = variantMediaData.attributeValues[attrId];
            if (valueId && valueId !== '') {
              combination[attrId] = parseInt(valueId, 10);
            }
          }

          for (const media of variantMediaData.media) {
            if (media.file) {
              updateLoadingToast(toastId, {
                title: "Uploading media",
                subtitle: `${completedUploads + 1}/${totalUploads} files`,
                progress: totalUploads > 0 ? completedUploads / totalUploads : 0,
              });
              const uploadResult = await mediaService.uploadMedia(media.file);
              completedUploads += 1;
              updateLoadingToast(toastId, {
                title: "Uploading media",
                subtitle: `${completedUploads}/${totalUploads} files`,
                progress: totalUploads > 0 ? completedUploads / totalUploads : 0,
              });
              uploadedMedia.push({
                media_id: uploadResult.data.id,
                is_primary: media.isPrimary,
                sort_order: media.order,
                combination: Object.keys(combination).length > 0 ? combination : undefined,
              });
            }
          }
        }
      }

      // Step 2: Add uploaded media to DTO
      if (uploadedMedia.length > 0) {
        dto.media = uploadedMedia;
      }
      
      // Step 3: Create product with all data including media
      updateLoadingToast(toastId, {
        title: "Creating product",
        subtitle: "Sending request",
        progress: 0.9,
      });
      await productService.createProduct(dto);
      
      // Invalidate products list query to refetch data
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

      finishToastSuccess(toastId, "Product created successfully");
      
      router.push("/products");
    } catch (error: any) {
      console.error("Error creating product:", error);
      finishToastError(toastId, error?.message || "Failed to create product");
    }
  };

  const handleSaveDraft = async (data: Partial<ProductFormData>) => {
    try {
      // TODO: Implement draft saving functionality
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  return (
    <ProductForm
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      categories={categories}
      vendors={vendors}
      brands={brands}
      attributes={attributes}
    />
  );
}
