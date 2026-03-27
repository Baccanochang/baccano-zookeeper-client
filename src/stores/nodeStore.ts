import { create } from 'zustand';
import type { TreeNode } from '../types/node';
import * as api from '../utils/invoke';

// 存储每个加载请求的 AbortController
const abortControllers = new Map<string, AbortController>();

interface NodeState {
  treeData: Map<string, TreeNode>;
  selectedNodePath: string | null;
  expandedPaths: Set<string>;
  loadingPaths: Set<string>;

  loadNodeChildren: (connectionId: string, path: string) => Promise<void>;
  selectNode: (path: string | null) => void;
  toggleExpand: (path: string) => void;
  expandPath: (path: string) => void;
  collapsePath: (path: string) => void;
  clearTree: () => void;
  refreshNode: (connectionId: string, path: string) => Promise<void>;
  cancelLoad: (path: string) => void;
  cancelAllLoads: () => void;
}

export const useNodeStore = create<NodeState>((set, get) => ({
  treeData: new Map(),
  selectedNodePath: null,
  expandedPaths: new Set(),
  loadingPaths: new Set(),

  loadNodeChildren: async (connectionId: string, path: string) => {
    const pathKey = `${connectionId}:${path}`;
    if (get().loadingPaths.has(pathKey)) return;

    // 创建 AbortController 用于取消请求
    const controller = new AbortController();
    abortControllers.set(pathKey, controller);

    set((state) => {
      const newLoadingPaths = new Set(state.loadingPaths);
      newLoadingPaths.add(pathKey);
      return { loadingPaths: newLoadingPaths };
    });

    try {
      const children = await api.getChildren(connectionId, path);

      // 检查是否已被取消
      if (controller.signal.aborted) return;

      set((state) => {
        const newTreeData = new Map(state.treeData);

        // 更新当前节点
        const existingNode = newTreeData.get(pathKey);
        if (existingNode) {
          newTreeData.set(pathKey, {
            ...existingNode,
            children,
            isLoaded: true,
            isLoading: false,
            hasChildren: children.length > 0,
          });
        } else {
          newTreeData.set(pathKey, {
            path,
            name: path === '/' ? 'root' : path.split('/').pop() || '',
            children,
            isLoaded: true,
            isLoading: false,
            hasChildren: children.length > 0,
          });
        }

        // 为每个子节点创建占位节点
        for (const childName of children) {
          const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
          const childPathKey = `${connectionId}:${childPath}`;

          // 只在不存在时创建
          if (!newTreeData.has(childPathKey)) {
            newTreeData.set(childPathKey, {
              path: childPath,
              name: childName,
              children: [],
              isLoaded: false,
              isLoading: false,
              hasChildren: undefined, // 未知，需要加载后确定
            });
          }
        }

        const newLoadingPaths = new Set(state.loadingPaths);
        newLoadingPaths.delete(pathKey);

        return {
          treeData: newTreeData,
          loadingPaths: newLoadingPaths,
        };
      });
    } catch (error) {
      // 如果是取消导致的错误，不抛出
      if (controller.signal.aborted) return;

      set((state) => {
        const newLoadingPaths = new Set(state.loadingPaths);
        newLoadingPaths.delete(pathKey);
        return { loadingPaths: newLoadingPaths };
      });
      throw error;
    } finally {
      abortControllers.delete(pathKey);
    }
  },

  selectNode: (path: string | null) => {
    set({ selectedNodePath: path });
  },

  toggleExpand: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedPaths: newExpanded };
    });
  },

  expandPath: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      newExpanded.add(path);
      return { expandedPaths: newExpanded };
    });
  },

  collapsePath: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      newExpanded.delete(path);
      return { expandedPaths: newExpanded };
    });
  },

  clearTree: () => {
    set({
      treeData: new Map(),
      selectedNodePath: null,
      expandedPaths: new Set(),
      loadingPaths: new Set(),
    });
  },

  refreshNode: async (connectionId: string, path: string) => {
    const pathKey = `${connectionId}:${path}`;

    // 创建 AbortController 用于取消请求
    const controller = new AbortController();
    abortControllers.set(pathKey, controller);

    set((state) => {
      const newLoadingPaths = new Set(state.loadingPaths);
      newLoadingPaths.add(pathKey);
      return { loadingPaths: newLoadingPaths };
    });

    try {
      const children = await api.getChildren(connectionId, path);

      // 检查是否已被取消
      if (controller.signal.aborted) return;

      set((state) => {
        const newTreeData = new Map(state.treeData);
        const existingNode = newTreeData.get(pathKey);

        if (existingNode) {
          newTreeData.set(pathKey, {
            ...existingNode,
            children,
            isLoaded: true,
            isLoading: false,
          });
        } else {
          newTreeData.set(pathKey, {
            path,
            name: path === '/' ? 'root' : path.split('/').pop() || '',
            children,
            isLoaded: true,
            isLoading: false,
            hasChildren: children.length > 0,
          });
        }

        const newLoadingPaths = new Set(state.loadingPaths);
        newLoadingPaths.delete(pathKey);

        return {
          treeData: newTreeData,
          loadingPaths: newLoadingPaths,
        };
      });
    } catch (error) {
      if (controller.signal.aborted) return;

      set((state) => {
        const newLoadingPaths = new Set(state.loadingPaths);
        newLoadingPaths.delete(pathKey);
        return { loadingPaths: newLoadingPaths };
      });
      throw error;
    } finally {
      abortControllers.delete(pathKey);
    }
  },

  cancelLoad: (path: string) => {
    // 查找匹配的 loadingPath
    const loadingPaths = get().loadingPaths;
    for (const pathKey of loadingPaths) {
      if (pathKey.endsWith(`:${path}`)) {
        const controller = abortControllers.get(pathKey);
        if (controller) {
          controller.abort();
          abortControllers.delete(pathKey);
        }
        set((state) => {
          const newLoadingPaths = new Set(state.loadingPaths);
          newLoadingPaths.delete(pathKey);
          return { loadingPaths: newLoadingPaths };
        });
        break;
      }
    }
  },

  cancelAllLoads: () => {
    // 取消所有正在进行的加载
    abortControllers.forEach((controller) => controller.abort());
    abortControllers.clear();
    set({ loadingPaths: new Set() });
  },
}));
