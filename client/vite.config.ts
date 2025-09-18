import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // Redux and state management
          redux: ['@reduxjs/toolkit', 'react-redux'],
          
          // TipTap editor (lazy loaded)
          tiptap: [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-character-count'
          ],
          
          // UI libraries
          ui: ['lucide-react', 'framer-motion', 'react-beautiful-dnd'],
          
          // Form and validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Charts and visualization
          charts: ['recharts'],
          
          // Utilities
          utils: ['axios', 'date-fns', 'clsx', 'tailwind-merge']
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop() 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name!.split('.').pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType!)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType!)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 7891,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:7890',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux', 'events'],
    exclude: ['@tiptap/react', '@tiptap/starter-kit'],
  },
})