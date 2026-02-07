import React from "react";
import { Input } from "../../ui/input";
import {
    Attribute,
    SinglePricing,
    VariantPricing,
    VariantCombination,
} from "../../../services/products/types/product-form.types";
import { Checkbox } from "../../ui/checkbox";
import { Card } from "@/components/ui";
import {
    generateCombinations,
    getControllingAttributes,
    getVariantData,
} from "../../../services/products/utils/variant-combinations";

interface PricingSectionProps {
    attributes: Attribute[];
    variants: VariantCombination[];
    singlePricing?: SinglePricing;
    variantPricing: VariantPricing[];
    onChangeSingle: (pricing: SinglePricing) => void;
    onChangeVariant: (pricing: VariantPricing[]) => void;
    calculateSalePercentage: (price: number, salePrice?: number) => number;
    errors?: Record<string, string | boolean>;
}

// Helper component for pricing inputs grid
interface PricingInputsProps {
    cost: number | undefined;
    price: number | undefined;
    salePrice: number | undefined;
    isSale: boolean;
    salePercentage: number;
    onCostChange: (value: string) => void;
    onPriceChange: (value: string) => void;
    onSalePriceChange: (value: string) => void;
    costError?: string | boolean;
    priceError?: string | boolean;
    salePriceError?: string | boolean;
    idPrefix: string;
}

const PricingInputs: React.FC<PricingInputsProps> = ({
    cost,
    price,
    salePrice,
    isSale,
    salePercentage,
    onCostChange,
    onPriceChange,
    onSalePriceChange,
    costError,
    priceError,
    salePriceError,
    idPrefix,
}) => (
    <div className="grid grid-cols-3 gap-5">
        <Input
            id={`${idPrefix}.cost`}
            label="Cost"
            type="number"
            step="0.1"
            min="0"
            value={cost || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCostChange(e.target.value)}
            error={costError}
        />
        <Input
            id={`${idPrefix}.price`}
            label="Price"
            type="number"
            step="0.1"
            min="0"
            value={price || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPriceChange(e.target.value)}
            error={priceError}
        />
        {isSale && (
            <div className="flex flex-col gap-1">
                <Input
                    id={`${idPrefix}.salePrice`}
                    label="Sale Price"
                    type="number"
                    step="0.1"
                    min="0"
                    value={salePrice || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSalePriceChange(e.target.value)}
                    error={salePriceError}
                />
                {salePercentage > 0 && (
                    <p className="text-sm text-danger text-center">
                        {salePercentage}% off
                    </p>
                )}
            </div>
        )}
    </div>
);

export const PricingSection: React.FC<PricingSectionProps> = ({
    attributes,
    variants,
    singlePricing,
    variantPricing,
    onChangeSingle,
    onChangeVariant,
    calculateSalePercentage,
    errors = {},
}) => {
    // Filter attributes that control pricing AND have values
    const pricingAttributes = getControllingAttributes(attributes, 'controlsPricing');

    // If no attributes control pricing or no attributes have values, always show single pricing
    // Update: If we have attributes but NO attributes control pricing, we show single pricing.
    // If we have attributes controlling pricing, but no combinations (no values selected), we show the "Please select..." message.
    const shouldShowSinglePricing = pricingAttributes.length === 0;

    // Generate all combinations for pricing attributes
    const allCombinations = generateCombinations(pricingAttributes);

    // Filter combinations based on valid variants
    // Fix: don't filter rigorously if variants are still initializing/empty 
    // to avoid "Please select attributes" flicker or lock
    const combinations = allCombinations.filter(combo => {
        if (!variants || variants.length === 0) return true; 

        // Check if this pricing combo is compatible with any active variant
        const isCompatibleWithVariant = variants.some(variant => {
             // If variant is inactive, ignore it? Maybe we still want to price it?
             // Assuming active check is desired:
             // if (variant.active === false) return false;
             
             // Check if variant matches the pricing combination
             // A variant matches if for every pricing-controlling attribute, it has the same value
             return Object.entries(combo.attributeValues).every(([key, value]) => {
                return variant.attributeValues?.[key] === value;
            });
        });
        
        return isCompatibleWithVariant;
    });

    // Debugging
    // console.log('[PricingSection] debug:', {
    //    totalAttrs: attributes.length,
    //    pricingAttrs: pricingAttributes.length,
    //    allCombinations: allCombinations.length,
    //    filteredCombinations: combinations.length,
    //    variantsCount: variants?.length
    // });

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
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const existing = variantPricing.find((vp) => vp.key === key);
        const numValue = typeof value === "string" ? (value === "" ? undefined : parseFloat(value)) : value;

        const updated: VariantPricing = {
            key,
            attributeValues: combo.attributeValues,
            cost: existing?.cost,
            price: existing?.price,
            isSale: existing?.isSale ?? true,
            salePrice: existing?.salePrice,
            [field]: numValue,
        } as any;

        const newVariantPricing = variantPricing.filter((vp) => vp.key !== key);
        onChangeVariant([...newVariantPricing, updated]);
    };

    // Get variant pricing using shared utility
    const getPricing = (key: string, attributeValues?: { [attrId: string]: string }): VariantPricing | undefined => {
        return getVariantData(key, variantPricing, attributeValues);
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
                        <h2 className="text-xl font-semibold ">
                            Pricing Configuration
                        </h2>
                        <Checkbox
                            checked={singlePricing?.isSale ?? true}
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
                    {attributes.length > 0 && pricingAttributes.length === 0 && (
                        <p className="text-sm ">
                            No attributes are controlling pricing. This price applies to all variants.
                        </p>
                    )}
                </div>

                <PricingInputs
                    cost={singlePricing?.cost}
                    price={singlePricing?.price}
                    salePrice={singlePricing?.salePrice}
                    isSale={singlePricing?.isSale ?? true}
                    salePercentage={salePercentage}
                    onCostChange={(value) => handleSinglePricingChange("cost", value)}
                    onPriceChange={(value) => handleSinglePricingChange("price", value)}
                    onSalePriceChange={(value) => handleSinglePricingChange("salePrice", value)}
                    costError={errors['singlePricing.cost']}
                    priceError={errors['singlePricing.price']}
                    salePriceError={errors['singlePricing.salePrice']}
                    idPrefix="singlePricing"
                />
            </Card >
        );
    }

    // Variant-based mode
    if (combinations.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold ">
                        Pricing Configuration
                    </h2>
                </div>
                <div className=" border border-gray-200 rounded-r1 p-4">
                    <p className="">
                        Please select attribute values to configure pricing.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <h2 className="text-xl font-semibold ">
                Pricing Configuration - Variant Based
            </h2>

            <p className="text-sm ">
                Configure pricing for each variant combination based on{" "}
                <strong>{pricingAttributes.map((a) => a.name).join(", ")}</strong>
            </p>

            {combinations.map((combo) => {
                const pricing = getPricing(combo.key, combo.attributeValues);
                const variantIndex = variantPricing.findIndex(vp => vp.key === combo.key);
                const salePercentage = calculateSalePercentage(
                    pricing?.price || 0,
                    pricing?.salePrice
                );

                return (
                    <Card
                        key={combo.key}
                        variant="nested"
                    >
                        <div className="flex gap-5 items-center">
                            <h4 className="font-medium ">{combo.label}</h4>
                            <Checkbox
                                checked={pricing?.isSale ?? true}
                                onChange={(checked) =>
                                    handleVariantPricingChange(combo.key, "isSale", checked)
                                }
                                label="On Sale"
                            />
                        </div>

                        <PricingInputs
                            cost={pricing?.cost}
                            price={pricing?.price}
                            salePrice={pricing?.salePrice}
                            isSale={pricing?.isSale ?? true}
                            salePercentage={salePercentage}
                            onCostChange={(value) => handleVariantPricingChange(combo.key, "cost", value)}
                            onPriceChange={(value) => handleVariantPricingChange(combo.key, "price", value)}
                            onSalePriceChange={(value) => handleVariantPricingChange(combo.key, "salePrice", value)}
                            costError={variantIndex >= 0 ? errors[`variantPricing.${variantIndex}.cost`] : undefined}
                            priceError={variantIndex >= 0 ? errors[`variantPricing.${variantIndex}.price`] : undefined}
                            salePriceError={variantIndex >= 0 ? errors[`variantPricing.${variantIndex}.salePrice`] : undefined}
                            idPrefix={`variantPricing.${variantIndex}`}
                        />
                    </Card>
                );
            })}
        </Card>
    );
};
