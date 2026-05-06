"use client";

import { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CategoryFormData } from "@/lib/validations/category";
import { toast } from "sonner";
import { createCategories } from "@/apis/events";
import { useRouter } from "next/navigation";

interface AddCategorySheetProps {
  eventId: string;
  onSuccess?: () => void;
}

interface CategoryInput {
  id: string;
  categoryName: string;
}

export function AddCategorySheet({
  eventId,
  onSuccess,
}: AddCategorySheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryInput[]>([
    { id: "1", categoryName: "" },
  ]);
  const router = useRouter();

  const addNewCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        categoryName: "",
      },
    ]);
  };

  const removeCategory = (id: string) => {
    if (categories.length > 1) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    }
  };

  const updateCategory = (
    id: string,
    field: keyof CategoryInput,
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: value } : cat)),
    );
  };

  const handleSubmit = async () => {
    // Validate all categories
    const validCategories = categories.filter(
      (cat) => cat.categoryName.trim().length >= 2,
    );

    if (validCategories.length === 0) {
      toast.error(
        "Please enter at least one valid category name (min 2 characters)",
      );
      return;
    }

    setIsSaving(true);
    try {
      const categoriesToSubmit: CategoryFormData[] = validCategories.map(
        (cat) => ({
          categoryName: cat.categoryName.trim(),
        }),
      );

      await createCategories(eventId, categoriesToSubmit);
      toast.success(`${validCategories.length} category(s) added successfully`);
      setIsOpen(false);
      setCategories([{ id: "1", categoryName: "" }]);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Error adding categories:", error);
      toast.error("Failed to add categories");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCategories([{ id: "1", categoryName: "" }]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="bg-gold-primary hover:bg-gold-dark text-text-tertiary">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-purple-surface border-purple-accent/50 overflow-y-auto">
        <SheetHeader className="space-y-2.5 pb-4">
          <SheetTitle className="text-text-primary">Add Categories</SheetTitle>
          <SheetDescription className="text-text-secondary">
            Add one or more categories for nominees in this event.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="space-y-4 p-4 bg-purple-bg/50 rounded-lg border border-purple-accent/20"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-text-primary">
                  Category {index + 1}
                </h4>
                {categories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(category.id)}
                    className="h-8 w-8 p-0 text-text-secondary hover:text-error"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Category Name */}
              <div className="space-y-2">
                <Label className="text-text-primary">Category Name *</Label>
                <Input
                  value={category.categoryName}
                  onChange={(e) =>
                    updateCategory(category.id, "categoryName", e.target.value)
                  }
                  className="bg-purple-bg border-purple-accent/30 text-text-primary"
                  placeholder="e.g., Best Actor, Best Song, etc."
                />
              </div>

              {/* Category Description */}
              {/* <div className="space-y-2">
                <Label className="text-text-primary">
                  Description
                </Label>
                <Textarea
                  value={category.categoryDescription}
                  onChange={(e) => updateCategory(category.id, 'categoryDescription', e.target.value)}
                  rows={2}
                  className="bg-purple-bg border-purple-accent/30 text-text-primary resize-none"
                  placeholder="Describe what this category is about..."
                />
              </div> */}
            </div>
          ))}

          {/* Add Another Category Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addNewCategory}
            className="w-full border-purple-accent/30 text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Category
          </Button>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-purple-accent/30 hover:text-text-primary hover:bg-purple-accent/20"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-gold-primary hover:bg-gold-dark text-text-tertiary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Save ${categories.length} Category${categories.length > 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
