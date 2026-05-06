import { z } from 'zod'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const eventFormSchema = z.object({
  // Step 1: Basic Information
  eventName: z.string().min(2, 'Event name must be at least 2 characters').max(100, 'Event name must be less than 100 characters'),
  eventDescription: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  eventImage: z.union([
    z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, 'Max image size is 5MB').refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
    z.string(), // For already uploaded image URLs
    z.null(),
  ]).optional(),

  // Step 2: Event Tools
  enableNominations: z.boolean(),
  enableVoting: z.boolean(),

  // Step 3: Pricing
  amountPerVote: z.number().min(0.1, 'Minimum amount is ₵0.10').max(1000, 'Maximum amount is ₵1000'),
  serviceFee: z.enum(['10', '12']),
})

export type EventFormData = z.infer<typeof eventFormSchema>

// Database event type matching the Supabase schema
export type EventApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Event {
  id: string
  created_by: string
  event_name: string
  event_description: string
  event_image_url: string | null
  enable_nominations: boolean
  enable_voting: boolean
  amount_per_vote: number
  service_fee: number
  approval_status: EventApprovalStatus
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  // Voting and nomination dates
  nomination_start_date: string | null
  nomination_end_date: string | null
  voting_start_date: string | null
  voting_end_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  is_active: boolean
  total_revenue: number
}

// Event with creator info (for admin views)
export interface EventWithCreator extends Event {
  creator_name: string
  creator_email: string
}

// CamelCase version for frontend use (converted from database)
export interface EventFrontend {
  id: string
  createdBy: string
  eventName: string
  eventDescription: string
  eventImageUrl: string | null
  enableNominations: boolean
  enableVoting: boolean
  amountPerVote: number
  serviceFee: number
  approvalStatus: EventApprovalStatus
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  // Voting and nomination dates
  nominationStartDate: string | null
  nominationEndDate: string | null
  votingStartDate: string | null
  votingEndDate: string | null
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export const steps = [
  { id: 1, name: 'Basic Info', description: 'Event details' },
  { id: 2, name: 'Tools', description: 'Event features' },
  { id: 3, name: 'Pricing', description: 'Vote pricing' },
  { id: 4, name: 'Review', description: 'Confirm details' },
] as const

export type StepId = (typeof steps)[number]['id']

// Helper function to convert database event to frontend format
export function toFrontendEvent(event: Event): EventFrontend {
  return {
    id: event.id,
    createdBy: event.created_by,
    eventName: event.event_name,
    eventDescription: event.event_description,
    eventImageUrl: event.event_image_url,
    enableNominations: event.enable_nominations,
    enableVoting: event.enable_voting,
    amountPerVote: event.amount_per_vote,
    serviceFee: event.service_fee,
    approvalStatus: event.approval_status,
    approvedBy: event.approved_by,
    approvedAt: event.approved_at,
    rejectionReason: event.rejection_reason,
    nominationStartDate: event.nomination_start_date,
    nominationEndDate: event.nomination_end_date,
    votingStartDate: event.voting_start_date,
    votingEndDate: event.voting_end_date,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    isActive: event.is_active,
  }
}

// Helper function to convert form data to database format
export function toDatabaseEvent(
  formData: EventFormData,
  userId: string,
  imageUrl?: string | null
): Omit<Event, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at' | 'rejection_reason' | 'deleted_at'> {
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return {
    created_by: userId,
    event_name: formData.eventName,
    event_description: formData.eventDescription,
    event_image_url: imageUrl || (typeof formData.eventImage === 'string' ? formData.eventImage : null),
    enable_nominations: formData.enableNominations,
    enable_voting: formData.enableVoting,
    amount_per_vote: formData.amountPerVote,
    service_fee: parseInt(formData.serviceFee),
    approval_status: 'pending',
    is_active: true,
    total_revenue: 0,
    // Default dates set to current date and 7 days later
    nomination_start_date: now.toISOString(),
    nomination_end_date: sevenDaysLater.toISOString(),
    voting_start_date: now.toISOString(),
    voting_end_date: sevenDaysLater.toISOString(),
  }
}

// Sort options for events
export type EventSortField = 'created_at' | 'event_name' | 'approval_status' | 'amount_per_vote'
export type EventSortOrder = 'asc' | 'desc'

export interface EventSort {
  field: EventSortField
  order: EventSortOrder
}

// Pagination
export const DEFAULT_PAGE_SIZE = 10

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Event filters
export interface EventFilters {
  search?: string
  status?: EventApprovalStatus | 'all'
  dateFrom?: string
  dateTo?: string
}

// Complete query params for events
export interface EventQueryParams extends PaginationParams {
  sort?: EventSort
  filters?: EventFilters
}

// Event list item (lightweight for table display)
export interface EventListItem {
  id: string
  eventName: string
  eventImageUrl: string | null
  approvalStatus: EventApprovalStatus
  amountPerVote: number
  serviceFee: number
  createdAt: string
  enableVoting: boolean
  enableNominations: boolean
  // Quick edit fields
  eventDescription?: string
  nominationStartDate?: string | null
  nominationEndDate?: string | null
  votingStartDate?: string | null
  votingEndDate?: string | null
  // For admin views
  creatorName?: string
  creatorEmail?: string
}

// Helper function to convert database event to list item (lightweight)
export function toEventListItem(event: Event | EventWithCreator): EventListItem {
  return {
    id: event.id,
    eventName: event.event_name,
    eventImageUrl: event.event_image_url,
    approvalStatus: event.approval_status,
    amountPerVote: event.amount_per_vote,
    serviceFee: event.service_fee,
    createdAt: event.created_at,
    enableVoting: event.enable_voting,
    enableNominations: event.enable_nominations,
    // Quick edit fields
    eventDescription: event.event_description,
    nominationStartDate: event.nomination_start_date,
    nominationEndDate: event.nomination_end_date,
    votingStartDate: event.voting_start_date,
    votingEndDate: event.voting_end_date,
    creatorName: 'creator_name' in event ? event.creator_name : undefined,
    creatorEmail: 'creator_email' in event ? event.creator_email : undefined,
  }
}
