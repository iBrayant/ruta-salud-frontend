import type { NextConfig } from "next";

// URL del gateway del backend (local o túnel de Cloudflare). Solo se usa en el servidor.
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");
// Keycloak debe ser alcanzable desde el navegador (inicio de sesión OAuth 2.0 con PKCE).
const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8080/auth").replace(/\/$/, "");
const AUTH_ORIGIN = new URL(AUTH_URL).origin;
const DEV = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next.js inserta scripts en línea para hidratar la página; en desarrollo necesita eval.
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://tile.openstreetmap.org",
  `connect-src 'self' ${AUTH_ORIGIN} https://router.project-osrm.org`,
  "font-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  `form-action 'self' ${AUTH_ORIGIN}`,
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // El navegador llama a /api/* en el mismo origen; Next lo reenvía al gateway.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
