<script lang="ts" setup>
import { useWallet } from '@/composables/useWallet'
import { computed } from 'vue'

const { account, isConnecting, error, isWalletInstalled, connectWallet } = useWallet()

const buttonText = computed(() => {
  if (isConnecting.value) {
    return '连接中...'
  }
  return account.value ? '登出' : '登录'
})

const handleClick = async () => {
  if (!account.value) {
    await connectWallet()
  } else {
    // 登出逻辑：清空账户状态
    account.value = undefined
  }
}
</script>
<template>
  <div class="sidebar">
    <section>
      <nav class="stack box">
        <button class="btn primary">
          <span class="with-icon">
            <iconify-icon icon="tabler:message-circle-plus" class="icon"></iconify-icon>
            <span>新对话</span>
          </span>
        </button>
      </nav>
    </section>
    <section class="bottom">
      <nav class="stack box">
        <button class="btn" :disabled="isConnecting" @click="handleClick">
          <span class="with-icon">
            <iconify-icon :icon="account ? 'tabler:logout' : 'tabler:login'" class="icon"></iconify-icon>
            <span>{{ buttonText }}</span>
          </span>
        </button>
        <p v-if="error" class="error-text">{{ error }}</p>
        <p v-if="!isWalletInstalled" class="error-text">请安装 MetaMask 或其他浏览器钱包</p>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.sidebar {
  border-right: var(--border-sidebar);
  height: 100%;
  display: grid;
  grid-template:
    'main' 1fr
    'bottom' auto
    / 1fr;

  & .bottom {
    grid-area: bottom;
  }
  & .main {
    grid-area: main;
  }
}

.bottom {
  border-top: var(--border-sidebar);
}

.error-text {
  font-size: var(--step--1);
  color: var(--color-text-dim);
  margin: 0;
  padding: 0;
}
</style>
