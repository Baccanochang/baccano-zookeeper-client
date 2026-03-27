import { invoke } from '@tauri-apps/api/core';
import type { ConnectionConfig, ConnectionSummary } from '../types';
import type { NodeChildren, ZNode, NodeStat } from '../types/node';

export interface AppInfo {
  name: string;
  version: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latency_ms?: number;
}

export interface ConnectResult {
  success: boolean;
  message: string;
}

export interface CreateNodeOptions {
  path: string;
  data?: string;
  ephemeral: boolean;
  sequential: boolean;
}

export async function getAppInfo(): Promise<AppInfo> {
  return await invoke<AppInfo>('get_app_info');
}

export async function greet(name: string): Promise<string> {
  return await invoke<string>('greet', { name });
}

export async function saveConnection(connection: ConnectionConfig): Promise<void> {
  await invoke('save_connection', { connection });
}

export async function updateConnection(connection: ConnectionConfig): Promise<void> {
  await invoke('update_connection', { connection });
}

export async function deleteConnection(id: string): Promise<void> {
  await invoke('delete_connection', { id });
}

export async function listConnections(): Promise<ConnectionConfig[]> {
  return await invoke<ConnectionConfig[]>('list_connections');
}

export async function getConnection(id: string): Promise<ConnectionConfig | null> {
  return await invoke<ConnectionConfig | null>('get_connection', { id });
}

export async function listConnectionSummaries(): Promise<ConnectionSummary[]> {
  return await invoke<ConnectionSummary[]>('list_connection_summaries');
}

export async function testConnection(connection: ConnectionConfig): Promise<TestConnectionResult> {
  return await invoke<TestConnectionResult>('test_connection', { connection });
}

export async function connectZk(id: string): Promise<ConnectResult> {
  return await invoke<ConnectResult>('connect_zk', { id });
}

export async function disconnectZk(id: string): Promise<void> {
  await invoke('disconnect_zk', { id });
}

export async function getChildren(connectionId: string, path: string): Promise<string[]> {
  const result = await invoke<NodeChildren>('get_children', { connectionId, path });
  return result.children;
}

export async function getData(connectionId: string, path: string): Promise<ZNode> {
  return await invoke<ZNode>('get_data', { connectionId, path });
}

export async function setData(connectionId: string, path: string, data: string, version: number): Promise<NodeStat> {
  return await invoke<NodeStat>('set_data', { connectionId, path, data, version });
}

export async function createNode(connectionId: string, options: CreateNodeOptions): Promise<string> {
  return await invoke<string>('create_node', { connectionId, options });
}

export async function deleteNode(connectionId: string, path: string, version: number): Promise<void> {
  await invoke('delete_node', { connectionId, path, version });
}

export async function exists(connectionId: string, path: string): Promise<boolean> {
  return await invoke<boolean>('exists', { connectionId, path });
}
