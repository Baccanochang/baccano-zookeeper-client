import { useState } from 'react';
import { Button } from '../ui';
import type { CreateNodeOptions } from '../../utils/invoke';

interface CreateNodeModalProps {
  parentPath: string;
  onCreate: (options: CreateNodeOptions) => Promise<void>;
  onCancel: () => void;
}

export default function CreateNodeModal({ parentPath, onCreate, onCancel }: CreateNodeModalProps) {
  const [nodeName, setNodeName] = useState('');
  const [nodeData, setNodeData] = useState('');
  const [ephemeral, setEphemeral] = useState(false);
  const [sequential, setSequential] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPath = parentPath === '/' ? `/${nodeName}` : `${parentPath}/${nodeName}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nodeName.trim()) {
      setError('节点名称不能为空');
      return;
    }

    if (!/^[a-zA-Z0-9_\-./]+$/.test(nodeName)) {
      setError('节点名称只能包含字母、数字、下划线、连字符、点号和斜杠');
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      await onCreate({
        path: fullPath,
        data: nodeData || undefined,
        ephemeral,
        sequential,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          父节点路径
        </label>
        <input
          type="text"
          value={parentPath}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          节点名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          placeholder="例如: my-node"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          完整路径
        </label>
        <input
          type="text"
          value={fullPath}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          节点数据
        </label>
        <textarea
          value={nodeData}
          onChange={(e) => setNodeData(e.target.value)}
          placeholder="可选：节点数据内容"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={ephemeral}
            onChange={(e) => setEphemeral(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">临时节点</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={sequential}
            onChange={(e) => setSequential(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">顺序节点</span>
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isCreating || !nodeName.trim()}>
          {isCreating ? '创建中...' : '创建'}
        </Button>
      </div>
    </form>
  );
}
