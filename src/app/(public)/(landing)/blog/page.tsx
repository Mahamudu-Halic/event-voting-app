import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogPage() {
  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-6">Blog</h1>
        <p className="text-text-secondary">Blog posts coming soon...</p>
      </div>
    </div>
  );
}