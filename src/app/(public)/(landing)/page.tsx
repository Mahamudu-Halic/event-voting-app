import { Metadata } from "next";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  UseCasesSection,
  TestimonialsSection,
  CTASection,
} from "@/components/sections";

export const metadata: Metadata = {
  title: "Tomame - Modern Event Voting & Award Platform",
  description:
    "Create engaging voting events with ease. From awards to competitions, empower your audience to vote seamlessly in real-time.",
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
