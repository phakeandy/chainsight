<script setup lang="ts">
import { ref } from 'vue'

const textContent = ref('')
const isLoading = ref(false)
const submitError = ref<string | null>(null)

const handleSubmit = async () => {
  const content = textContent.value.trim()
  if (!content || isLoading.value) {
    return
  }

  isLoading.value = true
  submitError.value = null

  try {
    const response = await fetch('/api/v1/evidence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: content }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'API request failed')
    }

    const result = await response.json()
    const cid = result.cid

    console.log(`✅ 证据上传成功! IPFS CID: ${cid}`)
    alert(`存证成功！IPFS CID: ${cid}`)

    textContent.value = ''

  } catch (error) {
    console.error('提交失败:', error)
    submitError.value = (error as Error).message
    alert(`提交失败: ${(error as Error).message}`)
  } finally {
    isLoading.value = false
  }
}

const handleKeyup = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    handleSubmit()
  }
}
</script>

<template>
  <div class="input-area center">
    <div class="input box cluster">
      <textarea
        v-model="textContent"
        @keyup="handleKeyup"
        rows="1"
        name="content"
        id=""
        placeholder="请输入内容..."
        aria-label="输入消息"
      ></textarea>
      <button 
        class="btn with-icon" 
        type="button"
        :disabled="!textContent.trim() || isLoading"
        @click="handleSubmit"
      >
        <iconify-icon icon="tabler:send-2" class="icon"></iconify-icon>
      </button>
    </div>
    <p v-if="submitError" class="error-text">{{ submitError }}</p>
  </div>
</template>

<style scoped>
.input-area {
  border-radius: var(--border-radius-field);
  border: 1px solid oklch(0 0 0 / 0.2);
  padding-inline-start: var(--space-m);
  padding-inline-end: var(--space-m);

  margin-block-start: var(--space-m);
  margin-block-end: var(--space-xl);

  &.center {
    --max-width: 47.5rem;
  }
}

.input {
  &.box {
    --padding: 8px;
  }
  &.cluster {
    --flex-wrap: nowrap;
  }
}

.btn {
  --padding: var(--space-xs);
  border-radius: 50%;
}

.error-text {
  font-size: var(--step--1);
  color: var(--color-text-dim);
  margin: var(--space-xs) 0 0 0;
  padding: 0;
  text-align: center;
}
</style>
