import { Connection } from '@solana/web3.js'

/**
 * Solana 优先费用说明和最佳实践
 * @author Cursor AI
 */
async function explainPriorityFee() {
  console.log('📚 Solana 优先费用说明')
  console.log('=' .repeat(60))

  console.log('\n🔍 为什么优先费用是 0？')
  console.log('1. 网络不拥堵: 当前 Solana 网络运行良好，没有交易积压')
  console.log('2. 交易处理快速: 大部分交易都能在基础费用下快速处理')
  console.log('3. 正常现象: 这是健康的网络状态，不是错误')

  console.log('\n💡 优先费用的作用:')
  console.log('• 基础费用 (5000 lamports): 保证交易被处理')
  console.log('• 优先费用: 在网络拥堵时提高交易优先级')
  console.log('• 总费用 = 基础费用 + 优先费用')

  console.log('\n🎯 费用建议策略:')
  console.log('1. 网络不拥堵时 (当前状态):')
  console.log('   - 基础费用: 5000 lamports (0.000005 SOL)')
  console.log('   - 建议优先费用: 1000 lamports (0.000001 SOL)')
  console.log('   - 总费用: 6000 lamports (0.000006 SOL)')

  console.log('\n2. 网络拥堵时:')
  console.log('   - 基础费用: 5000 lamports')
  console.log('   - 优先费用: 根据网络拥堵程度动态调整')
  console.log('   - 总费用: 基础费用 + 动态优先费用')

  console.log('\n3. 紧急交易时:')
  console.log('   - 可以设置更高的优先费用 (如 10000+ lamports)')
  console.log('   - 确保交易优先处理')

  // 测试当前网络状态
  console.log('\n🌐 当前网络状态测试:')
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    
    // 获取网络信息
    const blockhash = await connection.getLatestBlockhash('confirmed')
    console.log(`✅ 网络连接正常`)
    console.log(`最新区块哈希: ${blockhash.blockhash}`)
    
    // 获取费用数据
    const recentFees = await connection.getRecentPrioritizationFees()
    const nonZeroCount = recentFees.filter(fee => fee.prioritizationFee > 0).length
    
    console.log(`费用记录总数: ${recentFees.length}`)
    console.log(`非零费用记录: ${nonZeroCount}`)
    
    if (nonZeroCount === 0) {
      console.log('📊 网络状态: 健康 (无拥堵)')
      console.log('💡 建议: 使用基础费用 + 最小优先费用')
    } else {
      console.log('📊 网络状态: 轻度拥堵')
      console.log('💡 建议: 根据实际费用数据调整')
    }
    
  } catch (error) {
    console.log(`❌ 网络测试失败: ${(error as Error).message}`)
  }

  console.log('\n🛠️ 实际使用建议:')
  console.log('1. 普通转账: 使用 6000 lamports (0.000006 SOL)')
  console.log('2. 重要交易: 使用 10000 lamports (0.00001 SOL)')
  console.log('3. 紧急交易: 使用 50000+ lamports (0.00005+ SOL)')
  
  console.log('\n📈 费用计算示例:')
  const examples = [
    { name: '基础转账', baseFee: 5000, priorityFee: 1000, total: 6000 },
    { name: '重要转账', baseFee: 5000, priorityFee: 5000, total: 10000 },
    { name: '紧急转账', baseFee: 5000, priorityFee: 50000, total: 55000 }
  ]
  
  examples.forEach(example => {
    console.log(`${example.name}: ${example.total} lamports (${example.total / 1e9} SOL)`)
    console.log(`  - 基础费用: ${example.baseFee} lamports`)
    console.log(`  - 优先费用: ${example.priorityFee} lamports`)
  })

  console.log('\n✅ 总结:')
  console.log('• 优先费用为 0 是正常现象，表示网络健康')
  console.log('• 建议始终使用最小优先费用 (1000 lamports)')
  console.log('• 总费用 = 5000 (基础) + 1000 (优先) = 6000 lamports')
  console.log('• 这确保了交易能够快速且可靠地处理')
}

// 运行说明
explainPriorityFee()
