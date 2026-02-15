import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      include: ['src/lib.ts', 'src/components/**/*.ts', 'src/components/**/*.vue', 'src/types/**/*.ts'],
      insertTypesEntry: true,
      outDir: 'dist'
    })
  ],
  build: {
    minify: 'esbuild',
    cssCodeSplit: false,
    lib: {
      entry: 'src/lib.ts',
      name: 'AdvancedComponents',
      formats: ['es', 'cjs'],
      fileName: (format) => `advanced-components.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
});

