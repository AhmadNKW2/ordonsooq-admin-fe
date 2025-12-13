import { z } from "zod";

export const bannerFormSchema = z.object({
  image: z.any().refine((val) => val !== null, "Image is required"),
  language: z.enum(["en", "ar"], { message: "Language is required" }),
  link: z.string().optional().or(z.literal("")),
  visible: z.boolean().default(true),
});

export const validateBannerForm = (data: any) => {
  const result = bannerFormSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0].toString()] = err.message;
      }
    });
    return { isValid: false, errors };
  }
  return { isValid: true, errors: {} };
};
