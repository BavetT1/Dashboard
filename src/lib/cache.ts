import { CacheEntry } from '@/types';

// In-memory кеш для данных
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Получить данные из кеша
 */
export function getFromCache<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
        return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
        cache.delete(key);
        return null;
    }

    return entry.data;
}

/**
 * Сохранить данные в кеш
 */
export function setInCache<T>(key: string, data: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
    };

    cache.set(key, entry as CacheEntry<unknown>);
}

/**
 * Проверить есть ли данные в кеше (даже просроченные)
 */
export function hasInCache(key: string): boolean {
    return cache.has(key);
}

/**
 * Получить данные из кеша даже если просрочены (для fallback)
 */
export function getFromCacheStale<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    return entry?.data ?? null;
}

/**
 * Удалить запись из кеша
 */
export function deleteFromCache(key: string): void {
    cache.delete(key);
}

/**
 * Очистить весь кеш
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Получить время последнего обновления кеша
 */
export function getCacheTimestamp(key: string): Date | null {
    const entry = cache.get(key);
    return entry ? new Date(entry.timestamp) : null;
}
