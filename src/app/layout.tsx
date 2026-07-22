import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Incidencias Tracker",
  description: "Sistema de seguimiento de incidencias diarias",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-900 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
