import { useConnectionStore } from '../../stores';

export function StatusBar() {
  const { connections, connectionStatuses, activeConnectionId } = useConnectionStore();
  const activeConnection = connections.find(c => c.id === activeConnectionId);
  const activeStatus = activeConnectionId ? connectionStatuses.get(activeConnectionId) : undefined;

  const getStatusText = () => {
    if (!activeConnection) {
      return '未选择连接';
    }
    if (!activeStatus) {
      return `未连接: ${activeConnection.name}`;
    }
    switch (activeStatus.status) {
      case 'connected':
        return `已连接: ${activeConnection.name}`;
      case 'connecting':
        return `连接中: ${activeConnection.name}`;
      case 'error':
        return `连接错误: ${activeStatus.error || '未知错误'}`;
      case 'timeout':
        return `连接超时: ${activeConnection.name}`;
      case 'disconnected':
        return `已断开: ${activeConnection.name}`;
      default:
        return '未知状态';
    }
  };

  const getStatusColor = () => {
    if (!activeConnection || !activeStatus) return 'text-gray-500';
    switch (activeStatus.status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'error':
      case 'timeout':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <footer className="h-7 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-3 text-xs">
      <div className="flex items-center gap-4">
        <span className={getStatusColor()}>
          {getStatusText()}
        </span>
        {activeConnection && (
          <span className="text-gray-500">
            {activeConnection.hosts}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-gray-500">
        <span>v0.1.0</span>
        <span>Baccano ZK Client</span>
      </div>
    </footer>
  );
}
