import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicEvents } from "@/apis/events";
import { isEventLive } from "@/lib/event-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Ticket, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse all upcoming and ongoing voting events. Find awards, competitions, and contests to participate in.",
};

interface EventsPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { search } = await searchParams;
  const events = await getPublicEvents(search);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            All Events
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Discover and participate in exciting voting events. From awards to competitions, 
            find the perfect event for you.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <form className="flex gap-3" action="/events" method="GET">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <Input
                type="search"
                name="search"
                placeholder="Search events by name..."
                defaultValue={search || ""}
                className="pl-10 h-12 bg-purple-surface border-purple-accent/30 text-text-primary placeholder:text-text-secondary focus-visible:ring-gold-primary"
              />
            </div>
            <Button
              type="submit"
              className="bg-gold-primary text-text-tertiary hover:bg-gold-dark h-12 px-6"
            >
              Search
            </Button>
            {search && (
              <Button
                type="button"
                variant="outline"
                className="border-purple-accent text-text-primary hover:bg-purple-surface h-12 px-4"
                asChild
              >
                <Link href="/events">Clear</Link>
              </Button>
            )}
          </form>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="group h-full bg-purple-surface border-purple-accent/20 hover:border-gold-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  {/* Event Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-purple-bg">
                    {event.eventImageUrl ? (
                      <Image
                        src={event.eventImageUrl}
                        alt={event.eventName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-accent/20 to-gold-primary/20">
                        <Calendar className="h-12 w-12 text-text-secondary/50" />
                      </div>
                    )}
                    {/* Badge - Only show if event is live */}
                    {isEventLive(event) && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                          <Ticket className="h-3.5 w-3.5" />
                          Live
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Title */}
                    <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-gold-primary transition-colors">
                      {event.eventName}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                      {event.eventDescription || "No description available"}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-purple-accent/20">
                      <div className="text-sm">
                        <span className="text-text-secondary">Per vote: </span>
                        <span className="text-gold-primary font-medium">
                          ₵{event.amountPerVote.toFixed(2)}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-gold-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-purple-surface flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {search ? "No events found" : "No events yet"}
            </h3>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              {search
                ? `No events match your search "${search}". Try different keywords or browse all events.`
                : "There are no approved events at the moment. Check back soon for exciting new events!"}
            </p>
            {search && (
              <Button
                variant="outline"
                className="border-purple-accent text-text-primary hover:bg-purple-surface"
                asChild
              >
                <Link href="/events">View All Events</Link>
              </Button>
            )}
          </div>
        )}

        {/* Results Count */}
        {events.length > 0 && (
          <div className="mt-8 text-center text-sm text-text-secondary">
            Showing {events.length} event{events.length !== 1 ? "s" : ""}
            {search && ` for "${search}"`}
          </div>
        )}
      </div>
    </div>
  );
}