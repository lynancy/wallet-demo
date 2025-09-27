"use client";
import React, { useState, useEffect } from 'react'
import { useAccount, useDisconnect, useSignMessage, useSendTransaction, useBalance, useWriteContract, useChainId } from 'wagmi'
import { AppKitButton } from '@reown/appkit/react'
import { parseEther } from 'viem'

export default function Home(): React.JSX.Element {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessage } = useSignMessage()
  const { sendTransaction } = useSendTransaction()
  const { data: balance } = useBalance({ address })
  const { writeContract } = useWriteContract()
  const chainId = useChainId()

  // 调试信息
  console.log('WalletConnect Debug:', {
    address,
    isConnected,
    chainId,
    balance: balance?.formatted
  })

  // 监听连接状态变化
  useEffect(() => {
    console.log('Connection status changed:', { address, isConnected })
  }, [address, isConnected])
  
  const [recipientAddress, setRecipientAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [customMessage, setCustomMessage] = useState('Hello WalletConnect!')
  const [transactionHash, setTransactionHash] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 网络信息映射
  const getNetworkInfo = (chainId: number) => {
    const networks = {
      1: { name: 'Ethereum Mainnet', type: '主网', color: 'blue' },
      11155111: { name: 'Sepolia Testnet', type: '测试网', color: 'green' },
      42161: { name: 'Arbitrum One', type: '主网', color: 'blue' },
      421614: { name: 'Arbitrum Sepolia', type: '测试网', color: 'green' },
      137: { name: 'Polygon Mainnet', type: '主网', color: 'blue' },
      80002: { name: 'Polygon Amoy', type: '测试网', color: 'green' },
    }
    return networks[chainId as keyof typeof networks] || { name: 'Unknown Network', type: '未知', color: 'gray' }
  }

  const networkInfo = getNetworkInfo(chainId)
  const isTestnet = networkInfo.type === '测试网'

  // 1. 签名消息
  const handleSignMessage = async (): Promise<void> => {
    if (address) {
      try {
        setIsLoading(true)
        const result = await signMessage({
          message: customMessage,
        })
        console.log('Message signed successfully:', result)
        alert('消息签名成功！')
      } catch (error) {
        console.error('Failed to sign message:', error)
        alert('消息签名失败！')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 2. 转账交易
  const handleTransfer = async (): Promise<void> => {
    if (!address || !recipientAddress || !transferAmount) {
      alert('请填写完整的转账信息！')
      return
    }

    try {
      setIsLoading(true)
      sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: parseEther(transferAmount),
      }, {
        onSuccess: (hash) => {
          console.log('Transfer transaction sent:', hash)
          setTransactionHash(hash)
          alert(`转账交易已发送！交易哈希: ${hash}`)
        },
        onError: (error) => {
          console.error('Transfer failed:', error)
          alert('转账失败！')
        }
      })
    } catch (error) {
      console.error('Transfer failed:', error)
      alert('转账失败！')
    } finally {
      setIsLoading(false)
    }
  }

  // 3. 智能合约交互 (ERC20 代币转账示例)
  const handleTokenTransfer = async (): Promise<void> => {
    if (!address || !recipientAddress || !transferAmount) {
      alert('请填写完整的代币转账信息！')
      return
    }

    try {
      setIsLoading(true)
      
      // 根据当前网络选择测试代币合约地址
      const getTestTokenAddress = (chainId: number) => {
        const testTokens = {
          1: '0xA0b86a33E6441b8C4C8C0d4Cecc0f7B2d8c8b8b8', // 主网 USDC (示例)
          11155111: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // Sepolia USDC
          42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
          421614: '0x75faf114eafb1BD4fAd17F2457e62c9Bd5B3a443', // Arbitrum Sepolia USDC
          137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon USDC
          80002: '0x41E94Eb019C0762f9BfF9fE4e9C8B6c5b0f9B0f9', // Polygon Amoy USDC
        }
        return testTokens[chainId as keyof typeof testTokens] || testTokens[11155111]
      }
      
      const tokenContractAddress = getTestTokenAddress(chainId)
      
      await writeContract({
        address: tokenContractAddress as `0x${string}`,
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'transfer',
        args: [recipientAddress as `0x${string}`, parseEther(transferAmount)]
      })
      
      console.log('Token transfer initiated')
      alert('代币转账交易已发送！')
    } catch (error) {
      console.error('Token transfer failed:', error)
      alert('代币转账失败！')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          WalletConnect Demo
        </h1>
        
        <div className="text-center space-y-6">
          {/* 调试信息显示 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
            <p className="text-xs text-yellow-800 mb-1">调试信息:</p>
            <p className="text-xs text-yellow-700">地址: {address || '未连接'}</p>
            <p className="text-xs text-yellow-700">连接状态: {isConnected ? '已连接' : '未连接'}</p>
            <p className="text-xs text-yellow-700">Chain ID: {chainId || '未知'}</p>
          </div>

          {!isConnected ? (
            <div>
              <p className="text-gray-600 mb-6">
                点击下方按钮连接钱包
              </p>
              <AppKitButton />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-green-600 text-lg font-semibold">
                ✅ 钱包已连接
              </div>
              
              {/* 钱包信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">钱包地址</p>
                <p className="text-sm font-mono text-gray-900 break-all mb-2">
                  {address}
                </p>
                
                {/* 网络信息 */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">当前网络</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isTestnet 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {networkInfo.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {networkInfo.name}
                  </p>
                  <p className="text-xs text-gray-500">Chain ID: {chainId}</p>
                </div>

                {balance && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-500">余额</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                    </p>
                    {isTestnet && (
                      <p className="text-xs text-green-600 mt-1">
                        💡 测试网代币，无实际价值
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 交易功能区域 */}
              <div className="space-y-6">
                {/* 1. 签名消息 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">1. 签名消息</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="输入要签名的消息"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSignMessage}
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {isLoading ? '签名中...' : '签名消息'}
                    </button>
                  </div>
                </div>

                {/* 2. ETH 转账 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">2. ETH 转账</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="接收地址 (0x...)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="转账金额 (ETH)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleTransfer}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {isLoading ? '转账中...' : '发送 ETH'}
                    </button>
                  </div>
                </div>

                {/* 3. 代币转账 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">3. ERC20 代币转账</h3>
                  {isTestnet && (
                    <div className="mb-3 p-2 bg-green-100 border border-green-200 rounded-md">
                      <p className="text-xs text-green-700">
                        🧪 测试网模式：使用测试代币，无实际价值
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="接收地址 (0x...)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="转账金额"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleTokenTransfer}
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {isLoading ? '转账中...' : `发送${isTestnet ? '测试' : ''}代币`}
                    </button>
                  </div>
                </div>

                {/* 交易哈希显示 */}
                {transactionHash && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2">最新交易哈希</h4>
                    <p className="text-xs font-mono text-yellow-800 break-all">
                      {transactionHash}
                    </p>
                  </div>
                )}
                
                {/* 断开连接 */}
                <button
                  onClick={() => disconnect()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  断开连接
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}