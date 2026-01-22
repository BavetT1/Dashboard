'use client';

import { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { DailyMetrics } from '@/types';

// Регистрация компонентов Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface MetricsChartProps {
    data: DailyMetrics[];
    type?: 'profit' | 'sms' | 'conversion' | 'leads';
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function MetricsChart({ data, type = 'profit' }: MetricsChartProps) {
    const chartRef = useRef<ChartJS<'line' | 'bar'>>(null);

    // Сортируем по дате
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sortedData.map(d => formatDate(d.date));

    const chartConfigs = {
        profit: {
            title: 'Прибыль по дням',
            datasets: [
                {
                    label: 'Прибыль',
                    data: sortedData.map(d => d.profit),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Расход',
                    data: sortedData.map(d => d.expense),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        sms: {
            title: 'SMS и Клики',
            datasets: [
                {
                    label: 'Доставлено SMS',
                    data: sortedData.map(d => d.deliveredSms),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Уникальные клики',
                    data: sortedData.map(d => d.uniqueClicks),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        conversion: {
            title: 'Конверсии',
            datasets: [
                {
                    label: 'SMS → Клик',
                    data: sortedData.map(d => d.smsToClickConversion * 100),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                },
                {
                    label: 'Клик → Заявка',
                    data: sortedData.map(d => d.clickToLeadConversion * 100),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                },
                {
                    label: 'Заявка → Выдача',
                    data: sortedData.map(d => d.leadToApprovalConversion * 100),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.5)',
                },
            ],
        },
        leads: {
            title: 'Заявки',
            datasets: [
                {
                    label: 'Одобрено',
                    data: sortedData.map(d => d.approvedLeads),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                },
                {
                    label: 'На рассмотрении',
                    data: sortedData.map(d => d.pendingLeads),
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                },
                {
                    label: 'Отказы',
                    data: sortedData.map(d => d.rejectedLeads),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                },
            ],
        },
    };

    const config = chartConfigs[type];

    const chartData = {
        labels,
        datasets: config.datasets,
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#a0a0b0',
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                backgroundColor: '#1a1a24',
                titleColor: '#ffffff',
                bodyColor: '#a0a0b0',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#6b6b7b',
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#6b6b7b',
                },
            },
        },
    };

    const ChartComponent = type === 'leads' ? Bar : Line;

    return (
        <div className="chart-container">
            <h3 className="chart-title">{config.title}</h3>
            <div className="chart-wrapper">
                <ChartComponent ref={chartRef as any} data={chartData} options={options} />
            </div>
        </div>
    );
}
