import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Header, Sidebar, MainContent, StatusBar } from './components/Layout';
import { ToastContainer, useToast } from './components/ui/Toast';
import { setToastFunction } from './utils/toast';
import { useConnectionMonitor } from './hooks';

// 关闭确认对话框组件
function CloseConfirmDialog({ isOpen, onMinimize, onExit, onCancel }: {
  isOpen: boolean;
  onMinimize: () => void;
  onExit: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">关闭窗口</h3>
        <p className="text-gray-600 mb-6">
          请选择关闭方式：
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMinimize(); }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
          >
            最小化到托盘
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onExit(); }}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors cursor-pointer"
          >
            直接退出程序
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(); }}
            className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { toasts, dismissToast, addToast } = useToast();
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // 设置全局 toast 函数
  useEffect(() => {
    setToastFunction(addToast);
  }, [addToast]);

  // 启动连接监控
  useConnectionMonitor();

  // 监听窗口关闭请求
  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      try {
        const unlisten = await getCurrentWindow().onCloseRequested((event) => {
          if (!mounted) return;
          // 阻止默认关闭行为
          event.preventDefault();
          // 显示对话框
          setShowCloseDialog(true);
        });

        return () => {
          mounted = false;
          unlisten();
        };
      } catch (err) {
        console.error('Failed to setup close listener:', err);
      }
    };

    const cleanup = setupListener();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);

  // 处理最小化到托盘
  const handleMinimize = async () => {
    setShowCloseDialog(false);
    try {
      await getCurrentWindow().hide();
    } catch (error) {
      console.error('Failed to hide window:', error);
    }
  };

  // 处理直接退出
  const handleExit = async () => {
    setShowCloseDialog(false);
    try {
      await getCurrentWindow().destroy();
    } catch (error) {
      console.error('Failed to destroy window:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setShowCloseDialog(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StatusBar />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <CloseConfirmDialog
        isOpen={showCloseDialog}
        onMinimize={handleMinimize}
        onExit={handleExit}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default App;