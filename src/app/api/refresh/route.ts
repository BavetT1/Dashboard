import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/cache';
import { fetchAllClientsMetrics } from '@/lib/google-sheets';

// POST /api/refresh - принудительное обновление данных
export async function POST() {
    try {
        // Очищаем кеш
        clearCache();
        console.log('[API] Кеш очищен');

        // Загружаем свежие данные
        const metrics = await fetchAllClientsMetrics();
        console.log(`[API] Загружено данных для ${metrics.length} клиентов`);

        return NextResponse.json({
            success: true,
            message: 'Данные обновлены',
            clients: metrics.map(m => ({
                id: m.clientId,
                name: m.clientName,
                recordsCount: m.dailyData.length,
                lastDate: m.dailyData[m.dailyData.length - 1]?.date,
            })),
        });
    } catch (error) {
        console.error('[API] Ошибка обновления:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

// GET /api/refresh - информация
export async function GET() {
    return NextResponse.json({
        message: 'Используйте POST для обновления данных',
        endpoint: 'POST /api/refresh',
    });
}
