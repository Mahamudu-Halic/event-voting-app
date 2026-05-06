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
      <SheetContent className="bg-purple-surface border-purple-accent/40 w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-2 pb-6 border-b border-purple-accent/20">
          <SheetTitle className="text-text-primary text-xl font-semibold tracking-tight">
            {isEditing ? "Edit Nominee" : "Add Nominee"}
          </SheetTitle>
          <SheetDescription className="text-text-secondary leading-relaxed">
            {isEditing
              ? "Update the nominee details below."
              : "Fill in the details to create a new nominee. A unique code will be generated automatically."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label className="text-text-primary text-sm font-medium">Profile Photo</Label>
            <div className="flex items-start gap-5">
              <div className="relative shrink-0 group">
                <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-purple-accent/30 flex items-center justify-center overflow-hidden bg-purple-bg/40 transition-all duration-200 group-hover:border-purple-accent/60">
                  {formData.imagePreview ? (
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <ImageIcon className="h-8 w-8 text-text-tertiary/40" />
                      <span className="text-[10px] text-text-tertiary/50 font-medium uppercase tracking-wider">No image</span>
                    </div>
                  )}
                </div>
                {formData.imagePreview && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border-2 border-purple-surface hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <label className="relative cursor-pointer inline-flex">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-accent/15 border border-purple-accent/30 text-text-primary text-sm font-medium hover:bg-purple-accent/25 hover:border-purple-accent/50 transition-all duration-200">
                      <Upload className="h-4 w-4 text-text-secondary" />
                      {formData.imagePreview ? "Change Photo" : "Upload Photo"}
                    </span>
                  </label>
                  {formData.imageFile && (
                    <span className="text-xs text-emerald-400 font-medium">
                      Ready to upload
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-white leading-relaxed">
                    Recommended: square image, at least 400×400px. Max 5MB.
                  </p>
                  <p className="text-xs text-white/60">
                    JPG, PNG, GIF, WebP
                  </p>
                </div>

                {imageError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                    <X className="h-4 w-4 shrink-0" />
                    {imageError}
                  </div>
                )}

                {formData.imageFile && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
                    <Upload className="h-4 w-4 shrink-0" />
                    <span className="truncate max-w-[200px]">{formData.imageFile.name}</span>
                    <span className="text-emerald-400/60 text-xs">({formatFileSize(formData.imageFile.size)})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-text-primary text-sm font-medium">
              Full Name <span className="text-red-400">*</span>
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
              className="bg-purple-bg/50 border-purple-accent/40 text-text-primary placeholder:text-text-tertiary/60 focus:border-purple-accent focus:ring-1 focus:ring-purple-accent/30 transition-all h-11"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-text-primary text-sm font-medium">
              Category <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value }))
              }
              disabled={isSubmitting || categories.length === 0}
            >
              <SelectTrigger className="bg-purple-bg/50 border-purple-accent/40 text-text-primary h-11 focus:ring-1 focus:ring-purple-accent/30 focus:border-purple-accent">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-purple-surface border-purple-accent/40 shadow-xl">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-text-primary focus:bg-purple-accent/20 focus:text-text-primary cursor-pointer"
                  >
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && (
              <p className="text-sm text-amber-400 bg-amber-500/10 rounded-md px-3 py-2">
                No categories available. Please create categories first.
              </p>
            )}
          </div>

          {/* Unique Code Display (for editing) */}
          {isEditing && editingNominee && (
            <div className="space-y-3">
              <Label className="text-text-primary text-sm font-medium">Unique Code</Label>
              <div className="bg-purple-bg/50 rounded-lg border border-purple-accent/30 px-4 py-3 flex items-center justify-between">
                <code className="text-gold-primary font-mono text-base font-semibold tracking-wider">
                  {editingNominee.unique_code}
                </code>
                <span className="text-xs text-text-tertiary bg-purple-accent/20 px-2 py-1 rounded">
                  QR Voting
                </span>
              </div>
              <p className="text-sm text-text-tertiary">
                This code is used for QR code voting and nominee identification.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose()
                resetForm()
              }}
              disabled={isSubmitting}
              className="flex-1 h-11 border-purple-accent/40 hover:bg-purple-accent/15 hover:border-purple-accent/60 hover:text-text-primary transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="flex-1 h-11 bg-gold-primary text-purple-bg hover:bg-gold-hover disabled:opacity-40 font-medium transition-all"
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
