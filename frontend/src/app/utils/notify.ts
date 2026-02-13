
import toast from 'react-hot-toast'

const defaultOptions = {
  position: 'bottom-right' as const,
}

/* ================= NOTIFY ================= */

export const notify = {

  success: (msg: string) => {
    toast.success(msg, defaultOptions)
  },

  error: (msg: string) => {
    toast.error(msg, defaultOptions)
  },

  warning: (msg: string) => {
    toast(msg, {
      ...defaultOptions,
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#000',
      },
    })
  },

  info: (msg: string) => {
    toast(msg, {
      ...defaultOptions,
      icon: 'ℹ️',
    })
  },

  loading: (msg: string) => {
    return toast.loading(msg, defaultOptions)
  },

  dismiss: (id?: string) => {
    toast.dismiss(id)
  }

}