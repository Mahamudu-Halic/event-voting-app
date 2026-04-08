"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { ImageIcon, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createNominee,
  updateNominee,
  uploadNomineeImage,
  type CreateNomineeData,
  type Nominee,
  type NomineeWithCategory,
} from "@/apis/nominees"

interface Category {
  id: string
  category_name: string
}

interface AddNomineeSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  eventId: string
  categories: Category[]
  editingNominee?: NomineeWithCategory | null
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

export function AddNomineeSheet({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  categories,
  editingNominee,
}: AddNomineeSheetProps) {
  const [formData, setFormData] = useState<{
    nominee_name: string
    category_id: string
    imageFile: File | null
    imagePreview: string | null
  }>({
    nominee_name: "",
    category_id: categories[0]?.id || "",
    imageFile: null,
    imagePreview: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  // Reset form when opening/closing or when editingNominee changes
  const resetForm = useCallback(() => {
    if (editingNominee) {
      setFormData({
        nominee_name: editingNominee.nominee_name,
        category_id: editingNominee.category_id,
        imageFile: null,
        imagePreview: editingNominee.nominee_image_url,
      })
    } else {
      setFormData({
        nominee_name: "",
        category_id: categories[0]?.id || "",
        imageFile: null,
        imagePreview: null,
      })
    }
    setImageError(null)
  }, [editingNominee, categories])

  // Handle image upload with size validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)

    if (!file) return

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setImageError("Invalid file type. Please upload JPG, PNG, GIF, or WebP.")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > MAX_FILE_SIZE) {
      setImageError("File size exceeds 5MB limit. Please choose a smaller image.")
      return
    }

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }))
  }

  // Clear selected image
  const handleClearImage = () => {
    if (formData.imagePreview && formData.imageFile) {
      URL.revokeObjectURL(formData.imagePreview)
    }
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: editingNominee?.nominee_image_url || null,
    }))
    setImageError(null)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nominee_name.trim()) {
      toast.error("Nominee name is required")
      return
    }
    if (!formData.category_id) {
      toast.error("Category is required")
      return
    }

    setIsSubmitting(true)
    try {
      let imageUrl: string | null = null

      // Upload image if provided
      if (formData.imageFile) {
        imageUrl = await uploadNomineeImage(formData.imageFile)
      } else if (formData.imagePreview && editingNominee?.nominee_image_url === formData.imagePreview) {
        // Keep existing image
        imageUrl = editingNominee.nominee_image_url
      }

      if (editingNominee) {
        // Update existing nominee
        await updateNominee(editingNominee.id, {
          nominee_name: formData.nominee_name,
          nominee_image_url: imageUrl,
          category_id: formData.category_id,
        })
        toast.success("Nominee updated successfully")
      } else {
        // Create new nominee
        const data: CreateNomineeData = {
          category_id: formData.category_id,
          nominee_name: formData.nominee_name,
          nominee_image_url: imageUrl,
        }
        await createNominee(data)
        toast.success("Nominee created successfully")
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to save nominee")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isEditing = !!editingNominee

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          // Delay reset to allow animation to complete
          setTimeout(resetForm, 300)
        }
      }}
    >
      <SheetContent className="bg-purple-surface border-purple-accent/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-text-primary">
            {isEditing ? "Edit Nominee" : "Add Nominee"}
          </SheetTitle>
          <SheetDescription className="text-text-secondary">
            {isEditing
              ? "Update the nominee details below."
              : "Fill in the details to create a new nominee. A unique code will be generated automatically."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-text-primary">Photo</Label>
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-dashed border-purple-accent/50">
                  {formData.imagePreview ? (
                    <AvatarImage
                      src={formData.imagePreview}
                      alt="Preview"
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-purple-accent/20">
                      <ImageIcon className="h-8 w-8 text-text-tertiary" />
                    </AvatarFallback>
                  )}
                </Avatar>
                {formData.imagePreview && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="bg-purple-bg border-purple-accent/50 text-text-primary file:text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-accent/30 file:text-text-primary hover:file:bg-purple-accent/50 cursor-pointer"
                  />
                  <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                </div>
                {imageError && (
                  <p className="text-xs text-red-400">{imageError}</p>
                )}
                <p className="text-xs text-text-tertiary">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                </p>
                {formData.imageFile && (
                  <p className="text-xs text-gold-primary">
                    Selected: {formData.imageFile.name} ({formatFileSize(formData.imageFile.size)})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-text-primary">
              Full Name *
            </Label>
            <Input
              id="name"
              value={formData.nominee_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nominee_name: e.target.value,
                }))
              }
              placeholder="Enter nominee name"
              className="bg-purple-bg border-purple-accent/50 text-text-primary placeholder:text-text-tertiary"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-text-primary">
              Category *
            </Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value }))
              }
              disabled={isSubmitting || categories.length === 0}
            >
              <SelectTrigger className="bg-purple-bg border-purple-accent/50 text-text-primary">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-purple-surface border-purple-accent/50">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-text-primary"
                  >
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && (
              <p className="text-xs text-text-tertiary">
                No categories available. Please create categories first.
              </p>
            )}
          </div>

          {/* Unique Code Display (for editing) */}
          {isEditing && editingNominee && (
            <div className="space-y-2">
              <Label className="text-text-primary">Unique Code</Label>
              <code className="block px-3 py-2 bg-purple-bg rounded border border-purple-accent/50 text-gold-primary font-mono text-sm">
                {editingNominee.unique_code}
              </code>
              <p className="text-xs text-text-tertiary">
                This code is used for QR code voting
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose()
                resetForm()
              }}
              disabled={isSubmitting}
              className="flex-1 border-purple-accent/50 text-text-primary hover:bg-purple-accent/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="flex-1 bg-gold-primary text-purple-bg hover:bg-gold-hover disabled:opacity-50"
            >
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Nominee"
                  : "Create Nominee"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
