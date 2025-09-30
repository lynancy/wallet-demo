import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'

/**
 * Solana Gas Fee 获取工具 - 简化版
 * @author Cursor AI
 */
export interface SolanaGasFeeInfo {
  baseFee: number
  baseFeeSOL: number
  networkStatus: 'healthy' | 'unhealthy'
  lastUpdated: Date
}

export const SOLANA_NETWORKS = {
  mainnet: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    name: 'Solana Mainnet',
    isTestnet: false,
  },
  testnet: {
    rpcUrl: 'https://api.testnet.solana.com',
    name: 'Solana Testnet',
    isTestnet: true,
  },
  devnet: {
    rpcUrl: 'https://api.devnet.solana.com',
    name: 'Solana Devnet',
    isTestnet: true,
  },
}

/**
 * 获取 Solana Gas Fee 信息
 */
export async function getSolanaGasFee(network: string = 'mainnet'): Promise<SolanaGasFeeInfo> {
  const networkConfig = SOLANA_NETWORKS[network as keyof typeof SOLANA_NETWORKS] || SOLANA_NETWORKS.mainnet
  const connection = new Connection(networkConfig.rpcUrl, 'confirmed')

  try {
    // 测试网络连接
    await connection.getLatestBlockhash('confirmed')
    
    // 获取实际的 gas fee
    const recentFees = await connection.getRecentPrioritizationFees()
    
    // 计算优先费用
    let priorityFee = 0
    if (recentFees && recentFees.length > 0) {
      // 过滤掉 0 费用的记录，只计算有优先费用的交易
      const nonZeroFees = recentFees.filter(fee => fee.prioritizationFee > 0)
      
      if (nonZeroFees.length > 0) {
        // 计算非零费用的平均值
        const totalFees = nonZeroFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0)
        const avgMicroLamports = Math.floor(totalFees / nonZeroFees.length)
        priorityFee = Math.floor(avgMicroLamports / 1e6) // 转换为 lamports
      } else {
        // 如果所有费用都是 0，使用网络建议的最小优先费用
        priorityFee = 1000 // 1,000 lamports = 0.000001 SOL
      }
    } else {
      // 如果没有费用数据，使用默认优先费用
      priorityFee = 1000 // 1,000 lamports = 0.000001 SOL
    }

    // Solana 的基础费用是固定的
    const baseFee = 5000 // 5000 lamports = 0.000005 SOL
    const totalFee = baseFee + priorityFee
    
    return {
      baseFee: totalFee, // 返回总费用
      baseFeeSOL: totalFee / 1e9,
      networkStatus: 'healthy',
      lastUpdated: new Date(),
    }
  } catch (error) {
    console.error('获取 Solana Gas Fee 失败:', error)
    return {
      baseFee: 5000,
      baseFeeSOL: 5000 / 1e9,
      networkStatus: 'unhealthy',
      lastUpdated: new Date(),
    }
  }
}

/**
 * 估算 SOL 转账费用
 */
export async function estimateSOLTransferFee(
  fromAddress: string,
  toAddress: string,
  amount: number,
  network: string = 'mainnet'
): Promise<{ totalCost: number; fee: number }> {
  const gasFeeInfo = await getSolanaGasFee(network)
  const totalCost = amount + gasFeeInfo.baseFeeSOL

  return {
    totalCost,
    fee: gasFeeInfo.baseFeeSOL,
  }
}

/**
 * Solana Gas Fee 使用示例
 */
async function demonstrateGasFeeUsage() {
  console.log('🚀 Solana Gas Fee 获取示例')
  console.log('=' .repeat(50))

  try {
    // 1. 获取基础 Gas Fee 信息
    console.log('\n📊 获取 Gas Fee 信息:')
    const gasFeeInfo = await getSolanaGasFee('mainnet')
    console.log(`基础费用: ${gasFeeInfo.baseFeeSOL.toFixed(9)} SOL`)
    console.log(`网络状态: ${gasFeeInfo.networkStatus}`)
    console.log(`更新时间: ${gasFeeInfo.lastUpdated.toLocaleTimeString()}`)

    // 2. 估算 SOL 转账费用
    console.log('\n💰 估算 SOL 转账费用:')
    const fromAddress = '9DDx85W462zPiqqKhQ3X3v7E65DqurwcusfG3QY5f2Xi'
    const toAddress = '5jutit5EogWdX8owZaDhmiMUcsch9U9reFvNsQD4F9y2'
    const amount = 1.0 // 转账 1 SOL

    const feeInfo = await estimateSOLTransferFee(fromAddress, toAddress, amount, 'mainnet')
    console.log(`转账金额: ${amount} SOL`)
    console.log(`手续费: ${feeInfo.fee.toFixed(9)} SOL`)
    console.log(`总费用: ${feeInfo.totalCost.toFixed(9)} SOL`)

    // 3. 测试不同网络
    console.log('\n🌐 测试不同网络:')
    for (const [networkName, networkConfig] of Object.entries(SOLANA_NETWORKS)) {
      try {
        const networkGasFee = await getSolanaGasFee(networkName)
        console.log(`${networkConfig.name}: ${networkGasFee.baseFeeSOL.toFixed(9)} SOL (${networkGasFee.networkStatus})`)
      } catch (error) {
        console.log(`${networkConfig.name}: 连接失败`)
      }
    }

    console.log('\n✅ 示例完成!')

  } catch (error) {
    console.error('❌ 示例失败:', error)
  }
}

// 运行示例
demonstrateGasFeeUsage()
