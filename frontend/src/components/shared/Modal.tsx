import { X } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Button } from './Button'

type ModalProps = PropsWithChildren<{
  open: boolean
  title: string
  description?: string
  onClose: () => void
}>

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-[30px] p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">{title}</h3>
            {description ? (
              <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
            ) : null}
          </div>
          <Button className="h-10 w-10 rounded-full p-0" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
