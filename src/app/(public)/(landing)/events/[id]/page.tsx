import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicEventDetails, getPublicEventCategories, getPublicVotingStatus } from "@/apis/events";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Calendar,
  Users,
  Ticket,
  ArrowRight,
  Trophy,
  Clock,
  Info,
  ChevronLeft,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublicEventDetails(id);
  return {
    title: event?.eventName || "Event Details",
    description: event?.eventDescription || "View event details and categories",
  };
}

export default async function EventPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { search } = await searchParams;

  const event = await getPublicEventDetails(id)
  const categories = await getPublicEventCategories(id, search)
  const votingStatus = await getPublicVotingStatus(id);

  if (!event) {
    notFound();
  }

  const isLive = votingStatus.is_voting_active;

  // Format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalNominees = categories.reduce((sum, cat) => sum + cat.nomineesCount, 0);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-gold-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>

        {/* Event Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Event Image */}
          <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-purple-surface">
            {event.eventImageUrl ? (
              <Image
                src={event.eventImageUrl}
                alt={event.eventName}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-purple-accent/20 to-gold-primary/20">
                <Calendar className="h-20 w-20 text-text-secondary/30" />
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
                  <Ticket className="h-4 w-4" />
                  Live Voting
                </span>
              )}
              {event.enableNominations && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-accent/20 text-purple-accent text-sm font-medium">
                  <Trophy className="h-4 w-4" />
                  Nominations Open
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
              {event.eventName}
            </h1>
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2 text-text-secondary">
                <Trophy className="h-5 w-5 text-gold-primary" />
                <span>{categories.length} Categories</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Users className="h-5 w-5 text-gold-primary" />
                <span>{totalNominees} Nominees</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="text-gold-primary font-bold text-lg">₵</span>
                <span>₵{event.amountPerVote.toFixed(2)} per vote</span>
              </div>
            </div>

            {/* View Details Sheet Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-fit border-purple-accent text-text-primary hover:bg-purple-surface"
                >
                  <Info className="mr-2 h-4 w-4" />
                  View Full Details
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-purple-bg border-purple-accent/30 w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="text-text-primary">Event Details</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Event Image */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-purple-surface">
                    {event.eventImageUrl ? (
                      <Image
                        src={event.eventImageUrl}
                        alt={event.eventName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-purple-accent/20 to-gold-primary/20">
                        <Calendar className="h-12 w-12 text-text-secondary/30" />
                      </div>
                    )}
                  </div>

                  {/* Event Name */}
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">
                      {event.eventName}
                    </h2>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-2">
                      Description
                    </h3>
                    <p className="text-text-primary">
                      {event.eventDescription || "No description available"}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-secondary">
                      Timeline
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {event.enableNominations && (
                        <>
                          <div className="bg-purple-surface rounded-lg p-3">
                            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                              <Trophy className="h-4 w-4" />
                              Nominations Start
                            </div>
                            <p className="text-text-primary font-medium">
                              {formatDate(event.nominationStartDate)}
                            </p>
                          </div>
                          <div className="bg-purple-surface rounded-lg p-3">
                            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                              <Clock className="h-4 w-4" />
                              Nominations End
                            </div>
                            <p className="text-text-primary font-medium">
                              {formatDate(event.nominationEndDate)}
                            </p>
                          </div>
                        </>
                      )}
                      <div className="bg-purple-surface rounded-lg p-3">
                        <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                          <Ticket className="h-4 w-4" />
                          Voting Start
                        </div>
                        <p className="text-text-primary font-medium">
                          {formatDate(event.votingStartDate)}
                        </p>
                      </div>
                      <div className="bg-purple-surface rounded-lg p-3">
                        <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                          <Clock className="h-4 w-4" />
                          Voting End
                        </div>
                        <p className="text-text-primary font-medium">
                          {formatDate(event.votingEndDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-purple-surface rounded-lg p-4">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">
                      Pricing
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Amount per vote</span>
                        <span className="text-text-primary font-medium">
                          ₵{event.amountPerVote.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Service fee</span>
                        <span className="text-text-primary font-medium">
                          {event.serviceFee}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Categories Section */}
        <div className="border-t border-purple-accent/20 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Categories
              </h2>
              <p className="text-text-secondary">
                Browse categories and vote for your favorite nominees
              </p>
            </div>

            {/* Search */}
            <form className="flex gap-2" action={`/events/${id}`} method="GET">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Search categories..."
                  defaultValue={search || ""}
                  className="pl-9 w-64 bg-purple-surface border-purple-accent/30 text-text-primary placeholder:text-text-secondary focus-visible:ring-gold-primary"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
              >
                Search
              </Button>
              {search && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-purple-accent text-text-primary hover:bg-purple-surface"
                  asChild
                >
                  <Link href={`/events/${id}`}>Clear</Link>
                </Button>
              )}
            </form>
          </div>

          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/events/${id}/norminees/${category.id}`}
                >
                  <Card className="group h-full bg-purple-surface border-purple-accent/20 hover:border-gold-primary/50 transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gold-primary/10 flex items-center justify-center group-hover:bg-gold-primary/20 transition-colors">
                          <Trophy className="h-6 w-6 text-gold-primary" />
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-accent/10 text-purple-accent text-xs font-medium">
                          <Users className="h-3 w-3" />
                          {category.nomineesCount}
                        </span>
                      </div>

                      <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-gold-primary transition-colors">
                        {category.categoryName}
                      </h3>

                      <div className="flex items-center justify-between pt-3 border-t border-purple-accent/20">
                        <span className="text-sm text-text-secondary">
                          View Nominees
                        </span>
                        <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-gold-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-purple-surface/50 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-purple-bg flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {search ? "No categories found" : "No categories yet"}
              </h3>
              <p className="text-text-secondary max-w-md mx-auto">
                {search
                  ? `No categories match your search "${search}".`
                  : "Categories will be added to this event soon."}
              </p>
            </div>
          )}

          {/* Results Count */}
          {categories.length > 0 && (
            <div className="mt-6 text-center text-sm text-text-secondary">
              Showing {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
              {search && ` for "${search}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}