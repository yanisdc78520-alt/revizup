import type { Metadata, Viewport } from "next";
// Polices installées avec l'app (aucun appel à Google Fonts).
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-800.css";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource/atkinson-hyperlegible/latin-400-italic.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "RevizUp · Ton cours devient fiches et quiz",
  description:
    "Importe ton cours en PDF ou Word : RevizUp en tire des fiches de révision et des quiz sur le point que tu choisis. IA open source hébergée en France.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F8FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1424" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
