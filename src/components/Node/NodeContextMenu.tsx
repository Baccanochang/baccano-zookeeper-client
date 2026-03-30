import { useEffect, useRef } from 'react';

interface NodeContextMenuProps {
  position: { x: number; y: number };
  isRootNode: boolean;
  onClose: () => void;
  onCreateChild: () => void;
  onDeleteNode: () => void;
  onRefresh: () => void;
}

export default function NodeContextMenu({
  position,
  isRootNode,
  onClose,
  onCreateChild,
  onDeleteNode,
  onRefresh,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击空白处关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // 延迟添加事件，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleMenuClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[140px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => handleMenuClick(onCreateChild)}
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        新增子节点
      </button>

      <button
        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
          isRootNode
            ? 'text-gray-400 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={() => !isRootNode && handleMenuClick(onDeleteNode)}
        disabled={isRootNode}
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        删除节点
      </button>

      <button
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => handleMenuClick(onRefresh)}
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        刷新
      </button>
    </div>
  );
}