/**
 * Клиент Server-Sent Events поверх fetch (нужен заголовок Authorization, которого нет у EventSource).
 * Не зависит от React: сам переподключается при обрыве, следит за heartbeat сервера
 * и останавливается только при stop() или отказе в авторизации.
 */

export interface SseEvent {
    name: string;
    data: string;
}

export type SseStatus = 'connecting' | 'connected' | 'reconnecting' | 'stopped' | 'unauthorized';

export interface SseClientOptions {
    url: string;
    token: string;
    onEvent: (event: SseEvent) => void;
    onStatusChange?: (status: SseStatus) => void;
    /** Задержки между попытками переподключения (мс). */
    reconnectDelays?: number[];
    /** Если от сервера нет данных дольше (мс) — соединение считается мёртвым. Сервер шлёт ping каждые 20 с. */
    staleTimeout?: number;
    /** Подставляется в тестах. */
    fetchImpl?: typeof fetch;
}

const DEFAULT_RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 15000];
const DEFAULT_STALE_TIMEOUT = 45000;
const STABLE_CONNECTION_MS = 30000;

class UnauthorizedError extends Error {}

/** Разбирает один блок SSE ("event: x\ndata: y"). Строки-комментарии (": ping") игнорируются. */
export const parseSseBlock = (block: string): SseEvent | null => {
    let name = 'message';
    const dataLines: string[] = [];

    for (const line of block.split(/\r?\n/)) {
        if (!line || line.startsWith(':')) continue;

        if (line.startsWith('event:')) name = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }

    const data = dataLines.join('\n').trim();
    return data ? { name, data } : null;
};

const sleep = (ms: number, signal: AbortSignal) =>
    new Promise<void>(resolve => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
        }, { once: true });
    });

/** Запускает клиент. Возвращает функцию остановки. */
export const startSseClient = (options: SseClientOptions): (() => void) => {
    const {
        url,
        token,
        onEvent,
        onStatusChange,
        reconnectDelays = DEFAULT_RECONNECT_DELAYS,
        staleTimeout = DEFAULT_STALE_TIMEOUT,
        fetchImpl = fetch,
    } = options;

    const lifetime = new AbortController();
    const setStatus = (status: SseStatus) => {
        if (!lifetime.signal.aborted || status === 'stopped') onStatusChange?.(status);
    };

    /** Одно подключение: читает поток, пока сервер его не закроет или он не «затихнет». */
    const listenOnce = async () => {
        const connection = new AbortController();
        const abortConnection = () => connection.abort();
        lifetime.signal.addEventListener('abort', abortConnection, { once: true });

        let staleTimer = setTimeout(abortConnection, staleTimeout);
        const resetStaleTimer = () => {
            clearTimeout(staleTimer);
            staleTimer = setTimeout(abortConnection, staleTimeout);
        };

        try {
            const response = await fetchImpl(url, {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream',
                    Authorization: `Bearer ${token}`,
                },
                cache: 'no-store',
                signal: connection.signal,
            });

            if (response.status === 401 || response.status === 403) throw new UnauthorizedError();
            if (!response.ok || !response.body) throw new Error(`SSE HTTP ${response.status}`);

            setStatus('connected');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                resetStaleTimer();
                buffer += decoder.decode(value, { stream: true });

                const blocks = buffer.split(/\r?\n\r?\n/);
                buffer = blocks.pop() ?? '';

                for (const block of blocks) {
                    const event = parseSseBlock(block);
                    if (event) onEvent(event);
                }
            }
        } finally {
            clearTimeout(staleTimer);
            lifetime.signal.removeEventListener('abort', abortConnection);
        }
    };

    const run = async () => {
        let attempt = 0;
        setStatus('connecting');

        while (!lifetime.signal.aborted) {
            const startedAt = Date.now();

            try {
                await listenOnce();
            } catch (error) {
                if (error instanceof UnauthorizedError) {
                    setStatus('unauthorized');
                    return;
                }
            }

            if (lifetime.signal.aborted) return;

            setStatus('reconnecting');

            // Соединение прожило долго — начинаем бэкофф заново.
            if (Date.now() - startedAt > STABLE_CONNECTION_MS) attempt = 0;

            const delay = reconnectDelays[Math.min(attempt, reconnectDelays.length - 1)];
            attempt++;
            await sleep(delay, lifetime.signal);
        }
    };

    void run();

    return () => {
        lifetime.abort();
        setStatus('stopped');
    };
};
