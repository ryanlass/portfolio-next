import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ryan Lasswell",
  description:
    "Designer and builder creating digital products and websites for AI and future-tech companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
