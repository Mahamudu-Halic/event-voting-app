"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import {
    Trophy,
    Users,
    BarChart3,
    Calendar,
    TrendingUp,
    Crown,
    AlertCircle,
    Play,
    Square, ChevronDown,
    ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    getVotingResults,
    getVotingSummary,
    getVotingStatus,
    updateVotingPeriod, type CategoryVoteStats,
    type VotingSummary,
    type VotingStatus
} from "@/apis/voting"

export default function VotingPage() {
  const params = useParams()
  const eventId = params.id as string

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<CategoryVoteStats[]>([])
  const [summary, setSummary] = useState<VotingSummary | null>(null)
  const [status, setStatus] = useState<VotingStatus | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resultsData, summaryData, statusData] = await Promise.all([
        getVotingResults(eventId),
        getVotingSummary(eventId),
        getVotingStatus(eventId),
      ])
      setResults(resultsData)
      setSummary(summaryData)
      setStatus(statusData)
      // Expand first category by default
      if (resultsData.length > 0) {
        setExpandedCategories(new Set([resultsData[0].category_id]))
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch voting data")
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleToggleVoting = async () => {
    if (!status) return

    setIsUpdatingStatus(true)
    try {
      const now = new Date()
      if (status.is_voting_active) {
        // Stop voting - set end date to now
        await updateVotingPeriod(eventId, status.voting_start_date, now.toISOString())
        toast.success("Voting stopped")
      } else {
        // Start voting - set start date to now, end date to 7 days from now
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        await updateVotingPeriod(eventId, now.toISOString(), endDate.toISOString())
        toast.success("Voting started for 7 days")
      }
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update voting status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-purple-accent/30" />
          <Skeleton className="h-10 w-32 bg-purple-accent/30" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-purple-accent/30" />
          ))}
        </div>
        <Skeleton className="h-96 bg-purple-accent/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Voting Results</h1>
          <p className="text-text-secondary mt-1">
            Monitor voting progress and view results by category
          </p>
        </div>
        <div className="flex gap-2">
          {status?.has_voting_period && (
            <Button
              onClick={handleToggleVoting}
              disabled={isUpdatingStatus}
              variant={status?.is_voting_active ? "destructive" : "default"}
              className={
                status?.is_voting_active
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }
            >
              {isUpdatingStatus ? (
                "Updating..."
              ) : status?.is_voting_active ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Voting
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Voting
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Votes</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {summary?.total_votes.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-gold-primary/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-gold-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Categories</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {summary?.total_categories || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Nominees</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {summary?.total_nominees || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-surface border-purple-accent/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Voting Status</p>
                <Badge
                  variant="secondary"
                  className={`mt-1 ${
                    status?.is_voting_active
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {status?.is_voting_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            {status?.has_voting_period && (
              <div className="mt-3 text-xs text-text-tertiary">
                <p>Start: {formatDate(status.voting_start_date)}</p>
                <p>End: {formatDate(status.voting_end_date)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Nominees */}
      {summary && summary.leading_nominees.length > 0 && (
        <Card className="bg-purple-surface border-purple-accent/50">
          <CardHeader>
            <CardTitle className="text-text-primary flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold-primary" />
              Top Nominees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {summary.leading_nominees.map((nominee, index) => (
                <div
                  key={nominee.nominee_id}
                  className="relative p-4 bg-purple-bg rounded-lg border border-purple-accent/30"
                >
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2">
                      <Trophy className="h-6 w-6 text-gold-primary" />
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 border-2 border-gold-primary/50">
                      <AvatarImage src={nominee.nominee_image_url || undefined} />
                      <AvatarFallback className="bg-purple-accent/50 text-text-primary text-lg">
                        {nominee.nominee_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-2 font-medium text-text-primary truncate w-full">
                      {nominee.nominee_name}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 bg-purple-accent/30 text-text-secondary border-purple-accent/30"
                    >
                      {nominee.category_name}
                    </Badge>
                    <p className="mt-2 text-2xl font-bold text-gold-primary">
                      {nominee.votes_count.toLocaleString()}
                    </p>
                    <p className="text-xs text-text-tertiary">votes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results by Category */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Results by Category</h2>

        {results.length === 0 ? (
          <Card className="bg-purple-surface border-purple-accent/50">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-text-tertiary" />
              <p className="text-lg font-medium text-text-primary">
                No nominees found
              </p>
              <p className="text-text-secondary mt-1">
                Add nominees to categories to start receiving votes
              </p>
            </CardContent>
          </Card>
        ) : (
          results.map((category) => (
            <Collapsible
              key={category.category_id}
              open={expandedCategories.has(category.category_id)}
              onOpenChange={() => toggleCategory(category.category_id)}
            >
              <Card className="bg-purple-surface border-purple-accent/50 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-purple-accent/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-text-primary text-lg">
                          {category.category_name}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="bg-purple-accent/30 text-text-secondary"
                        >
                          {category.total_votes.toLocaleString()} votes
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">
                          {category.nominees.length} nominees
                        </span>
                        {expandedCategories.has(category.category_id) ? (
                          <ChevronUp className="h-5 w-5 text-text-secondary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-text-secondary" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {category.nominees.map((nominee, index) => (
                        <div
                          key={nominee.nominee_id}
                          className={`p-4 rounded-lg ${
                            index === 0 && nominee.votes_count > 0
                              ? "bg-gold-primary/10 border border-gold-primary/30"
                              : "bg-purple-bg border border-purple-accent/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="shrink-0">
                              {index === 0 && nominee.votes_count > 0 ? (
                                <div className="w-8 h-8 rounded-full bg-gold-primary flex items-center justify-center text-purple-bg font-bold">
                                  1
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-accent/50 flex items-center justify-center text-text-primary font-medium">
                                  {index + 1}
                                </div>
                              )}
                            </div>

                            <Avatar className="h-12 w-12 border border-purple-accent/30">
                              <AvatarImage
                                src={nominee.nominee_image_url || undefined}
                                alt={nominee.nominee_name}
                              />
                              <AvatarFallback className="bg-purple-accent/50 text-text-primary">
                                {nominee.nominee_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-text-primary truncate">
                                  {nominee.nominee_name}
                                </p>
                                <div className="text-right">
                                  <p className="font-bold text-text-primary">
                                    {nominee.votes_count.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-text-tertiary">
                                    {category.total_votes > 0
                                      ? `${nominee.percentage}%`
                                      : "0%"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Progress
                                  value={nominee.percentage}
                                  className="flex-1 h-2 bg-purple-accent/30"
                                />
                                <code className="text-xs text-gold-primary font-mono">
                                  {nominee.unique_code}
                                </code>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  )
}