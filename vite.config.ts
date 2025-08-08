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
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ["svelte"],
  },
});
