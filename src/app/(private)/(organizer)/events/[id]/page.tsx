"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Wallet,
  ArrowLeft,
  Loader2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
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
    [openDeleteDialog]
  );

  const executeDeleteCategory = useCallback(async () => {
    await confirmDelete(async (id) => {
      setIsDeleting(id);
      try {
        await deleteCategory(id);
        toast.success("Category deleted successfully");
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        setFilteredCategories((prev) =>
          prev.filter((cat) => cat.id !== id)
        );
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
  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-purple-bg flex items-center justify-center">
        <p className="text-text-secondary">Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Button
          variant="ghost"
          className="mb-6 text-text-secondary hover:text-gold-primary"
          asChild
        >
          <Link href="/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>

        {/* Header Section */}
        <Card className="bg-purple-surface border-purple-accent/50 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Event Image */}
              <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden bg-purple-bg border border-purple-accent/30 flex-shrink-0">
                {event.event_image_url ? (
                  <Image
                    src={event.event_image_url}
                    alt={event.event_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Trophy className="h-12 w-12 text-text-tertiary" />
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">
                      {event.event_name}
                    </h1>
                    <p className="text-text-secondary max-w-2xl">
                      {event.event_description}
                    </p>
                  </div>

                  {/* Category Count */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gold-primary">
                      {categories.length}
                    </div>
                    <div className="text-sm text-text-secondary">
                      Categories
                    </div>
                  </div>
                </div>

                {/* Event Features */}
                <div className="flex gap-2 mt-4">
                  {event.enable_voting && (
                    <Badge
                      variant="outline"
                      className="bg-purple-accent/10 border-purple-accent/30 text-purple-accent"
                    >
                      <Trophy className="h-3 w-3 mr-1" />
                      Voting Enabled
                    </Badge>
                  )}
                  {event.enable_nominations && (
                    <Badge
                      variant="outline"
                      className="bg-purple-accent/10 border-purple-accent/30 text-purple-accent"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Nominations Enabled
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="bg-gold-primary/10 border-gold-primary/30 text-gold-primary"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />$
                    {event.amount_per_vote.toFixed(2)} per vote
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total Revenue */}
          <Card className="bg-purple-surface border-purple-accent/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-text-secondary flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gold-primary" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">$0.00</div>
              <p className="text-sm text-text-secondary mt-1">
                From all votes across all categories
              </p>
            </CardContent>
          </Card>

          {/* Withdrawable Earnings */}
          <Card className="bg-purple-surface border-purple-accent/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-text-secondary flex items-center gap-2">
                <Wallet className="h-5 w-5 text-success" />
                Withdrawable Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">$0.00</div>
              <p className="text-sm text-text-secondary mt-1">
                Available for withdrawal now
              </p>
              <Button
                className="mt-4 bg-gold-primary hover:bg-gold-dark text-text-tertiary"
                size="sm"
              >
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Categories Section */}
        <Card className="bg-purple-surface border-purple-accent/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-text-primary">
                  Categories
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">
                  Manage award categories and view nominees
                </p>
              </div>
              <AddCategorySheet eventId={eventId} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-purple-bg border-purple-accent/30 text-text-primary"
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
                                  categoryName: category.categoryName,
                                  categoryDescription:
                                    category.categoryDescription,
                                }}
                                onSuccess={handleCategoryUpdated}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteCategory(
                                    category.id,
                                    category.categoryName
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
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-accent/30">
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
                    className="border-purple-accent/30 text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-text-secondary px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="border-purple-accent/30 text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
    </div>
  );
}
