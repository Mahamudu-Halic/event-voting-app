'use client'

import { useState } from 'react'
import { Edit2, Loader2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CategoryFormData, categoryFormSchema } from '@/lib/validations/category'
import { toast } from 'sonner'
import { updateCategory } from '@/apis/events'

interface EditCategorySheetProps {
  categoryId: string
  eventId: string
  defaultValues: {
    categoryName: string
    categoryDescription?: string | null
  }
  onSuccess?: () => void
}

export function EditCategorySheet({ categoryId, eventId, defaultValues, onSuccess }: EditCategorySheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      categoryName: defaultValues.categoryName,
      categoryDescription: defaultValues.categoryDescription || '',
    },
  })

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  const onSubmit = async (data: CategoryFormData) => {
    setIsSaving(true)
    try {
      await updateCategory(categoryId, {
        categoryName: data.categoryName,
        categoryDescription: data.categoryDescription || null,
      })
      toast.success('Category updated successfully')
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-text-secondary hover:text-purple-accent"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-purple-surface border-purple-accent/50">
        <SheetHeader className="space-y-2.5 pb-4">
          <SheetTitle className="text-text-primary">Edit Category</SheetTitle>
          <SheetDescription className="text-text-secondary">
            Update category details.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="text-text-primary">
              Category Name
            </Label>
            <Input
              id="categoryName"
              {...register('categoryName')}
              className="bg-purple-bg border-purple-accent/30 text-text-primary"
              placeholder="e.g., Best Actor, Best Song, etc."
            />
            {errors.categoryName && (
              <p className="text-sm text-error">{errors.categoryName.message}</p>
            )}
          </div>

          {/* Category Description */}
          <div className="space-y-2">
            <Label htmlFor="categoryDescription" className="text-text-primary">
              Description
            </Label>
            <Textarea
              id="categoryDescription"
              {...register('categoryDescription')}
              rows={3}
              className="bg-purple-bg border-purple-accent/30 text-text-primary resize-none"
              placeholder="Describe what this category is about..."
            />
            {errors.categoryDescription && (
              <p className="text-sm text-error">{errors.categoryDescription.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-purple-accent/30 text-text-primary hover:bg-purple-accent/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gold-primary hover:bg-gold-dark text-text-tertiary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Category'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
