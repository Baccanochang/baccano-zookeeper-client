import type { ToastMessage } from '../components/ui/Toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAddOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastAddFunction = (options: Omit<ToastMessage, 'id'>) => void;

let addToastFn: ToastAddFunction | null = null;

export function setToastFunction(fn: ToastAddFunction) {
  addToastFn = fn;
}

export function showToast(type: ToastType, message: string, duration?: number) {
  if (addToastFn) {
    addToastFn({ type, message, duration });
  } else {
    console.log(`[Toast ${type}] ${message}`);
  }
}

export const toast = {
  success: (message: string) => showToast('success', message),
  error: (message: string) => showToast('error', message),
  warning: (message: string) => showToast('warning', message),
  info: (message: string) => showToast('info', message),
};