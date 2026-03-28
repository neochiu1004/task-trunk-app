import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const appVersion = process.env.npm_package_version || "0.0.0";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "輕鬆票券",
        short_name: "輕鬆票券",
        description: "jijun 風格的票券管理 PWA，支援新增、核銷、回收、範本與條碼。",
        theme_color: "#F5F5F3",
        background_color: "#F5F5F3",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: [
          "**/assets/bwip-js-*.js",
          "**/assets/barcodeService-*.js",
          "**/assets/qrious-*.js",
          "**/assets/base-*.js",
          "**/assets/qr-*.js",
          "**/assets/oned-*.js",
          "**/assets/pdf417-*.js",
          "**/assets/datamatrix-*.js",
          "**/assets/aztec-*.js",
          "**/assets/GridSamplerInstance-*.js",
          "**/assets/WhiteRectangleDetector-*.js",
          "**/assets/DecoderResult-*.js",
          "**/assets/BitSource-*.js",
          "**/assets/IllegalStateException-*.js",
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern:
              /\/assets\/(?:bwip-js|barcodeService|qrious|base|qr|oned|pdf417|datamatrix|aztec|GridSamplerInstance|WhiteRectangleDetector|DecoderResult|BitSource|IllegalStateException)-.*\.js$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "on-demand-barcode-assets",
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
}));
