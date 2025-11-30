import React, { useState, useEffect } from "react";
import { Input } from "../../ui/input";
import {
    Attribute,
    VariantCombination,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../../ui/table";

interface StockSectionProps {
    attributes: Attribute[];
    variants: VariantCombination[];
    onChange: (variants: VariantCombination[]) => void;
    errors: Record<string, string>;
}

// Stat Card Component
interface StatCardProps {
    label: string;
    value: number;
    valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, valueClassName = "" }) => (
    <Card variant="nested">
        <p className="text-sm ">{label}</p>
        <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
    </Card>
);

// Stock Status Helper
const getStockStatus = (stock?: number): { label: string; className: string } => {
    if (stock === undefined || stock === 0) return { label: "Out of Stock", className: "text-danger" };
    if (stock < 10) return { label: "Low Stock", className: "" };
    return { label: "In Stock", className: "text-primary" };
};

export const StockSection: React.FC<StockSectionProps> = ({
    attributes,
    variants,
    onChange,
    errors,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter attributes that have values
    const attributesWithValues = attributes.filter(attr => attr.values && attr.values.length > 0);

    // Generate all possible variant combinations
    const generateAllCombinations = (): VariantCombination[] => {
        if (attributesWithValues.length === 0) {
            // For no attributes with values, we only have one "variant"
            const existing = variants.find(v => v.id === 'single');
            return [
                {
                    id: "single",
                    stock: existing?.stock,
                    attributeValues: {},
                },
            ];
        }

        const generateCombos = (
            attrs: Attribute[],
            current: { [attrId: string]: string } = {},
            index: number = 0
        ): VariantCombination[] => {
            if (index === attrs.length) {

                const existing = variants.find((v) => {
                    return Object.entries(current).every(
                        ([attrId, valueId]) => v.attributeValues[attrId] === valueId
                    );
                });

                return [
                    {
                        id: existing?.id || `variant-${Date.now()}-${Math.random()}`,
                        stock: existing?.stock,
                        attributeValues: { ...current },
                    },
                ];
            }

            const results: VariantCombination[] = [];
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

        return generateCombos(attributesWithValues);
    };

    // Update variants when attributes change
    useEffect(() => {
        const allCombinations = generateAllCombinations();
        onChange(allCombinations);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributesWithValues.length]);

    const allCombinations = generateAllCombinations();

    const getVariantLabel = (variant: VariantCombination): string => {
        if (attributesWithValues.length === 0) {
            return "Single Product";
        }

        return Object.entries(variant.attributeValues)
            .map(([attrId, valueId]) => {
                const attr = attributesWithValues.find((a) => a.id === attrId);
                const val = attr?.values.find((v) => v.id === valueId);
                return `${attr?.name}: ${val?.value}`;
            })
            .join(" / ");
    };

    const handleStockChange = (variantId: string, field: keyof VariantCombination, value: string | number) => {
        const updated = allCombinations.map((v) => {
            if (v.id === variantId) {
                return {
                    ...v,
                    [field]: field === "stock" ? (value === '' ? undefined : (typeof value === "string" ? parseInt(value) || 0 : value)) : value,
                };
            }
            return v;
        });

        onChange(updated);
    };

    const filteredCombinations = allCombinations.filter((combo) => {
        const label = getVariantLabel(combo).toLowerCase();
        return label.includes(searchQuery.toLowerCase());
    });

    const totalStock = allCombinations.reduce((sum, v) => sum + (v.stock || 0), 0);
    const lowStockCount = allCombinations.filter((v) => v.stock !== undefined && v.stock > 0 && v.stock < 10).length;
    const outOfStockCount = allCombinations.filter((v) => v.stock === undefined || v.stock === 0).length;

    return (
        <Card>
            <div>
                <h2 className="text-xl font-semibold ">
                    Stock Management
                </h2>
                {errors['variants'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['variants']}</p>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-5">
                <StatCard label="Total Variants" value={allCombinations.length} />
                <StatCard label="Total Stock" value={totalStock} />
                <StatCard label="Low Stock" value={lowStockCount} valueClassName="" />
                <StatCard label="Out of Stock" value={outOfStockCount} valueClassName="text-danger" />
            </div>

            {/* Search */}
            {allCombinations.length > 5 && (
                <Input
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                    }
                />
            )}

            {/* Variants Table */}
            <Table>
                <TableHeader>
                    <TableRow isHeader>
                        <TableHead>
                            Variant
                        </TableHead>
                        <TableHead>
                            Current Stock
                        </TableHead>
                        <TableHead>
                            Status
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredCombinations.map((variant) => {
                        const label = getVariantLabel(variant);
                        const variantIndex = variants.findIndex(v => v.id === variant.id);
                        const stockStatus = getStockStatus(variant.stock);

                        return (
                            <TableRow key={variant.id}>
                                <TableCell className="font-medium">
                                    {label}
                                </TableCell>
                                <TableCell>
                                    <Input
                                        id={`variants.${variantIndex}.stock`}
                                        type="number"
                                        min="0"
                                        value={variant.stock === undefined || variant.stock === null ? '' : variant.stock}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleStockChange(
                                                variant.id,
                                                "stock",
                                                e.target.value
                                            )
                                        }
                                        placeholder="0"
                                        size="sm"
                                        error={variantIndex >= 0 ? errors[`variants.${variantIndex}.stock`] : undefined}
                                    />
                                </TableCell>
                                <TableCell className={`font-medium ${stockStatus.className}`}>
                                    {stockStatus.label}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {filteredCombinations.length === 0 && searchQuery && (
                <div className="text-center py-8 ">
                    No variants found matching &quot;{searchQuery}&quot;
                </div>
            )}
        </Card>
    );
};
