"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AddNomineeSheet } from "@/components/forms/add-nominee-sheet"
import {
  getEventNominees,
  getEventCategoriesForNominees,
  deleteNominee,
  type NomineeWithCategory,
} from "@/apis/nominees"

interface Category {
  id: string
  category_name: string
}

export default function NomineesPage() {
  const params = useParams()
  const eventId = params.id as string

  // State
  const [nominees, setNominees] = useState<NomineeWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingNominee, setEditingNominee] = useState<NomineeWithCategory | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingNominee, setDeletingNominee] = useState<NomineeWithCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const limit = 10

  // Fetch nominees
  const fetchNominees = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getEventNominees(eventId, {
        page,
        limit,
        search: searchQuery || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      })
      setNominees(result.data)
      setTotalPages(result.totalPages)
      setTotal(result.total)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch nominees")
    } finally {
      setLoading(false)
    }
  }, [eventId, page, searchQuery, categoryFilter])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await getEventCategoriesForNominees(eventId)
      setCategories(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch categories")
    }
  }, [eventId])

  useEffect(() => {
    fetchNominees()
  }, [fetchNominees])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, categoryFilter])

  // Open add sheet
  const handleAddClick = () => {
    setEditingNominee(null)
    setIsSheetOpen(true)
  }

  // Open edit sheet
  const handleEditClick = (nominee: NomineeWithCategory) => {
    setEditingNominee(nominee)
    setIsSheetOpen(true)
  }

  // Handle successful save
  const handleSaveSuccess = () => {
    fetchNominees()
  }

  // Handle delete click
  const handleDeleteClick = (nominee: NomineeWithCategory) => {
    setDeletingNominee(nominee)
    setDeleteDialogOpen(true)
  }

  // Execute delete
  const executeDelete = async () => {
    if (!deletingNominee) return

    setIsDeleting(true)
    try {
      await deleteNominee(deletingNominee.id)
      toast.success("Nominee deleted successfully")
      setDeleteDialogOpen(false)
      fetchNominees()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete nominee")
    } finally {
      setIsDeleting(false)
      setDeletingNominee(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nominees</h1>
          <p className="text-text-secondary mt-1">
            Manage nominees for this event. Total: {total}
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          className="bg-gold-primary text-purple-bg hover:bg-gold-hover"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Nominee
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-purple-surface border-purple-accent/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-purple-bg border-purple-accent/50 text-text-primary placeholder:text-text-tertiary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-secondary" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px] bg-purple-bg border-purple-accent/50 text-text-primary">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-purple-surface border-purple-accent/50">
                  <SelectItem value="all" className="text-text-primary">
                    All Categories
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-text-primary"
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

      {/* Table */}
      <Card className="bg-purple-surface border-purple-accent/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-purple-accent/30 hover:bg-transparent">
                <TableHead className="text-text-secondary">Photo</TableHead>
                <TableHead className="text-text-secondary">Full Name</TableHead>
                <TableHead className="text-text-secondary">Category</TableHead>
                <TableHead className="text-text-secondary">Unique Code</TableHead>
                <TableHead className="text-text-secondary">Votes</TableHead>
                <TableHead className="text-text-secondary text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-purple-accent/30">
                    <TableCell>
                      <Skeleton className="h-10 w-10 rounded-full bg-purple-accent/30" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32 bg-purple-accent/30" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 bg-purple-accent/30" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 bg-purple-accent/30" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 bg-purple-accent/30" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded bg-purple-accent/30 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : nominees.length === 0 ? (
                <TableRow className="border-purple-accent/30">
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-text-secondary"
                  >
                    <User className="h-12 w-12 mx-auto mb-3 text-text-tertiary" />
                    <p className="text-lg font-medium text-text-primary">
                      No nominees found
                    </p>
                    <p className="mt-1">
                      {searchQuery || categoryFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Get started by adding your first nominee"}
                    </p>
                    {!searchQuery && categoryFilter === "all" && (
                      <Button
                        onClick={handleAddClick}
                        variant="outline"
                        className="mt-4 border-gold-primary text-gold-primary hover:bg-gold-primary/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Nominee
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                nominees.map((nominee) => (
                  <TableRow
                    key={nominee.id}
                    className="border-purple-accent/30 hover:bg-purple-accent/10"
                  >
                    <TableCell>
                      <Avatar className="h-10 w-10 border border-purple-accent/30">
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
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {nominee.nominee_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-purple-accent/30 text-text-primary border-purple-accent/30"
                      >
                        {nominee.category?.category_name || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-purple-bg rounded text-sm text-gold-primary font-mono">
                        {nominee.unique_code}
                      </code>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {nominee.votes_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-text-secondary hover:text-text-primary hover:bg-purple-accent/20"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-purple-surface border-purple-accent/50"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEditClick(nominee)}
                            className="text-text-primary hover:bg-purple-accent/20 focus:bg-purple-accent/20"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(nominee)}
                            className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
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
          <div className="flex items-center justify-between px-4 py-4 border-t border-purple-accent/30">
            <p className="text-sm text-text-secondary">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, total)} of {total} nominees
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-purple-accent/50 text-text-primary hover:bg-purple-accent/20 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-purple-accent/50 text-text-primary hover:bg-purple-accent/20 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Sheet */}
      <AddNomineeSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSuccess={handleSaveSuccess}
        eventId={eventId}
        categories={categories}
        editingNominee={editingNominee}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-purple-surface border-purple-accent/50">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Delete Nominee</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Are you sure you want to delete "{deletingNominee?.nominee_name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-purple-accent/50 text-text-primary hover:bg-purple-accent/20"
            >
              Cancel
            </Button>
            <Button
              onClick={executeDelete}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}