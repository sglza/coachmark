import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: fileURLToPath(new URL(".", import.meta.url)),
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("..", import.meta.url)),
      },
      {
        find: "coachmark",
        replacement: fileURLToPath(new URL("../dist/index.js", import.meta.url)),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  server: {
    open: true,
    port: 5173,
  },
});
