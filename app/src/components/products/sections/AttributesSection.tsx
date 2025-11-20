import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Select } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { SimpleFieldWrapper } from "../SimpleFieldWrapper";
import {
    Attribute,
    AttributeValue,
    PREDEFINED_ATTRIBUTES,
    PREDEFINED_ATTRIBUTE_VALUES,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";

interface AttributesSectionProps {
    attributes: Attribute[];
    onChange: (attributes: Attribute[]) => void;
    availableAttributes?: Array<{ id: string; name: string; displayName: string; values: Array<{ id: string; value: string; displayValue: string }> }>;
}

export const AttributesSection: React.FC<AttributesSectionProps> = ({
    attributes,
    onChange,
    availableAttributes = [],
}) => {
    const [selectedPredefined, setSelectedPredefined] = useState<string>("");

    // Calculate total combinations
    const calculateCombinations = () => {
        if (attributes.length === 0) return 0;
        return attributes.reduce((total, attr) => {
            const valueCount = attr.values.length;
            return valueCount > 0 ? total * valueCount : total;
        }, 1);
    };

    const handleAddAttribute = () => {
        const attributeId = selectedPredefined;
        if (!attributeId) return;

        // Find the attribute from available attributes
        const selectedAttr = availableAttributes.find(a => a.id === attributeId);
        if (!selectedAttr) return;

        const newAttribute: Attribute = {
            id: selectedAttr.id,
            name: selectedAttr.name,
            values: [], // Values will be added by user
            order: attributes.length,
            controlsPricing: false,
            controlsWeightDimensions: false,
            controlsMedia: false,
        };

        onChange([...attributes, newAttribute]);
        setSelectedPredefined("");
    };

    const handleRemoveAttribute = (attributeId: string) => {
        onChange(attributes.filter((attr) => attr.id !== attributeId));
    };

    const handleAddValue = (attributeId: string, value: string) => {
        if (!value.trim()) return;

        const updated = attributes.map((attr) => {
            if (attr.id === attributeId) {
                const newValue: AttributeValue = {
                    id: `val-${Date.now()}-${Math.random()}`,
                    value: value.trim(),
                    order: attr.values.length,
                };
                return { ...attr, values: [...attr.values, newValue] };
            }
            return attr;
        });

        onChange(updated);
    };

    const handleRemoveValue = (attributeId: string, valueId: string) => {
        const updated = attributes.map((attr) => {
            if (attr.id === attributeId) {
                return {
                    ...attr,
                    values: attr.values.filter((val) => val.id !== valueId),
                };
            }
            return attr;
        });

        onChange(updated);
    };

    const handleToggleControl = (
        attributeId: string,
        controlType: "pricing" | "weightDimensions" | "media"
    ) => {
        const updated = attributes.map((attr) => {
            if (attr.id === attributeId) {
                return {
                    ...attr,
                    controlsPricing:
                        controlType === "pricing"
                            ? !attr.controlsPricing
                            : attr.controlsPricing,
                    controlsWeightDimensions:
                        controlType === "weightDimensions"
                            ? !attr.controlsWeightDimensions
                            : attr.controlsWeightDimensions,
                    controlsMedia:
                        controlType === "media" ? !attr.controlsMedia : attr.controlsMedia,
                };
            }
            return attr;
        });

        onChange(updated);
    };

    const handleMoveAttribute = (index: number, direction: "up" | "down") => {
        const newAttributes = [...attributes];
        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= newAttributes.length) return;

        [newAttributes[index], newAttributes[newIndex]] = [
            newAttributes[newIndex],
            newAttributes[index],
        ];

        onChange(newAttributes.map((attr, idx) => ({ ...attr, order: idx })));
    };

    const totalCombinations = calculateCombinations();

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                    Attributes Configuration
                </h2>
                {totalCombinations > 0 && (
                    <div className="bg-primary/10 text-fifth px-4 py-2 rounded-lg">
                        <span className="font-semibold">{totalCombinations}</span> variant
                        {totalCombinations !== 1 ? "s" : ""} will be created
                    </div>
                )}
            </div>

            <h3 className="text-base font-medium text-gray-900">
                Add Attribute
            </h3>

            <div className="flex gap-5">
                <SimpleFieldWrapper label="Select Attribute" className="flex-1">
                    <Select
                        value={selectedPredefined}
                        onChange={(value) => {
                            setSelectedPredefined(value as string);
                        }}
                        options={[
                            { value: "", label: "Choose from list..." },
                            ...availableAttributes
                                .filter(attr => !attributes.some(a => a.id === attr.id)) // Filter out already added attributes
                                .map((attr) => ({
                                    value: attr.id,
                                    label: `${attr.name} (${attr.displayName})`,
                                })),
                        ]}
                        search={true}
                    />
                </SimpleFieldWrapper>

                <div className="flex items-end">
                    <Button
                        onClick={handleAddAttribute}
                        disabled={!selectedPredefined}
                        className="bg-sixth hover:bg-sixth/90"
                    >
                        Add Attribute
                    </Button>
                </div>
            </div>

            {attributes.length > 0 && (
                <div className="flex flex-col gap-5">
                    {attributes.map((attribute, index) => {
                        const availableAttr = availableAttributes.find(a => a.id === attribute.id);
                        const availableValues = availableAttr?.values.map(v => v.value) || [];
                        
                        return (
                            <AttributeCard
                                key={attribute.id}
                                attribute={attribute}
                                index={index}
                                totalAttributes={attributes.length}
                                onAddValue={handleAddValue}
                                onRemoveValue={handleRemoveValue}
                                onRemove={handleRemoveAttribute}
                                onMove={handleMoveAttribute}
                                onToggleControl={handleToggleControl}
                                availableValues={availableValues}
                            />
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

// Attribute Card Component
interface AttributeCardProps {
    attribute: Attribute;
    index: number;
    totalAttributes: number;
    onAddValue: (attributeId: string, value: string) => void;
    onRemoveValue: (attributeId: string, valueId: string) => void;
    onRemove: (attributeId: string) => void;
    onMove: (index: number, direction: "up" | "down") => void;
    onToggleControl: (
        attributeId: string,
        controlType: "pricing" | "weightDimensions" | "media"
    ) => void;
    availableValues: string[];
}

const AttributeCard: React.FC<AttributeCardProps> = ({
    attribute,
    index,
    totalAttributes,
    onAddValue,
    onRemoveValue,
    onRemove,
    onMove,
    onToggleControl,
    availableValues,
}) => {
    const selectedValues = attribute.values.map(v => v.value);

    const handleValuesChange = (values: string | string[]) => {
        const newValues = Array.isArray(values) ? values : [values];
        const currentValues = attribute.values.map(v => v.value);
        
        // Find added values
        const addedValues = newValues.filter(v => !currentValues.includes(v));
        // Find removed values
        const removedValues = currentValues.filter(v => !newValues.includes(v));
        
        // Add new values
        addedValues.forEach(value => {
            onAddValue(attribute.id, value);
        });
        
        // Remove deselected values
        removedValues.forEach(value => {
            const valueObj = attribute.values.find(v => v.value === value);
            if (valueObj) {
                onRemoveValue(attribute.id, valueObj.id);
            }
        });
    };

    return (
        <div className="bg-white p-5 rounded-rounded1 border-2 border-primary flex flex-col gap-5">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-1">
                    <div className="flex flex-col">
                        <button
                            onClick={() => onMove(index, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            title="Move up"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={() => onMove(index, "down")}
                            disabled={index === totalAttributes - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            title="Move down"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="mr-5">
                        <h4 className="text-lg font-semibold text-gray-900">
                            {attribute.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                            {attribute.values.length} value(s)
                        </p>
                    </div>

                </div>
                <button
                    onClick={() => onRemove(attribute.id)}
                    className="text-danger hover:text-danger2"
                    title="Remove attribute"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>


            <div className="flex gap-5">
                {availableValues.length > 0 && (
                    <SimpleFieldWrapper label="Select Values" className="flex-1">
                        <Select
                            value={selectedValues}
                            onChange={handleValuesChange}
                            options={availableValues.map((val) => ({
                                value: val,
                                label: val,
                            }))}
                            search={true}
                            multiple={true}
                            placeholder="Select values..."
                        />
                    </SimpleFieldWrapper>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-700">
                    This attribute controls:
                </p>
                <div className="flex flex-wrap gap-5">
                    <Checkbox
                        checked={attribute.controlsPricing}
                        onChange={() => onToggleControl(attribute.id, "pricing")}
                        label="Pricing"
                    />
                    <Checkbox
                        checked={attribute.controlsWeightDimensions}
                        onChange={() => onToggleControl(attribute.id, "weightDimensions")}
                        label="Weight/Dimensions"
                    />
                    <Checkbox
                        checked={attribute.controlsMedia}
                        onChange={() => onToggleControl(attribute.id, "media")}
                        label="Media"
                    />
                </div>
            </div>
        </div>
    );
};
