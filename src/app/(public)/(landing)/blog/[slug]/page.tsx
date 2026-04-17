import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Blog Post - ${slug}`,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-6">Blog Post</h1>
        <p className="text-text-secondary">Slug: {slug}</p>
      </div>
    </div>
  );
}