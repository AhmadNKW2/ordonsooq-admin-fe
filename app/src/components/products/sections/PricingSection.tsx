import React from "react";
import { Input } from "../../ui/input";
import {
    Attribute,
    SinglePricing,
    VariantPricing,
} from "../../../services/products/types/product-form.types";
import { Checkbox } from "../../ui/checkbox";
import { Card } from "@/components/ui";

interface PricingSectionProps {
    pricingType: "single" | "variant";
    attributes: Attribute[];
    singlePricing?: SinglePricing;
    variantPricing: VariantPricing[];
    onChangeSingle: (pricing: SinglePricing) => void;
    onChangeVariant: (pricing: VariantPricing[]) => void;
    calculateSalePercentage: (price: number, salePrice?: number) => number;
    errors?: Record<string, string>;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
    pricingType,
    attributes,
    singlePricing,
    variantPricing,
    onChangeSingle,
    onChangeVariant,
    calculateSalePercentage,
    errors = {},
}) => {
    const pricingAttributes = attributes.filter((attr) => attr.controlsPricing);

    // If no attributes control pricing, always show single pricing
    const shouldShowSinglePricing = pricingType === "single" || pricingAttributes.length === 0;

    // Generate all combinations for pricing attributes
    const generatePricingCombinations = (): Array<{
        key: string;
        label: string;
        attributeValues: { [attrId: string]: string };
    }> => {
        if (pricingAttributes.length === 0) return [];

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

        return generateCombos(pricingAttributes);
    };

    const handleSinglePricingChange = (field: keyof SinglePricing, value: string) => {
        const numValue = value === "" ? undefined : parseFloat(value);
        const updated: SinglePricing = {
            ...singlePricing,
            cost: singlePricing?.cost,
            price: singlePricing?.price,
            [field]: numValue,
        } as any;

        if (field === "isSale" && typeof value === "boolean") {
            updated.isSale = value;
        }

        onChangeSingle(updated);
    };

    const handleVariantPricingChange = (
        key: string,
        field: keyof Omit<VariantPricing, "attributeValues">,
        value: string | boolean
    ) => {
        const combinations = generatePricingCombinations();
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const existing = variantPricing.find((vp) => vp.key === key);
        const numValue = typeof value === "string" ? (value === "" ? undefined : parseFloat(value)) : value;

        const updated: VariantPricing = {
            key,
            attributeValues: combo.attributeValues,
            cost: existing?.cost,
            price: existing?.price,
            isSale: existing?.isSale || false,
            salePrice: existing?.salePrice,
            [field]: numValue,
        } as any;

        const newVariantPricing = variantPricing.filter((vp) => vp.key !== key);
        onChangeVariant([...newVariantPricing, updated]);
    };

    // Find existing pricing data that best matches the given attribute values
    // This preserves data when attributes controlling pricing change
    const findMatchingPricing = (attributeValues: { [attrId: string]: string }): VariantPricing | undefined => {
        // First try exact key match
        const key = Object.values(attributeValues).join("-");
        const exactMatch = variantPricing.find((vp) => vp.key === key);
        if (exactMatch) return exactMatch;

        // Try to find a match where all current attribute values are present in existing data
        // This handles the case where we're adding/removing controlling attributes
        let bestMatch: VariantPricing | undefined;
        let bestMatchScore = 0;

        for (const vp of variantPricing) {
            if (!vp.attributeValues) continue;
            
            let matchScore = 0;
            let allMatch = true;
            
            // Check how many attribute values match
            for (const [attrId, valueId] of Object.entries(attributeValues)) {
                if (vp.attributeValues[attrId] === valueId) {
                    matchScore++;
                } else if (vp.attributeValues[attrId] !== undefined) {
                    // Attribute exists in old data but with different value - no match
                    allMatch = false;
                    break;
                }
            }
            
            // Also check reverse: if old data has attributes not in new combination
            for (const [attrId, valueId] of Object.entries(vp.attributeValues)) {
                if (attributeValues[attrId] === undefined) {
                    // Old data has extra attributes - still could be a partial match
                    continue;
                }
            }
            
            if (allMatch && matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                bestMatch = vp;
            }
        }

        return bestMatch;
    };

    const getVariantPricing = (key: string, attributeValues?: { [attrId: string]: string }): VariantPricing | undefined => {
        // First try exact key match
        const exactMatch = variantPricing.find((vp) => vp.key === key);
        if (exactMatch) return exactMatch;
        
        // Fall back to attribute-based matching
        if (attributeValues) {
            return findMatchingPricing(attributeValues);
        }
        
        return undefined;
    };

    if (shouldShowSinglePricing) {
        const salePercentage = calculateSalePercentage(
            singlePricing?.price || 0,
            singlePricing?.salePrice
        );

        return (
            <Card>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-5 items-center">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Pricing Configuration
                        </h2>
                        <Checkbox
                            checked={singlePricing?.isSale || false}
                            onChange={(checked) => {
                                const updated: SinglePricing = {
                                    ...singlePricing,
                                    cost: singlePricing?.cost,
                                    price: singlePricing?.price,
                                    isSale: checked,
                                } as any;
                                onChangeSingle(updated);
                            }}
                            label="On Sale"
                        />

                    </div>
                    {pricingType === "variant" && pricingAttributes.length === 0 && (
                        <p className="text-sm text-gray-600">
                            No attributes are controlling pricing. This price applies to all variants.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-5">
                    <Input
                        id="singlePricing.cost"
                        label="Cost"
                        type="number"
                        step="1"
                        min="0"
                        value={singlePricing?.cost || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleSinglePricingChange("cost", e.target.value)
                        }
                        error={errors['singlePricing.cost']}
                    />

                    <Input
                        id="singlePricing.price"
                        label="Price"
                        type="number"
                        step="0.1"
                        min="0"
                        value={singlePricing?.price || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleSinglePricingChange("price", e.target.value)
                        }
                        error={errors['singlePricing.price']}
                    />

                    {singlePricing?.isSale && (
                        <div className="flex flex-col gap-1">
                            <Input
                                id="singlePricing.salePrice"
                                label="Sale Price"
                                type="number"
                                step="0.1"
                                min="0"
                                value={singlePricing?.salePrice || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleSinglePricingChange("salePrice", e.target.value)
                                }
                                error={errors['singlePricing.salePrice']}
                            />
                            {salePercentage > 0 && (
                                <p className="text-sm text-primary font-medium">
                                    {salePercentage}% off
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </Card >
        );
    }

    // Variant-based mode
    const combinations = generatePricingCombinations();

    if (combinations.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Pricing Configuration
                    </h2>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">
                        Please select attribute values to configure pricing.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-900">
                Pricing Configuration - Variant Based
            </h2>

            <p className="text-sm text-gray-600">
                Configure pricing for each variant combination based on{" "}
                <strong>{pricingAttributes.map((a) => a.name).join(", ")}</strong>
            </p>

            {combinations.map((combo) => {
                const pricing = getVariantPricing(combo.key, combo.attributeValues);
                const variantIndex = variantPricing.findIndex(vp => vp.key === combo.key);
                const salePercentage = calculateSalePercentage(
                    pricing?.price || 0,
                    pricing?.salePrice
                );

                return (
                    <div
                        key={combo.key}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-3"
                    >
                        <div className="flex gap-5 items-center">
                            <h4 className="font-medium text-gray-900">{combo.label}</h4>
                            <Checkbox
                                checked={pricing?.isSale || false}
                                onChange={(checked) =>
                                    handleVariantPricingChange(combo.key, "isSale", checked)
                                }
                                label="On Sale"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-5">
                            <Input
                                id={`variantPricing.${variantIndex}.cost`}
                                label="Cost"
                                type="number"
                                step="0.1"
                                min="0"
                                value={pricing?.cost || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleVariantPricingChange(combo.key, "cost", e.target.value)
                                }
                                error={variantIndex >= 0 ? errors[`variantPricing.${variantIndex}.cost`] : undefined}
                            />

                            <Input
                                id={`variantPricing.${variantIndex}.price`}
                                label="Price"
                                type="number"
                                step="0.1"
                                min="0"
                                value={pricing?.price || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleVariantPricingChange(combo.key, "price", e.target.value)
                                }
                                error={variantIndex >= 0 ? errors[`variantPricing.${variantIndex}.price`] : undefined}
                            />

                            {pricing?.isSale && (
                                <>
                                    <Input
                                        label="Sale Price"
                                        value={pricing?.salePrice || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleVariantPricingChange(
                                                combo.key,
                                                "salePrice",
                                                e.target.value
                                            )
                                        }
                                    />
                                    {salePercentage > 0 && (
                                        <p className="text-sm text-primary font-medium">
                                            {salePercentage}% off
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </Card>
    );
};
