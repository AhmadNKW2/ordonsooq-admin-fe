import React from "react";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Select } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { Card } from "@/components/ui";
import { Toggle } from "@/components/ui/toggle";

interface BasicInformationSectionProps {
    formData: {
        nameEn?: string;
        nameAr?: string;
        categoryIds?: string[]; // Changed from categoryId to categoryIds
        vendorId?: string;
        brandId?: string;
        shortDescriptionEn?: string;
        shortDescriptionAr?: string;
        longDescriptionEn?: string;
        longDescriptionAr?: string;
        isActive?: boolean;
    };
    errors: Record<string, string | boolean>;
    categories: Array<{ id: string; name: string; nameEn?: string; nameAr?: string }>;
    vendors: Array<{ id: string; name: string; nameEn?: string; nameAr?: string }>;
    brands: Array<{ id: string; name: string; nameEn?: string; nameAr?: string }>;
    onChange: (field: string, value: any) => void;
}

export const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
    formData,
    errors,
    categories,
    vendors,
    brands,
    onChange,
}) => {
    return (
        <Card>
            <h2 className="text-xl font-semibold ">
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
                    isRtl
                    error={errors.nameAr}
                />

                {/* Short Descriptions */}
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
                    isRtl
                    rows={3}
                    error={errors.shortDescriptionAr}
                />

                {/* Long Descriptions */}
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
                    isRtl
                    rows={6}
                    error={errors.longDescriptionAr}
                />

                {/* Category, Vendor */}
                <Select
                    id="categoryIds"
                    label="Categories"
                    value={formData.categoryIds || []}
                    onChange={(value) => {
                        // Always ensure we send an array of category IDs
                        const categoryIds = Array.isArray(value) ? value : (value ? [value] : []);
                        onChange("categoryIds", categoryIds as string[]);
                    }}
                    options={[
                        ...categories.map((category) => ({
                            value: category.id,
                            label: category.nameEn && category.nameAr
                                ? `${category.nameEn} - ${category.nameAr}`
                                : category.name,
                        })),
                    ]}
                    search={true}
                    multiple={true}
                    error={errors.categoryIds}
                />

                <Select
                    id="vendorId"
                    label="Vendor"
                    value={formData.vendorId || ""}
                    onChange={(value) => onChange("vendorId", value as string)}
                    options={[
                        ...vendors.map((vendor) => ({
                            value: vendor.id,
                            label: vendor.nameEn && vendor.nameAr
                                ? `${vendor.nameEn} - ${vendor.nameAr}`
                                : vendor.name,
                        })),
                    ]}
                    search={true}
                    error={errors.vendorId}
                />

                <Select
                    id="brandId"
                    label="Brand"
                    value={formData.brandId || ""}
                    onChange={(value) => onChange("brandId", value as string)}
                    options={[
                        ...brands.map((brand) => ({
                            value: brand.id,
                            label: brand.nameEn && brand.nameAr
                                ? `${brand.nameEn} - ${brand.nameAr}`
                                : brand.name,
                        })),
                    ]}
                    search={true}
                    error={errors.brandId}
                />

                {/* Visibility Status */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <p className="font-medium">Visibility Status</p>
                    <Toggle checked={formData.isActive ?? true} onChange={(checked) => onChange("isActive", checked)} />
                </div>
            </div>
        </Card>
    );
};
