import preact from "@preact/preset-vite"
import { resolve } from "path"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      "core": resolve(__dirname, "lib/core/src"),
    }
  },
  build: {
    sourcemap: true, // Keep source maps for your own code
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
