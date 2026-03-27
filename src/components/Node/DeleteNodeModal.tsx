interface DeleteNodeModalProps {
  nodePath: string;
  hasChildren: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteNodeModal({ nodePath, hasChildren, onConfirm, onCancel }: DeleteNodeModalProps) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">确认删除节点</h3>
          <p className="mt-2 text-sm text-gray-500">
            确定要删除节点 <span className="font-mono text-gray-700">{nodePath}</span> 吗？
          </p>
          {hasChildren && (
            <p className="mt-2 text-sm text-red-500">
              该节点包含子节点，删除操作将同时删除所有子节点。
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            此操作无法撤销。
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          删除
        </button>
      </div>
    </div>
  );
}
