import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'vonix.network',
      '.vonix.network', // Allow subdomains
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // WebSocket proxy for live chat
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunk - always loaded
          'vendor-core': ['react', 'react-dom', 'react-router-dom', 'axios'],

          // UI library chunk
          'vendor-ui': ['lucide-react'],

          // Feature-based chunks - loaded on demand
          'admin': [
            './src/pages/AdminDashboard.tsx',
            './src/pages/ModeratorDashboard.tsx',
            './src/pages/admin'
          ],
          'social': [
            './src/pages/SocialPage.tsx',
            './src/pages/DiscoverPage.tsx',
            './src/pages/MessagesPage.tsx'
          ],
          'forum': [
            './src/pages/ForumListPage.tsx',
            './src/pages/ForumViewPage.tsx',
            './src/pages/ForumTopicPage.tsx',
            './src/pages/ReputationLeaderboard.tsx'
          ],
          'blog': [
            './src/pages/BlogPage.tsx',
            './src/pages/BlogPostPage.tsx'
          ],
          'auth': [
            './src/pages/LoginPage.tsx',
            './src/pages/RegisterPage.tsx'
          ]
        },
        // Optimize chunk file names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Performance optimizations
    chunkSizeWarningLimit: 600, // Warn if chunks > 600KB
    reportCompressedSize: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  },
  // Image optimization
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
});
