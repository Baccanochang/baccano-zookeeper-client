export function validateHost(host: string): boolean {
  const hostRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostRegex.test(host);
}

export function validatePort(port: number): boolean {
  return port > 0 && port <= 65535;
}

export function validateHostPort(hostPort: string): boolean {
  const parts = hostPort.split(':');
  if (parts.length !== 2) return false;
  const [host, portStr] = parts;
  const port = parseInt(portStr, 10);
  return validateHost(host) && validatePort(port);
}

export function validateConnectionName(name: string): boolean {
  return name.length > 0 && name.length <= 100;
}

export function validatePath(path: string): boolean {
  if (path === '/') return true;
  const pathRegex = /^\/[a-zA-Z0-9_\-./]+$/;
  return pathRegex.test(path);
}

export function validateNodeName(name: string): boolean {
  if (!name || name.length === 0) return false;
  const nameRegex = /^[a-zA-Z0-9_\-./]+$/;
  return nameRegex.test(name) && name.length <= 100;
}
