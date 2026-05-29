import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { AuctionView } from '../../hooks/useAuctions'
import { DISPUTE_DECISIONS } from '../../lib/constants'
import { parseToken } from '../../lib/format'
import { Button } from '../shared/Button'
import { Input, SelectField } from '../shared/Input'
import { Modal } from '../shared/Modal'

const resolveSchema = z.object({
  decision: z.enum(['ReleaseToSeller', 'RefundBuyer', 'Split']),
  sellerAmount: z.string().optional(),
  buyerAmount: z.string().optional(),
})

type ResolveValues = z.infer<typeof resolveSchema>

export function ResolveDisputeModal({
  auction,
  open,
  onClose,
  onResolve,
  isLoading,
}: {
  auction?: AuctionView
  open: boolean
  onClose: () => void
  onResolve: (
    decision: ResolveValues['decision'],
    sellerAmount?: bigint,
    buyerAmount?: bigint,
  ) => Promise<void>
  isLoading?: boolean
}) {
  const form = useForm<ResolveValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: {
      decision: 'ReleaseToSeller',
      sellerAmount: '',
      buyerAmount: '',
    },
  })

  const decision = form.watch('decision')

  useEffect(() => {
    if (!open) {
      form.reset({
        decision: 'ReleaseToSeller',
        sellerAmount: '',
        buyerAmount: '',
      })
    }
  }, [form, open])

  return (
    <Modal
      description="Validate the settlement path before submitting the admin transaction."
      onClose={onClose}
      open={open}
      title={auction ? `Resolve Auction #${auction.auction_id.toString()}` : 'Resolve dispute'}
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          const sellerAmount = values.sellerAmount ? parseToken(values.sellerAmount) : undefined
          const buyerAmount = values.buyerAmount ? parseToken(values.buyerAmount) : undefined

          if (
            values.decision === 'Split' &&
            auction &&
            (sellerAmount ?? 0n) + (buyerAmount ?? 0n) !== auction.highest_bid
          ) {
            form.setError('sellerAmount', {
              message: 'Split amounts must equal the winning bid.',
            })
            return
          }

          await onResolve(values.decision, sellerAmount, buyerAmount)
          onClose()
        })}
      >
        <SelectField
          label="Resolution"
          {...form.register('decision')}
        >
          {DISPUTE_DECISIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        {decision === 'Split' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              error={form.formState.errors.sellerAmount?.message}
              label="Seller amount"
              {...form.register('sellerAmount')}
            />
            <Input
              error={form.formState.errors.buyerAmount?.message}
              label="Buyer amount"
              {...form.register('buyerAmount')}
            />
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button isLoading={isLoading} type="submit">
            Confirm resolution
          </Button>
        </div>
      </form>
    </Modal>
  )
}
