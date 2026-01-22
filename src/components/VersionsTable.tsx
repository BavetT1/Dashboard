'use client';

import { VersionInfo } from '@/types';
import CollapsibleSection from './CollapsibleSection';

interface VersionsTableProps {
    versions: VersionInfo[];
    clientName: string;
}

export default function VersionsTable({ versions, clientName }: VersionsTableProps) {
    if (versions.length === 0) {
        return (
            <CollapsibleSection title={`Версии модулей — ${clientName}`} count={0}>
                <div className="table-container">
                    <div className="empty-state">
                        <h3>Нет данных о версиях</h3>
                        <p>Versioner недоступен или VPN отключен</p>
                    </div>
                </div>
            </CollapsibleSection>
        );
    }

    return (
        <CollapsibleSection title={`Версии модулей — ${clientName}`} count={versions.length}>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Модуль</th>
                            <th>Версия</th>
                            <th>Тип</th>
                            <th>Окружение</th>
                        </tr>
                    </thead>
                    <tbody>
                        {versions.map((v, index) => (
                            <tr key={index}>
                                <td style={{ fontWeight: 500 }}>{v.moduleName}</td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <code style={{
                                            background: 'rgba(99, 102, 241, 0.2)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.875rem',
                                            width: 'fit-content'
                                        }}>
                                            {v.version}
                                        </code>
                                        {v.newestVersion && v.version !== v.newestVersion && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Newest: {v.newestVersion}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>{v.type || 'service'}</td>
                                <td>{v.environment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CollapsibleSection>
    );
}
