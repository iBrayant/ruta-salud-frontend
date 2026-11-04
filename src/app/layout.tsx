import type { Metadata, Viewport } from "next";
import { ProveedorSesion } from "@/lib/sesion";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruta Salud Rural · Fusagasugá",
  description: "Planificación de visitas domiciliarias priorizadas en las veredas de Fusagasugá.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f8f9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <ProveedorSesion>{children}</ProveedorSesion>
      </body>
    </html>
  );
}
