import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koach Reader Admin",
  description: "Back-office web pour gerer les contenus et utilisateurs Koach Reader.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-50">{children}</body>
    </html>
  );
}
