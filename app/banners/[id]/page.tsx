"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useBanner, useUpdateBanner } from "../../src/services/banners/hooks/use-banners";
import { BannerForm } from "./../../src/components/banners/BannerForm";
import { validateBannerForm } from "../../src/lib/validations/banner.schema";
import { ImageUploadItem } from "../../src/components/ui/image-upload";

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const bannerId = Number(id);
    const router = useRouter();
    const { data: banner, isLoading } = useBanner(bannerId);
    const updateBanner = useUpdateBanner();

    const [image, setImage] = useState<ImageUploadItem | null>(null);
    const [link, setLink] = useState("");
    const [visible, setVisible] = useState(true);
    const [formErrors, setFormErrors] = useState<any>({});

    useEffect(() => {
        if (banner && banner.data) {
            const bannerData = banner.data;
            setLink(bannerData.link || "");
            setVisible(bannerData.visible);
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
            link,
            visible,
        });

        if (!validation.isValid) {
            setFormErrors(validation.errors);
            return;
        }

        const formData = new FormData();
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!banner) {
        return <div>Banner not found</div>;
    }

    return (
        <BannerForm
            mode="edit"
            image={image}
            link={link}
            visible={visible}
            onImageChange={setImage}
            onLinkChange={setLink}
            onVisibleChange={setVisible}
            formErrors={formErrors}
            onSubmit={handleSubmit}
            isSubmitting={updateBanner.isPending}
            submitButtonText="Update Banner"
        />
    );
};
