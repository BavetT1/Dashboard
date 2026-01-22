import { google } from 'googleapis';
import { DailyMetrics, ClientMetrics, MetricsSummary, Client } from '@/types';
import { config, columnMapping, getClientById } from './config';
import { getFromCache, setInCache, getFromCacheStale } from './cache';

// Credentials из переменной окружения
function getCredentials() {
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    if (credentialsJson) {
        return JSON.parse(credentialsJson);
    }
    throw new Error('GOOGLE_CREDENTIALS_JSON не установлена');
}

// Создание авторизованного клиента
async function getAuthClient() {
    const credentials = getCredentials();

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return auth;
}

// Получить название первого листа таблицы
async function getFirstSheetName(auth: any, spreadsheetId: string): Promise<string> {
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties.title',
        });

        const firstSheet = spreadsheet.data.sheets?.[0];
        if (firstSheet?.properties?.title) {
            return firstSheet.properties.title;
        }
    } catch (e) {
        console.error('[GoogleSheets] Не удалось получить название листа:', e);
    }

    return 'Sheet1'; // fallback
}

// Парсинг числа из строки (поддержка русских форматов)
function parseNumber(value: string | undefined): number {
    if (!value) return 0;

    // Убираем символы валюты, пробелы, заменяем запятые на точки
    const cleaned = value
        .replace(/[₽р.\s]/gi, '')
        .replace(/\s/g, '')
        .replace(',', '.');

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// Парсинг процентов
function parsePercent(value: string | undefined): number {
    if (!value) return 0;

    const cleaned = value.replace('%', '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num / 100;
}

// Парсинг даты
function parseDate(value: string | undefined): string {
    if (!value) return '';

    // Формат DD.MM.YYYY
    const parts = value.split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }

    return value;
}

// Проверка валидности даты (должна быть в формате DD.MM.YYYY)
function isValidDate(value: string | undefined): boolean {
    if (!value || value.trim() === '') return false;

    // Проверяем формат DD.MM.YYYY
    const parts = value.trim().split('.');
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Валидация чисел
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 2020 || year > 2030) return false;

    return true;
}

// Преобразование строки в DailyMetrics
function rowToMetrics(row: string[]): DailyMetrics | null {
    const rawDate = row[columnMapping.date];

    // Пропускаем строки без валидной даты (это итоги по неделям/месяцам)
    if (!isValidDate(rawDate)) {
        return null;
    }

    const date = parseDate(rawDate);
    if (!date) return null;

    return {
        date,
        deliveredSms: parseNumber(row[columnMapping.deliveredSms]),
        uniqueClicks: parseNumber(row[columnMapping.uniqueClicks]),
        smsToClickConversion: parsePercent(row[columnMapping.smsToClickConversion]),
        clickToLeadConversion: parsePercent(row[columnMapping.clickToLeadConversion]),
        leadToApprovalConversion: parsePercent(row[columnMapping.leadToApprovalConversion]),
        reward: parseNumber(row[columnMapping.reward]),
        revenuePerSms: parseNumber(row[columnMapping.revenuePerSms]),
        approvedLeads: parseNumber(row[columnMapping.approvedLeads]),
        pendingLeads: parseNumber(row[columnMapping.pendingLeads]),
        rejectedLeads: parseNumber(row[columnMapping.rejectedLeads]),
        totalLeads: parseNumber(row[columnMapping.totalLeads]),
        smsToLeadConversion: parsePercent(row[columnMapping.smsToLeadConversion]),
        smsToApprovalConversion: parsePercent(row[columnMapping.smsToApprovalConversion]),
        epc: parseNumber(row[columnMapping.epc]),
        ctr: parsePercent(row[columnMapping.ctr]),
        expense: parseNumber(row[columnMapping.expense]),
        profit: parseNumber(row[columnMapping.profit]),
    };
}

// Вычисление сводки
function calculateSummary(dailyData: DailyMetrics[]): MetricsSummary {
    if (dailyData.length === 0) {
        return {
            totalSms: 0,
            totalClicks: 0,
            totalLeads: 0,
            totalProfit: 0,
            averageConversion: 0,
            periodStart: '',
            periodEnd: '',
        };
    }

    const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));

    const totalSms = dailyData.reduce((sum, d) => sum + d.deliveredSms, 0);
    const totalClicks = dailyData.reduce((sum, d) => sum + d.uniqueClicks, 0);
    const totalLeads = dailyData.reduce((sum, d) => sum + d.totalLeads, 0);
    const totalProfit = dailyData.reduce((sum, d) => sum + d.profit, 0);

    const avgConversion = dailyData.reduce((sum, d) => sum + d.smsToClickConversion, 0) / dailyData.length;

    return {
        totalSms,
        totalClicks,
        totalLeads,
        totalProfit,
        averageConversion: avgConversion,
        periodStart: sorted[0].date,
        periodEnd: sorted[sorted.length - 1].date,
    };
}

/**
 * Получить данные клиента из Google Sheets
 */
export async function fetchClientMetrics(clientId: string): Promise<ClientMetrics | null> {
    const cacheKey = `metrics-${clientId}`;

    // Проверяем кеш
    const cached = getFromCache<ClientMetrics>(cacheKey);
    if (cached) {
        console.log(`[GoogleSheets] Возвращаем кешированные данные для ${clientId}`);
        return cached;
    }

    const client = getClientById(clientId);
    if (!client) {
        console.error(`[GoogleSheets] Клиент не найден: ${clientId}`);
        return null;
    }

    try {
        console.log(`[GoogleSheets] Загружаем данные для ${client.name}...`);

        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        // Получаем название первого листа
        const sheetName = await getFirstSheetName(auth, client.spreadsheetId);
        console.log(`[GoogleSheets] Используем лист: ${sheetName}`);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: client.spreadsheetId,
            range: `'${sheetName}'!A:S`, // Колонки A-S, экранируем название листа
        });

        const rows = response.data.values || [];

        // Пропускаем заголовки (первые 2 строки)
        const dataRows = rows.slice(2);

        const dailyData: DailyMetrics[] = [];

        for (const row of dataRows) {
            const metrics = rowToMetrics(row);
            if (metrics) {
                dailyData.push(metrics);
            }
        }

        // Сортируем по дате (от старых к новым)
        dailyData.sort((a, b) => a.date.localeCompare(b.date));

        // Логируем первую и последнюю дату для отладки
        if (dailyData.length > 0) {
            console.log(`[GoogleSheets] ${client.name}: первая дата = ${dailyData[0].date}, последняя = ${dailyData[dailyData.length - 1].date}`);
        }

        const result: ClientMetrics = {
            clientId: client.id,
            clientName: client.name,
            lastUpdated: new Date().toISOString(),
            dailyData,
            summary: calculateSummary(dailyData),
        };

        // Сохраняем в кеш на 24 часа
        setInCache(cacheKey, result, config.cacheTtlMs);

        console.log(`[GoogleSheets] Загружено ${dailyData.length} записей для ${client.name}`);

        return result;
    } catch (error) {
        console.error(`[GoogleSheets] Ошибка загрузки для ${clientId}:`, error);

        // Пробуем вернуть устаревшие данные из кеша
        const stale = getFromCacheStale<ClientMetrics>(cacheKey);
        if (stale) {
            console.log(`[GoogleSheets] Возвращаем устаревшие данные для ${clientId}`);
            return stale;
        }

        return null;
    }
}

/**
 * Получить данные всех клиентов
 */
export async function fetchAllClientsMetrics(): Promise<ClientMetrics[]> {
    const { clients } = await import('./config');

    const results = await Promise.all(
        clients.map(client => fetchClientMetrics(client.id))
    );

    return results.filter((r): r is ClientMetrics => r !== null);
}
