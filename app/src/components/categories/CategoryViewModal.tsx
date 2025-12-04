"use client";

import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Category } from "../../services/categories/types/category.types";
import { Folder, Calendar } from "lucide-react";

interface CategoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onEdit: () => void;
  parentCategory?: Category | null;
}

export const CategoryViewModal: React.FC<CategoryViewModalProps> = ({
  isOpen,
  onClose,
  category,
  onEdit,
  parentCategory,
}) => {
  if (!category) return null;

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="w-full space-y-6">
        {/* Title */}
        <h2 className="text-2xl font-bold">Category Details</h2>

        {/* Header with Image */}
        <div className="flex items-start gap-4">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name_en}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
              <Folder className="w-8 h-8 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{category.name_en}</h3>
            <p className="text-sm text-gray-500">{category.name_ar}</p>
            <div className="mt-2">
              <Badge variant={category.visible ? "success" : "danger"}>
                {category.visible ? "Visible" : "Hidden"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">ID</p>
            <p className="font-semibold">{category.id}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Parent Category</p>
            <p className="font-semibold">
              {parentCategory ? parentCategory.name_en : "None (Root Category)"}
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span>Created: {formatDate(category.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Updated: {formatDate(category.updated_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit Category</Button>
        </div>
      </div>
    </Modal>
  );
};
