"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Vote,
  Shield,
  Zap,
  BarChart3,
  Users,
  Calendar,
  Trophy,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Vote,
    title: "Real-time Voting",
    description:
      "Enable instant voting with live result updates. Your audience sees votes count in real-time for maximum engagement.",
    color: "text-purple-accent",
    bgColor: "bg-purple-accent/10",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description:
      "Enterprise-grade security with email verification, fraud detection, and one-vote-per-user enforcement.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Zap,
    title: "Easy Setup",
    description:
      "Create and launch your voting event in minutes with our intuitive event builder and pre-built templates.",
    color: "text-gold-primary",
    bgColor: "bg-gold-primary/10",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Comprehensive insights into voting patterns, participant engagement, and event performance metrics.",
    color: "text-purple-accent",
    bgColor: "bg-purple-accent/10",
  },
  {
    icon: Users,
    title: "Audience Management",
    description:
      "Import participants, manage voter lists, and control access with flexible audience segmentation.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Calendar,
    title: "Scheduled Events",
    description:
      "Schedule voting periods, set automatic start/end times, and manage multiple concurrent events.",
    color: "text-gold-primary",
    bgColor: "bg-gold-primary/10",
  },
  {
    icon: Trophy,
    title: "Award Categories",
    description:
      "Create unlimited award categories with custom nominees, descriptions, and voting rules per category.",
    color: "text-purple-accent",
    bgColor: "bg-purple-accent/10",
  },
  {
    icon: Globe,
    title: "Multi-language Support",
    description:
      "Reach global audiences with support for multiple languages and region-specific customization.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-purple-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-gold-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Everything You Need to Run
            <span className="block">Successful Voting Events</span>
          </h2>
          <p className="text-lg text-text-secondary">
            From small team awards to large-scale public competitions, our platform 
            scales with your needs and delivers professional results every time.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group bg-purple-bg border-purple-accent/20 hover:border-purple-accent/40 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
