"use client";
import React, { useState } from 'react'

interface TronLinkTransactionProps {
  tronWeb: any
  address: string
}

export function TronLinkTransaction({ tronWeb, address }: TronLinkTransactionProps) {
  const [recipientAddress, setRecipientAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')

  // TRC20 USDT 合约地址
  const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  
  // USDT ABI (简化版)
  const USDT_ABI = [
    {
      "constant": false,
      "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    }
  ]

  // 获取 TRX 余额
  const getTRXBalance = async () => {
    try {
      const balance = await tronWeb.trx.getBalance(address)
      const trxBalance = balance / 1000000 // 转换为 TRX
      alert(`TRX 余额: ${trxBalance.toFixed(6)} TRX`)
    } catch (error) {
      console.error('获取余额失败:', error)
      alert('获取余额失败')
    }
  }

  // 获取 USDT 余额
  const getUSDTBalance = async () => {
    try {
      const contract = await tronWeb.contract(USDT_ABI, USDT_CONTRACT_ADDRESS)
      const balance = await contract.balanceOf(address).call()
      const usdtBalance = balance / 1000000 // USDT 精度为 6
      alert(`USDT 余额: ${usdtBalance.toFixed(6)} USDT`)
    } catch (error) {
      console.error('获取 USDT 余额失败:', error)
      alert('获取 USDT 余额失败')
    }
  }

  // 发送 TRX
  const sendTRX = async () => {
    if (!recipientAddress || !transferAmount) {
      alert('请填写完整的转账信息！')
      return
    }

    try {
      setIsLoading(true)
      
      const amount = parseFloat(transferAmount) * 1000000 // 转换为 SUN
      
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        recipientAddress,
        amount,
        address
      )
      
      const signedTransaction = await tronWeb.trx.sign(transaction)
      const result = await tronWeb.trx.sendRawTransaction(signedTransaction)
      
      if (result.result) {
        setTransactionHash(result.txid)
        alert(`TRX 转账成功！交易哈希: ${result.txid}`)
      } else {
        alert('TRX 转账失败')
      }
    } catch (error) {
      console.error('TRX 转账失败:', error)
      alert(`TRX 转账失败: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 发送 USDT
  const sendUSDT = async () => {
    if (!recipientAddress || !transferAmount) {
      alert('请填写完整的转账信息！')
      return
    }

    try {
      setIsLoading(true)
      
      const amount = parseFloat(transferAmount) * 1000000 // USDT 精度为 6
      
      const contract = await tronWeb.contract(USDT_ABI, USDT_CONTRACT_ADDRESS)
      
      const transaction = await contract.transfer(recipientAddress, amount).send({
        feeLimit: 100000000, // 100 TRX
        callValue: 0,
        shouldPollResponse: true
      })
      
      if (transaction) {
        setTransactionHash(transaction)
        alert(`USDT 转账成功！交易哈希: ${transaction}`)
      } else {
        alert('USDT 转账失败')
      }
    } catch (error) {
      console.error('USDT 转账失败:', error)
      alert(`USDT 转账失败: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 余额查询 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">余额查询</h3>
        <div className="space-y-2">
          <button
            onClick={getTRXBalance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            查询 TRX 余额
          </button>
          <button
            onClick={getUSDTBalance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            查询 USDT 余额
          </button>
        </div>
      </div>

      {/* TRX 转账 */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-3">TRX 转账</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="接收地址 (T...)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            step="0.000001"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="转账金额 (TRX)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={sendTRX}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? '转账中...' : '发送 TRX'}
          </button>
        </div>
      </div>

      {/* USDT 转账 */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">USDT 转账 (TRC20)</h3>
        <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-md">
          <p className="text-xs text-red-700">
            🔴 Tron 网络：使用 TRC20 USDT，手续费更低
          </p>
          <p className="text-xs text-red-600 mt-1">
            📝 注意：Tron 地址格式为 T 开头
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="接收地址 (T...)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="number"
            step="0.000001"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="转账金额 (USDT)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={sendUSDT}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? '转账中...' : '发送 USDT'}
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
    </div>
  )
}
