import { useState, useEffect } from 'react';
import type { ConnectionConfig, ConnectionStatus } from '../../types/connection';
import ConnectionListItem from './ConnectionListItem';
import { Button } from '../ui/Button';

interface ConnectionListProps {
  connections: ConnectionConfig[];
  connectionStatuses: Map<string, ConnectionStatus>;
  activeConnectionId: string | null;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onEdit: (connection: ConnectionConfig) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function ConnectionList({
  connections,
  connectionStatuses,
  activeConnectionId,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onSelect,
  onAddNew,
}: ConnectionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConnections, setFilteredConnections] = useState(connections);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConnections(connections);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredConnections(
        connections.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.hosts.toLowerCase().includes(term)
        )
      );
    }
  }, [connections, searchTerm]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="搜索连接..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={onAddNew} size="sm">
            新建
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? '没有找到匹配的连接' : '暂无连接配置'}
            <Button
              variant="secondary"
              onClick={onAddNew}
              className="mt-2"
              size="sm"
            >
              添加连接
            </Button>
          </div>
        ) : (
          filteredConnections.map((connection) => (
            <ConnectionListItem
              key={connection.id}
              connection={connection}
              status={connectionStatuses.get(connection.id)}
              onConnect={() => onConnect(connection.id)}
              onDisconnect={() => onDisconnect(connection.id)}
              onEdit={() => onEdit(connection)}
              onDelete={() => onDelete(connection.id)}
              onSelect={() => onSelect(connection.id)}
              isActive={activeConnectionId === connection.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
