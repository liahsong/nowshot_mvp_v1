import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: true,
    port: 5181,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5181,
      clientPort: 5181,
    },
  },
})
