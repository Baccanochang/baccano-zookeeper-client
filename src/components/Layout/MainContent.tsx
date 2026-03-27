import { useState, MouseEvent, useEffect } from 'react';
import { useConnectionStore, useNodeStore } from '../../stores';
import { NodeTree, NodeDetail, CreateNodeModal, DeleteNodeModal } from '../Node';
import { Button, Modal } from '../ui';
import * as api from '../../utils/invoke';

import type { ZNode, CreateNodeOptions } from '../../types/node';

export function MainContent() {
  const { activeConnectionId } = useConnectionStore();
  const { selectedNodePath, loadNodeChildren, treeData, refreshNode } = useNodeStore();
  const [splitPosition, setSplitPosition] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [nodeData, setNodeData] = useState<ZNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    if (newPosition >= 20 && newPosition <= 80) {
      setSplitPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeSelect = async (path: string | null) => {
    if (path && activeConnectionId) {
      loadNodeChildren(activeConnectionId, path);
      setIsLoading(true);
      try {
        const data = await api.getData(activeConnectionId, path);
        setNodeData(data);
        setEditValue(data.data || '');
      } catch (error) {
        console.error('Failed to load node data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!nodeData || !activeConnectionId || !selectedNodePath) return;

    try {
      await api.setData(
        activeConnectionId,
        selectedNodePath,
        editValue,
        nodeData.stat.version
      );
      setEditMode(false);
      const data = await api.getData(activeConnectionId, selectedNodePath);
      setNodeData(data);
    } catch (error) {
      console.error('Failed to save node data:', error);
    }
  };

  const handleCreateNode = async (options: CreateNodeOptions) => {
    if (!activeConnectionId) return;
    
    try {
      await api.createNode(activeConnectionId, options);
      setShowCreateModal(false);
      if (selectedNodePath) {
        await refreshNode(activeConnectionId, selectedNodePath);
      }
      await handleNodeSelect(options.path);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteNode = async () => {
    if (!activeConnectionId || !selectedNodePath || !nodeData) return;
    
    try {
      await api.deleteNode(activeConnectionId, selectedNodePath, nodeData.stat.version);
      setShowDeleteModal(false);
      setNodeData(null);
      if (activeConnectionId) {
        const parentPath = selectedNodePath.split('/').slice(0, -1).join('/') || '/';
        await refreshNode(activeConnectionId, parentPath);
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  useEffect(() => {
    if (selectedNodePath && activeConnectionId) {
      handleNodeSelect(selectedNodePath);
    }
  }, [selectedNodePath, activeConnectionId]);

  if (!activeConnectionId) {
    return (
      <main className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">未选择连接</h3>
          <p className="mt-1 text-sm text-gray-500">
            请从左侧边栏选择或创建一个连接
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main
        className="flex-1 bg-white flex"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="border-r border-gray-200 overflow-hidden"
          style={{ width: `${splitPosition}%` }}
        >
          <div className="h-full flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">节点树</h2>
              <div className="flex items-center gap-2">
                {activeConnectionId && (
                  <span className="text-xs text-gray-500">
                    {treeData.size} 个节点
                  </span>
                )}
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  新建
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <NodeTree
                connectionId={activeConnectionId}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          </div>
        </div>

        <div
          className={`w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors duration-150 ${
            isDragging ? 'bg-blue-400' : ''
          }`}
          onMouseDown={handleMouseDown}
        />

        <div
          className="overflow-hidden"
          style={{ width: `${100 - splitPosition}%` }}
        >
          <div className="h-full flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">节点详情</h2>
              {selectedNodePath && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditMode(!editMode)}>
                    {editMode ? '取消' : '编辑'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleNodeSelect(selectedNodePath)}>
                    刷新
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)}>
                    删除
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-500">加载中...</span>
                </div>
              ) : nodeData ? (
                <NodeDetail
                  node={nodeData}
                  editMode={editMode}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onSave={handleSave}
                />
              ) : selectedNodePath ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  <p>选中节点: {selectedNodePath}</p>
                  <p className="text-xs mt-1">（详情将在此显示）</p>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  <p>请选择一个节点查看详情</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建节点"
      >
        <CreateNodeModal
          parentPath={selectedNodePath || '/'}
          onCreate={handleCreateNode}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="删除节点"
      >
        <DeleteNodeModal
          nodePath={selectedNodePath || ''}
          hasChildren={nodeData?.stat.num_children ? nodeData.stat.num_children > 0 : false}
          onConfirm={handleDeleteNode}
          onCancel={() => setShowDeleteModal(false)}
        />
      </Modal>
    </>
  );
}
