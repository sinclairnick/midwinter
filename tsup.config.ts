import { defineConfig } from "tsup";
import { subExports } from "esbuild-sub-exports";

const Exports = ["validation", "routing", "client-types", "cors", "otel"];

export default defineConfig({
  entry: {
    index: "src/index.ts",
    ...Object.fromEntries(Exports.map((e) => [e, `src/plugins/${e}/index.ts`])),
  },
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  outDir: "dist",
  sourcemap: false,
  treeshake: "recommended",
  external: ["midwinter"],
  esbuildPlugins: [subExports({ entries: Exports })],
});
