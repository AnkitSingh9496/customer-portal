import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/randomuser": {
        target: "https://randomuser.me",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/randomuser/, ""),
      },
    },
  },
});
