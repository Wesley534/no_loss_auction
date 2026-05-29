import { Toaster } from 'sonner'

export function Toast() {
  return (
    <Toaster
      position="top-right"
      richColors
      theme="dark"
      toastOptions={{
        classNames: {
          toast: '!bg-slate-950/95 !border !border-white/10 !text-white',
          description: '!text-slate-300',
        },
      }}
    />
  )
}
