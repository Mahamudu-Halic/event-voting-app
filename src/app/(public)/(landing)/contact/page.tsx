"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
  Loader2,
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@tomame.com",
    description: "For general inquiries and support",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri from 9am to 6pm EST",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "San Francisco, CA",
    description: "123 Innovation Drive, Suite 100",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "24/7 Support",
    description: "Always here to help you",
  },
];

const faqs = [
  {
    question: "How do I create an event?",
    answer:
      "Sign up as an organizer, then click 'Create Event' in your dashboard. Follow our step-by-step wizard to set up your event.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, PayPal, and bank transfers for enterprise customers.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! You can create one free event with up to 100 votes to test our platform.",
  },
  {
    question: "How secure is the voting?",
    answer:
      "We use enterprise-grade encryption, audit trails, and fraud detection to ensure every vote is legitimate.",
  },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-purple-bg via-purple-bg to-purple-surface" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-surface border border-purple-accent/20 mb-8">
            <MessageSquare className="h-4 w-4 text-gold-primary" />
            <span className="text-sm text-text-secondary">Get in Touch</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            We'd Love to Hear
            <br />
            <span className="text-gold-primary">From You</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-text-secondary">
            Have questions about our platform? Need help with your event?
            Our team is here to support you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((item, index) => (
              <Card
                key={index}
                className="bg-purple-bg border-purple-accent/20 group hover:border-gold-primary/30 transition-all"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gold-primary/10 flex items-center justify-center mb-4 group-hover:bg-gold-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-gold-primary" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gold-primary font-medium mb-1">
                    {item.value}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-purple-bg border-purple-accent/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-6">
                  Send us a Message
                </h2>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-text-secondary">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-text-primary">
                          Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          required
                          className="bg-purple-surface border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-text-primary">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          required
                          className="bg-purple-surface border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-text-primary">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        required
                        className="bg-purple-surface border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-text-primary">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your inquiry..."
                        required
                        rows={5}
                        className="bg-purple-surface border-purple-accent/30 text-text-primary focus-visible:ring-gold-primary resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gold-primary text-text-tertiary hover:bg-gold-dark"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card
                    key={index}
                    className="bg-purple-bg border-purple-accent/20"
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-text-primary mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}