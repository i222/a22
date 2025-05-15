import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    outDir: './dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['lodash-es', 'filesize', 'mitt', 'uuid'],
          antd: ['antd'],
        },
      },
    }
  },
  base: './',
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },

});
