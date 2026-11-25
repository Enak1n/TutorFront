/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Адрес бэкенда. Пустая строка — тот же origin (dev-прокси Vite). */
	readonly VITE_API_URL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
