"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-bg via-purple-bg to-purple-surface" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-purple-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-primary/5 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-surface border border-purple-accent/30 mb-6">
              <Sparkles className="h-4 w-4 text-gold-primary" />
              <span className="text-sm font-medium text-text-secondary">
                Trusted by 10,000+ event organizers
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6">
              Create Engaging
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-gold-dark">
                Voting Events
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto lg:mx-0 mb-8">
              Build, manage, and host professional voting events with ease. 
              From awards to competitions, empower your audience to vote 
              seamlessly in real-time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                size="lg"
                className="bg-gold-primary text-text-tertiary hover:text-white hover:bg-gold-dark font-semibold px-8 h-12 text-base group"
                asChild
              >
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-purple-accent hover:text-white hover:bg-purple-surface px-8 h-12 text-base"
                asChild
              >
                <Link href="/login">
                  <Play className="mr-2 h-5 w-5" />
                  Login
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-purple-accent/20">
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center lg:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-gold-primary">10K+</p>
                  <p className="text-sm text-text-secondary mt-1">Active Events</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-gold-primary">500K+</p>
                  <p className="text-sm text-text-secondary mt-1">Votes Cast</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-gold-primary">99.9%</p>
                  <p className="text-sm text-text-secondary mt-1">Uptime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image/Visual */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main Image Container */}
              <div className="relative rounded-2xl overflow-hidden border border-purple-accent/30 shadow-2xl shadow-purple-accent/20">
                <Image
                  src="/logo.png"
                  alt="Tomame Dashboard Preview"
                  width={600}
                  height={500}
                  className="w-full h-auto object-cover"
                  priority
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-bg/80 via-transparent to-transparent" />
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-purple-surface rounded-xl p-4 border border-purple-accent/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Vote Recorded</p>
                    <p className="text-xs text-text-secondary">Just now</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-purple-surface rounded-xl p-4 border border-purple-accent/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-primary/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gold-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Live Results</p>
                    <p className="text-xs text-text-secondary">Real-time updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
