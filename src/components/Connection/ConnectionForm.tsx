import { useState, useEffect, FormEvent } from 'react';
import type { ConnectionConfig } from '../../types/connection';
import { createDefaultConnection } from '../../types/connection';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ConnectionFormProps {
  connection?: ConnectionConfig;
  onSave: (connection: ConnectionConfig) => Promise<void>;
  onCancel: () => void;
  onTest?: (connection: ConnectionConfig) => Promise<boolean>;
}

export default function ConnectionForm({ connection, onSave, onCancel, onTest }: ConnectionFormProps) {
  const [formData, setFormData] = useState<ConnectionConfig>(
    connection || createDefaultConnection()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (connection) {
      setFormData(connection);
    }
  }, [connection]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '连接名称不能为空';
    }
    
    if (!formData.hosts.trim()) {
      newErrors.hosts = '主机地址不能为空';
    } else {
      const hostPattern = /^[\w.-]+:\d+(,[\w.-]+:\d+)*$/;
      if (!hostPattern.test(formData.hosts.replace(/\s/g, ''))) {
        newErrors.hosts = '主机地址格式错误，应为 host:port 或 host1:port1,host2:port2';
      }
    }
    
    if (formData.sessionTimeoutMs < 1000) {
      newErrors.sessionTimeoutMs = '会话超时不能小于1000ms';
    }
    
    if (formData.connectionTimeoutMs < 1000) {
      newErrors.connectionTimeoutMs = '连接超时不能小于1000ms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setErrors({ submit: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest || !validate()) return;
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const success = await onTest(formData);
      setTestResult({
        success,
        message: success ? '连接测试成功' : '连接测试失败',
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `连接测试失败: ${err}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const updateField = <K extends keyof ConnectionConfig>(
    field: K,
    value: ConnectionConfig[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          连接名称 <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="例如: 生产环境 ZK"
          error={errors.name}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          主机地址 <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.hosts}
          onChange={(e) => updateField('hosts', e.target.value)}
          placeholder="例如: 192.168.1.1:2181 或 host1:2181,host2:2181"
          error={errors.hosts}
        />
        <p className="mt-1 text-xs text-gray-500">
          多个地址用逗号分隔
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会话超时 (ms)
          </label>
          <Input
            type="number"
            value={formData.sessionTimeoutMs}
            onChange={(e) => updateField('sessionTimeoutMs', parseInt(e.target.value) || 30000)}
            error={errors.sessionTimeoutMs}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            连接超时 (ms)
          </label>
          <Input
            type="number"
            value={formData.connectionTimeoutMs}
            onChange={(e) => updateField('connectionTimeoutMs', parseInt(e.target.value) || 10000)}
            error={errors.connectionTimeoutMs}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">认证配置</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">认证方式</label>
            <select
              value={formData.authScheme || 'none'}
              onChange={(e) => updateField('authScheme', e.target.value === 'none' ? undefined : e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">无认证</option>
              <option value="digest">Digest</option>
            </select>
          </div>
          
          {formData.authScheme === 'digest' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">凭证 (user:password)</label>
              <Input
                type="password"
                value={formData.authCredential || ''}
                onChange={(e) => updateField('authCredential', e.target.value)}
                placeholder="username:password"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">SSL/TLS 配置</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.useSsl}
              onChange={(e) => updateField('useSsl', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">启用 SSL/TLS</span>
          </label>
          
          {formData.useSsl && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              <div>
                <label className="block text-sm text-gray-600 mb-1">CA 证书路径</label>
                <Input
                  value={formData.sslCaPath || ''}
                  onChange={(e) => updateField('sslCaPath', e.target.value)}
                  placeholder="/path/to/ca.pem"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">客户端证书路径</label>
                <Input
                  value={formData.sslCertPath || ''}
                  onChange={(e) => updateField('sslCertPath', e.target.value)}
                  placeholder="/path/to/cert.pem"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">客户端密钥路径</label>
                <Input
                  value={formData.sslKeyPath || ''}
                  onChange={(e) => updateField('sslKeyPath', e.target.value)}
                  placeholder="/path/to/key.pem"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.readonly}
            onChange={(e) => updateField('readonly', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">只读模式</span>
        </label>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-md ${
            testResult.success
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {testResult.message}
        </div>
      )}

      {errors.submit && (
        <div className="p-3 rounded-md bg-red-50 text-red-700">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        {onTest && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? '测试中...' : '测试连接'}
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  );
}
