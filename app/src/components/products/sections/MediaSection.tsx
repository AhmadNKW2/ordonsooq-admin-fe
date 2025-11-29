import React, { useState } from "react";
import { Toggle } from "../../ui/toggle";
import { Button } from "../../ui/button";
import {
    Attribute,
    MediaItem,
    VariantMedia,
} from "../../../services/products/types/product-form.types";
import { Card, Modal } from "@/components/ui";
import Image from "next/image";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    generateCombinations,
    getControllingAttributes,
    getVariantData,
} from "../../../services/products/utils/variant-combinations";
import { Upload } from "lucide-react";

interface MediaSectionProps {
    attributes: Attribute[];
    isMediaVariantBased: boolean;
    singleMedia: MediaItem[];
    variantMedia: VariantMedia[];
    onToggleVariantBased: (value: boolean) => void;
    onChangeSingle: (media: MediaItem[]) => void;
    onChangeVariant: (media: VariantMedia[]) => void;
    hasAttributeControllingMedia: boolean;
    errors?: Record<string, string>;
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
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    // Filter attributes that control media AND have values
    const mediaAttributes = getControllingAttributes(attributes, 'controlsMedia');

    // Generate all combinations for media attributes
    const combinations = generateCombinations(mediaAttributes);

    // Check if any media across the product has isPrimary set
    const hasAnyPrimaryMedia = () => {
        const hasPrimaryInSingle = singleMedia.some((m) => m.isPrimary);
        const hasPrimaryInVariants = variantMedia.some((vm) => vm.media.some((m) => m.isPrimary));
        return hasPrimaryInSingle || hasPrimaryInVariants;
    };

    const handleSingleMediaAdd = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const shouldSetFirstAsPrimary = !hasAnyPrimaryMedia() && singleMedia.length === 0;

        const newMediaItems: MediaItem[] = Array.from(files).map((file, index) => ({
            id: `media-${Date.now()}-${index}`,
            file: file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
            isPrimary: shouldSetFirstAsPrimary && index === 0,
            order: singleMedia.length + index,
        }));

        onChangeSingle([...singleMedia, ...newMediaItems]);
    };

    const handleSingleMediaRemove = (mediaId: string) => {
        const mediaToRemove = singleMedia.find((m) => m.id === mediaId);
        if (mediaToRemove) {
            URL.revokeObjectURL(mediaToRemove.preview);
        }
        let filtered = singleMedia.filter((m) => m.id !== mediaId);

        // If the removed media was primary, find a new primary
        if (mediaToRemove?.isPrimary) {
            // First try to set the first remaining single media as primary
            if (filtered.length > 0) {
                const sortedByOrder = [...filtered].sort((a, b) => a.order - b.order);
                const firstItemId = sortedByOrder[0].id;
                filtered = filtered.map((m) => ({
                    ...m,
                    isPrimary: m.id === firstItemId,
                }));
            } else {
                // If no single media left, set the first variant media as primary
                if (variantMedia.length > 0) {
                    const firstVariantWithMedia = variantMedia.find((vm) => vm.media.length > 0);
                    if (firstVariantWithMedia) {
                        const sortedMedia = [...firstVariantWithMedia.media].sort((a, b) => a.order - b.order);
                        const firstMediaId = sortedMedia[0].id;
                        const updatedVariantMedia = variantMedia.map((vm) => ({
                            ...vm,
                            media: vm.media.map((m) => ({
                                ...m,
                                isPrimary: vm.key === firstVariantWithMedia.key && m.id === firstMediaId,
                            })),
                        }));
                        onChangeVariant(updatedVariantMedia);
                    }
                }
            }
        }

        onChangeSingle(filtered);
    };

    const handleSingleMediaSetPrimary = (mediaId: string) => {
        // Set the selected media as primary and clear all others in single media
        const updated = singleMedia.map((m) => ({
            ...m,
            isPrimary: m.id === mediaId,
        }));
        onChangeSingle(updated);

        // Also clear primary from all variant media to ensure only one primary across the product
        if (variantMedia.length > 0) {
            const clearedVariantMedia = variantMedia.map((vm) => ({
                ...vm,
                media: vm.media.map((m) => ({ ...m, isPrimary: false })),
            }));
            onChangeVariant(clearedVariantMedia);
        }
    };

    const handleSingleMediaReorder = (fromIndex: number, toIndex: number) => {
        const reordered = [...singleMedia];
        const [movedItem] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, movedItem);

        const updated = reordered.map((m, idx) => ({ ...m, order: idx }));
        onChangeSingle(updated);
    };

    const handleVariantMediaAdd = (key: string, files: FileList | null) => {
        if (!files || files.length === 0) return;

        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const existing = variantMedia.find((vm) => vm.key === key);
        const currentMedia = existing?.media || [];

        const shouldSetFirstAsPrimary = !hasAnyPrimaryMedia() && currentMedia.length === 0;

        const newMediaItems: MediaItem[] = Array.from(files).map((file, index) => ({
            id: `media-${Date.now()}-${index}`,
            file: file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
            isPrimary: shouldSetFirstAsPrimary && index === 0,
            order: currentMedia.length + index,
        }));

        const updated: VariantMedia = {
            key,
            attributeValues: combo.attributeValues,
            media: [...currentMedia, ...newMediaItems],
        };

        const newVariantMedia = variantMedia.filter((vm) => vm.key !== key);
        onChangeVariant([...newVariantMedia, updated]);
    };

    const handleVariantMediaRemove = (key: string, mediaId: string) => {
        const existing = variantMedia.find((vm) => vm.key === key);
        if (!existing) return;

        const mediaToRemove = existing.media.find((m) => m.id === mediaId);
        if (mediaToRemove) {
            URL.revokeObjectURL(mediaToRemove.preview);
        }

        let filtered = existing.media.filter((m) => m.id !== mediaId);
        let newVariantMediaList = variantMedia.filter((vm) => vm.key !== key);

        if (filtered.length === 0) {
            // If this variant has no more media, remove it from the list
            // But first check if we need to reassign primary
            if (mediaToRemove?.isPrimary) {
                // Try to find another media to set as primary
                // First check single media
                if (singleMedia.length > 0) {
                    const sortedByOrder = [...singleMedia].sort((a, b) => a.order - b.order);
                    const firstItemId = sortedByOrder[0].id;
                    const updatedSingleMedia = singleMedia.map((m) => ({
                        ...m,
                        isPrimary: m.id === firstItemId,
                    }));
                    onChangeSingle(updatedSingleMedia);
                } else {
                    // Check other variants for media
                    const otherVariantWithMedia = newVariantMediaList.find((vm) => vm.media.length > 0);
                    if (otherVariantWithMedia) {
                        const sortedMedia = [...otherVariantWithMedia.media].sort((a, b) => a.order - b.order);
                        const firstMediaId = sortedMedia[0].id;
                        newVariantMediaList = newVariantMediaList.map((vm) => ({
                            ...vm,
                            media: vm.media.map((m) => ({
                                ...m,
                                isPrimary: vm.key === otherVariantWithMedia.key && m.id === firstMediaId,
                            })),
                        }));
                    }
                }
            }
            onChangeVariant(newVariantMediaList);
        } else {
            // If the removed media was primary, find a new primary
            if (mediaToRemove?.isPrimary) {
                // Set the first remaining item in this variant as primary
                const sortedByOrder = [...filtered].sort((a, b) => a.order - b.order);
                const firstItemId = sortedByOrder[0].id;
                filtered = filtered.map((m) => ({
                    ...m,
                    isPrimary: m.id === firstItemId,
                }));
            }

            const updated: VariantMedia = {
                ...existing,
                media: filtered,
            };

            onChangeVariant([...newVariantMediaList, updated]);
        }
    };

    const handleVariantMediaSetPrimary = (key: string, mediaId: string) => {
        const existing = variantMedia.find((vm) => vm.key === key);
        if (!existing) return;

        // Clear primary from all variant media and set the selected one as primary
        const updatedVariantMedia = variantMedia.map((vm) => ({
            ...vm,
            media: vm.media.map((m) => ({
                ...m,
                isPrimary: vm.key === key && m.id === mediaId,
            })),
        }));
        onChangeVariant(updatedVariantMedia);

        // Also clear primary from single media to ensure only one primary across the product
        if (singleMedia.length > 0) {
            const clearedSingleMedia = singleMedia.map((m) => ({ ...m, isPrimary: false }));
            onChangeSingle(clearedSingleMedia);
        }
    };

    const handleVariantMediaReorder = (key: string, fromIndex: number, toIndex: number) => {
        const existing = variantMedia.find((vm) => vm.key === key);
        if (!existing) return;

        const reordered = [...existing.media];
        const [movedItem] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, movedItem);

        const updatedMedia = reordered.map((m, idx) => ({ ...m, order: idx }));

        const updated: VariantMedia = {
            ...existing,
            media: updatedMedia,
        };

        const newVariantMedia = variantMedia.filter((vm) => vm.key !== key);
        onChangeVariant([...newVariantMedia, updated]);
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
                        <h2 className="text-xl font-semibold ">
                            Media Management
                        </h2>
                    </div>
                    {hasAttributeControllingMedia && mediaAttributes.length === 0 && (
                        <p className="text-sm ">
                            No attributes are controlling media. These images apply to all variants.
                        </p>
                    )}
                    {errors['singleMedia'] && (
                        <p className="text-sm text-danger">{errors['singleMedia']}</p>
                    )}
                </div>

                <MediaUploadArea
                    media={singleMedia}
                    onAdd={handleSingleMediaAdd}
                    onRemove={handleSingleMediaRemove}
                    onSetPrimary={handleSingleMediaSetPrimary}
                    onReorder={handleSingleMediaReorder}
                    onPreview={setPreviewImage}
                />

                <Modal
                    isOpen={!!previewImage}
                    onClose={() => setPreviewImage(null)}
                    variant="transparent"
                >
                    {previewImage && (
                        <div className="w-188 h-188 relative rounded-r1">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-cover rounded-r1"
                            />
                        </div>
                    )}
                </Modal>
            </Card>
        );
    }

    // Variant-based mode
    if (combinations.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold ">
                        Media Management
                    </h2>
                </div>
                <div className=" border border-gray-200 rounded-r1 p-4">
                    <p className="">
                        Please select attribute values to configure media.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold ">
                    Media Management - Variant Based
                </h2>
            </div>

            <p className="text-sm ">
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
                        <h4 className="font-medium ">{combo.label}</h4>

                        <MediaUploadArea
                            media={media}
                            onAdd={(file) => handleVariantMediaAdd(combo.key, file)}
                            onRemove={(mediaId) =>
                                handleVariantMediaRemove(combo.key, mediaId)
                            }
                            onSetPrimary={(mediaId) =>
                                handleVariantMediaSetPrimary(combo.key, mediaId)
                            }
                            onReorder={(from, to) => handleVariantMediaReorder(combo.key, from, to)}
                            onPreview={setPreviewImage}
                        />
                    </Card>
                );
            })}

            <Modal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                className="max-w-4xl"
                variant="transparent"
            >
                {previewImage && (
                    <div className="relative w-[650px] h-[650px]">
                        <Image
                            src={previewImage}
                            alt="Preview"
                            fill
                            className="object-contain rounded-r1"
                        />
                    </div>
                )}
            </Modal>
        </Card>
    );
};

// Sortable Media Item Component
interface SortableMediaItemProps {
    item: MediaItem;
    onRemove: (id: string) => void;
    onSetPrimary: (id: string) => void;
    onPreview?: (url: string) => void;
}

const SortableMediaItem = ({ item, onRemove, onSetPrimary, onPreview }: SortableMediaItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="w-40 h-40 relative group border-2 rounded-r1 overflow-hidden border-primary/20 touch-none"
        >
            {item.type === "image" ? (
                <Image
                    src={item.preview}
                    alt=""
                    fill
                    className="object-cover rounded-r1"
                />
            ) : (
                <video src={item.preview} className="object-cover w-full h-full" />
            )}

            {item.isPrimary && (
                <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded z-10">
                    Primary
                </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 z-20">
                {!item.isPrimary && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSetPrimary(item.id);
                        }}
                        className="bg-white  px-3 py-1 rounded text-sm hover: w-24"
                    >
                        Set Primary
                    </button>
                )}
                {onPreview && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreview(item.preview);
                        }}
                        className="bg-white  px-3 py-1 rounded text-sm hover: w-24"
                    >
                        Preview
                    </button>
                )}
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                    }}
                    className="absolute top-2 right-2 bg-danger w-6 h-6 flex justify-center items-center text-white rounded text-md hover:bg-danger2"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

// Media Upload Area Component
interface MediaUploadAreaProps {
    media: MediaItem[];
    onAdd: (files: FileList | null) => void;
    onRemove: (mediaId: string) => void;
    onSetPrimary: (mediaId: string) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onPreview?: (url: string) => void;
}

const MediaUploadArea: React.FC<MediaUploadAreaProps> = ({
    media,
    onAdd,
    onRemove,
    onSetPrimary,
    onReorder,
    onPreview,
}) => {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id && onReorder) {
            const oldIndex = media.findIndex((item) => item.id === active.id);
            const newIndex = media.findIndex((item) => item.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onAdd(files);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        onAdd(files);
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Upload Zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-r1 p-8 text-center transition-colors ${dragOver
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-secondary hover:bg-secondary/10"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload className="mx-auto mb-3 bg-primary/10 p-2 w-10 h-10 rounded-r2 text-primary" />

                <div>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        color="var(--color-primary)"
                    >
                        Choose Files
                    </Button>
                    <p className="text-sm text-primary mt-2">
                        or drag and drop images/videos here
                    </p>
                </div>
            </div>

            {/* Media Grid */}
            {media.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={media.map(m => m.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="flex flex-wrap gap-5">
                            {media.map((item) => (
                                <SortableMediaItem
                                    key={item.id}
                                    item={item}
                                    onRemove={onRemove}
                                    onSetPrimary={onSetPrimary}
                                    onPreview={onPreview}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};
