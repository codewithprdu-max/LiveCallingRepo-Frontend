import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(() => {
  const isHttps = process.env.HTTPS === 'true' || process.argv.includes('--https');
  return {
    plugins: [
      react(),
      ...(isHttps ? [basicSsl()] : []),
    ],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5055',
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: 'http://localhost:5055',
          changeOrigin: true,
          ws: true,
          secure: false,
        }
      }
    }
  };
});
