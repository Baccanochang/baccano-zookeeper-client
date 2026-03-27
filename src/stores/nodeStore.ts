import { create } from 'zustand';
import type { TreeNode } from '../types/node';
import * as api from '../utils/invoke';

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
}

export const useNodeStore = create<NodeState>((set, get) => ({
  treeData: new Map(),
  selectedNodePath: null,
  expandedPaths: new Set(),
  loadingPaths: new Set(),

  loadNodeChildren: async (connectionId: string, path: string) => {
    const pathKey = `${connectionId}:${path}`;
    if (get().loadingPaths.has(pathKey)) return;

    set((state) => {
      const newLoadingPaths = new Set(state.loadingPaths);
      newLoadingPaths.add(pathKey);
      return { loadingPaths: newLoadingPaths };
    });

    try {
      const children = await api.getChildren(connectionId, path);
      
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
      set((state) => {
        const newLoadingPaths = new Set(state.loadingPaths);
        newLoadingPaths.delete(pathKey);
        return { loadingPaths: newLoadingPaths };
      });
      throw error;
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
    
    set((state) => {
      const newLoadingPaths = new Set(state.loadingPaths);
      newLoadingPaths.add(pathKey);
      return { loadingPaths: newLoadingPaths };
    });

    try {
      const children = await api.getChildren(connectionId, path);
      
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
      set((state) => {
        const newLoadingPaths = new Set(state.loadingPaths);
        newLoadingPaths.delete(pathKey);
        return { loadingPaths: newLoadingPaths };
      });
      throw error;
    }
  },
}));
