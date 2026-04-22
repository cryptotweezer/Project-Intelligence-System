import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Access",
  description: "Restricted access — Project Intelligence owner login.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
