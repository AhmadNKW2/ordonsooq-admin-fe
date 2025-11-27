import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Select } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import {
    Attribute,
    AttributeValue,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";

interface AttributesSectionProps {
    attributes: Attribute[];
    onChange: (attributes: Attribute[], resetType?: 'pricing' | 'weight' | 'media') => void;
    availableAttributes?: Array<{ id: string; name: string; displayName: string; values: Array<{ id: string; value: string; displayValue: string }> }>;
    errors?: Record<string, string>;
}

export const AttributesSection: React.FC<AttributesSectionProps> = ({
    attributes,
    onChange,
    availableAttributes = [],
    errors = {},
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

    const handleAddValue = (attributeId: string, value: string, valueId?: string) => {
        if (!value.trim()) return;

        const updated = attributes.map((attr) => {
            if (attr.id === attributeId) {
                // Look up the actual value ID from availableAttributes if not provided
                let actualValueId = valueId;
                if (!actualValueId) {
                    const availableAttr = availableAttributes.find(a => a.id === attributeId);
                    const availableValue = availableAttr?.values.find(v => v.value === value.trim());
                    actualValueId = availableValue?.id;
                }
                
                // If we still don't have an ID, skip adding this value
                if (!actualValueId) {
                    console.warn('Could not find value ID for:', value);
                    return attr;
                }

                const newValue: AttributeValue = {
                    id: actualValueId,
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
        // Find the attribute being toggled
        const attr = attributes.find(a => a.id === attributeId);
        if (!attr) return;

        // Determine if we're turning ON a control (false -> true)
        let isTogglingOn = false;
        if (controlType === "pricing" && !attr.controlsPricing) {
            isTogglingOn = true;
        } else if (controlType === "weightDimensions" && !attr.controlsWeightDimensions) {
            isTogglingOn = true;
        } else if (controlType === "media" && !attr.controlsMedia) {
            isTogglingOn = true;
        }

        const updated = attributes.map((a) => {
            if (a.id === attributeId) {
                return {
                    ...a,
                    controlsPricing:
                        controlType === "pricing"
                            ? !a.controlsPricing
                            : a.controlsPricing,
                    controlsWeightDimensions:
                        controlType === "weightDimensions"
                            ? !a.controlsWeightDimensions
                            : a.controlsWeightDimensions,
                    controlsMedia:
                        controlType === "media" ? !a.controlsMedia : a.controlsMedia,
                };
            }
            return a;
        });

        // Pass reset type when toggling ON
        const resetType = isTogglingOn 
            ? (controlType === "pricing" ? "pricing" : controlType === "weightDimensions" ? "weight" : "media")
            : undefined;
        
        onChange(updated, resetType);
    };

    const totalCombinations = calculateCombinations();

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Attributes Configuration
                    </h2>
                    {errors['attributes'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['attributes']}</p>
                    )}
                </div>
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
                    <Select
                        label="Select Attribute"
                        value={selectedPredefined}
                        onChange={(value) => {
                            setSelectedPredefined(value as string);
                        }}
                        options={[
                            ...availableAttributes
                                .filter(attr => !attributes.some(a => a.id === attr.id)) // Filter out already added attributes
                                .map((attr) => ({
                                    value: attr.id,
                                    label: `${attr.name} (${attr.displayName})`,
                                })),
                        ]}
                        search={true}
                    />

                <div className="flex items-end">
                    <Button
                        onClick={handleAddAttribute}
                        disabled={!selectedPredefined}
                        className="bg-fourth hover:bg-fourth/90"
                    >
                        Add Attribute
                    </Button>
                </div>
            </div>

            {attributes.length > 0 && (
                <div className="flex flex-col gap-5">
                    {attributes.map((attribute, index) => {
                        const availableAttr = availableAttributes.find(a => a.id === attribute.id);
                        
                        return (
                            <AttributeCard
                                key={attribute.id}
                                attribute={attribute}
                                index={index}
                                totalAttributes={attributes.length}
                                onAddValue={handleAddValue}
                                onRemoveValue={handleRemoveValue}
                                onRemove={handleRemoveAttribute}
                                onToggleControl={handleToggleControl}
                                availableAttr={availableAttr}
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
    onAddValue: (attributeId: string, value: string, valueId?: string) => void;
    onRemoveValue: (attributeId: string, valueId: string) => void;
    onRemove: (attributeId: string) => void;
    onToggleControl: (
        attributeId: string,
        controlType: "pricing" | "weightDimensions" | "media"
    ) => void;
    availableAttr?: { id: string; name: string; displayName: string; values: Array<{ id: string; value: string; displayValue: string }> };
}

const AttributeCard: React.FC<AttributeCardProps> = ({
    attribute,
    index,
    totalAttributes,
    onAddValue,
    onRemoveValue,
    onRemove,
    onToggleControl,
    availableAttr,
}) => {
    const selectedValues = attribute.values.map(v => v.value);
    const availableValues = availableAttr?.values.map(v => v.value) || [];

    const handleValuesChange = (values: string | string[]) => {
        const newValues = Array.isArray(values) ? values : [values];
        const currentValues = attribute.values.map(v => v.value);
        
        // Find added values
        const addedValues = newValues.filter(v => !currentValues.includes(v));
        // Find removed values
        const removedValues = currentValues.filter(v => !newValues.includes(v));
        
        // Add new values with their proper IDs from availableAttr
        addedValues.forEach(value => {
            const valueObj = availableAttr?.values.find(v => v.value === value);
            onAddValue(attribute.id, value, valueObj?.id);
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
                    <div className="flex justify-center items-center gap-5">
                        <h4 className="text-lg font-semibold text-gray-900">
                            {attribute.name}
                        </h4>
                        <h4 className="text-lg text-gray-500">
                            {attribute.values.length} value(s)
                        </h4>
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
                    <div className="flex-1">
                        <Select
                            label="Select Values"
                            value={selectedValues}
                            onChange={handleValuesChange}
                            options={availableValues.map((val) => ({
                                value: val,
                                label: val,
                            }))}
                            search={true}
                            multiple={true}
                        />
                    </div>
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
