import React from "react";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Select } from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { SimpleFieldWrapper } from "../SimpleFieldWrapper";
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
                <SimpleFieldWrapper
                    label="Product Name (English)"
                    required
                    error={errors.nameEn}
                >
                    <Input
                        value={formData.nameEn || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onChange("nameEn", e.target.value)
                        }
                        placeholder="Enter product name in English"
                    />
                </SimpleFieldWrapper>

                <SimpleFieldWrapper
                    label="Product Name (Arabic)"
                    required
                    error={errors.nameAr}
                >
                    <Input
                        value={formData.nameAr || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onChange("nameAr", e.target.value)
                        }
                        placeholder="أدخل اسم المنتج بالعربية"
                        dir="rtl"
                    />
                </SimpleFieldWrapper>
            </div>

            {/* Short Descriptions */}
            <div className="grid grid-cols-2 gap-5">
                <SimpleFieldWrapper
                    label="Short Description (English)"
                    error={errors.shortDescriptionEn}
                >
                    <Textarea
                        value={formData.shortDescriptionEn || ""}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            onChange("shortDescriptionEn", e.target.value)
                        }
                        placeholder="Brief description in English"
                        rows={3}
                    />
                </SimpleFieldWrapper>

                <SimpleFieldWrapper
                    label="Short Description (Arabic)"
                    error={errors.shortDescriptionAr}
                >
                    <Textarea
                        value={formData.shortDescriptionAr || ""}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            onChange("shortDescriptionAr", e.target.value)
                        }
                        placeholder="وصف موجز بالعربية"
                        dir="rtl"
                        rows={3}
                    />
                </SimpleFieldWrapper>
            </div>

            {/* Long Descriptions */}
            <div className="grid grid-cols-2 gap-5">
                <SimpleFieldWrapper
                    label="Long Description (English)"
                    error={errors.longDescriptionEn}
                >
                    <Textarea
                        value={formData.longDescriptionEn || ""}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            onChange("longDescriptionEn", e.target.value)
                        }
                        placeholder="Detailed description in English"
                        rows={6}
                    />
                </SimpleFieldWrapper>

                <SimpleFieldWrapper
                    label="Long Description (Arabic)"
                    error={errors.longDescriptionAr}
                >
                    <Textarea
                        value={formData.longDescriptionAr || ""}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            onChange("longDescriptionAr", e.target.value)
                        }
                        placeholder="وصف مفصل بالعربية"
                        dir="rtl"
                        rows={6}
                    />
                </SimpleFieldWrapper>
            </div>

            {/* Category, Vendor, Pricing Type */}
            <div className="grid grid-cols-3 gap-5">
                <SimpleFieldWrapper
                    label="Category"
                    required
                    error={errors.categoryId}
                >
                    <Select
                        value={formData.categoryId || ""}
                        onChange={(value) => onChange("categoryId", value as string)}
                        options={[
                            { value: "", label: "Select a category" },
                            ...categories.map((category) => ({
                                value: category.id,
                                label: category.name,
                            })),
                        ]}
                        search={true}
                    />
                </SimpleFieldWrapper>

                <SimpleFieldWrapper label="Vendor">
                    <Select
                        value={formData.vendorId || ""}
                        onChange={(value) => onChange("vendorId", value as string)}
                        options={[
                            { value: "", label: "Select a vendor (optional)" },
                            ...vendors.map((vendor) => ({
                                value: vendor.id,
                                label: vendor.name,
                            })),
                        ]}
                        search={true}
                    />
                </SimpleFieldWrapper>

                <SimpleFieldWrapper label="Pricing Type" required>
                    <Select
                        value={formData.pricingType || "single"}
                        onChange={(value) => onChange("pricingType", value as string)}
                        options={[
                            { value: "single", label: "Single Price" },
                            { value: "variant", label: "Variant Price" },
                        ]}
                        search={false}
                    />
                </SimpleFieldWrapper>
            </div>

            <Checkbox
                checked={formData.isActive ?? true}
                onChange={(checked) => onChange("isActive", checked)}
                label="Product is active"
            />
        </Card>
    );
};
