"use server"

import { createClient } from "@/lib/supabase/server"
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
