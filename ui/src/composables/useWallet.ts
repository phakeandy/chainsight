import { ref, computed } from 'vue'
import { createWalletClient, custom, type Address } from 'viem'
import { hardhat } from './chains'

// 状态管理
const account = ref<Address | undefined>(undefined)
const isConnecting = ref(false)
const error = ref<string | undefined>(undefined)

// 检查浏览器环境是否支持 Ethereum
const isWalletInstalled = computed(() => typeof window.ethereum !== 'undefined')

/**
 * 封装 viem 钱包连接和账户管理的 Composable
 */
export function useWallet() {
  const walletClient = computed(() => {
    if (typeof window.ethereum === 'undefined') {
      return undefined
    }
    // 使用 MetaMask 或其他兼容 EIP-1193 的钱包
    return createWalletClient({
      chain: hardhat,
      transport: custom(window.ethereum),
    })
  })

  /**
   * 连接钱包并获取账户地址
   */
  async function connectWallet() {
    if (!isWalletInstalled.value) {
      error.value = '未检测到浏览器钱包 (如 MetaMask)。请安装后重试。'
      return
    }

    if (account.value) {
      // 已经连接，无需重复操作
      return
    }

    isConnecting.value = true
    error.value = undefined

    try {
      const client = walletClient.value
      if (!client) {
        throw new Error('无法创建钱包客户端。')
      }

      // 请求连接账户
      const [address] = await client.requestAddresses()
      account.value = address

      // 尝试切换到 Hardhat 网络 (如果钱包支持)
      try {
        await client.switchChain({ id: hardhat.id })
      } catch (switchError) {
        console.warn('无法自动切换到 Hardhat 网络。请手动切换。', switchError)
        // 忽略切换错误，因为用户可能需要手动添加网络
      }

      // 监听账户变化
      window.ethereum.on('accountsChanged', (accounts: Address[]) => {
        account.value = accounts[0]
      })

      // 监听网络变化
      window.ethereum.on('chainChanged', (chainId: string) => {
        // 刷新页面或更新状态以反映新的网络
        console.log('Chain changed to:', chainId)
      })
    } catch (err) {
      console.error('连接钱包失败:', err)
      error.value = '连接钱包失败。请检查您的钱包是否已解锁并授权。'
    } finally {
      isConnecting.value = false
    }
  }

  return {
    account,
    isConnecting,
    error,
    isWalletInstalled,
    connectWallet,
    walletClient,
  }
}
