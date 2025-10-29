<template>
  <!-- 容器：固定在底部，占据全宽，使用 flex 居中内容，并应用高斯模糊背景 -->
  <section
    class="fixed right-0 bottom-0 left-0 z-10 flex justify-center bg-white/30 p-4 backdrop-blur-md"
  >
    <!-- 居中内容区域，最大宽度限制 -->
    <div class="flex w-full max-w-3xl flex-col items-end space-y-2">
      <textarea
        class="w-full resize-none rounded-xl border border-gray-300 p-3 transition duration-150 ease-in-out focus:ring-2 focus:ring-gray-500 focus:outline-none"
        rows="4"
        placeholder="输入谣言文本..."
      ></textarea>
      <button
        class="rounded-lg bg-gray-800 px-6 py-2 font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
      >
        提交
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
// 可以在这里添加逻辑，例如处理输入和提交事件
</script>

<style scoped>
/* 确保在不支持 backdrop-blur 的浏览器中有一个合理的 fallback */
.backdrop-blur-md {
  background-color: rgba(255, 255, 255, 0.5); /* Fallback for background */
}
</style>
