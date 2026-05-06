"use server"

import { createClient } from "@/lib/supabase/server"

export interface VoteResult {
  nominee_id: string
  nominee_name: string
  nominee_image_url: string | null
  category_id: string
  category_name: string
  votes_count: number
  unique_code: string
  percentage: number
}

export interface CategoryVoteStats {
  category_id: string
  category_name: string
  total_votes: number
  nominees: VoteResult[]
}

export interface VotingSummary {
  total_votes: number
  total_categories: number
  total_nominees: number
  leading_nominees: VoteResult[]
}

export interface VotingStatus {
  is_voting_active: boolean
  voting_start_date: string | null
  voting_end_date: string | null
  has_voting_period: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
}

// Get voting results for an event grouped by category
export async function getVotingResults(eventId: string): Promise<CategoryVoteStats[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get all nominees with their vote counts and category info for this event
  const { data, error } = await supabase
    .from("nominees")
    .select(`
      id,
      nominee_name,
      nominee_image_url,
      unique_code,
      votes_count,
      category:categories(
        id,
        category_name
      )
    `)
    .eq("is_active", true)
    .eq("categories.event_id", eventId)
    .eq("categories.is_active", true)
    .order("votes_count", { ascending: false })

  if (error) {
    console.error("Error fetching voting results:", error)
    throw new Error("Failed to fetch voting results")
  }

  // Group by category and calculate percentages
  const categoryMap = new Map<string, CategoryVoteStats>()

  data?.forEach((nominee: any) => {
    const category = Array.isArray(nominee.category) ? nominee.category[0] : nominee.category
    if (!category) return

    if (!categoryMap.has(category.id)) {
      categoryMap.set(category.id, {
        category_id: category.id,
        category_name: category.category_name,
        total_votes: 0,
        nominees: [],
      })
    }

    const categoryStats = categoryMap.get(category.id)!
    categoryStats.total_votes += nominee.votes_count || 0
    categoryStats.nominees.push({
      nominee_id: nominee.id,
      nominee_name: nominee.nominee_name,
      nominee_image_url: nominee.nominee_image_url,
      category_id: category.id,
      category_name: category.category_name,
      votes_count: nominee.votes_count || 0,
      unique_code: nominee.unique_code,
      percentage: 0, // Will calculate after
    })
  })

  // Calculate percentages
  const results: CategoryVoteStats[] = []
  categoryMap.forEach((stats) => {
    stats.nominees = stats.nominees.map((nominee) => ({
      ...nominee,
      percentage: stats.total_votes > 0
        ? Math.round((nominee.votes_count / stats.total_votes) * 100)
        : 0,
    }))
    results.push(stats)
  })

  // Sort by category name
  return results.sort((a, b) => a.category_name.localeCompare(b.category_name))
}

// Get voting summary/stats for an event
export async function getVotingSummary(eventId: string): Promise<VotingSummary> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get total votes and counts
  const { data, error } = await supabase
    .from("nominees")
    .select(`
      id,
      nominee_name,
      nominee_image_url,
      unique_code,
      votes_count,
      category:categories(
        id,
        category_name
      )
    `)
    .eq("is_active", true)
    .eq("event_id", eventId)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching voting summary:", error)
    throw new Error("Failed to fetch voting summary")
  }
  
  const nominees = data || []
  const total_votes = nominees.reduce((sum: number, n: any) => sum + (n.votes_count || 0), 0)

  // Get unique categories
  const categoryIds = new Set<string>()
  nominees.forEach((n: any) => {
    const category = Array.isArray(n.category) ? n.category[0] : n.category
    if (category) categoryIds.add(category.id)
  })

  // Find leading nominees per category
  const categoryLeaders = new Map<string, any>()
  nominees.forEach((n: any) => {
    const category = Array.isArray(n.category) ? n.category[0] : n.category
    if (!category) return

    const current = categoryLeaders.get(category.id)
    if (!current || (n.votes_count || 0) > (current.votes_count || 0)) {
      categoryLeaders.set(category.id, {
        ...n,
        category_name: category.category_name,
      })
    }
  })

  const leading_nominees = Array.from(categoryLeaders.values())
    .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))
    .slice(0, 5)
    .map((n: any) => ({
      nominee_id: n.id,
      nominee_name: n.nominee_name,
      nominee_image_url: n.nominee_image_url,
      category_id: n.category?.id || n.category_id,
      category_name: n.category?.category_name || n.category_name,
      votes_count: n.votes_count || 0,
      unique_code: n.unique_code,
      percentage: total_votes > 0 ? Math.round(((n.votes_count || 0) / total_votes) * 100) : 0,
    }))

  return {
    total_votes,
    total_categories: categoryIds.size,
    total_nominees: nominees.length,
    leading_nominees,
  }
}

// Get voting status for an event
export async function getVotingStatus(eventId: string): Promise<VotingStatus> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("events")
    .select("voting_start_date, voting_end_date, approval_status")
    .eq("id", eventId)
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

// Toggle voting status (enable/disable by setting dates)
export async function updateVotingPeriod(
  eventId: string,
  voting_start_date: string | null,
  voting_end_date: string | null
): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("events")
    .update({
      voting_start_date,
      voting_end_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("created_by", user.id)

  if (error) {
    console.error("Error updating voting period:", error)
    throw new Error("Failed to update voting period")
  }
}

// Reset votes for an event (admin only)
export async function resetVotes(eventId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check if admin
  const { data: adminData } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!adminData) {
    throw new Error("Admin access required to reset votes")
  }

  // Get all nominee IDs for this event
  const { data: nominees, error: fetchError } = await supabase
    .from("nominees")
    .select("id")
    .eq("is_active", true)
    .eq("categories.event_id", eventId)

  if (fetchError) {
    console.error("Error fetching nominees:", fetchError)
    throw new Error("Failed to fetch nominees")
  }

  // Reset votes
  const nomineeIds = nominees?.map((n) => n.id) || []
  if (nomineeIds.length > 0) {
    const { error: updateError } = await supabase
      .from("nominees")
      .update({ votes_count: 0, updated_at: new Date().toISOString() })
      .in("id", nomineeIds)

    if (updateError) {
      console.error("Error resetting votes:", updateError)
      throw new Error("Failed to reset votes")
    }
  }
}
