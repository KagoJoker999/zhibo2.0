import { defineConfig } from 'vite'

export default defineConfig({
  base: '/zhibo2.0/',
  build: {
    outDir: 'docs',
    // 生成 sourcemap 方便调试
    sourcemap: false,
    // 资源内联阈值 4KB
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // 分包策略：将大型第三方库单独打包
        manualChunks: {
          'vendor-xlsx': ['xlsx'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-chart': ['chart.js'],
          'vendor-lucide': ['lucide'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
