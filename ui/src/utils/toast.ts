import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

export interface ToastOptions {
  message: string
  duration?: number
  type?: 'success' | 'error' | 'info' | 'warning'
}

export function showToast({ message, duration = 3000, type = 'info' }: ToastOptions) {
  const baseOptions = {
    text: message,
    duration,
    gravity: 'top' as const,
    position: 'right' as const,
    close: true,
    stopOnFocus: true,
  }

  let style: Record<string, string> = {}

  switch (type) {
    case 'success':
      style = {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      }
      break
    case 'error':
      style = {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      }
      break
    case 'warning':
      style = {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      }
      break
    case 'info':
    default:
      style = {
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      }
      break
  }

  new Toastify({
    ...baseOptions,
    style,
  }).showToast()
}

export const toast = {
  success: (message: string, duration?: number) => showToast({ message, duration, type: 'success' }),
  error: (message: string, duration?: number) => showToast({ message, duration, type: 'error' }),
  info: (message: string, duration?: number) => showToast({ message, duration, type: 'info' }),
  warning: (message: string, duration?: number) => showToast({ message, duration, type: 'warning' }),
}