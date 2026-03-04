"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../../src/providers/loading-provider";
import { useTag, useLinkConcept, useUnlinkConcept, useDeleteTag } from "../../src/services/tags/hooks/use-tags";
import type { Concept } from "../../src/services/tags/types/tag.types";
import { PageHeader } from "../../src/components/common/PageHeader";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Badge } from "../../src/components/ui/badge";
import { IconButton } from "../../src/components/ui/icon-button";
import { EmptyState } from "../../src/components/common/EmptyState";
import { DeleteConfirmationModal } from "../../src/components/common/DeleteConfirmationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../src/components/ui/table";
import { Tag as TagIcon, Link2, Unlink } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export default function TagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tagId = Number(id);
  const router = useRouter();
  const { setShowOverlay } = useLoading();

  const { data: tag, isLoading, isError, error, refetch } = useTag(tagId);
  const linkConcept = useLinkConcept();
  const unlinkConcept = useUnlinkConcept();
  const deleteTag = useDeleteTag();

  const [conceptIdInput, setConceptIdInput] = useState("");
  const [conceptToUnlink, setConceptToUnlink] = useState<Concept | null>(null);
  const [showDeleteTag, setShowDeleteTag] = useState(false);

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  const handleLinkConcept = async () => {
    const trimmed = conceptIdInput.trim();
    if (!trimmed) return;
    await linkConcept.mutateAsync({ tagId, data: { concept_id: trimmed } });
    setConceptIdInput("");
  };

  const handleUnlinkConfirm = async () => {
    if (!conceptToUnlink) return;
    await unlinkConcept.mutateAsync({ tagId, conceptId: conceptToUnlink.id });
    setConceptToUnlink(null);
  };

  const handleDeleteTag = async () => {
    await deleteTag.mutateAsync(tagId);
    router.push("/tags");
  };

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<TagIcon />}
          title="Tag not found"
          description={(error as any)?.message || "This tag does not exist."}
        />
        <div className="flex justify-center mt-4">
          <Button onClick={() => router.push("/tags")} color="var(--color-primary)">
            Back to Tags
          </Button>
        </div>
      </div>
    );
  }

  if (!tag) return null;

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      <PageHeader
        icon={<TagIcon />}
        title={`Tag: ${tag.name}`}
        description={`ID #${tag.id} — ${tag.concepts.length} linked concept(s)`}
        cancelAction={{
          label: "Back",
          onClick: () => router.push("/tags"),
        }}
      />

      {/* Tag info */}
      <Card className="max-w-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tag name</p>
            <p className="text-xl font-semibold">{tag.name}</p>
          </div>
          <IconButton
            variant="delete"
            title="Delete tag"
            onClick={() => setShowDeleteTag(true)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Created: {new Date(tag.created_at).toLocaleDateString()}
        </p>
      </Card>

      {/* Link a concept */}
      <Card className="max-w-lg">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4" /> Link Existing Concept
        </h2>
        <p className="text-sm text-muted-foreground">
          Paste the UUID of an existing concept to link it to this tag.
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Concept UUID"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={conceptIdInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConceptIdInput(e.target.value)}
            />
          </div>
          <div className="pt-6">
            <Button
              onClick={handleLinkConcept}
              disabled={!conceptIdInput.trim() || linkConcept.isPending}
              color="var(--color-primary)"
            >
              Link
            </Button>
          </div>
        </div>
      </Card>

      {/* Linked concepts */}
      <Card>
        <h2 className="text-xl font-semibold">Linked Concepts ({tag.concepts.length})</h2>
        {tag.concepts.length === 0 ? (
          <EmptyState
            icon={<TagIcon />}
            title="No concepts linked"
            description="Link an existing concept above, or go to Search Concepts to create and approve one."
          />
        ) : (
          <div className="rounded-r1 overflow-hidden border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>EN Terms</TableHead>
                  <TableHead>AR Terms</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tag.concepts.map((concept: Concept) => (
                  <TableRow key={concept.id} className="hover:bg-primary/5">
                    <TableCell className="font-mono text-sm">{concept.concept_key}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[concept.status] ?? "default"}>
                        {concept.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={concept.source === "ai" ? "primary" : "secondary"}>
                        {concept.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{concept.terms_en.join(", ")}</p>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{concept.terms_ar.join("، ")}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <IconButton
                          variant="view"
                          title="View concept"
                          onClick={() => router.push(`/search-concepts/${concept.id}`)}
                        />
                        <IconButton
                          variant="delete"
                          title="Unlink concept"
                          onClick={() => setConceptToUnlink(concept)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Unlink confirmation */}
      <DeleteConfirmationModal
        isOpen={!!conceptToUnlink}
        onClose={() => setConceptToUnlink(null)}
        onConfirm={handleUnlinkConfirm}
        title="Unlink Concept"
        message={`Remove concept "${conceptToUnlink?.concept_key}" from tag "${tag.name}"? The concept itself is not deleted.`}
        confirmText="Unlink"
        confirmVariant="danger"
        isLoading={unlinkConcept.isPending}
      />

      {/* Delete tag confirmation */}
      <DeleteConfirmationModal
        isOpen={showDeleteTag}
        onClose={() => setShowDeleteTag(false)}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message={`Permanently delete tag "${tag.name}"? It will be removed from all products and its concept links will be cleared.`}
        isLoading={deleteTag.isPending}
      />
    </div>
  );
}
