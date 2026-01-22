'use client';

import { useState } from 'react';

export type DateRange = {
    startDate: string;
    endDate: string;
    label: string;
};

interface DateFilterProps {
    onFilterChange: (range: DateRange) => void;
    initialRange?: DateRange;
}

// Получить дату в формате YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Пресеты периодов
function getPresets(): { id: string; label: string; getRange: () => DateRange }[] {
    const now = new Date();
    const currentYear = now.getFullYear();

    return [
        {
            id: 'ytd',
            label: 'С начала года',
            getRange: () => ({
                startDate: `${currentYear}-01-01`,
                endDate: formatDate(now),
                label: 'С начала года',
            }),
        },
        {
            id: 'month',
            label: 'Месяц',
            getRange: () => {
                const start = new Date(now);
                start.setDate(start.getDate() - 30);
                return {
                    startDate: formatDate(start),
                    endDate: formatDate(now),
                    label: 'Последний месяц',
                };
            },
        },
        {
            id: 'week',
            label: 'Неделя',
            getRange: () => {
                const start = new Date(now);
                start.setDate(start.getDate() - 7);
                return {
                    startDate: formatDate(start),
                    endDate: formatDate(now),
                    label: 'Последняя неделя',
                };
            },
        },
        {
            id: 'all',
            label: 'Всё время',
            getRange: () => ({
                startDate: '2020-01-01',
                endDate: formatDate(now),
                label: 'Всё время',
            }),
        },
    ];
}

export default function DateFilter({ onFilterChange, initialRange }: DateFilterProps) {
    const presets = getPresets();
    const defaultRange = presets[0].getRange(); // С начала года

    const [activePreset, setActivePreset] = useState<string>('ytd');
    const [customStart, setCustomStart] = useState(initialRange?.startDate || defaultRange.startDate);
    const [customEnd, setCustomEnd] = useState(initialRange?.endDate || defaultRange.endDate);
    const [showCustom, setShowCustom] = useState(false);

    const handlePresetClick = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setActivePreset(presetId);
            setShowCustom(false);
            const range = preset.getRange();
            setCustomStart(range.startDate);
            setCustomEnd(range.endDate);
            onFilterChange(range);
        }
    };

    const handleCustomApply = () => {
        setActivePreset('custom');
        onFilterChange({
            startDate: customStart,
            endDate: customEnd,
            label: `${customStart} — ${customEnd}`,
        });
    };

    return (
        <div className="date-filter">
            <div className="filter-presets">
                {presets.map(preset => (
                    <button
                        key={preset.id}
                        className={`filter-btn ${activePreset === preset.id ? 'active' : ''}`}
                        onClick={() => handlePresetClick(preset.id)}
                    >
                        {preset.label}
                    </button>
                ))}
                <button
                    className={`filter-btn ${showCustom || activePreset === 'custom' ? 'active' : ''}`}
                    onClick={() => setShowCustom(!showCustom)}
                >
                    📅 Период
                </button>
            </div>

            {showCustom && (
                <div className="custom-range">
                    <div className="date-inputs">
                        <label>
                            <span>От:</span>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                            />
                        </label>
                        <label>
                            <span>До:</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                            />
                        </label>
                        <button className="btn btn-primary" onClick={handleCustomApply}>
                            Применить
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
        .date-filter {
          margin-bottom: 24px;
        }
        
        .filter-presets {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .filter-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.875rem;
        }
        
        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        
        .filter-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }
        
        .custom-range {
          margin-top: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .date-inputs {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        
        .date-inputs label {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .date-inputs label span {
          color: var(--text-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .date-inputs input {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        
        .date-inputs input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }
      `}</style>
        </div>
    );
}
