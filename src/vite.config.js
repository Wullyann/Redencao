// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // se você usar import sem extensão, garanta que .jsx seja reconhecido
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
});
