import { Transaction, VersionedTransaction, PublicKey, SystemProgram } from '@solana/web3.js'

/**
 * Solana 交易手续费详细分析
 * @author Cursor AI
 */
export class SolanaFeeAnalyzer {
  
  /**
   * 分析交易的实际手续费
   */
  static analyzeTransactionFees(transaction: VersionedTransaction | Transaction) {
    const result = {
      baseFee: 5000, // Solana 基础费用 (lamports)
      priorityFee: 0, // 优先费用 (lamports)
      totalFee: 0, // 总费用 (lamports)
      feeBreakdown: {
        baseFeeSOL: 0,
        priorityFeeSOL: 0,
        totalFeeSOL: 0
      },
      instructions: [] as any[]
    }
    
    if (transaction instanceof VersionedTransaction) {
      const message = transaction.message
      
      if (message.compiledInstructions) {
        message.compiledInstructions.forEach((instruction, index) => {
          const programId = message.staticAccountKeys![instruction.programIdIndex]
          const analysis = this.analyzeInstructionForFee(instruction, programId)
          
          result.instructions.push({
            index,
            programId: programId.toString(),
            analysis
          })
          
          // 累加优先费用
          if (analysis.type === 'ComputeBudget::SetComputeUnitPrice') {
            result.priorityFee += analysis.priorityFee || 0
          }
        })
      }
    } else {
      // Legacy Transaction
      transaction.instructions.forEach((instruction, index) => {
        const analysis = this.analyzeInstructionForFee(instruction, instruction.programId)
        
        result.instructions.push({
          index,
          programId: instruction.programId.toString(),
          analysis
        })
        
        if (analysis.type === 'ComputeBudget::SetComputeUnitPrice') {
          result.priorityFee += analysis.priorityFee || 0
        }
      })
    }
    
    // 计算总费用
    result.totalFee = result.baseFee + result.priorityFee
    
    // 转换为 SOL
    result.feeBreakdown.baseFeeSOL = result.baseFee / 1e9
    result.feeBreakdown.priorityFeeSOL = result.priorityFee / 1e9
    result.feeBreakdown.totalFeeSOL = result.totalFee / 1e9
    
    return result
  }
  
  /**
   * 分析指令的费用相关信息
   */
  private static analyzeInstructionForFee(instruction: any, programId: PublicKey) {
    const programIdString = programId.toString()
    const data = instruction.data
    
    // Compute Budget Program
    if (programIdString === 'ComputeBudget111111111111111111111111111111') {
      if (data.length === 9 && data[0] === 3) {
        // SetComputeUnitPrice
        const price = data.readBigUInt64LE(1)
        return {
          type: 'ComputeBudget::SetComputeUnitPrice',
          priorityFee: Number(price), // micro-lamports
          description: '设置计算单元价格'
        }
      }
      
      if (data.length === 5 && data[0] === 2) {
        // SetComputeUnitLimit
        const limit = data.readUInt32LE(1)
        return {
          type: 'ComputeBudget::SetComputeUnitLimit',
          computeUnitLimit: limit,
          description: '设置计算单元限制'
        }
      }
    }
    
    // System Program
    if (programIdString === '11111111111111111111111111111111') {
      return {
        type: 'SystemProgram::Transfer',
        description: 'SOL 转账指令',
        noAdditionalFee: true
      }
    }
    
    return {
      type: 'Unknown',
      description: '未知指令',
      noAdditionalFee: true
    }
  }
  
  /**
   * 计算实际的手续费
   * @param computeUnitPrice 计算单元价格 (micro-lamports)
   * @param computeUnitLimit 计算单元限制
   * @returns 实际手续费
   */
  static calculateActualFee(computeUnitPrice: number, computeUnitLimit: number) {
    const baseFee = 5000 // lamports
    const priorityFee = Math.floor((computeUnitPrice * computeUnitLimit) / 1e6) // 转换为 lamports
    const totalFee = baseFee + priorityFee
    
    return {
      baseFee,
      priorityFee,
      totalFee,
      baseFeeSOL: baseFee / 1e9,
      priorityFeeSOL: priorityFee / 1e9,
      totalFeeSOL: totalFee / 1e9,
      breakdown: {
        computeUnitPriceMicroLamports: computeUnitPrice,
        computeUnitLimit: computeUnitLimit,
        calculation: `(${computeUnitPrice} × ${computeUnitLimit}) ÷ 1,000,000 = ${priorityFee} lamports`
      }
    }
  }
}

// 你提供的交易数据
const transactionData = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEef8bsG2Oerd3idSR7gWJg/Lvu2gTN5caLUG2gxsJEGlGbPJTvMRwld1UJI317U53rDCBd1jsy3CZDKkpRjdycQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAx+btTHk1miczZQviXncjLaxu9sn7xw3JMR45wxTErVwMDAAkDgNHwCAAAAAADAAUC9AEAAAICAAEMAgAAAACUNXcAAAAA"

console.log('💰 开始分析 Solana 交易手续费...')
console.log('=' .repeat(60))

try {
  // 解码并解析交易
  const transactionBuffer = Buffer.from(transactionData, 'base64')
  const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
  
  console.log('✅ 成功解析交易')
  
  // 分析手续费
  const feeAnalysis = SolanaFeeAnalyzer.analyzeTransactionFees(versionedTransaction)
  
  console.log('\n📊 手续费分析结果:')
  console.log(`基础费用: ${feeAnalysis.baseFee} lamports (${feeAnalysis.feeBreakdown.baseFeeSOL.toFixed(9)} SOL)`)
  console.log(`优先费用: ${feeAnalysis.priorityFee} lamports (${feeAnalysis.feeBreakdown.priorityFeeSOL.toFixed(9)} SOL)`)
  console.log(`总费用: ${feeAnalysis.totalFee} lamports (${feeAnalysis.feeBreakdown.totalFeeSOL.toFixed(9)} SOL)`)
  
  console.log('\n📝 指令费用详情:')
  feeAnalysis.instructions.forEach((instruction) => {
    console.log(`\n  指令 ${instruction.index}: ${instruction.analysis.type}`)
    console.log(`    描述: ${instruction.analysis.description}`)
    
    if (instruction.analysis.priorityFee) {
      console.log(`    优先费用: ${instruction.analysis.priorityFee} micro-lamports`)
    }
    
    if (instruction.analysis.computeUnitLimit) {
      console.log(`    计算单元限制: ${instruction.analysis.computeUnitLimit}`)
    }
  })
  
  // 手动计算验证
  console.log('\n🧮 手动计算验证:')
  const computeUnitPrice = 150000000 // micro-lamports
  const computeUnitLimit = 500
  
  const actualFee = SolanaFeeAnalyzer.calculateActualFee(computeUnitPrice, computeUnitLimit)
  
  console.log(`计算单元价格: ${actualFee.breakdown.computeUnitPriceMicroLamports} micro-lamports`)
  console.log(`计算单元限制: ${actualFee.breakdown.computeUnitLimit}`)
  console.log(`计算过程: ${actualFee.breakdown.calculation}`)
  console.log(`\n实际手续费计算:`)
  console.log(`  基础费用: ${actualFee.baseFee} lamports (${actualFee.baseFeeSOL.toFixed(9)} SOL)`)
  console.log(`  优先费用: ${actualFee.priorityFee} lamports (${actualFee.priorityFeeSOL.toFixed(9)} SOL)`)
  console.log(`  总费用: ${actualFee.totalFee} lamports (${actualFee.totalFeeSOL.toFixed(9)} SOL)`)

} catch (error) {
  console.error('❌ 分析失败:', error)
}
