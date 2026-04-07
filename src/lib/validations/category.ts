import { z } from 'zod'

// Category form schema
export const categoryFormSchema = z.object({
  categoryName: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters'),
  categoryDescription: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .optional(),
})

export type CategoryFormData = z.infer<typeof categoryFormSchema>

// Database category type
export interface Category {
  id: string
  event_id: string
  category_name: string
  category_description: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
}

// Frontend category type
export interface CategoryFrontend {
  id: string
  eventId: string
  categoryName: string
  categoryDescription: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

// Category with nominee count
export interface CategoryWithNominees {
  id: string
  categoryName: string
  categoryDescription: string | null
  totalNominees: number
  createdAt: string
}

// Helper to convert database category to frontend format
export function toFrontendCategory(category: Category): CategoryFrontend {
  return {
    id: category.id,
    eventId: category.event_id,
    categoryName: category.category_name,
    categoryDescription: category.category_description,
    createdBy: category.created_by,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
    isActive: category.is_active,
  }
}

// Helper to convert database category to list item
export function toCategoryWithNominees(
  category: Category & { nominees_count?: number }
): CategoryWithNominees {
  return {
    id: category.id,
    categoryName: category.category_name,
    categoryDescription: category.category_description,
    totalNominees: category.nominees_count || 0,
    createdAt: category.created_at,
  }
}
