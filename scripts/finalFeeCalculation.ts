import { Transaction, VersionedTransaction, PublicKey, SystemProgram } from '@solana/web3.js'

/**
 * 最终正确的手续费计算
 * @author Cursor AI
 */
export class FinalFeeCalculator {
  
  /**
   * 正确计算 Solana 优先费用
   * 关键：micro-lamports 到 lamports 的转换
   */
  static calculatePriorityFee(computeUnitPrice: number, computeUnitLimit: number) {
    console.log('🧮 优先费用计算详解:')
    console.log(`计算单元价格: ${computeUnitPrice} micro-lamports`)
    console.log(`计算单元限制: ${computeUnitLimit}`)
    
    // 重要：micro-lamports 到 lamports 的转换
    // 1 micro-lamport = 0.000001 lamport
    // 所以需要除以 1,000,000
    const priorityFeeLamports = Math.floor((computeUnitPrice * computeUnitLimit) / 1e6)
    
    console.log(`计算过程: (${computeUnitPrice} × ${computeUnitLimit}) ÷ 1,000,000`)
    console.log(`= ${computeUnitPrice * computeUnitLimit} ÷ 1,000,000`)
    console.log(`= ${priorityFeeLamports} lamports`)
    
    return priorityFeeLamports
  }
  
  /**
   * 完整的手续费分析
   */
  static analyzeCompleteFee(transactionData: string) {
    console.log('🔍 完整手续费分析')
    console.log('=' .repeat(50))
    
    const buffer = Buffer.from(transactionData, 'base64')
    const tx = VersionedTransaction.deserialize(buffer)
    const message = tx.message
    
    let computeUnitPrice = 0
    let computeUnitLimit = 0
    
    // 提取计算预算参数
    if (message.compiledInstructions) {
      message.compiledInstructions.forEach((instruction) => {
        const programId = message.staticAccountKeys![instruction.programIdIndex]
        const programIdString = programId.toString()
        const data = instruction.data
        
        if (programIdString === 'ComputeBudget111111111111111111111111111111') {
          if (data.length === 9 && data[0] === 3) {
            computeUnitPrice = Number(Buffer.from(data.slice(1, 9)).readBigUInt64LE(0))
            console.log(`✅ 找到计算单元价格: ${computeUnitPrice} micro-lamports`)
          }
          if (data.length === 5 && data[0] === 2) {
            computeUnitLimit = Buffer.from(data.slice(1, 5)).readUInt32LE(0)
            console.log(`✅ 找到计算单元限制: ${computeUnitLimit}`)
          }
        }
      })
    }
    
    // 计算费用
    const baseFee = 5000 // Solana 基础费用
    const priorityFee = this.calculatePriorityFee(computeUnitPrice, computeUnitLimit)
    const totalFee = baseFee + priorityFee
    
    console.log('\n💰 费用汇总:')
    console.log(`基础费用: ${baseFee} lamports (${baseFee / 1e9} SOL)`)
    console.log(`优先费用: ${priorityFee} lamports (${priorityFee / 1e9} SOL)`)
    console.log(`总费用: ${totalFee} lamports (${totalFee / 1e9} SOL)`)
    
    // 验证计算
    console.log('\n🔍 验证计算:')
    console.log(`150,000,000 micro-lamports = ${150000000 / 1e6} lamports`)
    console.log(`500 计算单元 × ${150000000 / 1e6} lamports/单元 = ${500 * (150000000 / 1e6)} lamports`)
    
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

console.log('🚀 最终手续费计算...')

try {
  const result = FinalFeeCalculator.analyzeCompleteFee(transactionData)
  
  console.log('\n✅ 最终结果:')
  console.log(`实际手续费: ${result.totalFeeSOL.toFixed(9)} SOL`)
  console.log(`基础费用: ${(result.baseFee / 1e9).toFixed(9)} SOL`)
  console.log(`优先费用: ${(result.priorityFee / 1e9).toFixed(9)} SOL`)
  
  console.log('\n💡 钱包显示差异的可能原因:')
  console.log('1. 钱包可能显示的是不同的费用计算方式')
  console.log('2. 钱包可能包含了额外的网络费用')
  console.log('3. 钱包可能显示的是转账金额 + 手续费的总和')
  console.log('4. 钱包的显示精度可能不同')
  
  console.log('\n🎯 建议:')
  console.log('请检查钱包中显示的具体费用项目，看看是否包含:')
  console.log('- 基础交易费用')
  console.log('- 优先费用')
  console.log('- 网络费用')
  console.log('- 转账金额')
  
} catch (error) {
  console.error('❌ 计算失败:', error)
}
