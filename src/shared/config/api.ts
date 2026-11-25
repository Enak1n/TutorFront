/**
 * Адреса бэкенда. Задаются через переменную окружения VITE_API_URL (см. .env.* файлы).
 *
 * - В dev-режиме VITE_API_URL пустой: запросы идут на тот же origin, а Vite проксирует
 *   /api, /chatHub и /state на бэкенд (см. vite.config.ts) — без проблем с CORS.
 * - В production-сборке VITE_API_URL = https://api.ugolok-repetitora.ru.
 */
const rawBaseUrl = (import.meta.env.VITE_API_URL ?? '').trim()

/** Базовый адрес API без завершающего слэша ('' — тот же origin). */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

export const API_V1_URL = `${API_BASE_URL}/api/v1`
export const API_V2_URL = `${API_BASE_URL}/api/v2`
export const CHAT_HUB_URL = `${API_BASE_URL}/chatHub`
export const SSE_URL = `${API_BASE_URL}/state`

/** Превращает относительный путь от бэкенда (например, /api/v1/files/...) в полный URL. */
export const toApiUrl = (relativeUrl: string | null | undefined): string => {
	if (!relativeUrl) return ''
	if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl

	return `${API_BASE_URL}/${relativeUrl.replace(/^\/+/, '')}`
}
