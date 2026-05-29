import clsx from 'clsx'
import type { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react'

type CardTone = 'neutral' | 'primary' | 'secondary' | 'tertiary' | 'danger'

const TONE_STYLES: Record<
  CardTone,
  { border: string; surface: string; shadow: string }
> = {
  neutral: {
    border:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(173, 198, 255, 0.08) 46%, rgba(78, 222, 163, 0.06) 100%)',
    surface:
      'linear-gradient(135deg, rgba(30, 41, 59, 0.86) 0%, rgba(23, 31, 51, 0.86) 100%)',
    shadow: '0 16px 40px rgba(6, 14, 32, 0.28)',
  },
  primary: {
    border:
      'linear-gradient(135deg, rgba(77, 142, 255, 0.95) 0%, rgba(173, 198, 255, 0.75) 45%, rgba(77, 142, 255, 0.35) 100%)',
    surface:
      'linear-gradient(135deg, rgba(18, 30, 54, 0.9) 0%, rgba(23, 31, 51, 0.86) 58%, rgba(14, 22, 40, 0.94) 100%)',
    shadow: '0 18px 42px rgba(77, 142, 255, 0.18)',
  },
  secondary: {
    border:
      'linear-gradient(135deg, rgba(78, 222, 163, 0.95) 0%, rgba(111, 251, 190, 0.72) 45%, rgba(0, 165, 114, 0.4) 100%)',
    surface:
      'linear-gradient(135deg, rgba(14, 34, 36, 0.92) 0%, rgba(23, 31, 51, 0.86) 60%, rgba(8, 20, 24, 0.95) 100%)',
    shadow: '0 18px 42px rgba(78, 222, 163, 0.16)',
  },
  tertiary: {
    border:
      'linear-gradient(135deg, rgba(255, 185, 95, 0.95) 0%, rgba(255, 221, 184, 0.72) 48%, rgba(202, 129, 0, 0.42) 100%)',
    surface:
      'linear-gradient(135deg, rgba(40, 28, 8, 0.94) 0%, rgba(37, 31, 17, 0.9) 58%, rgba(20, 15, 6, 0.96) 100%)',
    shadow: '0 18px 42px rgba(255, 185, 95, 0.14)',
  },
  danger: {
    border:
      'linear-gradient(135deg, rgba(255, 91, 77, 0.95) 0%, rgba(255, 180, 171, 0.74) 46%, rgba(147, 0, 10, 0.48) 100%)',
    surface:
      'linear-gradient(135deg, rgba(49, 12, 16, 0.94) 0%, rgba(33, 18, 23, 0.9) 60%, rgba(23, 10, 12, 0.96) 100%)',
    shadow: '0 18px 42px rgba(255, 91, 77, 0.14)',
  },
}

export function Card({
  children,
  className,
  tone = 'neutral',
  style,
  ...rest
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>> & { tone?: CardTone }) {
  const toneStyle = TONE_STYLES[tone]

  return (
    <div
      className={clsx('glass-panel relative overflow-hidden rounded-[28px] p-6 surface-ring', className)}
      style={
        {
          ...style,
          background: `${toneStyle.surface} padding-box, ${toneStyle.border} border-box`,
          boxShadow: toneStyle.shadow,
          border: '1px solid transparent',
        } as CSSProperties
      }
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 28%, transparent 62%, rgba(255,255,255,0.03) 100%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
