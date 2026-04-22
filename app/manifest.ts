import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Project Intelligence",
    short_name: "PIS",
    description:
      "AI-native project management. Any AI tool picks up exactly where you left off.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/images/logo_black.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["productivity", "developer tools"],
  };
}
