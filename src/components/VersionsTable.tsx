import { VersionInfo } from '@/types';

interface VersionsTableProps {
    versions: VersionInfo[];
    clientName: string;
}

export default function VersionsTable({ versions, clientName }: VersionsTableProps) {
    if (versions.length === 0) {
        return (
            <div className="table-container">
                <h3 className="chart-title">Версии модулей — {clientName}</h3>
                <div className="empty-state">
                    <h3>Нет данных о версиях</h3>
                    <p>Versioner недоступен или VPN отключен</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-container">
            <h3 className="chart-title">Версии модулей — {clientName}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Модуль</th>
                        <th>Версия</th>
                        <th>Окружение</th>
                        <th>Развёрнуто</th>
                    </tr>
                </thead>
                <tbody>
                    {versions.map((v, index) => (
                        <tr key={index}>
                            <td style={{ fontWeight: 500 }}>{v.moduleName}</td>
                            <td>
                                <code style={{
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                }}>
                                    {v.version}
                                </code>
                            </td>
                            <td>{v.environment}</td>
                            <td style={{ color: '#6b6b7b' }}>
                                {v.lastDeployed
                                    ? new Date(v.lastDeployed).toLocaleDateString('ru-RU')
                                    : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
