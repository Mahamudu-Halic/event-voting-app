
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

  // Build update object with snake_case keys
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }
  
  if (updates.eventName !== undefined) {
    updateData.event_name = updates.eventName
  }
  if (updates.eventDescription !== undefined) {
    updateData.event_description = updates.eventDescription
  }
  if (updates.eventImageUrl !== undefined) {
    updateData.event_image_url = updates.eventImageUrl
  }
  if (updates.nominationStartDate !== undefined) {
    updateData.nomination_start_date = updates.nominationStartDate
  }
  if (updates.nominationEndDate !== undefined) {
    updateData.nomination_end_date = updates.nominationEndDate
  }
  if (updates.votingStartDate !== undefined) {
    updateData.voting_start_date = updates.votingStartDate
  }
  if (updates.votingEndDate !== undefined) {
    updateData.voting_end_date = updates.votingEndDate
  }

  // Update the event
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
