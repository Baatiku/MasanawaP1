import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const deployedHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const base = process.env.NEXT_PUBLIC_APP_URL || (deployedHost ? `https://${deployedHost}` : "http://localhost:3000");
  return { rules: [{ userAgent: "*", allow: ["/", "/products", "/about", "/fees", "/security", "/help", "/contact", "/terms", "/privacy"], disallow: ["/admin/", "/dashboard", "/wallet/", "/transactions/", "/profile/", "/notifications"] }], sitemap: `${base}/sitemap.xml` };
}
