import { Transaction, VersionedTransaction, PublicKey, SystemProgram } from '@solana/web3.js'

/**
 * 深度分析 Solana 交易手续费
 * @author Cursor AI
 */
export class DeepSolanaFeeAnalyzer {
  
  /**
   * 详细解析交易数据
   */
  static deepAnalyzeTransaction(transactionData: string) {
    console.log('🔍 深度分析 Solana 交易...')
    console.log('=' .repeat(60))
    
    // 解码 Base64
    const buffer = Buffer.from(transactionData, 'base64')
    console.log('原始数据长度:', buffer.length, '字节')
    console.log('原始数据 (hex):', buffer.toString('hex'))
    
    // 解析为 VersionedTransaction
    const tx = VersionedTransaction.deserialize(buffer)
    console.log('交易版本:', tx.version)
    
    const message = tx.message
    console.log('消息版本:', message.version)
    
    // 详细分析每个字节
    console.log('\n📊 字节级分析:')
    console.log('前32字节 (签名):', buffer.subarray(0, 32).toString('hex'))
    console.log('接下来32字节:', buffer.subarray(32, 64).toString('hex'))
    console.log('接下来32字节:', buffer.subarray(64, 96).toString('hex'))
    
    // 分析指令数据
    if (message.compiledInstructions) {
      console.log('\n📝 指令详细分析:')
      
      message.compiledInstructions.forEach((instruction, index) => {
        const programId = message.staticAccountKeys![instruction.programIdIndex]
        const programIdString = programId.toString()
        const data = instruction.data
        
        console.log(`\n指令 ${index}:`)
        console.log(`  程序ID: ${programIdString}`)
        console.log(`  程序ID索引: ${instruction.programIdIndex}`)
        console.log(`  账户索引: [${instruction.accountKeyIndexes.join(', ')}]`)
        console.log(`  数据长度: ${data.length} 字节`)
        console.log(`  数据 (hex): ${data.toString('hex')}`)
        console.log(`  数据 (bytes): [${Array.from(data).join(', ')}]`)
        
        // 详细解析 Compute Budget 指令
        if (programIdString === 'ComputeBudget111111111111111111111111111111') {
          this.analyzeComputeBudgetInstruction(data, index)
        }
        
        // 详细解析 System Program 指令
        if (programIdString === '11111111111111111111111111111111') {
          this.analyzeSystemProgramInstruction(data, index)
        }
      })
    }
    
    // 分析账户
    console.log('\n🏦 账户分析:')
    if (message.staticAccountKeys) {
      message.staticAccountKeys.forEach((account, index) => {
        console.log(`  账户 ${index}: ${account.toString()}`)
      })
    }
    
    // 分析签名
    console.log('\n✍️ 签名分析:')
    if (tx.signatures) {
      tx.signatures.forEach((signature, index) => {
        console.log(`  签名 ${index}: ${signature.toString('base64')}`)
        console.log(`  签名 (hex): ${signature.toString('hex')}`)
        console.log(`  签名长度: ${signature.length} 字节`)
      })
    }
    
    return tx
  }
  
  /**
   * 分析 Compute Budget 指令
   */
  private static analyzeComputeBudgetInstruction(data: Buffer, index: number) {
    console.log(`\n  🔧 Compute Budget 指令 ${index} 详细分析:`)
    
    if (data.length === 9) {
      const instructionType = data[0]
      console.log(`    指令类型: ${instructionType}`)
      
      if (instructionType === 3) {
        // SetComputeUnitPrice
        const price = data.readBigUInt64LE(1)
        console.log(`    功能: SetComputeUnitPrice`)
        console.log(`    价格 (BigInt): ${price}`)
        console.log(`    价格 (Number): ${Number(price)}`)
        console.log(`    价格 (micro-lamports): ${Number(price)}`)
        console.log(`    价格 (lamports): ${Number(price) / 1e6}`)
        console.log(`    价格 (SOL): ${Number(price) / 1e15}`)
        
        // 验证字节读取
        console.log(`    字节验证:`)
        console.log(`      字节 1-8: [${Array.from(data.subarray(1, 9)).join(', ')}]`)
        console.log(`      小端序读取: ${data.readUInt32LE(1)} (低32位) + ${data.readUInt32LE(5)} (高32位)`)
      }
    }
    
    if (data.length === 5) {
      const instructionType = data[0]
      console.log(`    指令类型: ${instructionType}`)
      
      if (instructionType === 2) {
        // SetComputeUnitLimit
        const limit = data.readUInt32LE(1)
        console.log(`    功能: SetComputeUnitLimit`)
        console.log(`    限制: ${limit}`)
        console.log(`    字节验证: [${Array.from(data.subarray(1, 5)).join(', ')}]`)
      }
    }
  }
  
  /**
   * 分析 System Program 指令
   */
  private static analyzeSystemProgramInstruction(data: Buffer, index: number) {
    console.log(`\n  💰 System Program 指令 ${index} 详细分析:`)
    
    if (data.length === 12) {
      const instructionType = data[0]
      console.log(`    指令类型: ${instructionType}`)
      
      if (instructionType === 2) {
        // Transfer
        const amount = data.readBigUInt64LE(4)
        console.log(`    功能: Transfer`)
        console.log(`    金额 (BigInt): ${amount}`)
        console.log(`    金额 (Number): ${Number(amount)}`)
        console.log(`    金额 (lamports): ${Number(amount)}`)
        console.log(`    金额 (SOL): ${Number(amount) / 1e9}`)
        
        // 验证字节读取
        console.log(`    字节验证:`)
        console.log(`      字节 4-11: [${Array.from(data.subarray(4, 12)).join(', ')}]`)
        console.log(`      小端序读取: ${data.readUInt32LE(4)} (低32位) + ${data.readUInt32LE(8)} (高32位)`)
      }
    }
  }
  
  /**
   * 计算实际手续费
   */
  static calculateActualFee(transactionData: string) {
    const tx = this.deepAnalyzeTransaction(transactionData)
    
    console.log('\n💰 手续费计算:')
    
    let computeUnitPrice = 0
    let computeUnitLimit = 0
    
    const message = tx.message
    if (message.compiledInstructions) {
      message.compiledInstructions.forEach((instruction) => {
        const programId = message.staticAccountKeys![instruction.programIdIndex]
        const programIdString = programId.toString()
        const data = instruction.data
        
        if (programIdString === 'ComputeBudget111111111111111111111111111111') {
          if (data.length === 9 && data[0] === 3) {
            computeUnitPrice = Number(data.readBigUInt64LE(1))
          }
          if (data.length === 5 && data[0] === 2) {
            computeUnitLimit = data.readUInt32LE(1)
          }
        }
      })
    }
    
    console.log(`计算单元价格: ${computeUnitPrice} micro-lamports`)
    console.log(`计算单元限制: ${computeUnitLimit}`)
    
    const baseFee = 5000 // lamports
    const priorityFee = Math.floor((computeUnitPrice * computeUnitLimit) / 1e6) // 转换为 lamports
    const totalFee = baseFee + priorityFee
    
    console.log(`\n费用计算:`)
    console.log(`基础费用: ${baseFee} lamports`)
    console.log(`优先费用: (${computeUnitPrice} × ${computeUnitLimit}) ÷ 1,000,000 = ${priorityFee} lamports`)
    console.log(`总费用: ${totalFee} lamports`)
    console.log(`总费用 (SOL): ${totalFee / 1e9}`)
    
    return {
      baseFee,
      priorityFee,
      totalFee,
      totalFeeSOL: totalFee / 1e9,
      computeUnitPrice,
      computeUnitLimit
    }
  }
}

// 你提供的交易数据
const transactionData = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEef8bsG2Oerd3idSR7gWJg/Lvu2gTN5caLUG2gxsJEGlGbPJTvMRwld1UJI317U53rDCBd1jsy3CZDKkpRjdycQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAx+btTHk1miczZQviXncjLaxu9sn7xw3JMR45wxTErVwMDAAkDgNHwCAAAAAADAAUC9AEAAAICAAEMAgAAAACUNXcAAAAA"

console.log('🚀 开始深度分析...')

try {
  const result = DeepSolanaFeeAnalyzer.calculateActualFee(transactionData)
  
  console.log('\n✅ 分析完成!')
  console.log('\n📋 最终结果:')
  console.log(`实际手续费: ${result.totalFeeSOL.toFixed(9)} SOL`)
  console.log(`基础费用: ${result.baseFee / 1e9} SOL`)
  console.log(`优先费用: ${result.priorityFee / 1e9} SOL`)
  
} catch (error) {
  console.error('❌ 分析失败:', error)
}
