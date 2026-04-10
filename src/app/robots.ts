import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/events/",
          "/api/",
          "/_next/",
          "/private/",
          "/auth/reset-password",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/admin/", "/dashboard/", "/events/", "/private/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
