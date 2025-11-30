"use client";

/**
 * Create Attribute Page
 * Page for creating a new attribute
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateAttribute } from "../../src/services/attributes/hooks/use-attributes";
import { Tag, ArrowLeft, Plus, Palette, X } from "lucide-react";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Toggle } from "../../src/components/ui/toggle";
import { IconButton } from "../../src/components/ui/icon-button";
import { CreateAttributeValueDto } from "../../src/services/attributes/types/attribute.types";

// Color Picker Component
const ColorPicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}> = ({ value, onChange, onClose }) => {
  const [hexValue, setHexValue] = useState(value || "#000000");

  const handleSubmit = () => {
    onChange(hexValue);
    onClose();
  };

  return (
    <div className="absolute z-50 top-full left-0 mt-2 p-4 bg-white rounded-r1 shadow-lg border border-primary/20">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={hexValue}
            onChange={(e) => setHexValue(e.target.value)}
            className="w-12 h-12 rounded cursor-pointer border-0"
          />
          <Input
            value={hexValue}
            onChange={(e) => setHexValue(e.target.value)}
            placeholder="#000000"
            className="w-32"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>
            Apply
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// Value Input Row Component
const ValueInputRow: React.FC<{
  index: number;
  value: CreateAttributeValueDto;
  isColor: boolean;
  onChange: (index: number, field: keyof CreateAttributeValueDto, val: string) => void;
  onRemove: (index: number) => void;
}> = ({ index, value, isColor, onChange, onRemove }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-r1 border border-primary/20">
      <div className="flex-1 min-w-[150px]">
        <Input
          value={value.value_en}
          onChange={(e) => onChange(index, "value_en", e.target.value)}
          placeholder="Value (English) *"
          required
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <Input
          value={value.value_ar}
          onChange={(e) => onChange(index, "value_ar", e.target.value)}
          placeholder="Value (Arabic) *"
          dir="rtl"
          required
        />
      </div>
      {isColor && (
        <div className="relative">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: value.color_code || "#ccc" }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <Button
              type="button"
              variant="outline"
              isSquare
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </div>
          {showColorPicker && (
            <ColorPicker
              value={value.color_code || ""}
              onChange={(val) => onChange(index, "color_code", val)}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>
      )}
      <IconButton variant="delete" onClick={() => onRemove(index)} title="Remove value" />
    </div>
  );
};

export default function CreateAttributePage() {
  const router = useRouter();

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isColor, setIsColor] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [values, setValues] = useState<CreateAttributeValueDto[]>([]);

  const createAttribute = useCreateAttribute();

  const handleAddValue = () => {
    setValues([
      ...values,
      { value_en: "", value_ar: "", color_code: undefined, is_active: true },
    ]);
  };

  const handleValueChange = (
    index: number,
    field: keyof CreateAttributeValueDto,
    val: string
  ) => {
    const newValues = [...values];
    (newValues[index] as any)[field] = val;
    setValues(newValues);
  };

  const handleRemoveValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn.trim() || !nameAr.trim()) {
      alert("Please fill in both English and Arabic names");
      return;
    }

    // Filter out empty values and validate
    const validValues = values.filter((v) => v.value_en && v.value_ar);
    
    // Check if any value is missing required fields
    for (const v of values) {
      if (v.value_en || v.value_ar) {
        if (!v.value_en.trim() || !v.value_ar.trim()) {
          alert("All values must have both English and Arabic names");
          return;
        }
        if (isColor && !v.color_code?.trim()) {
          alert("All values must have a color code when the attribute is a color type");
          return;
        }
      }
    }

    try {
      await createAttribute.mutateAsync({
        name_en: nameEn,
        name_ar: nameAr,
        is_active: isActive,
        values: validValues.length > 0 ? validValues : undefined,
      });
      router.push("/attributes");
    } catch (error) {
      console.error("Failed to create attribute:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      {/* Header */}
      <div className="w-full justify-between items-center flex gap-5">
        <div className="flex items-center gap-5">
          <Button variant="outline" onClick={() => router.push("/attributes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="rounded-r1 bg-primary to-primary p-3">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Attribute</h1>
            <p className="mt-1">Add a new product attribute</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={createAttribute.isPending}>
          {createAttribute.isPending ? "Creating..." : "Create Attribute"}
        </Button>
      </div>

      {/* Attribute Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        <Card className="w-full">
          <h2 className="text-lg font-semibold">Attribute Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Name (English) *"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Enter name in English"
              required
            />
            <Input
              label="Name (Arabic) *"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="Enter name in Arabic"
              dir="rtl"
              required
            />
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Toggle checked={isColor} onChange={setIsColor} />
              <span className="text-sm font-medium">Is Color Attribute</span>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={isActive} onChange={setIsActive} />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>

          {/* Color Info Section */}
          {isColor && (
            <div className="p-4 bg-primary/5 rounded-r1 border border-primary/20">
              <p className="text-sm text-gray-600">
                This attribute will support color codes for each value. You can set
                colors when adding values below.
              </p>
            </div>
          )}
        </Card>

        {/* Initial Values */}
        <Card className="w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Initial Values (Optional)</h2>
            <Button type="button" variant="outline" onClick={handleAddValue}>
              <Plus className="h-4 w-4 mr-2" />
              Add Value
            </Button>
          </div>

          {values.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <p className="text-sm">No values added yet</p>
              <p className="text-xs">
                You can add values now or later after creating the attribute
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {values.map((value, index) => (
                <ValueInputRow
                  key={index}
                  index={index}
                  value={value}
                  isColor={isColor}
                  onChange={handleValueChange}
                  onRemove={handleRemoveValue}
                />
              ))}
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
