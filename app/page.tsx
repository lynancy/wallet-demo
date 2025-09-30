"use client";
import React, { useState, useEffect } from 'react'
import { useAccount, useDisconnect, useSignMessage, useSendTransaction, useBalance, useWriteContract, useChainId, useEstimateGas } from 'wagmi'
import { AppKitButton } from '@reown/appkit/react'
import { parseEther } from 'viem'
import { TronLinkButton } from './components/TronLinkButton'
import { TronLinkTransaction } from './components/TronLinkTransaction'
import { getSolanaGasFee, estimateSOLTransferFee, SOLANA_NETWORKS, SolanaGasFeeInfo } from '../utils/solana/gasFee'


export default function Home(): React.JSX.Element {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessage } = useSignMessage()
  const { sendTransaction } = useSendTransaction()
  const { data: balance } = useBalance({ address })
  const { writeContract } = useWriteContract()
  const chainId = useChainId()
  
  const [recipientAddress, setRecipientAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [customMessage, setCustomMessage] = useState('Hello WalletConnect!')
  const [transactionHash, setTransactionHash] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // TronLink 状态
  const [tronLinkConnected, setTronLinkConnected] = useState(false)
  const [tronLinkAddress, setTronLinkAddress] = useState('')
  const [tronWeb, setTronWeb] = useState<any>(null)
  
  // Solana 状态
  const [solanaGasFee, setSolanaGasFee] = useState<SolanaGasFeeInfo | null>(null)
  const [solanaNetwork, setSolanaNetwork] = useState('mainnet')
  const [solanaTransferFee, setSolanaTransferFee] = useState<{ totalCost: number; fee: number } | null>(null)
  const [solanaFromAddress, setSolanaFromAddress] = useState('')
  const [solanaToAddress, setSolanaToAddress] = useState('')
  const [solanaAmount, setSolanaAmount] = useState('')
  
  // Solana 交易解析状态
  const [transactionData, setTransactionData] = useState('')
  const [parsedTransaction, setParsedTransaction] = useState<any>(null)
  const [parseError, setParseError] = useState('')
  
  // Gas 费用估算
  const { data: gasEstimate } = useEstimateGas({
    to: recipientAddress as `0x${string}`,
    value: transferAmount ? parseEther(transferAmount) : undefined,
  })

  // 网络信息映射
  const getNetworkInfo = (chainId: number) => {
    const networks = {
      1: { name: 'Ethereum Mainnet', type: '主网', color: 'blue' },
      11155111: { name: 'Sepolia Testnet', type: '测试网', color: 'green' },
      42161: { name: 'Arbitrum One', type: '主网', color: 'blue' },
      421614: { name: 'Arbitrum Sepolia', type: '测试网', color: 'green' },
      137: { name: 'Polygon Mainnet', type: '主网', color: 'blue' },
      80002: { name: 'Polygon Amoy', type: '测试网', color: 'green' },
      // Tron 网络
      195: { name: 'Tron Mainnet', type: '主网', color: 'red' },
      201910292: { name: 'Tron Shasta Testnet', type: '测试网', color: 'green' },
    }
    return networks[chainId as keyof typeof networks] || { name: 'Unknown Network', type: '未知', color: 'gray' }
  }

  const networkInfo = getNetworkInfo(chainId)
  const isTestnet = networkInfo.type === '测试网'

  // TronLink 回调函数
  const handleTronLinkConnect = (address: string, tronWebInstance: any) => {
    const isAddressChanged = tronLinkAddress && tronLinkAddress !== address
    
    setTronLinkConnected(true)
    setTronLinkAddress(address)
    setTronWeb(tronWebInstance)
    
    if (isAddressChanged) {
      console.log('TronLink 账户已切换:', { from: tronLinkAddress, to: address })
      // 可以在这里添加账户切换的提示或处理逻辑
    } else {
      console.log('TronLink 连接成功:', address)
    }
  }

  const handleTronLinkError = (error: string) => {
    console.error('TronLink 错误:', error)
    alert(error)
  }

  const handleTronLinkDisconnect = () => {
    setTronLinkConnected(false)
    setTronLinkAddress('')
    setTronWeb(null)
    console.log('TronLink 已断开连接')
  }

  // Solana Gas Fee 相关函数
  const fetchSolanaGasFee = async () => {
    try {
      setIsLoading(true)
      const gasFeeInfo = await getSolanaGasFee(solanaNetwork)
      setSolanaGasFee(gasFeeInfo)
      console.log('Solana Gas Fee 获取成功:', gasFeeInfo)
    } catch (error) {
      console.error('获取 Solana Gas Fee 失败:', error)
      alert('获取 Solana Gas Fee 失败！')
    } finally {
      setIsLoading(false)
    }
  }

  const estimateSolanaTransferFee = async () => {
    if (!solanaFromAddress || !solanaToAddress || !solanaAmount) {
      alert('请填写完整的 Solana 转账信息！')
      return
    }

    try {
      setIsLoading(true)
      const feeInfo = await estimateSOLTransferFee(
        solanaFromAddress,
        solanaToAddress,
        parseFloat(solanaAmount),
        solanaNetwork
      )
      setSolanaTransferFee(feeInfo)
      console.log('Solana 转账费用估算成功:', feeInfo)
    } catch (error) {
      console.error('估算 Solana 转账费用失败:', error)
      alert('估算 Solana 转账费用失败！')
    } finally {
      setIsLoading(false)
    }
  }

  // Solana 交易解析函数
  const parseSolanaTransaction = async () => {
    if (!transactionData.trim()) {
      alert('请输入交易数据！')
      return
    }

    try {
      setIsLoading(true)
      setParseError('')
      setParsedTransaction(null)

      // 解码 Base64 数据
      const transactionBuffer = Buffer.from(transactionData, 'base64')
      
      // 解析为 VersionedTransaction
      const { VersionedTransaction } = await import('@solana/web3.js')
      const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
      
      const message = versionedTransaction.message
      
      // 解析交易信息
      const parsedData = {
        version: versionedTransaction.version,
        messageVersion: message.version,
        accounts: message.staticAccountKeys?.map(account => account.toString()) || [],
        instructions: message.compiledInstructions?.map((instruction, index) => {
          const programId = message.staticAccountKeys![instruction.programIdIndex]
          const programIdStr = programId.toString()
          
          // 识别程序类型
          let programType = '未知程序'
          if (programIdStr === '11111111111111111111111111111111') {
            programType = 'System Program'
          } else if (programIdStr === 'ComputeBudget111111111111111111111111111111') {
            programType = 'Compute Budget Program'
          } else if (programIdStr === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
            programType = 'Token Program'
          }
          
          // 解析指令详情
          let instructionDetails: any = {}
          if (programType === 'System Program' && instruction.data.length >= 4) {
            const instructionTypeBytes = Buffer.from(instruction.data.slice(0, 4))
            const instructionTypeNum = instructionTypeBytes.readUInt32LE(0)
            
            if (instructionTypeNum === 2) {
              const amountBytes = instruction.data.slice(4, 12)
              // 使用 DataView 解析 64 位小端序整数
              const dataView = new DataView(amountBytes.buffer, amountBytes.byteOffset, amountBytes.byteLength)
              const amount = dataView.getBigUint64(0, true) // true = little endian
              instructionDetails = {
                type: 'SOL 转账',
                amount: amount.toString(),
                amountSOL: Number(amount) / 1e9
              }
            }
          } else if (programType === 'Compute Budget Program') {
            if (instruction.data.length >= 4) {
              const instructionTypeBytes = Buffer.from(instruction.data.slice(0, 4))
              const instructionTypeNum = instructionTypeBytes.readUInt32LE(0)
              
              if (instructionTypeNum === 3) {
                const priceBytes = instruction.data.slice(4, 12)
                // 使用 DataView 解析 64 位小端序整数
                const dataView = new DataView(priceBytes.buffer, priceBytes.byteOffset, priceBytes.byteLength)
                const price = dataView.getBigUint64(0, true) // true = little endian
                instructionDetails = {
                  type: '设置计算单元价格',
                  price: price.toString()
                }
              } else if (instructionTypeNum === 2) {
                const limitBytes = instruction.data.slice(4, 12)
                // 使用 DataView 解析 64 位小端序整数
                const dataView = new DataView(limitBytes.buffer, limitBytes.byteOffset, limitBytes.byteLength)
                const limit = dataView.getBigUint64(0, true) // true = little endian
                instructionDetails = {
                  type: '设置计算单元限制',
                  limit: limit.toString()
                }
              }
            }
          }
          
          return {
            index,
            programId: programIdStr,
            programType,
            programIdIndex: instruction.programIdIndex,
            accountIndexes: instruction.accountKeyIndexes,
            dataLength: instruction.data.length,
            data: Buffer.from(instruction.data).toString('hex'),
            details: instructionDetails
          }
        }) || [],
        signatures: versionedTransaction.signatures?.map((sig: Uint8Array, index: number) => ({
          index,
          signature: Buffer.from(sig).toString('base64'),
          isEmpty: sig.every(byte => byte === 0)
        })) || [],
        rawData: {
          base64: transactionData,
          hex: transactionBuffer.toString('hex'),
          length: transactionBuffer.length
        }
      }

      setParsedTransaction(parsedData)
      console.log('交易解析成功:', parsedData)
      
    } catch (error) {
      console.error('解析交易失败:', error)
      setParseError(error instanceof Error ? error.message : '解析失败')
      alert('解析交易失败！请检查数据格式。')
    } finally {
      setIsLoading(false)
    }
  }

  // 组件加载时获取 Solana Gas Fee
  useEffect(() => {
    fetchSolanaGasFee()
  }, [solanaNetwork])

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
      
      // 根据当前网络选择 USDT 合约地址
      const getUSDTTokenAddress = (chainId: number) => {
        const usdtContracts = {
          // 主网 USDT
          1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum USDT
          137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon USDT
          42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum USDT
          195: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // Tron USDT (TRC20)

          // 测试网 USDT (使用 USDC 作为替代)
          11155111: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // Sepolia USDC
          421614: '0x75faf114eafb1BD4fAd17F2457e62c9Bd5B3a443', // Arbitrum Sepolia USDC
          80002: '0x41E94Eb019C0762f9BfF9fE4e9C8B6c5b0f9B0f9', // Polygon Amoy USDC
          201910292: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', // Tron Shasta Testnet USDT
        }
        return usdtContracts[chainId as keyof typeof usdtContracts] || usdtContracts[11155111]
      }
      
      const tokenContractAddress = getUSDTTokenAddress(chainId)
      
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

          {!isConnected && !tronLinkConnected ? (
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-6">
                  选择连接方式
                </p>
                
                {/* WalletConnect 支持的钱包 */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">WalletConnect 支持的钱包</h3>
                  <AppKitButton />
                </div>
                
                {/* TronLink 自定义支持 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">TronLink 钱包</h3>
                  <TronLinkButton 
                    onConnect={handleTronLinkConnect}
                    onDisconnect={handleTronLinkDisconnect}
                    onError={handleTronLinkError}
                  />
                </div>
              </div>
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
                  {tronLinkConnected ? tronLinkAddress : address}
                </p>
                
                {/* 钱包类型标识 */}
                {tronLinkConnected && (
                  <div className="mb-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      🔴 TronLink
                    </span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      💡 账户变化会自动同步
                    </span>
                  </div>
                )}
                
                {/* 网络信息 */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">当前网络</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tronLinkConnected 
                        ? 'bg-red-100 text-red-800'
                        : isTestnet 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {tronLinkConnected ? 'Tron 主网' : networkInfo.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {tronLinkConnected ? 'Tron Mainnet' : networkInfo.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tronLinkConnected ? 'Tron 网络' : `Chain ID: ${chainId}`}
                  </p>
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
                {/* Solana 交易解析功能 */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-3">🔍 Solana 交易解析</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-indigo-700 mb-2">交易数据 (Base64)</label>
                      <textarea
                        value={transactionData}
                        onChange={(e) => setTransactionData(e.target.value)}
                        placeholder="请输入 Base64 编码的交易数据..."
                        className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                        rows={3}
                      />
                    </div>
                    
                    <button
                      onClick={parseSolanaTransaction}
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {isLoading ? '解析中...' : '解析交易数据'}
                    </button>
                    
                    {/* 解析结果显示 */}
                    {parseError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <h4 className="text-sm font-semibold text-red-800 mb-1">解析错误</h4>
                        <p className="text-xs text-red-700">{parseError}</p>
                      </div>
                    )}
                    
                    {parsedTransaction && (
                      <div className="bg-white border border-indigo-200 rounded-md p-3">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-2">解析结果</h4>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-indigo-600 font-medium">交易版本:</span>
                            <span className="ml-1">{parsedTransaction.version}</span>
                          </div>
                          
                          <div>
                            <span className="text-indigo-600 font-medium">消息版本:</span>
                            <span className="ml-1">{parsedTransaction.messageVersion}</span>
                          </div>
                          
                          <div>
                            <span className="text-indigo-600 font-medium">账户数量:</span>
                            <span className="ml-1">{parsedTransaction.accounts.length}</span>
                          </div>
                          
                          <div>
                            <span className="text-indigo-600 font-medium">指令数量:</span>
                            <span className="ml-1">{parsedTransaction.instructions.length}</span>
                          </div>
                          
                          <div>
                            <span className="text-indigo-600 font-medium">数据长度:</span>
                            <span className="ml-1">{parsedTransaction.rawData.length} 字节</span>
                          </div>
                        </div>
                        
                        {/* 账户列表 */}
                        {parsedTransaction.accounts.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-semibold text-indigo-700 mb-1">涉及的账户:</h5>
                            <div className="space-y-1">
                              {parsedTransaction.accounts.slice(0, 5).map((account: string, index: number) => (
                                <div key={index} className="text-xs font-mono text-gray-600 break-all">
                                  {index}: {account}
                                </div>
                              ))}
                              {parsedTransaction.accounts.length > 5 && (
                                <div className="text-xs text-gray-500">... 还有 {parsedTransaction.accounts.length - 5} 个账户</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* 指令列表 */}
                        {parsedTransaction.instructions.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-semibold text-indigo-700 mb-1">指令详情:</h5>
                            <div className="space-y-2">
                              {parsedTransaction.instructions.map((instruction: any) => (
                                <div key={instruction.index} className="bg-gray-50 rounded p-2 text-xs">
                                  <div className="font-medium text-gray-700 mb-1">
                                    指令 {instruction.index}: {instruction.programType}
                                  </div>
                                  
                                  {/* 程序ID */}
                                  <div className="text-gray-500 mb-1">
                                    <span className="font-medium">程序ID:</span> {instruction.programId}
                                  </div>
                                  
                                  {/* 账户索引 */}
                                  <div className="text-gray-500 mb-1">
                                    <span className="font-medium">账户索引:</span> [{instruction.accountIndexes.join(', ')}]
                                  </div>
                                  
                                  {/* 指令详情 */}
                                  {instruction.details && Object.keys(instruction.details).length > 0 && (
                                    <div className="bg-blue-50 rounded p-2 mt-2">
                                      <div className="font-medium text-blue-800 mb-1">
                                        {instruction.details.type}
                                      </div>
                                      
                                      {/* SOL 转账详情 */}
                                      {instruction.details.type === 'SOL 转账' && (
                                        <div className="text-blue-700">
                                          <div>转账金额: {instruction.details.amount} lamports</div>
                                          <div>转账金额: {instruction.details.amountSOL} SOL</div>
                                        </div>
                                      )}
                                      
                                      {/* 计算单元价格详情 */}
                                      {instruction.details.type === '设置计算单元价格' && (
                                        <div className="text-blue-700">
                                          <div>价格: {instruction.details.price} micro-lamports</div>
                                        </div>
                                      )}
                                      
                                      {/* 计算单元限制详情 */}
                                      {instruction.details.type === '设置计算单元限制' && (
                                        <div className="text-blue-700">
                                          <div>限制: {instruction.details.limit} 计算单元</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* 原始数据 */}
                                  <div className="text-gray-500 mt-1">
                                    <span className="font-medium">数据:</span> {instruction.data.substring(0, 30)}...
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 签名信息 */}
                        {parsedTransaction.signatures.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-semibold text-indigo-700 mb-1">签名信息:</h5>
                            <div className="space-y-1">
                              {parsedTransaction.signatures.map((sig: any) => (
                                <div key={sig.index} className="text-xs">
                                  <span className="text-gray-600">签名 {sig.index}:</span>
                                  <span className={`ml-1 px-1 rounded text-xs ${
                                    sig.isEmpty ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {sig.isEmpty ? '空签名' : '已签名'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Solana Gas Fee 功能 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">🟣 Solana Gas Fee 查询</h3>
                  
                  {/* 网络选择 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-purple-700 mb-2">选择网络</label>
                    <select
                      value={solanaNetwork}
                      onChange={(e) => setSolanaNetwork(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {Object.entries(SOLANA_NETWORKS).map(([key, network]) => (
                        <option key={key} value={key}>
                          {network.name} {network.isTestnet ? '(测试网)' : '(主网)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gas Fee 信息显示 */}
                  {solanaGasFee && (
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-semibold text-purple-800 mb-2">当前网络 Gas Fee 信息</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-purple-600">基础费用:</span>
                          <span className="ml-1 font-mono">{solanaGasFee.baseFeeSOL.toFixed(8)} SOL</span>
                        </div>
                        <div>
                          <span className="text-purple-600">网络状态:</span>
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            solanaGasFee.networkStatus === 'healthy' 
                              ? 'bg-green-100 text-green-800' 
                              : solanaGasFee.networkStatus === 'degraded'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {solanaGasFee.networkStatus === 'healthy' ? '健康' : 
                             solanaGasFee.networkStatus === 'degraded' ? '降级' : '异常'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-purple-600">更新时间:</span>
                          <span className="ml-1">{solanaGasFee.lastUpdated.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 刷新按钮 */}
                  <button
                    onClick={fetchSolanaGasFee}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
                  >
                    {isLoading ? '获取中...' : '刷新 Gas Fee 信息'}
                  </button>

                  {/* SOL 转账费用估算 */}
                  <div className="border-t border-purple-200 pt-4">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">SOL 转账费用估算</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={solanaFromAddress}
                        onChange={(e) => setSolanaFromAddress(e.target.value)}
                        placeholder="发送地址 (Solana 地址)"
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <input
                        type="text"
                        value={solanaToAddress}
                        onChange={(e) => setSolanaToAddress(e.target.value)}
                        placeholder="接收地址 (Solana 地址)"
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        value={solanaAmount}
                        onChange={(e) => setSolanaAmount(e.target.value)}
                        placeholder="转账金额 (SOL)"
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      
                      {/* 费用估算结果 */}
                      {solanaTransferFee && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <h5 className="text-sm font-semibold text-blue-800 mb-2">费用估算结果</h5>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-blue-600">转账金额:</span>
                              <span className="font-mono">{solanaAmount} SOL</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">手续费:</span>
                              <span className="font-mono">{solanaTransferFee.fee.toFixed(8)} SOL</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-blue-200 pt-1">
                              <span className="text-blue-800">总费用:</span>
                              <span className="font-mono">{solanaTransferFee.totalCost.toFixed(8)} SOL</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={estimateSolanaTransferFee}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        {isLoading ? '估算中...' : '估算转账费用'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* TronLink 交易功能 */}
                {tronLinkConnected && tronWeb && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">🔴 TronLink 交易功能</h3>
                    <TronLinkTransaction tronWeb={tronWeb} address={tronLinkAddress} />
                  </div>
                )}
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
                    
                    {/* Gas 费用显示 */}
                    {gasEstimate || 1231231231}
                    {gasEstimate && recipientAddress && transferAmount && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                        <p className="text-xs text-blue-700">
                          💡 预估 Gas 费用: {gasEstimate.toString()} gas units
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          💰 钱包将自动计算最优 gas 价格
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleTransfer}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {isLoading ? '转账中...' : '发送 ETH'}
                    </button>
                  </div>
                </div>

                {/* 3. USDT 转账 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">3. USDT 转账</h3>
                  {isTestnet ? (
                    <div className="mb-3 p-2 bg-green-100 border border-green-200 rounded-md">
                      <p className="text-xs text-green-700">
                        🧪 测试网模式：使用测试代币，无实际价值
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 p-2 bg-blue-100 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700">
                        💰 主网模式：真实 USDT 转账，有实际价值
                      </p>
                    </div>
                  )}
                  
                  {/* Tron 网络特殊说明 */}
                  {(chainId === 195 || chainId === 201910292) && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-md">
                      <p className="text-xs text-red-700">
                        🔴 Tron 网络：使用 TRC20 USDT，手续费更低
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        📝 注意：Tron 地址格式为 T 开头，如：Txxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        💡 推荐使用 Trust Wallet 或 MetaMask 连接 Tron 网络
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder={
                        (chainId === 195 || chainId === 201910292) 
                          ? "接收地址 (T...)" 
                          : "接收地址 (0x...)"
                      }
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
                      {isLoading ? '转账中...' : 
                        (chainId === 195 || chainId === 201910292) 
                          ? `发送${isTestnet ? '测试 ' : ''}TRC20 USDT`
                          : `发送${isTestnet ? '测试 ' : ''}USDT`
                      }
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
                  onClick={() => {
                    if (tronLinkConnected) {
                      setTronLinkConnected(false)
                      setTronLinkAddress('')
                      setTronWeb(null)
                    } else {
                      disconnect()
                    }
                  }}
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