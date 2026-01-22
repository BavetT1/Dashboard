import Link from 'next/link';
import { ClientMetrics } from '@/types';

interface ClientCardProps {
    metrics: ClientMetrics;
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('ru-RU');
}

function formatCurrency(num: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(num);
}

function formatPercent(num: number): string {
    return (num * 100).toFixed(2) + '%';
}

export default function ClientCard({ metrics }: ClientCardProps) {
    const { summary, clientName, clientId, lastUpdated, dailyData } = metrics;

    // Последний день данных
    const latestDay = dailyData[dailyData.length - 1];

    // Определяем статус прибыли
    const profitClass = summary.totalProfit > 0 ? 'positive' : summary.totalProfit < 0 ? 'negative' : '';

    return (
        <Link href={`/clients/${clientId}`} style={{ textDecoration: 'none' }}>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{clientName}</h3>
                    <span className="card-badge">Активен</span>
                </div>

                <div className="metrics-row">
                    <div className="metric">
                        <div className="metric-label">Всего SMS</div>
                        <div className="metric-value">{formatNumber(summary.totalSms)}</div>
                    </div>
                    <div className="metric">
                        <div className="metric-label">Всего лидов</div>
                        <div className="metric-value">{formatNumber(summary.totalLeads)}</div>
                    </div>
                </div>

                <div className="metrics-row">
                    <div className="metric">
                        <div className="metric-label">Ср. конверсия</div>
                        <div className="metric-value">{formatPercent(summary.averageConversion)}</div>
                    </div>
                    <div className="metric">
                        <div className="metric-label">Прибыль</div>
                        <div className={`metric-value ${profitClass}`}>
                            {formatCurrency(summary.totalProfit)}
                        </div>
                    </div>
                </div>

                <div className="status">
                    <span className="status-dot"></span>
                    Обновлено: {new Date(lastUpdated).toLocaleString('ru-RU')}
                </div>
            </div>
        </Link>
    );
}
