import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";
import { resolveAt } from "./resolve-at";
import type { Plugin } from "vite";

/**
 * Şablonun sunucu tarafı küçük dosya denetimleri (ör. `HeroMedia`:
 * `existsSync(path.join(process.cwd(), "public", …))`) tarayıcıda çalışmaz.
 * Yalnızca `templates/` altından gelen `node:fs` / `node:path` içe aktarımları
 * sahte modüle gider: dosya "yok" sayılır, şablon görselsiz yedeğini çizer
 * (gerçek şablonda görsel dosyası olmadığında yaptığının aynısı).
 */
function serverShims(repoRoot: string): Plugin {
  const templates = path.join(repoRoot, "templates");
  const ids: Record<string, string> = {
    "node:fs": "\0shim:fs",
    fs: "\0shim:fs",
    "node:path": "\0shim:path",
    path: "\0shim:path",
  };
  return {
    name: "dev-starter:server-shims",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !ids[source]) return null;
      return path.normalize(importer).startsWith(templates + path.sep) ? ids[source] : null;
    },
    load(id) {
      if (id === "\0shim:fs") return "export const existsSync = () => false; export default { existsSync };";
      if (id === "\0shim:path")
        return "export const join = (...p) => p.filter(Boolean).join('/'); export default { join };";
      return null;
    },
  };
}

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
    config.plugins = [serverShims(repoRoot), resolveAt(repoRoot), tailwindcss(), ...(config.plugins ?? [])];
    config.define = { ...config.define, "process.cwd": '(() => "")' };
    // Depo kökündeki snippet ve şablon dosyaları storybook/ dışında: Vite'ın
    // dosya sunucusu onlara izin vermeli.
    config.server = { ...config.server, fs: { ...config.server?.fs, allow: [repoRoot] } };
    // Depo kökündeki dosyalar çıplak paketleri (lucide-react, @base-ui/react…)
    // kendi konumlarından, yani kökteki node_modules'tan arar; orada yoklar ya
    // da başka sürümdeler. dedupe hepsini storybook/node_modules'tan çözer
    // (tek React kopyası da buna bağlı).
    config.resolve = {
      ...config.resolve,
      dedupe: [
        ...(config.resolve?.dedupe ?? []),
        "react",
        "react-dom",
        "next",
        "motion",
        "lucide-react",
        "@base-ui/react",
        "clsx",
        "tailwind-merge",
        "three",
        "@react-three/fiber",
        "zod",
      ],
    };
    return config;
  },
};

export default config;
