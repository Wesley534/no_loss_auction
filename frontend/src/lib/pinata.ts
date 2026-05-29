import {
  PINATA_API_KEY,
  PINATA_API_SECRET,
  PINATA_GATEWAY_URL,
  PINATA_JWT,
} from './constants'

type PinataUploadResult = {
  cid: string
  ipfsUrl: string
  gatewayUrl: string
}

function getPinataHeaders() {
  const headers = new Headers()

  if (PINATA_JWT) {
    headers.set('Authorization', `Bearer ${PINATA_JWT}`)
    return headers
  }

  if (PINATA_API_KEY && PINATA_API_SECRET) {
    headers.set('pinata_api_key', PINATA_API_KEY)
    headers.set('pinata_secret_api_key', PINATA_API_SECRET)
    return headers
  }

  throw new Error('Pinata credentials are missing. Set VITE_PINATA_JWT or API key credentials.')
}

export async function uploadAuctionImage(file: File): Promise<PinataUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: file.name,
    }),
  )

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: getPinataHeaders(),
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Pinata upload failed: ${message || response.statusText}`)
  }

  const data = (await response.json()) as { IpfsHash: string }
  const cid = data.IpfsHash

  return {
    cid,
    ipfsUrl: `ipfs://${cid}`,
    gatewayUrl: `${PINATA_GATEWAY_URL.replace(/\/$/, '')}/${cid}`,
  }
}
