import { Connection } from '@solana/web3.js'

/**
 * 测试真实的 Solana Gas Fee 计算
 * @author Cursor AI
 */
async function testRealGasFee() {
  console.log('🔍 测试真实的 Solana Gas Fee 计算')
  console.log('=' .repeat(50))

  try {
    // 连接到主网
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    
    console.log('📡 连接到 Solana 主网...')
    
    // 获取最近的优先费用
    console.log('\n💰 获取最近的优先费用数据...')
    const recentFees = await connection.getRecentPrioritizationFees()
    
    if (recentFees && recentFees.length > 0) {
      console.log(`找到 ${recentFees.length} 个最近的费用记录`)
      
      // 计算统计信息
      const fees = recentFees.map(fee => fee.prioritizationFee)
      const minFee = Math.min(...fees)
      const maxFee = Math.max(...fees)
      const avgFee = Math.floor(fees.reduce((sum, fee) => sum + fee, 0) / fees.length)
      const medianFee = fees.sort((a, b) => a - b)[Math.floor(fees.length / 2)]
      
      console.log('\n📊 优先费用统计:')
      console.log(`最小费用: ${minFee} micro-lamports`)
      console.log(`最大费用: ${maxFee} micro-lamports`)
      console.log(`平均费用: ${avgFee} micro-lamports`)
      console.log(`中位数费用: ${medianFee} micro-lamports`)
      
      // 转换为 lamports 和 SOL
      const baseFee = 5000 // Solana 基础费用
      const avgFeeLamports = Math.floor(avgFee / 1e6) // micro-lamports 转 lamports
      const totalFee = baseFee + avgFeeLamports
      
      console.log('\n💡 费用计算:')
      console.log(`基础费用: ${baseFee} lamports (${baseFee / 1e9} SOL)`)
      console.log(`平均优先费用: ${avgFeeLamports} lamports (${avgFeeLamports / 1e9} SOL)`)
      console.log(`总费用: ${totalFee} lamports (${totalFee / 1e9} SOL)`)
      
      // 显示一些具体的费用记录
      console.log('\n📋 最近的费用记录 (前10个):')
      recentFees.slice(0, 10).forEach((fee, index) => {
        const feeLamports = Math.floor(fee.prioritizationFee / 1e6)
        const totalFeeLamports = baseFee + feeLamports
        console.log(`  ${index + 1}. ${fee.prioritizationFee} micro-lamports (${feeLamports} lamports) -> 总费用: ${totalFeeLamports} lamports (${totalFeeLamports / 1e9} SOL)`)
      })
      
    } else {
      console.log('❌ 未找到优先费用数据')
    }
    
    // 测试网络状态
    console.log('\n🌐 测试网络状态...')
    try {
      const blockhash = await connection.getLatestBlockhash('confirmed')
      console.log(`✅ 网络状态: 健康`)
      console.log(`最新区块哈希: ${blockhash.blockhash}`)
    } catch (error) {
      console.log(`❌ 网络状态: 异常 - ${error}`)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testRealGasFee()
