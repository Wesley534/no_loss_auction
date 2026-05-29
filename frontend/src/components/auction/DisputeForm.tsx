import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'
import { Textarea } from '../shared/Input'

const disputeSchema = z.object({
  reason: z.string().min(3, 'Explain the dispute'),
})

type DisputeValues = z.infer<typeof disputeSchema>

export function DisputeForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (reason: string, evidenceImage: File) => Promise<void>
  isLoading?: boolean
}) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const form = useForm<DisputeValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { reason: '' },
  })

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white">Raise a dispute</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          If delivery went wrong, submit a reason and upload supporting evidence for admin review.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          if (!imageFile) {
            setImageError('Upload an evidence image before submitting the dispute.')
            return
          }

          setImageError(null)
          await onSubmit(values.reason, imageFile)
          form.reset()
          setImageFile(null)
        })}
      >
        <Textarea
          error={form.formState.errors.reason?.message}
          label="Reason"
          {...form.register('reason')}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-muted)]">Evidence image</span>
          <input
            accept="image/*"
            className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-[var(--text)]"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setImageFile(file)
              setImageError(null)
            }}
            type="file"
          />
          {imageError ? <span className="text-sm text-[var(--danger)]">{imageError}</span> : null}
          {!imageError ? (
            <span className="text-xs text-[var(--text-faint)]">
              The evidence image will be uploaded to IPFS when you submit.
            </span>
          ) : null}
        </label>
        <Button fullWidth isLoading={isLoading} type="submit" variant="danger">
          Submit dispute
        </Button>
      </form>
    </Card>
  )
}
