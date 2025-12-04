/**
 * Product View Modal Component
 * A beautiful modal for viewing product details
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Modal } from "../ui/modal";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/table";
import {
    X,
    Edit,
    Package,
    Tag,
    DollarSign,
    Ruler,
    Image as ImageIcon,
    Layers,
    ChevronLeft,
    ChevronRight,
    Star,
    Box,
    Store,
    Calendar,
    Hash,
    FileText,
} from "lucide-react";
import { ProductDetail } from "../../services/products/types/product.types";

interface ProductViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDetail | any | null;
    onEdit?: () => void;
    categories?: { id: number; name: string }[];
    vendors?: { id: number; name: string }[];
}

// Helper to format currency
const formatCurrency = (value: string | number | null | undefined): string => {
    if (!value) return "—";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(num);
};

// Helper to format date
const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Section Header Component
const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    badge?: React.ReactNode;
}> = ({ icon, title, badge }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-r1 text-primary">{icon}</div>
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {badge}
    </div>
);

// Info Row Component
const InfoRow: React.FC<{
    label: string;
    value: React.ReactNode;
    className?: string;
}> = ({ label, value, className = "" }) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
        </span>
        <span className="text-sm font-medium">{value || "—"}</span>
    </div>
);

// Helper function to build variant label from groupValues, combination, or variants
const buildVariantLabel = (item: any, product: any, fallbackIndex: number): string => {
    const attributes = product.attributes || [];
    const variants = product.variants || [];
    
    // Build a lookup map of attribute_value_id -> attribute_value from variants.combinations
    const valueMap: Record<number, any> = {};
    variants.forEach((variant: any) => {
        variant.combinations?.forEach((combo: any) => {
            if (combo.attribute_value) {
                valueMap[combo.attribute_value_id] = combo.attribute_value;
            }
        });
    });
    
    // First try groupValues (if available from API - prices, weights have this)
    if (item.groupValues && item.groupValues.length > 0) {
        const parts: string[] = [];
        for (const gv of item.groupValues) {
            // Find attribute name
            const attr = attributes.find((a: any) => 
                a.attribute_id === gv.attribute_id || 
                a.attribute?.id === gv.attribute_id
            );
            const attrName = attr?.attribute?.name_en || '';
            
            // Find value name from our lookup map or from gv.attribute_value
            const attrValue = gv.attribute_value || valueMap[gv.attribute_value_id];
            const valueName = attrValue?.value_en || '';
            
            if (valueName) {
                parts.push(attrName ? `${attrName}: ${valueName}` : valueName);
            }
        }
        if (parts.length > 0) {
            return parts.join(' / ');
        }
    }
    
    // Try combinations array (for stock items that reference variant_id)
    if (item.variant_id) {
        const variant = variants.find((v: any) => v.id === item.variant_id);
        if (variant?.combinations && variant.combinations.length > 0) {
            const parts: string[] = [];
            for (const combo of variant.combinations) {
                const attr = attributes.find((a: any) => 
                    a.attribute_id === combo.attribute_value?.attribute_id ||
                    a.attribute?.id === combo.attribute_value?.attribute_id
                );
                const attrName = attr?.attribute?.name_en || '';
                const valueName = combo.attribute_value?.value_en || '';
                
                if (valueName) {
                    parts.push(attrName ? `${attrName}: ${valueName}` : valueName);
                }
            }
            if (parts.length > 0) {
                return parts.join(' / ');
            }
        }
    }
    
    // Fallback to combination object (format: { "attr_id": value_id })
    if (item.combination && typeof item.combination === 'object') {
        const parts: string[] = [];
        for (const [attrId, valueId] of Object.entries(item.combination)) {
            // Find the attribute by ID
            const attr = attributes.find((a: any) => 
                a.attribute_id?.toString() === attrId || 
                a.attribute?.id?.toString() === attrId ||
                a.id?.toString() === attrId
            );
            const attrName = attr?.attribute?.name_en || attr?.name_en || '';
            
            // Find the value from our lookup map
            const attrValue = valueMap[Number(valueId)];
            const valueName = attrValue?.value_en || '';
            
            if (valueName) {
                parts.push(attrName ? `${attrName}: ${valueName}` : valueName);
            }
        }
        if (parts.length > 0) {
            return parts.join(' / ');
        }
    }
    
    return `Variant ${fallbackIndex + 1}`;
};

export const ProductViewModal: React.FC<ProductViewModalProps> = ({
    isOpen,
    onClose,
    product,
    onEdit,
    categories = [],
    vendors = [],
}) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [selectedMediaGroup, setSelectedMediaGroup] = useState<number | 'all'>('all');

    if (!product) return null;

    // Check if media is variant-based (has media_group)
    const allMedia = product.media || [];
    const isMediaVariantBased = allMedia.some((m: any) => m.media_group?.groupValues?.length > 0);
    
    // Group media by media_group_id
    const mediaGroups: Map<number, { groupValues: any[]; media: any[] }> = new Map();
    const ungroupedMedia: any[] = [];
    
    allMedia.forEach((m: any) => {
        if (m.media_group?.id) {
            if (!mediaGroups.has(m.media_group.id)) {
                mediaGroups.set(m.media_group.id, {
                    groupValues: m.media_group.groupValues || [],
                    media: []
                });
            }
            mediaGroups.get(m.media_group.id)!.media.push(m);
        } else {
            ungroupedMedia.push(m);
        }
    });
    
    // Sort media within each group
    mediaGroups.forEach((group) => {
        group.media.sort((a, b) => a.sort_order - b.sort_order);
    });
    ungroupedMedia.sort((a, b) => a.sort_order - b.sort_order);
    
    // Get filtered media based on selection
    const getFilteredMedia = () => {
        if (selectedMediaGroup === 'all') {
            return [...allMedia].sort((a, b) => a.sort_order - b.sort_order);
        }
        const group = mediaGroups.get(selectedMediaGroup);
        return group ? group.media : [];
    };
    
    const sortedMedia = getFilteredMedia();
    const primaryMedia = sortedMedia.find((m) => m.is_primary) || sortedMedia[0];
    const currentMedia = sortedMedia[currentMediaIndex] || primaryMedia;
    
    // Build variant label for media group
    const getMediaGroupLabel = (groupValues: any[]) => {
        if (!groupValues || groupValues.length === 0) return 'General';
        return buildVariantLabel({ groupValues }, product, 0);
    };
    
    // Get current media variant label
    const getCurrentMediaVariant = () => {
        if (!currentMedia?.media_group?.groupValues?.length) return null;
        return getMediaGroupLabel(currentMedia.media_group.groupValues);
    };

    // Get category and vendor names
    const categoryName =
        categories.find((c) => c.id === product.category_id)?.name ||
        product.category?.name ||
        `Category #${product.category_id}`;
    const vendorName = product.vendor_id
        ? vendors.find((v) => v.id === product.vendor_id)?.name ||
        product.vendor?.name ||
        `Vendor #${product.vendor_id}`
        : null;

    // Get pricing data
    const prices = (product as any).prices || [];
    const hasPricing = prices.length > 0;
    const singlePrice = prices.length === 1 ? prices[0] : null;
    const hasVariantPricing = prices.length > 1;

    // Get weight data
    const weights = (product as any).weights || [];
    const hasWeight = weights.length > 0;
    const singleWeight = weights.length === 1 ? weights[0] : null;
    const hasVariantWeight = weights.length > 1;

    // Get stock data
    const stocks = product.stock || [];
    const totalStock = stocks.reduce(
        (sum: number, s: any) => sum + (s.quantity || s.stock_quantity || 0),
        0
    );

    // Get attributes
    const attributes = product.attributes || [];
    const hasAttributes = attributes.length > 0;

    // Media navigation
    const handlePrevMedia = () => {
        setCurrentMediaIndex((prev) =>
            prev === 0 ? sortedMedia.length - 1 : prev - 1
        );
    };

    const handleNextMedia = () => {
        setCurrentMediaIndex((prev) =>
            prev === sortedMedia.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="w-full max-w-7xl max-h-[90vh] bg-white overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between pr-8 pb-5 border-b border-primary/20 w-full">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-r1">
                        <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{product.name_en}</h2>
                        {product.name_ar && (
                            <p className="text-sm text-primary/75" dir="rtl">
                                {product.name_ar}
                            </p>
                        )}
                    </div>
                    <Badge variant={product.is_active ? "success" : "danger"}>
                        {product.is_active ? "Active" : "Inactive"}
                    </Badge>

                </div>
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <Button onClick={onEdit} variant="outline">
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Media */}
                    <div className="lg:col-span-1">
                        <Card variant="nested" className="sticky top-0">
                            <SectionHeader
                                icon={<ImageIcon className="h-5 w-5" />}
                                title="Media"
                                badge={
                                    sortedMedia.length > 0 && (
                                        <Badge variant="default">
                                            {currentMediaIndex + 1}/{sortedMedia.length}
                                        </Badge>
                                    )
                                }
                            />

                            {sortedMedia.length > 0 ? (
                                <div>
                                    {/* Variant Filter Tabs (only if media is variant-based) */}
                                    {isMediaVariantBased && mediaGroups.size > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <button
                                                onClick={() => { setSelectedMediaGroup('all'); setCurrentMediaIndex(0); }}
                                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                                    selectedMediaGroup === 'all'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                            >
                                                All ({allMedia.length})
                                            </button>
                                            {Array.from(mediaGroups.entries()).map(([groupId, group]) => (
                                                <button
                                                    key={groupId}
                                                    onClick={() => { setSelectedMediaGroup(groupId); setCurrentMediaIndex(0); }}
                                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                                        selectedMediaGroup === groupId
                                                            ? 'bg-primary text-white'
                                                            : 'bg-gray-100 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {getMediaGroupLabel(group.groupValues)} ({group.media.length})
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Main Media Display */}
                                    <div className="relative aspect-square bg-primary/10 border border-primary/20 rounded-r1 overflow-hidden">
                                        {currentMedia?.type === "video" ? (
                                            <video
                                                src={currentMedia.url}
                                                controls
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Image
                                                src={currentMedia?.url || "/placeholder.png"}
                                                alt={product.name_en}
                                                fill
                                                className="object-cover"
                                            />
                                        )}

                                        {/* Navigation Arrows */}
                                        {sortedMedia.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevMedia}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={handleNextMedia}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Primary Badge */}
                                        {currentMedia?.is_primary && (
                                            <div className="absolute top-2 left-2">
                                                <Badge variant="primary">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Primary
                                                </Badge>
                                            </div>
                                        )}
                                        
                                        {/* Current Variant Label */}
                                        {getCurrentMediaVariant() && selectedMediaGroup === 'all' && (
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {getCurrentMediaVariant()}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnails */}
                                    {sortedMedia.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto py-2">
                                            {sortedMedia.map((media, index) => (
                                                <button
                                                    key={media.id}
                                                    onClick={() => setCurrentMediaIndex(index)}
                                                    className={`relative w-16 h-16 shrink-0 rounded-r1 overflow-hidden border-2 transition-colors ${index === currentMediaIndex
                                                        ? "border-primary"
                                                        : "border-transparent hover:border-primary/50"
                                                        }`}
                                                >
                                                    {media.type === "video" ? (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                            <Box className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    ) : (
                                                        <Image
                                                            src={media.url}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-square bg-gray-50 rounded-r1 flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="h-12 w-12 mx-auto" />
                                        <p className="text-sm">No media</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column - Details */}
                    <div className="col-span-2 flex flex-col gap-5">
                        {/* Basic Information */}
                        <Card variant="nested">
                            <SectionHeader
                                icon={<FileText className="h-5 w-5" />}
                                title="Basic Information"
                            />

                            {/* Key Info Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
                                    <div className="flex items-center justify-start gap-2">
                                        <Hash className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">ID</span>
                                    </div>
                                    <span className="text-lg font-bold">{product.id}</span>
                                </Card>
                                <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Tag className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">SKU</span>
                                    </div>
                                    <span className="text-sm font-semibold font-mono">{product.sku || "—"}</span>
                                </Card>
                                <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Layers className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Category</span>
                                    </div>
                                    <Badge variant="secondary">{categoryName}</Badge>
                                </Card>
                                {vendorName ? (
                                    <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Store className="h-4 w-4 text-primary" />
                                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Vendor</span>
                                        </div>
                                        <span className="text-sm font-semibold">{vendorName}</span>
                                    </Card>
                                ) : (
                                    <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Store className="h-4 w-4 text-primary" />
                                            <span className="text-xs font-medium text-gray-500 uppercase">Vendor</span>
                                        </div>
                                        <span className="text-sm text-gray-400">—</span>
                                    </Card>
                                )}
                            </div>

                            {/* Timestamps */}
                            <Card variant="nested" noFlex className="flex justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <div>
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Created</span>
                                        <p className="text-sm font-medium">{formatDate(product.created_at)}</p>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-gray-200" />
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <div>
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Last Updated</span>
                                        <p className="text-sm font-medium">{formatDate(product.updated_at)}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Descriptions */}
                            {(product.short_description_en || product.long_description_en) && (
                                <div className="space-y-4">
                                    {product.short_description_en && (
                                        <Card variant="nested">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                                                    Short Description
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed">{product.short_description_en}</p>
                                        </Card>
                                    )}
                                    {product.long_description_en && (
                                        <Card variant="nested">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                                                    Long Description
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {product.long_description_en}
                                            </p>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Attributes */}
                        {hasAttributes && (
                            <Card variant="nested">
                                <SectionHeader
                                    icon={<Tag className="h-5 w-5" />}
                                    title="Product Attributes"
                                    badge={
                                        <Badge variant="default">
                                            {attributes.length} attributes
                                        </Badge>
                                    }
                                />

                                <div className="space-y-4">
                                    {attributes.map((attr: any, index: number) => {
                                        const attrName =
                                            attr.attribute?.name_en || `Attribute ${index + 1}`;
                                        const controls = [];
                                        if (attr.controls_pricing) controls.push("Pricing");
                                        if (attr.controls_media) controls.push("Media");
                                        if (attr.controls_weight) controls.push("Weight");

                                        return (
                                            <Card variant="nested" noFlex className="flex justify-between w-full" key={index}>
                                                <span className="font-bold">{attrName}</span>
                                                {controls.length > 0 && (
                                                    <div className="flex justify-center items-center gap-1">
                                                        {controls.map((c) => (
                                                            <Badge key={c} variant="primary" className="text-xs">
                                                                Controls {c}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        {/* Pricing */}
                        <Card variant="nested">
                            <SectionHeader
                                icon={<DollarSign className="h-5 w-5" />}
                                title="Pricing"
                                badge={
                                    hasVariantPricing && (
                                        <Badge variant="default">
                                            {prices.length} variants
                                        </Badge>
                                    )
                                }
                            />

                            {!hasPricing ? (
                                <p className="text-sm text-gray-500">No pricing data available</p>
                            ) : singlePrice ? (
                                <div className="grid grid-cols-3 gap-4">
                                    <InfoRow
                                        label="Cost"
                                        value={formatCurrency(singlePrice.cost)}
                                    />
                                    <InfoRow
                                        label="Price"
                                        value={
                                            <span className="text-lg font-bold text-primary">
                                                {formatCurrency(singlePrice.price)}
                                            </span>
                                        }
                                    />
                                    {singlePrice.sale_price && (
                                        <InfoRow
                                            label="Sale Price"
                                            value={
                                                <span className="text-lg font-bold text-green-600">
                                                    {formatCurrency(singlePrice.sale_price)}
                                                </span>
                                            }
                                        />
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow isHeader>
                                                <TableHead>Variant</TableHead>
                                                <TableHead>Cost</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Sale Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {prices.slice(0, 5).map((price: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        {buildVariantLabel(price, product, index)}
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(price.cost)}</TableCell>
                                                    <TableCell className="font-semibold text-primary">
                                                        {formatCurrency(price.price)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {price.sale_price
                                                            ? formatCurrency(price.sale_price)
                                                            : "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {prices.length > 5 && (
                                        <p className="text-xs text-gray-500 text-center">
                                            +{prices.length - 5} more variants
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Weight & Dimensions */}
                        <Card variant="nested">
                            <SectionHeader
                                icon={<Ruler className="h-5 w-5" />}
                                title="Weight & Dimensions"
                                badge={
                                    hasVariantWeight && (
                                        <Badge variant="default">
                                            {weights.length} variants
                                        </Badge>
                                    )
                                }
                            />

                            {!hasWeight ? (
                                <p className="text-sm text-gray-500">No weight data available</p>
                            ) : singleWeight ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoRow
                                        label="Weight"
                                        value={
                                            singleWeight.weight
                                                ? `${singleWeight.weight} kg`
                                                : "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Length"
                                        value={
                                            singleWeight.length
                                                ? `${singleWeight.length} cm`
                                                : "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Width"
                                        value={
                                            singleWeight.width
                                                ? `${singleWeight.width} cm`
                                                : "—"
                                        }
                                    />
                                    <InfoRow
                                        label="Height"
                                        value={
                                            singleWeight.height
                                                ? `${singleWeight.height} cm`
                                                : "—"
                                        }
                                    />
                                </div>
                            ) : (
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow isHeader>
                                                <TableHead>Variant</TableHead>
                                                <TableHead>Weight</TableHead>
                                                <TableHead>L × W × H</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {weights.slice(0, 5).map((w: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        {buildVariantLabel(w, product, index)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {w.weight ? `${w.weight} kg` : "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {w.length && w.width && w.height
                                                            ? `${w.length} × ${w.width} × ${w.height} cm`
                                                            : "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {weights.length > 5 && (
                                        <p className="text-xs text-gray-500 text-center">
                                            +{weights.length - 5} more variants
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Stock */}
                        <Card variant="nested">
                            <SectionHeader
                                icon={<Layers className="h-5 w-5" />}
                                title="Stock"
                                badge={
                                    <Badge variant={totalStock > 0 ? "success" : "danger"}>
                                        {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                                    </Badge>
                                }
                            />

                            {stocks.length === 0 ? (
                                <p className="text-sm text-gray-500">No stock data available</p>
                            ) : stocks.length === 1 && !stocks[0].variant_id ? (
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gray-50 rounded-r1">
                                        <span className="text-3xl font-bold text-primary">
                                            {stocks[0].quantity || stocks[0].stock_quantity || 0}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-2">units</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow isHeader>
                                                <TableHead>Variant</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stocks.slice(0, 5).map((s: any, index: number) => {
                                                const qty = s.quantity || s.stock_quantity || 0;
                                                const variantLabel = buildVariantLabel(s, product, index);

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>{variantLabel}</TableCell>
                                                        <TableCell className="font-semibold">{qty}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    qty === 0
                                                                        ? "danger"
                                                                        : qty < 10
                                                                            ? "warning"
                                                                            : "success"
                                                                }
                                                            >
                                                                {qty === 0
                                                                    ? "Out of stock"
                                                                    : qty < 10
                                                                        ? "Low stock"
                                                                        : "In stock"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    {stocks.length > 5 && (
                                        <p className="text-xs text-gray-500 text-center">
                                            +{stocks.length - 5} more variants
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Ratings */}
                        {(product.average_rating || product.total_ratings) && (
                            <Card variant="nested">
                                <SectionHeader
                                    icon={<Star className="h-5 w-5" />}
                                    title="Customer Ratings"
                                />
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                                        <span className="text-3xl font-bold">
                                            {typeof product.average_rating === "string"
                                                ? parseFloat(product.average_rating).toFixed(1)
                                                : product.average_rating?.toFixed(1) || "0.0"}
                                        </span>
                                        <span className="text-gray-500">/ 5</span>
                                    </div>
                                    <div className="text-gray-500">
                                        Based on{" "}
                                        <span className="font-semibold text-gray-700">
                                            {product.total_ratings || 0}
                                        </span>{" "}
                                        reviews
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductViewModal;
