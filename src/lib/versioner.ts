import { VersionInfo, ClientVersions } from '@/types';
import { config, getClientById, clients } from './config';
import { getFromCache, setInCache, getFromCacheStale } from './cache';

// Маппинг ID клиентов на проекты в Versioner
const clientToProject: Record<string, string> = {
    't2-rf': 't2ru',
    'beeline-rf': 'bee_ru',
    't2-kz': 't2kz',
    'beeline-kz': 'bee_kz',
};

interface VersionerServiceData {
    name: string;
    aliases: string[];
    type: string;
    image_type: string;
    repository: string | null;
    image: string;
    projects: Record<string, string>;
}

/**
 * Получить все версии из Versioner API
 */
async function fetchVersionerData(): Promise<VersionerServiceData[] | null> {
    const cacheKey = 'versioner-all-data';

    // Проверяем кеш
    const cached = getFromCache<VersionerServiceData[]>(cacheKey);
    if (cached) {
        console.log('[Versioner] Возвращаем кешированные данные');
        return cached;
    }

    try {
        const url = `${config.versionerBaseUrl}/api/v1/versions`;
        console.log(`[Versioner] Запрашиваем ${url}...`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data: VersionerServiceData[] = await response.json();

        // Кешируем на 24 часа
        setInCache(cacheKey, data, config.cacheTtlMs);

        console.log(`[Versioner] Получено ${data.length} сервисов`);
        return data;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('[Versioner] Таймаут (VPN выключен?)');
        } else {
            console.error('[Versioner] Ошибка:', error);
        }

        // Пробуем вернуть устаревшие данные
        const stale = getFromCacheStale<VersionerServiceData[]>(cacheKey);
        if (stale) {
            console.log('[Versioner] Возвращаем устаревшие данные');
            return stale;
        }

        return null;
    }
}

/**
 * Получить версии модулей для клиента из Versioner
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
    if (!client) {
        console.error(`[Versioner] Клиент не найден: ${clientId}`);
        return null;
    }

    const projectKey = clientToProject[clientId];
    if (!projectKey) {
        console.error(`[Versioner] Проект не настроен для ${clientId}`);
        return null;
    }

    try {
        const allData = await fetchVersionerData();
        if (!allData) {
            return getFromCacheStale<ClientVersions>(cacheKey);
        }

        // Фильтруем сервисы для нужного проекта
        const versions: VersionInfo[] = allData
            .filter(service => service.projects[projectKey])
            .map(service => ({
                moduleName: service.name,
                version: service.projects[projectKey],
                environment: 'production',
                newestVersion: service.projects.newest,
                type: service.type,
            }));

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
        console.error(`[Versioner] Ошибка для ${clientId}:`, error);
        return getFromCacheStale<ClientVersions>(cacheKey);
    }
}

/**
 * Получить версии для всех клиентов
 */
export async function fetchAllVersions(): Promise<ClientVersions[]> {
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

        const response = await fetch(`${config.versionerBaseUrl}/api/v1/versions`, {
            method: 'HEAD',
            signal: controller.signal,
        });

        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}
