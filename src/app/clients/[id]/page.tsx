import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchClientMetrics } from '@/lib/google-sheets';
import { fetchClientVersions } from '@/lib/versioner';
import { getClientById } from '@/lib/config';
import ClientDashboard from '@/components/ClientDashboard';

// Перезагружать данные каждые 24 часа
export const revalidate = 86400;

interface ClientPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    const client = getClientById(clientId);
    if (!client) {
        notFound();
    }

    const [metrics, versions] = await Promise.all([
        fetchClientMetrics(clientId),
        fetchClientVersions(clientId),
    ]);

    if (!metrics) {
        return (
            <main>
                <div className="container">
                    <Link href="/" className="btn btn-secondary" style={{ marginBottom: '24px' }}>
                        ← Назад
                    </Link>
                    <div className="empty-state">
                        <h3>Не удалось загрузить данные</h3>
                        <p>Проверьте доступ к Google Sheets для {client.name}</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main>
            <div className="container">
                <Link href="/" className="btn btn-secondary" style={{ marginBottom: '24px', display: 'inline-flex' }}>
                    ← Назад к обзору
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <h1 className="page-title">{client.name}</h1>
                    <span className="card-badge">Активен</span>
                </div>

                <ClientDashboard
                    metrics={metrics}
                    versions={versions?.versions || []}
                    clientName={client.name}
                />
            </div>
        </main>
    );
}
