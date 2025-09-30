import { VersionedTransaction } from '@solana/web3.js'

/**
 * 测试 Solana 交易解析功能
 * @author Cursor AI
 */
async function testTransactionParsing() {
  console.log('🔍 测试 Solana 交易解析功能')
  console.log('=' .repeat(50))

  // 用户提供的交易数据
  const transactionData = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDz5P9LNALx2HPGc6nwkXwdD0+iHGxwbgJ1jJFog0eecMV/x1gKZvTV03SLLYYxvrYCjcWkwI5n4YwvH6p8ULZgwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ0gMT5Fxkf4PIOZxhfQXYJC/ITtFF/y8Vts7raV8JG0BAgIAAQwCAAAAQEIPAAAAAAA='

  try {
    console.log('📊 交易数据信息:')
    console.log(`数据长度: ${transactionData.length} 字符`)
    console.log(`Base64 格式: ${transactionData.substring(0, 50)}...`)
    
    // 解码 Base64 数据
    const transactionBuffer = Buffer.from(transactionData, 'base64')
    console.log(`\n🔢 解码后信息:`)
    console.log(`字节长度: ${transactionBuffer.length} 字节`)
    console.log(`十六进制: ${transactionBuffer.toString('hex').substring(0, 100)}...`)
    
    // 解析为 VersionedTransaction
    console.log('\n🔍 解析交易结构...')
    const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
    
    const message = versionedTransaction.message
    
    console.log('\n📋 交易基本信息:')
    console.log(`交易版本: ${versionedTransaction.version}`)
    console.log(`消息版本: ${message.version}`)
    console.log(`账户数量: ${message.staticAccountKeys?.length || 0}`)
    console.log(`指令数量: ${message.compiledInstructions?.length || 0}`)
    console.log(`签名数量: ${versionedTransaction.signatures?.length || 0}`)
    
    // 显示账户信息
    if (message.staticAccountKeys && message.staticAccountKeys.length > 0) {
      console.log('\n👥 涉及的账户:')
      message.staticAccountKeys.forEach((account, index) => {
        console.log(`  ${index}: ${account.toString()}`)
      })
    }
    
    // 显示指令信息
    if (message.compiledInstructions && message.compiledInstructions.length > 0) {
      console.log('\n📝 指令详情:')
      message.compiledInstructions.forEach((instruction, index) => {
        const programId = message.staticAccountKeys![instruction.programIdIndex]
        console.log(`  指令 ${index}:`)
        console.log(`    程序ID: ${programId.toString()}`)
        console.log(`    程序ID索引: ${instruction.programIdIndex}`)
        console.log(`    账户索引: [${instruction.accountKeyIndexes.join(', ')}]`)
        console.log(`    数据长度: ${instruction.data.length} 字节`)
        console.log(`    数据: ${instruction.data.toString('hex')}`)
      })
    }
    
    // 显示签名信息
    if (versionedTransaction.signatures && versionedTransaction.signatures.length > 0) {
      console.log('\n✍️ 签名信息:')
      versionedTransaction.signatures.forEach((sig, index) => {
        const isEmpty = sig.every(byte => byte === 0)
        console.log(`  签名 ${index}: ${isEmpty ? '空签名' : '已签名'}`)
        if (!isEmpty) {
          console.log(`    签名值: ${sig.toString('base64')}`)
        }
      })
    }
    
    // 分析指令类型
    console.log('\n🔍 指令类型分析:')
    if (message.compiledInstructions) {
      message.compiledInstructions.forEach((instruction, index) => {
        const programId = message.staticAccountKeys![instruction.programIdIndex]
        const programIdStr = programId.toString()
        
        let instructionType = '未知指令'
        if (programIdStr === '11111111111111111111111111111111') {
          instructionType = 'System Program'
        } else if (programIdStr === 'ComputeBudget111111111111111111111111111111') {
          instructionType = 'Compute Budget Program'
        } else if (programIdStr === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          instructionType = 'Token Program'
        }
        
        console.log(`  指令 ${index}: ${instructionType} (${programIdStr})`)
        
        // 如果是 System Program，尝试解析转账指令
        if (instructionType === 'System Program' && instruction.data.length >= 4) {
          const instructionTypeBytes = instruction.data.slice(0, 4)
          const instructionTypeNum = instructionTypeBytes.readUInt32LE(0)
          
          if (instructionTypeNum === 2) {
            console.log(`    -> SOL 转账指令`)
            if (instruction.data.length >= 12) {
              const amount = instruction.data.readBigUInt64LE(4)
              console.log(`    -> 转账金额: ${amount.toString()} lamports (${Number(amount) / 1e9} SOL)`)
            }
          }
        }
        
        // 如果是 Compute Budget Program
        if (instructionType === 'Compute Budget Program') {
          if (instruction.data.length >= 4) {
            const instructionTypeBytes = instruction.data.slice(0, 4)
            const instructionTypeNum = instructionTypeBytes.readUInt32LE(0)
            
            if (instructionTypeNum === 3) {
              console.log(`    -> 设置计算单元价格`)
              if (instruction.data.length >= 8) {
                const price = instruction.data.readBigUInt64LE(4)
                console.log(`    -> 价格: ${price.toString()} micro-lamports`)
              }
            } else if (instructionTypeNum === 2) {
              console.log(`    -> 设置计算单元限制`)
              if (instruction.data.length >= 8) {
                const limit = instruction.data.readBigUInt64LE(4)
                console.log(`    -> 限制: ${limit.toString()} 计算单元`)
              }
            }
          }
        }
      })
    }
    
    console.log('\n✅ 交易解析完成!')
    
  } catch (error) {
    console.error('❌ 解析失败:', error)
  }
}

// 运行测试
testTransactionParsing()
