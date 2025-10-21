// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // 👇 este alias sólo aplica a rutas que empiecen literalmente con "@/..."
      { find: /^@\//, replacement: `${path.resolve(__dirname, "src")}/` },

      // Si usas alias específicos, déjalos así:
      { find: "@app", replacement: path.resolve(__dirname, "src/app") },
      { find: "@modules", replacement: path.resolve(__dirname, "src/modules") },
      { find: "@lib", replacement: path.resolve(__dirname, "src/lib") },
    ],
  },
});
