import { fetchAllClientsMetrics } from '@/lib/google-sheets';
import { clients } from '@/lib/config';
import ClientCard from '@/components/ClientCard';
import { ClientMetrics } from '@/types';

// Перезагружать данные каждые 24 часа
export const revalidate = 86400;

export default async function HomePage() {
    let metricsData: ClientMetrics[] = [];
    let error: string | null = null;

    try {
        metricsData = await fetchAllClientsMetrics();
    } catch (e) {
        error = e instanceof Error ? e.message : 'Неизвестная ошибка';
        console.error('Ошибка загрузки данных:', e);
    }

    return (
        <main>
            <div className="container">
                <h1 className="page-title">Дашборд Мониторинга</h1>
                <p className="page-subtitle">
                    Централизованный сбор метрик по {clients.length} проектам
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        marginBottom: '24px',
                        color: '#ef4444',
                    }}>
                        <strong>Ошибка загрузки:</strong> {error}
                    </div>
                )}

                {metricsData.length === 0 && !error ? (
                    <div className="empty-state">
                        <h3>Нет данных</h3>
                        <p>Убедитесь, что Google Credentials настроены и сервис-аккаунт имеет доступ к таблицам</p>
                    </div>
                ) : (
                    <div className="cards-grid">
                        {metricsData.map((metrics) => (
                            <ClientCard key={metrics.clientId} metrics={metrics} />
                        ))}
                    </div>
                )}

                <div style={{
                    marginTop: '40px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                }}>
                    <p>
                        Данные обновляются автоматически каждые 24 часа
                    </p>
                </div>
            </div>
        </main>
    );
}
