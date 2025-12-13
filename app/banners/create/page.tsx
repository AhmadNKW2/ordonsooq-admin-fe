"use client";

import { useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useCreateBanner } from "../../src/services/banners/hooks/use-banners";
import { BannerForm } from "./../../src/components/banners/BannerForm";
import { validateBannerForm } from "../../src/lib/validations/banner.schema";
import { ImageUploadItem } from "../../src/components/ui/image-upload";
import { BannerLanguage } from "../../src/types/banners/banner.types";

export default function CreateBannerPage() {
    const router = useRouter();
    const createBanner = useCreateBanner();

    const [image, setImage] = useState<ImageUploadItem | null>(null);
    const [link, setLink] = useState("");
    const [visible, setVisible] = useState(true);
    const [language, setLanguage] = useState<BannerLanguage>("en");
    const [formErrors, setFormErrors] = useState<any>({});

    const handleSubmit = async () => {
        const validation = validateBannerForm({
            image,
            language,
            link,
            visible,
        });

        if (!validation.isValid) {
            setFormErrors(validation.errors);
            return;
        }

        const formData = new FormData();
        formData.append("language", language);
        if (link) formData.append("link", link);
        if (image?.file) formData.append("image", image.file);
        formData.append("visible", String(visible));

        try {
            await createBanner.mutateAsync(formData);
            router.push("/banners");
        } catch (error) {
            console.error("Failed to create banner:", error);
        }
    };

    return (
        <BannerForm
            mode="create"
            image={image}
            link={link}
            visible={visible}
            language={language}
            onImageChange={setImage}
            onLinkChange={setLink}
            onVisibleChange={setVisible}
            onLanguageChange={setLanguage}
            formErrors={formErrors}
            onSubmit={handleSubmit}
            isSubmitting={createBanner.isPending}
            submitButtonText="Create Banner"
        />
    );
};
