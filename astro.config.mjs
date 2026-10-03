import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkContentLinks from "./scripts/remark-content-links.mjs";

export default defineConfig({
  site: "https://null-garden.netlify.app",
  compressHTML: true,
  markdown: {
    processor: unified({ remarkPlugins: [remarkContentLinks] }),
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: "dark",
    },
  },
});
