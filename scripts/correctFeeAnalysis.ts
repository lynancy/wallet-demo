import { Transaction, VersionedTransaction, PublicKey, SystemProgram } from '@solana/web3.js'

/**
 * 正确的 Solana 手续费计算
 * @author Cursor AI
 */
export class CorrectSolanaFeeCalculator {
  
  /**
   * 正确计算 Solana 交易手续费
   * @param computeUnitPrice 计算单元价格 (micro-lamports)
   * @param computeUnitLimit 计算单元限制
   * @returns 正确的手续费计算
   */
  static calculateCorrectFee(computeUnitPrice: number, computeUnitLimit: number) {
    const baseFee = 5000 // Solana 基础费用 (lamports)
    
    // 优先费用计算: (计算单元价格 × 计算单元限制) ÷ 1,000,000
    // 因为计算单元价格是以 micro-lamports 为单位
    const priorityFee = Math.floor((computeUnitPrice * computeUnitLimit) / 1e6)
    
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
        calculation: `(${computeUnitPrice} × ${computeUnitLimit}) ÷ 1,000,000 = ${priorityFee} lamports`,
        explanation: '计算单元价格是 micro-lamports，需要除以 1,000,000 转换为 lamports'
      }
    }
  }
  
  /**
   * 分析交易中的实际费用设置
   */
  static analyzeTransactionFees(transaction: VersionedTransaction | Transaction) {
    let computeUnitPrice = 0
    let computeUnitLimit = 0
    
    if (transaction instanceof VersionedTransaction) {
      const message = transaction.message
      
      if (message.compiledInstructions) {
        message.compiledInstructions.forEach((instruction) => {
          const programId = message.staticAccountKeys![instruction.programIdIndex]
          const programIdString = programId.toString()
          const data = instruction.data
          
          // Compute Budget Program
          if (programIdString === 'ComputeBudget111111111111111111111111111111') {
            if (data.length === 9 && data[0] === 3) {
              // SetComputeUnitPrice
              computeUnitPrice = Number(data.readBigUInt64LE(1))
            }
            
            if (data.length === 5 && data[0] === 2) {
              // SetComputeUnitLimit
              computeUnitLimit = data.readUInt32LE(1)
            }
          }
        })
      }
    }
    
    return this.calculateCorrectFee(computeUnitPrice, computeUnitLimit)
  }
}

// 你提供的交易数据
const transactionData = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEef8bsG2Oerd3idSR7gWJg/Lvu2gTN5caLUG2gxsJEGlGbPJTvMRwld1UJI317U53rDCBd1jsy3CZDKkpRjdycQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAx+btTHk1miczZQviXncjLaxu9sn7xw3JMR45wxTErVwMDAAkDgNHwCAAAAAADAAUC9AEAAAICAAEMAgAAAACUNXcAAAAA"

console.log('🔍 重新分析 Solana 交易手续费...')
console.log('=' .repeat(60))

try {
  // 解码并解析交易
  const transactionBuffer = Buffer.from(transactionData, 'base64')
  const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
  
  console.log('✅ 成功解析交易')
  
  // 分析实际费用
  const feeAnalysis = CorrectSolanaFeeCalculator.analyzeTransactionFees(versionedTransaction)
  
  console.log('\n📊 正确的手续费计算:')
  console.log(`基础费用: ${feeAnalysis.baseFee} lamports (${feeAnalysis.baseFeeSOL.toFixed(9)} SOL)`)
  console.log(`优先费用: ${feeAnalysis.priorityFee} lamports (${feeAnalysis.priorityFeeSOL.toFixed(9)} SOL)`)
  console.log(`总费用: ${feeAnalysis.totalFee} lamports (${feeAnalysis.totalFeeSOL.toFixed(9)} SOL)`)
  
  console.log('\n🧮 计算详情:')
  console.log(`计算单元价格: ${feeAnalysis.breakdown.computeUnitPriceMicroLamports} micro-lamports`)
  console.log(`计算单元限制: ${feeAnalysis.breakdown.computeUnitLimit}`)
  console.log(`计算过程: ${feeAnalysis.breakdown.calculation}`)
  console.log(`说明: ${feeAnalysis.breakdown.explanation}`)
  
  // 与常见钱包显示对比
  console.log('\n💡 钱包显示差异分析:')
  console.log('1. 钱包可能显示的是:')
  console.log(`   - 基础费用: ${feeAnalysis.baseFeeSOL.toFixed(6)} SOL`)
  console.log(`   - 优先费用: ${feeAnalysis.priorityFeeSOL.toFixed(6)} SOL`)
  console.log(`   - 总费用: ${feeAnalysis.totalFeeSOL.toFixed(6)} SOL`)
  
  console.log('\n2. 可能的差异原因:')
  console.log('   - 钱包显示精度不同 (可能只显示到小数点后6位)')
  console.log('   - 钱包可能显示的是预估费用而非实际费用')
  console.log('   - 钱包可能包含了其他费用 (如网络费用)')
  console.log('   - 钱包可能显示的是转账金额 + 手续费的总和')
  
  console.log('\n3. 实际转账金额:')
  console.log('   - 转账金额: 2 SOL')
  console.log(`   - 手续费: ${feeAnalysis.totalFeeSOL.toFixed(9)} SOL`)
  console.log(`   - 总支出: ${(2 + feeAnalysis.totalFeeSOL).toFixed(9)} SOL`)
  
  console.log('\n✅ 手续费分析完成!')
  console.log('\n💡 总结:')
  console.log(`这个交易的实际手续费是 ${feeAnalysis.totalFeeSOL.toFixed(9)} SOL`)
  console.log(`其中基础费用 ${feeAnalysis.baseFeeSOL.toFixed(9)} SOL，优先费用 ${feeAnalysis.priorityFeeSOL.toFixed(9)} SOL`)

} catch (error) {
  console.error('❌ 分析失败:', error)
}
