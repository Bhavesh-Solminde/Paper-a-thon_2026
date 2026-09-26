import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Montserrat, Permanent_Marker } from "next/font/google";
import { EVENT } from "@/lib/event";
import { PlaneCursor } from "@/components/ui/PlaneCursor";
import "./globals.css";
import "./plane-cursor.css";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["500", "700", "800", "900"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const marker = Permanent_Marker({ variable: "--font-marker", subsets: ["latin"], weight: "400" });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Paper-a-thon 2026 · MLSC", template: "%s · Paper-a-thon" },
  description: `${EVENT.tagline.join(" ")} ${EVENT.subTagline}. ${EVENT.club} presents Paper-a-thon, ${EVENT.dateLabel}, ${EVENT.venue}.`,
  openGraph: {
    title: "Paper-a-thon 2026",
    description: "Fuel your curiosity. Shape the future. One paper at a time.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#06070a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${montserrat.variable} ${inter.variable} ${marker.variable} ${caveat.variable} antialiased`}
    >
      <head>
        {/* Decide before first paint whether the landing intro plays: once per session, desktop/tablet only. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(location.pathname==="/"){var s=sessionStorage.getItem("pat-intro-seen")||matchMedia("(max-width: 767px)").matches;document.documentElement.classList.add(s?"intro-seen":"intro-lock")}}catch(e){}`,
          }}
        />
      </head>
      <body className="grain min-h-dvh">
        {children}
        <PlaneCursor />
      </body>
    </html>
  );
}
