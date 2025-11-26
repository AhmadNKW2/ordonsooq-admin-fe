import React from "react";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Select } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { Card } from "@/components/ui";

interface BasicInformationSectionProps {
    formData: {
        nameEn?: string;
        nameAr?: string;
        categoryId?: string;
        vendorId?: string;
        shortDescriptionEn?: string;
        shortDescriptionAr?: string;
        longDescriptionEn?: string;
        longDescriptionAr?: string;
        pricingType?: "single" | "variant";
        isActive?: boolean;
    };
    errors: { [key: string]: string };
    categories: Array<{ id: string; name: string }>;
    vendors: Array<{ id: string; name: string }>;
    onChange: (field: string, value: any) => void;
}

export const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
    formData,
    errors,
    categories,
    vendors,
    onChange,
}) => {
    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-900">
                Basic Information
            </h2>

            {/* Product Names */}
            <div className="grid grid-cols-2 gap-5">
                <Input
                    id="nameEn"
                    label="Product Name (English)"
                    value={formData.nameEn || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onChange("nameEn", e.target.value)
                    }
                    error={errors.nameEn}
                />

                <Input
                    id="nameAr"
                    label="Product Name (Arabic)"
                    value={formData.nameAr || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onChange("nameAr", e.target.value)
                    }
                    dir="rtl"
                    error={errors.nameAr}
                />
            </div>

            {/* Short Descriptions */}
            <div className="grid grid-cols-2 gap-5">
                <Textarea
                    id="shortDescriptionEn"
                    label="Short Description (English)"
                    value={formData.shortDescriptionEn || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onChange("shortDescriptionEn", e.target.value)
                    }
                    rows={3}
                    error={errors.shortDescriptionEn}
                />

                <Textarea
                    id="shortDescriptionAr"
                    label="Short Description (Arabic)"
                    value={formData.shortDescriptionAr || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onChange("shortDescriptionAr", e.target.value)
                    }
                    dir="rtl"
                    rows={3}
                    error={errors.shortDescriptionAr}
                />
            </div>

            {/* Long Descriptions */}
            <div className="grid grid-cols-2 gap-5">
                <Textarea
                    id="longDescriptionEn"
                    label="Long Description (English)"
                    value={formData.longDescriptionEn || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onChange("longDescriptionEn", e.target.value)
                    }
                    rows={6}
                    error={errors.longDescriptionEn}
                />

                <Textarea
                    id="longDescriptionAr"
                    label="Long Description (Arabic)"
                    value={formData.longDescriptionAr || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onChange("longDescriptionAr", e.target.value)
                    }
                    dir="rtl"
                    rows={6}
                    error={errors.longDescriptionAr}
                />
            </div>

            {/* Category, Vendor, Pricing Type */}
            <div className="grid grid-cols-3 gap-5">
                <Select
                    id="categoryId"
                    label="Category"
                    value={formData.categoryId || ""}
                    onChange={(value) => onChange("categoryId", value as string)}
                    options={[
                        ...categories.map((category) => ({
                            value: category.id,
                            label: category.name,
                        })),
                    ]}
                    search={true}
                    error={errors.categoryId}
                />

                <Select
                    id="vendorId"
                    label="Vendor"
                    value={formData.vendorId || ""}
                    onChange={(value) => onChange("vendorId", value as string)}
                    options={[
                        ...vendors.map((vendor) => ({
                            value: vendor.id,
                            label: vendor.name,
                        })),
                    ]}
                    search={true}
                    error={errors.vendorId}
                />

                <Select
                    id="pricingType"
                    label="Pricing Type"
                    value={formData.pricingType || "single"}
                    onChange={(value) => onChange("pricingType", value as string)}
                    options={[
                        { value: "single", label: "Single Price" },
                        { value: "variant", label: "Variant Price" },
                    ]}
                    search={false}
                />
            </div>

            <Checkbox
                checked={formData.isActive ?? true}
                onChange={(checked) => onChange("isActive", checked)}
                label="Product is active"
            />
        </Card>
    );
};
