import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],

  // Performance optimizations
  build: {
    // Enable minification for smaller bundles
    minify: "esbuild",
    // Enable source maps for debugging (disable in production if needed)
    sourcemap: true,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ["svelte"],
        },
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Development server optimizations
  server: {
    // Enable file system caching
    fs: {
      strict: false,
    },
    // Proxy API requests to avoid mixed content issues
    proxy: {
      '/api': {
        target: 'http://api.evntfy.tech',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/socket.io': {
        target: 'http://api.evntfy.tech',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('WebSocket Proxy error:', err);
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket) => {
            console.log('Sending WebSocket Request to the Target:', req.url);
          });
        },
      },
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["svelte"],
  },
});
