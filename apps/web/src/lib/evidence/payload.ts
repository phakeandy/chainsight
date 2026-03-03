export type EvidencePayload = {
  content: string
  timestamp: string
  sourceUrl?: string
}

export function buildEvidencePayload(content: string, sourceUrl?: string): EvidencePayload {
  const trimmedUrl = sourceUrl?.trim()
  return {
    content,
    timestamp: new Date().toISOString(),
    sourceUrl: trimmedUrl ? trimmedUrl : undefined,
  }
}

export function serializeEvidencePayload(payload: EvidencePayload): string {
  return JSON.stringify(payload)
}

export function parseEvidencePayload(payloadText: string): EvidencePayload | null {
  try {
    const parsed = JSON.parse(payloadText) as Partial<EvidencePayload>
    if (typeof parsed.content !== 'string' || typeof parsed.timestamp !== 'string') {
      return null
    }

    return {
      content: parsed.content,
      timestamp: parsed.timestamp,
      sourceUrl: typeof parsed.sourceUrl === 'string' ? parsed.sourceUrl : undefined,
    }
  } catch {
    return null
  }
}
