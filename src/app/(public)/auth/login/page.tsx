import type { Metadata } from "next";
import Login from "@/components/forms/login";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Tomame account to manage your events, nominations, and voting.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <Login redirectUrl={"/dashboard"} />;
}