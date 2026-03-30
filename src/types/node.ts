export interface ZNode {
  path: string;
  name: string;
  data?: string;
  stat: NodeStat;
}

export interface NodeStat {
  czxid: number;
  mzxid: number;
  ctime: number;
  mtime: number;
  version: number;
  cversion: number;
  aversion: number;
  ephemeral_owner: number;
  data_length: number;
  num_children: number;
  pzxid: number;
}

export interface NodeChildren {
  path: string;
  children: string[];
}

export interface TreeNode {
  path: string;
  name: string;
  children: string[];
  isLoaded: boolean;
  isLoading: boolean;
  hasChildren?: boolean; // undefined means unknown, need to load
}

export interface CreateNodeOptions {
  path: string;
  data?: string;
  ephemeral: boolean;
  sequential: boolean;
}

export function createTreeNode(path: string, name: string): TreeNode {
  return {
    path,
    name,
    children: [],
    isLoaded: false,
    isLoading: false,
    hasChildren: true,
  };
}
