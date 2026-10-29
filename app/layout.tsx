import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.safaridigital.co.tz"),
  title: "Safari Digital | Safari Website Design & Meta Ads in Tanzania",
  description: "Safari website design, tour operator website development and Meta advertising for Tanzania safari companies seeking more direct international bookings.",
  keywords: ["safari website design", "safari marketing agency Tanzania", "tour operator website development", "digital marketing for safari companies", "Facebook Ads for safari companies", "tourism marketing Tanzania"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Safari Digital | Direct Bookings for Tanzania Tour Operators",
    description: "Websites and Meta advertising built for Tanzania safari companies.",
    url: "/",
    siteName: "Safari Digital",
    locale: "en_TZ",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Safari Digital | Direct Bookings for Tanzania Tour Operators",
    description: "Websites and Meta advertising built for Tanzania safari companies.",
    images: ["/opengraph-image.png"]
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
