import { Client } from '@/types';

// Конфигурация клиентов
export const clients: Client[] = [
    {
        id: 't2-rf',
        name: 'Т2 РФ',
        spreadsheetId: '1gBuY-js0b7kxkGNmevZE17122lAlJDJKEYoUejJnIv4',
        sheetName: 'Sheet1', // Основной лист
        versionerPath: '/t2',
    },
    {
        id: 'beeline-rf',
        name: 'Билайн РФ',
        spreadsheetId: '1XMeUCIqaj7PY8bo3CSIKrF11kbwjyGpLgt4gaeCzedE',
        sheetName: 'Sheet1',
        versionerPath: '/beeline',
    },
];

// Конфигурация API
export const config = {
    // Google Sheets
    googleCredentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json',

    // Versioner
    versionerBaseUrl: process.env.VERSIONER_URL || 'http://versioner.cloud.c2m',

    // Кеширование
    cacheTtlMs: 24 * 60 * 60 * 1000, // 24 часа в миллисекундах

    // Обновление данных
    updateIntervalMs: 24 * 60 * 60 * 1000, // 24 часа
};

// Маппинг колонок Google Sheets на поля
export const columnMapping = {
    date: 0,                    // A: Дата
    deliveredSms: 1,            // B: Количество доставленных смс
    uniqueClicks: 2,            // C: Уникальный клик
    smsToClickConversion: 3,    // D: Конверсия из SMS в клик
    clickToLeadConversion: 4,   // E: Конверсия из клика в заявку (CR)
    leadToApprovalConversion: 5,// F: Конверсия из заявки в выдачу (AR)
    reward: 6,                  // G: Сумма вознаграждения
    revenuePerSms: 7,           // H: Доход на смс
    // колонка I пустая
    approvedLeads: 9,           // J: Одобрено заявок
    pendingLeads: 10,           // K: Заявки на рассмотрении
    rejectedLeads: 11,          // L: Отказы
    totalLeads: 12,             // M: Итого заявок
    smsToLeadConversion: 13,    // N: Конверсия SMS - Заявка %
    smsToApprovalConversion: 14,// O: Конверсия SMS - Выдача %
    epc: 15,                    // P: EPC
    ctr: 16,                    // Q: CTR
    expense: 17,                // R: ~Расход
    profit: 18,                 // S: Прибыль веба
};

export function getClientById(id: string): Client | undefined {
    return clients.find(c => c.id === id);
}
