const storageKey = 'chainsight.signatures'

type SignatureCache = Record<string, string>

function readCache(): SignatureCache {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as SignatureCache
    return parsed
  } catch {
    return {}
  }
}

export function cacheEvidenceSignature(evidenceId: string, signature: string) {
  if (typeof window === 'undefined') {
    return
  }

  const cache = readCache()
  cache[evidenceId] = signature
  window.localStorage.setItem(storageKey, JSON.stringify(cache))
}

export function getCachedEvidenceSignature(evidenceId: string): string | null {
  const cache = readCache()
  return cache[evidenceId] ?? null
}
