import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://danieljanosrobert.github.io/gondolathid/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
});
