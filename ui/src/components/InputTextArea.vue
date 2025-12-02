<template>
  <!-- 容器：固定在底部，占据全宽，使用 flex 居中内容，并应用高斯模糊背景 -->
  <section
    class="fixed right-0 bottom-0 left-0 z-10 flex justify-center bg-white/30 p-4 backdrop-blur-md"
  >
    <!-- 居中内容区域，最大宽度限制 -->
    <div class="flex w-full max-w-3xl flex-col items-end space-y-2">
      <textarea
        v-model="textContent"
        @keyup.enter.ctrl="handleSubmit"
        @keyup.enter.meta="handleSubmit"
        class="w-full resize-none rounded-xl border border-gray-300 p-3 transition duration-150 ease-in-out focus:ring-2 focus:ring-gray-500 focus:outline-none"
        rows="4"
        placeholder="输入谣言文本..."
      ></textarea>
      <button
        @click="handleSubmit"
        :disabled="!textContent.trim() || isLoading"
        class="rounded-lg bg-gray-800 px-6 py-2 font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ isLoading ? '提交中...' : '提交' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 响应式变量，用于存储文本内容
const textContent = ref('')
const isLoading = ref(false) // 添加加载状态

/**
 * 处理证据提交
 */
const handleSubmit = async () => {
  const content = textContent.value.trim()
  if (!content || isLoading.value) {
    return
  }

  isLoading.value = true

  try {
    // 使用相对路径，Vite 代理将处理请求转发到 http://localhost:8000/api/v1/evidence
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
    alert(`存证成功！IPFS CID: ${cid}`) // 临时用 alert 提示

    textContent.value = ''

  } catch (error) {
    console.error('提交失败:', error)
    alert(`提交失败: ${(error as Error).message}`)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 确保在不支持 backdrop-blur 的浏览器中有一个合理的 fallback */
.backdrop-blur-md {
  background-color: rgba(255, 255, 255, 0.5); /* Fallback for background */
}
</style>
