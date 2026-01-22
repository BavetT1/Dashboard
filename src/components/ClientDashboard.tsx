'use client';

import { useState, useMemo } from 'react';
import DateFilter, { DateRange } from './DateFilter';
import MetricsChart from './MetricsChart';
import VersionsTable from './VersionsTable';
import { DailyMetrics, ClientMetrics, VersionInfo } from '@/types';

interface ClientDashboardProps {
    metrics: ClientMetrics;
    versions: VersionInfo[];
    clientName: string;
}

function formatNumber(num: number): string {
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

// Получить начало текущего года
function getYearStart(): string {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
}

export default function ClientDashboard({ metrics, versions, clientName }: ClientDashboardProps) {
    const { dailyData, lastUpdated, summary } = metrics;

    // Определяем диапазон на основе реальных данных
    const getInitialRange = (): DateRange => {
        if (dailyData.length === 0) {
            return {
                startDate: '2020-01-01',
                endDate: new Date().toISOString().split('T')[0],
                label: 'Всё время',
            };
        }

        // Сортируем данные по дате
        const sortedData = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
        const lastDate = sortedData[sortedData.length - 1].date;

        // По умолчанию показываем последний месяц данных
        const lastDateObj = new Date(lastDate);
        const monthAgo = new Date(lastDateObj);
        monthAgo.setDate(monthAgo.getDate() - 30);

        return {
            startDate: monthAgo.toISOString().split('T')[0],
            endDate: lastDate,
            label: 'Последний месяц',
        };
    };

    // По умолчанию показываем последний месяц данных
    const [dateRange, setDateRange] = useState<DateRange>(getInitialRange);

    // Фильтрация данных по выбранному периоду
    const filteredData = useMemo(() => {
        return dailyData.filter(d => {
            return d.date >= dateRange.startDate && d.date <= dateRange.endDate;
        });
    }, [dailyData, dateRange]);

    // Пересчёт сводки для отфильтрованных данных
    const filteredSummary = useMemo(() => {
        if (filteredData.length === 0) {
            return {
                totalSms: 0,
                totalClicks: 0,
                totalLeads: 0,
                totalProfit: 0,
                totalReward: 0,
                averageConversion: 0,
                periodStart: dateRange.startDate,
                periodEnd: dateRange.endDate,
            };
        }

        const totalSms = filteredData.reduce((sum, d) => sum + d.deliveredSms, 0);
        const totalClicks = filteredData.reduce((sum, d) => sum + d.uniqueClicks, 0);
        const totalLeads = filteredData.reduce((sum, d) => sum + d.totalLeads, 0);
        const totalProfit = filteredData.reduce((sum, d) => sum + d.profit, 0);
        const totalReward = filteredData.reduce((sum, d) => sum + d.reward, 0);
        const avgConversion = filteredData.reduce((sum, d) => sum + d.smsToClickConversion, 0) / filteredData.length;

        const sorted = [...filteredData].sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalSms,
            totalClicks,
            totalLeads,
            totalProfit,
            totalReward,
            averageConversion: avgConversion,
            periodStart: sorted[0].date,
            periodEnd: sorted[sorted.length - 1].date,
        };
    }, [filteredData, dateRange]);

    const handleFilterChange = (range: DateRange) => {
        setDateRange(range);
    };

    return (
        <>
            {/* Фильтр периода */}
            <DateFilter onFilterChange={handleFilterChange} />

            {/* Информация о периоде */}
            <p className="page-subtitle" style={{ marginTop: '-16px' }}>
                Период: {filteredSummary.periodStart || 'нет данных'} — {filteredSummary.periodEnd || 'нет данных'} •
                {filteredData.length} дней •
                Обновлено: {new Date(lastUpdated).toLocaleString('ru-RU')}
            </p>

            {/* Сводка (пересчитанная для периода) */}
            <div className="cards-grid" style={{ marginBottom: '32px' }}>
                <div className="card" style={{ cursor: 'default' }}>
                    <div className="metric-label">Всего SMS</div>
                    <div className="metric-value">{formatNumber(filteredSummary.totalSms)}</div>
                </div>
                <div className="card" style={{ cursor: 'default' }}>
                    <div className="metric-label">Всего заявок</div>
                    <div className="metric-value">{formatNumber(filteredSummary.totalLeads)}</div>
                </div>
                <div className="card" style={{ cursor: 'default' }}>
                    <div className="metric-label">Прибыль веба</div>
                    <div className={`metric-value ${filteredSummary.totalProfit > 0 ? 'positive' : filteredSummary.totalProfit < 0 ? 'negative' : ''}`}>
                        {formatCurrency(filteredSummary.totalProfit)}
                    </div>
                </div>
                <div className="card" style={{ cursor: 'default' }}>
                    <div className="metric-label">PayPayout</div>
                    <div className="metric-value">{formatCurrency(filteredSummary.totalReward)}</div>
                </div>
                <div className="card" style={{ cursor: 'default' }}>
                    <div className="metric-label">Стоимость за SMS</div>
                    <div className="metric-value">
                        {filteredSummary.totalSms > 0
                            ? (filteredSummary.totalReward / filteredSummary.totalSms).toFixed(2) + ' ₽'
                            : '—'}
                    </div>
                </div>
            </div>

            {/* Графики */}
            {filteredData.length > 0 ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <MetricsChart data={filteredData} type="profit" />
                        <MetricsChart data={filteredData} type="sms" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <MetricsChart data={filteredData} type="conversion" />
                        <MetricsChart data={filteredData} type="leads" />
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <h3>Нет данных за выбранный период</h3>
                    <p>Попробуйте выбрать другой диапазон дат</p>
                </div>
            )}

            {/* Версии модулей */}
            <VersionsTable
                versions={versions}
                clientName={clientName}
            />

            {/* Таблица детальных данных */}
            <div className="table-container" style={{ marginTop: '32px' }}>
                <h3 className="chart-title">Детальные данные по дням ({filteredData.length} записей)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>SMS</th>
                            <th>Клики</th>
                            <th>Конверсия</th>
                            <th>Заявки</th>
                            <th>Одобрено</th>
                            <th>Прибыль</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...filteredData]
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .slice(0, 50)
                            .map((day, index) => (
                                <tr key={index}>
                                    <td>{new Date(day.date).toLocaleDateString('ru-RU')}</td>
                                    <td>{formatNumber(day.deliveredSms)}</td>
                                    <td>{formatNumber(day.uniqueClicks)}</td>
                                    <td>{formatPercent(day.smsToClickConversion)}</td>
                                    <td>{formatNumber(day.totalLeads)}</td>
                                    <td>{formatNumber(day.approvedLeads)}</td>
                                    <td className={day.profit > 0 ? 'positive' : day.profit < 0 ? 'negative' : ''}>
                                        {formatCurrency(day.profit)}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {filteredData.length > 50 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '16px' }}>
                        Показано 50 из {filteredData.length} записей
                    </p>
                )}
            </div>
        </>
    );
}
