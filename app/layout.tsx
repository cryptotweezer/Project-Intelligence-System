import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Intelligence System",
  description: "Secure AI project management and intelligence dashboard.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-obsidian text-white antialiased">{children}</body>
    </html>
  );
}
