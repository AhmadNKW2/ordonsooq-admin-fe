import React, { useState, useEffect } from "react";
import { Input } from "../../ui/input";
import {
    Attribute,
    VariantCombination,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";

interface StockSectionProps {
    attributes: Attribute[];
    variants: VariantCombination[];
    pricingType: "single" | "variant";
    onChange: (variants: VariantCombination[]) => void;
}

export const StockSection: React.FC<StockSectionProps> = ({
    attributes,
    variants,
    pricingType,
    onChange,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Generate all possible variant combinations
    const generateAllCombinations = (): VariantCombination[] => {
        if (pricingType === "single" || attributes.length === 0) {
            // For single pricing or no attributes, we only have one "variant"
            return [
                {
                    id: "single",
                    stock: 0,
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
                const label = Object.entries(current)
                    .map(([attrId, valueId]) => {
                        const attr = attrs.find((a) => a.id === attrId);
                        const val = attr?.values.find((v) => v.id === valueId);
                        return `${val?.value}`;
                    })
                    .join("-");

                const existing = variants.find((v) => {
                    return Object.entries(current).every(
                        ([attrId, valueId]) => v.attributeValues[attrId] === valueId
                    );
                });

                return [
                    {
                        id: existing?.id || `variant-${Date.now()}-${Math.random()}`,
                        stock: existing?.stock || 0,
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

        return generateCombos(attributes);
    };

    // Update variants when attributes change
    useEffect(() => {
        const allCombinations = generateAllCombinations();
        onChange(allCombinations);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributes.length, pricingType]);

    const allCombinations = generateAllCombinations();

    const getVariantLabel = (variant: VariantCombination): string => {
        if (pricingType === "single") {
            return "Single Product";
        }

        return Object.entries(variant.attributeValues)
            .map(([attrId, valueId]) => {
                const attr = attributes.find((a) => a.id === attrId);
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
                    [field]: field === "stock" ? (typeof value === "string" ? parseInt(value) || 0 : value) : value,
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

    const totalStock = allCombinations.reduce((sum, v) => sum + v.stock, 0);
    const lowStockCount = allCombinations.filter((v) => v.stock > 0 && v.stock < 10).length;
    const outOfStockCount = allCombinations.filter((v) => v.stock === 0).length;

    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-900">
                Stock Management
            </h2>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-5">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total Variants</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {allCombinations.length}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-primary">{lowStockCount}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-danger">{outOfStockCount}</p>
                </div>
            </div>

            {/* Search */}
            {allCombinations.length > 5 && (
                <Input
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                    }
                    placeholder="Search variants..."
                />
            )}

            {/* Variants Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Variant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Current Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCombinations.map((variant) => {
                            const label = getVariantLabel(variant);
                            const status =
                                variant.stock === 0
                                    ? "Out of Stock"
                                    : variant.stock < 10
                                        ? "Low Stock"
                                        : "In Stock";
                            const statusColor =
                                variant.stock === 0
                                    ? "text-danger"
                                    : variant.stock < 10
                                        ? "text-primary"
                                        : "text-sixth";

                            return (
                                <tr key={variant.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {label}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={variant.stock}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handleStockChange(
                                                    variant.id,
                                                    "stock",
                                                    e.target.value
                                                )
                                            }
                                            className="max-w-[100px]"
                                        />
                                    </td>
                                    <td
                                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${statusColor}`}
                                    >
                                        {status}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredCombinations.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                    No variants found matching &quot;{searchQuery}&quot;
                </div>
            )}
        </Card>
    );
};
