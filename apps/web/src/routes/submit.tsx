import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { type Address } from 'viem'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useWallet } from '../hooks/use-wallet'
import { cacheEvidenceSignature } from '../lib/evidence/local-signature-cache'
import { buildEvidencePayload, serializeEvidencePayload } from '../lib/evidence/payload'
import { submitEvidence } from '../lib/graphql/api'

export const Route = createFileRoute('/submit')({
  component: SubmitPage,
})

function SubmitPage() {
  const navigate = Route.useNavigate()
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null)
  const wallet = useWallet()

  const submitMutation = useMutation({
    mutationFn: submitEvidence,
    onSuccess: (evidence) => {
      setLastSubmittedId(evidence.id)
      navigate({ to: '/evidence/$evidenceId', params: { evidenceId: evidence.id } })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '提交证据失败。'
      setSubmitError(message)
    },
  })

  const canSubmit = wallet.address && content.trim().length > 0 && !submitMutation.isPending

  const handleSubmit = async () => {
    if (!wallet.walletClient || !wallet.address) {
      setSubmitError('请先连接钱包，再提交证据。')
      return
    }

    setSubmitError(null)
    try {
      const payload = buildEvidencePayload(content.trim(), sourceUrl)
      const payloadText = serializeEvidencePayload(payload)

      const signature = await wallet.walletClient.signMessage({
        account: wallet.address as Address,
        message: payloadText,
      })

      const result = await submitMutation.mutateAsync({
        content: payloadText,
        submitterAddress: wallet.address,
        submitterSignature: signature,
      })

      cacheEvidenceSignature(result.id, signature)
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交时发生未知错误。'
      setSubmitError(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">提交证据</h1>
        <p className="text-sm text-muted-foreground">连接钱包后提交文本证据，系统将异步执行 IPFS 存储和 AI 分析。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FR-01：去中心化证据锚定</CardTitle>
          <CardDescription>本页会在钱包内完成签名，并通过 GraphQL mutation 写入证据。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evidence-content">证据文本</Label>
            <Textarea
              id="evidence-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="请粘贴可疑信息原文..."
              className="min-h-48"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-url">来源 URL（可选）</Label>
            <Input
              id="source-url"
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://example.com/post/123"
            />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>当前钱包：{wallet.address ?? '未连接'}</p>
            {wallet.error ? <p className="text-destructive">{wallet.error}</p> : null}
            {submitError ? <p className="text-destructive">{submitError}</p> : null}
            {lastSubmittedId ? <p>最近提交的证据 ID：{lastSubmittedId}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={wallet.connect} disabled={wallet.isConnecting || !!wallet.address}>
              {wallet.isConnecting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> 连接中
                </span>
              ) : wallet.address ? (
                '钱包已连接'
              ) : (
                '连接钱包'
              )}
            </Button>
            <Button variant="outline" disabled={!canSubmit} onClick={handleSubmit}>
              {submitMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> 提交中
                </span>
              ) : (
                '签名并提交'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
