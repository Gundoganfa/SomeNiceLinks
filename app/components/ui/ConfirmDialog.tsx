'use client'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null
  
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="mb-4 text-sm text-white/70">{description}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/90 hover:bg-white/5"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="rounded-md bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
