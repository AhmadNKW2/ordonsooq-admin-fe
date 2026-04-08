/**
 * Shared utility for generating and managing variant combinations
 * Used by Pricing, Weight/Dimensions, and Media sections
 */

import { Attribute } from "../types/product-form.types";

export interface VariantCombination {
    key: string;
    label: string;
    attributeValues: { [attrId: string]: string };
}

/**
 * Generate all combinations for the given attributes
 * @param attributes - Array of attributes to generate combinations from
 * @returns Array of variant combinations with key, label, and attributeValues
 */
export function generateCombinations(attributes: Attribute[]): VariantCombination[] {
    if (attributes.length === 0) return [];

    const generateCombos = (
        attrs: Attribute[],
        current: { [attrId: string]: string } = {},
        index: number = 0
    ): VariantCombination[] => {
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

        const results: VariantCombination[] = [];
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

    return generateCombos(attributes);
}

/**
 * Return the selected attributes that define product variants.
 */
export function getVariantAttributes(attributes: Attribute[]): Attribute[] {
    return attributes;
}

/**
 * Base variant data interface that all variant types extend
 */
export interface BaseVariantData {
    key: string;
    attributeValues: { [attrId: string]: string };
}

/**
 * Find existing variant data that best matches the given attribute values
 * 
 * @param attributeValues - The attribute values to match against
 * @param variantData - Array of existing variant data
 * @returns The best matching variant data, or undefined if no match found
 */
export function findMatchingVariantData<T extends BaseVariantData>(
    attributeValues: { [attrId: string]: string },
    variantData: T[]
): T | undefined {
    // First try exact key match
    const key = Object.values(attributeValues).join("-");
    const exactMatch = variantData.find((v) => v.key === key);
    if (exactMatch) return exactMatch;

    // Try to find a match where all current attribute values are present in existing data
    let bestMatch: T | undefined;
    let bestMatchScore = 0;

    for (const v of variantData) {
        if (!v.attributeValues) continue;

        let matchScore = 0;
        let allMatch = true;

        // Check how many attribute values match
        for (const [attrId, valueId] of Object.entries(attributeValues)) {
            if (v.attributeValues[attrId] === valueId) {
                matchScore++;
            } else if (v.attributeValues[attrId] !== undefined) {
                // Attribute exists in old data but with different value - no match
                allMatch = false;
                break;
            }
        }

        if (allMatch && matchScore > bestMatchScore) {
            bestMatchScore = matchScore;
            bestMatch = v;
        }
    }

    return bestMatch;
}

/**
 * Get variant data by key, with fallback to attribute-based matching
 * 
 * @param key - The variant key to look for
 * @param variantData - Array of existing variant data
 * @param attributeValues - Optional attribute values for fallback matching
 * @returns The matching variant data, or undefined if no match found
 */
export function getVariantData<T extends BaseVariantData>(
    key: string,
    variantData: T[],
    attributeValues?: { [attrId: string]: string }
): T | undefined {
    // First try exact key match
    const exactMatch = variantData.find((v) => v.key === key);
    if (exactMatch) return exactMatch;

    // Fall back to attribute-based matching
    if (attributeValues) {
        return findMatchingVariantData(attributeValues, variantData);
    }

    return undefined;
}
