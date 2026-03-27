import { create } from 'zustand';
import type { ConnectionConfig, ConnectionStatus } from '../types/connection';
import * as api from '../utils/invoke';
import { useNodeStore } from './nodeStore';
import { toast } from '../utils/toast';

interface ConnectionState {
  connections: ConnectionConfig[];
  connectionStatuses: Map<string, ConnectionStatus>;
  activeConnectionId: string | null;
  isLoading: boolean;
  error: string | null;
  
  loadConnections: () => Promise<void>;
  saveConnection: (connection: ConnectionConfig) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  setActiveConnection: (id: string | null) => void;
  connect: (id: string) => Promise<boolean>;
  disconnect: (id: string) => Promise<void>;
  testConnection: (connection: ConnectionConfig) => Promise<{ success: boolean; message: string }>;
  updateConnectionStatus: (id: string, status: ConnectionStatus) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  connectionStatuses: new Map(),
  activeConnectionId: null,
  isLoading: false,
  error: null,

  loadConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const connections = await api.listConnections();
      set({ connections, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  saveConnection: async (connection) => {
    try {
      await api.saveConnection(connection);
      const connections = get().connections;
      const existing = connections.find(c => c.id === connection.id);
      if (existing) {
        set({ connections: connections.map(c => c.id === connection.id ? connection : c) });
      } else {
        set({ connections: [...connections, connection] });
      }
      toast.success('连接配置已保存');
    } catch (err) {
      const errorMessage = String(err);
      set({ error: errorMessage });
      toast.error(`保存失败: ${errorMessage}`);
      throw err;
    }
  },

  deleteConnection: async (id) => {
    try {
      await api.deleteConnection(id);
      const wasActive = get().activeConnectionId === id;
      set((state) => ({
        connections: state.connections.filter(c => c.id !== id),
        activeConnectionId: wasActive ? null : state.activeConnectionId,
      }));
      if (wasActive) {
        useNodeStore.getState().clearTree();
      }
      toast.success('连接已删除');
    } catch (err) {
      const errorMessage = String(err);
      set({ error: errorMessage });
      toast.error(`删除失败: ${errorMessage}`);
      throw err;
    }
  },

  setActiveConnection: (id) => set({ activeConnectionId: id }),

  connect: async (id) => {
    const status: ConnectionStatus = { id, status: 'connecting' };
    set((state) => {
      const newStatuses = new Map(state.connectionStatuses);
      newStatuses.set(id, status);
      return { connectionStatuses: newStatuses };
    });

    try {
      const result = await api.connectZk(id);
      const newStatus: ConnectionStatus = {
        id,
        status: result.success ? 'connected' : 'error',
        error: result.success ? undefined : result.message,
        connectedAt: result.success ? new Date().toISOString() : undefined,
      };
      set((state) => {
        const newStatuses = new Map(state.connectionStatuses);
        newStatuses.set(id, newStatus);
        return {
          connectionStatuses: newStatuses,
          activeConnectionId: result.success ? id : state.activeConnectionId,
        };
      });
      if (result.success) {
        toast.success(`已连接到 ZooKeeper`);
      } else {
        toast.error(`连接失败: ${result.message}`);
      }
      return result.success;
    } catch (err) {
      const errorMessage = String(err);
      const errorStatus: ConnectionStatus = { id, status: 'error', error: errorMessage };
      set((state) => {
        const newStatuses = new Map(state.connectionStatuses);
        newStatuses.set(id, errorStatus);
        return { connectionStatuses: newStatuses };
      });
      toast.error(`连接失败: ${errorMessage}`);
      return false;
    }
  },

  disconnect: async (id) => {
    try {
      await api.disconnectZk(id);
      const wasActive = get().activeConnectionId === id;
      const status: ConnectionStatus = { id, status: 'disconnected' };
      set((state) => {
        const newStatuses = new Map(state.connectionStatuses);
        newStatuses.set(id, status);
        return {
          connectionStatuses: newStatuses,
          activeConnectionId: wasActive ? null : state.activeConnectionId,
        };
      });
      if (wasActive) {
        useNodeStore.getState().clearTree();
      }
      toast.info('已断开连接');
    } catch (err) {
      const errorMessage = String(err);
      set({ error: errorMessage });
      toast.error(`断开连接失败: ${errorMessage}`);
    }
  },

  testConnection: async (connection) => {
    try {
      const result = await api.testConnection(connection);
      return { success: result.success, message: result.message };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  updateConnectionStatus: (id, status) => {
    set((state) => {
      const newStatuses = new Map(state.connectionStatuses);
      newStatuses.set(id, status);
      return { connectionStatuses: newStatuses };
    });
  },
}));
