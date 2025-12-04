/**
 * Attribute View Modal Component
 * A modal for viewing attribute details and values
 */

"use client";

import React from "react";
import { Modal } from "../ui/modal";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Tag, Hash, Palette, List, Calendar } from "lucide-react";
import { Attribute, AttributeValue } from "../../services/attributes/types/attribute.types";

interface AttributeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribute: Attribute | null;
  onEdit?: () => void;
}

// Helper to format date
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Section Header Component
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
}> = ({ icon, title, badge }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-r1 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {badge}
  </div>
);

export const AttributeViewModal: React.FC<AttributeViewModalProps> = ({
  isOpen,
  onClose,
  attribute,
  onEdit,
}) => {
  if (!attribute) return null;

  // Check if this is a color attribute
  const isColorAttribute = attribute.is_color || attribute.values?.some((v: AttributeValue) => v.color_code);

  // Sort values by sort_order
  const sortedValues = attribute.values
    ? [...attribute.values].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-4xl max-h-[90vh] bg-white overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-primary/20 w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-r1">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{attribute.name_en}</h2>
            {attribute.name_ar && (
              <p className="text-sm text-primary/75" dir="rtl">
                {attribute.name_ar}
              </p>
            )}
          </div>
          <Badge variant={attribute.is_active ? "success" : "danger"}>
            {attribute.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button onClick={onEdit} variant="outline">
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[calc(90vh-100px)] space-y-5 pt-5">
        {/* Basic Information */}
        <Card variant="nested">
          <SectionHeader
            icon={<Hash className="h-5 w-5" />}
            title="Attribute Information"
          />

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
              <div className="flex items-center justify-start gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">ID</span>
              </div>
              <span className="text-lg font-bold">{attribute.id}</span>
            </Card>
            <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
              <div className="flex items-center justify-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Sort Order</span>
              </div>
              <span className="text-lg font-bold">{attribute.sort_order ?? "—"}</span>
            </Card>
            <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
              <div className="flex items-center justify-center gap-2">
                {isColorAttribute ? (
                  <Palette className="h-4 w-4 text-primary" />
                ) : (
                  <List className="h-4 w-4 text-primary" />
                )}
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Type</span>
              </div>
              <Badge variant="primary">
                {isColorAttribute ? "Color" : "Standard"}
              </Badge>
            </Card>
            <Card variant="nested" noFlex className="flex flex-col gap-2 justify-between items-center">
              <div className="flex items-center justify-center gap-2">
                <List className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Values</span>
              </div>
              <span className="text-lg font-bold">{sortedValues.length}</span>
            </Card>
          </div>

          {/* Timestamps */}
          {(attribute.created_at || attribute.updated_at) && (
            <Card variant="nested" noFlex className="flex justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Created</span>
                  <p className="text-sm font-medium">{formatDate(attribute.created_at)}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Last Updated</span>
                  <p className="text-sm font-medium">{formatDate(attribute.updated_at)}</p>
                </div>
              </div>
            </Card>
          )}
        </Card>

        {/* Values Table */}
        <Card variant="nested">
          <SectionHeader
            icon={<List className="h-5 w-5" />}
            title="Attribute Values"
            badge={
              <Badge variant="default">{sortedValues.length} values</Badge>
            }
          />
          {sortedValues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="font-medium text-lg text-gray-500">No values</div>
              <div className="text-sm text-gray-400">
                This attribute has no values yet
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow isHeader>
                  <TableHead width="15%">ID</TableHead>
                  <TableHead width={isColorAttribute ? "30%" : "42.5%"}>Name (EN)</TableHead>
                  <TableHead width={isColorAttribute ? "30%" : "42.5%"}>Name (AR)</TableHead>
                  {isColorAttribute && <TableHead width="25%">Color</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedValues.map((value: AttributeValue) => (
                  <TableRow key={value.id}>
                    <TableCell className="font-mono text-sm">
                      {value.sort_order}
                    </TableCell>
                    <TableCell className="font-medium">{value.value_en}</TableCell>
                    <TableCell>
                      <span dir="rtl" className="font-medium">{value.value_ar}</span>
                    </TableCell>
                    {isColorAttribute && (
                      <TableCell>
                        {value.color_code ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full border border-black/20 shadow-s1"
                              style={{ backgroundColor: value.color_code }}
                            />
                            <span className="text-sm font-mono text-gray-500">
                              {value.color_code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    )}
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


