import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Force all imported assets (SVG, images, fonts) to be emitted as separate
    // content-hashed files in dist/assets/ instead of being inlined as base64 data URIs.
    // This enables the production-grade split-cache strategy in Nginx:
    //   dist/assets/logo.[hash].svg → Cache-Control: immutable, max-age=31536000
    //   dist/favicon.svg            → Cache-Control: no-cache (public/, no hash)
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'lucide';
          }
          if (id.includes('node_modules/sonner/') || id.includes('node_modules/axios/')) {
            return 'ui-vendor';
          }
        }
      }
    }
  },
})
