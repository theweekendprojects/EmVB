import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { emvb } from "@perkyzz/emvb";
import emdash from "emdash/astro";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: { plugins: [tailwindcss()] },
  image: {
    layout: "constrained",
    responsiveStyles: true,
    // W-915: EmVB library Images get a srcset through Astro's image service.
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      plugins: [
        formsPlugin(),
        emvb({
          canvasStyles: ["/site.css"],
          canvasCollections: ["pages"],
          // Register the daisyUI provider: on the server (render) via `providers`, and in the
          // browser editor via the `adminEntry` wrapper that imports it.
          providers: ["@perkyzz/emvb-daisyui"],
          adminEntry: "/src/emvb-admin.ts",
        }),
      ],
    }),
  ],
  devToolbar: { enabled: false },
});
