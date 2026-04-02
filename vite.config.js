import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
export default defineConfig({
    server: {
        allowedHosts: true
    },
    plugins: [
        react()
    ],
    css: {
        modules: {
            localsConvention: 'camelCase',
            scopeBehaviour: 'local',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
        },
        preprocessorOptions: {
            scss: {
            // Добавление импортера для SCSS.
            // В современных версиях это может быть не строго необходимо,
            // но иногда помогает явно указать, что встроенные модули Sass доступны.
            // Если это не сработает, то достаточно просто убедиться, что пакет 'sass' установлен.
            // Более вероятно, что вам поможет просто использование '@use "sass:color";'
            // ИЛИ использование пакета 'sass' (НЕ node-sass).
            // ВАЖНО: Мы оставим это пустым, так как чаще всего Vite сам находит 'sass',
            // если он установлен.
            // Если проблема останется, попробуйте просто убедиться, что вы используете:
            // 1. Пакет `sass` (npm install sass).
            // 2. Синтаксис `@use "sass:color";` в SCSS файле.
            // Если вы настаиваете на `@import`, то это может помочь, но это нестандартно:
            // @import should work, but if it fails, try using '@use' in your .scss file.
            }
        }
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
            '@store': path.resolve(__dirname, './src/shared/store')
        }
    }
});
