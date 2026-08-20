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
    modulePreload: {
      polyfill: false,
      resolveDependencies(filename, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes('vendor-three') &&
            !dep.includes('vendor-chart') &&
            !dep.includes('vendor-html2canvas') &&
            !dep.includes('data-localbodies')
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('localBodies')) {
            return 'data-localbodies'
          }
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three'
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-chart'
            }
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas'
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
          }
        }
      }
    }
  }
})
