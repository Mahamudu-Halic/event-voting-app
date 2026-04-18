import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getPublicEventAndCategory,
  getPublicNomineesByCategory,
  getPublicVotingStatus,
} from "@/apis/events";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trophy, ChevronLeft, Ticket, TrendingUp, User } from "lucide-react";

import { VoteDialog } from "@/components/events/vote-dialog";

interface Props {
  params: Promise<{ id: string; categoryId: string }>;
  searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, categoryId } = await params;
  const { category } = await getPublicEventAndCategory(id, categoryId);
  return {
    title: category?.categoryName || "Nominees",
    description: category?.categoryDescription || "View nominees and cast your vote",
  };
}

export default async function NomineesPage({ params, searchParams }: Props) {
  const { id, categoryId } = await params;
  const { search } = await searchParams;

  const { event, category } = await getPublicEventAndCategory(id, categoryId);
  const nominees = await getPublicNomineesByCategory(categoryId, search);
  const votingStatus = await getPublicVotingStatus(id);
  const isLive = votingStatus.is_voting_active;

  if (!event) {
    notFound();
  }

  if (!category) {
    return (
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Category Not Found</h1>
          <p className="text-text-secondary mb-6">
            This category does not exist or is not available.
          </p>
          <Button asChild className="bg-gold-primary text-text-tertiary hover:bg-gold-dark">
            <Link href={`/events/${id}`}>Back to Event</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/events" className="hover:text-gold-primary transition-colors">
            Events
          </Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <Link href={`/events/${id}`} className="hover:text-gold-primary transition-colors">
            {event.eventName}
          </Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <span className="text-text-primary">{category.categoryName}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
                  <Ticket className="h-4 w-4" />
                  Live Voting
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-accent/20 text-purple-accent text-sm font-medium">
                <span className="font-bold">₵</span>
                ₵{event.amountPerVote.toFixed(2)} per vote
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
              {category.categoryName}
            </h1>
            <p className="text-text-secondary max-w-2xl">
              {category.categoryDescription || "Cast your vote for your favorite nominee"}
            </p>
          </div>

          {/* Search */}
          <form className="flex gap-2" action={`/events/${id}/norminees/${categoryId}`} method="GET">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                type="search"
                name="search"
                placeholder="Search nominees..."
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
                <Link href={`/events/${id}/norminees/${categoryId}`}>Clear</Link>
              </Button>
            )}
          </form>
        </div>

        {/* Nominees Grid */}
        {nominees.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nominees.map((nominee) => (
              <Card
                key={nominee.id}
                className="group bg-purple-surface border-purple-accent/20 hover:border-gold-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Nominee Image */}
                <div className="relative aspect-square overflow-hidden bg-purple-bg">
                  {nominee.nomineeImageUrl ? (
                    <Image
                      src={nominee.nomineeImageUrl}
                      alt={nominee.nomineeName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-purple-accent/20 to-gold-primary/20">
                      <User className="h-16 w-16 text-text-secondary/30" />
                    </div>
                  )}
                  {/* Votes Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-bg/80 backdrop-blur-sm text-text-primary text-xs font-medium">
                      <TrendingUp className="h-3.5 w-3.5 text-gold-primary" />
                      {nominee.votesCount.toLocaleString()} votes
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Name */}
                  <h3 className="font-semibold text-text-primary mb-2 line-clamp-1">
                    {nominee.nomineeName}
                  </h3>

                 

                  {/* Unique Code */}
                  <div className="text-xs text-text-secondary mb-4">
                    Code: <span className="font-mono text-text-primary">{nominee.uniqueCode}</span>
                  </div>

                  {/* Vote Button with Dialog */}
                  <VoteDialog
                    nominee={nominee}
                    eventId={id}
                    amountPerVote={event.amountPerVote}
                    serviceFee={event.serviceFee}
                    isLive={isLive}
                    currency={(process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY as "GHS" | "NGN") || "NGN"}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-purple-surface/50 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-purple-bg flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {search ? "No nominees found" : "No nominees yet"}
            </h3>
            <p className="text-text-secondary max-w-md mx-auto">
              {search
                ? `No nominees match your search "${search}".`
                : "Nominees will be added to this category soon."}
            </p>
          </div>
        )}

        {/* Results Count */}
        {nominees.length > 0 && (
          <div className="mt-6 text-center text-sm text-text-secondary">
            Showing {nominees.length} nominee{nominees.length !== 1 ? "s" : ""}
            {search && ` for "${search}"`}
          </div>
        )}
      </div>
    </div>
  );
}