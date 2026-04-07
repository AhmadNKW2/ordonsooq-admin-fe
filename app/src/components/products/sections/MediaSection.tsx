import React, { useEffect } from "react";
import {
    Attribute,
    MediaItem,
    VariantMedia,
    VariantCombination,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";
import {
    generateCombinations,
    getVariantAttributes,
    getVariantData,
} from "../../../services/products/utils/variant-combinations";
import { ImageUpload, ImageUploadItem } from "../../ui/image-upload";
import { Toggle } from "../../ui/toggle";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

interface MediaSectionProps {
    attributes: Attribute[];
    variants: VariantCombination[];
    isMediaVariantBased: boolean;
    singleMedia: MediaItem[];
    variantMedia: VariantMedia[];
    onToggleVariantBased: (value: boolean) => void;
    onChangeSingle: (media: MediaItem[]) => void;
    onChangeVariant: (media: VariantMedia[]) => void;
    hasVariantAttributes: boolean;
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
    hasVariantAttributes,
    errors = {},
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const mediaAttributes = getVariantAttributes(attributes);

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

    // Reconcile variantMedia subsets when combinations change to prevent losing media
    useEffect(() => {
        if (!hasVariantAttributes || !isMediaVariantBased) return;
        
        let shouldUpdate = false;
        const newVariantMedia: VariantMedia[] = [];

        for (const combo of combinations) {
            const existingData = getVariantData(combo.key, variantMedia, combo.attributeValues);
            if (existingData && existingData.media && existingData.media.length > 0) {
                newVariantMedia.push({
                    key: combo.key,
                    attributeValues: combo.attributeValues,
                    media: existingData.media
                });
            }
        }
        
        // Check if any keys or counts changed
        if (newVariantMedia.length !== variantMedia.length) {
            shouldUpdate = true;
        } else {
            for (let i = 0; i < newVariantMedia.length; i++) {
                if (newVariantMedia[i].key !== variantMedia[i].key) {
                    shouldUpdate = true;
                    break;
                }
            }
        }

        if (shouldUpdate) {
            onChangeVariant(newVariantMedia);
        }
    }, [combinations, variantMedia, onChangeVariant, hasVariantAttributes, isMediaVariantBased]);

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

    const handleSingleMediaChange = (items: ImageUploadItem[]) => {
        const mediaItems = toMediaItems(items);

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

    const handleVariantMediaChange = (key: string, items: ImageUploadItem[]) => {
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const mediaItems = toMediaItems(items);
        let updatedVariantMedia = variantMedia.filter((vm) => vm.key !== key);

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

    const getMedia = (key: string, attributeValues?: { [attrId: string]: string }): MediaItem[] => {
        const match = getVariantData(key, variantMedia, attributeValues);
        return ensureGroupHasGroupPrimary(match?.media || []);
    };

    // Advanced drag and drop support across combinations list
    const handleDragOver = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const sourceId = active.data.current?.sortable?.containerId;
        const targetId = over.data.current?.sortable?.containerId || over.id;

        if (!sourceId || !targetId || sourceId === targetId) return;

        let newVariantMedia = [...variantMedia];

        const getContainerMedia = (id: string): MediaItem[] => {
            if (id === "singleMedia") return singleMedia;
            const combo = combinations.find(c => c.key === id);
            return getMedia(id, combo?.attributeValues);
        };

        const sourceMedia = [...getContainerMedia(String(sourceId))];
        const targetMedia = [...getContainerMedia(String(targetId))];

        const oldIndex = sourceMedia.findIndex(m => m.id === active.id);
        if (oldIndex === -1) return;
        
        const itemToMove = {...sourceMedia[oldIndex]};
        sourceMedia.splice(oldIndex, 1);
        
        // Ensure new array maintains the item exactly as it was, including its primary flag.
        let newIndex = targetMedia.findIndex(m => m.id === over.id);
        if (newIndex === -1) {
             newIndex = targetMedia.length;
        } else {
             const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top;
             if (isBelowOverItem) {
                 newIndex = newIndex + 1;
             }
        }
        
        targetMedia.splice(newIndex, 0, itemToMove);

        const updatedSource = sourceMedia.map((m, i) => ({ ...m, order: i }));
        const updatedTarget = targetMedia.map((m, i) => ({ ...m, order: i }));

        if (sourceId === "singleMedia") {
            onChangeSingle(updatedSource);
        } else {
            newVariantMedia = newVariantMedia.filter(vm => vm.key !== sourceId);
            const sourceCombo = combinations.find(c => c.key === sourceId);
            if (sourceCombo) {
                newVariantMedia.push({ key: String(sourceId), attributeValues: sourceCombo.attributeValues, media: updatedSource });
            }
        }

        if (targetId === "singleMedia") {
            onChangeSingle(updatedTarget);
        } else {
            newVariantMedia = newVariantMedia.filter(vm => vm.key !== targetId);
            const targetCombo = combinations.find(c => c.key === targetId);
            if (targetCombo) {
                newVariantMedia.push({ key: String(targetId), attributeValues: targetCombo.attributeValues, media: updatedTarget });
            }
        }

        if (sourceId !== "singleMedia" || targetId !== "singleMedia") {
            onChangeVariant(newVariantMedia);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const sourceId = active.data.current?.sortable?.containerId;
        const targetId = over.data.current?.sortable?.containerId || over.id;

        if (!sourceId || !targetId) return;

        // If cross container, it was already handled by handleDragOver
        if (sourceId !== targetId) return;

        const getContainerMedia = (id: string): MediaItem[] => {
            if (id === "singleMedia") return singleMedia;
            const combo = combinations.find(c => c.key === id);
            return getMedia(id, combo?.attributeValues);
        };

        const sourceMedia = [...getContainerMedia(String(sourceId))];
        const oldIndex = sourceMedia.findIndex(m => m.id === active.id);
        const newIndex = sourceMedia.findIndex(m => m.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const itemToMove = sourceMedia[oldIndex];
        sourceMedia.splice(oldIndex, 1);
        sourceMedia.splice(newIndex, 0, itemToMove);

        const updated = sourceMedia.map((m, i) => ({ ...m, order: i }));

        if (sourceId === "singleMedia") {
            onChangeSingle(updated);
        } else {
            handleVariantMediaChange(String(sourceId), toImageUploadItems(updated));
        }
    };

    // Single mode (forced)
    return (
        <Card className={errors['singleMedia'] ? "border-danger" : ""}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    <div className="flex flex-col gap-2" id="singleMedia">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                Media Management
                            </h2>
                        </div>
                    </div>

                    <ImageUpload
                        value={toImageUploadItems(singleMedia)}
                        onChange={handleSingleMediaChange}
                        isMulti={true}
                        hasPrimary={true}
                        autoSetPrimaryOnFirstAdd={true}
                        error={errors['singleMedia'] ? String(errors['singleMedia']) : undefined}
                        disableInternalDnd={true}
                        sortableContextId="singleMedia"
                    />
                </DndContext>
            </Card>
        );

};
