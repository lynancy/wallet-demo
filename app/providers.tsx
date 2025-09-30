"use client";
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon, sepolia, arbitrumSepolia, polygonAmoy } from 'viem/chains'
import { solana, solanaTestnet } from '@reown/appkit/networks'
import { useState } from 'react'

// 1. Get projectId from https://cloud.reown.com
const projectId = "3121b6d20acdd2bf11fdfaac0a27f3d1"

// 2. Set up Wagmi Adapter with testnets
const wagmiAdapter = new WagmiAdapter({
  networks: [
    // 主网
    mainnet, 
    arbitrum, 
    polygon,
    // 测试网
    sepolia,        // Ethereum 测试网
    arbitrumSepolia, // Arbitrum 测试网
    polygonAmoy     // Polygon 测试网
  ],
  projectId,
})

// 3. Create modal with multi-chain support (主网 + 测试网)
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [
    // 主网
    mainnet, 
    arbitrum, 
    polygon,
    solana,
    // 测试网
    sepolia,
    arbitrumSepolia,
    polygonAmoy,
    solanaTestnet
  ],
  // defaultNetwork: sepolia, // 默认使用测试网，更安全
  // 启用多链支持
  enableNetworkSwitch: true,
  // 设置默认钱包列表（优先显示的钱包）
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89ebdbfcae8ca4fa4e34e418ab', // MetaMask
    '19177a98252e07ddfc9af2083ba8e07f6273a63ecc9c6204ef71024a1bd8a06', // Phantom
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b230253ef1f8959bebc13ad', // WalletConnect
    'c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263a0caf9e2098', // Trust Wallet
    'fd20dc426fb37566d74c4b3b0c0b4b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0', // Coinbase Wallet
    // 注意：TronLink 目前不被 Reown AppKit 原生支持
    // 但 Trust Wallet 和 MetaMask 都支持 Tron 网络
  ]
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
