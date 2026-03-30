import { useState, useEffect, ReactElement } from 'react';
import { useNodeStore } from '../../stores';
import NodeContextMenu from './NodeContextMenu';

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );
}

interface NodeTreeProps {
  connectionId: string;
  onNodeSelect: (path: string | null) => void;
  onCreateChild?: (parentPath: string) => void;
  onDeleteNode?: (path: string) => void;
  onRefreshNode?: (path: string) => void;
}

export default function NodeTree({ connectionId, onNodeSelect, onCreateChild, onDeleteNode, onRefreshNode }: NodeTreeProps) {
  const { treeData, selectedNodePath, loadingPaths, selectNode, loadNodeChildren } = useNodeStore();
  const [localExpandedPaths, setLocalExpandedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ path: string; x: number; y: number } | null>(null);

  useEffect(() => {
    loadNodeChildren(connectionId, '/');
  }, [connectionId, loadNodeChildren]);

  const handleNodeClick = (path: string) => {
    selectNode(path);
    onNodeSelect(path);
  };

  const handleToggle = (path: string) => {
    setLocalExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
        loadNodeChildren(connectionId, path);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ path, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const getNodeKey = (path: string) => `${connectionId}:${path}`;

  const renderNode = (path: string, depth: number = 0): ReactElement | null => {
    const nodeKey = getNodeKey(path);
    const node = treeData.get(nodeKey);
    if (!node) return null;

    const isExpanded = localExpandedPaths.has(path);
    const isLoading = loadingPaths.has(nodeKey);
    const isSelected = selectedNodePath === path;
    // 如果 hasChildren 未定义但 isLoaded 为 false，则假设可能有子节点
    const mayHaveChildren = node.hasChildren === undefined ? !node.isLoaded : node.hasChildren;
    const showExpandIcon = mayHaveChildren || node.children.length > 0;

    return (
      <div key={path} style={{ paddingLeft: `${depth * 12}px` }}>
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          onClick={() => handleNodeClick(path)}
          onContextMenu={(e) => handleContextMenu(e, path)}
        >
          {showExpandIcon && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(path);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          <span className="ml-1">
            {showExpandIcon ? (
              <FolderIcon className="w-4 h-4 text-yellow-500" />
            ) : (
              <FileIcon className="w-4 h-4 text-gray-400" />
            )}
          </span>
          <span className="ml-2 text-sm text-gray-700 truncate">
            {node.name}
          </span>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div className="pl-4">
            {node.children.map((childName) => {
              const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
              return renderNode(childPath, depth + 1);
            })}
          </div>
        )}
        {isLoading && (
          <div className="pl-4 py-1">
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        )}
      </div>
    );
  };

  const rootKey = getNodeKey('/');
  const rootNode = treeData.get(rootKey);
  if (!rootNode) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        {loadingPaths.has(rootKey) ? (
          <span>Loading...</span>
        ) : (
          <span>暂无节点数据</span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-auto">
        {renderNode('/', 0)}
      </div>
      {contextMenu && (
        <NodeContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          isRootNode={contextMenu.path === '/'}
          onClose={closeContextMenu}
          onCreateChild={() => onCreateChild?.(contextMenu.path)}
          onDeleteNode={() => onDeleteNode?.(contextMenu.path)}
          onRefresh={() => onRefreshNode?.(contextMenu.path)}
        />
      )}
    </>
  );
}
