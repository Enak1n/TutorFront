# Уголок Репетитора — фронтенд

React 19 + Vite + TypeScript.

## Локальный запуск

```powershell
npm install
npm run dev
```

Приложение: http://localhost:5173. Запросы к `/api`, `/chatHub` (SignalR) и `/state` (SSE) dev-сервер
проксирует на локальный бэкенд `http://localhost:5211` (см. `vite.config.ts`, `.env.development`).

Как поднять бэкенд и базы: `TutorOnline/LOCAL_DEV.md`.

Чтобы указать другой адрес бэкенда только у себя, создайте `.env.development.local`:

```
VITE_DEV_PROXY_TARGET=http://localhost:5000
```

## Сборка

```powershell
npm run build
```

Production-сборка ходит на `VITE_API_URL` из `.env.production`.

## Где что

- `src/shared/config/api.ts` — все адреса бэкенда (не хардкодить URL в компонентах).
- `src/shared/api/*` — клиенты REST API.
- `src/shared/chat` — чат (SignalR), `src/shared/sse` — уведомления и онлайн-статус (SSE).
