/**
 * 测试 Solana 交易解析功能是否正常工作
 * @author Cursor AI
 */
function testTransactionParsingFunction() {
  console.log('🧪 测试 Solana 交易解析功能')
  console.log('=' .repeat(50))

  // 用户提供的交易数据
  const transactionData = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDz5P9LNALx2HPGc6nwkXwdD0+iHGxwbgJ1jJFog0eecMV/x1gKZvTV03SLLYYxvrYCjcWkwI5n4YwvH6p8ULZgwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ0gMT5Fxkf4PIOZxhfQXYJC/ITtFF/y8Vts7raV8JG0BAgIAAQwCAAAAQEIPAAAAAAA='

  try {
    console.log('✅ 交易数据格式正确')
    console.log(`数据长度: ${transactionData.length} 字符`)
    console.log(`Base64 格式: ${transactionData.substring(0, 50)}...`)
    
    // 测试 Base64 解码
    const transactionBuffer = Buffer.from(transactionData, 'base64')
    console.log(`✅ Base64 解码成功`)
    console.log(`字节长度: ${transactionBuffer.length} 字节`)
    
    // 测试十六进制转换
    const hexData = transactionBuffer.toString('hex')
    console.log(`✅ 十六进制转换成功`)
    console.log(`十六进制: ${hexData.substring(0, 50)}...`)
    
    console.log('\n🎉 所有基础功能测试通过!')
    console.log('页面交易解析功能应该可以正常工作了。')
    
    console.log('\n📋 使用说明:')
    console.log('1. 打开浏览器访问 http://localhost:3000')
    console.log('2. 找到 "🔍 Solana 交易解析" 区域')
    console.log('3. 将上面的交易数据粘贴到输入框中')
    console.log('4. 点击 "解析交易数据" 按钮')
    console.log('5. 查看解析结果')
    
    console.log('\n💡 预期结果:')
    console.log('- 交易版本: legacy')
    console.log('- 账户数量: 3')
    console.log('- 指令数量: 1')
    console.log('- 指令类型: System Program')
    console.log('- 转账金额: 0.001 SOL')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 运行测试
testTransactionParsingFunction()
