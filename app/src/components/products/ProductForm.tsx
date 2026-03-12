/**
 * Single Page Product Form Component
 * All sections in one scrollable page
 * Uses Zod for validation
 */

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useProductFormDraft } from "../../hooks/use-product-form-draft";
import { useEnterToSubmit } from "../../hooks/use-enter-to-submit";
import { Button } from "../ui/button";
import { PageHeader } from "../common/PageHeader";
import {
  ProductFormData,
  Attribute,
  SinglePricing,
  VariantPricing,
  WeightDimensions,
  VariantWeightDimensions,
  MediaItem,
  VariantMedia,
  VariantCombination,
} from "../../services/products/types/product-form.types";
import { BasicInformationSection } from "./sections/BasicInformationSection";
import { AttributesSection } from "./sections/AttributesSection";
import { PricingSection } from "./sections/PricingSection";
import { WeightDimensionsSection } from "./sections/WeightDimensionsSection";
import { MediaSection } from "./sections/MediaSection";
import { StockSection } from "./sections/StockSection";
import { Card } from "../ui";
import { useZodValidation, flattenZodErrors } from "../../hooks/use-zod-validation";
import { createProductSchema, type ProductFormConfig } from "../../lib/validations/product.schema";
import { Package } from "lucide-react";
import { Category } from "../../services/categories/types/category.types";
import {
    generateCombinations,
    getControllingAttributes,
} from "../../services/products/utils/variant-combinations";

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  isEditMode?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onSaveDraft?: (data: Partial<ProductFormData>) => Promise<void>;
  categories?: Category[];
  vendors?: Array<{ id: string; name: string; nameEn?: string; nameAr?: string }>;
  brands?: Array<{ id: string; name: string; nameEn?: string; nameAr?: string }>;
  attributes?: Array<{ id: string; name: string; displayName: string; values: Array<{ id: string; value: string; displayValue: string }> }>;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData = {},
  isEditMode = false,
  onSubmit,
  onSaveDraft,
  categories = [],
  vendors = [],
  brands = [],
  attributes = [],
}) => {
  const router = useRouter();

  // Draft persistence – only active in create mode.
  const { restoredDraft, saveDraft, clearDraft } = useProductFormDraft({
    enabled: !isEditMode,
  });

  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    nameEn: "",
    nameAr: "",
    categoryIds: [],
    vendorId: "",
    brandId: "",
    shortDescriptionEn: "",
    shortDescriptionAr: "",
    longDescriptionEn: "",
    longDescriptionAr: "",
    visible: true,
    attributes: [],
    singlePricing: undefined,
    variantPricing: [],
    isWeightVariantBased: false,
    singleWeightDimensions: undefined,
    variantWeightDimensions: [],
    isMediaVariantBased: false,
    singleMedia: [],
    variantMedia: [],
    variants: [],
    ...initialData,
    // Overlay any previously saved draft (create mode only; ignored when
    // restoredDraft is null or when initialData already provides values).
    ...(!isEditMode && restoredDraft ? restoredDraft : {}),
  });

  // Auto-save draft to localStorage on every formData change (create mode only).
  useEffect(() => {
    if (!isEditMode) {
      saveDraft(formData);
    }
  }, [formData, isEditMode, saveDraft]);

  // Update formData when initialData changes (for edit mode)
  // Use JSON.stringify to create a stable dependency
  const initialDataJson = JSON.stringify(initialData);
  React.useEffect(() => {
    if (isEditMode && initialData && Object.keys(initialData).length > 0) {
      console.log('=== DEBUG: Updating formData from initialData ===');
      console.log('initialData:', initialData);
      console.log('initialData.isMediaVariantBased:', initialData.isMediaVariantBased);
      console.log('initialData.variantMedia:', initialData.variantMedia);
      console.log('initialData.singleMedia:', initialData.singleMedia);
      setFormData({
        nameEn: "",
        nameAr: "",
        categoryIds: [],
        vendorId: "",
        shortDescriptionEn: "",
        shortDescriptionAr: "",
        longDescriptionEn: "",
        longDescriptionAr: "",
        visible: true,
        attributes: [],
        singlePricing: undefined,
        variantPricing: [],
        isWeightVariantBased: false,
        singleWeightDimensions: undefined,
        variantWeightDimensions: [],
        isMediaVariantBased: false,
        singleMedia: [],
        variantMedia: [],
        variants: [],
        ...initialData,
      });
    }
  }, [isEditMode, initialDataJson]);

  // Build dynamic Zod schema based on form state
  const validationConfig = useMemo<ProductFormConfig>(() => {
    const attributes = formData.attributes || [];

    // Pricing
    const pricingAttributes = getControllingAttributes(attributes, 'controlsPricing');
    const hasPricingAttributes = pricingAttributes.length > 0;
    const pricingCombinations = hasPricingAttributes ? generateCombinations(pricingAttributes) : [];

    // Weight
    const weightAttributes = getControllingAttributes(attributes, 'controlsWeightDimensions');
    const weightCombinations = formData.isWeightVariantBased ? generateCombinations(weightAttributes) : [];

    // Media
    const mediaAttributes = getControllingAttributes(attributes, 'controlsMedia');
    const mediaCombinations = formData.isMediaVariantBased ? generateCombinations(mediaAttributes) : [];
    
    // Check which variant pricing items have sale enabled
    // We must ensure the array passed here matches the length expected, 
    // or at least mapped from existing data to check `isSale` status
    const variantPricingItems: { isSale: boolean }[] = formData.variantPricing?.map(vp => ({ isSale: vp.isSale === true })) || [];

    return {
      hasPricingAttributes,
      singlePricingIsSale: formData.singlePricing?.isSale === true,
      variantPricingItems,
      isWeightVariantBased: formData.isWeightVariantBased || false,
      isMediaVariantBased: formData.isMediaVariantBased || false,
      expectedPricingCount: pricingCombinations.length,
      expectedWeightCount: weightCombinations.length,
      expectedMediaCount: mediaCombinations.length,
    };
  }, [
    formData.attributes,
    formData.singlePricing?.isSale,
    formData.variantPricing,
    formData.isWeightVariantBased,
    formData.isMediaVariantBased,
  ]);

  const zodSchema = useMemo(() => createProductSchema(validationConfig), [validationConfig]);
  
  const { errors, validateForm, validateField, clearFieldError, isSubmitted } = useZodValidation<ProductFormData>({
    schema: zodSchema,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('=== DEBUG: handleSubmit called ===');
    
    // Filter variant data to only include items that match at least one existing stock variant
    // This ensures deleted variants are not sent to the payload
    const currentVariants = formData.variants || [];
    
    const filterVariantData = <T extends { attributeValues: Record<string, string> }>(items: T[] | undefined): T[] => {
        if (!items) return [];
        // If we have attributes but no variants, it means all variants were deleted or not generated
        // In this case, we shouldn't send any variant data
        if (currentVariants.length === 0 && (formData.attributes?.length || 0) > 0) return [];
        
        return items.filter(item => {
             return currentVariants.some(variant => {
                if (variant.active === false) return false;
                return Object.entries(item.attributeValues).every(([key, value]) => {
                    return variant.attributeValues[key] === value;
                });
            });
        });
    };

    const filteredVariantPricing = filterVariantData(formData.variantPricing);
    const filteredVariantWeight = filterVariantData(formData.variantWeightDimensions);
    const filteredVariantMedia = filterVariantData(formData.variantMedia);

    const ensureSinglePrimaryForProduct = (data: ProductFormData): ProductFormData => {
      const singleMedia = data.singleMedia ? [...data.singleMedia] : undefined;
      const variantMedia = data.variantMedia
        ? data.variantMedia.map((vm) => ({
            ...vm,
            media: [...vm.media],
          }))
        : undefined;

      const flattened: Array<{ source: 'single' | 'variant'; groupKey?: string; item: MediaItem }> = [];

      if (singleMedia && singleMedia.length > 0) {
        singleMedia
          .slice()
          .sort((a, b) => a.order - b.order)
          .forEach((m) => flattened.push({ source: 'single', item: m }));
      }

      if (variantMedia && variantMedia.length > 0) {
        variantMedia
          .slice()
          .sort((a, b) => String(a.key).localeCompare(String(b.key)))
          .forEach((vm) => {
            vm.media
              .slice()
              .sort((a, b) => a.order - b.order)
              .forEach((m) => flattened.push({ source: 'variant', groupKey: vm.key, item: m }));
          });
      }

      const allItems = flattened.map((x) => x.item);
      if (allItems.length === 0) return data;

      const currentPrimary = allItems.find((m) => m.isPrimary);
      const primaryId = currentPrimary ? currentPrimary.id : allItems[0].id;

      const nextSingle = singleMedia?.map((m) => ({ ...m, isPrimary: m.id === primaryId })) ?? singleMedia;
      const nextVariant =
        variantMedia?.map((vm) => ({
          ...vm,
          media: vm.media.map((m) => ({ ...m, isPrimary: m.id === primaryId })),
        })) ?? variantMedia;

      return { ...data, singleMedia: nextSingle, variantMedia: nextVariant };
    };

    // Cast to ProductFormData for validation (with defaults)
    let dataToValidate: ProductFormData = {
      nameEn: formData.nameEn || '',
      nameAr: formData.nameAr || '',
      categoryIds: formData.categoryIds || [],
      vendorId: formData.vendorId || '',
      brandId: formData.brandId || '',
      shortDescriptionEn: formData.shortDescriptionEn || '',
      shortDescriptionAr: formData.shortDescriptionAr || '',
      longDescriptionEn: formData.longDescriptionEn || '',
      longDescriptionAr: formData.longDescriptionAr || '',
      visible: formData.visible ?? true,
      isWeightVariantBased: formData.isWeightVariantBased ?? false,
      isMediaVariantBased: formData.isMediaVariantBased ?? false,
      attributes: formData.attributes,
      singlePricing: formData.singlePricing,
      variantPricing: filteredVariantPricing,
      singleWeightDimensions: formData.singleWeightDimensions,
      variantWeightDimensions: filteredVariantWeight,
      singleMedia: formData.singleMedia,
      variantMedia: filteredVariantMedia,
      variants: (formData.variants || []).filter(v => v.active !== false),
    };

    // -----------------------------------------------------
    // HIERARCHICAL ATTRIBUTE SPLITTING LOGIC (Expanded)
    // -----------------------------------------------------
    // If we have "Level 0" attributes that imply child attributes
    // (e.g. CPU -> Intel > Celeron > N4500), we must split them into
    // separate attribute entries before validation and submission.
    // ALSO: We must expand the variant definitions to include these new attribute/value pairs.
    // -----------------------------------------------------
    if (dataToValidate.attributes && dataToValidate.attributes.length > 0) {
       const splitAttributes: Attribute[] = [];
       // Track attribute IDs we have already added to avoid duplicates
       const addedAttributeIds = new Set<string>();
       
       // Map of Leaf Value ID -> Map of implied { AttrID -> ValueID }
       // This is used to patch the variant combinations later
       const expansionMap = new Map<string, Record<string, string>>();

       dataToValidate.attributes.forEach(attr => {
           // We only process this attribute if it has values.
           if (attr.values.length === 0) {
               if (!addedAttributeIds.has(attr.id)) {
                  splitAttributes.push(attr);
                  addedAttributeIds.add(attr.id);
               }
               return;
           }

           // Check each selected value to see if it belongs to a hierarchy
           // We need to look up the system definition for the selected values.
           const systemAttr = attributes.find(a => a.id === attr.id);
           
           if (!systemAttr) {
              // Just keep as is if not found in system
              if (!addedAttributeIds.has(attr.id)) {
                 splitAttributes.push(attr);
                 addedAttributeIds.add(attr.id);
              }
              return;
           }

           // We need to collect "implied" attributes from the selected values.
           // Map<AttributeId, Set<ValueId>>
           const impliedSelections = new Map<string, Set<string>>();
           
           // Initialize with current attribute (Level 0)
           if (!impliedSelections.has(attr.id)) impliedSelections.set(attr.id, new Set());

           attr.values.forEach(val => {
               // The ID in `val.id` is the LEAF ID (e.g. N4500 id=40).
               // We need to traverse UP from this ID to finding all parents.
               
               let currentId = val.id;
               let depth = 0;
               const chain: {attrId: string, valId: string}[] = [];

               // Helper to find a value definition and its attribute in the system list
               // This is O(Attributes * Values), might be slow if list is huge.
               while(currentId && depth < 10) {
                   let found = false;
                   for(const sysA of attributes) {
                       const sysV = sysA.values.find(v => v.id === currentId);
                       if (sysV) {
                           chain.unshift({ attrId: sysA.id, valId: sysV.id });
                           // Find parent value ID
                           // Note: AttributeSection handles `parentValueId` or `parentId` property mapping 
                           // But here `attributes` prop is raw from parent component.
                           const pvId = (sysV as any).parentValueId ?? (sysV as any).parentId ?? (sysV as any).parent_value_id;
                           currentId = pvId;
                           found = true;
                           break;
                       }
                   }
                   if (!found) break;
                   depth++;
               }

               // Register this chain in the expansion map for this leaf value
               const chainRecord: Record<string, string> = {};
               chain.forEach(item => {
                   chainRecord[item.attrId] = item.valId;
               });
               expansionMap.set(val.id, chainRecord);

               // Add the chain to implied selections for attribute splitting
               chain.forEach(item => {
                   if (!impliedSelections.has(item.attrId)) {
                       impliedSelections.set(item.attrId, new Set());
                   }
                   impliedSelections.get(item.attrId)?.add(item.valId);
               });
           });

           // Now convert the map back to Attribute objects
           impliedSelections.forEach((valIds, attrId) => {
               const sysA = attributes.find(a => a.id === attrId);
               // Inherit control flags from the root attribute
               // This ensures that child attributes (ie CPU Model) also control pricing if CPU controls pricing
               const controlFlags = {
                   controlsPricing: attr.controlsPricing,
                   controlsWeightDimensions: attr.controlsWeightDimensions,
                   controlsMedia: attr.controlsMedia
               };

               if (addedAttributeIds.has(attrId)) {
                   // If already added (e.g. by another root?), merge values?
                   const existing = splitAttributes.find(a => a.id === attrId);
                   if (existing) {
                       // Add new values that aren't there
                       valIds.forEach(vid => {
                           if (!existing.values.some(v => v.id === vid)) {
                               // Find value def to get correct value string
                               const sysV = sysA?.values.find(v => v.id === vid);
                               existing.values.push({
                                   id: vid,
                                   value: sysV?.value || '',
                                   order: existing.values.length
                               }); 
                           }
                       });
                   }
               } else {
                   // Create new attribute entry
                   if (sysA) {
                       const values = Array.from(valIds).map((vid, idx) => {
                           const sysV = sysA.values.find(v => v.id === vid);
                           return {
                               id: vid,
                               value: sysV?.value || '',
                               order: idx
                           };
                       });
                       
                       splitAttributes.push({
                           ...attr, // Base properties
                           ...controlFlags, // Explicit control flags
                           id: attrId,
                           name: sysA.name, // Use actual name of the level (e.g. "CPU Model")
                           values
                       });
                       addedAttributeIds.add(attrId);
                   }
               }
           });
       });

       dataToValidate = {
           ...dataToValidate,
           attributes: splitAttributes
       };

       // Now EXPAND the variant combinations using expansionMap
       // We iterate over all arrays that use `attributeValues`
       
       const expandAttributeValues = <T extends { attributeValues: Record<string, string>, key?: string }>(items: T[] | undefined): T[] => {
            if (!items) return [];
            return items.map(item => {
                const newAttrValues = { ...item.attributeValues };
                let modified = false;

                // For each value in the variant, check if it's a leaf that implies other values
                Object.entries(item.attributeValues).forEach(([attrId, valId]) => {
                    const expanded = expansionMap.get(valId);
                    if (expanded) {
                        // Merge expanded values (e.g. {10:29, 11:30, 12:40})
                        Object.assign(newAttrValues, expanded);
                        modified = true;
                    }
                });

                if (!modified) return item;

                // If key exists, we might need to regenerate it, but usually key is internal.
                // However, updated attributeValues is what matters to backend.
                return {
                    ...item,
                    attributeValues: newAttrValues
                };
            });
       };
       
       dataToValidate.variantPricing = expandAttributeValues(dataToValidate.variantPricing);
       dataToValidate.variantWeightDimensions = expandAttributeValues(dataToValidate.variantWeightDimensions);
       dataToValidate.variantMedia = expandAttributeValues(dataToValidate.variantMedia);
       // Stocks
       dataToValidate.variants = expandAttributeValues(dataToValidate.variants);
    }

    const normalizedData = ensureSinglePrimaryForProduct(dataToValidate);

    const isValid = validateForm(normalizedData);
    console.log('isValid:', isValid);
    console.log('errors after validation:', errors);

    if (!isValid) {
      console.log('=== Validation failed, not submitting ===');
      
      const result = zodSchema.safeParse(normalizedData);
      if (!result.success) {
        console.log('=== ZOD ERRORS ===', JSON.stringify(result.error.format(), null, 2));
        const newErrors = flattenZodErrors(result.error);
        console.log('=== FLATTENED ERRORS ===', newErrors);
        const firstErrorField = Object.keys(newErrors)[0];
        
        if (firstErrorField) {
            console.log(`Scrolling to error field: ${firstErrorField}`);
            setTimeout(() => {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Try to focus if it's an input
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT' || element.getAttribute('tabindex')) {
                        element.focus({ preventScroll: true });
                    }
                } else {
                    console.warn(`Could not find element for error: ${firstErrorField}`);
                     // Fallback for some known fields that might be wrapped or have different ID logic
                     // e.g. singleMedia container has id="singleMedia" but error is singleMedia
                     const fallbackElement = document.getElementById(firstErrorField.split('.')[0]);
                     if (fallbackElement) {
                         fallbackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     } else {
                         // Scroll to top as last resort
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                     }
                }
            }, 100);
        }
      }
      return;
    }

    console.log('=== Validation passed, submitting ===');

    setIsSubmitting(true);
    try {
      await onSubmit(normalizedData);
      // Product created successfully – clear the persisted draft.
      clearDraft();
    } catch (error) {
      console.error("Failed to submit form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    // DEBUG: Log field changes for media
    if (field === 'singleMedia' || field === 'variantMedia' || field === 'isMediaVariantBased') {
      console.log('=== DEBUG: handleFieldChange for media ===');
      console.log('field:', field);
      console.log('value:', value);
      if (field === 'singleMedia' && Array.isArray(value)) {
        value.forEach((item: any, idx: number) => {
          console.log(`value[${idx}]:`, item);
          console.log(`value[${idx}].file:`, item.file);
          console.log(`value[${idx}].file instanceof File:`, item.file instanceof File);
        });
      }
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // DEBUG: Log updated form data for media fields
      if (field === 'singleMedia' || field === 'variantMedia' || field === 'isMediaVariantBased') {
        console.log('=== DEBUG: Updated formData ===');
        console.log('newData.singleMedia:', newData.singleMedia);
        console.log('newData.singleMedia?.length:', newData.singleMedia?.length);
      }

      return newData;
    });
    
    // Clear field error when value changes (after submission)
    if (isSubmitted) {
      clearFieldError(field);
    }
  };

  const handleStockChange = (variants: VariantCombination[]) => {
    setFormData((prev) => {
      // 1. Calculate new attributes based on remaining variants
      const currentAttributes = prev.attributes || [];
      
      // If no attributes, just update variants
      if (currentAttributes.length === 0) {
        return { ...prev, variants };
      }

      const updatedAttributes = currentAttributes.map((attr) => {
        // Find all values of this attribute that are currently used in the new variants list
        const usedValueIds = new Set(
          variants.map((v) => v.attributeValues[attr.id]).filter(Boolean)
        );

        // Keep only values that are used
        const newValues = attr.values.filter((val) => usedValueIds.has(val.id));

        return {
          ...attr,
          values: newValues,
        };
      });

      return {
        ...prev,
        variants,
        attributes: updatedAttributes,
      };
    });
  };

  // Check if any attribute controls pricing, media, or weight
  const hasAttributeControllingPricing =
    formData.attributes?.some((attr) => attr.controlsPricing) || false;
  const hasAttributeControllingMedia =
    formData.attributes?.some((attr) => attr.controlsMedia) || false;
  const hasAttributeControllingWeight =
    formData.attributes?.some((attr) => attr.controlsWeightDimensions) || false;

  const calculateSalePercentage = (price: number, salePrice?: number) => {
    if (!salePrice || salePrice >= price) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  useEnterToSubmit(handleSubmit, isSubmitting);

  return (
    <div className="mx-auto p-5 flex flex-col gap-5">
      <PageHeader
        icon={<Package />}
        title={isEditMode ? "Edit Product" : "Create New Product"}
        description={isEditMode ? "Update product information and variants" : "Fill in the details to create a new product"}
        extraActions={
          isEditMode && formData.slug ? (
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                window.open(`https://ordonsooq.com/products/${formData.slug}`, '_blank');
              }}
            >
              Preview Product
            </Button>
          ) : undefined
        }
        cancelAction={{
          label: "Cancel",
          onClick: () => { clearDraft(); router.push('/products'); },
          disabled: isSubmitting,
        }}
        action={{
          label: isSubmitting ? "Submitting..." : (isEditMode ? "Update Product" : "Create Product"),
          onClick: handleSubmit,
          disabled: isSubmitting,
        }}
      />
      {/* Basic Information */}
      <BasicInformationSection
        formData={{
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          categoryIds: formData.categoryIds,
          vendorId: formData.vendorId,
          brandId: formData.brandId,
          shortDescriptionEn: formData.shortDescriptionEn,
          shortDescriptionAr: formData.shortDescriptionAr,
          longDescriptionEn: formData.longDescriptionEn,
          longDescriptionAr: formData.longDescriptionAr,
          visible: formData.visible,
        }}
        errors={errors}
        categories={categories}
        vendors={vendors}
        brands={brands}
        onChange={handleFieldChange}
      />

      {/* Attributes Configuration - Always visible */}
      <AttributesSection
        attributes={formData.attributes || []}
        availableAttributes={attributes}
        onChange={(attributes: Attribute[], resetType?: 'pricing' | 'weight' | 'media' | 'stock' | 'all') => {
          const hasWeight = attributes.some(a => a.controlsWeightDimensions);
          const hasMedia = attributes.some(a => a.controlsMedia);
          const hasAttributes = attributes.length > 0;

          setFormData(prev => {
            const updates: Partial<ProductFormData> = {
              ...prev,
              attributes,
              isWeightVariantBased: hasAttributes ? hasWeight : false,
              isMediaVariantBased: hasAttributes ? hasMedia : false,
            };

            const prevAttributes = prev.attributes || [];
            let shouldClearMedia = false;
            let shouldClearPricing = false;
            let shouldClearWeight = false;

            prevAttributes.forEach(pa => {
              const na = attributes.find(a => a.id === pa.id);
              if (!na) {
                // Attribute removed
                if (pa.values.length > 1) {
                  if (pa.controlsMedia) shouldClearMedia = true;
                  if (pa.controlsPricing) shouldClearPricing = true;
                  if (pa.controlsWeightDimensions) shouldClearWeight = true;
                }
              } else {
                // Attribute control toggled off
                if (pa.values.length > 1) {
                  if (pa.controlsMedia && !na.controlsMedia) shouldClearMedia = true;
                  if (pa.controlsPricing && !na.controlsPricing) shouldClearPricing = true;
                  if (pa.controlsWeightDimensions && !na.controlsWeightDimensions) shouldClearWeight = true;
                }
              }
            });

            if (shouldClearMedia) updates.variantMedia = [];
            if (shouldClearPricing) updates.variantPricing = [];
            if (shouldClearWeight) updates.variantWeightDimensions = [];

            // If switching to single (no attributes), reset all variant data
            if (!hasAttributes) {
              updates.variantPricing = [];
              updates.variantWeightDimensions = [];
              updates.variantMedia = [];
              updates.variants = [];
              updates.singlePricing = prev.singlePricing;
              updates.singleWeightDimensions = prev.singleWeightDimensions;
              updates.singleMedia = prev.singleMedia || [];
            }

            // Let StockSection and other sections automatically reconcile 
            // the data with the updated attributes via their internal logic 
            // and the `getVariantData` fallback logic, preserving existing valid entries.

            return updates as ProductFormData;
          });
          // Clear attribute errors when changed
          if (isSubmitted) {
            clearFieldError("attributes");
          }
        }}
        errors={errors}
      />

      {/* Stock Management */}
      <StockSection
        attributes={formData.attributes || []}
        variants={formData.variants || []}
        onChange={handleStockChange}
        errors={errors}
      />

      {/* Pricing Configuration */}
      <PricingSection
        attributes={formData.attributes || []}
        variants={formData.variants || []}
        singlePricing={formData.singlePricing}
        variantPricing={formData.variantPricing || []}
        onChangeSingle={(pricing: SinglePricing) =>
          handleFieldChange("singlePricing", pricing)
        }
        onChangeVariant={(pricing: VariantPricing[]) =>
          handleFieldChange("variantPricing", pricing)
        }
        calculateSalePercentage={calculateSalePercentage}
        errors={errors}
      />

      {/* Weight & Dimensions */}
      <WeightDimensionsSection
        attributes={formData.attributes || []}
        variants={formData.variants || []}
        isWeightVariantBased={formData.isWeightVariantBased || false}
        singleWeightDimensions={formData.singleWeightDimensions}
        variantWeightDimensions={formData.variantWeightDimensions || []}
        onToggleVariantBased={(value: boolean) =>
          handleFieldChange("isWeightVariantBased", value)
        }
        onChangeSingle={(data: WeightDimensions) =>
          handleFieldChange("singleWeightDimensions", data)
        }
        onChangeVariant={(data: VariantWeightDimensions[]) =>
          handleFieldChange("variantWeightDimensions", data)
        }
        hasAttributeControllingWeight={hasAttributeControllingWeight}
        errors={errors}
      />

      {/* Media Management */}
      <MediaSection
        attributes={formData.attributes || []}
        variants={formData.variants || []}
        isMediaVariantBased={formData.isMediaVariantBased || false}
        singleMedia={formData.singleMedia || []}
        variantMedia={formData.variantMedia || []}
        onToggleVariantBased={(value: boolean) =>
          handleFieldChange("isMediaVariantBased", value)
        }
        onChangeSingle={(media: MediaItem[]) =>
          handleFieldChange("singleMedia", media)
        }
        onChangeVariant={(media: VariantMedia[]) =>
          handleFieldChange("variantMedia", media)
        }
        hasAttributeControllingMedia={hasAttributeControllingMedia}
        errors={errors}
      />
    </div>
  );
};
