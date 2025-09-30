import { Connection } from '@solana/web3.js'

/**
 * 调试 Solana 优先费用问题
 * @author Cursor AI
 */
async function debugPriorityFee() {
  console.log('🔍 调试 Solana 优先费用问题')
  console.log('=' .repeat(60))

  try {
    // 连接到主网
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    
    console.log('📡 连接到 Solana 主网...')
    
    // 获取最近的优先费用
    console.log('\n💰 获取最近的优先费用数据...')
    const recentFees = await connection.getRecentPrioritizationFees()
    
    console.log(`找到 ${recentFees.length} 个费用记录`)
    
    if (recentFees && recentFees.length > 0) {
      // 详细分析费用数据
      console.log('\n📊 费用数据详细分析:')
      
      // 统计费用分布
      const feeStats = {
        zero: 0,
        nonZero: 0,
        total: recentFees.length
      }
      
      const nonZeroFees: number[] = []
      
      recentFees.forEach((fee, index) => {
        if (fee.prioritizationFee === 0) {
          feeStats.zero++
        } else {
          feeStats.nonZero++
          nonZeroFees.push(fee.prioritizationFee)
        }
        
        // 显示前20个记录的详细信息
        if (index < 20) {
          console.log(`  记录 ${index + 1}: ${fee.prioritizationFee} micro-lamports`)
        }
      })
      
      console.log('\n📈 费用统计:')
      console.log(`总记录数: ${feeStats.total}`)
      console.log(`零费用记录: ${feeStats.zero}`)
      console.log(`非零费用记录: ${feeStats.nonZero}`)
      
      if (nonZeroFees.length > 0) {
        console.log('\n💡 非零费用分析:')
        console.log(`非零费用数量: ${nonZeroFees.length}`)
        console.log(`最小非零费用: ${Math.min(...nonZeroFees)} micro-lamports`)
        console.log(`最大非零费用: ${Math.max(...nonZeroFees)} micro-lamports`)
        
        const totalNonZero = nonZeroFees.reduce((sum, fee) => sum + fee, 0)
        const avgNonZero = Math.floor(totalNonZero / nonZeroFees.length)
        console.log(`平均非零费用: ${avgNonZero} micro-lamports`)
        
        // 转换为 lamports
        const avgLamports = Math.floor(avgNonZero / 1e6)
        console.log(`平均费用 (lamports): ${avgLamports}`)
        console.log(`平均费用 (SOL): ${avgLamports / 1e9}`)
        
        // 计算总费用
        const baseFee = 5000
        const totalFee = baseFee + avgLamports
        console.log(`\n🎯 最终费用计算:`)
        console.log(`基础费用: ${baseFee} lamports`)
        console.log(`优先费用: ${avgLamports} lamports`)
        console.log(`总费用: ${totalFee} lamports (${totalFee / 1e9} SOL)`)
        
      } else {
        console.log('\n⚠️ 所有费用都是 0，这可能是以下原因:')
        console.log('1. 网络不拥堵，没有交易使用优先费用')
        console.log('2. RPC 端点返回的数据不完整')
        console.log('3. 网络状态异常')
        
        console.log('\n💡 建议使用的最小优先费用:')
        const suggestedFee = 1000 // 1,000 lamports
        const baseFee = 5000
        const totalFee = baseFee + suggestedFee
        console.log(`建议优先费用: ${suggestedFee} lamports (${suggestedFee / 1e9} SOL)`)
        console.log(`总费用: ${totalFee} lamports (${totalFee / 1e9} SOL)`)
      }
      
      // 尝试不同的 RPC 端点
      console.log('\n🌐 测试不同的 RPC 端点:')
      const rpcEndpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com',
        'https://rpc.ankr.com/solana'
      ]
      
      for (const endpoint of rpcEndpoints) {
        try {
          console.log(`\n测试 ${endpoint}...`)
          const testConnection = new Connection(endpoint, 'confirmed')
          const testFees = await testConnection.getRecentPrioritizationFees()
          
          const nonZeroCount = testFees.filter(fee => fee.prioritizationFee > 0).length
          console.log(`  记录数: ${testFees.length}`)
          console.log(`  非零费用记录: ${nonZeroCount}`)
          
          if (nonZeroCount > 0) {
            const nonZeroFees = testFees.filter(fee => fee.prioritizationFee > 0)
            const avgFee = Math.floor(nonZeroFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) / nonZeroFees.length)
            console.log(`  平均非零费用: ${avgFee} micro-lamports`)
          }
          
        } catch (error) {
          console.log(`  ❌ 连接失败: ${error.message}`)
        }
      }
      
    } else {
      console.log('❌ 未找到任何费用记录')
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error)
  }
}

// 运行调试
debugPriorityFee()
