import { useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '../lib/errors'
import { getExplorerTxUrl } from '../lib/stellar'

type Messages<T> = {
  pending: string
  success: string | ((result: T) => string)
}

type WithHash = {
  hash?: string
}

export function useTransaction() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const execute = async <T extends WithHash>(
    callback: () => Promise<T>,
    messages: Messages<T>,
  ) => {
    setIsSubmitting(true)
    const toastId = toast.loading(messages.pending)

    try {
      const result = await callback()
      const explorerUrl = getExplorerTxUrl(result.hash)
      toast.success(
        typeof messages.success === 'function'
          ? messages.success(result)
          : messages.success,
        {
          id: toastId,
          description: explorerUrl ? (
            <a
              className="text-sky-300 underline"
              href={explorerUrl}
              rel="noreferrer"
              target="_blank"
            >
              View receipt
            </a>
          ) : undefined,
        },
      )
      return result
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return { execute, isSubmitting }
}
