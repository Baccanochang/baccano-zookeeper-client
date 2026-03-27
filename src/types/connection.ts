export interface ConnectionConfig {
  id: string;
  name: string;
  hosts: string;
  sessionTimeoutMs: number;
  connectionTimeoutMs: number;
  authScheme?: string;
  authCredential?: string;
  useSsl?: boolean;
  sslCaPath?: string;
  sslCertPath?: string;
  sslKeyPath?: string;
  readonly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionStatus {
  id: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'timeout';
  error?: string;
  connectedAt?: string;
}

export interface ConnectionSummary {
  id: string;
  name: string;
  hosts: string;
}

export function createDefaultConnection(name: string = '', hosts: string = ''): ConnectionConfig {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    hosts,
    sessionTimeoutMs: 30000,
    connectionTimeoutMs: 10000,
    useSsl: false,
    readonly: false,
    createdAt: now,
    updatedAt: now,
  };
}
