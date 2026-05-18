import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";

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

function heroPreloadPlugin(base: string): Plugin {
  let avif1x = "";
  let avifFull = "";

  return {
    name: "hero-preload",
    buildStart() {
      avif1x = "";
      avifFull = "";
    },
    generateBundle(_opts, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk.type !== "asset") continue;
        if (!/headshot-corp[^/]*\.avif$/.test(fileName)) continue;
        if (/@1x[^/]*\.avif$/.test(fileName)) {
          avif1x = fileName;
        } else {
          avifFull = fileName;
        }
      }
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (!avif1x && !avifFull) return html;
        const srcset = [
          avif1x ? `${base}${avif1x} 350w` : "",
          avifFull ? `${base}${avifFull} 700w` : "",
        ]
          .filter(Boolean)
          .join(", ");
        const sizes =
          "(max-width: 767px) 336px, (max-width: 1280px) 50vw, 640px";
        const href = avif1x ? ` href="${base}${avif1x}"` : "";
        const link = `    <link rel="preload" as="image" type="image/avif" fetchpriority="high"${href} imagesrcset="${srcset}" imagesizes="${sizes}">`;
        return html.replace("</head>", `${link}\n  </head>`);
      },
    },
  };
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
    heroPreloadPlugin(basePath),
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
    ...(process.env.ANALYZE === "1"
      ? [
          visualizer({
            filename: "dist/bundle-stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
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
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
        },
      },
    },
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
