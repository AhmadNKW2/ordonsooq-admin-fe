import React from "react";
import { Input } from "../../ui/input";
import { SimpleFieldWrapper } from "../SimpleFieldWrapper";
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
}

export const PricingSection: React.FC<PricingSectionProps> = ({
    pricingType,
    attributes,
    singlePricing,
    variantPricing,
    onChangeSingle,
    onChangeVariant,
    calculateSalePercentage,
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
        const numValue = parseFloat(value) || 0;
        const updated: SinglePricing = {
            ...singlePricing,
            cost: singlePricing?.cost || 0,
            price: singlePricing?.price || 0,
            [field]: numValue,
        };

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
        const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;

        const updated: VariantPricing = {
            key,
            attributeValues: combo.attributeValues,
            cost: existing?.cost || 0,
            price: existing?.price || 0,
            isSale: existing?.isSale || false,
            salePrice: existing?.salePrice,
            [field]: numValue,
        };

        const newVariantPricing = variantPricing.filter((vp) => vp.key !== key);
        onChangeVariant([...newVariantPricing, updated]);
    };

    const getVariantPricing = (key: string): VariantPricing | undefined => {
        return variantPricing.find((vp) => vp.key === key);
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
                                    cost: singlePricing?.cost || 0,
                                    price: singlePricing?.price || 0,
                                    isSale: checked,
                                };
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
                    <SimpleFieldWrapper label="Cost" required>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={singlePricing?.cost || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleSinglePricingChange("cost", e.target.value)
                            }
                            placeholder="0.00"
                        />
                    </SimpleFieldWrapper>

                    <SimpleFieldWrapper label="Price" required>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={singlePricing?.price || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleSinglePricingChange("price", e.target.value)
                            }
                            placeholder="0.00"
                        />
                    </SimpleFieldWrapper>

                    {singlePricing?.isSale && (
                        <SimpleFieldWrapper label="Sale Price">
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={singlePricing?.salePrice || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleSinglePricingChange("salePrice", e.target.value)
                                }
                                placeholder="0.00"
                            />
                            {salePercentage > 0 && (
                                <p className="text-sm text-primary font-medium">
                                    {salePercentage}% off
                                </p>
                            )}
                        </SimpleFieldWrapper>
                    )}
                </div>
            </Card >
        );
    }

    // Variant pricing
    const combinations = generatePricingCombinations();

    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-900">
                Pricing Configuration - Variant Based
            </h2>

            <p className="text-sm text-gray-600">
                Configure pricing for each variant combination based on{" "}
                <strong>{pricingAttributes.map((a) => a.name).join(", ")}</strong>
            </p>

            <div className="space-y-4">
                {combinations.map((combo) => {
                    const pricing = getVariantPricing(combo.key);
                    const salePercentage = calculateSalePercentage(
                        pricing?.price || 0,
                        pricing?.salePrice
                    );

                    return (
                        <div
                            key={combo.key}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                            <h4 className="font-medium text-gray-900">{combo.label}</h4>

                            <div className="grid grid-cols-3 gap-5">
                                <SimpleFieldWrapper label="Cost" required>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={pricing?.cost || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleVariantPricingChange(combo.key, "cost", e.target.value)
                                        }
                                        placeholder="0.00"
                                    />
                                </SimpleFieldWrapper>

                                <SimpleFieldWrapper label="Price" required>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={pricing?.price || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleVariantPricingChange(combo.key, "price", e.target.value)
                                        }
                                        placeholder="0.00"
                                    />
                                </SimpleFieldWrapper>

                                <SimpleFieldWrapper label="Sale Price">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={pricing?.isSale || false}
                                                onChange={(checked) =>
                                                    handleVariantPricingChange(combo.key, "isSale", checked)
                                                }
                                                label="On Sale"
                                            />
                                        </div>
                                        {pricing?.isSale && (
                                            <>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={pricing?.salePrice || ""}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        handleVariantPricingChange(
                                                            combo.key,
                                                            "salePrice",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                />
                                                {salePercentage > 0 && (
                                                    <p className="text-sm text-primary font-medium">
                                                        {salePercentage}% off
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </SimpleFieldWrapper>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
