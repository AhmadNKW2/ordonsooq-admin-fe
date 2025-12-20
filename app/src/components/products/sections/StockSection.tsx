import React, { useState, useEffect, useRef } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Trash2 } from "lucide-react";
import { Checkbox } from "../../ui/checkbox";
import {
    Attribute,
    VariantCombination,
} from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../../ui/table";

interface StockSectionProps {
    attributes: Attribute[];
    variants: VariantCombination[];
    onChange: (variants: VariantCombination[]) => void;
    errors: Record<string, string | boolean>;
}

// Stat Card Component
interface StatCardProps {
    label: string;
    value: number;
    valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, valueClassName = "" }) => (
    <Card variant="nested">
        <p className="text-sm ">{label}</p>
        <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
    </Card>
);

// Stock Status Helper
const getStockStatus = (stock: number): { label: string; className: string } => {
    if (stock === 0) return { label: "Out of Stock", className: "text-danger" };
    if (stock < 10) return { label: "Low Stock", className: "" };
    return { label: "In Stock", className: "text-primary" };
};

export const StockSection: React.FC<StockSectionProps> = ({
    attributes,
    variants,
    onChange,
    errors,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const prevAttributesRef = useRef<Attribute[]>([]);

    // Filter attributes that have values
    const attributesWithValues = attributes.filter(attr => attr.values && attr.values.length > 0);

    // Helper to generate combinations for a specific set of attributes
    const generateCombosForAttributes = (attrs: Attribute[]): Record<string, string>[] => {
        if (attrs.length === 0) return [{}];
        
        const attrsWithVals = attrs.filter(a => a.values.length > 0);
        if (attrsWithVals.length === 0) return [{}];

        const generate = (
            currentAttrs: Attribute[],
            current: Record<string, string> = {},
            index: number = 0
        ): Record<string, string>[] => {
            if (index === currentAttrs.length) return [current];
            
            const res: Record<string, string>[] = [];
            const attr = currentAttrs[index];
            
            for (const val of attr.values) {
                res.push(...generate(currentAttrs, { ...current, [attr.id]: val.id }, index + 1));
            }
            return res;
        };
        
        return generate(attrsWithVals);
    };

    // Generate all possible variant combinations (legacy full generation)
    const generateAllCombinations = (): VariantCombination[] => {
        if (attributesWithValues.length === 0) {
            const existing = variants.find(v => v.id === 'single');
            return [
                {
                    id: "single",
                    stock: existing?.stock ?? 0,
                    attributeValues: {},
                    active: existing?.active ?? true,
                },
            ];
        }

        const combos = generateCombosForAttributes(attributesWithValues);
        return combos.map(combo => {
            const existing = variants.find((v) => {
                return Object.entries(combo).every(
                    ([attrId, valueId]) => v.attributeValues[attrId] === valueId
                );
            });

            return {
                id: existing?.id || `variant-${Date.now()}-${Math.random()}`,
                stock: existing?.stock ?? 0,
                attributeValues: combo,
                active: existing?.active ?? true,
            };
        });
    };

    // Create a fingerprint to detect structural changes in attributes
    const attributeFingerprint = attributesWithValues
        .map(a => `${a.id}:${a.values.map(v => v.id).join(',')}`)
        .join('|');

    // Update variants when attributes change
    useEffect(() => {
        const prevAttributes = prevAttributesRef.current;
        const nextAttributes = attributesWithValues;

        // 1. Handle Empty Start or Reset
        if (variants.length === 0) {
             if (nextAttributes.length > 0) {
                 onChange(generateAllCombinations());
             }
             prevAttributesRef.current = attributes;
             return;
        }

        // If we have variants, we need to evolve them intelligently
        let nextVariants = [...variants];
        let hasChanges = false;

        // A. Handle Removals (Attributes or Values removed)
        // Filter out variants that have values not in nextAttributes
        const filteredVariants = nextVariants.filter(v => {
            return Object.entries(v.attributeValues).every(([attrId, valId]) => {
                const attr = nextAttributes.find(a => a.id === attrId);
                // If attribute is removed from list, we keep the variant for now but strip the key below
                // If attribute exists but value is gone, we remove the variant
                if (!attr) return true; 
                return attr.values.find(val => val.id === valId);
            });
        });

        if (filteredVariants.length !== nextVariants.length) {
            nextVariants = filteredVariants;
            hasChanges = true;
        }
        
        // Remove keys for removed attributes
        const cleanedVariants = nextVariants.map(v => {
            const newValues = { ...v.attributeValues };
            let changed = false;
            Object.keys(newValues).forEach(attrId => {
                if (!nextAttributes.find(a => a.id === attrId)) {
                    delete newValues[attrId];
                    changed = true;
                }
            });
            return changed ? { ...v, attributeValues: newValues } : v;
        });

        if (cleanedVariants !== nextVariants) { // This check is shallow, but map creates new array
             nextVariants = cleanedVariants;
             hasChanges = true;
        }
        
        // Deduplicate variants (e.g. if Color removed, (8GB, Black) and (8GB, White) become duplicates)
        const seen = new Set();
        const uniqueVariants: VariantCombination[] = [];
        nextVariants.forEach(v => {
            // Create a sorted key for consistent comparison
            const sortedKey = JSON.stringify(Object.entries(v.attributeValues).sort((a,b) => a[0].localeCompare(b[0])));
            if (!seen.has(sortedKey)) {
                seen.add(sortedKey);
                uniqueVariants.push(v);
            }
        });
        
        if (uniqueVariants.length !== nextVariants.length) {
            nextVariants = uniqueVariants;
            hasChanges = true;
        }

        // B. Handle New Attributes (or existing attributes that just got their first value)
        // We treat an attribute going from 0 values to >0 values as "New" for expansion purposes
        const addedAttributes = nextAttributes.filter(na => {
            const prev = prevAttributes.find(pa => pa.id === na.id);
            // It's new if it wasn't there before OR if it was there but had no values
            return !prev || (prev.values.length === 0 && na.values.length > 0);
        });
        
        for (const newAttr of addedAttributes) {
            if (newAttr.values.length === 0) continue;

            // Check if variants already have this attribute (prevents re-expansion on initial load)
            const alreadyHasAttribute = nextVariants.length > 0 && nextVariants.every(v => v.attributeValues[newAttr.id]);

            if (alreadyHasAttribute) {
                // If attribute exists, check if we need to add missing values (e.g. loaded data missing some values)
                const existingValuesInVariants = new Set(nextVariants.map(v => v.attributeValues[newAttr.id]));
                const valuesToAdd = newAttr.values.filter(v => !existingValuesInVariants.has(v.id));

                if (valuesToAdd.length > 0) {
                    hasChanges = true;
                    const otherAttrs = nextAttributes.filter(a => a.id !== newAttr.id);
                    const otherCombinations = generateCombosForAttributes(otherAttrs);
                    const newVariantsForValues: VariantCombination[] = [];

                    valuesToAdd.forEach(val => {
                        otherCombinations.forEach(combo => {
                            const existingVariant = nextVariants.find(v => 
                                Object.entries(combo).every(([k, val]) => v.attributeValues[k] === val)
                            );
                            newVariantsForValues.push({
                                id: `variant-${Date.now()}-${Math.random()}`,
                                stock: 0,
                                attributeValues: { ...combo, [newAttr.id]: val.id },
                                active: existingVariant?.active ?? true,
                            });
                        });
                    });
                    nextVariants = [...nextVariants, ...newVariantsForValues];
                }
                continue;
            }

            hasChanges = true;
            
            const expanded: VariantCombination[] = [];
            // If we have no variants (e.g. all deleted), we treat it as a single empty base to expand from
            const baseVariants = nextVariants.length > 0 ? nextVariants : [{ id: 'temp', stock: 0, attributeValues: {} }];
            
            baseVariants.forEach(v => {
                newAttr.values.forEach(val => {
                    expanded.push({
                        id: `variant-${Date.now()}-${Math.random()}`,
                        stock: v.stock || 0,
                        attributeValues: { ...v.attributeValues, [newAttr.id]: val.id },
                        active: v.active ?? true,
                    });
                });
            });
            nextVariants = expanded;
        }
        
        // C. Handle New Values (in existing attributes that already had values)
        for (const attr of nextAttributes) {
            const prevAttr = prevAttributes.find(pa => pa.id === attr.id);
            if (!prevAttr) continue; 
            
            // If it was previously empty, it was handled in step B (Expansion), so skip here
            if (prevAttr.values.length === 0) continue;

            const addedValues = attr.values.filter(v => !prevAttr.values.find(pv => pv.id === v.id));
            
            if (addedValues.length > 0) {
                hasChanges = true;
                // Generate combinations for these new values combined with other attributes
                const otherAttrs = nextAttributes.filter(a => a.id !== attr.id);
                const otherCombinations = generateCombosForAttributes(otherAttrs);
                
                const newVariantsForValues: VariantCombination[] = [];
                
                addedValues.forEach(val => {
                    otherCombinations.forEach(combo => {
                        // Find an existing variant that matches the other attributes to inherit active status
                        const existingVariant = nextVariants.find(v => 
                            Object.entries(combo).every(([k, val]) => v.attributeValues[k] === val)
                        );

                        newVariantsForValues.push({
                            id: `variant-${Date.now()}-${Math.random()}`,
                            stock: 0,
                            attributeValues: { ...combo, [attr.id]: val.id },
                            active: existingVariant?.active ?? true,
                        });
                    });
                });
                
                nextVariants = [...nextVariants, ...newVariantsForValues];
            }
        }

        // D. Fill Missing Combinations (Ensure full Cartesian product exists)
        // This handles cases where the loaded data is incomplete (e.g. missing inactive variants)
        if (nextAttributes.length > 0) {
             const allPossibleCombos = generateCombosForAttributes(nextAttributes);
             const missingCombos: VariantCombination[] = [];
             
             allPossibleCombos.forEach(combo => {
                 const exists = nextVariants.some(v => 
                     Object.entries(combo).every(([k, val]) => v.attributeValues[k] === val)
                 );
                 
                 if (!exists) {
                     missingCombos.push({
                         id: `variant-${Date.now()}-${Math.random()}`,
                         stock: 0,
                         attributeValues: combo,
                         active: false, // Default to inactive for missing combinations
                     });
                 }
             });
             
             if (missingCombos.length > 0) {
                 nextVariants = [...nextVariants, ...missingCombos];
                 hasChanges = true;
             }
        }
        
        if (hasChanges) {
            onChange(nextVariants);
        }
        
        prevAttributesRef.current = attributes;
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributeFingerprint, variants.length]);

    const getVariantLabel = (variant: VariantCombination): string => {
        if (attributesWithValues.length === 0) {
            return "Single Product";
        }

        return Object.entries(variant.attributeValues)
            .map(([attrId, valueId]) => {
                const attr = attributesWithValues.find((a) => a.id === attrId);
                const val = attr?.values.find((v) => v.id === valueId);
                return `${attr?.name}: ${val?.value}`;
            })
            .join(" / ");
    };

    const handleStockChange = (variantId: string, field: keyof VariantCombination, value: string | number) => {
        const updated = variants.map((v) => {
            if (v.id === variantId) {
                return {
                    ...v,
                    [field]: field === "stock" ? (value === '' ? 0 : (typeof value === "string" ? parseInt(value) || 0 : value)) : value,
                };
            }
            return v;
        });

        onChange(updated);
    };

    const handleToggleActive = (variantId: string, checked: boolean) => {
        const updated = variants.map((v) => {
            if (v.id === variantId) {
                return { ...v, active: checked };
            }
            return v;
        });
        onChange(updated);
    };

    const filteredCombinations = variants.filter((combo) => {
        const label = getVariantLabel(combo).toLowerCase();
        return label.includes(searchQuery.toLowerCase());
    });

    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    const lowStockCount = variants.filter((v) => v.stock > 0 && v.stock < 10).length;
    const outOfStockCount = variants.filter((v) => v.stock === 0).length;

    const showDeleteAction = variants.length > 1;

    return (
        <Card>
            <div>
                <h2 className="text-xl font-semibold ">
                    Stock Management
                </h2>
                {errors['variants'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['variants']}</p>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-5">
                <StatCard label="Total Variants" value={variants.length} />
                <StatCard label="Total Stock" value={totalStock} />
                <StatCard label="Low Stock" value={lowStockCount} valueClassName="" />
                <StatCard label="Out of Stock" value={outOfStockCount} valueClassName="text-danger" />
            </div>

            {/* Search */}
            {variants.length > 5 && (
                <Input
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                    }
                />
            )}

            {/* Variants Table */}
            <Table key={filteredCombinations.length > 0 ? 'has-data' : 'no-data'}>
                <TableHeader>
                    <TableRow isHeader>
                        <TableHead width={showDeleteAction ? "25%" : "33%"}>
                            Variant
                        </TableHead>
                        <TableHead width={showDeleteAction ? "25%" : "33%"}>
                            Current Stock
                        </TableHead>
                        <TableHead width={showDeleteAction ? "25%" : "33%"}>
                            Status
                        </TableHead>
                        {showDeleteAction && (
                            <TableHead width="25%">
                                Active
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredCombinations.map((variant) => {
                        const label = getVariantLabel(variant);
                        const variantIndex = variants.findIndex(v => v.id === variant.id);
                        const stockStatus = getStockStatus(variant.stock);

                        return (
                            <TableRow key={variant.id} className={variant.active === false ? "opacity-50 bg-gray-50" : ""}>
                                <TableCell className="font-medium">
                                    {label}
                                </TableCell>
                                <TableCell>
                                    <Input
                                        id={`variants.${variantIndex}.stock`}
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
                                        placeholder="0"
                                        size="sm"
                                        disabled={variant.active === false}
                                        error={variantIndex >= 0 ? errors[`variants.${variantIndex}.stock`] : undefined}
                                    />
                                </TableCell>
                                <TableCell className={`font-medium ${stockStatus.className}`}>
                                    {stockStatus.label}
                                </TableCell>
                                {showDeleteAction && (
                                    <TableCell>
                                        <Checkbox
                                            checked={variant.active ?? true}
                                            onChange={(checked) => handleToggleActive(variant.id, checked)}
                                        />
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {filteredCombinations.length === 0 && searchQuery && (
                <div className="text-center py-8 ">
                    No variants found matching &quot;{searchQuery}&quot;
                </div>
            )}
        </Card>
    );
};
