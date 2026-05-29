import { zodResolver } from '@hookform/resolvers/zod'
import { Gift } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CLAIM_AMOUNT } from '../../lib/constants'
import { formatToken, parseToken } from '../../lib/format'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, 'Enter an amount to simulate')
    .refine((value) => {
      try {
        return parseToken(value) <= CLAIM_AMOUNT
      } catch {
        return false
      }
    }, `Maximum simulated deposit is ${formatToken(CLAIM_AMOUNT)}`),
})

type DepositValues = z.infer<typeof depositSchema>

export function ClaimTokensButton({
  onClaim,
  isLoading,
  disabled,
}: {
  onClaim: (amount: string) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
}) {
  const form = useForm<DepositValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: '',
    },
  })

  return (
    <form
      className="w-full max-w-sm space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onClaim(values.amount)
        form.reset()
      })}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Gift className="h-4 w-4 text-[var(--primary)]" />
        Simulate Fiat Deposit
      </div>
      <Input
        disabled={disabled || isLoading}
        error={form.formState.errors.amount?.message}
        hint={`No minimum. Maximum ${formatToken(CLAIM_AMOUNT)}.`}
        label="Deposit amount"
        placeholder="e.g. 125.50"
        {...form.register('amount')}
      />
      <p className="text-xs leading-6 text-[var(--text-faint)]">
        Current MVP note: the deployed test contract credits the one-time 1,000 mUSDC cap on the
        first successful deposit request.
      </p>
      <Button
        disabled={disabled}
        fullWidth
        isLoading={isLoading}
        type="submit"
      >
        Submit Deposit Request
      </Button>
    </form>
  )
}
