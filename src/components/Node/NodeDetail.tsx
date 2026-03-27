import { useState } from 'react';
import type { ZNode } from '../../types/node';

interface NodeDetailProps {
  node: ZNode;
  nodePath: string;
  editMode: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
}

function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString();
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function NodeDetail({ node, nodePath, editMode, editValue, onEditChange, onSave }: NodeDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(nodePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* 节点路径 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">节点路径</h4>
          <button
            onClick={handleCopyPath}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
          >
            {copied ? '已复制 ✓' : '复制路径'}
          </button>
        </div>
        <div className="bg-gray-50 p-2 rounded font-mono text-sm text-gray-800 break-all">
          {nodePath}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">数据内容</h4>
          {editMode && (
            <button
              onClick={onSave}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              保存
            </button>
          )}
        </div>
        {editMode ? (
          <textarea
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="节点数据"
          />
        ) : (
          <div className="bg-gray-50 p-3 rounded-md font-mono text-sm whitespace-pre-wrap break-all min-h-[100px] max-h-40 overflow-auto">
            {node.data || <span className="text-gray-400">无数据</span>}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">统计信息</h4>
        <div className="bg-white border border-gray-200 rounded-md text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">创建 ZXID</span>
            <span className="font-mono text-gray-700">{node.stat.czxid}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">修改 ZXID</span>
            <span className="font-mono text-gray-700">{node.stat.mzxid}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">创建时间</span>
            <span className="font-mono text-gray-700">{formatTimestamp(node.stat.ctime)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">修改时间</span>
            <span className="font-mono text-gray-700">{formatTimestamp(node.stat.mtime)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">数据版本</span>
            <span className="font-mono text-gray-700">{node.stat.version}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">子节点版本</span>
            <span className="font-mono text-gray-700">{node.stat.cversion}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">ACL 版本</span>
            <span className="font-mono text-gray-700">{node.stat.aversion}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">数据大小</span>
            <span className="font-mono text-gray-700">{formatSize(node.stat.data_length)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">子节点数</span>
            <span className="font-mono text-gray-700">{node.stat.num_children}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">临时节点所有者</span>
            <span className="font-mono text-gray-700">{node.stat.ephemeral_owner || '无'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
