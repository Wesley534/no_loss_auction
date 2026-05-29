import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'
import { Textarea } from '../shared/Input'

const disputeSchema = z.object({
  reason: z.string().min(3, 'Tell us what went wrong'),
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
    <Card className="space-y-4" tone="danger">
      <div>
        <h3 className="text-xl font-semibold text-white">Report an issue</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          If something went wrong with the order, explain what happened and upload a photo for
          review.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          if (!imageFile) {
            setImageError('Upload a supporting photo before sending your report.')
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
          label="What happened?"
          {...form.register('reason')}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-muted)]">Supporting photo</span>
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
              Your photo will be uploaded securely when you send the report.
            </span>
          ) : null}
        </label>
        <Button fullWidth isLoading={isLoading} type="submit" variant="danger">
          Submit Report
        </Button>
      </form>
    </Card>
  )
}
