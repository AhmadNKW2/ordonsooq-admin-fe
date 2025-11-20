import React, { useState } from "react";
import { Toggle } from "../../ui/toggle";
import { Button } from "../../ui/button";
import { SimpleFieldWrapper } from "../SimpleFieldWrapper";
import {
    Attribute,
    MediaItem,
    VariantMedia,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";
import Image from "next/image";

interface MediaSectionProps {
    attributes: Attribute[];
    isMediaVariantBased: boolean;
    singleMedia: MediaItem[];
    variantMedia: VariantMedia[];
    onToggleVariantBased: (value: boolean) => void;
    onChangeSingle: (media: MediaItem[]) => void;
    onChangeVariant: (media: VariantMedia[]) => void;
    hasAttributeControllingMedia: boolean;
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
}) => {
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

    const handleSingleMediaAdd = (file: File) => {
        const newMedia: MediaItem = {
            id: `media-${Date.now()}`,
            url: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
            isPrimary: singleMedia.length === 0,
            order: singleMedia.length,
        };

        onChangeSingle([...singleMedia, newMedia]);
    };

    const handleSingleMediaRemove = (mediaId: string) => {
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

    const handleVariantMediaAdd = (key: string, file: File) => {
        const combinations = generateMediaCombinations();
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const existing = variantMedia.find((vm) => vm.key === key);
        const currentMedia = existing?.media || [];

        const newMedia: MediaItem = {
            id: `media-${Date.now()}`,
            url: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
            isPrimary: currentMedia.length === 0,
            order: currentMedia.length,
        };

        const updated: VariantMedia = {
            key,
            attributeValues: combo.attributeValues,
            media: [...currentMedia, newMedia],
        };

        const newVariantMedia = variantMedia.filter((vm) => vm.key !== key);
        onChangeVariant([...newVariantMedia, updated]);
    };

    const handleVariantMediaRemove = (key: string, mediaId: string) => {
        const existing = variantMedia.find((vm) => vm.key === key);
        if (!existing) return;

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

    const getVariantMedia = (key: string): MediaItem[] => {
        return variantMedia.find((vm) => vm.key === key)?.media || [];
    };

    // Single mode (not variant-based)
    if (!isMediaVariantBased && !hasAttributeControllingMedia) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Media Management
                    </h2>
                </div>

                <MediaUploadArea
                    media={singleMedia}
                    onAdd={handleSingleMediaAdd}
                    onRemove={handleSingleMediaRemove}
                    onSetPrimary={handleSingleMediaSetPrimary}
                    onReorder={handleSingleMediaReorder}
                />
            </Card>
        );
    }

    // Variant-based mode
    const combinations = generateMediaCombinations();

    if (mediaAttributes.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Media Management
                    </h2>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">
                        Please configure at least one attribute that controls media in the
                        Attributes Configuration section.
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

            <div className="space-y-6">
                {combinations.map((combo) => {
                    const media = getVariantMedia(combo.key);

                    return (
                        <div
                            key={combo.key}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
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
                            />
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

// Media Upload Area Component
interface MediaUploadAreaProps {
    media: MediaItem[];
    onAdd: (file: File) => void;
    onRemove: (mediaId: string) => void;
    onSetPrimary: (mediaId: string) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
}

const MediaUploadArea: React.FC<MediaUploadAreaProps> = ({
    media,
    onAdd,
    onRemove,
    onSetPrimary,
    onReorder,
}) => {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        files.forEach((file) => {
            if (file.type.startsWith("image") || file.type.startsWith("video")) {
                onAdd(file);
            }
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach((file) => onAdd(file));
        }
    };

    return (
        <div className="space-y-4">
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

                <div className="space-y-2">
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
                            className="bg-sixth hover:bg-sixth/90"
                        >
                            Choose Files
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                            or drag and drop images/videos here
                        </p>
                    </div>
                </div>
            </div>

            {/* Media Grid */}
            {media.length > 0 && (
                <div className="grid grid-cols-9 justify-items-center gap-5">
                    {media.map((item, index) => (
                        <div
                            key={item.id}
                            className="w-40 h-40 relative group border-2 border-gray-200 rounded-lg overflow-hidden"
                        >
                            {item.type === "image" ? (
                                <Image
                                    src={item.url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <video src={item.url} className="object-cover w-full h-full" />
                            )}

                            {item.isPrimary && (
                                <div className="absolute top-2 left-2 bg-fourth text-white text-xs px-2 py-1 rounded">
                                    Primary
                                </div>
                            )}

                            <div className="absolute inset-0 hover:bg-black/50 transition-all flex items-center justify-center gap-2 ">
                                {!item.isPrimary && (
                                    <button
                                        onClick={() => onSetPrimary(item.id)}
                                        className="bg-white text-gray-900 px-3 py-1 rounded text-sm hover:bg-gray-100"
                                    >
                                        Set Primary
                                    </button>
                                )}
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="absolute top-2 right-2 bg-danger w-6 h-6 flex justify-center items-center text-white rounded text-sm hover:bg-danger2"
                                >
                                    X
                                </button>
                            </div>

                            {onReorder && (
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                    {index > 0 && (
                                        <button
                                            onClick={() => onReorder(index, index - 1)}
                                            className="bg-white p-1 rounded shadow hover:bg-gray-100"
                                        >
                                            ←
                                        </button>
                                    )}
                                    {index < media.length - 1 && (
                                        <button
                                            onClick={() => onReorder(index, index + 1)}
                                            className="bg-white p-1 rounded shadow hover:bg-gray-100"
                                        >
                                            →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
