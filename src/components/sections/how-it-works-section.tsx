"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarPlus,
  Users,
  Vote,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: CalendarPlus,
    title: "Create Your Event",
    description:
      "Set up your voting event in minutes. Define categories, add nominees, and customize voting rules to match your needs.",
    details: [
      "Choose event type (awards, competition, poll)",
      "Add categories and nominees",
      "Set voting duration and rules",
      "Customize branding and design",
    ],
  },
  {
    number: "02",
    icon: Users,
    title: "Invite Participants",
    description:
      "Share your event with your audience. Import contacts, send invites, or share public links to reach voters.",
    details: [
      "Import voter lists via CSV",
      "Send email invitations",
      "Share via social media",
      "Embed on your website",
    ],
  },
  {
    number: "03",
    icon: Vote,
    title: "Collect Votes",
    description:
      "Watch engagement soar as participants cast their votes. Our secure system ensures one vote per user with fraud protection.",
    details: [
      "Real-time vote counting",
      "Email verification",
      "Fraud detection active",
      "Mobile-friendly voting",
    ],
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Analyze & Announce",
    description:
      "Access comprehensive analytics and announce winners with professional presentations and downloadable reports.",
    details: [
      "View detailed analytics",
      "Export results",
      "Create winner announcements",
      "Download certificates",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 bg-purple-bg relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-primary/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-gold-primary font-semibold text-sm uppercase tracking-wider mb-4">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Four Simple Steps to
            <span className="block">Launch Your Voting Event</span>
          </h2>
          <p className="text-lg text-text-secondary">
            From setup to results, our streamlined process makes it easy to 
            create professional voting experiences in no time.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="group bg-purple-surface border-purple-accent/20 hover:border-purple-accent/40 transition-all duration-300"
            >
              <CardContent className="p-8">
                <div className="flex gap-6">
                  {/* Number & Icon Column */}
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-gold-primary/30 mb-4">
                      {step.number}
                    </span>
                    <div className="w-14 h-14 rounded-2xl bg-purple-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <step.icon className="h-7 w-7 text-purple-accent" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:flex flex-1 w-px bg-purple-accent/20 my-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-3">
                      {step.title}
                    </h3>
                    <p className="text-text-secondary mb-4 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li
                          key={detailIndex}
                          className="flex items-center gap-2 text-sm text-text-secondary"
                        >
                          <ArrowRight className="h-4 w-4 text-gold-primary shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
