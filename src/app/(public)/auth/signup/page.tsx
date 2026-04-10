import type { Metadata } from "next";
import SignUp from "@/components/forms/signup";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your free Tomame account to start hosting events, managing nominations, and engaging your audience with voting.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return <SignUp />;
}

