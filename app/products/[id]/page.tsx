/**
 * Edit Product Page
 * Page for editing existing products
 */

"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ProductForm } from "../../src/components/products/ProductForm";
import { ProductFormData } from "../../src/services/products/types/product-form.types";
import { ProductDetail } from "../../src/services/products/types/product.types";
import { useCategories } from "../../src/services/categories/hooks/use-categories";
import { useVendors } from "../../src/services/vendors/hooks/use-vendors";
import { useAttributes } from "../../src/services/attributes/hooks/use-attributes";
import { useProduct } from "../../src/services/products/hooks/use-products";
import { productService } from "../../src/services/products/api/product.service";
import { Card } from "../../src/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../../src/components/ui/button";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);

  const { data: productData, isLoading: productLoading, isError: productError, error: productErrorData, refetch: refetchProduct } = useProduct(productId);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors();
  const { data: attributesData, isLoading: attributesLoading } = useAttributes();

  // Transform backend data to frontend format
  const categories = categoriesData?.map(cat => ({
    id: cat.id.toString(),
    name: cat.name,
  })) || [];

  const vendors = vendorsData?.map(vendor => ({
    id: vendor.id.toString(),
    name: vendor.name,
  })) || [];

  const attributes = attributesData?.map(attr => ({
    id: attr.id.toString(),
    name: attr.name_en,
    displayName: attr.name_ar,
    values: attr.values?.map(val => ({
      id: val.id.toString(),
      value: val.value_en,
      displayValue: val.value_ar,
    })) || [],
  })) || [];

  // Transform product data to form initial data
  const product: ProductDetail | undefined = productData?.data;
  
  // Helper function to build attributeValues map from variant combinations
  const buildAttributeValuesMap = (combinations: any[]): { [attrId: string]: string } => {
    const map: { [attrId: string]: string } = {};
    combinations?.forEach((combo: any) => {
      const attrId = combo.attribute_value?.attribute_id?.toString();
      const valueId = combo.attribute_value_id?.toString();
      if (attrId && valueId) {
        map[attrId] = valueId;
      }
    });
    return map;
  };

  // Helper function to build attributeValues map from groupValues
  const buildAttributeValuesFromGroupValues = (groupValues: any[]): { [attrId: string]: string } => {
    const map: { [attrId: string]: string } = {};
    groupValues?.forEach((gv: any) => {
      const attrId = gv.attribute_id?.toString();
      const valueId = gv.attribute_value_id?.toString();
      if (attrId && valueId) {
        map[attrId] = valueId;
      }
    });
    return map;
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
        const attrId = combo.attribute_value?.attribute_id?.toString();
        const valueId = combo.attribute_value_id?.toString();
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
      const availableAttr = attributesData?.find(a => a.id.toString() === attrId);
      const values = availableAttr?.values
        ?.filter(v => usedValueIds.has(v.id.toString()))
        .map((v, idx) => ({
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

  // Transform variant pricing from priceGroups
  const transformVariantPricing = () => {
    if (product?.pricing_type !== 'variant') return undefined;
    
    // Use priceGroups if available (new API structure)
    const priceGroups = (product as any).priceGroups;
    if (priceGroups && priceGroups.length > 0) {
      return priceGroups.map((pg: any) => {
        const attributeValues = buildAttributeValuesFromGroupValues(pg.groupValues || []);
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

  // Transform variant weight/dimensions from weightGroups
  const transformVariantWeightDimensions = () => {
    // Use weightGroups if available (new API structure)
    const weightGroups = (product as any).weightGroups;
    if (!weightGroups || weightGroups.length === 0) return undefined;

    return weightGroups.map((wg: any) => {
      const attributeValues = buildAttributeValuesFromGroupValues(wg.groupValues || []);
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
    if (!product?.variants || product.variants.length === 0) return undefined;
    
    return product.variants.map((variant: any) => {
      const stock = product.stock?.find((s: any) => s.variant_id === variant.id);
      const attributeValues = buildAttributeValuesMap(variant.combinations);
      
      return {
        id: variant.id.toString(),
        attributeValues,
        stock: stock?.quantity || 0,
      };
    });
  };

  // Check if weight is variant-based (has weightGroups)
  // Check if weight is variant-based (has weightGroups OR any attribute controls weight)
  const isWeightVariantBased = () => {
    // Check if weightGroups exist in the API response
    const weightGroups = (product as any)?.weightGroups;
    if (weightGroups && weightGroups.length > 0) {
      return true;
    }
    
    // Also check if any attribute controls weight (from product attributes)
    const productAttributes = product?.attributes;
    if (productAttributes && productAttributes.length > 0) {
      return productAttributes.some((attr: any) => attr.controls_weight === true);
    }
    
    return false;
  };

  // Check if media is variant-based (has mediaGroups OR any attribute controls media)
  const isMediaVariantBased = () => {
    // Check if mediaGroups exist in the API response
    const mediaGroups = (product as any)?.mediaGroups;
    if (mediaGroups && mediaGroups.length > 0) {
      return true;
    }
    
    // Also check if any attribute controls media (from product attributes)
    const productAttributes = product?.attributes;
    if (productAttributes && productAttributes.length > 0) {
      return productAttributes.some((attr: any) => attr.controls_media === true);
    }
    
    return false;
  };

  // Transform single media (non-variant) - when no mediaGroups exist
  const transformSingleMedia = () => {
    if (!product?.media) return [];
    
    // If there are no mediaGroups, all media is single/general
    const mediaGroups = (product as any)?.mediaGroups;
    if (!mediaGroups || mediaGroups.length === 0) {
      return product.media
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((m: any) => ({
          id: m.id.toString(),
          file: null,
          preview: m.url,
          type: m.type as 'image' | 'video',
          order: m.sort_order,
          isPrimary: m.is_primary,
        }));
    }
    
    return [];
  };

  // Transform variant media from mediaGroups
  const transformVariantMedia = () => {
    const mediaGroups = (product as any)?.mediaGroups;
    if (!mediaGroups || mediaGroups.length === 0 || !product?.media) return undefined;

    return mediaGroups.map((mg: any) => {
      const attributeValues = buildAttributeValuesFromGroupValues(mg.groupValues || []);
      const key = generateVariantKey(attributeValues);
      
      // Find all media items belonging to this media group
      const mediaItems = product.media
        ?.filter((m: any) => m.media_group_id === mg.id)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((m: any) => ({
          id: m.id.toString(),
          file: null,
          preview: m.url,
          type: m.type as 'image' | 'video',
          order: m.sort_order,
          isPrimary: m.is_primary,
        })) || [];

      return {
        key,
        attributeValues,
        media: mediaItems,
      };
    });
  };

  // Transform single weight (for single pricing type)
  const transformSingleWeight = () => {
    // For single pricing, there's no weightGroups
    const weightGroups = (product as any)?.weightGroups;
    if (weightGroups && weightGroups.length > 0) return undefined;
    
    // Check for legacy weight array
    if (product?.weight && product.weight.length > 0) {
      const singleWeight = product.weight[0];
      return {
        weight: singleWeight.weight ? parseFloat(singleWeight.weight) : undefined,
        length: singleWeight.length ? parseFloat(singleWeight.length) : undefined,
        width: singleWeight.width ? parseFloat(singleWeight.width) : undefined,
        height: singleWeight.height ? parseFloat(singleWeight.height) : undefined,
      };
    }
    
    return undefined;
  };

  // Transform single pricing (for single pricing type)
  const transformSinglePricing = () => {
    if (product?.pricing_type !== 'single') return undefined;
    
    // Check for legacy pricing array
    if (product?.pricing && product.pricing.length > 0) {
      const pricing = product.pricing[0];
      return {
        cost: parseFloat(pricing.cost),
        price: parseFloat(pricing.price),
        isSale: !!pricing.sale_price,
        salePrice: pricing.sale_price ? parseFloat(pricing.sale_price) : undefined,
      };
    }
    
    // Check for priceGroups (single product would have one group with no groupValues)
    const priceGroups = (product as any)?.priceGroups;
    if (priceGroups && priceGroups.length > 0) {
      const pricing = priceGroups[0];
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
      categoryId: product.category?.id?.toString() || product.category_id?.toString(),
      vendorId: product.vendor?.id?.toString() || product.vendor_id?.toString(),
      shortDescriptionEn: product.short_description_en || "",
      shortDescriptionAr: product.short_description_ar || "",
    longDescriptionEn: product.long_description_en || "",
    longDescriptionAr: product.long_description_ar || "",
    pricingType: product.pricing_type,
    isActive: product.is_active,
    
    // Attributes (for variant products)
    attributes: product.pricing_type === 'variant' ? transformProductAttributes() : undefined,
    
    // Pricing
    singlePricing: product.pricing_type === 'single' ? transformSinglePricing() : undefined,
    variantPricing: product.pricing_type === 'variant' ? transformVariantPricing() : undefined,
    
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
    try {
      const productPayload: Record<string, any> = {};

      // ========== BASIC INFORMATION ==========
      if (initialData?.nameEn !== data.nameEn) productPayload.name_en = data.nameEn;
      if (initialData?.nameAr !== data.nameAr) productPayload.name_ar = data.nameAr;
      if (initialData?.shortDescriptionEn !== data.shortDescriptionEn) productPayload.short_description_en = data.shortDescriptionEn || undefined;
      if (initialData?.shortDescriptionAr !== data.shortDescriptionAr) productPayload.short_description_ar = data.shortDescriptionAr || undefined;
      if (initialData?.longDescriptionEn !== data.longDescriptionEn) productPayload.long_description_en = data.longDescriptionEn || undefined;
      if (initialData?.longDescriptionAr !== data.longDescriptionAr) productPayload.long_description_ar = data.longDescriptionAr || undefined;
      if (initialData?.pricingType !== data.pricingType) productPayload.pricing_type = data.pricingType;
      if (initialData?.categoryId !== data.categoryId) productPayload.category_id = parseInt(data.categoryId);
      if (initialData?.vendorId !== data.vendorId) productPayload.vendor_id = data.vendorId ? parseInt(data.vendorId) : undefined;
      if (initialData?.isActive !== data.isActive) productPayload.is_active = data.isActive;

      // ========== MEDIA MANAGEMENT ==========
      const deleteMediaIds: number[] = [];
      const reorderMedia: { media_id: number; sort_order: number }[] = [];
      let setPrimaryMedia: { media_id: number; is_variant_media: boolean } | undefined;
      
      // Check for deleted/changed single media
      if (!data.isMediaVariantBased && initialData?.singleMedia) {
        const currentMediaIds = new Set(data.singleMedia?.map(m => parseInt(m.id)) || []);
        
        // Find deleted media
        initialData.singleMedia.forEach(initialMedia => {
          const mediaId = parseInt(initialMedia.id);
          if (!isNaN(mediaId) && !currentMediaIds.has(mediaId)) {
            deleteMediaIds.push(mediaId);
          }
        });
        
        // Check for reorder and primary changes
        data.singleMedia?.forEach(media => {
          const mediaId = parseInt(media.id);
          if (isNaN(mediaId) || media.id.startsWith('media-')) return; // Skip new media
          
          const initialMedia = initialData.singleMedia?.find(m => m.id === media.id);
          if (!initialMedia) return;
          
          // Check order change
          if (initialMedia.order !== media.order) {
            reorderMedia.push({ media_id: mediaId, sort_order: media.order });
          }
          
          // Check primary change (only if changing from non-primary to primary)
          if (media.isPrimary && !initialMedia.isPrimary) {
            setPrimaryMedia = { media_id: mediaId, is_variant_media: false };
          }
        });
      }
      
      // Check for deleted/changed variant media
      if (data.isMediaVariantBased && initialData?.variantMedia) {
        const currentMediaIds = new Set<number>();
        data.variantMedia?.forEach(vm => {
          vm.media.forEach(m => {
            const mediaId = parseInt(m.id);
            if (!isNaN(mediaId) && !m.id.startsWith('media-')) {
              currentMediaIds.add(mediaId);
            }
          });
        });
        
        // Find deleted media
        initialData.variantMedia.forEach(vm => {
          vm.media.forEach(m => {
            const mediaId = parseInt(m.id);
            if (!isNaN(mediaId) && !currentMediaIds.has(mediaId)) {
              deleteMediaIds.push(mediaId);
            }
          });
        });
        
        // Check for reorder and primary changes in variant media
        data.variantMedia?.forEach(vm => {
          vm.media.forEach(media => {
            const mediaId = parseInt(media.id);
            if (isNaN(mediaId) || media.id.startsWith('media-')) return; // Skip new media
            
            // Find initial media
            let initialMedia: any;
            initialData.variantMedia?.forEach(ivm => {
              const found = ivm.media.find(m => m.id === media.id);
              if (found) initialMedia = found;
            });
            if (!initialMedia) return;
            
            // Check order change
            if (initialMedia.order !== media.order) {
              reorderMedia.push({ media_id: mediaId, sort_order: media.order });
            }
            
            // Check primary change
            if (media.isPrimary && !initialMedia.isPrimary) {
              setPrimaryMedia = { media_id: mediaId, is_variant_media: true };
            }
          });
        });
      }
      
      // Build media_management payload
      const mediaManagement: Record<string, any> = {};
      if (deleteMediaIds.length > 0) {
        mediaManagement.delete_media_ids = deleteMediaIds;
      }
      if (reorderMedia.length > 0) {
        mediaManagement.reorder_media = reorderMedia;
      }
      if (setPrimaryMedia) {
        mediaManagement.set_primary_media_id = setPrimaryMedia.media_id;
        mediaManagement.is_variant_media = setPrimaryMedia.is_variant_media;
      }
      
      if (Object.keys(mediaManagement).length > 0) {
        productPayload.media_management = mediaManagement;
      }

      // ========== ATTRIBUTES MANAGEMENT ==========
      if (data.pricingType === 'variant' && data.attributes) {
        const initialAttrsMap = new Map(
          (initialData?.attributes || []).map(a => [a.id, a])
        );
        const currentAttrsMap = new Map(
          data.attributes.map(a => [a.id, a])
        );
        
        const addAttributes: any[] = [];
        const updateAttributes: any[] = [];
        const deleteAttributeIds: number[] = [];
        
        // Find new and updated attributes
        data.attributes.forEach(attr => {
          const initialAttr = initialAttrsMap.get(attr.id);
          if (!initialAttr) {
            // New attribute
            addAttributes.push({
              attribute_id: parseInt(attr.id),
              controls_pricing: attr.controlsPricing || false,
              controls_media: attr.controlsMedia || false,
              controls_weight: attr.controlsWeightDimensions || false,
            });
          } else {
            // Check if attribute controls changed
            if (
              initialAttr.controlsPricing !== attr.controlsPricing ||
              initialAttr.controlsMedia !== attr.controlsMedia ||
              initialAttr.controlsWeightDimensions !== attr.controlsWeightDimensions
            ) {
              updateAttributes.push({
                attribute_id: parseInt(attr.id),
                controls_pricing: attr.controlsPricing || false,
                controls_media: attr.controlsMedia || false,
                controls_weight: attr.controlsWeightDimensions || false,
              });
            }
          }
        });
        
        // Find deleted attributes
        (initialData?.attributes || []).forEach(initialAttr => {
          if (!currentAttrsMap.has(initialAttr.id)) {
            deleteAttributeIds.push(parseInt(initialAttr.id));
          }
        });
        
        if (addAttributes.length > 0) productPayload.add_attributes = addAttributes;
        if (updateAttributes.length > 0) productPayload.update_attributes = updateAttributes;
        if (deleteAttributeIds.length > 0) productPayload.delete_attribute_ids = deleteAttributeIds;
      }

      // ========== PRICING ==========
      if (data.pricingType === 'single' && data.singlePricing) {
        const pricingChanged = 
          initialData?.singlePricing?.cost !== data.singlePricing.cost ||
          initialData?.singlePricing?.price !== data.singlePricing.price ||
          initialData?.singlePricing?.salePrice !== data.singlePricing.salePrice;
        
        if (pricingChanged) {
          productPayload.single_pricing = {
            cost: data.singlePricing.cost,
            price: data.singlePricing.price,
            sale_price: data.singlePricing.salePrice,
          };
        }
      } else if (data.pricingType === 'variant' && data.variantPricing) {
        // Only include price groups that have changed
        const changedPriceGroups: any[] = [];
        
        data.variantPricing.forEach(vp => {
          // Find matching initial pricing by key or attribute values
          const initialVp = initialData?.variantPricing?.find(ivp => {
            if (ivp.key === vp.key) return true;
            // Also check by attribute values match
            if (!ivp.attributeValues || !vp.attributeValues) return false;
            const keys = Object.keys(vp.attributeValues);
            return keys.every(k => ivp.attributeValues[k] === vp.attributeValues[k]);
          });
          
          // Check if pricing changed
          const hasChanged = !initialVp || 
            initialVp.cost !== vp.cost ||
            initialVp.price !== vp.price ||
            initialVp.salePrice !== vp.salePrice;
          
          if (hasChanged) {
            const combination: Record<string, number> = {};
            Object.entries(vp.attributeValues || {}).forEach(([attrId, attrValueId]) => {
              if (attrValueId) {
                combination[attrId] = parseInt(attrValueId);
              }
            });
            
            changedPriceGroups.push({
              combination,
              cost: vp.cost,
              price: vp.price,
              sale_price: vp.salePrice,
            });
          }
        });
        
        if (changedPriceGroups.length > 0) {
          productPayload.price_groups = changedPriceGroups;
        }
      }

      // ========== WEIGHT & DIMENSIONS ==========
      if (!data.isWeightVariantBased && data.singleWeightDimensions) {
        const weightChanged = 
          initialData?.singleWeightDimensions?.weight !== data.singleWeightDimensions.weight ||
          initialData?.singleWeightDimensions?.length !== data.singleWeightDimensions.length ||
          initialData?.singleWeightDimensions?.width !== data.singleWeightDimensions.width ||
          initialData?.singleWeightDimensions?.height !== data.singleWeightDimensions.height;
        
        if (weightChanged) {
          productPayload.product_weight = {
            weight: data.singleWeightDimensions.weight,
            length: data.singleWeightDimensions.length,
            width: data.singleWeightDimensions.width,
            height: data.singleWeightDimensions.height,
          };
        }
      } else if (data.isWeightVariantBased && data.variantWeightDimensions) {
        // Only include weight groups that have changed
        const changedWeightGroups: any[] = [];
        
        data.variantWeightDimensions.forEach(vw => {
          // Find matching initial weight by key or attribute values
          const initialVw = initialData?.variantWeightDimensions?.find(ivw => {
            if (ivw.key === vw.key) return true;
            if (!ivw.attributeValues || !vw.attributeValues) return false;
            const keys = Object.keys(vw.attributeValues);
            return keys.every(k => ivw.attributeValues[k] === vw.attributeValues[k]);
          });
          
          // Check if weight changed
          const hasChanged = !initialVw ||
            initialVw.weight !== vw.weight ||
            initialVw.length !== vw.length ||
            initialVw.width !== vw.width ||
            initialVw.height !== vw.height;
          
          if (hasChanged) {
            const combination: Record<string, number> = {};
            Object.entries(vw.attributeValues || {}).forEach(([attrId, attrValueId]) => {
              if (attrValueId) {
                combination[attrId] = parseInt(attrValueId);
              }
            });
            
            changedWeightGroups.push({
              combination,
              weight: vw.weight,
              length: vw.length,
              width: vw.width,
              height: vw.height,
            });
          }
        });
        
        if (changedWeightGroups.length > 0) {
          productPayload.weight_groups = changedWeightGroups;
        }
      }

      // ========== STOCK ==========
      if (data.pricingType === 'single') {
        // Single stock - check if there's a stock change
        const singleVariant = data.variants?.[0];
        const initialVariant = initialData?.variants?.[0];
        if (singleVariant && singleVariant.stock !== initialVariant?.stock) {
          productPayload.stock_quantity = singleVariant.stock;
        }
      } else if (data.pricingType === 'variant' && data.variants) {
        // Only include variant stocks that have changed
        const changedVariantStocks: any[] = [];
        
        data.variants.forEach(v => {
          if (!v.id) return; // Skip new variants without IDs
          
          // Find matching initial variant
          const initialV = initialData?.variants?.find(iv => iv.id === v.id);
          
          // Check if stock changed
          if (!initialV || initialV.stock !== v.stock) {
            changedVariantStocks.push({
              variant_id: parseInt(v.id),
              quantity: v.stock,
            });
          }
        });
        
        if (changedVariantStocks.length > 0) {
          productPayload.variant_stocks = changedVariantStocks;
        }
      }

      // Step 1: Update product with PATCH request
      if (Object.keys(productPayload).length > 0) {
        await productService.updateProduct(productId, productPayload);
      }

      // Step 2: Handle new media uploads (files with non-null file property)
      if (!data.isMediaVariantBased && data.singleMedia) {
        const newMedia = data.singleMedia.filter(m => m.file !== null);
        if (newMedia.length > 0) {
          for (const media of newMedia) {
            await productService.uploadProductMedia(
              productId,
              media.file!,
              media.order,
              media.isPrimary
            );
          }
        }
      }

      // For variant media uploads
      if (data.isMediaVariantBased && data.variantMedia && product?.variants) {
        for (const variantMediaData of data.variantMedia) {
          const newMedia = variantMediaData.media.filter(m => m.file !== null);
          if (newMedia.length === 0) continue;

          const mediaAttrValueIds = Object.values(variantMediaData.attributeValues || {})
            .filter(id => id && id !== '')
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id));
          
          if (mediaAttrValueIds.length === 0) {
            console.warn('Skipping variant media upload: no valid attribute value IDs');
            continue;
          }
          
          const matchingVariant = product.variants.find((variant: any) => {
            const variantAttrValueIds = (variant.combinations || [])
              .map((c: any) => c.attribute_value_id);
            return mediaAttrValueIds.every(mediaAttrId => 
              variantAttrValueIds.includes(mediaAttrId)
            );
          });
          
          if (!matchingVariant) {
            console.warn('Could not find matching variant for media:', mediaAttrValueIds);
            continue;
          }
          
          for (const media of newMedia) {
            await productService.uploadVariantMedia(
              productId,
              matchingVariant.id,
              media.file!,
              media.order,
              media.isPrimary
            );
          }
        }
      }
      
      alert("Product updated successfully!");
      router.push("/products");
    } catch (error: any) {
      console.error("Error updating product:", error);
      alert(error?.message || "Failed to update product");
    }
  };

  const handleSaveDraft = async (data: Partial<ProductFormData>) => {
    try {
      // TODO: Implement draft saving functionality
      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft");
    }
  };

  if (productLoading || categoriesLoading || vendorsLoading || attributesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fourth mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-danger/10 p-3">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-third mb-2">
                Error Loading Product
              </h3>
              <p className="text-gray-600 mb-6">{(productErrorData as any)?.message || "Failed to load product"}</p>
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

  if (!initialData) {
    return (
      <div className="min-h-screen bg-bw2 p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <div className="p-12 text-center">
              <h3 className="text-xl font-bold text-third mb-2">Product Not Found</h3>
              <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
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
      attributes={attributes}
    />
  );
}
