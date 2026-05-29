import { useNavigate } from 'react-router-dom'
import {
  CreateAuctionForm,
} from '../components/auction/CreateAuctionForm'
import { useTransaction } from '../hooks/useTransaction'
import { useWallet } from '../hooks/useWallet'
import { DEFAULT_APR_BPS } from '../lib/constants'
import { auctionContract } from '../lib/contract'
import { uploadAuctionImage } from '../lib/pinata'

function slugifyProductId(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)

  return `item-${slug || 'auction'}-${Date.now().toString(36)}`
}

export function CreateAuctionPage() {
  const wallet = useWallet()
  const navigate = useNavigate()
  const transaction = useTransaction()

  const onSubmit = async (values: {
    title: string
    description: string
    starting_bid: bigint
    duration_seconds: bigint
    imageFile: File
  }) => {
    if (!wallet.address) return

    const result = await transaction.execute<{ value: bigint; hash?: string }>(
      async () => {
        const upload = await uploadAuctionImage(values.imageFile)
        return auctionContract.createAuction(wallet.address!, {
          title: values.title,
          description: values.description,
          metadata_uri: upload.ipfsUrl,
          product_id: slugifyProductId(values.title),
          starting_bid: values.starting_bid,
          duration_seconds: values.duration_seconds,
          apr_bps: DEFAULT_APR_BPS,
          seller: wallet.address!,
        })
      },
      {
        pending: 'Publishing your listing...',
        success: (tx) => `Auction #${tx.value.toString()} is live.`,
      },
    )

    navigate(`/auction/${result.value.toString()}`)
  }

  return <CreateAuctionForm isLoading={transaction.isSubmitting} onSubmit={onSubmit} />
}
