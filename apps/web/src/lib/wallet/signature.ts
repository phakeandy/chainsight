import { verifyMessage, type Hex } from 'viem'

export async function verifyEvidenceSignature(content: string, signature: string, address: string): Promise<boolean> {
  try {
    return await verifyMessage({
      address: address as `0x${string}`,
      message: content,
      signature: signature as Hex,
    })
  } catch {
    return false
  }
}
