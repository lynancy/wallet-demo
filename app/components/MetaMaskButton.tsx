"use client";
import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

/**
 * 自定义 MetaMask 连接按钮组件
 * @author Cursor AI
 */
export const MetaMaskButton: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    if (isConnected) {
      disconnect()
    } else {
      connect({ connector: injected() })
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* MetaMask 图标和连接按钮 */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M28.5 2L18.5 9.5L20.5 13.5L28.5 2Z" 
              fill="#E2761B"
            />
            <path 
              d="M3.5 2L13.5 9.5L11.5 13.5L3.5 2Z" 
              fill="#E4761B"
            />
            <path 
              d="M24 22.5L20.5 27L25.5 28.5L27 22.5L24 22.5Z" 
              fill="#E4761B"
            />
            <path 
              d="M5 22.5L6.5 28.5L11.5 27L8 22.5L5 22.5Z" 
              fill="#E4761B"
            />
            <path 
              d="M20.5 9.5L18.5 13.5L24 15L25.5 10L20.5 9.5Z" 
              fill="#E4761B"
            />
            <path 
              d="M11.5 9.5L6.5 10L8 15L13.5 13.5L11.5 9.5Z" 
              fill="#E4761B"
            />
            <path 
              d="M8 15L11.5 27L13.5 22.5L8 15Z" 
              fill="#E4761B"
            />
            <path 
              d="M24 15L20.5 22.5L22.5 27L24 15Z" 
              fill="#E4761B"
            />
            <path 
              d="M13.5 13.5L15.5 16.5L8 15L13.5 13.5Z" 
              fill="#E4761B"
            />
            <path 
              d="M18.5 13.5L24 15L16.5 16.5L18.5 13.5Z" 
              fill="#E4761B"
            />
            <path 
              d="M15.5 16.5L16.5 20.5L11.5 22.5L15.5 16.5Z" 
              fill="#E4761B"
            />
            <path 
              d="M16.5 16.5L20.5 22.5L16.5 20.5L16.5 16.5Z" 
              fill="#E4761B"
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900">
          MetaMask
        </h3>
        
        <p className="text-sm text-gray-600 text-center max-w-xs">
          连接您的 MetaMask 钱包以开始使用
        </p>
      </div>

      {/* 连接/断开按钮 */}
      <button
        onClick={handleConnect}
        disabled={isPending}
        className={`
          px-8 py-3 rounded-lg font-semibold text-white transition-colors
          ${isConnected 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-orange-500 hover:bg-orange-600'
          }
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isPending 
          ? '连接中...' 
          : isConnected 
            ? '断开连接' 
            : '连接 MetaMask'
        }
      </button>

      {/* 连接状态显示 */}
      {isConnected && address && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              已连接到 MetaMask
            </span>
          </div>
          <p className="text-xs text-green-700 font-mono break-all">
            {address}
          </p>
        </div>
      )}
    </div>
  )
}
