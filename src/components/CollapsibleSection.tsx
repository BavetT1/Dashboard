'use client';

import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
    count?: number;
}

export default function CollapsibleSection({ title, children, defaultOpen = false, count }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="collapsible-section" style={{ marginBottom: '24px' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="collapsible-header"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '12px 0',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left'
                }}
            >
                <div style={{
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '1.2rem',
                    color: 'var(--accent-primary)'
                }}>
                    ▶
                </div>
                <h3 className="chart-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {title}
                    {count !== undefined && (
                        <span style={{
                            fontSize: '0.875rem',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            color: 'var(--text-secondary)',
                            fontWeight: 'normal'
                        }}>
                            {count}
                        </span>
                    )}
                </h3>
            </button>

            {isOpen && (
                <div className="collapsible-content" style={{ animation: 'fadeIn 0.3s ease' }}>
                    {children}
                </div>
            )}
        </div>
    );
}
