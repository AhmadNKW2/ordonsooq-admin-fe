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
    const mediaAttributes = attributes.filter((attr) => attr.controlsMedia);

    // Generate all combinations for media attributes
    const generateMediaCombinations = (): Array<{
        key: string;
        label: string;
        attributeValues: { [attrId: string]: string };
    }> => {
        if (mediaAttributes.length === 0) return [];

        const generateCombos = (
            attrs: Attribute[],
            current: { [attrId: string]: string } = {},
            index: number = 0
        ): Array<{ key: string; label: string; attributeValues: { [attrId: string]: string } }> => {
            if (index === attrs.length) {
                const label = Object.entries(current)
                    .map(([attrId, valueId]) => {
                        const attr = attrs.find((a) => a.id === attrId);
                        const val = attr?.values.find((v) => v.id === valueId);
                        return `${attr?.name}: ${val?.value}`;
                    })
                    .join(" / ");

                return [{ key: Object.values(current).join("-"), label, attributeValues: { ...current } }];
            }

            const results: Array<{
                key: string;
                label: string;
                attributeValues: { [attrId: string]: string };
            }> = [];
            const currentAttr = attrs[index];

            for (const value of currentAttr.values) {
                results.push(
                    ...generateCombos(
                        attrs,
                        { ...current, [currentAttr.id]: value.id },
                        index + 1
                    )
                );
            }

            return results;
        };

        return generateCombos(mediaAttributes);
    };

    const handleSingleMediaAdd = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newMediaItems: MediaItem[] = Array.from(files).map((file, index) => ({
            id: `media-${Date.now()}-${index}`,
            file: file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
            isPrimary: singleMedia.length === 0 && index === 0,
            order: singleMedia.length + index,
        }));

        onChangeSingle([...singleMedia, ...newMediaItems]);
    };

    const handleSingleMediaRemove = (mediaId: string) => {
        const mediaToRemove = singleMedia.find((m) => m.id === mediaId);
        if (mediaToRemove) {
            URL.revokeObjectURL(mediaToRemove.preview);
        }
        const filtered = singleMedia.filter((m) => m.id !== mediaId);
        onChangeSingle(filtered);
    };

    const handleSingleMediaSetPrimary = (mediaId: string) => {
        const updated = singleMedia.map((m) => ({
            ...m,
            isPrimary: m.id === mediaId,
        }));
        onChangeSingle(updated);
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

        const combinations = generateMediaCombinations();
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const existing = variantMedia.find((vm) => vm.key === key);
        const currentMedia = existing?.media || [];

        const newMediaItems: MediaItem[] = Array.from(files).map((file, index) => ({
            id: `media-${Date.now()}-${index}`,
            file: file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
            isPrimary: currentMedia.length === 0 && index === 0,
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

        const filtered = existing.media.filter((m) => m.id !== mediaId);

        if (filtered.length === 0) {
            onChangeVariant(variantMedia.filter((vm) => vm.key !== key));
        } else {
            const updated: VariantMedia = {
                ...existing,
                media: filtered,
            };

            const newVariantMedia = variantMedia.filter((vm) => vm.key !== key);
            onChangeVariant([...newVariantMedia, updated]);
        }
    };

    const handleVariantMediaSetPrimary = (key: string, mediaId: string) => {
        const existing = variantMedia.find((vm) => vm.key === key);
        if (!existing) return;

        const updated: VariantMedia = {
            ...existing,
            media: existing.media.map((m) => ({
                ...m,
                isPrimary: m.id === mediaId,
            })),
        };

        const newVariantMedia = variantMedia.filter((vm) => vm.key !== key);
        onChangeVariant([...newVariantMedia, updated]);
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

    const getVariantMedia = (key: string): MediaItem[] => {
        return variantMedia.find((vm) => vm.key === key)?.media || [];
    };

    // Single mode (not variant-based)
    if (!isMediaVariantBased && !hasAttributeControllingMedia) {
        return (
            <Card className={errors['singleMedia'] ? "border-danger" : ""}>
                <div className="flex flex-col gap-2" id="singleMedia">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Media Management
                        </h2>
                    </div>
                    {hasAttributeControllingMedia && mediaAttributes.length === 0 && (
                        <p className="text-sm text-gray-600">
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
                        <div className="w-188 h-188 relative rounded-rounded1">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-cover rounded-rounded1"
                            />
                        </div>
                    )}
                </Modal>
            </Card>
        );
    }

    // Variant-based mode
    const combinations = generateMediaCombinations();

    if (combinations.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Media Management
                    </h2>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">
                        Please select attribute values to configure media.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                    Media Management - Variant Based
                </h2>
            </div>

            <p className="text-sm text-gray-600">
                Upload media for each variant based on{" "}
                <strong>{mediaAttributes.map((a) => a.name).join(", ")}</strong>
            </p>

            {combinations.map((combo) => {
                const media = getVariantMedia(combo.key);

                return (
                    <div
                        key={combo.key}
                        className="bg-gray-50 p-4 rounded-rounded1 border border-gray-200 flex flex-col gap-5"
                    >
                        <h4 className="font-medium text-gray-900">{combo.label}</h4>

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
                    </div>
                );
            })}

            <Modal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                className="max-w-4xl shadow-none"
                variant="transparent"
            >
                {previewImage && (
                    <div className="relative w-[650px] h-[650px]">
                        <Image
                            src={previewImage}
                            alt="Preview"
                            fill
                            className="object-contain rounded-rounded1"
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
            className="w-40 h-40 relative group border-2 rounded-lg overflow-hidden border-gray-200 touch-none"
        >
            {item.type === "image" ? (
                <Image
                    src={item.preview}
                    alt=""
                    fill
                    className="object-cover"
                />
            ) : (
                <video src={item.preview} className="object-cover w-full h-full" />
            )}

            {item.isPrimary && (
                <div className="absolute top-2 left-2 bg-fourth text-white text-xs px-2 py-1 rounded z-10">
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
                        className="bg-white text-gray-900 px-3 py-1 rounded text-sm hover:bg-gray-100 w-24"
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
                        className="bg-white text-gray-900 px-3 py-1 rounded text-sm hover:bg-gray-100 w-24"
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary"
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

                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>

                <div>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-fourth hover:bg-fourth/90"
                    >
                        Choose Files
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
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
