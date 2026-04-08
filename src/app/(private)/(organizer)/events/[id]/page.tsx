"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Users,
  DollarSign,
  Wallet, Loader2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Layers,
  Calendar,
  Target,
  Zap
} from "lucide-react";
import { AddCategorySheet } from "@/components/events/add-category-sheet";
import { EditCategorySheet } from "@/components/events/edit-category-sheet";
import {
  useDeleteConfirmation,
  DeleteConfirmationDialog,
} from "@/components/ui/delete-confirmation-dialog";
import {
  getEventById,
  getCategoriesWithNominees,
  deleteCategory,
} from "@/apis/events";
import { CategoryWithNominees } from "@/lib/validations/category";
import { Event } from "@/lib/validations/event";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const PAGE_SIZE = 10;

export default function EventDetailsPage({ params }: PageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<CategoryWithNominees[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<
    CategoryWithNominees[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string>("");

  const {
    isOpen: isDeleteDialogOpen,
    itemToDelete,
    isDeleting: isDeleteDialogLoading,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useDeleteConfirmation();

  useEffect(() => {
    async function fetchData() {
      try {
        const { id } = await params;
        setEventId(id);

        const [eventData, categoriesData] = await Promise.all([
          getEventById(id),
          getCategoriesWithNominees(id),
        ]);

        setEvent(eventData);
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params]);

  const handleDeleteCategory = useCallback(
    async (categoryId: string, categoryName: string) => {
      openDeleteDialog(categoryId, categoryName);
    },
    [openDeleteDialog],
  );

  const executeDeleteCategory = useCallback(async () => {
    await confirmDelete(async (id) => {
      setIsDeleting(id);
      try {
        await deleteCategory(id);
        toast.success("Category deleted successfully");
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        setFilteredCategories((prev) => prev.filter((cat) => cat.id !== id));
      } catch (error: any) {
        console.error("Error deleting category:", error);
        toast.error(error.message || "Failed to delete category");
      } finally {
        setIsDeleting(null);
      }
    });
  }, [confirmDelete]);

  const handleCategoryUpdated = useCallback(async () => {
    if (!eventId) return;
    try {
      const categoriesData = await getCategoriesWithNominees(eventId);
      setCategories(categoriesData);
      // Re-apply search filter
      if (searchQuery.trim()) {
        const filtered = categoriesData.filter(
          (cat) =>
            cat.categoryName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (cat.categoryDescription
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ??
              false),
        );
        setFilteredCategories(filtered);
      } else {
        setFilteredCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error refreshing categories:", error);
    }
  }, [eventId, searchQuery]);

  // Filter categories based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = categories.filter(
        (cat) =>
          cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.categoryDescription
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ??
            false),
      );
      setFilteredCategories(filtered);
      setPage(1);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE);
  const paginatedCategories = filteredCategories.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="p-4 rounded-2xl bg-violet-500/20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
          <p className="text-white/60">Loading event details...</p>
        </motion.div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="p-4 rounded-2xl bg-rose-500/20 mb-4 inline-block">
            <Target className="h-8 w-8 text-rose-400" />
          </div>
          <p className="text-xl text-white font-medium">Event not found</p>
          <p className="text-white/60 mt-2">The event you're looking for doesn't exist.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-purple-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 border-violet-500/30 mb-8 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Event Image */}
                <div className="relative w-full md:w-56 h-36 rounded-2xl overflow-hidden ring-2 ring-violet-500/30 flex-shrink-0">
                  {event.event_image_url ? (
                    <Image
                      src={event.event_image_url}
                      alt={event.event_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-violet-500/20">
                      <Trophy className="h-12 w-12 text-violet-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Badge>
                  </div>
                </div>

                {/* Event Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                          {event.event_name}
                        </h1>
                        <Badge className="bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-purple-200 border-purple-500/40">
                          <Layers className="h-3 w-3 mr-1" />
                          {categories.length} Categories
                        </Badge>
                      </div>
                      <p className="text-purple-200/70 max-w-2xl text-lg">
                        {event.event_description}
                      </p>
                    </div>
                  </div>

                  {/* Event Features */}
                  <div className="flex flex-wrap gap-3 mt-5">
                    {event.enable_voting && (
                      <Badge
                        variant="outline"
                        className="bg-violet-500/20 border-violet-500/40 text-violet-300 px-3 py-1"
                      >
                        <Trophy className="h-3.5 w-3.5 mr-1.5" />
                        Voting Enabled
                      </Badge>
                    )}
                    {event.enable_nominations && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/20 border-amber-500/40 text-amber-300 px-3 py-1"
                      >
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Nominations Enabled
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/20 border-emerald-500/40 text-emerald-300 px-3 py-1"
                    >
                      <span className="text-lg mr-1">₵</span>
                      {event.amount_per_vote.toFixed(2)} per vote
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-purple-500/20 border-purple-500/40 text-purple-300 px-3 py-1"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      {event.approval_status === 'approved' ? 'Approved' : event.approval_status === 'pending' ? 'Pending' : 'Rejected'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Total Revenue */}
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-surface to-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-text-secondary text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold text-text-primary">₵0.00</p>
                      <div className="flex items-center gap-1 text-xs">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">+0%</span>
                        <span className="text-text-tertiary">this week</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mt-4">
                    From all votes across all categories
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Withdrawable Earnings */}
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-surface to-purple-surface/80 border-purple-accent/30 hover:border-purple-accent/60 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-text-secondary text-sm font-medium">Withdrawable Earnings</p>
                      <p className="text-3xl font-bold text-text-primary">₵0.00</p>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-text-tertiary">Available now</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Button
                    className="mt-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-violet-500/25"
                    size="sm"
                  >
                    Withdraw Funds
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Categories Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-purple-surface to-purple-surface/90 border-purple-accent/30">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/30">
                  <Zap className="h-5 w-5 text-purple-300" />
                </div>
                <div>
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    Categories
                  </CardTitle>
                  <CardDescription className="text-text-secondary">
                    Manage award categories and view nominees
                  </CardDescription>
                </div>
              </div>
              <AddCategorySheet eventId={eventId} />
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-violet-500/20">
                  <Search className="h-4 w-4 text-violet-400" />
                </div>
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
                />
              </div>

            {/* Categories Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-accent/30 hover:bg-transparent">
                    <TableHead className="text-text-secondary">
                      Category Name
                    </TableHead>
                    <TableHead className="text-text-secondary">
                      Total Nominees
                    </TableHead>
                    <TableHead className="text-text-secondary">
                      Created
                    </TableHead>
                    <TableHead className="text-text-secondary text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-text-secondary"
                      >
                        No categories yet. Add your first category to get
                        started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCategories.map(
                      (category: CategoryWithNominees) => (
                        <TableRow
                          key={category.id}
                          className="border-purple-accent/20 hover:bg-purple-accent/10"
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-text-primary">
                                {category.categoryName}
                              </p>
                              {category.categoryDescription && (
                                <p className="text-sm text-text-secondary line-clamp-1">
                                  {category.categoryDescription}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-purple-accent/10 border-purple-accent/30 text-purple-accent"
                            >
                              {category.totalNominees} nominees
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-text-secondary">
                              {new Date(category.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <EditCategorySheet
                                categoryId={category.id}
                                eventId={eventId}
                                defaultValues={{
                                  categoryName: category.categoryName
                                }}
                                onSuccess={handleCategoryUpdated}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteCategory(
                                    category.id,
                                    category.categoryName,
                                  )
                                }
                                disabled={
                                  isDeleting === category.id ||
                                  category.totalNominees > 0
                                }
                                className="h-8 w-8 p-0 text-text-secondary hover:text-error disabled:opacity-50"
                                title={
                                  category.totalNominees > 0
                                    ? "Cannot delete: has nominees"
                                    : "Delete category"
                                }
                              >
                                {isDeleting === category.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-text-secondary">
                    Showing {(page - 1) * PAGE_SIZE + 1} -{" "}
                    {Math.min(page * PAGE_SIZE, filteredCategories.length)} of{" "}
                    {filteredCategories.length} categories
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="h-10 px-4 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-white/60 px-3 py-1.5 bg-white/10 rounded-lg">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="h-10 px-4 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={executeDeleteCategory}
        title="Delete Category"
        description="This action cannot be undone. All associated nominees and their votes will also be removed."
        itemName={itemToDelete?.name}
        isDeleting={isDeleteDialogLoading}
      />
    </motion.div>
  );
}
