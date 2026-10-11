import { ToastContainer } from 'react-toastify'
import { cn } from '../../utils/helpers'

const TOAST_STYLES = {
  success:
    'border-emerald-200 bg-white text-slate-900 shadow-[0_16px_36px_-24px_rgba(16,185,129,0.85)]',
  error: 'border-red-200 bg-white text-slate-900 shadow-[0_16px_36px_-24px_rgba(239,68,68,0.85)]',
  warning:
    'border-amber-200 bg-white text-slate-900 shadow-[0_16px_36px_-24px_rgba(245,158,11,0.85)]',
  info: 'border-blue-200 bg-white text-slate-900 shadow-[0_16px_36px_-24px_rgba(59,130,246,0.85)]',
  default:
    'border-slate-200 bg-white text-slate-900 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.45)]',
}

const PROGRESS_STYLES = {
  success: '!bg-emerald-500',
  error: '!bg-red-500',
  warning: '!bg-amber-500',
  info: '!bg-blue-500',
  default: '!bg-primary-800',
}

export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      pauseOnHover
      draggable
      limit={1}
      closeButton={false}
      theme="light"
      className="!bottom-3 !left-3 !right-3 !top-auto !w-auto sm:!bottom-5 sm:!left-auto sm:!right-5 sm:!w-[360px]"
      toastClassName={({ type }) =>
        cn(
          'relative mb-3 flex min-h-[56px] w-full overflow-hidden rounded-lg border p-0 font-sans text-sm cursor-pointer backdrop-blur-sm',
          TOAST_STYLES[type] || TOAST_STYLES.default,
        )
      }
      bodyClassName={() =>
        'm-0 flex flex-1 items-start px-3.5 py-3 text-sm font-semibold leading-snug text-slate-700 break-words [overflow-wrap:anywhere]'
      }
      progressClassName={({ type }) => cn('!h-1', PROGRESS_STYLES[type] || PROGRESS_STYLES.default)}
    />
  )
}
