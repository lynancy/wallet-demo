import { VersionedTransaction } from '@solana/web3.js'

/**
 * 测试页面交易解析功能
 * @author Cursor AI
 */
function testPageTransactionParsing() {
  console.log('🧪 测试页面交易解析功能')
  console.log('=' .repeat(50))

  // 用户提供的交易数据
  const transactionData = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDz5P9LNALx2HPGc6nwkXwdD0+iHGxwbgJ1jJFog0eecMV/x1gKZvTV03SLLYYxvrYCjcWkwI5n4YwvH6p8ULZgwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZ0gMT5Fxkf4PIOZxhfQXYJC/ITtFF/y8Vts7raV8JG0BAgIAAQwCAAAAQEIPAAAAAAA='

  try {
    // 解码 Base64 数据
    const transactionBuffer = Buffer.from(transactionData, 'base64')
    
    // 解析为 VersionedTransaction
    const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
    const message = versionedTransaction.message
    
    // 解析交易信息 (模拟页面逻辑)
    const parsedData = {
      version: versionedTransaction.version,
      messageVersion: message.version,
      accounts: message.staticAccountKeys?.map(account => account.toString()) || [],
      instructions: message.compiledInstructions?.map((instruction, index) => {
        const programId = message.staticAccountKeys![instruction.programIdIndex]
        const programIdStr = programId.toString()
        
        // 识别程序类型
        let programType = '未知程序'
        if (programIdStr === '11111111111111111111111111111111') {
          programType = 'System Program'
        } else if (programIdStr === 'ComputeBudget111111111111111111111111111111') {
          programType = 'Compute Budget Program'
        } else if (programIdStr === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          programType = 'Token Program'
        }
        
        // 解析指令详情
        let instructionDetails = {}
        if (programType === 'System Program' && instruction.data.length >= 4) {
          const instructionTypeBytes = instruction.data.slice(0, 4)
          const instructionTypeNum = instructionTypeBytes.readUInt32LE(0)
          
          if (instructionTypeNum === 2) {
            instructionDetails = {
              type: 'SOL 转账',
              amount: instruction.data.length >= 12 ? instruction.data.readBigUInt64LE(4).toString() : '0',
              amountSOL: instruction.data.length >= 12 ? Number(instruction.data.readBigUInt64LE(4)) / 1e9 : 0
            }
          }
        } else if (programType === 'Compute Budget Program') {
          if (instruction.data.length >= 4) {
            const instructionTypeBytes = instruction.data.slice(0, 4)
            const instructionTypeNum = instructionTypeBytes.readUInt32LE(0)
            
            if (instructionTypeNum === 3) {
              instructionDetails = {
                type: '设置计算单元价格',
                price: instruction.data.length >= 8 ? instruction.data.readBigUInt64LE(4).toString() : '0'
              }
            } else if (instructionTypeNum === 2) {
              instructionDetails = {
                type: '设置计算单元限制',
                limit: instruction.data.length >= 8 ? instruction.data.readBigUInt64LE(4).toString() : '0'
              }
            }
          }
        }
        
        return {
          index,
          programId: programIdStr,
          programType,
          programIdIndex: instruction.programIdIndex,
          accountIndexes: instruction.accountKeyIndexes,
          dataLength: instruction.data.length,
          data: instruction.data.toString('hex'),
          details: instructionDetails
        }
      }) || [],
      signatures: versionedTransaction.signatures?.map((sig, index) => ({
        index,
        signature: sig.toString('base64'),
        isEmpty: sig.every(byte => byte === 0)
      })) || [],
      rawData: {
        base64: transactionData,
        hex: transactionBuffer.toString('hex'),
        length: transactionBuffer.length
      }
    }

    console.log('✅ 页面解析逻辑测试成功!')
    console.log('\n📊 解析结果摘要:')
    console.log(`交易版本: ${parsedData.version}`)
    console.log(`账户数量: ${parsedData.accounts.length}`)
    console.log(`指令数量: ${parsedData.instructions.length}`)
    console.log(`签名数量: ${parsedData.signatures.length}`)
    
    console.log('\n📝 指令详情:')
    parsedData.instructions.forEach((instruction) => {
      console.log(`  指令 ${instruction.index}: ${instruction.programType}`)
      if (instruction.details && Object.keys(instruction.details).length > 0) {
        console.log(`    类型: ${instruction.details.type}`)
        if (instruction.details.type === 'SOL 转账') {
          console.log(`    金额: ${instruction.details.amountSOL} SOL`)
        }
      }
    })
    
    console.log('\n👥 账户列表:')
    parsedData.accounts.forEach((account, index) => {
      console.log(`  ${index}: ${account}`)
    })
    
    console.log('\n✍️ 签名状态:')
    parsedData.signatures.forEach((sig) => {
      console.log(`  签名 ${sig.index}: ${sig.isEmpty ? '空签名' : '已签名'}`)
    })
    
    return parsedData
    
  } catch (error) {
    console.error('❌ 页面解析逻辑测试失败:', error)
    return null
  }
}

// 运行测试
const result = testPageTransactionParsing()

if (result) {
  console.log('\n🎉 页面交易解析功能准备就绪!')
  console.log('现在可以在浏览器中测试这个功能了。')
}
