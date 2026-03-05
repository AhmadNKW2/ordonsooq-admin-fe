"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../../src/providers/loading-provider";
import {
  useConcept,
  useUpdateConcept,
  useApproveConcept,
  useRejectConcept,
  useDisableConcept,
  useDeleteConcept,
} from "../../src/services/search-concepts/hooks/use-concepts";
import { PageHeader } from "../../src/components/common/PageHeader";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Badge } from "../../src/components/ui/badge";
import { EmptyState } from "../../src/components/common/EmptyState";
import { DeleteConfirmationModal } from "../../src/components/common/DeleteConfirmationModal";
import { ConceptForm } from "../../src/components/search-concepts/ConceptForm";
import { Search, CheckCircle, XCircle, ZapOff, Trash2 } from "lucide-react";
import type { ConceptStatus } from "../../src/services/search-concepts/types/concept.types";

const STATUS_VARIANT: Record<ConceptStatus, "success" | "warning" | "danger"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export default function ConceptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setShowOverlay } = useLoading();

  const { data: concept, isLoading, isError, error } = useConcept(id);
  const updateConcept = useUpdateConcept();
  const approveConcept = useApproveConcept();
  const rejectConcept = useRejectConcept();
  const disableConcept = useDisableConcept();
  const deleteConcept = useDeleteConcept();

  const [conceptKey, setConceptKey] = useState("");
  const [conceptKeyAr, setConceptKeyAr] = useState("");
  const [termsEn, setTermsEn] = useState<string[]>([]);
  const [termsAr, setTermsAr] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  useEffect(() => {
    if (concept) {
      setConceptKey(concept.concept_key_en);
      setConceptKeyAr(concept.concept_key_ar ?? "");
      setTermsEn(concept.terms_en);
      setTermsAr(concept.terms_ar);
      setIsDirty(false);
    }
  }, [concept]);

  // Track dirtiness
  useEffect(() => {
    if (!concept) return;
    const changed =
      conceptKey !== concept.concept_key_en ||
      conceptKeyAr !== (concept.concept_key_ar ?? "") ||
      JSON.stringify(termsEn) !== JSON.stringify(concept.terms_en) ||
      JSON.stringify(termsAr) !== JSON.stringify(concept.terms_ar);
    setIsDirty(changed);
  }, [concept, conceptKey, conceptKeyAr, termsEn, termsAr]);

  const canSave =
    isDirty && conceptKey.trim().length >= 2 && termsEn.length >= 2 && termsAr.length >= 2;

  const handleSave = async () => {
    await updateConcept.mutateAsync({
      id,
      data: {
        concept_key_en: conceptKey.trim(),
        concept_key_ar: conceptKeyAr.trim() || null,
        terms_en: termsEn,
        terms_ar: termsAr,
      },
    });
    setIsDirty(false);
  };

  const handleApprove = async () => {
    await approveConcept.mutateAsync(id);
  };

  const handleReject = async () => {
    await rejectConcept.mutateAsync(id);
  };

  const handleDisableConfirm = async () => {
    await disableConcept.mutateAsync(id);
    setShowDisableModal(false);
  };

  const handleDeleteConfirm = async () => {
    await deleteConcept.mutateAsync(id);
    router.push("/search-concepts");
  };

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Search />}
          title="Concept not found"
          description={(error as any)?.message || "This concept does not exist."}
        />
        <div className="flex justify-center mt-4">
          <Button onClick={() => router.push("/search-concepts")} color="var(--color-primary)">
            Back to Concepts
          </Button>
        </div>
      </div>
    );
  }

  if (!concept) return null;

  const isAnyMutating =
    updateConcept.isPending ||
    approveConcept.isPending ||
    rejectConcept.isPending ||
    disableConcept.isPending;

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      <PageHeader
        icon={<Search />}
        title={concept.concept_key_en}
        description={`Concept · ${concept.source} · ${concept.status}`}
        cancelAction={{
          label: "Back",
          onClick: () => router.push("/search-concepts"),
          disabled: isAnyMutating,
        }}
        extraActions={
          <>
            {concept.status === "pending" && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={isAnyMutating}
                  color="var(--color-primary)"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button variant="outline" onClick={handleReject} disabled={isAnyMutating}>
                  <XCircle className="w-4 h-4 mr-1 text-red-500" />
                  Reject
                </Button>
              </>
            )}
            {concept.status === "approved" && (
              <Button
                variant="outline"
                onClick={() => setShowDisableModal(true)}
                disabled={isAnyMutating}
              >
                <ZapOff className="w-4 h-4 mr-1 text-orange-500" />
                Disable
              </Button>
            )}
            {concept.status === "rejected" && (
              <Button onClick={handleApprove} disabled={isAnyMutating} color="var(--color-primary)">
                <CheckCircle className="w-4 h-4 mr-1" />
                Re-approve
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              disabled={isAnyMutating}
            >
              <Trash2 className="w-4 h-4 mr-1 text-red-500" />
              Delete
            </Button>
          </>
        }
      />

      {/* Status + meta */}
      <Card className="max-w-2xl">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={STATUS_VARIANT[concept.status as ConceptStatus]}>{concept.status}</Badge>
          <Badge variant={concept.source === "ai" ? "primary" : "secondary"}>{concept.source}</Badge>
          {concept.typesense_synonym_id && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              Typesense: {concept.typesense_synonym_id}
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(concept.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{new Date(concept.updated_at).toLocaleString()}</dd>
          </div>
          {concept.approved_at && (
            <div>
              <dt className="text-muted-foreground">Approved at</dt>
              <dd>{new Date(concept.approved_at).toLocaleString()}</dd>
            </div>
          )}
          {concept.rejected_at && (
            <div>
              <dt className="text-muted-foreground">Rejected at</dt>
              <dd>{new Date(concept.rejected_at).toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Edit form */}
      <ConceptForm
        title="Edit Concept"
        conceptKey={conceptKey}
        onConceptKeyChange={setConceptKey}
        termsEn={termsEn}
        onTermsEnChange={setTermsEn}
        termsAr={termsAr}
        onTermsArChange={setTermsAr}
        onSubmit={handleSave}
        onDiscard={() => {
          setConceptKey(concept.concept_key_en);
          setTermsEn(concept.terms_en);
          setTermsAr(concept.terms_ar);
        }}
        isLoading={updateConcept.isPending}
        canSubmit={canSave}
        submitLabel="Save Changes"
        isDirty={isDirty}
        dirtyWarning={
          concept.status === "approved"
            ? "Saving will re-sync this synonym to Typesense and reindex affected products."
            : "You have unsaved changes."
        }
      />

      {/* Disable confirmation */}
      <DeleteConfirmationModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={handleDisableConfirm}
        title="Disable Concept"
        message={`Remove "${concept.concept_key_en}" from Typesense? The concept will be set to rejected but not deleted.`}
        confirmText="Disable"
        confirmVariant="danger"
        isLoading={disableConcept.isPending}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Concept"
        message={`Permanently delete "${concept.concept_key_en}"? If approved, its Typesense synonym will be removed first.`}
        isLoading={deleteConcept.isPending}
      />
    </div>
  );
}
