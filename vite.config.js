import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  root: 'lawledge-frontend',
  envDir: path.resolve(__dirname, 'lawledge-frontend'),
  base: '/',
  server: {
    port: 5173,
    strictPort: true
  }
});

