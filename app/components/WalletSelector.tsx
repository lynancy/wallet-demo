"use client";
import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'

/**
 * 直接显示在页面上的钱包选择器组件
 * @author Cursor AI
 */
export const WalletSelector: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = (connector: any) => {
    if (isConnected) {
      disconnect()
    } else {
      connect({ connector })
    }
  }

  // 获取可用的连接器
  const injectedConnector = connectors.find(c => c.type === 'injected')
  const walletConnectConnector = connectors.find(c => c.type === 'walletConnect')

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
        选择钱包连接
      </h2>

      {/* 钱包选项 */}
      <div className="space-y-4">
        {/* MetaMask */}
        {injectedConnector && (
          <button
            onClick={() => handleConnect(injectedConnector)}
            disabled={isPending}
            className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20.5 2L18.5 9.5L20.5 13.5L20.5 2Z" fill="white"/>
                <path d="M3.5 2L5.5 9.5L3.5 13.5L3.5 2Z" fill="white"/>
                <path d="M24 22.5L20.5 27L25.5 28.5L27 22.5L24 22.5Z" fill="white"/>
                <path d="M0 22.5L3.5 28.5L-1.5 27L0 22.5Z" fill="white"/>
                <path d="M20.5 9.5L18.5 13.5L24 15L25.5 10L20.5 9.5Z" fill="white"/>
                <path d="M3.5 9.5L1.5 10L0 15L5.5 13.5L3.5 9.5Z" fill="white"/>
                <path d="M5.5 13.5L8 27L10 22.5L5.5 13.5Z" fill="white"/>
                <path d="M18.5 13.5L16 22.5L14 27L18.5 13.5Z" fill="white"/>
                <path d="M8 15L10 16.5L5.5 13.5L8 15Z" fill="white"/>
                <path d="M16 15L18.5 13.5L14 16.5L16 15Z" fill="white"/>
                <path d="M10 16.5L11 20.5L8 22.5L10 16.5Z" fill="white"/>
                <path d="M14 16.5L16 22.5L13 20.5L14 16.5Z" fill="white"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">MetaMask</h3>
              <p className="text-sm text-gray-500">浏览器扩展钱包</p>
            </div>
            <div className="text-gray-400">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        )}

        {/* WalletConnect */}
        {walletConnectConnector && (
          <button
            onClick={() => handleConnect(walletConnectConnector)}
            disabled={isPending}
            className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                <path d="M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">WalletConnect</h3>
              <p className="text-sm text-gray-500">移动钱包连接</p>
            </div>
            <div className="text-gray-400">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        )}

        {/* Coinbase Wallet */}
        <button
          onClick={() => {
            // 尝试连接 Coinbase Wallet
            if (window.ethereum && window.ethereum.isCoinbaseWallet) {
              handleConnect(injectedConnector)
            } else {
              alert('请安装 Coinbase Wallet 扩展')
            }
          }}
          disabled={isPending}
          className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900">Coinbase Wallet</h3>
            <p className="text-sm text-gray-500">Coinbase 官方钱包</p>
          </div>
          <div className="text-gray-400">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
      </div>

      {/* 连接状态 */}
      {isConnected && address && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              已连接钱包
            </span>
          </div>
          <p className="text-xs text-green-700 font-mono break-all">
            {address}
          </p>
          <button
            onClick={() => disconnect()}
            className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
          >
            断开连接
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isPending && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">连接中...</span>
          </div>
        </div>
      )}
    </div>
  )
}
