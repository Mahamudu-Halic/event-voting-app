"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-purple-surface border-purple-accent/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-error" />
            </div>
            <AlertDialogTitle className="text-text-primary">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-text-secondary pt-2">
            {itemName ? (
              <>
                Are you sure you want to delete <strong className="text-text-primary">{itemName}</strong>?{" "}
                {description}
              </>
            ) : (
              description
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-purple-bg/50 border-purple-accent/30">
          <AlertDialogCancel
            onClick={onClose}
            className="border-purple-accent/30 text-text-primary hover:bg-purple-accent/20"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-error hover:bg-error/90 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for managing delete confirmation dialog state
export function useDeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = (id: string, name?: string) => {
    setItemToDelete({ id, name });
    setIsOpen(true);
  };

  const closeDeleteDialog = () => {
    if (!isDeleting) {
      setIsOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = async (deleteFn: (id: string) => Promise<void>) => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteFn(itemToDelete.id);
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setItemToDelete(null);
    }
  };

  return {
    isOpen,
    itemToDelete,
    isDeleting,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  };
}
