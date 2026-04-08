import React from "react";
import { Input } from "../../ui/input";
import { WeightDimensions } from "../../../services/products/types/product-form.types";
import { Card } from "@/components/ui/card";

interface WeightDimensionsProps {
    weightDimensions?: WeightDimensions;
    onChange: (data: WeightDimensions) => void;
    errors?: Record<string, string | boolean>;
}

export function WeightDimensionsSection({
    weightDimensions,
    onChange,
    errors,
}: WeightDimensionsProps) {
    const handleFieldChange = (field: keyof WeightDimensions, value: number | undefined | string) => {
        onChange({
            weight: weightDimensions?.weight,
            length: weightDimensions?.length,
            width: weightDimensions?.width,
            height: weightDimensions?.height,
            unit: weightDimensions?.unit || "cm",
            [field]: value
        });
    };

    return (
        <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">
                Weight & Dimensions (Optional)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={weightDimensions?.weight ?? ""}
                        onChange={(e) => handleFieldChange("weight", parseFloat(e.target.value) || undefined)}
                        placeholder="0.00"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Length (cm)</label>
                    <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={weightDimensions?.length ?? ""}
                        onChange={(e) => handleFieldChange("length", parseFloat(e.target.value) || undefined)}
                        placeholder="0.0"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Width (cm)</label>
                    <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={weightDimensions?.width ?? ""}
                        onChange={(e) => handleFieldChange("width", parseFloat(e.target.value) || undefined)}
                        placeholder="0.0"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Height (cm)</label>
                    <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={weightDimensions?.height ?? ""}
                        onChange={(e) => handleFieldChange("height", parseFloat(e.target.value) || undefined)}
                        placeholder="0.0"
                    />
                </div>
            </div>
        </Card>
    );
}
