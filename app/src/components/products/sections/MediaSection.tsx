import React from "react";
import {
    Attribute,
    MediaItem,
    VariantMedia,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";
import {
    generateCombinations,
    getControllingAttributes,
    getVariantData,
} from "../../../services/products/utils/variant-combinations";
import { ImageUpload, ImageUploadItem } from "../../ui/image-upload";

interface MediaSectionProps {
    attributes: Attribute[];
    isMediaVariantBased: boolean;
    singleMedia: MediaItem[];
    variantMedia: VariantMedia[];
    onToggleVariantBased: (value: boolean) => void;
    onChangeSingle: (media: MediaItem[]) => void;
    onChangeVariant: (media: VariantMedia[]) => void;
    hasAttributeControllingMedia: boolean;
    errors?: Record<string, string | boolean>;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
    attributes,
    isMediaVariantBased,
    singleMedia,
    variantMedia,
    onToggleVariantBased,
    onChangeSingle,
    onChangeVariant,
    hasAttributeControllingMedia,
    errors = {},
}) => {
    // Filter attributes that control media AND have values
    const mediaAttributes = getControllingAttributes(attributes, 'controlsMedia');

    // Generate all combinations for media attributes
    const combinations = generateCombinations(mediaAttributes);

    // Convert MediaItem[] to ImageUploadItem[] for the ImageUpload component
    const toImageUploadItems = (media: MediaItem[]): ImageUploadItem[] => {
        return media.map((m) => ({
            id: m.id,
            file: m.file ?? undefined,
            preview: m.preview,
            type: m.type,
            isPrimary: m.isPrimary,
            order: m.order,
        }));
    };

    // Convert ImageUploadItem[] back to MediaItem[]
    const toMediaItems = (items: ImageUploadItem[]): MediaItem[] => {
        return items.map((item) => ({
            id: item.id,
            file: item.file ?? null,
            preview: item.preview,
            type: item.type,
            isPrimary: item.isPrimary ?? false,
            order: item.order,
        }));
    };

    // Handle single media change with cross-variant primary management
    const handleSingleMediaChange = (items: ImageUploadItem[]) => {
        const mediaItems = toMediaItems(items);
        
        // Check if any item was set as primary
        const newPrimary = mediaItems.find((m) => m.isPrimary);
        
        if (newPrimary && variantMedia.length > 0) {
            // Clear primary from all variant media
            const clearedVariantMedia = variantMedia.map((vm) => ({
                ...vm,
                media: vm.media.map((m) => ({ ...m, isPrimary: false })),
            }));
            onChangeVariant(clearedVariantMedia);
        }
        
        // If removing media that was primary and no new primary is set, 
        // try to set a new primary from remaining items
        if (mediaItems.length > 0 && !mediaItems.some((m) => m.isPrimary)) {
            // Check if we had a primary before
            const hadPrimary = singleMedia.some((m) => m.isPrimary);
            if (hadPrimary) {
                // Set the first item as primary
                mediaItems[0].isPrimary = true;
            }
        } else if (mediaItems.length === 0) {
            // If all single media removed, check if we need to set a variant media as primary
            const anyVariantHasPrimary = variantMedia.some((vm) => vm.media.some((m) => m.isPrimary));
            if (!anyVariantHasPrimary && variantMedia.length > 0) {
                const firstVariantWithMedia = variantMedia.find((vm) => vm.media.length > 0);
                if (firstVariantWithMedia) {
                    const updatedVariantMedia = variantMedia.map((vm) => ({
                        ...vm,
                        media: vm.media.map((m, idx) => ({
                            ...m,
                            isPrimary: vm.key === firstVariantWithMedia.key && idx === 0,
                        })),
                    }));
                    onChangeVariant(updatedVariantMedia);
                }
            }
        }
        
        onChangeSingle(mediaItems);
    };

    // Handle variant media change with cross-variant primary management
    const handleVariantMediaChange = (key: string, items: ImageUploadItem[]) => {
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const mediaItems = toMediaItems(items);
        
        // Check if any item was set as primary
        const newPrimary = mediaItems.find((m) => m.isPrimary);
        
        let updatedVariantMedia = variantMedia.filter((vm) => vm.key !== key);
        
        if (newPrimary) {
            // Clear primary from single media
            if (singleMedia.some((m) => m.isPrimary)) {
                const clearedSingleMedia = singleMedia.map((m) => ({ ...m, isPrimary: false }));
                onChangeSingle(clearedSingleMedia);
            }
            
            // Clear primary from other variants
            updatedVariantMedia = updatedVariantMedia.map((vm) => ({
                ...vm,
                media: vm.media.map((m) => ({ ...m, isPrimary: false })),
            }));
        }
        
        if (mediaItems.length > 0) {
            const updated: VariantMedia = {
                key,
                attributeValues: combo.attributeValues,
                media: mediaItems,
            };
            onChangeVariant([...updatedVariantMedia, updated]);
        } else {
            // If all media removed from this variant
            // Check if we need to reassign primary
            const wasRemovingPrimary = variantMedia
                .find((vm) => vm.key === key)
                ?.media.some((m) => m.isPrimary);
            
            if (wasRemovingPrimary) {
                // Try to set a new primary from single media first
                if (singleMedia.length > 0) {
                    const updatedSingleMedia = singleMedia.map((m, idx) => ({
                        ...m,
                        isPrimary: idx === 0,
                    }));
                    onChangeSingle(updatedSingleMedia);
                } else {
                    // Try to set from other variants
                    const otherVariantWithMedia = updatedVariantMedia.find((vm) => vm.media.length > 0);
                    if (otherVariantWithMedia) {
                        updatedVariantMedia = updatedVariantMedia.map((vm) => ({
                            ...vm,
                            media: vm.media.map((m, idx) => ({
                                ...m,
                                isPrimary: vm.key === otherVariantWithMedia.key && idx === 0,
                            })),
                        }));
                    }
                }
            }
            
            onChangeVariant(updatedVariantMedia);
        }
    };

    // Get variant media using shared utility
    const getMedia = (key: string, attributeValues?: { [attrId: string]: string }): MediaItem[] => {
        const match = getVariantData(key, variantMedia, attributeValues);
        return match?.media || [];
    };

    // Single mode (not variant-based)
    if (!isMediaVariantBased && !hasAttributeControllingMedia) {
        return (
            <Card className={errors['singleMedia'] ? "border-danger" : ""}>
                <div className="flex flex-col gap-2" id="singleMedia">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            Media Management
                        </h2>
                    </div>
                    {hasAttributeControllingMedia && mediaAttributes.length === 0 && (
                        <p className="text-sm">
                            No attributes are controlling media. These images apply to all variants.
                        </p>
                    )}
                </div>

                <ImageUpload
                    value={toImageUploadItems(singleMedia)}
                    onChange={handleSingleMediaChange}
                    isMulti={true}
                    hasPrimary={true}
                    error={errors['singleMedia'] ? String(errors['singleMedia']) : undefined}
                />
            </Card>
        );
    }

    // Variant-based mode
    if (combinations.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Media Management
                    </h2>
                </div>
                <div className="border border-b1 rounded-r1 p-4">
                    <p>
                        Please select attribute values to configure media.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Media Management - Variant Based
                </h2>
            </div>

            <p className="text-sm">
                Upload media for each variant based on{" "}
                <strong>{mediaAttributes.map((a) => a.name).join(", ")}</strong>
            </p>

            {combinations.map((combo) => {
                const media = getMedia(combo.key, combo.attributeValues);

                return (
                    <Card
                        key={combo.key}
                        variant="nested"
                    >
                        <h4 className="font-medium">{combo.label}</h4>

                        <ImageUpload
                            value={toImageUploadItems(media)}
                            onChange={(items) => handleVariantMediaChange(combo.key, items)}
                            isMulti={true}
                            hasPrimary={true}
                        />
                    </Card>
                );
            })}
        </Card>
    );
};
