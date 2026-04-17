"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Tomame transformed our annual awards ceremony. The real-time voting kept our audience engaged, and the analytics gave us incredible insights into participant behavior.",
    author: "Sarah Mitchell",
    role: "Event Director",
    company: "Global Media Awards",
    rating: 5,
    initials: "SM",
    color: "bg-purple-accent",
  },
  {
    quote:
      "We used to spend weeks coordinating votes via email. With Tomame, we launched our student government election in under an hour. The students loved the experience!",
    author: "Dr. James Chen",
    role: "Dean of Students",
    company: "Westfield University",
    rating: 5,
    initials: "JC",
    color: "bg-gold-primary",
  },
  {
    quote:
      "The security features give us peace of mind. Fraud detection caught several duplicate votes automatically. Our board trusts the results completely.",
    author: "Michael Torres",
    role: "HR Director",
    company: "TechCorp Industries",
    rating: 5,
    initials: "MT",
    color: "bg-success",
  },
  {
    quote:
      "As a content creator, audience engagement is everything. Tomame helped me run fan-voted awards that boosted my community interaction by 300%.",
    author: "Emma Rodriguez",
    role: "YouTube Creator",
    company: "1.2M Subscribers",
    rating: 5,
    initials: "ER",
    color: "bg-purple-accent",
  },
  {
    quote:
      "The platform is incredibly intuitive. Our non-technical team was able to set up a complex multi-category competition without any training.",
    author: "David Park",
    role: "Marketing Manager",
    company: "StartupWeek Events",
    rating: 5,
    initials: "DP",
    color: "bg-gold-primary",
  },
  {
    quote:
      "Customer support is phenomenal. When we had a last-minute issue during our live event, the team resolved it within minutes. True partners!",
    author: "Lisa Thompson",
    role: "Event Coordinator",
    company: "Community Foundation",
    rating: 5,
    initials: "LT",
    color: "bg-success",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-purple-bg relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-gold-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Loved by Event
            <span className="block">Organizers Worldwide</span>
          </h2>
          <p className="text-lg text-text-secondary">
            See what our customers have to say about their experience 
            with Tomame voting events.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="group bg-purple-surface border-purple-accent/20 hover:border-purple-accent/40 transition-all duration-300"
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="h-8 w-8 text-gold-primary/30" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-gold-primary text-gold-primary"
                    />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-text-secondary leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-purple-accent/20">
                  <Avatar className={`h-10 w-10 ${testimonial.color}`}>
                    <AvatarFallback className="text-text-primary font-semibold text-sm">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-12 border-t border-purple-accent/20">
          <p className="text-center text-text-secondary text-sm mb-8">
            Trusted by leading organizations worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            {["Google", "Microsoft", "Amazon", "Meta", "Apple"].map(
              (company, index) => (
                <div
                  key={index}
                  className="text-text-secondary/50 font-bold text-lg lg:text-xl hover:text-text-secondary/80 transition-colors"
                >
                  {company}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
