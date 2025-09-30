import { Transaction, VersionedTransaction } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'

/**
 * Solana 交易解析工具
 * @author Cursor AI
 */
export class SolanaTransactionParser {
  private connection: Connection

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  /**
   * 解析 Base64 编码的交易数据
   * @param base64Data Base64 编码的交易数据
   * @returns 解析后的交易信息
   */
  async parseTransaction(base64Data: string) {
    try {
      // 解码 Base64 数据
      const transactionBuffer = Buffer.from(base64Data, 'base64')
      
      console.log('交易数据长度:', transactionBuffer.length, '字节')
      console.log('原始数据 (hex):', transactionBuffer.toString('hex'))

      // 尝试解析为 VersionedTransaction (新格式)
      let versionedTransaction: VersionedTransaction | null = null
      let legacyTransaction: Transaction | null = null
      let parseError: string | null = null

      try {
        versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
        console.log('✅ 成功解析为 VersionedTransaction')
      } catch (error) {
        console.log('❌ 无法解析为 VersionedTransaction:', error)
        parseError = error instanceof Error ? error.message : 'Unknown error'
      }

      // 如果 VersionedTransaction 解析失败，尝试 Legacy Transaction
      if (!versionedTransaction) {
        try {
          legacyTransaction = Transaction.from(transactionBuffer)
          console.log('✅ 成功解析为 Legacy Transaction')
        } catch (error) {
          console.log('❌ 无法解析为 Legacy Transaction:', error)
          parseError = error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // 返回解析结果
      const result = {
        success: !!(versionedTransaction || legacyTransaction),
        transactionType: versionedTransaction ? 'VersionedTransaction' : legacyTransaction ? 'LegacyTransaction' : 'Unknown',
        versionedTransaction,
        legacyTransaction,
        parseError,
        rawData: {
          base64: base64Data,
          hex: transactionBuffer.toString('hex'),
          length: transactionBuffer.length
        }
      }

      // 如果解析成功，获取更多详细信息
      if (result.success) {
        await this.analyzeTransaction(result)
      }

      return result
    } catch (error) {
      console.error('解析交易失败:', error)
      return {
        success: false,
        transactionType: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        rawData: {
          base64: base64Data,
          hex: '',
          length: 0
        }
      }
    }
  }

  /**
   * 分析交易详细信息
   * @param parseResult 解析结果
   */
  private async analyzeTransaction(parseResult: any) {
    try {
      if (parseResult.versionedTransaction) {
        const tx = parseResult.versionedTransaction
        
        console.log('\n📋 VersionedTransaction 详细信息:')
        console.log('版本:', tx.version)
        console.log('消息哈希:', tx.message.hash?.toString('hex'))
        
        // 解析消息
        if (tx.message) {
          console.log('消息版本:', tx.message.version)
          console.log('账户数量:', tx.message.staticAccountKeys?.length || 0)
          console.log('指令数量:', tx.message.compiledInstructions?.length || 0)
          
          // 显示账户
          if (tx.message.staticAccountKeys) {
            console.log('\n🏦 涉及的账户:')
            tx.message.staticAccountKeys.forEach((account, index) => {
              console.log(`  ${index}: ${account.toString()}`)
            })
          }
          
          // 显示指令
          if (tx.message.compiledInstructions) {
            console.log('\n📝 指令详情:')
            tx.message.compiledInstructions.forEach((instruction, index) => {
              console.log(`  指令 ${index}:`)
              console.log(`    程序ID索引: ${instruction.programIdIndex}`)
              console.log(`    账户索引: [${instruction.accountKeyIndexes.join(', ')}]`)
              console.log(`    数据长度: ${instruction.data.length} 字节`)
              console.log(`    数据 (hex): ${instruction.data.toString('hex')}`)
            })
          }
        }
        
        // 显示签名
        if (tx.signatures && tx.signatures.length > 0) {
          console.log('\n✍️ 签名信息:')
          tx.signatures.forEach((signature, index) => {
            console.log(`  签名 ${index}: ${signature.toString('base64')}`)
          })
        }
        
      } else if (parseResult.legacyTransaction) {
        const tx = parseResult.legacyTransaction
        
        console.log('\n📋 Legacy Transaction 详细信息:')
        console.log('最近区块哈希:', tx.recentBlockhash)
        console.log('费用支付者:', tx.feePayer?.toString())
        
        // 显示账户
        if (tx.instructions) {
          console.log('\n📝 指令详情:')
          tx.instructions.forEach((instruction, index) => {
            console.log(`  指令 ${index}:`)
            console.log(`    程序ID: ${instruction.programId.toString()}`)
            console.log(`    账户: [${instruction.keys.map(k => k.pubkey.toString()).join(', ')}]`)
            console.log(`    数据长度: ${instruction.data.length} 字节`)
            console.log(`    数据 (hex): ${instruction.data.toString('hex')}`)
          })
        }
        
        // 显示签名
        if (tx.signatures && tx.signatures.length > 0) {
          console.log('\n✍️ 签名信息:')
          tx.signatures.forEach((signature, index) => {
            console.log(`  签名 ${index}: ${signature.toString('base64')}`)
          })
        }
      }
      
    } catch (error) {
      console.error('分析交易详情失败:', error)
    }
  }

  /**
   * 尝试从 RPC 获取交易详情
   * @param signature 交易签名
   */
  async getTransactionDetails(signature: string) {
    try {
      console.log(`\n🔍 从 RPC 获取交易详情: ${signature}`)
      
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      })
      
      if (transaction) {
        console.log('✅ 成功获取交易详情')
        console.log('区块时间:', transaction.blockTime ? new Date(transaction.blockTime * 1000).toISOString() : 'N/A')
        console.log('确认状态:', transaction.meta?.err ? '失败' : '成功')
        console.log('计算单元消耗:', transaction.meta?.fee || 'N/A')
        console.log('账户余额变化:', transaction.meta?.postBalances?.length || 0, '个账户')
        
        if (transaction.meta?.err) {
          console.log('❌ 交易错误:', transaction.meta.err)
        }
      } else {
        console.log('❌ 未找到交易')
      }
      
      return transaction
    } catch (error) {
      console.error('获取交易详情失败:', error)
      return null
    }
  }
}

/**
 * 快速解析 Solana 交易
 * @param base64Data Base64 编码的交易数据
 * @param rpcUrl RPC 端点 URL
 */
export async function parseSolanaTransaction(base64Data: string, rpcUrl?: string) {
  const parser = new SolanaTransactionParser(rpcUrl)
  return await parser.parseTransaction(base64Data)
}

/**
 * 解析交易数据并显示详细信息
 * @param base64Data Base64 编码的交易数据
 */
export async function analyzeSolanaTransaction(base64Data: string) {
  console.log('🔍 开始解析 Solana 交易...')
  console.log('=' .repeat(50))
  
  const parser = new SolanaTransactionParser()
  const result = await parser.parseTransaction(base64Data)
  
  console.log('\n📊 解析结果摘要:')
  console.log('解析成功:', result.success ? '✅' : '❌')
  console.log('交易类型:', result.transactionType)
  console.log('数据长度:', result.rawData.length, '字节')
  
  if (!result.success) {
    console.log('解析错误:', result.parseError || result.error)
  }
  
  console.log('=' .repeat(50))
  
  return result
}
