export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return '/' + parts.join('/');
}

export function getNodeName(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '/';
}

export function getParentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.length === 0 ? '/' : '/' + parts.join('/');
}
