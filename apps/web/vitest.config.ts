import path from "path";
import { defineConfig } from "vitest/config";

const config = defineConfig({
  test: {
    include: ["**/__tests__/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

export default config;
