import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    validation: "src/plugins/validation/index.ts",
    routing: "src/plugins/routing/index.ts",
  },
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  outDir: "dist",
  sourcemap: false,
  treeshake: "recommended",
});
