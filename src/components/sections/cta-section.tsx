"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Check } from "lucide-react";

const benefits = [
  "No credit card required",
  "Free plan available",
  "Cancel anytime",
  "24/7 support",
];

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-purple-surface relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold-primary/20 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-bg border border-purple-accent/30 mb-8">
            <Sparkles className="h-4 w-4 text-gold-primary" />
            <span className="text-sm font-medium text-text-secondary">
              Start creating today
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Ready to Create Your
            <span className="block text-gold-primary">First Voting Event?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who trust Tomame for their voting 
            needs. Get started for free and upgrade as you grow.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-text-secondary"
              >
                <Check className="h-4 w-4 text-success" />
                {benefit}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gold-primary text-text-tertiary hover:bg-gold-dark font-semibold px-10 h-14 text-lg group"
              asChild
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-purple-accent text-text-primary hover:bg-purple-bg px-10 h-14 text-lg"
              asChild
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>

          {/* Secondary CTA */}
          <p className="mt-8 text-text-secondary text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-gold-primary hover:text-gold-dark font-medium transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
