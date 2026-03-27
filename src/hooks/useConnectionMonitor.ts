import { useEffect, useRef } from 'react';
import { useConnectionStore } from '../stores/connectionStore';
import * as api from '../utils/invoke';
import { toast } from '../utils/toast';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function useConnectionMonitor() {
  const { connections, connectionStatuses, updateConnectionStatus } = useConnectionStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const checkConnections = async () => {
      for (const connection of connections) {
        const status = connectionStatuses.get(connection.id);

        // Only check connected connections
        if (status?.status === 'connected') {
          try {
            const isConnected = await api.checkConnection(connection.id);
            if (!isConnected) {
              updateConnectionStatus(connection.id, {
                id: connection.id,
                status: 'disconnected',
                error: 'Connection lost',
              });
              toast.warning(`连接 ${connection.name} 已断开`);
            }
          } catch (err) {
            updateConnectionStatus(connection.id, {
              id: connection.id,
              status: 'error',
              error: String(err),
            });
            toast.error(`连接 ${connection.name} 检测失败`);
          }
        }
      }
    };

    // Start heartbeat check
    intervalRef.current = window.setInterval(checkConnections, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [connections, connectionStatuses, updateConnectionStatus]);
}