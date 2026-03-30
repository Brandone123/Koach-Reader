import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Dossier admin-web (ce fichier), pas Koach-Reader.
 * Avec un package-lock à la racine, Turbopack en dev résout parfois
 * `tailwindcss` depuis Koach-Reader/node_modules (absent).
 */
const adminWebRoot = path.dirname(fileURLToPath(import.meta.url));
const nm = (...s: string[]) => path.join(adminWebRoot, "node_modules", ...s);

const nextConfig: NextConfig = {
  turbopack: {
    root: adminWebRoot,
    resolveAlias: {
      tailwindcss: nm("tailwindcss"),
      "@tailwindcss/postcss": nm("@tailwindcss", "postcss"),
    },
  },
};

export default nextConfig;
