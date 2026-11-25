import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Куда dev-сервер проксирует запросы к бэкенду (см. .env.development / .env.prod-api).
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:5211';

  const backendProxy = {
    target: proxyTarget,
    changeOrigin: true,
    secure: true,
  };

  return {
    server: {
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api': backendProxy,
        '/state': backendProxy,
        '/chatHub': { ...backendProxy, ws: true },
      },
    },
    plugins: [react()],
    css: {
      modules: {
        localsConvention: 'camelCase',
        scopeBehaviour: 'local',
        generateScopedName: '[name]__[local]___[hash:base64:5]',
      },
    },
    publicDir: path.resolve(__dirname, 'assets'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@ui': path.resolve(__dirname, './src/shared/components/ui'),
        '@images': path.resolve(__dirname, './assets/images'),
        '@auth': path.resolve(__dirname, './src/shared/auth'),
        '@chat': path.resolve(__dirname, './src/shared/chat'),
        '@components': path.resolve(__dirname, './src/shared/components'),
        '@consts': path.resolve(__dirname, './src/shared/consts'),
        '@appTypes': path.resolve(__dirname, './src/shared/types'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/shared/hooks'),
        '@icons': path.resolve(__dirname, './assets/icons'),
        '@api': path.resolve(__dirname, './src/shared/api'),
        '@store': path.resolve(__dirname, './src/shared/store'),
      },
    },
  };
});
