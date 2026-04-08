import React from "react";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import { Card } from "@/components/ui";

interface StockSectionProps {
    quantity: number;
    lowStockThreshold: number;
    isOutOfStock: boolean;
    onChangeQuantity: (value: number) => void;
    onChangeLowStockThreshold: (value: number) => void;
    onChangeIsOutOfStock: (value: boolean) => void;
    errors?: Record<string, string | boolean>;
}

export const StockSection: React.FC<StockSectionProps> = ({
    quantity,
    lowStockThreshold,
    isOutOfStock,
    onChangeQuantity,
    onChangeLowStockThreshold,
    onChangeIsOutOfStock,
    errors = {},
}) => {
    return (
        <Card id="stock">
            <div className="flex flex-col gap-5">
                <div>
                    <h2 className="text-xl font-semibold">Stock Management</h2>
                </div>
                
                <div className="grid grid-cols-3 gap-5 items-end">
                    <Input
                        id="stock.quantity"
                        label="Quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={quantity?.toString() || "0"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeQuantity(parseInt(e.target.value) || 0)}
                        error={errors['quantity']}
                    />

                    <Input
                        id="stock.low_stock_threshold"
                        label="Low Stock Threshold"
                        type="number"
                        min="0"
                        step="1"
                        value={lowStockThreshold?.toString() || "0"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeLowStockThreshold(parseInt(e.target.value) || 0)}
                        error={errors['low_stock_threshold']}
                    />
                    
                    <div className="pb-3">
                        <Checkbox
                            checked={isOutOfStock}
                            onChange={onChangeIsOutOfStock}
                            label="Out of Stock"
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
};
