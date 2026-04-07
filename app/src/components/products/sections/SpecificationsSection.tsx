import React, { useState } from "react";
import { Select } from "../../ui/select";
import { Card } from "@/components/ui";
import {
    ProductSpecificationSelection,
} from "../../../services/products/types/product-form.types";

const RECENT_SPECIFICATION_KEY = "recent_specification_ids";

const getRecentSpecificationIds = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(RECENT_SPECIFICATION_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const addRecentSpecificationId = (id: string) => {
    if (typeof window === "undefined") return;
    try {
        const recent = getRecentSpecificationIds();
        const updated = [...new Set([id, ...recent])].slice(0, 10);
        localStorage.setItem(RECENT_SPECIFICATION_KEY, JSON.stringify(updated));
    } catch {
        // ignore
    }
};

const buildSpecificationOptions = (
    availableSpecification: {
        id: string;
        parentId?: string;
        parentValueId?: string;
        name: string;
        displayName: string;
        values: Array<{
            id: string;
            parentId?: string;
            value: string;
            displayValue: string;
        }>;
    } | undefined,
    allSpecifications: Array<{
        id: string;
        parentId?: string;
        parentValueId?: string;
        name: string;
        displayName: string;
        values: Array<{
            id: string;
            parentId?: string;
            value: string;
            displayValue: string;
        }>;
    }>
) => {
    if (!availableSpecification?.values) {
        return [] as Array<{ value: string; label: string }>;
    }

    const result: Array<{ value: string; label: string }> = [];
    const getParentId = (item: any) => item.parentId ?? item.parent_id;
    const getParentValueId = (item: any) => item.parentValueId ?? item.parent_value_id ?? item.parentId;

    const findDescendants = (currentSpecificationId: string, currentValueId: string, currentLabelPath: string) => {
        const childSpecifications = allSpecifications.filter(
            (item) => String(getParentId(item)) === String(currentSpecificationId)
        );

        if (childSpecifications.length === 0) {
            return [{ value: currentValueId, label: currentLabelPath }];
        }

        let hasChildrenValues = false;
        let descendants: Array<{ value: string; label: string }> = [];

        childSpecifications.forEach((childSpecification) => {
            const relevantValues = (childSpecification.values || []).filter(
                (value: any) => String(getParentValueId(value)) === String(currentValueId)
            );

            if (relevantValues.length > 0) {
                hasChildrenValues = true;
                relevantValues.forEach((childValue: any) => {
                    const label = childValue.value || childValue.value_en || childValue.val;
                    const nextPath = `${currentLabelPath} > ${label}`;
                    descendants = [
                        ...descendants,
                        ...findDescendants(childSpecification.id, childValue.id, nextPath),
                    ];
                });
            }
        });

        if (!hasChildrenValues) {
            return [{ value: currentValueId, label: currentLabelPath }];
        }

        return descendants;
    };

    availableSpecification.values.forEach((rootValue) => {
        const rootLabel = rootValue.value || (rootValue as any).value_en;
        result.push(...findDescendants(availableSpecification.id, rootValue.id, rootLabel));
    });

    const seen = new Set<string>();
    return result.filter((option) => {
        if (seen.has(option.value)) {
            return false;
        }
        seen.add(option.value);
        return true;
    });
};

interface SpecificationsSectionProps {
    specifications: ProductSpecificationSelection[];
    onChange: (specifications: ProductSpecificationSelection[]) => void;
    categoriesSelected?: boolean;
    isLoadingAvailableSpecifications?: boolean;
    availableSpecifications?: Array<{
        id: string;
        parentId?: string;
        parentValueId?: string;
        name: string;
        displayName: string;
        values: Array<{
            id: string;
            parentId?: string;
            value: string;
            displayValue: string;
        }>;
    }>;
    errors?: Record<string, string | boolean>;
}

export const SpecificationsSection: React.FC<SpecificationsSectionProps> = ({
    specifications,
    onChange,
    categoriesSelected = false,
    isLoadingAvailableSpecifications = false,
    availableSpecifications = [],
    errors = {},
}) => {
    const [recentSpecificationIds, setRecentSpecificationIds] = useState<string[]>(() => getRecentSpecificationIds());
    const eligibleSpecifications = React.useMemo(
        () => availableSpecifications.filter((item) => !item.parentId),
        [availableSpecifications]
    );

    const handleSpecificationsSelectChange = (values: string | string[]) => {
        const selectedIds = Array.isArray(values) ? values : [values];
        const nextSpecifications: ProductSpecificationSelection[] = [];

        for (const specificationId of selectedIds) {
            const existingSpecification = specifications.find((item) => item.id === specificationId);
            if (existingSpecification) {
                nextSpecifications.push(existingSpecification);
                continue;
            }

            const selectedSpecification = availableSpecifications.find((item) => item.id === specificationId);
            if (!selectedSpecification) {
                continue;
            }

            addRecentSpecificationId(specificationId);
            nextSpecifications.push({
                id: selectedSpecification.id,
                name: selectedSpecification.name,
                values: [],
                order: nextSpecifications.length,
            });
        }

        nextSpecifications.forEach((item, index) => {
            item.order = index;
        });

        onChange(nextSpecifications);
    };

    const handleRemoveSpecification = (specificationId: string) => {
        onChange(specifications.filter((item) => item.id !== specificationId));
    };

    const handleUpdateValues = (specificationId: string, selectedIds: string[], options: Array<{ value: string; label: string }>) => {
        onChange(
            specifications.map((item) => {
                if (item.id !== specificationId) {
                    return item;
                }

                const values = selectedIds.map((selectedId, index) => {
                    const existingValue = item.values.find((value) => value.id === selectedId);
                    if (existingValue) {
                        return { ...existingValue, order: index };
                    }

                    const option = options.find((candidate) => candidate.value === selectedId);
                    return {
                        id: selectedId,
                        label: option?.label || selectedId,
                        order: index,
                    };
                });

                return {
                    ...item,
                    values,
                };
            })
        );
    };

    return (
        <Card id="specifications">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold ">
                        Specifications
                    </h2>
                    {errors["specifications"] && (
                        <p className="text-sm text-red-500 mt-1">{errors["specifications"]}</p>
                    )}
                </div>
                {specifications.length > 0 && (
                    <div className="text-primary rounded-r1">
                        <span className="font-semibold">{specifications.length}</span> specification
                        {specifications.length !== 1 ? "s" : ""} selected
                    </div>
                )}
            </div>

            <div className="flex gap-5">
                <div className="flex-1">
                    <Select
                        label="Select Specifications"
                        value={specifications.map((item) => item.id)}
                        onChange={handleSpecificationsSelectChange}
                        options={(() => {
                            const eligible = eligibleSpecifications;
                            const recent = eligible.filter((item) => recentSpecificationIds.includes(item.id));
                            const rest = eligible.filter((item) => !recentSpecificationIds.includes(item.id));
                            recent.sort((left, right) => recentSpecificationIds.indexOf(left.id) - recentSpecificationIds.indexOf(right.id));

                            return [
                                ...recent.map((item) => ({
                                    value: item.id,
                                    label: `${item.name} (${item.displayName})`,
                                    group: "Recently Used",
                                })),
                                ...rest.map((item) => ({
                                    value: item.id,
                                    label: `${item.name} (${item.displayName})`,
                                    group: recent.length > 0 ? "All Specifications" : undefined,
                                })),
                            ];
                        })()}
                        search={true}
                        multiple={true}
                        disabled={!categoriesSelected || isLoadingAvailableSpecifications || eligibleSpecifications.length === 0}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                setRecentSpecificationIds(getRecentSpecificationIds());
                            }
                        }}
                    />
                    {!categoriesSelected && (
                        <p className="mt-2 text-sm text-gray-500">
                            Select at least one category to load specification options.
                        </p>
                    )}
                    {categoriesSelected && isLoadingAvailableSpecifications && (
                        <p className="mt-2 text-sm text-gray-500">
                            Loading specifications for the selected categories...
                        </p>
                    )}
                    {categoriesSelected && !isLoadingAvailableSpecifications && eligibleSpecifications.length === 0 && (
                        <p className="mt-2 text-sm text-gray-500">
                            No specifications are available for the selected categories.
                        </p>
                    )}
                </div>
            </div>

            {specifications.length > 0 && (
                <div className="flex flex-col gap-5">
                    {specifications.map((specification) => {
                        const availableSpecification = availableSpecifications.find((item) => item.id === specification.id);
                        const selectedValues = specification.values.map((value) => value.id);
                        const options = buildSpecificationOptions(availableSpecification, availableSpecifications);

                        return (
                            <Card key={specification.id} variant="nested">
                                <div className="flex items-start justify-between">
                                    <div className="flex justify-center items-center gap-5">
                                        <h4 className="text-lg font-semibold ">
                                            {specification.name}
                                        </h4>
                                        <h4 className="text-lg ">
                                            {specification.values.length} value(s)
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveSpecification(specification.id)}
                                        className="text-danger hover:text-danger2"
                                        title="Remove specification"
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

                                {options.length > 0 && (
                                    <div className="flex gap-5">
                                        <div className="flex-1">
                                            <Select
                                                label="Select Value"
                                                value={selectedValues[0] || ""}
                                                onChange={(values) => {
                                                    const normalized = Array.isArray(values) ? values : [values];
                                                    handleUpdateValues(specification.id, normalized, options);
                                                }}
                                                options={options}
                                                search={true}
                                                multiple={false}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};