"use client";

import { useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { PageHeader } from "../../src/components/common/PageHeader";
import { Tag as TagIcon } from "lucide-react";
import { useCreateTag } from "../../src/services/tags/hooks/use-tags";
import { TagForm } from "../../src/components/tags/TagForm";

export default function CreateTagPage() {
  const router = useRouter();
  const createTag = useCreateTag();

  const [name, setName] = useState("");

  const handleSubmit = async () => {
    await createTag.mutateAsync({ name: name.trim() });
    router.push("/tags");
  };

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      <PageHeader
        icon={<TagIcon />}
        title="Create Tag"
        description="Add a new product tag. AI concept suggestions will be generated automatically."
        action={{
          label: "Save",
          onClick: handleSubmit,
          disabled: !name.trim() || createTag.isPending,
        }}
        cancelAction={{
          label: "Back",
          onClick: () => router.push("/tags"),
          disabled: createTag.isPending,
        }}
      />

      <TagForm
        name={name}
        onChange={setName}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/tags")}
        isLoading={createTag.isPending}
        submitLabel="Create Tag"
      />
    </div>
  );
}
