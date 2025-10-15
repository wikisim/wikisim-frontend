import preact from "@preact/preset-vite"
import { resolve } from "path"
import { defineConfig } from "vite"
import MonacoEditor from "vite-plugin-monaco-editor"

const MonacoEditorPlugin: typeof MonacoEditor = (MonacoEditor as any).default


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    MonacoEditorPlugin({}),
  ],
  resolve: {
    alias: {
      "core": resolve(__dirname, "lib/core/src"),
      "json-stringify-pretty-compact": resolve(__dirname, "lib/json-stringify-pretty-compact"),
    }
  },
  build: {
    sourcemap: true, // Keep source maps for your own code
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor"
          }
        }
      }
    }
  },
  optimizeDeps: {
    // Disable source maps for pre-bundled dependencies
    include: [],
  },
  server: {
    // Allow access to local network
    host: true,
    // Suppress source map warnings in dev console
    sourcemapIgnoreList: (sourcePath) => {
      return sourcePath.includes("node_modules")
    }
  }
})
