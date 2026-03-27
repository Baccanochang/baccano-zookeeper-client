import { useState } from 'react';
import { Button } from '../ui';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Baccano ZooKeeper Client' }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            设置
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
            帮助
          </Button>
        </div>
      </header>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">设置</h2>
            <p className="text-gray-600 mb-4">设置功能开发中...</p>
            <div className="flex justify-end">
              <Button onClick={() => setShowSettings(false)}>关闭</Button>
            </div>
          </div>
        </div>
      )}

      {/* 帮助弹窗 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">帮助</h2>
            <div className="text-gray-600 mb-4 space-y-2">
              <p><strong>Baccano ZooKeeper Client</strong></p>
              <p>版本: 0.1.0</p>
              <p className="text-sm mt-2">一个用于管理 Apache ZooKeeper 的桌面客户端。</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowHelp(false)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
