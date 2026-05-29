import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DEFAULT_APR_BPS } from '../../lib/constants'
import { parseToken } from '../../lib/format'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'
import { Input, SelectField, Textarea } from '../shared/Input'

const createAuctionSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Describe the item in more detail'),
  starting_bid: z.string().min(1, 'Starting bid is required'),
  duration_value: z.coerce.number().int().positive('Duration must be positive'),
  duration_unit: z.enum(['hours', 'days', 'weeks']),
})

export type CreateAuctionValues = z.infer<typeof createAuctionSchema>
type CreateAuctionInput = z.input<typeof createAuctionSchema>

const DURATION_MULTIPLIERS = {
  hours: 3_600,
  days: 86_400,
  weeks: 604_800,
} as const

export function CreateAuctionForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (values: {
    title: string
    description: string
    starting_bid: bigint
    duration_seconds: bigint
    imageFile: File
  }) => Promise<void>
  isLoading?: boolean
}) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const form = useForm<CreateAuctionInput, unknown, CreateAuctionValues>({
    resolver: zodResolver(createAuctionSchema),
    defaultValues: {
      title: '',
      description: '',
      starting_bid: '',
      duration_value: 24,
      duration_unit: 'hours',
    },
  })

  return (
    <Card className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Launch a new auction</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          Upload an item image, set the opening bid, and choose how long bidding stays open.
          The auction APR is configured by admin at {DEFAULT_APR_BPS / 100}% APR.
        </p>
      </div>
      <form
        className="grid gap-5 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          if (!imageFile) {
            setImageError('Upload a product image before creating the auction.')
            return
          }

          setImageError(null)
          const payload = {
            title: values.title,
            description: values.description,
            starting_bid: parseToken(values.starting_bid),
            duration_seconds: BigInt(
              values.duration_value * DURATION_MULTIPLIERS[values.duration_unit],
            ),
            imageFile,
          }
          await onSubmit(payload)
          form.reset({
            title: '',
            description: '',
            starting_bid: '',
            duration_value: 24,
            duration_unit: 'hours',
          })
          setImageFile(null)
          setImageError(null)
        })}
      >
        <Input
          error={form.formState.errors.title?.message}
          label="Title"
          {...form.register('title')}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-muted)]">Product image</span>
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
              The image will be uploaded to IPFS through Pinata when you submit.
            </span>
          ) : null}
        </label>
        <div className="md:col-span-2">
          <Textarea
            error={form.formState.errors.description?.message}
            label="Description"
            {...form.register('description')}
          />
        </div>
        <Input
          error={form.formState.errors.starting_bid?.message}
          hint="Denominated in mUSDC with 7 decimals."
          label="Starting bid"
          {...form.register('starting_bid')}
        />
        <Input
          error={form.formState.errors.duration_value?.message}
          hint="Choose a number, then pick hours, days, or weeks."
          label="Duration"
          type="number"
          {...form.register('duration_value')}
        />
        <SelectField
          error={form.formState.errors.duration_unit?.message}
          hint="The frontend converts this to seconds before calling the contract."
          label="Duration unit"
          {...form.register('duration_unit')}
        >
          <option value="hours">Hours</option>
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
        </SelectField>
        <div className="md:col-span-2">
          <Button fullWidth isLoading={isLoading} type="submit">
            Create auction
          </Button>
        </div>
      </form>
    </Card>
  )
}
