import { useMemo, useState } from 'react'
import { AUCTION_FALLBACK_IMAGE_URL } from '../../lib/constants'
import { getIpfsUrlCandidates } from '../../lib/format'

export function AuctionImage({
  alt,
  className,
  fallbackLabel = 'Image unavailable',
  src,
}: {
  alt: string
  className?: string
  fallbackLabel?: string
  src?: string | null
}) {
  const candidates = useMemo(
    () => [...getIpfsUrlCandidates(src), AUCTION_FALLBACK_IMAGE_URL],
    [src],
  )
  const [index, setIndex] = useState(0)

  const currentSrc = candidates[index]

  if (!currentSrc) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-white/5 ${className ?? ''}`}>
        <div className="flex flex-col items-center gap-2 text-white/55">
          <span className="text-xs uppercase tracking-[0.22em]">{fallbackLabel}</span>
        </div>
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex((current) => current + 1)
        }
      }}
      src={currentSrc}
    />
  )
}
