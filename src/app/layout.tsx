import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: { default: "Frontier Trust — $100M AI Trust Infrastructure Allocation", template: "%s · Frontier Trust" },
  description:
    "Independent, public-information growth equity underwriting: a $100M allocation decision between Vanta and Chainguard. Illustrative prices and forecasts; research cutoff 2 Nov 2026.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
