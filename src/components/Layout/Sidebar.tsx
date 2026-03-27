import { useState, useEffect } from 'react';
import { useConnectionStore } from '../../stores';
import { ConnectionList, ConnectionForm } from '../Connection';
import { Modal } from '../ui/Modal';
import type { ConnectionConfig } from '../../types/connection';

export function Sidebar() {
  const {
    connections,
    connectionStatuses,
    activeConnectionId,
    loadConnections,
    saveConnection,
    deleteConnection,
    setActiveConnection,
    connect,
    disconnect,
    testConnection,
  } = useConnectionStore();

  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionConfig | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleAddNew = () => {
    setEditingConnection(null);
    setShowForm(true);
  };

  const handleEdit = (connection: ConnectionConfig) => {
    setEditingConnection(connection);
    setShowForm(true);
  };

  const handleSave = async (connection: ConnectionConfig) => {
    await saveConnection(connection);
    setShowForm(false);
    setEditingConnection(null);
  };

  const handleDelete = async (id: string) => {
    await deleteConnection(id);
    setDeleteConfirmId(null);
  };

  const handleTest = async (connection: ConnectionConfig): Promise<boolean> => {
    const result = await testConnection(connection);
    return result.success;
  };

  return (
    <>
      <aside className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
        <ConnectionList
          connections={connections}
          connectionStatuses={connectionStatuses}
          activeConnectionId={activeConnectionId}
          onConnect={connect}
          onDisconnect={disconnect}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteConfirmId(id)}
          onSelect={setActiveConnection}
          onAddNew={handleAddNew}
        />
      </aside>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingConnection ? '编辑连接' : '新建连接'}
      >
        <ConnectionForm
          connection={editingConnection || undefined}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onTest={handleTest}
        />
      </Modal>

      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除"
      >
        <div className="p-4">
          <p className="text-gray-600">
            确定要删除此连接吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              删除
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
