"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/hooks/use-loading-router";
import { useLoading } from "../src/providers/loading-provider";
import { useTags, useDeleteTag } from "../src/services/tags/hooks/use-tags";
import type { Tag } from "../src/services/tags/types/tag.types";
import { PageHeader } from "../src/components/common/PageHeader";
import { Card } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import { Badge } from "../src/components/ui/badge";
import { IconButton } from "../src/components/ui/icon-button";
import { EmptyState } from "../src/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table";
import type { PaginationData } from "../src/components/ui/pagination";
import { DeleteConfirmationModal } from "../src/components/common/DeleteConfirmationModal";
import { PAGINATION } from "../src/lib/constants";
import { Tag as TagIcon } from "lucide-react";

export default function TagsPage() {
  const router = useRouter();
  const { setShowOverlay } = useLoading();
  const [search, setSearch] = useState("");
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [page, setPage] = useState<number>(PAGINATION.defaultPage);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.defaultPageSize);

  const { data, isLoading, isError, error, refetch } = useTags({ per_page: 100 });
  const deleteTag = useDeleteTag();

  useEffect(() => {
    setShowOverlay(isLoading);
  }, [isLoading, setShowOverlay]);

  // Reset to first page when search changes
  useEffect(() => { setPage(1); }, [search]);

  const tags = (data?.items ?? []) as Tag[];

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const term = search.trim().toLowerCase();
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        String(t.id).includes(term)
    );
  }, [tags, search]);

  const paginatedTags = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTags.slice(start, start + pageSize);
  }, [filteredTags, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTags.length / pageSize));
  const paginationData: PaginationData = {
    currentPage: page,
    pageSize,
    totalItems: filteredTags.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    await deleteTag.mutateAsync(tagToDelete.id);
    setTagToDelete(null);
  };

  return (
    <div className="flex flex-col justify-center items-center gap-5 p-5">
      <PageHeader
        icon={<TagIcon />}
        title="Tags"
        description="Manage product tags and their linked synonym concepts"
        action={{
          label: "Create Tag",
          onClick: () => router.push("/tags/create"),
        }}
      />

      <Card>
        <Input
          label="Search tags"
          placeholder="Search by ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          isSearch
        />
      </Card>

      {isError ? (
        <Card>
          <EmptyState
            icon={<TagIcon />}
            title="Failed to load tags"
            description={(error as any)?.message || "Please try again."}
          />
          <div className="flex justify-center">
            <Button onClick={() => refetch()} color="var(--color-primary)">Retry</Button>
          </div>
        </Card>
      ) : filteredTags.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TagIcon />}
            title="No tags found"
            description={search ? "No tags match your search." : "Create your first tag to start organising products."}
          />
          {!search && (
            <div className="flex justify-center">
              <Button onClick={() => router.push("/tags/create")} color="var(--color-primary)">Create Tag</Button>
            </div>
          )}
        </Card>
      ) : (
        <Table
          pagination={paginationData}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        >
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Concepts</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTags.map((tag) => {
              const approved = tag.concepts.filter((c) => c.status === "approved").length;
              const pending = tag.concepts.filter((c) => c.status === "pending").length;
              return (
                <TableRow key={tag.id} className="hover:bg-primary/5 cursor-pointer" onClick={() => router.push(`/tags/${tag.id}`)}>
                  <TableCell className="font-mono text-sm text-gray-500">#{tag.id}</TableCell>
                  <TableCell className="font-semibold">{tag.name}</TableCell>
                  <TableCell>
                    <Badge variant="default">{tag.concepts.length}</Badge>
                  </TableCell>
                  <TableCell>
                    {approved > 0 ? <Badge variant="success">{approved}</Badge> : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    {pending > 0 ? <Badge variant="warning">{pending}</Badge> : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <IconButton
                        variant="view"
                        title="View tag"
                        onClick={(e) => { e?.stopPropagation(); router.push(`/tags/${tag.id}`); }}
                      />
                      <IconButton
                        variant="delete"
                        title="Delete tag"
                        onClick={(e) => { e?.stopPropagation(); setTagToDelete(tag); }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <DeleteConfirmationModal
        isOpen={!!tagToDelete}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${tagToDelete?.name}"? It will be removed from all products.`}
        isLoading={deleteTag.isPending}
      />
    </div>
  );
}
