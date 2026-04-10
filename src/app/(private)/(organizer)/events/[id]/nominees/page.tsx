"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddNomineeSheet } from "@/components/forms/add-nominee-sheet";
import {
  getEventNominees,
  getEventCategoriesForNominees,
  deleteNominee,
  type NomineeWithCategory,
} from "@/apis/nominees";

interface Category {
  id: string;
  category_name: string;
}

export default function NomineesPage() {
  const params = useParams();
  const eventId = params.id as string;

  // State
  const [nominees, setNominees] = useState<NomineeWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingNominee, setEditingNominee] =
    useState<NomineeWithCategory | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingNominee, setDeletingNominee] =
    useState<NomineeWithCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 10;

  // Fetch nominees
  const fetchNominees = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEventNominees(eventId, {
        page,
        limit,
        search: searchQuery || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      });
      setNominees(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch nominees");
    } finally {
      setLoading(false);
    }
  }, [eventId, page, searchQuery, categoryFilter]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await getEventCategoriesForNominees(eventId);
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch categories");
    }
  }, [eventId]);

  useEffect(() => {
    fetchNominees();
  }, [fetchNominees]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter]);

  // Open add sheet
  const handleAddClick = () => {
    setEditingNominee(null);
    setIsSheetOpen(true);
  };

  // Open edit sheet
  const handleEditClick = (nominee: NomineeWithCategory) => {
    setEditingNominee(nominee);
    setIsSheetOpen(true);
  };

  // Handle successful save
  const handleSaveSuccess = () => {
    fetchNominees();
  };

  // Handle delete click
  const handleDeleteClick = (nominee: NomineeWithCategory) => {
    setDeletingNominee(nominee);
    setDeleteDialogOpen(true);
  };

  // Execute delete
  const executeDelete = async () => {
    if (!deletingNominee) return;

    setIsDeleting(true);
    try {
      await deleteNominee(deletingNominee.id);
      toast.success("Nominee deleted successfully");
      setDeleteDialogOpen(false);
      fetchNominees();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete nominee");
    } finally {
      setIsDeleting(false);
      setDeletingNominee(null);
    }
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

  return (
    <motion.div
      className="space-y-8 min-h-screen bg-linear-to-br from-violet-950 via-purple-950 to-purple-900 -m-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-linear-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Nominees
              </h1>
              <Badge className="bg-linear-to-r from-violet-500/30 to-purple-500/30 text-purple-200 border-purple-500/40">
                <Layers className="h-3 w-3 mr-1" />
                {total} Total
              </Badge>
            </div>
            <p className="text-purple-200/70 mt-2 text-lg">
              Manage nominees for this event
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAddClick}
              className="h-12 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-violet-500/25"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Nominee
            </Button>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="bg-purple-surface border-violet-500/30">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-violet-500/20">
                    <Search className="h-4 w-4 text-violet-400" />
                  </div>
                  <Input
                    placeholder="Search by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20">
                    <Filter className="h-4 w-4 text-violet-400" />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[220px] h-12 bg-white/5 border-white/10 text-white rounded-xl">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-950/95 backdrop-blur-xl border-violet-500/30 rounded-xl">
                      <SelectItem
                        value="all"
                        className="text-white/90 focus:bg-violet-500/20 focus:text-white rounded-lg mx-1 my-0.5"
                      >
                        All Categories
                      </SelectItem>
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="text-white/90 focus:bg-violet-500/20 focus:text-white rounded-lg mx-1 my-0.5"
                        >
                          {cat.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="bg-purple-surface border-violet-500/30 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60 font-medium">
                      Photo
                    </TableHead>
                    <TableHead className="text-white/60 font-medium">
                      Full Name
                    </TableHead>
                    <TableHead className="text-white/60 font-medium">
                      Category
                    </TableHead>
                    <TableHead className="text-white/60 font-medium">
                      Unique Code
                    </TableHead>
                    <TableHead className="text-white/60 font-medium">
                      Votes
                    </TableHead>
                    <TableHead className="text-white/60 font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-white/10">
                        <TableCell>
                          <Skeleton className="h-12 w-12 rounded-full bg-violet-500/20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32 bg-violet-500/20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24 bg-violet-500/20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 bg-violet-500/20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-12 bg-violet-500/20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-10 w-10 rounded-xl bg-violet-500/20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : nominees.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="p-4 rounded-2xl bg-violet-500/20 mb-4 inline-block">
                          <User className="h-12 w-12 text-violet-400" />
                        </div>
                        <p className="text-xl font-semibold text-white">
                          No nominees found
                        </p>
                        <p className="mt-2 text-purple-200/70">
                          {searchQuery || categoryFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Get started by adding your first nominee"}
                        </p>
                        {!searchQuery && categoryFilter === "all" && (
                          <Button
                            onClick={handleAddClick}
                            variant="outline"
                            className="mt-6 h-12 px-6 border-violet-400/40 text-violet-300 hover:bg-violet-500/20 hover:text-white rounded-xl"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Nominee
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    nominees.map((nominee) => (
                      <TableRow
                        key={nominee.id}
                        className="border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="font-semibold text-white">
                          {nominee.nominee_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-violet-500/20 border-violet-500/30 text-violet-300"
                          >
                            {nominee.category?.category_name || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="px-3 py-1.5 bg-violet-500/20 rounded-lg text-sm text-violet-300 font-mono border border-violet-500/30">
                            {nominee.unique_code}
                          </code>
                        </TableCell>
                        <TableCell className="text-white/80 font-medium">
                          {nominee.votes_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-violet-950/95 backdrop-blur-xl border-violet-500/30 rounded-xl"
                            >
                              <DropdownMenuItem
                                onClick={() => handleEditClick(nominee)}
                                className="text-white/90 focus:bg-violet-500/20 focus:text-white rounded-lg mx-1 my-0.5 cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(nominee)}
                                className="text-rose-400 focus:bg-rose-500/20 focus:text-rose-300 rounded-lg mx-1 my-0.5 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-5 border-t border-white/10">
                <p className="text-sm text-white/60">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} nominees
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-10 px-4 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Add/Edit Sheet */}
        <AddNomineeSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onSuccess={handleSaveSuccess}
          eventId={eventId}
          categories={categories}
          editingNominee={editingNominee}
        />
      </div>
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-linear-to-br from-violet-950 to-purple-900 border-violet-500/30 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-rose-500/20">
                <Trash2 className="h-6 w-6 text-rose-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                Delete Nominee
              </DialogTitle>
            </div>
            <DialogDescription className="text-purple-200/70 text-base">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">
                &quot;{deletingNominee?.nominee_name}&quot;
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-12 px-6 border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={executeDelete}
              disabled={isDeleting}
              className="h-12 px-6 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl shadow-lg shadow-rose-500/25 transition-all"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
