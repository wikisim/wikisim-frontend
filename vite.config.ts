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
})
