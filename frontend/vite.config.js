import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router"],
          "motion-vendor": ["framer-motion"],
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          "ui-vendor": ["react-icons", "axios", "lenis"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 5173,
  },
});
