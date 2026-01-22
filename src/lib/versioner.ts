import { VersionInfo, ClientVersions } from '@/types';
import { config, getClientById } from './config';
import { getFromCache, setInCache, getFromCacheStale } from './cache';

/**
 * Получить версии модулей для клиента из Versioner
 * 
 * Примечание: Сервис доступен только через VPN
 */
export async function fetchClientVersions(clientId: string): Promise<ClientVersions | null> {
    const cacheKey = `versions-${clientId}`;

    // Проверяем кеш
    const cached = getFromCache<ClientVersions>(cacheKey);
    if (cached) {
        console.log(`[Versioner] Возвращаем кешированные версии для ${clientId}`);
        return cached;
    }

    const client = getClientById(clientId);
    if (!client || !client.versionerPath) {
        console.error(`[Versioner] Клиент или путь не найден: ${clientId}`);
        return null;
    }

    try {
        const url = `${config.versionerBaseUrl}${client.versionerPath}`;
        console.log(`[Versioner] Запрашиваем ${url}...`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 сек таймаут

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json, text/html',
            },
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        let versions: VersionInfo[] = [];

        if (contentType.includes('application/json')) {
            // JSON API ответ
            const data = await response.json();
            versions = parseJsonResponse(data);
        } else {
            // HTML страница — парсим
            const html = await response.text();
            versions = parseHtmlResponse(html);
        }

        const result: ClientVersions = {
            clientId,
            versions,
            lastChecked: new Date().toISOString(),
        };

        // Кешируем на 24 часа
        setInCache(cacheKey, result, config.cacheTtlMs);

        console.log(`[Versioner] Получено ${versions.length} модулей для ${clientId}`);

        return result;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error(`[Versioner] Таймаут для ${clientId} (VPN выключен?)`);
        } else {
            console.error(`[Versioner] Ошибка для ${clientId}:`, error);
        }

        // Пробуем вернуть устаревшие данные
        const stale = getFromCacheStale<ClientVersions>(cacheKey);
        if (stale) {
            console.log(`[Versioner] Возвращаем устаревшие версии для ${clientId}`);
            return stale;
        }

        return null;
    }
}

/**
 * Парсинг JSON ответа от Versioner
 */
function parseJsonResponse(data: unknown): VersionInfo[] {
    if (!data || typeof data !== 'object') {
        return [];
    }

    // Предполагаемая структура: { modules: [{ name, version, env }] }
    // или { name: version, ... }

    if (Array.isArray(data)) {
        return data.map((item: Record<string, unknown>) => ({
            moduleName: String(item.name || item.module || 'Unknown'),
            version: String(item.version || 'N/A'),
            environment: String(item.env || item.environment || 'production'),
            lastDeployed: item.lastDeployed ? String(item.lastDeployed) : undefined,
        }));
    }

    // Объект { name: version }
    const record = data as Record<string, string>;
    return Object.entries(record).map(([name, version]) => ({
        moduleName: name,
        version: String(version),
        environment: 'production',
    }));
}

/**
 * Парсинг HTML страницы от Versioner
 */
function parseHtmlResponse(html: string): VersionInfo[] {
    const versions: VersionInfo[] = [];

    // Ищем паттерны версий в HTML
    // Пример: <tr><td>module-name</td><td>1.2.3</td></tr>
    const tableRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/gi;

    let match;
    while ((match = tableRowRegex.exec(html)) !== null) {
        const name = match[1].trim();
        const version = match[2].trim();

        // Пропускаем заголовки
        if (name.toLowerCase() === 'module' || name.toLowerCase() === 'name') {
            continue;
        }

        if (name && version) {
            versions.push({
                moduleName: name,
                version,
                environment: 'production',
            });
        }
    }

    // Альтернативный паттерн: module-name: 1.2.3
    if (versions.length === 0) {
        const lineRegex = /([a-z0-9_-]+)\s*[:=]\s*([0-9]+\.[0-9]+\.[0-9]+[a-z0-9.-]*)/gi;

        while ((match = lineRegex.exec(html)) !== null) {
            versions.push({
                moduleName: match[1],
                version: match[2],
                environment: 'production',
            });
        }
    }

    return versions;
}

/**
 * Получить версии для всех клиентов
 */
export async function fetchAllVersions(): Promise<ClientVersions[]> {
    const { clients } = await import('./config');

    const results = await Promise.all(
        clients.map(client => fetchClientVersions(client.id))
    );

    return results.filter((r): r is ClientVersions => r !== null);
}

/**
 * Проверить доступность Versioner
 */
export async function isVersionerAvailable(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(config.versionerBaseUrl, {
            method: 'HEAD',
            signal: controller.signal,
        });

        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}
