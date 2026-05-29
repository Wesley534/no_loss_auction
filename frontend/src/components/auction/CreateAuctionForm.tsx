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
    <Card className="space-y-6" tone="primary">
      <div>
        <h1 className="text-3xl font-semibold text-white">Create an auction</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          Add a photo, write a clear description, choose your starting price, and decide how long
          buyers can bid. The marketplace currently applies a {DEFAULT_APR_BPS / 100}% seller
          earnings rate in this demo.
        </p>
      </div>
      <form
        className="grid gap-5 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          if (!imageFile) {
            setImageError('Upload an item photo before creating the auction.')
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
          label="Item title"
          {...form.register('title')}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-muted)]">Item photo</span>
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
              Your image will be uploaded securely when you publish the listing.
            </span>
          ) : null}
        </label>
        <div className="md:col-span-2">
          <Textarea
            error={form.formState.errors.description?.message}
            label="Item description"
            {...form.register('description')}
          />
        </div>
        <Input
          error={form.formState.errors.starting_bid?.message}
          hint="Test balances are shown in mUSDC."
          label="Starting price"
          {...form.register('starting_bid')}
        />
        <Input
          error={form.formState.errors.duration_value?.message}
          hint="Choose how long you'd like the auction to stay open."
          label="Auction length"
          type="number"
          {...form.register('duration_value')}
        />
        <SelectField
          error={form.formState.errors.duration_unit?.message}
          hint="Pick the time unit that matches your auction length."
          label="Time unit"
          {...form.register('duration_unit')}
        >
          <option value="hours">Hours</option>
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
        </SelectField>
        <div className="md:col-span-2">
          <Button fullWidth isLoading={isLoading} type="submit">
            Create Auction
          </Button>
        </div>
      </form>
    </Card>
  )
}
