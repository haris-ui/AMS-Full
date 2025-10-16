import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // important for correct paths in production
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
