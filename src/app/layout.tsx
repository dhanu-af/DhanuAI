import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhanu AI",
  description: "Ask anything about SOPs, quality, production, equipment, formulations, or workplace procedures.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
