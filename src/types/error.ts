export type AppErrorType =
  | 'Connection'
  | 'Timeout'
  | 'Auth'
  | 'NodeNotFound'
  | 'NodeExists'
  | 'InvalidInput'
  | 'Internal';

export interface AppError {
  type: AppErrorType;
  message: string;
  detail?: string;
}

export function createError(type: AppErrorType, message: string, detail?: string): AppError {
  return { type, message, detail };
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
}
