import { defineConfig } from "tsup";

export default defineConfig({
  banner: {
    js: '"use client";',
  },
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  external: ["react", "react-dom"],
  format: ["esm", "cjs"],
  sourcemap: true,
  splitting: false,
});
