import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";

const BASE_URL = "https://intel.andreshenao.com.au";

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Project Intelligence — AI-Native Project Management",
    template: "%s | Project Intelligence",
  },

  description:
    "Stop re-explaining your projects to every AI. Project Intelligence is a shared database layer where Claude, Cursor, Windsurf, and any AI tool read and write the same structured project data — steps, logs, context — all in one place.",

  keywords: [
    "ai project management",
    "project intelligence system",
    "supabase mcp",
    "claude ai projects",
    "ai-native dashboard",
    "cursor ai project management",
    "windsurf ai",
    "ai context continuity",
    "dash ai agent",
    "ai agnostic project layer",
    "mcp project management",
    "openai project tracking",
  ],

  authors: [{ name: "Andres Henao", url: BASE_URL }],
  creator: "Andres Henao",
  publisher: "Andres Henao",

  openGraph: {
    type: "website",
    locale: "en_AU",
    url: BASE_URL,
    siteName: "Project Intelligence",
    title: "Project Intelligence — AI-Native Project Management",
    description:
      "Stop re-explaining your projects to every AI. One shared database — Claude, Cursor, Windsurf, and any AI picks up exactly where you left off.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Project Intelligence — AI-Native Project Management",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Project Intelligence — AI-Native Project Management",
    description:
      "Stop re-explaining your projects to every AI. One shared database — Claude, Cursor, Windsurf, and any AI picks up exactly where you left off.",
    images: ["/opengraph-image"],
    creator: "@andreshenao",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Project Intelligence",
    url: BASE_URL,
    description:
      "AI-native project management dashboard. Any AI tool with Supabase MCP access can read, write, and extend your project data.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    author: {
      "@type": "Person",
      name: "Andres Henao",
      url: BASE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AUD",
    },
    featureList: [
      "AI-agnostic project layer",
      "Supabase MCP integration",
      "Claude, Cursor, Windsurf support",
      "Structured project steps and logs",
      "Dash AI agent",
      "Guest demo with Google OAuth",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-obsidian text-white antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
