// Типы для Dashboard мониторинга

export interface Client {
    id: string;
    name: string;
    spreadsheetId: string;
    sheetName: string;
    versionerPath?: string;
}

export interface DailyMetrics {
    date: string;
    deliveredSms: number;
    uniqueClicks: number;
    smsToClickConversion: number;
    clickToLeadConversion: number;
    leadToApprovalConversion: number;
    reward: number;
    revenuePerSms: number;
    approvedLeads: number;
    pendingLeads: number;
    rejectedLeads: number;
    totalLeads: number;
    smsToLeadConversion: number;
    smsToApprovalConversion: number;
    epc: number;
    ctr: number;
    expense: number;
    profit: number;
}

export interface ClientMetrics {
    clientId: string;
    clientName: string;
    lastUpdated: string;
    dailyData: DailyMetrics[];
    summary: MetricsSummary;
}

export interface MetricsSummary {
    totalSms: number;
    totalClicks: number;
    totalLeads: number;
    totalProfit: number;
    averageConversion: number;
    periodStart: string;
    periodEnd: string;
}

export interface VersionInfo {
    moduleName: string;
    version: string;
    environment: string;
    lastDeployed?: string;
}

export interface ClientVersions {
    clientId: string;
    versions: VersionInfo[];
    lastChecked: string;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export interface DashboardData {
    clients: ClientMetrics[];
    versionsAvailable: boolean;
    lastGlobalUpdate: string;
}
