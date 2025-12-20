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
    getControllingAttributes,
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
    hasAttributeControllingWeight: boolean;
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
            label="Weight (kg)"
            type="number"
            min="0"
            step="0.1"
            value={weight || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onWeightChange(e.target.value)}
            error={weightError}
        />
        <Input
            id={`${idPrefix}.length`}
            label="Length (cm)"
            type="number"
            min="0"
            step="0.1"
            value={length || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onLengthChange(e.target.value)}
            error={lengthError}
        />
        <Input
            id={`${idPrefix}.width`}
            label="Width (cm)"
            type="number"
            min="0"
            step="0.1"
            value={width || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onWidthChange(e.target.value)}
            error={widthError}
        />
        <Input
            id={`${idPrefix}.height`}
            label="Height (cm)"
            type="number"
            min="0"
            step="0.1"
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
    hasAttributeControllingWeight,
    errors,
}) => {
    // Filter attributes that control weight AND have values
    const weightAttributes = getControllingAttributes(attributes, 'controlsWeightDimensions');

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

    // Single mode (not variant-based)
    if (!isWeightVariantBased && !hasAttributeControllingWeight) {
        return (
            <Card>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold ">
                            Weight & Dimensions
                        </h2>
                    </div>
                    {hasAttributeControllingWeight && weightAttributes.length === 0 && (
                        <p className="text-sm ">
                            No attributes are controlling weight/dimensions. These values apply to all variants.
                        </p>
                    )}
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
    }

    // Variant-based mode
    if (combinations.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold ">
                        Weight & Dimensions
                    </h2>
                </div>
                <div className=" border border-gray-200 rounded-r1 p-4">
                    <p className="">
                        Please select attribute values to configure weight and dimensions.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold ">
                    Weight & Dimensions - Variant Based
                </h2>
            </div>

            <p className="text-sm ">
                Configure weight and dimensions for each variant based on{" "}
                <strong>{weightAttributes.map((a) => a.name).join(", ")}</strong>
            </p>

            {combinations.map((combo) => {
                const weight = getWeight(combo.key, combo.attributeValues);
                const variantIndex = variantWeightDimensions.findIndex(vw => vw.key === combo.key);

                return (
                    <Card
                        key={combo.key}
                        variant="nested"
                    >
                        <h4 className="font-medium ">{combo.label}</h4>

                        <WeightInputs
                            weight={weight?.weight}
                            length={weight?.length}
                            width={weight?.width}
                            height={weight?.height}
                            onWeightChange={(value) => handleVariantChange(combo.key, "weight", value)}
                            onLengthChange={(value) => handleVariantChange(combo.key, "length", value)}
                            onWidthChange={(value) => handleVariantChange(combo.key, "width", value)}
                            onHeightChange={(value) => handleVariantChange(combo.key, "height", value)}
                            weightError={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.weight`] : undefined}
                            lengthError={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.length`] : undefined}
                            widthError={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.width`] : undefined}
                            heightError={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.height`] : undefined}
                            idPrefix={`variantWeightDimensions.${variantIndex}`}
                        />
                    </Card>
                );
            })}
        </Card>
    );
};
