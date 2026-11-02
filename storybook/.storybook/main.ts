import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";
import { resolveAt } from "./resolve-at";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

const config: StorybookConfig = {
  framework: { name: "@storybook/nextjs-vite", options: {} },
  // SB_STORIES: yalnızca bir klasörü derlemek için (paralel çalışırken başkasının
  // yarım dosyası derlemeyi kırmasın). Örn. SB_STORIES=Grafikler
  stories: process.env.SB_STORIES
    ? [`../stories/${process.env.SB_STORIES}/**/*.mdx`, `../stories/${process.env.SB_STORIES}/**/*.stories.@(ts|tsx)`]
    : ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-themes"],
  staticDirs: [],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    config.plugins = [resolveAt(repoRoot), tailwindcss(), ...(config.plugins ?? [])];
    // Depo kökündeki snippet ve şablon dosyaları storybook/ dışında: Vite'ın
    // dosya sunucusu onlara izin vermeli.
    config.server = { ...config.server, fs: { ...config.server?.fs, allow: [repoRoot] } };
    return config;
  },
};

export default config;
