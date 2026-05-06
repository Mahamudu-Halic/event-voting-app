import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  Users,
  Zap,
  Shield,
  Globe,
  Heart,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Tomame",
  description: "Learn about Tomame - the leading platform for event voting, awards, and competitions. Our mission is to make voting transparent, accessible, and engaging.",
};

const values = [
  {
    icon: Shield,
    title: "Transparency",
    description: "Every vote is tracked and auditable. We believe in complete transparency in the voting process.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We continuously evolve our platform with cutting-edge technology to provide the best voting experience.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Built by the community, for the community. We listen to our users and adapt to their needs.",
  },
  {
    icon: Heart,
    title: "Passion",
    description: "We're passionate about celebrating excellence and giving everyone a voice in recognizing achievements.",
  },
];

const stats = [
  { value: "50K+", label: "Events Hosted" },
  { value: "2M+", label: "Votes Cast" },
  { value: "100+", label: "Countries" },
  { value: "99.9%", label: "Uptime" },
];

const team = [
  {
    name: "Sarah Johnson",
    role: "Founder & CEO",
    bio: "Former event organizer with 10+ years experience in awards management.",
  },
  {
    name: "Michael Chen",
    role: "CTO",
    bio: "Tech veteran specializing in secure voting systems and blockchain technology.",
  },
  {
    name: "Amara Okafor",
    role: "Head of Operations",
    bio: "Expert in scaling platforms and building global communities.",
  },
  {
    name: "James Wilson",
    role: "Lead Designer",
    bio: "Award-winning designer focused on creating intuitive user experiences.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-purple-bg via-purple-bg to-purple-surface" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-surface border border-purple-accent/20 mb-8">
            <Sparkles className="h-4 w-4 text-gold-primary" />
            <span className="text-sm text-text-secondary">Our Story</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Empowering Voices,
            <br />
            <span className="text-gold-primary">Celebrating Excellence</span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-text-secondary mb-8">
            Tomame was born from a simple idea: voting should be transparent,
            accessible, and engaging. Today, we're the trusted platform for
            thousands of events worldwide.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-purple-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-surface border border-purple-accent/20 mb-6">
                <Target className="h-4 w-4 text-gold-primary" />
                <span className="text-sm text-text-secondary">Our Mission</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">
                Making Every Vote Count
              </h2>

              <p className="text-text-secondary mb-6 leading-relaxed">
                We believe that recognition and celebration should be democratized.
                Whether it's a local talent show or a global awards ceremony,
                every voice deserves to be heard and every vote should matter.
              </p>

              <p className="text-text-secondary mb-8 leading-relaxed">
                Our platform combines cutting-edge technology with intuitive design
                to create voting experiences that are secure, transparent, and
                enjoyable for both organizers and participants.
              </p>

              <Button className="bg-gold-primary text-text-tertiary hover:bg-gold-dark">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="bg-purple-bg border-purple-accent/20"
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-gold-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-text-secondary">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-surface border border-purple-accent/20 mb-6">
              <Heart className="h-4 w-4 text-gold-primary" />
              <span className="text-sm text-text-secondary">What Drives Us</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Our Core Values
            </h2>

            <p className="max-w-2xl mx-auto text-text-secondary">
              These principles guide everything we do, from product development
              to customer support.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card
                key={index}
                className="bg-purple-bg border-purple-accent/20 group hover:border-gold-primary/30 transition-all"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gold-primary/10 flex items-center justify-center mb-4 group-hover:bg-gold-primary/20 transition-colors">
                    <value.icon className="h-6 w-6 text-gold-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-purple-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-surface border border-purple-accent/20 mb-6">
              <Users className="h-4 w-4 text-gold-primary" />
              <span className="text-sm text-text-secondary">The People</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Meet Our Team
            </h2>

            <p className="max-w-2xl mx-auto text-text-secondary">
              Passionate individuals dedicated to revolutionizing the voting experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card
                key={index}
                className="bg-purple-bg border-purple-accent/20"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-accent/20 to-gold-primary/20 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gold-primary mb-3">{member.role}</p>
                  <p className="text-sm text-text-secondary">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-linear-to-r from-purple-surface to-purple-bg border-purple-accent/20">
            <CardContent className="p-8 sm:p-12 text-center">
              <Globe className="h-12 w-12 text-gold-primary mx-auto mb-6" />
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
                Join the Movement
              </h2>
              <p className="text-text-secondary mb-8 max-w-xl mx-auto">
                Be part of the future of event voting. Whether you're organizing
                an awards show or participating in one, Tomame is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-accent hover:bg-purple-surface"
                  size="lg"
                >
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}