import React from "react";
import { Input } from "../../ui/input";
import { Toggle } from "../../ui/toggle";
import {
    Attribute,
    WeightDimensions,
    VariantWeightDimensions,
    VariantCombination,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";
import {
    generateCombinations,
    getVariantAttributes,
    getVariantData,
} from "../../../services/products/utils/variant-combinations";

interface WeightDimensionsSectionProps {
    attributes: Attribute[];
    variants: VariantCombination[];
    isWeightVariantBased: boolean;
    singleWeightDimensions?: WeightDimensions;
    variantWeightDimensions: VariantWeightDimensions[];
    onToggleVariantBased: (value: boolean) => void;
    onChangeSingle: (data: WeightDimensions) => void;
    onChangeVariant: (data: VariantWeightDimensions[]) => void;
    hasVariantAttributes: boolean;
    errors: Record<string, string | boolean>;
}

// Helper component for weight/dimensions inputs grid
interface WeightInputsProps {
    weight: number | undefined;
    length: number | undefined;
    width: number | undefined;
    height: number | undefined;
    onWeightChange: (value: string) => void;
    onLengthChange: (value: string) => void;
    onWidthChange: (value: string) => void;
    onHeightChange: (value: string) => void;
    weightError?: string | boolean;
    lengthError?: string | boolean;
    widthError?: string | boolean;
    heightError?: string | boolean;
    idPrefix: string;
}

const WeightInputs: React.FC<WeightInputsProps> = ({
    weight,
    length,
    width,
    height,
    onWeightChange,
    onLengthChange,
    onWidthChange,
    onHeightChange,
    weightError,
    lengthError,
    widthError,
    heightError,
    idPrefix,
}) => (
    <div className="grid grid-cols-4 gap-5">
        <Input
            id={`${idPrefix}.weight`}
            label="Weight (g)"
            type="number"
            min="0"
            step="any"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={weight || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onWeightChange(e.target.value)}
            error={weightError}
        />
        <Input
            id={`${idPrefix}.length`}
            label="Length (cm)"
            type="number"
            min="0"
            step="any"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={length || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onLengthChange(e.target.value)}
            error={lengthError}
        />
        <Input
            id={`${idPrefix}.width`}
            label="Width (cm)"
            type="number"
            min="0"
            step="any"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={width || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onWidthChange(e.target.value)}
            error={widthError}
        />
        <Input
            id={`${idPrefix}.height`}
            label="Height (cm)"
            type="number"
            min="0"
            step="any"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={height || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeightChange(e.target.value)}
            error={heightError}
        />
    </div>
);

export const WeightDimensionsSection: React.FC<WeightDimensionsSectionProps> = ({
    attributes,
    variants,
    isWeightVariantBased,
    singleWeightDimensions,
    variantWeightDimensions,
    onToggleVariantBased,
    onChangeSingle,
    onChangeVariant,
    hasVariantAttributes,
    errors,
}) => {
    const weightAttributes = getVariantAttributes(attributes);

    // Generate all combinations for weight attributes
    const allCombinations = generateCombinations(weightAttributes);

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

    const handleSingleChange = (field: keyof WeightDimensions, value: string) => {
        const numValue = parseFloat(value) || undefined;
        onChangeSingle({
            ...singleWeightDimensions,
            [field]: numValue,
        });
    };

    const handleVariantChange = (
        key: string,
        field: keyof Omit<VariantWeightDimensions, "attributeValues" | "key">,
        value: string
    ) => {
        const combo = combinations.find((c) => c.key === key);
        if (!combo) return;

        const existing = variantWeightDimensions.find((vw) => vw.key === key);
        const numValue = parseFloat(value) || undefined;

        const updated: VariantWeightDimensions = {
            key,
            attributeValues: combo.attributeValues,
            weight: existing?.weight,
            length: existing?.length,
            width: existing?.width,
            height: existing?.height,
            [field]: numValue,
        };

        const newVariantWeight = variantWeightDimensions.filter((vw) => vw.key !== key);
        onChangeVariant([...newVariantWeight, updated]);
    };

    // Get variant weight using shared utility
    const getWeight = (key: string, attributeValues?: { [attrId: string]: string }): VariantWeightDimensions | undefined => {
        return getVariantData(key, variantWeightDimensions, attributeValues);
    };

    // Single mode (forced)
    return (
        <Card>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold ">
                        Weight & Dimensions
                    </h2>

                    </div>

                </div>

                <WeightInputs
                    weight={singleWeightDimensions?.weight}
                    length={singleWeightDimensions?.length}
                    width={singleWeightDimensions?.width}
                    height={singleWeightDimensions?.height}
                    onWeightChange={(value) => handleSingleChange("weight", value)}
                    onLengthChange={(value) => handleSingleChange("length", value)}
                    onWidthChange={(value) => handleSingleChange("width", value)}
                    onHeightChange={(value) => handleSingleChange("height", value)}
                    weightError={errors["singleWeightDimensions.weight"]}
                    lengthError={errors["singleWeightDimensions.length"]}
                    widthError={errors["singleWeightDimensions.width"]}
                    heightError={errors["singleWeightDimensions.height"]}
                    idPrefix="singleWeightDimensions"
                />
            </Card>
        );

};
