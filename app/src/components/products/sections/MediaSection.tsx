import React from "react";
import {
    Attribute,
    MediaItem,
    VariantMedia,
    VariantCombination,
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
    variants: VariantCombination[];
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
    variants,
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
    const allCombinations = generateCombinations(mediaAttributes);

    // Filter combinations based on valid variants
    const combinations = allCombinations.filter(combo => {
        if (variants.length === 0) return true;
        return variants.some(variant => {
            if (variant.active === false) return false;
            return Object.entries(combo.attributeValues).every(([key, value]) => {
                return variant.attributeValues[key] === value;
            });
        });
    });

    // Convert MediaItem[] to ImageUploadItem[] for the ImageUpload component
    const toImageUploadItems = (media: MediaItem[]): ImageUploadItem[] => {
        return media.map((m) => ({
            id: m.id,
            file: m.file ?? undefined,
            preview: m.preview,
            type: m.type,
            isPrimary: m.isPrimary,
            isGroupPrimary: m.isGroupPrimary,
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
            isGroupPrimary: item.isGroupPrimary ?? false,
            order: item.order,
        }));
    };

    const ensureGroupHasGroupPrimary = (items: MediaItem[]): MediaItem[] => {
        if (!items || items.length === 0) return [];
        if (items.some((m) => m.isGroupPrimary)) return items;
        const sorted = [...items].sort((a, b) => a.order - b.order);
        const groupPrimaryId = sorted[0].id;
        return items.map((m) => ({
            ...m,
            isGroupPrimary: m.id === groupPrimaryId,
        }));
    };

    // Handle single media change: enforce single product-level primary
    const handleSingleMediaChange = (items: ImageUploadItem[]) => {
        const mediaItems = toMediaItems(items);

        // If single media now has a primary, clear primaries from all variant groups
        if (mediaItems.some((m) => m.isPrimary) && variantMedia.length > 0) {
            onChangeVariant(
                variantMedia.map((vm) => ({
                    ...vm,
                    media: vm.media.map((m) => ({ ...m, isPrimary: false })),
                }))
            );
        }

        onChangeSingle(mediaItems);
    };

    // Handle variant media change: enforce single product-level primary, allow multiple group primaries (one per group)
    const handleVariantMediaChange = (key: string, items: ImageUploadItem[]) => {
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const mediaItems = toMediaItems(items);
        let updatedVariantMedia = variantMedia.filter((vm) => vm.key !== key);

        // If this group sets the product primary, clear primary from single media and all other variant groups.
        if (mediaItems.some((m) => m.isPrimary)) {
            if (singleMedia.some((m) => m.isPrimary)) {
                onChangeSingle(singleMedia.map((m) => ({ ...m, isPrimary: false })));
            }

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
            onChangeVariant(updatedVariantMedia);
        }
    };

    // Get variant media using shared utility
    const getMedia = (key: string, attributeValues?: { [attrId: string]: string }): MediaItem[] => {
        const match = getVariantData(key, variantMedia, attributeValues);
        return ensureGroupHasGroupPrimary(match?.media || []);
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
                    autoSetPrimaryOnFirstAdd={true}
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
                            hasGroupPrimary={true}
                            autoSetPrimaryOnFirstAdd={false}
                        />
                    </Card>
                );
            })}
        </Card>
    );
};
