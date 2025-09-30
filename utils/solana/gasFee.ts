import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'

/**
 * Solana Gas Fee 获取工具 - 优化版
 * @author Cursor AI
 */
export interface SolanaGasFeeInfo {
  /** 总交易费用 (lamports) - 包含基础费用和优先费用 */
  baseFee: number
  /** 总交易费用 (SOL) - 包含基础费用和优先费用 */
  baseFeeSOL: number
  /** 网络状态 */
  networkStatus: 'healthy' | 'degraded' | 'unhealthy'
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * Solana 网络配置
 */
export interface SolanaNetworkConfig {
  /** RPC 端点 URL */
  rpcUrl: string
  /** 网络名称 */
  name: string
  /** 是否为测试网 */
  isTestnet: boolean
}

/**
 * 预定义的 Solana 网络配置
 */
export const SOLANA_NETWORKS: Record<string, SolanaNetworkConfig> = {
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
 * Solana Gas Fee 管理器 - 简化版
 * @author Cursor AI
 */
export class SolanaGasFeeManager {
  private connection: Connection
  private networkConfig: SolanaNetworkConfig
  private cache: Map<string, SolanaGasFeeInfo> = new Map()
  private cacheTimeout = 30000 // 30秒缓存

  constructor(networkConfig: SolanaNetworkConfig) {
    this.networkConfig = networkConfig
    this.connection = new Connection(networkConfig.rpcUrl, 'confirmed')
  }

  /**
   * 获取当前网络的 Gas Fee 信息
   * @returns Promise<SolanaGasFeeInfo>
   */
  async getGasFeeInfo(): Promise<SolanaGasFeeInfo> {
    const cacheKey = 'gasFeeInfo'
    const cached = this.cache.get(cacheKey)
    
    // 检查缓存是否有效
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTimeout) {
      return cached
    }

    try {
      // 测试网络连接
      await this.connection.getLatestBlockhash('confirmed')
      const networkStatus = 'healthy'

      // 获取实际的 gas fee
      const recentFees = await this.connection.getRecentPrioritizationFees()
      
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
          // 如果所有费用都是 0，说明网络不拥堵
          // 但仍然建议使用最小优先费用以确保交易快速处理
          priorityFee = 1000 // 1,000 lamports = 0.000001 SOL
        }
      } else {
        // 如果没有费用数据，使用默认优先费用
        priorityFee = 1000 // 1,000 lamports = 0.000001 SOL
      }

      // Solana 的基础费用是固定的
      const baseFee = 5000 // 5000 lamports = 0.000005 SOL
      const totalFee = baseFee + priorityFee

      const gasFeeInfo: SolanaGasFeeInfo = {
        baseFee: totalFee, // 返回总费用
        baseFeeSOL: totalFee / 1e9,
        networkStatus,
        lastUpdated: new Date(),
      }

      // 更新缓存
      this.cache.set(cacheKey, gasFeeInfo)
      
      return gasFeeInfo
    } catch (error) {
      console.error('获取 Solana Gas Fee 失败:', error)
      
      // 返回默认值
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
   * @param fromAddress 发送地址
   * @param toAddress 接收地址
   * @param amount 转账金额 (SOL)
   * @returns Promise<{ totalCost: number; fee: number }>
   */
  async estimateSOLTransferFee(
    fromAddress: string,
    toAddress: string,
    amount: number
  ): Promise<{ totalCost: number; fee: number }> {
    try {
      const transaction = new Transaction()
      
      // 添加 SOL 转账指令
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromAddress),
          toPubkey: new PublicKey(toAddress),
          lamports: amount * 1e9,
        })
      )

      const gasFeeInfo = await this.getGasFeeInfo()
      const totalCost = amount + gasFeeInfo.baseFeeSOL

      return {
        totalCost,
        fee: gasFeeInfo.baseFeeSOL,
      }
    } catch (error) {
      console.error('估算 SOL 转账费用失败:', error)
      const gasFeeInfo = await this.getGasFeeInfo()
      return {
        totalCost: amount + gasFeeInfo.baseFeeSOL,
        fee: gasFeeInfo.baseFeeSOL,
      }
    }
  }

  /**
   * 获取网络状态
   * @returns Promise<string>
   */
  async getNetworkStatus(): Promise<string> {
    try {
      await this.connection.getLatestBlockhash('confirmed')
      return 'healthy'
    } catch (error) {
      console.error('获取网络状态失败:', error)
      return 'unhealthy'
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * 创建 Solana Gas Fee 管理器实例
 * @param network 网络名称或自定义配置
 * @returns SolanaGasFeeManager
 */
export function createSolanaGasFeeManager(network: string | SolanaNetworkConfig = 'mainnet'): SolanaGasFeeManager {
  let networkConfig: SolanaNetworkConfig

  if (typeof network === 'string') {
    networkConfig = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.mainnet
  } else {
    networkConfig = network
  }

  return new SolanaGasFeeManager(networkConfig)
}

/**
 * 快速获取 Solana Gas Fee 信息
 * @param network 网络名称
 * @returns Promise<SolanaGasFeeInfo>
 */
export async function getSolanaGasFee(network: string = 'mainnet'): Promise<SolanaGasFeeInfo> {
  const manager = createSolanaGasFeeManager(network)
  return await manager.getGasFeeInfo()
}

/**
 * 快速估算 SOL 转账费用
 * @param fromAddress 发送地址
 * @param toAddress 接收地址
 * @param amount 转账金额 (SOL)
 * @param network 网络名称
 * @returns Promise<{ totalCost: number, fee: number }>
 */
export async function estimateSOLTransferFee(
  fromAddress: string,
  toAddress: string,
  amount: number,
  network: string = 'mainnet'
): Promise<{ totalCost: number; fee: number }> {
  const manager = createSolanaGasFeeManager(network)
  return await manager.estimateSOLTransferFee(fromAddress, toAddress, amount)
}