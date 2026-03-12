import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        vue: resolve(__dirname, 'src/vue.ts'),
      },
      name: 'UniversalFilePreview',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'vue',
        'pdfjs-dist',
        'marked',
        'docx-preview',
        'pptx-preview',
        'xlsx',
      ],
      output: {
        globals: {
          vue: 'Vue',
          'pdfjs-dist': 'pdfjsLib',
          marked: 'marked',
          'docx-preview': 'docx',
          'pptx-preview': 'pptxPreview',
          xlsx: 'XLSX',
        },
        exports: 'named',
        assetFileNames: 'style.[ext]',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@renderers': resolve(__dirname, 'src/renderers'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
