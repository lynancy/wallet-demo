"use client";
import React, { useState, useEffect } from 'react'

interface TronLinkButtonProps {
  onConnect?: (address: string, tronWeb: any) => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    tronWeb?: {
      ready: boolean
      defaultAddress: {
        base58: string
      }
      request: (params: any) => Promise<any>
      trx: {
        getBalance: (address: string) => Promise<number>
        sendTransaction: (transaction: any) => Promise<any>
      }
      contract: (abi: any[], address: string) => any
    }
  }
}

export function TronLinkButton({ onConnect, onDisconnect, onError }: TronLinkButtonProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false)

  // 检测 TronLink 是否安装和账户变化
  useEffect(() => {
    const checkTronLink = () => {
      if (window.tronWeb) {
        setIsInstalled(true)
        // 只有在没有手动断开连接的情况下才自动连接
        if (!isManuallyDisconnected && window.tronWeb.ready && window.tronWeb.defaultAddress.base58) {
          const currentAddress = window.tronWeb.defaultAddress.base58
          
          // 检查地址是否发生变化
          if (address !== currentAddress) {
            console.log('TronLink 账户变化:', { from: address, to: currentAddress })
            setAddress(currentAddress)
            
            // 如果之前已连接，通知父组件地址变化
            if (isConnected) {
              onConnect?.(currentAddress, window.tronWeb)
            } else {
              // 首次连接
              setIsConnected(true)
              onConnect?.(currentAddress, window.tronWeb)
            }
          } else if (!isConnected) {
            // 地址没变化但未连接，进行连接
            setIsConnected(true)
            setAddress(currentAddress)
            onConnect?.(currentAddress, window.tronWeb)
          }
        }
      } else {
        setIsInstalled(false)
        setIsConnected(false)
        setAddress('')
      }
    }

    checkTronLink()
    
    // 监听 TronLink 状态变化
    const interval = setInterval(checkTronLink, 1000)
    
    return () => clearInterval(interval)
  }, [isManuallyDisconnected, address, isConnected, onConnect])

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      setIsManuallyDisconnected(false) // 重置手动断开状态

      if (!isInstalled) {
        onError?.('请先安装 TronLink 钱包扩展！')
        window.open('https://www.tronlink.org/', '_blank')
        return
      }

      if (!window.tronWeb?.ready) {
        onError?.('请在 TronLink 中登录您的账户')
        return
      }

      // 请求用户授权
      try {
        const res = await window.tronWeb.request({
          method: 'tron_requestAccounts',
          params: {
            websiteIcon: window.location.origin + '/favicon.ico',
            websiteName: 'WalletConnect Demo',
          },
        })

        if (res.code === 200) {
          const userAddress = window.tronWeb.defaultAddress.base58

          setIsConnected(true)
          setAddress(userAddress)
          onConnect?.(userAddress, window.tronWeb)
          console.log('TronLink 连接ing:', userAddress)
        } else {
          onError?.('用户拒绝了授权')
        }
      } catch (error) {
        // 如果 tron_requestAccounts 失败，尝试直接获取地址
        const userAddress = window.tronWeb.defaultAddress.base58
        if (userAddress) {
          setIsConnected(true)
          setAddress(userAddress)
          onConnect?.(userAddress, window.tronWeb)
        } else {
          onError?.('无法获取钱包地址，请检查 TronLink 设置')
        }
      }
    } catch (error) {
      console.error('连接 TronLink 失败:', error)
      onError?.(`连接 TronLink 时出错: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setAddress('')
    setIsManuallyDisconnected(true) // 标记为手动断开
    onDisconnect?.() // 通知父组件断开连接
  }

  if (!isInstalled) {
    return (
      <button
        onClick={handleConnect}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        📥 安装 TronLink 钱包
      </button>
    )
  }

  if (isConnected) {
    return (
      <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-green-800 font-semibold">✅ TronLink 已连接</span>
          <button
            onClick={handleDisconnect}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            断开连接
          </button>
        </div>
        <p className="text-sm text-green-700 font-mono break-all">
          {address}
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
    >
      {isLoading ? '连接中...' : '🔗 连接 TronLink'}
    </button>
  )
}
