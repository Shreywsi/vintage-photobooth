import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/vintage-photobooth/',
  server: {
    port: 5175,
    strictPort: true
  },
  build: {
    outDir: 'docs',  // Change from 'dist' to 'docs'
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        chat: new URL('./chat.html', import.meta.url).pathname
      }
    }
  }
})