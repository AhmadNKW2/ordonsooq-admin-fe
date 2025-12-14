"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../../src/providers/loading-provider";
import { useBanner, useUpdateBanner } from "../../src/services/banners/hooks/use-banners";
import { BannerForm } from "./../../src/components/banners/BannerForm";
import { validateBannerForm } from "../../src/lib/validations/banner.schema";
import { ImageUploadItem } from "../../src/components/ui/image-upload";
import { BannerLanguage } from "../../src/types/banners/banner.types";

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const bannerId = Number(id);
    const router = useRouter();
    const { setShowOverlay } = useLoading();
    const { data: banner, isLoading } = useBanner(bannerId);
    const updateBanner = useUpdateBanner();

    const [image, setImage] = useState<ImageUploadItem | null>(null);
    const [link, setLink] = useState("");
    const [visible, setVisible] = useState(true);
    const [language, setLanguage] = useState<BannerLanguage>("en");
    const [formErrors, setFormErrors] = useState<any>({});

    useEffect(() => {
        if (banner && banner.data) {
            const bannerData = banner.data;
            setLink(bannerData.link || "");
            setVisible(bannerData.visible);
            if (bannerData.language) {
                setLanguage(bannerData.language as BannerLanguage);
            }
            if (bannerData.image) {
                setImage({
                    id: "existing",
                    preview: bannerData.image,
                    file: undefined,
                    type: "image",
                    order: 0,
                });
            }
        }
    }, [banner]);

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
        if (image?.file) formData.append("image", image.file);
        if (link) formData.append("link", link);
        formData.append("visible", String(visible));

        try {
            await updateBanner.mutateAsync({ id: bannerId, formData });
            router.push("/banners");
        } catch (error) {
            console.error("Failed to update banner:", error);
        }
    };

    // Show loading overlay while data is loading
    useEffect(() => {
        setShowOverlay(isLoading);
    }, [isLoading, setShowOverlay]);

    if (isLoading || !banner) {
        return null;
    }

    return (
        <BannerForm
            mode="edit"
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
            isSubmitting={updateBanner.isPending}
            submitButtonText="Update Banner"
        />
    );
};
