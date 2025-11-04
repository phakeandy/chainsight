<script setup lang="ts">
import { useWallet } from '@/composables/useWallet'
import { computed } from 'vue'

const { account, isConnecting, error, isWalletInstalled, connectWallet } = useWallet()

const buttonText = computed(() => {
  if (isConnecting.value) {
    return '连接中...'
  }
  if (account.value) {
    // 截断地址显示
    const address = account.value
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  return '连接钱包'
})

const buttonClass = computed(() => {
  if (account.value) {
    return 'bg-green-500 hover:bg-green-600'
  }
  if (!isWalletInstalled.value) {
    return 'bg-red-500 hover:bg-red-600'
  }
  return 'bg-blue-500 hover:bg-blue-600'
})

function handleClick() {
  if (!account.value) {
    connectWallet()
  }
}
</script>

<template>
  <div class="flex flex-col items-end">
    <button
      :class="buttonClass"
      class="rounded px-4 py-2 font-bold text-white shadow-md transition duration-150 ease-in-out"
      :disabled="isConnecting"
      @click="handleClick"
    >
      {{ buttonText }}
    </button>
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
    <p v-if="!isWalletInstalled" class="mt-1 text-xs text-red-500">
      请安装 MetaMask 或其他浏览器钱包
    </p>
  </div>
</template>
