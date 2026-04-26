"use client";

import React from "react";
import { Calendar, Hash, List, Ruler, Tag } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Modal } from "../ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Specification,
  SpecificationValue,
} from "../../services/specifications/types/specification.types";

interface SpecificationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  specification: Specification | null;
  onEdit?: () => void;
}

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DetailCard: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
    <div className="flex items-center justify-center gap-2">
      {icon}
      <span className="text-xs font-semibold text-primary uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-lg font-bold text-center">{value}</div>
  </Card>
);

export const SpecificationViewModal: React.FC<SpecificationViewModalProps> = ({
  isOpen,
  onClose,
  specification,
  onEdit,
}) => {
  if (!specification) {
    return null;
  }

  const sortedValues = [...(specification.values || [])].sort(
    (left, right) => left.sort_order - right.sort_order
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-4xl max-h-[90vh] bg-white overflow-hidden"
    >
      <div className="flex items-center justify-between pb-5 border-b border-primary/20 w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-r1">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{specification.name_en}</h2>
            <p className="text-sm text-primary/75" dir="rtl">
              {specification.name_ar}
            </p>
          </div>
          <Badge variant={specification.is_active ? "success" : "danger"}>
            {specification.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {onEdit && (
          <Button onClick={onEdit} variant="outline">
            Edit
          </Button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(90vh-100px)] space-y-5 pt-5">
        <Card variant="nested">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DetailCard
              label="ID"
              value={specification.id}
              icon={<Hash className="h-4 w-4 text-primary" />}
            />
            <DetailCard
              label="Sort Order"
              value={specification.sort_order}
              icon={<List className="h-4 w-4 text-primary" />}
            />
            <DetailCard
              label="Unit"
              value={specification.unit_en || specification.unit_ar || "—"}
              icon={<Ruler className="h-4 w-4 text-primary" />}
            />
            <DetailCard
              label="Values"
              value={sortedValues.length}
              icon={<Tag className="h-4 w-4 text-primary" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Card variant="nested" noFlex className="flex justify-between items-center">
              <span className="text-sm font-medium">List separately</span>
              <Badge variant={specification.list_separately ? "success" : "default"}>
                {specification.list_separately ? "Yes" : "No"}
              </Badge>
            </Card>
            <Card variant="nested" noFlex className="flex justify-between items-center">
              <span className="text-sm font-medium">Parent specification</span>
              <span className="font-semibold">{specification.parent_id ?? "—"}</span>
            </Card>
          </div>

          {(specification.created_at || specification.updated_at) && (
            <Card variant="nested" noFlex className="flex justify-between mt-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Created</span>
                  <p className="text-sm font-medium">{formatDate(specification.created_at)}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Last Updated</span>
                  <p className="text-sm font-medium">{formatDate(specification.updated_at)}</p>
                </div>
              </div>
            </Card>
          )}
        </Card>

        <Card variant="nested">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-r1 text-primary">
                <List className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Specification Values</h3>
            </div>
            <Badge variant="default">{sortedValues.length} values</Badge>
          </div>

          {sortedValues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="font-medium text-lg text-gray-500">No values</div>
              <div className="text-sm text-gray-400">This specification has no values yet</div>
            </div>
          ) : (
            <Table noPagination={true}>
              <TableHeader>
                <TableRow isHeader>
                  <TableHead width="15%">Order</TableHead>
                  <TableHead width="42.5%">Name (EN)</TableHead>
                  <TableHead width="42.5%">Name (AR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedValues.map((value: SpecificationValue) => (
                  <TableRow key={value.id}>
                    <TableCell className="font-mono text-sm">{value.sort_order}</TableCell>
                    <TableCell className="font-medium">{value.value_en}</TableCell>
                    <TableCell>
                      <span dir="rtl" className="font-medium">{value.value_ar}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </Modal>
  );
};