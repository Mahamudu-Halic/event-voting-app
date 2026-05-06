"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Trophy,
  Users,
  BarChart3,
  Calendar,
  TrendingUp,
  Crown,
  AlertCircle,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getVotingResults,
  getVotingSummary,
  getVotingStatus,
  updateVotingPeriod,
  type CategoryVoteStats,
  type VotingSummary,
  type VotingStatus,
} from "@/apis/voting";

export default function VotingPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<CategoryVoteStats[]>([]);
  const [summary, setSummary] = useState<VotingSummary | null>(null);
  const [status, setStatus] = useState<VotingStatus | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resultsData, summaryData, statusData] = await Promise.all([
        getVotingResults(eventId),
        getVotingSummary(eventId),
        getVotingStatus(eventId),
      ]);
      setResults(resultsData);
      setSummary(summaryData);
      setStatus(statusData);
      // Expand first category by default
      if (resultsData.length > 0) {
        setExpandedCategories(new Set([resultsData[0].category_id]));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch voting data");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleToggleVoting = async () => {
    if (!status) return;

    setIsUpdatingStatus(true);
    try {
      const now = new Date();
      if (status.is_voting_active) {
        // Stop voting - set end date to now
        await updateVotingPeriod(
          eventId,
          status.voting_start_date,
          now.toISOString(),
        );
        toast.success("Voting stopped");
      } else {
        // Start voting - set start date to now, end date to 7 days from now
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await updateVotingPeriod(
          eventId,
          now.toISOString(),
          endDate.toISOString(),
        );
        toast.success("Voting started for 7 days");
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update voting status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-violet-950 via-purple-950 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="p-4 rounded-2xl bg-violet-500/20">
            <Skeleton className="h-8 w-8 bg-violet-400/50" />
          </div>
          <p className="text-white/60">Loading voting data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8 min-h-screen bg-linear-to-br from-violet-950 via-purple-950 to-purple-900 my-6 p-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-white">Voting Results</h1>
            <Badge className="bg-linear-to-r from-violet-500/30 to-purple-500/30 text-purple-200 border-purple-500/40">
              <Layers className="h-3 w-3 mr-1" />
              {summary?.total_categories || 0} Categories
            </Badge>
          </div>
          <p className="text-purple-200/70 mt-2 text-lg">
            Monitor voting progress and view results by category
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {status?.approval_status === "pending" && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1.5">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              Awaiting Approval
            </Badge>
          )}
          {status?.has_voting_period &&
            status?.approval_status !== "pending" && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleToggleVoting}
                  disabled={isUpdatingStatus}
                  variant={status?.is_voting_active ? "destructive" : "default"}
                  className={
                    status?.is_voting_active
                      ? "h-12 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl shadow-lg shadow-rose-500/25"
                      : "h-12 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25"
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
              </motion.div>
            )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <Card className="relative overflow-hidden bg-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-text-secondary text-sm font-medium">
                      Total Votes
                    </p>
                    <p className="text-3xl font-bold text-text-primary">
                      {summary?.total_votes.toLocaleString() || 0}
                    </p>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      {status?.is_voting_active ? (
                        <span className="text-emerald-400 font-medium">
                          Live
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <Card className="relative overflow-hidden bg-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group">
              <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-text-secondary text-sm font-medium">
                      Categories
                    </p>
                    <p className="text-3xl font-bold text-text-primary">
                      {summary?.total_categories || 0}
                    </p>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-white/60">Active categories</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <Card className="relative overflow-hidden bg-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-text-secondary text-sm font-medium">
                      Nominees
                    </p>
                    <p className="text-3xl font-bold text-text-primary">
                      {summary?.total_nominees || 0}
                    </p>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-white/60">Competing</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
            <Card className="relative overflow-hidden bg-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group">
              <div className="absolute inset-0 bg-linear-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-text-secondary text-sm font-medium">
                      Voting Status
                    </p>
                    <Badge
                      variant="secondary"
                      className={`${
                        status?.is_voting_active &&
                        status?.approval_status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : status?.is_voting_active &&
                              status?.approval_status !== "approved"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {status?.is_voting_active ? "Active" : "Inactive"}
                    </Badge>
                    {status?.has_voting_period && (
                      <div className="text-xs text-white/60 mt-1">
                        <p>Until {formatDate(status.voting_end_date)}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Top Nominees */}
      {summary && summary.leading_nominees.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-purple-surface border-violet-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/30">
                  <Crown className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    Top Nominees
                  </CardTitle>
                  <CardDescription className="text-text-secondary">
                    Leading nominees across all categories
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {summary.leading_nominees.map((nominee, index) => (
                  <motion.div
                    key={nominee.nominee_id}
                    whileHover={{ y: -4 }}
                    className={`relative p-5 rounded-2xl border ${
                      index === 0
                        ? "bg-linear-to-br from-amber-500/20 to-orange-500/20 border-amber-500/40"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    {index === 0 && (
                      <div className="absolute -top-3 -right-3 p-2 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 shadow-lg">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <Avatar
                        className={`h-20 w-20 border-2 ${index === 0 ? "border-amber-500/50" : "border-violet-500/30"}`}
                      >
                        <AvatarImage
                          src={nominee.nominee_image_url || undefined}
                        />
                        <AvatarFallback className="bg-violet-500/30 text-white text-lg font-semibold">
                          {nominee.nominee_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="mt-3 font-semibold text-white truncate w-full">
                        {nominee.nominee_name}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-2 bg-violet-500/20 border-violet-500/30 text-violet-300"
                      >
                        {nominee.category_name}
                      </Badge>
                      <p
                        className={`mt-3 text-3xl font-bold ${index === 0 ? "text-amber-400" : "text-violet-400"}`}
                      >
                        {nominee.votes_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/50">votes</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results by Category */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/30">
            <Target className="h-5 w-5 text-violet-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">Results by Category</h2>
        </div>

        {results.length === 0 ? (
          <Card className="bg-purple-surface border-violet-500/30">
            <CardContent className="p-12 text-center">
              <div className="p-4 rounded-2xl bg-violet-500/20 mb-4 inline-block">
                <AlertCircle className="h-12 w-12 text-violet-400" />
              </div>
              <p className="text-xl font-semibold text-white">
                No nominees found
              </p>
              <p className="text-purple-200/70 mt-2">
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
              <Card className="bg-purple border-violet-500/30 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/30">
                          <Zap className="h-4 w-4 text-violet-300" />
                        </div>
                        <CardTitle className="text-white text-lg">
                          {category.category_name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-violet-500/20 border-violet-500/30 text-violet-300"
                        >
                          {category.total_votes.toLocaleString()} votes
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/60">
                          {category.nominees.length} nominees
                        </span>
                        {expandedCategories.has(category.category_id) ? (
                          <ChevronUp className="h-5 w-5 text-white/60" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-white/60" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {category.nominees.map((nominee, index) => (
                        <motion.div
                          key={nominee.nominee_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl ${
                            index === 0 && nominee.votes_count > 0
                              ? "bg-linear-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40"
                              : "bg-white/5 border border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="shrink-0">
                              {index === 0 && nominee.votes_count > 0 ? (
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                                  1
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center text-white font-medium">
                                  {index + 1}
                                </div>
                              )}
                            </div>

                            <Avatar className="h-12 w-12 border-2 border-violet-500/30">
                              <AvatarImage
                                src={nominee.nominee_image_url || undefined}
                                alt={nominee.nominee_name}
                              />
                              <AvatarFallback className="bg-violet-500/30 text-white font-semibold">
                                {nominee.nominee_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-white truncate">
                                  {nominee.nominee_name}
                                </p>
                                <div className="text-right">
                                  <p className="font-bold text-white">
                                    {nominee.votes_count.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-white/50">
                                    {category.total_votes > 0
                                      ? `${nominee.percentage}%`
                                      : "0%"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${nominee.percentage}%`,
                                    }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className={`h-full rounded-full ${
                                      index === 0
                                        ? "bg-linear-to-r from-amber-500 to-orange-500"
                                        : "bg-linear-to-r from-violet-500 to-purple-500"
                                    }`}
                                  />
                                </div>
                                <code className="px-2 py-1 bg-violet-500/20 rounded text-xs text-violet-300 font-mono border border-violet-500/30">
                                  {nominee.unique_code}
                                </code>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
