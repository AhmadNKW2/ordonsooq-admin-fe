import React from "react";
import { Input } from "../../ui/input";
import { Toggle } from "../../ui/toggle";
import {
    Attribute,
    WeightDimensions,
    VariantWeightDimensions,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";

interface WeightDimensionsSectionProps {
    attributes: Attribute[];
    isWeightVariantBased: boolean;
    singleWeightDimensions?: WeightDimensions;
    variantWeightDimensions: VariantWeightDimensions[];
    onToggleVariantBased: (value: boolean) => void;
    onChangeSingle: (data: WeightDimensions) => void;
    onChangeVariant: (data: VariantWeightDimensions[]) => void;
    hasAttributeControllingWeight: boolean;
    errors: Record<string, string>;
}

export const WeightDimensionsSection: React.FC<WeightDimensionsSectionProps> = ({
    attributes,
    isWeightVariantBased,
    singleWeightDimensions,
    variantWeightDimensions,
    onToggleVariantBased,
    onChangeSingle,
    onChangeVariant,
    hasAttributeControllingWeight,
    errors,
}) => {
    const weightAttributes = attributes.filter((attr) => attr.controlsWeightDimensions);

    // Generate all combinations for weight attributes
    const generateWeightCombinations = (): Array<{
        key: string;
        label: string;
        attributeValues: { [attrId: string]: string };
    }> => {
        if (weightAttributes.length === 0) return [];

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

        return generateCombos(weightAttributes);
    };

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
        const combinations = generateWeightCombinations();
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

    const getVariantWeight = (key: string): VariantWeightDimensions | undefined => {
        return variantWeightDimensions.find((vw) => vw.key === key);
    };

    // Single mode (not variant-based)
    if (!isWeightVariantBased && !hasAttributeControllingWeight) {
        return (
            <Card>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Weight & Dimensions
                        </h2>
                    </div>
                    {hasAttributeControllingWeight && weightAttributes.length === 0 && (
                        <p className="text-sm text-gray-600">
                            No attributes are controlling weight/dimensions. These values apply to all variants.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-5">
                    <Input
                        id="singleWeightDimensions.weight"
                        label="Weight (kg)"
                        type="number"
                        min="0"
                        step="0.1"
                        value={singleWeightDimensions?.weight || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleSingleChange("weight", e.target.value)
                        }
                        error={errors["singleWeightDimensions.weight"]}
                    />

                    <Input
                        id="singleWeightDimensions.length"
                        label="Length (cm)"
                        type="number"
                        min="0"
                        step="0.1"
                        value={singleWeightDimensions?.length || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleSingleChange("length", e.target.value)
                        }
                        error={errors["singleWeightDimensions.length"]}
                    />

                    <Input
                        id="singleWeightDimensions.width"
                        label="Width (cm)"
                        type="number"
                        min="0"
                        step="0.1"
                        value={singleWeightDimensions?.width || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleSingleChange("width", e.target.value)
                        }
                        error={errors["singleWeightDimensions.width"]}
                    />

                    <Input
                        id="singleWeightDimensions.height"
                        label="Height (cm)"
                        type="number"
                        min="0"
                        step="0.1"
                        value={singleWeightDimensions?.height || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleSingleChange("height", e.target.value)
                        }
                        error={errors["singleWeightDimensions.height"]}
                    />
                </div>
            </Card>
        );
    }

    // Variant-based mode
    const combinations = generateWeightCombinations();

    if (combinations.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Weight & Dimensions
                    </h2>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">
                        Please select attribute values to configure weight and dimensions.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                    Weight & Dimensions - Variant Based
                </h2>
            </div>

            <p className="text-sm text-gray-600">
                Configure weight and dimensions for each variant based on{" "}
                <strong>{weightAttributes.map((a) => a.name).join(", ")}</strong>
            </p>

            {combinations.map((combo) => {
                const weight = getVariantWeight(combo.key);
                const variantIndex = variantWeightDimensions.findIndex(vw => vw.key === combo.key);

                return (
                    <div
                        key={combo.key}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                        <h4 className="font-medium text-gray-900">{combo.label}</h4>

                        <div className="grid grid-cols-4 gap-5">
                            <Input
                                id={`variantWeightDimensions.${variantIndex}.weight`}
                                label="Weight (kg)"
                                type="number"
                                min="0"
                                step="0.1"
                                value={weight?.weight || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleVariantChange(combo.key, "weight", e.target.value)
                                }
                                error={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.weight`] : undefined}
                            />

                            <Input
                                id={`variantWeightDimensions.${variantIndex}.length`}
                                label="Length (cm)"
                                type="number"
                                min="0"
                                step="0.1"
                                value={weight?.length || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleVariantChange(combo.key, "length", e.target.value)
                                }
                                error={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.length`] : undefined}
                            />

                            <Input
                                id={`variantWeightDimensions.${variantIndex}.width`}
                                label="Width (cm)"
                                type="number"
                                min="0"
                                step="0.1"
                                value={weight?.width || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleVariantChange(combo.key, "width", e.target.value)
                                }
                                error={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.width`] : undefined}
                            />

                            <Input
                                id={`variantWeightDimensions.${variantIndex}.height`}
                                label="Height (cm)"
                                type="number"
                                min="0"
                                step="0.1"
                                value={weight?.height || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleVariantChange(combo.key, "height", e.target.value)
                                }
                                error={variantIndex >= 0 ? errors[`variantWeightDimensions.${variantIndex}.height`] : undefined}
                            />
                        </div>
                    </div>
                );
            })}
        </Card>
    );
};
