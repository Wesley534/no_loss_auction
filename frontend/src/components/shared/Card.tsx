import clsx from 'clsx'
import type { HTMLAttributes, PropsWithChildren } from 'react'

export function Card({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx('glass-panel rounded-[28px] p-6 surface-ring', className)}
      {...props}
    >
      {children}
    </div>
  )
}
