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
        :disabled="!textContent.trim()"
        class="rounded-lg bg-gray-800 px-6 py-2 font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        提交
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 响应式变量，用于存储文本内容
const textContent = ref('')

/**
 * 处理证据提交
 * 阶段三只需要实现到 `构建证据JSON对象`即可
 */
const handleSubmit = () => {
  const content = textContent.value.trim()

  if (!content) {
    console.warn('提交内容为空，操作取消。')
    return
  }

  // 1. 构建证据 JSON 对象 (FR-01)
  const evidence = {
    content: content,
    metadata: {
      timestamp: new Date().toISOString(), // ISO 8601 格式时间戳
      submitter: '0x...', // 占位符，后续将替换为连接的钱包地址
      version: '1.0',
    },
  }

  // 2. 打印 JSON 对象以供验证
  console.log('--- 证据 JSON 对象已构建 ---')
  console.log(evidence)
  console.log('-----------------------------')

  // 3. 清空文本框
  textContent.value = ''
}
</script>

<style scoped>
/* 确保在不支持 backdrop-blur 的浏览器中有一个合理的 fallback */
.backdrop-blur-md {
  background-color: rgba(255, 255, 255, 0.5); /* Fallback for background */
}
</style>
