import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Perfect Naira",
    short_name: "Perfect Naira",
    description: "Payments, transfers, digital services and provider-backed digital assets.",
    start_url: "/",
    display: "standalone",
    background_color: "#01130c",
    theme_color: "#052a1d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
