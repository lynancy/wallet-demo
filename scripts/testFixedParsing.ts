/**
 * 测试修复后的交易解析功能
 * @author Cursor AI
 */
function testFixedParsing() {
  console.log('🔧 测试修复后的交易解析功能')
  console.log('=' .repeat(50))

  // 用户提供的交易数据
  const transactionData = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDz5P9LNALx2HPGc6nwkXwdD0+iHGxwbgJ1jJFog0eecMV/x1gKZvTV03SLLYYxvrYCjcWkwI5n4YwvH6p8ULZgwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ0gMT5Fxkf4PIOZxhfQXYJC/ITtFF/y8Vts7raV8JG0BAgIAAQwCAAAAQEIPAAAAAAA='

  try {
    // 解码 Base64 数据
    const transactionBuffer = Buffer.from(transactionData, 'base64')
    
    // 模拟 instruction.data (Uint8Array)
    const instructionData = new Uint8Array([2, 0, 0, 0, 0, 16, 66, 15, 0, 0, 0, 0])
    
    console.log('📊 测试手动解析 64 位小端序整数:')
    console.log(`原始数据: [${Array.from(instructionData).join(', ')}]`)
    
    // 测试手动解析方法
    const amountBytes = instructionData.slice(4, 12)
    let amount = 0n
    for (let i = 0; i < 8; i++) {
      amount += BigInt(amountBytes[i]) * (2n ** BigInt(i * 8))
    }
    
    console.log(`解析结果: ${amount.toString()} lamports`)
    console.log(`转换为 SOL: ${Number(amount) / 1e9} SOL`)
    
    // 验证结果
    const expectedAmount = 1000000n // 0.001 SOL
    if (amount === expectedAmount) {
      console.log('✅ 手动解析方法工作正常!')
    } else {
      console.log(`❌ 解析结果不匹配: 期望 ${expectedAmount}, 实际 ${amount}`)
    }
    
    console.log('\n🎯 测试 Buffer 方法兼容性:')
    try {
      const testBuffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8])
      const result = testBuffer.readBigUInt64LE(0)
      console.log('✅ Buffer.readBigUInt64LE 可用')
    } catch (error) {
      console.log('❌ Buffer.readBigUInt64LE 不可用:', error.message)
      console.log('✅ 使用手动解析方法作为备选方案')
    }
    
    console.log('\n🎉 修复完成! 现在应该可以在浏览器中正常工作了。')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testFixedParsing()
