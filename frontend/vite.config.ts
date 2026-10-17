import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Synthetic seed data lives in ../seed and is imported by the demo adapter.
    fs: { allow: ['..'] },
  },
  build: { sourcemap: false, target: 'es2023' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Process only the token file so tokens.test.ts can read it with ?raw.
    css: { include: [/tokens\.css/] },
  },
})
