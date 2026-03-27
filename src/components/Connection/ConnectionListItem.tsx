import type { ConnectionConfig, ConnectionStatus } from '../../types/connection';
import { Button } from '../ui/Button';

interface ConnectionListItemProps {
  connection: ConnectionConfig;
  status?: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isActive: boolean;
}

export default function ConnectionListItem({
  connection,
  status,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onSelect,
  isActive,
}: ConnectionListItemProps) {
  const getStatusColor = () => {
    if (!status) return 'bg-gray-400';
    switch (status.status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
      case 'timeout':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    if (!status) return '未连接';
    switch (status.status) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'error':
        return status.error || '连接错误';
      case 'timeout':
        return '连接超时';
      default:
        return '未连接';
    }
  };

  const isConnected = status?.status === 'connected';
  const isConnecting = status?.status === 'connecting';

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor()}`}
            title={getStatusText()}
          />
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{connection.name}</h3>
            <p className="text-xs text-gray-500 truncate">{connection.hosts}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">{getStatusText()}</span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {isConnected ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={onDisconnect}
              disabled={isConnecting}
            >
              断开
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? '连接中' : '连接'}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onEdit}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            disabled={isConnected}
          >
            删除
          </Button>
        </div>
      </div>
    </div>
  );
}
