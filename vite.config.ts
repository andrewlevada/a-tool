import { resolve } from "path"
import { defineConfig } from "vite"
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss()
  ],

  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'app'),
    },
  },

  build: {
    outDir: "build",
  },
})
