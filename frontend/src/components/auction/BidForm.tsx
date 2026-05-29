import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { parseToken } from '../../lib/format'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'
import { Input } from '../shared/Input'

const bidSchema = z.object({
  amount: z.string().min(1, 'Enter a bid amount'),
})

type BidFormValues = z.infer<typeof bidSchema>

export function BidForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (amount: bigint) => Promise<void>
  isLoading?: boolean
}) {
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: { amount: '' },
  })

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(parseToken(values.amount))
    form.reset()
  })

  return (
    <Card className="space-y-4" tone="secondary">
      <div>
        <h3 className="text-xl font-semibold text-white">Place a bid</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your funds are protected until the auction ends. If someone outbids you, your previous
          bid is returned automatically.
        </p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <Input
          error={form.formState.errors.amount?.message}
          label="Bid amount"
          placeholder="e.g. 125.5"
          {...form.register('amount')}
        />
        <Button fullWidth isLoading={isLoading} type="submit">
          Place Bid
        </Button>
      </form>
    </Card>
  )
}
