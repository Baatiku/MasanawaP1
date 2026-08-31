import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://masanawa.vercel.app";
  const paths = ["/", "/products", "/about", "/fees", "/security", "/help", "/contact", "/terms", "/privacy", "/login", "/register"];
  return paths.map((path, index) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: index === 0 ? "weekly" : "monthly", priority: index === 0 ? 1 : path === "/login" || path === "/register" ? 0.6 : 0.7 }));
}
