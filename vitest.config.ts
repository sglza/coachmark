import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    css: {
      include: [/\.css(?:$|\?)/],
    },
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
