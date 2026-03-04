"use client";

import { useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { PageHeader } from "../../src/components/common/PageHeader";
import { Search } from "lucide-react";
import { useCreateConcept } from "../../src/services/search-concepts/hooks/use-concepts";
import { ConceptForm } from "../../src/components/search-concepts/ConceptForm";

export default function CreateConceptPage() {
  const router = useRouter();
  const createConcept = useCreateConcept();

  const [conceptKey, setConceptKey] = useState("");
  const [conceptKeyAr, setConceptKeyAr] = useState("");
  const [termsEn, setTermsEn] = useState<string[]>([]);
  const [termsAr, setTermsAr] = useState<string[]>([]);

  const canSubmit =
    conceptKey.trim().length >= 2 && termsEn.length >= 2 && termsAr.length >= 2;

  const handleSubmit = async () => {
    await createConcept.mutateAsync({
      concept_key: conceptKey.trim(),
      concept_key_ar: conceptKeyAr.trim() || null,
      terms_en: termsEn,
      terms_ar: termsAr,
    });
    router.push("/search-concepts");
  };

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      <PageHeader
        icon={<Search />}
        title="Create Concept"
        description="Create a manual synonym concept. It starts as pending and must be approved to go live on Typesense."
        action={{
          label: "Save",
          onClick: handleSubmit,
          disabled: !canSubmit || createConcept.isPending,
        }}
        cancelAction={{
          label: "Back",
          onClick: () => router.push("/search-concepts"),
          disabled: createConcept.isPending,
        }}
      />

      <ConceptForm
        conceptKey={conceptKey}
        onConceptKeyChange={setConceptKey}
        conceptKeyAr={conceptKeyAr}
        onConceptKeyArChange={setConceptKeyAr}
        termsEn={termsEn}
        onTermsEnChange={setTermsEn}
        termsAr={termsAr}
        onTermsArChange={setTermsAr}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/search-concepts")}
        isLoading={createConcept.isPending}
        canSubmit={canSubmit}
        submitLabel="Create Concept"
        showValidationHint
      />
    </div>
  );
}
