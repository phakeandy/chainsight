<script lang="ts" setup>
import { useWallet } from '@/composables/useWallet'
import { toast } from '@/utils/toast'
import { computed, onMounted, ref, watch } from 'vue'

const { account, isConnecting, error, isWalletInstalled, connectWallet } = useWallet()

const previousAccount = ref<typeof account.value>()

const buttonText = computed(() => {
  if (isConnecting.value) {
    return '连接中...'
  }
  return account.value ? '登出' : '登录'
})

// 监听账户变化，显示连接成功的 toast
watch(account, (newAccount, oldAccount) => {
  // 从无账户到有账户，表示连接成功
  if (!oldAccount && newAccount) {
    toast.success('钱包连接成功！')
  }
  // 从有账户到无账户，表示登出
  else if (oldAccount && !newAccount) {
    previousAccount.value = oldAccount
  }
})

// 初始化前一个账户状态
previousAccount.value = account.value

const handleClick = async () => {
  if (!account.value) {
    await connectWallet()
    // 如果连接失败，错误状态会通过 useWallet 管理，这里不需要额外处理
  } else {
    // 登出逻辑：清空账户状态
    account.value = undefined
    toast.info('已登出')
  }
}

// 检查钱包安装状态
onMounted(() => {
  if (!isWalletInstalled.value) {
    toast.warning('请安装 MetaMask 或其他浏览器钱包')
  }
})

// 监听错误状态
watch(error, (newError) => {
  if (newError) {
    toast.error(newError)
  }
})
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
            <iconify-icon
              :icon="account ? 'tabler:logout' : 'tabler:login'"
              class="icon"
            ></iconify-icon>
            <span>{{ buttonText }}</span>
          </span>
        </button>
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
</style>
