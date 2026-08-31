import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://masanawa.vercel.app";
  return { rules: [{ userAgent: "*", allow: ["/", "/products", "/about", "/fees", "/security", "/help", "/contact", "/terms", "/privacy"], disallow: ["/admin/", "/dashboard", "/wallet/", "/transactions/", "/profile/", "/notifications"] }], sitemap: `${base}/sitemap.xml` };
}
