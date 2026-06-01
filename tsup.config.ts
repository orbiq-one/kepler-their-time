import { defineConfig } from "tsup";

const outDir = `${process.env.HOME}/Library/Application Support/Kepler/Plugins/their-time.keplugin`;

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["iife"],
  globalName: "KeplerPlugin",
  outDir,
  outExtension: () => ({ js: ".js" }),
  dts: false,
  clean: false,
  bundle: true,
  noExternal: [/@kepler-app\/plugin-sdk/],
});
