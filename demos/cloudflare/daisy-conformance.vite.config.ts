import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ root: "conformance", plugins: [tailwindcss()], build: { outDir: "../dist-daisy-conformance", emptyOutDir: true, cssCodeSplit: false, minify: true } });
