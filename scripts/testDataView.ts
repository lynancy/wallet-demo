/**
 * 测试 DataView 解析方法
 * @author Cursor AI
 */
function testDataViewParsing() {
  console.log('🔧 测试 DataView 解析方法')
  console.log('=' .repeat(50))

  try {
    // 模拟 instruction.data (Uint8Array) - 0.001 SOL = 1000000 lamports
    const instructionData = new Uint8Array([2, 0, 0, 0, 0, 16, 66, 15, 0, 0, 0, 0])
    
    console.log('📊 测试 DataView 解析 64 位小端序整数:')
    console.log(`原始数据: [${Array.from(instructionData).join(', ')}]`)
    
    // 使用 DataView 解析
    const amountBytes = instructionData.slice(4, 12)
    const dataView = new DataView(amountBytes.buffer, amountBytes.byteOffset, amountBytes.byteLength)
    const amount = dataView.getBigUint64(0, true) // true = little endian
    
    console.log(`DataView 解析结果: ${amount.toString()} lamports`)
    console.log(`转换为 SOL: ${Number(amount) / 1e9} SOL`)
    
    // 验证结果
    const expectedAmount = 1000000n // 0.001 SOL
    if (amount === expectedAmount) {
      console.log('✅ DataView 解析方法工作正常!')
    } else {
      console.log(`❌ 解析结果不匹配: 期望 ${expectedAmount}, 实际 ${amount}`)
      
      // 调试：显示字节详情
      console.log('\n🔍 调试信息:')
      console.log(`amountBytes: [${Array.from(amountBytes).join(', ')}]`)
      console.log(`buffer length: ${amountBytes.buffer.byteLength}`)
      console.log(`byteOffset: ${amountBytes.byteOffset}`)
      console.log(`byteLength: ${amountBytes.byteLength}`)
    }
    
    // 测试 Buffer 方法对比
    console.log('\n📊 对比 Buffer 方法:')
    try {
      const buffer = Buffer.from(amountBytes)
      const bufferResult = buffer.readBigUInt64LE(0)
      console.log(`Buffer 解析结果: ${bufferResult.toString()} lamports`)
      console.log(`Buffer 转换为 SOL: ${Number(bufferResult) / 1e9} SOL`)
      
      if (bufferResult === expectedAmount) {
        console.log('✅ Buffer 方法也工作正常!')
      } else {
        console.log('❌ Buffer 方法也有问题')
      }
    } catch (error) {
      console.log('❌ Buffer 方法不可用:', error.message)
    }
    
    console.log('\n🎉 DataView 方法应该可以在浏览器中正常工作!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testDataViewParsing()
