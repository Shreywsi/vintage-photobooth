import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/vintage-photobooth/',  // Add this line!
  server: {
    port: 5175,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        chat: new URL('./chat.html', import.meta.url).pathname
      }
    }
  }
})