/**
 * Delete Confirmation Modal Component
 * Reusable modal for confirming delete actions
 */

"use client";

import React from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  message = "This action cannot be undone. All values associated with this field will be lost.",
  isLoading = false,
}) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-black text-xl font-semibold">Are you sure?</h2>
        <p className="text-gray-700 text-center">This action cannot be undone. All values associated with this field will be lost.</p>
        {/* Footer */}
        <div className="flex gap-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            color="var(--color-danger)"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            color="var(--color-danger)"
          >
            Delete
          </Button>
        </div>
      </Modal>
    );
  };
