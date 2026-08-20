import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Injected as a compile-time constant, used by Sentry release tracking in main.jsx
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/admin/api': 'http://localhost:5000',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-chart': ['chart.js', 'react-chartjs-2'],
        }
      }
    }
  }
})
