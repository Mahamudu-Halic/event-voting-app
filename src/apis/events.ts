"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { 
  type Event, 
  type EventWithCreator, 
  type EventListItem,
  type PaginatedResult, 
  type EventQueryParams,
  type EventFilters,
  type EventSort,
  type EventFormData,
  DEFAULT_PAGE_SIZE,
  toEventListItem,
  toFrontendEvent,
  toDatabaseEvent,
} from "@/lib/validations/event"

// Get events for the current organizer with pagination, filters, and sorting
export async function getOrganizerEvents(
  params: EventQueryParams = { page: 1, limit: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<EventListItem>> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { page, limit, filters, sort } = params
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Build query
  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("created_by", user.id)
    .eq("is_active", true)

  // Apply filters
  if (filters) {
    if (filters.search) {
      query = query.ilike("event_name", `%${filters.search}%`)
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("approval_status", filters.status)
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }
  }

  // Apply sorting
  if (sort) {
    query = query.order(sort.field, { ascending: sort.order === "asc" })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // Apply pagination
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching organizer events:", error)
    throw new Error("Failed to fetch events")
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  // Fetch category counts for each event
  const eventIds = (data as Event[]).map(e => e.id)
  let categoryCounts: Record<string, number> = {}
  
  if (eventIds.length > 0) {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("event_id, id")
      .in("event_id", eventIds)
      .eq("is_active", true)
    
    if (!categoriesError && categoriesData) {
      categoryCounts = categoriesData.reduce((acc, cat) => {
        acc[cat.event_id] = (acc[cat.event_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  return {
    data: (data as Event[]).map(event => ({
      ...toEventListItem(event),
      categories: categoryCounts[event.id] || 0,
    })),
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

// Get all events for admin with pagination, filters, and sorting
export async function getAllEvents(
  params: EventQueryParams = { page: 1, limit: DEFAULT_PAGE_SIZE }
): Promise<PaginatedResult<EventListItem>> {
  const supabase = await createClient()

  // Get current user and check if admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  const { page, limit, filters, sort } = params
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Build query
  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("is_active", true)

  // Apply filters
  if (filters) {
    if (filters.search) {
      query = query.ilike("event_name", `%${filters.search}%`)
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("approval_status", filters.status)
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }
  }

  // Apply sorting
  if (sort) {
    query = query.order(sort.field, { ascending: sort.order === "asc" })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // Apply pagination
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching all events:", error)
    throw new Error("Failed to fetch events")
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  // Get unique creator IDs to fetch profiles
  const creatorIds = [...new Set((data || []).map(e => e.created_by))]

  // Fetch creator profiles
  const { data: creatorsData } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", creatorIds)

  const creatorsMap = new Map(creatorsData?.map(c => [c.id, c]) || [])

  // Transform data to include creator info
  const eventsWithCreator: EventWithCreator[] = (data || []).map((item) => {
    const rawEvent = item as unknown as Event
    const creator = creatorsMap.get(rawEvent.created_by)
    return {
      ...rawEvent,
      creator_name: creator?.email?.split('@')[0] || "Unknown",
      creator_email: creator?.email || "",
    }
  })

  // Fetch category counts for each event
  const eventIds = eventsWithCreator.map(e => e.id)
  let categoryCounts: Record<string, number> = {}
  
  if (eventIds.length > 0) {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("event_id, id")
      .in("event_id", eventIds)
      .eq("is_active", true)
    
    if (!categoriesError && categoriesData) {
      categoryCounts = categoriesData.reduce((acc, cat) => {
        acc[cat.event_id] = (acc[cat.event_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  return {
    data: eventsWithCreator.map(event => ({
      ...toEventListItem(event),
      categories: categoryCounts[event.id] || 0,
    })),
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

// Get pending events count for admin badge
export async function getPendingEventsCount(): Promise<number> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== "admin") {
    return 0
  }

  const { count, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "pending")
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching pending count:", error)
    return 0
  }

  return count || 0
}



// Get event statistics for organizer dashboard
export async function getEventStats(): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("events")
    .select("approval_status")
    .eq("created_by", user.id)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching event stats:", error)
    throw new Error("Failed to fetch event statistics")
  }

  const events = data as { approval_status: string }[]
  
  return {
    total: events.length,
    pending: events.filter(e => e.approval_status === "pending").length,
    approved: events.filter(e => e.approval_status === "approved").length,
    rejected: events.filter(e => e.approval_status === "rejected").length,
  }
}

// Delete (soft delete) an event
export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("events")
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", eventId)
    .eq("created_by", user.id)
    .eq("approval_status", "pending") // Only allow deleting pending events
    .select()

  if (error) {
    console.error("Error deleting event:", error)
    throw new Error("Failed to delete event. " + error.message)
  }

  // Check if any rows were actually updated
  if (!data || data.length === 0) {
    throw new Error("Failed to delete event. Only pending events can be deleted, or you may not have permission.")
  }
}

// Admin: Approve an event
export async function approveEvent(eventId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Verify admin role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  const { error } = await supabase
    .from("events")
    .update({
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", eventId)

  if (error) {
    console.error("Error approving event:", error)
    throw new Error("Failed to approve event. " + error.message)
  }
}

// Admin: Reject an event
export async function rejectEvent(eventId: string, reason?: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Verify admin role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  const { error } = await supabase
    .from("events")
    .update({
      approval_status: "rejected",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: reason || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", eventId)

  if (error) {
    console.error("Error rejecting event:", error)
    throw new Error("Failed to reject event. " + error.message)
  }
}

// Upload event image to Supabase Storage
export async function uploadEventImage(
  file: File
): Promise<string> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error("Error uploading image:", uploadError)
    throw new Error("Failed to upload image. " + uploadError.message)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath)

  return publicUrl
}

// Create a new event
export async function createEvent(
  formData: EventFormData,
  imageFile?: File | null
): Promise<Event> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  let imageUrl: string | null = null

  // Upload image if provided
  if (imageFile) {
    imageUrl = await uploadEventImage(imageFile)
  } else if (typeof formData.eventImage === 'string') {
    imageUrl = formData.eventImage
  }

  // Convert form data to database format
  const eventData = toDatabaseEvent(formData, user.id, imageUrl)

  // Insert into database
  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select()
    .single()

  if (error) {
    console.error("Error creating event:", error)
    throw new Error("Failed to create event. " + error.message)
  }

  return data as Event
}

// Update an event (for quick edit)
export async function updateEvent(
  eventId: string,
  updates: {
    eventName?: string
    eventDescription?: string
    eventImageUrl?: string | null
    nominationStartDate?: string
    nominationEndDate?: string
    votingStartDate?: string
    votingEndDate?: string
  }
): Promise<Event> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }
  
  if (updates.eventName !== undefined) updateData.event_name = updates.eventName
  if (updates.eventDescription !== undefined) updateData.event_description = updates.eventDescription
  if (updates.eventImageUrl !== undefined) updateData.event_image_url = updates.eventImageUrl
  if (updates.nominationStartDate !== undefined) updateData.nomination_start_date = updates.nominationStartDate
  if (updates.nominationEndDate !== undefined) updateData.nomination_end_date = updates.nominationEndDate
  if (updates.votingStartDate !== undefined) updateData.voting_start_date = updates.votingStartDate
  if (updates.votingEndDate !== undefined) updateData.voting_end_date = updates.votingEndDate

  const { data, error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
    .eq("created_by", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating event:", error)
    throw new Error("Failed to update event. " + error.message)
  }

  return data as Event
}

// Create multiple categories at once
export async function createCategories(
  eventId: string,
  categories: { categoryName: string; categoryDescription?: string }[]
): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Verify user owns the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("created_by", user.id)
    .single()

  if (eventError || !event) {
    throw new Error("Event not found or you don't have permission")
  }

  // Insert all categories
  const categoriesToInsert = categories.map((cat) => ({
    event_id: eventId,
    category_name: cat.categoryName,
    category_description: cat.categoryDescription || null,
    created_by: user.id,
  }))

  const { error } = await supabase
    .from("categories")
    .insert(categoriesToInsert)

  if (error) {
    console.error("Error creating categories:", error)
    throw new Error("Failed to create categories")
  }
}

// Update a category
export async function updateCategory(
  categoryId: string,
  data: { categoryName?: string; categoryDescription?: string | null }
): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("categories")
    .update({
      category_name: data.categoryName,
      category_description: data.categoryDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)

  if (error) {
    console.error("Error updating category:", error)
    throw new Error("Failed to update category")
  }
}

// Delete a category (only if no nominees)
export async function deleteCategory(categoryId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check nominee count using the SQL function
  const { data: nomineeData, error: countError } = await supabase
    .rpc("get_category_nominee_count", { category_uuid: categoryId })

  if (countError) {
    console.error("Error checking nominee count:", countError)
    throw new Error("Failed to check if category has nominees")
  }

  if (nomineeData > 0) {
    throw new Error(`Cannot delete category: It has ${nomineeData} nominee(s)`)
  }

  // Soft delete the category
  const { error } = await supabase
    .from("categories")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", categoryId)

  if (error) {
    console.error("Error deleting category:", error)
    throw new Error("Failed to delete category")
  }
}

// Get categories for an event with nominee count
export async function getCategoriesWithNominees(
  eventId: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: categories, error } = await supabase
    .from("categories")
    .select(`
      *,
      nominees: nominees(count)
    `)
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching categories:", error)
    throw new Error("Failed to fetch categories")
  }

  return categories.map((cat) => ({
    id: cat.id,
    categoryName: cat.category_name,
    categoryDescription: cat.category_description,
    totalNominees: cat.nominees?.[0]?.count || 0,
    createdAt: cat.created_at,
  }))
}

// Get single event by ID
export async function getEventById(eventId: string): Promise<Event> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("created_by", user.id)
    .single()

  if (error) {
    console.error("Error fetching event:", error)
    throw new Error("Failed to fetch event")
  }

  return data as Event
}

// Get all approved events for public viewing (no auth required)
export async function getPublicEvents(
  searchQuery?: string
): Promise<EventListItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from("events")
    .select("id, event_name, event_description, event_image_url, approval_status, amount_per_vote, service_fee, created_at, enable_voting, enable_nominations, voting_start_date, voting_end_date")
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Apply search filter if provided
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike("event_name", `%${searchQuery.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching public events:", error)
    throw new Error("Failed to fetch events")
  }

  return (data || []).map((event) => ({
    id: event.id,
    eventName: event.event_name,
    eventImageUrl: event.event_image_url,
    approvalStatus: event.approval_status,
    amountPerVote: event.amount_per_vote,
    serviceFee: event.service_fee,
    createdAt: event.created_at,
    enableVoting: event.enable_voting,
    enableNominations: event.enable_nominations,
    eventDescription: event.event_description,
    votingStartDate: event.voting_start_date,
    votingEndDate: event.voting_end_date,
  }))
}

// Helper to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Get public event details (for event detail page)
export async function getPublicEventDetails(eventId: string): Promise<EventListItem | null> {
  // Validate UUID format before querying
  if (!isValidUUID(eventId)) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .select("id, event_name, event_description, event_image_url, approval_status, amount_per_vote, service_fee, created_at, enable_voting, enable_nominations, nomination_start_date, nomination_end_date, voting_start_date, voting_end_date")
    .eq("id", eventId)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Event not found or not approved
    }
    console.error("Error fetching event details:", error)
    throw new Error("Failed to fetch event details")
  }

  return {
    id: data.id,
    eventName: data.event_name,
    eventImageUrl: data.event_image_url,
    approvalStatus: data.approval_status,
    amountPerVote: data.amount_per_vote,
    serviceFee: data.service_fee,
    createdAt: data.created_at,
    enableVoting: data.enable_voting,
    enableNominations: data.enable_nominations,
    eventDescription: data.event_description,
    nominationStartDate: data.nomination_start_date,
    nominationEndDate: data.nomination_end_date,
    votingStartDate: data.voting_start_date,
    votingEndDate: data.voting_end_date,
  }
}

// Get public categories for an event
export async function getPublicEventCategories(
  eventId: string,
  searchQuery?: string
): Promise<Array<{ id: string; categoryName: string; categoryDescription: string | null; nomineesCount: number }>> {
  // Validate UUID format before querying
  if (!isValidUUID(eventId)) {
    return []
  }

  const supabase = await createClient()

  let query = supabase
    .from("categories")
    .select(`
      id,
      category_name,
      category_description,
      nominees:nominees(count)
    `)
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  // Apply search filter if provided
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike("category_name", `%${searchQuery.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching event categories:", error)
    throw new Error("Failed to fetch categories")
  }

  return (data || []).map((cat) => ({
    id: cat.id,
    categoryName: cat.category_name,
    categoryDescription: cat.category_description,
    nomineesCount: (cat.nominees as unknown as [{ count: number }])?.[0]?.count || 0,
  }))
}

// Get public nominees for a category
export interface PublicNominee {
  id: string
  nomineeName: string
  nomineeDescription: string | null
  nomineeImageUrl: string | null
  uniqueCode: string
  votesCount: number
}

export async function getPublicNomineesByCategory(
  categoryId: string,
  searchQuery?: string
): Promise<PublicNominee[]> {
  const supabase = await createClient()

  let query = supabase
    .from("nominees")
    .select("id, nominee_name, nominee_description, nominee_image_url, unique_code, votes_count")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("votes_count", { ascending: false })

  // Apply search filter if provided
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike("nominee_name", `%${searchQuery.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching nominees:", error)
    throw new Error("Failed to fetch nominees")
  }

  return (data || []).map((nominee) => ({
    id: nominee.id,
    nomineeName: nominee.nominee_name,
    nomineeDescription: nominee.nominee_description,
    nomineeImageUrl: nominee.nominee_image_url,
    uniqueCode: nominee.unique_code,
    votesCount: nominee.votes_count,
  }))
}

// Get public voting status (no auth required)
export interface PublicVotingStatus {
  is_voting_active: boolean
  voting_start_date: string | null
  voting_end_date: string | null
  has_voting_period: boolean
  approval_status: string
}

export async function getPublicVotingStatus(
  eventId: string
): Promise<PublicVotingStatus> {
  // Validate UUID format before querying
  if (!isValidUUID(eventId)) {
    return {
      is_voting_active: false,
      voting_start_date: null,
      voting_end_date: null,
      has_voting_period: false,
      approval_status: 'pending',
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .select("voting_start_date, voting_end_date, approval_status")
    .eq("id", eventId)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching voting status:", error)
    throw new Error("Failed to fetch voting status")
  }

  const now = new Date()
  const has_voting_period = !!(data.voting_start_date && data.voting_end_date)

  let is_voting_active = false
  if (has_voting_period) {
    const startDate = new Date(data.voting_start_date)
    const endDate = new Date(data.voting_end_date)
    is_voting_active = now >= startDate && now <= endDate
  }

  return {
    is_voting_active,
    voting_start_date: data.voting_start_date,
    voting_end_date: data.voting_end_date,
    has_voting_period,
    approval_status: data.approval_status,
  }
}

// Cast a vote for a nominee
export interface CastVoteData {
  nomineeId: string
  votesCount: number
}

export interface CastVoteResult {
  success: boolean
  totalAmount: number
  message: string
  netAmount?: number
  serviceFee?: number
}

export interface PaymentVerificationData {
  reference: string
  amount: number // in pesewas (already multiplied by 100)
  eventId: string
  nomineeId: string
  votesCount: number
}

export async function castPublicVote(
  eventId: string,
  data: CastVoteData
): Promise<CastVoteResult> {
  const supabase = await createClient()

  // Get event details for pricing
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("amount_per_vote, service_fee, voting_start_date, voting_end_date, total_revenue")
    .eq("id", eventId)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .single()

  if (eventError || !event) {
    throw new Error("Event not found or not available for voting")
  }

  // Check if voting is open
  const now = new Date()
  if (event.voting_start_date && new Date(event.voting_start_date) > now) {
    throw new Error("Voting has not started yet")
  }
  if (event.voting_end_date && new Date(event.voting_end_date) < now) {
    throw new Error("Voting has ended")
  }

  // Get nominee details
  const { data: nominee, error: nomineeError } = await supabase
    .from("nominees")
    .select("id, votes_count, category_id, categories!inner(event_id)")
    .eq("id", data.nomineeId)
    .eq("is_active", true)
    .single()

  if (nomineeError || !nominee) {
    throw new Error("Nominee not found")
  }

  // Verify nominee belongs to the event
  const nomineeEventId = (nominee.categories as unknown as { event_id: string })?.event_id
  if (nomineeEventId !== eventId) {
    throw new Error("Invalid nominee for this event")
  }

  // Calculate total amount (no service fee charged to voter)
  const totalAmount = event.amount_per_vote * data.votesCount

  // Update nominee vote count
  const { error: updateError } = await supabase
    .from("nominees")
    .update({
      votes_count: (nominee.votes_count || 0) + data.votesCount,
      updated_at: now.toISOString(),
    })
    .eq("id", data.nomineeId)

  if (updateError) {
    console.error("Error casting vote:", updateError)
    throw new Error("Failed to cast vote")
  }

  return {
    success: true,
    totalAmount,
    message: `Successfully cast ${data.votesCount} vote${data.votesCount !== 1 ? "s" : ""}`,
  }
}

export async function verifyAndProcessVote(
  paymentData: PaymentVerificationData
): Promise<CastVoteResult> {
  const supabase = await createClient()

  // Get event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("amount_per_vote, service_fee, voting_start_date, voting_end_date, total_revenue")
    .eq("id", paymentData.eventId)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .single()

  if (eventError || !event) {
    throw new Error("Event not found or not available for voting")
  }

  // Check if voting is open
  const now = new Date()
  if (event.voting_start_date && new Date(event.voting_start_date) > now) {
    throw new Error("Voting has not started yet")
  }
  if (event.voting_end_date && new Date(event.voting_end_date) < now) {
    throw new Error("Voting has ended")
  }

  // Verify the payment amount matches expected amount
  const expectedAmount = event.amount_per_vote * paymentData.votesCount
  const paidAmount = paymentData.amount / 100 // Convert from pesewas to GHS

  if (Math.abs(paidAmount - expectedAmount) > 0.01) {
    throw new Error("Payment amount does not match expected amount")
  }

  // Get nominee details
  const { data: nominee, error: nomineeError } = await supabase
    .from("nominees")
    .select("id, votes_count, category_id, categories!inner(event_id)")
    .eq("id", paymentData.nomineeId)
    .eq("is_active", true)
    .single()

  if (nomineeError || !nominee) {
    throw new Error("Nominee not found")
  }

  // Verify nominee belongs to the event
  const nomineeEventId = (nominee.categories as unknown as { event_id: string })?.event_id
  if (nomineeEventId !== paymentData.eventId) {
    throw new Error("Invalid nominee for this event")
  }

  // Update nominee vote count
  const { error: updateNomineeError } = await supabase
    .from("nominees")
    .update({
      votes_count: (nominee.votes_count || 0) + paymentData.votesCount,
      updated_at: now.toISOString(),
    })
    .eq("id", paymentData.nomineeId)

  if (updateNomineeError) {
    console.error("Error casting vote:", updateNomineeError)
    throw new Error("Failed to cast vote")
  }

  // Update event total_revenue
  const { error: updateRevenueError } = await supabase
    .from("events")
    .update({
      total_revenue: (event.total_revenue || 0) + paidAmount,
      updated_at: now.toISOString(),
    })
    .eq("id", paymentData.eventId)

  if (updateRevenueError) {
    console.error("Error updating revenue:", updateRevenueError)
    // Don't throw here - vote was already cast successfully
  }

  // Credit organizer account with amount minus service fee
  const serviceFeeAmount = paidAmount * (event.service_fee / 100);
  const netAmount = paidAmount - serviceFeeAmount;

  try {
    // Use admin client to bypass RLS for account updates
    const adminClient = await createAdminClient();

    // Get event organizer
    const { data: eventData, error: eventDataError } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", paymentData.eventId)
      .single();

    if (!eventDataError && eventData?.created_by) {
      // Update or create organizer account using admin client
      const { data: account } = await adminClient
        .from("accounts")
        .select("id, balance, total_earned")
        .eq("user_id", eventData.created_by)
        .single();

      if (account) {
        // Update existing account
        const { error: updateError } = await adminClient
          .from("accounts")
          .update({
            balance: (account.balance || 0) + netAmount,
            total_earned: (account.total_earned || 0) + netAmount,
            updated_at: now.toISOString(),
          })
          .eq("id", account.id);

        if (updateError) {
          console.error("Error updating account:", updateError);
        }
      } else {
        // Create new account for organizer
        const { error: insertError } = await adminClient
          .from("accounts")
          .insert({
            user_id: eventData.created_by,
            balance: netAmount,
            total_earned: netAmount,
            total_withdrawn: 0,
          });

        if (insertError) {
          console.error("Error creating account:", insertError);
        }
      }
    }
  } catch (accountError) {
    console.error("Error crediting organizer account:", accountError);
    // Don't throw - vote was already cast successfully
  }

  return {
    success: true,
    totalAmount: paidAmount,
    netAmount: netAmount,
    serviceFee: serviceFeeAmount,
    message: `Successfully cast ${paymentData.votesCount} vote${paymentData.votesCount !== 1 ? "s" : ""}`,
  }
}

// Get event and category details for public viewing
export async function getPublicEventAndCategory(
  eventId: string,
  categoryId: string
): Promise<{ event: EventListItem | null; category: { id: string; categoryName: string; categoryDescription: string | null } | null }> {
  const supabase = await createClient()

  // Get event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, event_name, event_description, event_image_url, approval_status, amount_per_vote, service_fee, created_at, enable_voting, enable_nominations")
    .eq("id", eventId)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .single()

  if (eventError) {
    if (eventError.code === "PGRST116") {
      return { event: null, category: null }
    }
    throw new Error("Failed to fetch event")
  }

  // Get category details
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, category_name, category_description")
    .eq("id", categoryId)
    .eq("event_id", eventId)
    .eq("is_active", true)
    .single()

  if (categoryError || !category) {
    return {
      event: {
        id: event.id,
        eventName: event.event_name,
        eventImageUrl: event.event_image_url,
        approvalStatus: event.approval_status,
        amountPerVote: event.amount_per_vote,
        serviceFee: event.service_fee,
        createdAt: event.created_at,
        enableVoting: event.enable_voting,
        enableNominations: event.enable_nominations,
        eventDescription: event.event_description,
      },
      category: null,
    }
  }

  return {
    event: {
      id: event.id,
      eventName: event.event_name,
      eventImageUrl: event.event_image_url,
      approvalStatus: event.approval_status,
      amountPerVote: event.amount_per_vote,
      serviceFee: event.service_fee,
      createdAt: event.created_at,
      enableVoting: event.enable_voting,
      enableNominations: event.enable_nominations,
      eventDescription: event.event_description,
    },
    category: {
      id: category.id,
      categoryName: category.category_name,
      categoryDescription: category.category_description,
    },
  }
}
