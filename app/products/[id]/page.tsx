/**
 * Edit Product Page
 * Page for editing existing products
 */

"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/hooks/use-loading-router";
import { ProductForm } from "../../src/components/products/ProductForm";
import { ProductFormData } from "../../src/services/products/types/product-form.types";
import { ProductDetail, MediaInputDto, UpdateProductDto } from "../../src/services/products/types/product.types";
import { useCategories } from "../../src/services/categories/hooks/use-categories";
import { useVendors } from "../../src/services/vendors/hooks/use-vendors";
import { useBrands } from "../../src/services/brands/hooks/use-brands";
import { useAttributes } from "../../src/services/attributes/hooks/use-attributes";
import { useProduct } from "../../src/services/products/hooks/use-products";
import { productService } from "../../src/services/products/api/product.service";
import { mediaService } from "../../src/services/media/api/media.service";
import { Card } from "../../src/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../../src/components/ui/button";
import { Attribute, AttributeValue } from "../../src/services/attributes/types/attribute.types";
import { finishToastError, finishToastSuccess, showLoadingToast, updateLoadingToast } from "../../src/lib/toast";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const product_id = Number(params?.id);
  const isValidProductId = Number.isFinite(product_id);

  if (!isValidProductId) {
    return null;
  }

  const { data: productData, isLoading: productLoading, isError: productError, error: productErrorData, refetch: refetchProduct } = useProduct(product_id, { enabled: isValidProductId });
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

  // Transform product data to form initial data
  const product: ProductDetail | undefined = productData?.data as ProductDetail | undefined;
  
  // Helper function to build attributeValues map from variant combinations
  const buildAttributeValuesMap = (combinations: any[]): { [attrId: string]: string } => {
    const map: { [attrId: string]: string } = {};
    combinations?.forEach((combo: any) => {
      const attrId = (combo.attribute_id || combo.attribute_value?.attribute_id)?.toString();
      const valueId = (combo.value_id || combo.attribute_value_id)?.toString();
      if (attrId && valueId) {
        map[attrId] = valueId;
      }
    });
    return map;
  };

  // Helper function to build attributeValues map from groupValues or combination
  const buildAttributeValuesFromItem = (item: any): { [attrId: string]: string } => {
    const map: { [attrId: string]: string } = {};
    
    // First try groupValues format (array of { attribute_id, attribute_value_id })
    if (item?.groupValues && Array.isArray(item.groupValues)) {
      item.groupValues.forEach((gv: any) => {
        const attrId = gv.attribute_id?.toString();
        const valueId = gv.attribute_value_id?.toString();
        if (attrId && valueId) {
          map[attrId] = valueId;
        }
      });
      return map;
    }
    
    // Fallback to combination format (object { "attr_id": value_id })
    if (item?.combination && typeof item.combination === 'object') {
      for (const [attrId, valueId] of Object.entries(item.combination)) {
        if (attrId && valueId !== undefined && valueId !== null) {
          map[attrId] = valueId.toString();
        }
      }
    }
    
    return map;
  };

  // Legacy function for backward compatibility - delegates to buildAttributeValuesFromItem
  const buildAttributeValuesFromGroupValues = (groupValues: any[]): { [attrId: string]: string } => {
    return buildAttributeValuesFromItem({ groupValues });
  };

  // Helper function to generate variant key from attributeValues
  const generateVariantKey = (attributeValues: { [attrId: string]: string }): string => {
    return Object.values(attributeValues).sort().join('-');
  };

  // Transform attributes from product data
  const transformProductAttributes = () => {
    if (!product?.attributes || product.attributes.length === 0) return undefined;
    
    // Get unique attribute values used across all variants
    const attributeValuesUsed: { [attrId: string]: Set<string> } = {};
    
    product.variants?.forEach((variant: any) => {
      variant.combinations?.forEach((combo: any) => {
        const attrId = (combo.attribute_id || combo.attribute_value?.attribute_id)?.toString();
        const valueId = (combo.value_id || combo.attribute_value_id)?.toString();
        if (attrId && valueId) {
          if (!attributeValuesUsed[attrId]) {
            attributeValuesUsed[attrId] = new Set();
          }
          attributeValuesUsed[attrId].add(valueId);
        }
      });
    });

    return product.attributes.map((attr: any, index: number) => {
      const attrId = attr.attribute_id?.toString() || attr.attribute?.id?.toString();
      const attrName = attr.attribute?.name_en || '';
      
      // Get the values used for this attribute from variants
      const usedValueIds = attributeValuesUsed[attrId] || new Set();
      
      // Find all values from availableAttributes that match the used IDs
      const availableAttr = attributesData?.find((a: Attribute) => a.id.toString() === attrId);
      const values = availableAttr?.values
        ?.filter((v: AttributeValue) => usedValueIds.has(v.id.toString()))
        .map((v: AttributeValue, idx: number) => ({
          id: v.id.toString(),
          value: v.value_en,
          order: idx,
        })) || [];

      return {
        id: attrId,
        name: attrName,
        values,
        order: index,
        controlsPricing: attr.controls_pricing || false,
        controlsWeightDimensions: attr.controls_weight || false,
        controlsMedia: attr.controls_media || false,
      };
    });
  };

  // Transform variant pricing from prices array
  const transformVariantPricing = () => {
    // Only for variant products (products with attributes)
    if (!product?.attributes || product.attributes.length === 0) return undefined;
    
    // Use prices array with groupValues or combination for variant pricing
    const prices = (product as any).prices;
    if (prices && prices.length > 0) {
      return prices.map((pg: any) => {
        const attributeValues = buildAttributeValuesFromItem(pg);
        const key = generateVariantKey(attributeValues);
        
        return {
          key,
          attributeValues,
          cost: pg.cost ? parseFloat(pg.cost) : 0,
          price: pg.price ? parseFloat(pg.price) : 0,
          isSale: !!pg.sale_price,
          salePrice: pg.sale_price ? parseFloat(pg.sale_price) : undefined,
        };
      });
    }
    
    return undefined;
  };

  // Transform variant weight/dimensions from weights array
  const transformVariantWeightDimensions = () => {
    // Use weights array with groupValues or combination for variant weights
    const weights = (product as any).weights;
    if (!weights || weights.length === 0) return undefined;

    return weights.map((wg: any) => {
      const attributeValues = buildAttributeValuesFromItem(wg);
      const key = generateVariantKey(attributeValues);
      
      return {
        key,
        attributeValues,
        weight: wg.weight ? parseFloat(wg.weight) : undefined,
        length: wg.length ? parseFloat(wg.length) : undefined,
        width: wg.width ? parseFloat(wg.width) : undefined,
        height: wg.height ? parseFloat(wg.height) : undefined,
      };
    });
  };

  // Transform variants (stock) from product data
  const transformVariants = () => {
    // For variant products with variants array
    if (product?.variants && product.variants.length > 0) {
      return product.variants.map((variant: any) => {
        const stock = product.stock?.find((s: any) => s.variant_id === variant.id);
        const attributeValues = buildAttributeValuesMap(variant.combinations);
        
        return {
          id: variant.id.toString(),
          attributeValues,
          stock: stock?.quantity || 0,
        };
      });
    }
    
    // For single products, get stock from stock array where variant_id is null
    if (product?.stock && product.stock.length > 0) {
      const singleStock = product.stock.find((s: any) => s.variant_id === null);
      if (singleStock) {
        return [{
          id: 'single',
          attributeValues: {},
          stock: singleStock.quantity || 0,
        }];
      }
    }
    
    return undefined;
  };

  // Check if weight is variant-based (has weights with groupValues)
  const isWeightVariantBased = () => {
    // Check if any attribute controls weight (from product attributes)
    const productAttributes = product?.attributes;
    if (productAttributes && productAttributes.length > 0) {
      if (productAttributes.some((attr: any) => attr.controls_weight === true)) {
        return true;
      }
    }
    
    // Check if weights exist with non-empty groupValues (variant-based)
    const weights = (product as any)?.weights;
    if (weights && weights.length > 0) {
      // If any weight has groupValues, it's variant-based
      return weights.some((w: any) => w.groupValues && w.groupValues.length > 0);
    }
    
    return false;
  };

  // Check if media is variant-based (has media_group with groupValues)
  const isMediaVariantBased = () => {
    // Check if any attribute controls media (from product attributes)
    const productAttributes = product?.attributes;
    if (productAttributes && productAttributes.length > 0) {
      if (productAttributes.some((attr: any) => attr.controls_media === true)) {
        return true;
      }
    }
    
    // Check if any media has media_group with non-empty groupValues (variant-based)
    const media = product?.media;
    if (media && media.length > 0) {
      return media.some((m: any) => m.media_group?.groupValues && m.media_group.groupValues.length > 0);
    }
    
    return false;
  };

  // Transform single media (non-variant) - for products without variant-based media
  const transformSingleMedia = () => {
    if (!product?.media || product.media.length === 0) return [];
    
    // Return all media sorted by sort_order
    return product.media
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((m: any) => ({
        id: m.id.toString(),
        file: null,
        preview: m.url,
        type: m.type as 'image' | 'video',
        order: m.sort_order,
        isPrimary: m.is_primary,
        isGroupPrimary: m.is_group_primary,
      }));
  };

  // Transform variant media from media array with media_group
  const transformVariantMedia = () => {
    if (!product?.media || product.media.length === 0) return undefined;

    // Group media by media_group.id
    const mediaGroupMap = new Map<number, { groupValues: any[]; mediaItems: any[] }>();
    
    product.media.forEach((m: any) => {
      if (!m.media_group) return;
      
      const groupId = m.media_group.id;
      if (!mediaGroupMap.has(groupId)) {
        mediaGroupMap.set(groupId, {
          groupValues: m.media_group.groupValues || [],
          mediaItems: [],
        });
      }
      
      mediaGroupMap.get(groupId)!.mediaItems.push({
        id: m.id.toString(),
        file: null,
        preview: m.url,
        type: m.type as 'image' | 'video',
        order: m.sort_order,
        isPrimary: m.is_primary,
        isGroupPrimary: m.is_group_primary,
      });
    });

    // Convert to array format
    return Array.from(mediaGroupMap.values()).map((group) => {
      const attributeValues = buildAttributeValuesFromGroupValues(group.groupValues);
      const key = generateVariantKey(attributeValues);
      
      return {
        key,
        attributeValues,
        media: group.mediaItems.sort((a: any, b: any) => a.order - b.order),
      };
    });
  };

  const transformSingleWeight = () => {
    // Check for weights array (single product would have one weight with empty groupValues)
    const weights = (product as any)?.weights;
    if (weights && weights.length > 0) {
      // For single products, use the first weight (should have empty groupValues)
      const singleWeight = weights[0];
      return {
        weight: singleWeight.weight ? parseFloat(singleWeight.weight) : undefined,
        length: singleWeight.length ? parseFloat(singleWeight.length) : undefined,
        width: singleWeight.width ? parseFloat(singleWeight.width) : undefined,
        height: singleWeight.height ? parseFloat(singleWeight.height) : undefined,
      };
    }
    
    return undefined;
  };

  const transformSinglePricing = () => {
    // Only for single products (products without attributes)
    if (product?.attributes && product.attributes.length > 0) return undefined;
    
    // Check for prices array (single product would have one price with empty groupValues)
    const prices = (product as any)?.prices;
    if (prices && prices.length > 0) {
      const pricing = prices[0];
      return {
        cost: parseFloat(pricing.cost),
        price: parseFloat(pricing.price),
        isSale: !!pricing.sale_price,
        salePrice: pricing.sale_price ? parseFloat(pricing.sale_price) : undefined,
      };
    }
    
    return undefined;
  };

  const initialData: Partial<ProductFormData> | undefined = React.useMemo(() => {
    if (!product) return undefined;
    
    return {
      // Basic Information
      nameEn: product.name_en,
      nameAr: product.name_ar,
      categoryIds: product.category_ids?.map(id => id.toString()) || 
                   (product.category?.id ? [product.category.id.toString()] : 
                   (product.category_id ? [product.category_id.toString()] : [])),
      vendorId: product.vendor?.id?.toString() || product.vendor_id?.toString(),
      brandId: product.brand?.id?.toString() || product.brand_id?.toString(),
      shortDescriptionEn: product.short_description_en || "",
      shortDescriptionAr: product.short_description_ar || "",
    longDescriptionEn: product.long_description_en || "",
    longDescriptionAr: product.long_description_ar || "",
    visible: product.visible ?? product.is_active,
    
    // Attributes (for variant products)
    attributes: (product.attributes && product.attributes.length > 0) ? transformProductAttributes() : undefined,
    
    // Pricing
    singlePricing: (!product.attributes || product.attributes.length === 0) ? transformSinglePricing() : undefined,
    variantPricing: (product.attributes && product.attributes.length > 0) ? transformVariantPricing() : undefined,
    
    // Weight & Dimensions
    isWeightVariantBased: isWeightVariantBased(),
    singleWeightDimensions: !isWeightVariantBased() ? transformSingleWeight() : undefined,
    variantWeightDimensions: isWeightVariantBased() ? transformVariantWeightDimensions() : undefined,
    
    // Media
    isMediaVariantBased: isMediaVariantBased(),
    singleMedia: !isMediaVariantBased() ? transformSingleMedia() : [],
    variantMedia: isMediaVariantBased() ? transformVariantMedia() : undefined,
    
    // Stock/Variants
    variants: transformVariants(),
  };
  }, [product, attributesData]);

  const handleSubmit = async (data: ProductFormData) => {
    const toastId = showLoadingToast("Updating product...");
    console.log('=== DEBUG: Edit Product handleSubmit called ===');
    console.log('ProductFormData received:', data);
    console.log('data.nameEn:', data.nameEn);
    console.log('data.nameAr:', data.nameAr);
    console.log('data.categoryIds:', data.categoryIds);
    console.log('data.vendorId:', data.vendorId);
    console.log('data.visible:', data.visible);
    console.log('data.attributes:', data.attributes);
    console.log('data.singlePricing:', data.singlePricing);
    console.log('data.variantPricing:', data.variantPricing);
    console.log('data.isWeightVariantBased:', data.isWeightVariantBased);
    console.log('data.singleWeightDimensions:', data.singleWeightDimensions);
    console.log('data.variantWeightDimensions:', data.variantWeightDimensions);
    console.log('data.isMediaVariantBased:', data.isMediaVariantBased);
    console.log('data.singleMedia:', data.singleMedia);
    console.log('data.variantMedia:', data.variantMedia);
    console.log('data.variants:', data.variants);
    
    try {
      const totalUploads =
        (data.singleMedia?.filter(m => !!m.file).length ?? 0) +
        (data.variantMedia?.reduce((sum, group) => {
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
          title: "Updating product",
          subtitle: "Preparing request",
          progress: 0,
        });
      }
      // ========== DETECT ATTRIBUTE CHANGES ==========
      // Get original attribute IDs and their controlling flags
      const originalAttrIds = new Set(
        product?.attributes?.map((a: any) => a.attribute_id?.toString() || a.attribute?.id?.toString()) || []
      );
      const newAttrIds = new Set(data.attributes?.map(a => a.id) || []);
      
      // Check if any attribute was REMOVED (original has IDs that new doesn't have)
      const attributeRemoved = [...originalAttrIds].some(id => !newAttrIds.has(id));
      
      // Get original controlling flags
      const originalPricingControlled = product?.attributes?.some((a: any) => a.controls_pricing) || false;
      const originalWeightControlled = product?.attributes?.some((a: any) => a.controls_weight) || false;
      const originalMediaControlled = product?.attributes?.some((a: any) => a.controls_media) || false;
      
      // Get new controlling flags
      const newPricingControlled = data.attributes?.some(a => a.controlsPricing) || false;
      const newWeightControlled = data.attributes?.some(a => a.controlsWeightDimensions) || false;
      const newMediaControlled = data.attributes?.some(a => a.controlsMedia) || false;
      
      // Determine what needs to be cleared:
      // - If attribute REMOVED: clear ALL (prices, weights, media) since combinations become invalid
      // - If attribute ADDED: only clear if the corresponding control flag changed
      const shouldClearPrices = attributeRemoved || (originalPricingControlled !== newPricingControlled);
      const shouldClearWeights = attributeRemoved || (originalWeightControlled !== newWeightControlled);
      const shouldClearMedia = attributeRemoved || (originalMediaControlled !== newMediaControlled);
      
      console.log('=== DEBUG: Attribute Change Detection ===');
      console.log('originalAttrIds:', [...originalAttrIds]);
      console.log('newAttrIds:', [...newAttrIds]);
      console.log('attributeRemoved:', attributeRemoved);
      console.log('originalPricingControlled:', originalPricingControlled, '-> newPricingControlled:', newPricingControlled);
      console.log('originalWeightControlled:', originalWeightControlled, '-> newWeightControlled:', newWeightControlled);
      console.log('originalMediaControlled:', originalMediaControlled, '-> newMediaControlled:', newMediaControlled);
      console.log('shouldClearPrices:', shouldClearPrices);
      console.log('shouldClearWeights:', shouldClearWeights);
      console.log('shouldClearMedia:', shouldClearMedia);
      
      // Build product payload for PUT request
      const productPayload: UpdateProductDto = {
        // ========== BASIC INFORMATION ==========
        name_en: data.nameEn,
        name_ar: data.nameAr,
        short_description_en: data.shortDescriptionEn || '',
        short_description_ar: data.shortDescriptionAr || '',
        long_description_en: data.longDescriptionEn || '',
        long_description_ar: data.longDescriptionAr || '',
        category_ids: (data.categoryIds || []).map(id => parseInt(id)),
        vendor_id: data.vendorId ? parseInt(data.vendorId) : undefined,
        brand_id: data.brandId ? parseInt(data.brandId) : undefined,
        visible: data.visible,
      };


      console.log('=== DEBUG: Basic Information Payload ===');
      console.log('productPayload (basic):', productPayload);

      // ========== ATTRIBUTES ==========
      if (data.attributes && data.attributes.length > 0) {
        productPayload.attributes = data.attributes.map(attr => ({
          attribute_id: parseInt(attr.id),
          controls_pricing: attr.controlsPricing || false,
          controls_media: attr.controlsMedia || false,
          controls_weight: attr.controlsWeightDimensions || false,
        }));
        console.log('=== DEBUG: Attributes Payload ===');
        console.log('productPayload.attributes:', productPayload.attributes);
      } else {
        // If attributes were removed entirely, send empty array to clear them
        if (originalAttrIds.size > 0) {
          productPayload.attributes = [];
          console.log('=== DEBUG: Clearing all attributes ===');
        }
      }

      // ========== PRICING ==========
      // If pricing control changed (attributes added/removed/changed), clear old prices and use new data
      if (shouldClearPrices) {
        console.log('=== DEBUG: Pricing control changed, will use only new pricing data ===');
      }
      
      const hasPricingAttributes = data.attributes?.some(a => a.controlsPricing);

      if (!hasPricingAttributes) {
        // Single pricing - no combination (either no attributes, or attributes don't control pricing)
        if (data.singlePricing) {
          productPayload.prices = [{
            cost: data.singlePricing.cost,
            price: data.singlePricing.price,
            sale_price: data.singlePricing.isSale !== false ? data.singlePricing.salePrice : undefined,
          }];
          console.log('=== DEBUG: Single Pricing Payload ===');
          console.log('productPayload.prices:', productPayload.prices);
        } else if (shouldClearPrices) {
          // No single pricing provided but we need to clear old variant prices
          productPayload.prices = [];
          console.log('=== DEBUG: Clearing prices (no single pricing provided) ===');
        }
      } else {
        // Variant pricing - with combinations
        if (data.variantPricing && data.variantPricing.length > 0) {
          // Get pricing-controlling attribute IDs
          const pricingControllingAttrIds = (data.attributes || [])
            .filter(attr => attr.controlsPricing)
            .map(attr => attr.id);

          console.log('=== DEBUG: Variant Pricing ===');
          console.log('pricingControllingAttrIds:', pricingControllingAttrIds);
          console.log('data.variantPricing:', data.variantPricing);

          productPayload.prices = data.variantPricing.map(vp => {
            const combination: Record<string, number> = {};
            pricingControllingAttrIds.forEach(attrId => {
              const attrValueId = vp.attributeValues[attrId];
              if (attrValueId) {
                combination[attrId] = parseInt(attrValueId);
              }
            });
            
            return {
              combination,
              cost: vp.cost,
              price: vp.price,
              // isSale defaults to true, so include salePrice unless explicitly false
              sale_price: vp.isSale !== false ? vp.salePrice : undefined,
            };
          });
          console.log('productPayload.prices:', productPayload.prices);
        } else if (shouldClearPrices) {
          // No variant pricing provided but we need to clear old prices
          productPayload.prices = [];
          console.log('=== DEBUG: Clearing prices (no variant pricing provided) ===');
        }
      }

      // ========== WEIGHT & DIMENSIONS ==========
      console.log('=== DEBUG: Weight & Dimensions ===');
      console.log('data.isWeightVariantBased:', data.isWeightVariantBased);
      console.log('data.singleWeightDimensions:', data.singleWeightDimensions);
      console.log('data.variantWeightDimensions:', data.variantWeightDimensions);
      
      // If weight control changed (attributes added/removed/changed), clear old weights and use new data
      if (shouldClearWeights) {
        console.log('=== DEBUG: Weight control changed, will use only new weight data ===');
      }
      
      if (!data.isWeightVariantBased && data.singleWeightDimensions) {
        // Single weight - no combination
        productPayload.weights = [{
          weight: data.singleWeightDimensions.weight,
          length: data.singleWeightDimensions.length,
          width: data.singleWeightDimensions.width,
          height: data.singleWeightDimensions.height,
        }];
      } else if (data.isWeightVariantBased && data.variantWeightDimensions && data.variantWeightDimensions.length > 0) {
        // Get weight-controlling attribute IDs
        const weightControllingAttrIds = (data.attributes || [])
          .filter(attr => attr.controlsWeightDimensions)
          .map(attr => attr.id);

        // Variant weights - with combinations
        productPayload.weights = data.variantWeightDimensions.map(vw => {
          const combination: Record<string, number> = {};
          weightControllingAttrIds.forEach(attrId => {
            const attrValueId = vw.attributeValues[attrId];
            if (attrValueId) {
              combination[attrId] = parseInt(attrValueId);
            }
          });
          
          return {
            combination,
            weight: vw.weight,
            length: vw.length,
            width: vw.width,
            height: vw.height,
          };
        });
      } else if (shouldClearWeights) {
        // No weight data provided but we need to clear old weights
        productPayload.weights = [];
        console.log('=== DEBUG: Clearing weights (no weight data provided) ===');
      }

      // ========== STOCK ==========
      if (!data.attributes || data.attributes.length === 0) {
        // Single stock - no combination
        const singleVariant = data.variants?.[0];
        if (singleVariant) {
          productPayload.stocks = [{
            quantity: singleVariant.stock ?? 0,
          }];
        }
      } else if (data.variants && data.variants.length > 0) {
        // Variant stocks - with combinations
        productPayload.stocks = data.variants.map(v => {
          const combination: Record<string, number> = {};
          Object.entries(v.attributeValues || {}).forEach(([attrId, attrValueId]) => {
            if (attrValueId) {
              combination[attrId] = parseInt(attrValueId);
            }
          });
          
          return {
            combination,
            quantity: v.stock ?? 0,
          };
        });
      }

      // ========== MEDIA ==========
      // New flow: upload new files first, then build complete media array
      const mediaArray: MediaInputDto[] = [];

      // Get media-controlling attribute IDs
      const mediaControllingAttrIds = (data.attributes || [])
        .filter(attr => attr.controlsMedia)
        .map(attr => attr.id);

      // If media control changed (attributes added/removed/changed), clear old media and use new data
      if (shouldClearMedia) {
        console.log('=== DEBUG: Media control changed, will use only new media data ===');
      }

      if (!data.isMediaVariantBased && data.singleMedia && data.singleMedia.length > 0) {
        // Single media (non-variant)
        for (const media of data.singleMedia) {
          if (media.file) {
            // New file - upload first
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
            mediaArray.push({
              media_id: uploadResult.data.id,
              is_primary: media.isPrimary,
              is_group_primary: media.isGroupPrimary,
              sort_order: media.order,
            });
          } else {
            // Existing media - use existing ID (only keep if media control didn't change)
            const mediaId = parseInt(media.id);
            if (!isNaN(mediaId)) {
              mediaArray.push({
                media_id: mediaId,
                is_primary: media.isPrimary,
                is_group_primary: media.isGroupPrimary,
                sort_order: media.order,
              });
            }
          }
        }
      } else if (data.isMediaVariantBased && data.variantMedia && data.variantMedia.length > 0) {
        // Variant media (with combinations)
        for (const variantMediaData of data.variantMedia) {
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
              // New file - upload first
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
              mediaArray.push({
                media_id: uploadResult.data.id,
                is_primary: media.isPrimary,
                is_group_primary: media.isGroupPrimary,
                sort_order: media.order,
                combination: Object.keys(combination).length > 0 ? combination : undefined,
              });
            } else {
              // Existing media - use existing ID
              const mediaId = parseInt(media.id);
              if (!isNaN(mediaId)) {
                mediaArray.push({
                  media_id: mediaId,
                  is_primary: media.isPrimary,
                  is_group_primary: media.isGroupPrimary,
                  sort_order: media.order,
                  combination: Object.keys(combination).length > 0 ? combination : undefined,
                });
              }
            }
          }
        }
      }

      // Add media array to payload - backend will sync (add new, remove missing, update existing)
      // If shouldClearMedia and no new media, send empty array to clear all existing
      if (mediaArray.length > 0) {
        productPayload.media = mediaArray;
      } else if (shouldClearMedia) {
        productPayload.media = [];
        console.log('=== DEBUG: Clearing media (no media data provided) ===');
      }

      console.log('=== DEBUG: Final Product Payload ===');
      console.log('productPayload:', JSON.stringify(productPayload, null, 2));
      console.log('productPayload.prices:', productPayload.prices);
      console.log('productPayload.weights:', productPayload.weights);
      console.log('productPayload.stocks:', productPayload.stocks);
      console.log('productPayload.media:', productPayload.media);
      console.log('productPayload.attributes:', productPayload.attributes);

      console.log('=== DEBUG: Calling productService.updateProduct ===');
      console.log('product_id:', product_id);
      
      // Update product with PUT request (full update including media)
      updateLoadingToast(toastId, {
        title: "Updating product",
        subtitle: "Sending request",
        progress: 0.9,
      });
      const updateResult = await productService.updateProduct(product_id, productPayload);
      
      console.log('=== DEBUG: Update Result ===');
      console.log('updateResult:', updateResult);

      finishToastSuccess(toastId, "Product updated successfully");
      
    } catch (error: any) {
      console.error("=== DEBUG: Error updating product ===");
      console.error("Error:", error);
      console.error("Error message:", error?.message);
      console.error("Error response:", error?.response);
      console.error("Error data:", error?.response?.data);

      finishToastError(toastId, error?.message || "Failed to update product");
    }
  };

  const handleSaveDraft = async (data: Partial<ProductFormData>) => {
    try {
      // TODO: Implement draft saving functionality
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  if (productError) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold  mb-2">
                Error Loading Product
              </h3>
              <p className=" mb-6">{(productErrorData as any)?.message || "Failed to load product"}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => refetchProduct()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push("/products")}>
                  Back to Products
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!productLoading && !productError && !initialData) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto">
          <Card>
            <div className="p-12 text-center">
              <h3 className="text-xl font-bold  mb-2">Product Not Found</h3>
              <p className=" mb-6">The product you're looking for doesn't exist.</p>
              <Button onClick={() => router.push("/products")}>
                Back to Products
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      isEditMode={true}
      initialData={initialData}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      categories={categories}
      vendors={vendors}
      brands={brands}
      attributes={attributes}
    />
  );
}
