import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/style.ts'),
      name: 'Style',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'style.[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});
