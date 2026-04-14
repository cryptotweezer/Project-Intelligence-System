import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";

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
      <body className="bg-obsidian text-white antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
