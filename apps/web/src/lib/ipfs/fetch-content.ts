import { env } from '../env'

export async function fetchIpfsContentByCid(cid: string): Promise<string> {
  const normalizedGateway = env.ipfsGatewayUrl.replace(/\/$/, '')
  let response: Response
  try {
    response = await fetch(`${normalizedGateway}/ipfs/${cid}`)
  } catch {
    throw new Error(`无法连接 IPFS Gateway（${normalizedGateway}）。请检查端口转发是否开启。`)
  }

  if (!response.ok) {
    throw new Error(`IPFS Gateway 请求失败，状态码 ${response.status}`)
  }

  return response.text()
}
