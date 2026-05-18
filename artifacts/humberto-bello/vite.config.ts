import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

function bogartPreloadPlugin(base: string): Plugin {
  let preloadFonts: string[] = [];

  return {
    name: "bogart-preload",
    buildStart() {
      preloadFonts = [];
    },
    generateBundle(_opts, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (
          chunk.type === "asset" &&
          /Bogart-(Regular|Medium|Semibold)-trial[^/]*\.woff2$/.test(fileName) &&
          !fileName.includes("Italic")
        ) {
          preloadFonts.push(fileName);
        }
      }
      preloadFonts.sort();
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (preloadFonts.length === 0) return html;
        const links = preloadFonts
          .map(
            (f) =>
              `    <link rel="preload" href="${base}${f}" as="font" type="font/woff2" crossorigin>`,
          )
          .join("\n");
        return html.replace("</head>", `${links}\n  </head>`);
      },
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    bogartPreloadPlugin(basePath),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
