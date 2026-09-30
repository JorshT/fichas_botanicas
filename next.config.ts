import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde el celular en la red local.
  allowedDevOrigins: ["192.168.1.10"],
  experimental: {
    serverActions: {
      // Una ficha lleva hasta 3 fotos de ≤1 MB más sus miniaturas.
      // Vercel acepta como máximo 4,5 MB por petición.
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // El token va en la URL: que no se filtre a otros sitios (GBIF, OpenStreetMap…).
          { key: "Referrer-Policy", value: "no-referrer" },
          // Que los buscadores nunca indexen las colecciones.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
