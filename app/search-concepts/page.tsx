"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../src/providers/loading-provider";
import {
  useConcepts,
  useDeleteConcept,
  useApproveConcept,
  useRejectConcept,
} from "../src/services/search-concepts/hooks/use-concepts";
import type { Concept, ConceptStatus } from "../src/services/search-concepts/types/concept.types";
import { PageHeader } from "../src/components/common/PageHeader";
import { Card } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import { Badge } from "../src/components/ui/badge";
import { IconButton } from "../src/components/ui/icon-button";
import { EmptyState } from "../src/components/common/EmptyState";
import { DeleteConfirmationModal } from "../src/components/common/DeleteConfirmationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table";
import type { PaginationData } from "../src/components/ui/pagination";
import { PAGINATION } from "../src/lib/constants";
import { Search } from "lucide-react";

const STATUS_TABS: { label: string; value: ConceptStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_VARIANT: Record<ConceptStatus, "success" | "warning" | "danger"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export default function SearchConceptsPage() {
  const router = useRouter();
  const { setShowOverlay } = useLoading();

  const [tab, setTab] = useState<ConceptStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [conceptToDelete, setConceptToDelete] = useState<Concept | null>(null);
  const [page, setPage] = useState<number>(PAGINATION.defaultPage);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.defaultPageSize);

  const params = tab === "all" ? {} : { status: tab };
  const { data, isLoading, isError, error, refetch } = useConcepts(params);

  const approveConcept = useApproveConcept();
  const rejectConcept = useRejectConcept();
  const deleteConcept = useDeleteConcept();

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  // Reset to first page when tab or search changes
  useEffect(() => { setPage(1); }, [tab, search]);

  const concepts = (data?.items ?? []) as Concept[];

  const filtered = useMemo(() => {
    if (!search.trim()) return concepts;
    const term = search.trim().toLowerCase();
    return concepts.filter(
      (c) =>
        c.concept_key.toLowerCase().includes(term) ||
        c.terms_en.some((t) => t.toLowerCase().includes(term)) ||
        c.terms_ar.some((t) => t.includes(term))
    );
  }, [concepts, search]);

  const paginatedConcepts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginationData: PaginationData = {
    currentPage: page,
    pageSize,
    totalItems: filtered.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  const handleApprove = async (c: Concept, e: React.MouseEvent) => {
    e.stopPropagation();
    await approveConcept.mutateAsync(c.id);
  };

  const handleReject = async (c: Concept, e: React.MouseEvent) => {
    e.stopPropagation();
    await rejectConcept.mutateAsync(c.id);
  };

  const handleDeleteConfirm = async () => {
    if (!conceptToDelete) return;
    await deleteConcept.mutateAsync(conceptToDelete.id);
    setConceptToDelete(null);
  };

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      <PageHeader
        icon={<Search />}
        title="Search Concepts"
        description="Review AI-generated and manual synonym groups. Approved concepts are pushed to Typesense."
        action={{
          label: "Create Concept",
          onClick: () => router.push("/search-concepts/create"),
        }}
      />

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? "solid" : "outline"}
            onClick={() => setTab(t.value)}
            color="var(--color-primary)"
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <Input
          label="Search"
          placeholder="Search by key or terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          isSearch
        />
      </Card>

      {isError ? (
        <Card>
          <EmptyState
            icon={<Search />}
            title="Failed to load concepts"
            description={(error as any)?.message || "Please try again."}
          />
          <div className="flex justify-center">
            <Button onClick={() => refetch()} color="var(--color-primary)">Retry</Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search />}
            title="No concepts found"
            description={
              search
                ? "No concepts match your search."
                : tab === "pending"
                ? "No pending concepts — great, you're all caught up!"
                : `No ${tab} concepts.`
            }
          />
        </Card>
      ) : (
        <Table
          pagination={paginationData}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>EN Terms</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedConcepts.map((concept) => (
              <TableRow
                key={concept.id}
                className="hover:bg-primary/5 cursor-pointer"
                onClick={() => router.push(`/search-concepts/${concept.id}`)}
              >
                <TableCell className="font-mono text-sm">{concept.concept_key}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[concept.status as ConceptStatus]}>{concept.status}</Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm truncate">{concept.terms_en.join(", ")}</p>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      variant="view"
                      title="View concept"
                      onClick={() => router.push(`/search-concepts/${concept.id}`)}
                    />
                    {concept.status === "pending" && (
                      <>
                        <IconButton
                          variant="check"
                          title="Approve"
                          onClick={(e) => handleApprove(concept, e!)}
                          disabled={approveConcept.isPending}
                        />
                        <IconButton
                          variant="cancel"
                          title="Reject"
                          onClick={(e) => handleReject(concept, e!)}
                          disabled={rejectConcept.isPending}
                        />
                      </>
                    )}
                    <IconButton
                      variant="delete"
                      title="Delete concept"
                      onClick={(e) => {
                        e?.stopPropagation();
                        setConceptToDelete(concept);
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DeleteConfirmationModal
        isOpen={!!conceptToDelete}
        onClose={() => setConceptToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Concept"
        message={`Permanently delete concept "${conceptToDelete?.concept_key}"? If approved, its Typesense synonym will be removed.`}
        isLoading={deleteConcept.isPending}
      />
    </div>
  );
}
