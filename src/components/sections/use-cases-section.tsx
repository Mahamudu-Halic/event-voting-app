"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  GraduationCap,
  Building2,
  Music,
  Heart,
  Trophy,
  Mic2,
  Film,
} from "lucide-react";

const useCases = [
  {
    icon: Award,
    title: "Award Shows",
    description:
      "Host professional award ceremonies with multiple categories, celebrity nominees, and red-carpet-worthy presentations.",
    examples: ["Film Awards", "Music Awards", "Industry Excellence"],
  },
  {
    icon: GraduationCap,
    title: "Schools & Universities",
    description:
      "Run student elections, talent competitions, and academic awards with secure, age-appropriate voting systems.",
    examples: ["Student Government", "Talent Shows", "Academic Awards"],
  },
  {
    icon: Building2,
    title: "Corporate Events",
    description:
      "Engage employees with recognition awards, innovation challenges, and internal competitions that boost morale.",
    examples: ["Employee Awards", "Hackathons", "Innovation Challenges"],
  },
  {
    icon: Music,
    title: "Music & Entertainment",
    description:
      "Let fans vote for their favorite artists, songs, and performances with engaging, social-friendly experiences.",
    examples: ["Battle of the Bands", "Song Contests", "Fan Awards"],
  },
  {
    icon: Heart,
    title: "Nonprofits & Communities",
    description:
      "Drive engagement for fundraising events, community awards, and recognition programs that bring people together.",
    examples: ["Fundraising Events", "Community Awards", "Recognition Programs"],
  },
  {
    icon: Trophy,
    title: "Sports & Competitions",
    description:
      "Manage athlete awards, team competitions, and fan-voted recognitions with fair and transparent voting.",
    examples: ["MVP Voting", "Fan Favorites", "Team Awards"],
  },
  {
    icon: Mic2,
    title: "Conferences & Summits",
    description:
      "Engage attendees with session ratings, speaker awards, and interactive polls during your events.",
    examples: ["Best Speaker", "Session Voting", "Audience Polls"],
  },
  {
    icon: Film,
    title: "Content Creators",
    description:
      "Empower creators to run audience-voted contests, subscriber awards, and community-driven decisions.",
    examples: ["Subscriber Awards", "Content Voting", "Community Decisions"],
  },
];

export function UseCasesSection() {
  return (
    <section className="py-20 lg:py-28 bg-purple-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-gold-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Use Cases
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Perfect For Every
            <span className="block">Occasion</span>
          </h2>
          <p className="text-lg text-text-secondary">
            From small community awards to large-scale international competitions, 
            Tomame adapts to your unique event needs.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="group bg-purple-bg border-purple-accent/20 hover:border-gold-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <CardContent className="p-6">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-gold-primary/20 to-gold-dark/20 flex items-center justify-center mb-4 group-hover:from-gold-primary/30 group-hover:to-gold-dark/30 transition-colors">
                  <useCase.icon className="h-6 w-6 text-gold-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {useCase.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {useCase.description}
                </p>

                {/* Examples */}
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example, exampleIndex) => (
                    <span
                      key={exampleIndex}
                      className="text-xs px-2 py-1 rounded-full bg-purple-accent/10 text-purple-accent"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-text-secondary mb-4">
            Not sure if Tomame fits your needs?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-dark font-medium transition-colors"
          >
            Contact our team to discuss your event
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
