import { Transaction, VersionedTransaction } from '@solana/web3.js'

// 你提供的交易数据
const transactionData = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEef8bsG2Oerd3idSR7gWJg/Lvu2gTN5caLUG2gxsJEGlGbPJTvMRwld1UJI317U53rDCBd1jsy3CZDKkpRjdycQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAx+btTHk1miczZQviXncjLaxu9sn7xw3JMR45wxTErVwMDAAkDgNHwCAAAAAADAAUC9AEAAAICAAEMAgAAAACUNXcAAAAA"

console.log('🚀 开始解析 Solana 交易...')
console.log('交易数据长度:', transactionData.length, '字符')
console.log('交易数据预览:', transactionData.substring(0, 50) + '...')

try {
  // 解码 Base64 数据
  const transactionBuffer = Buffer.from(transactionData, 'base64')
  
  console.log('\n📊 原始数据信息:')
  console.log('数据长度:', transactionBuffer.length, '字节')
  console.log('数据 (hex):', transactionBuffer.toString('hex'))
  
  // 尝试解析为 VersionedTransaction (新格式)
  let versionedTransaction: VersionedTransaction | null = null
  let legacyTransaction: Transaction | null = null
  let parseError: string | null = null

  try {
    versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
    console.log('\n✅ 成功解析为 VersionedTransaction')
  } catch (error) {
    console.log('\n❌ 无法解析为 VersionedTransaction:', error)
    parseError = error instanceof Error ? error.message : 'Unknown error'
  }

  // 如果 VersionedTransaction 解析失败，尝试 Legacy Transaction
  if (!versionedTransaction) {
    try {
      legacyTransaction = Transaction.from(transactionBuffer)
      console.log('\n✅ 成功解析为 Legacy Transaction')
    } catch (error) {
      console.log('\n❌ 无法解析为 Legacy Transaction:', error)
      parseError = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 分析解析结果
  if (versionedTransaction) {
    const tx = versionedTransaction
    
    console.log('\n📋 VersionedTransaction 详细信息:')
    console.log('版本:', tx.version)
    console.log('消息哈希:', 'N/A (VersionedMessage 没有 hash 属性)')
    
    // 解析消息
    if (tx.message) {
      console.log('消息版本:', tx.message.version)
      console.log('账户数量:', tx.message.staticAccountKeys?.length || 0)
      console.log('指令数量:', tx.message.compiledInstructions?.length || 0)
      
      // 显示账户
      if (tx.message.staticAccountKeys) {
        console.log('\n🏦 涉及的账户:')
        tx.message.staticAccountKeys.forEach((account, index) => {
          console.log(`  ${index}: ${account.toString()}`)
        })
      }
      
      // 显示指令
      if (tx.message.compiledInstructions) {
        console.log('\n📝 指令详情:')
        tx.message.compiledInstructions.forEach((instruction, index) => {
          console.log(`  指令 ${index}:`)
          console.log(`    程序ID索引: ${instruction.programIdIndex}`)
          console.log(`    账户索引: [${instruction.accountKeyIndexes.join(', ')}]`)
          console.log(`    数据长度: ${instruction.data.length} 字节`)
          console.log(`    数据 (hex): ${Buffer.from(instruction.data).toString('hex')}`)
        })
      }
    }
    
    // 显示签名
    if (tx.signatures && tx.signatures.length > 0) {
      console.log('\n✍️ 签名信息:')
      tx.signatures.forEach((signature, index) => {
        console.log(`  签名 ${index}: ${Buffer.from(signature).toString('base64')}`)
      })
    }
    
  } else if (legacyTransaction) {
    const tx = legacyTransaction
    
    console.log('\n📋 Legacy Transaction 详细信息:')
    console.log('最近区块哈希:', tx.recentBlockhash)
    console.log('费用支付者:', tx.feePayer?.toString())
    
    // 显示账户
    if (tx.instructions) {
      console.log('\n📝 指令详情:')
      tx.instructions.forEach((instruction, index) => {
        console.log(`  指令 ${index}:`)
        console.log(`    程序ID: ${instruction.programId.toString()}`)
        console.log(`    账户: [${instruction.keys.map(k => k.pubkey.toString()).join(', ')}]`)
        console.log(`    数据长度: ${instruction.data.length} 字节`)
        console.log(`    数据 (hex): ${instruction.data.toString('hex')}`)
      })
    }
    
    // 显示签名
    if (tx.signatures && tx.signatures.length > 0) {
      console.log('\n✍️ 签名信息:')
      tx.signatures.forEach((signature, index) => {
        console.log(`  签名 ${index}: ${signature.signature ? Buffer.from(signature.signature).toString('base64') : 'null'}`)
      })
    }
  } else {
    console.log('\n❌ 无法解析交易数据')
    console.log('解析错误:', parseError)
  }

  console.log('\n✅ 解析完成!')

} catch (error) {
  console.error('❌ 解析失败:', error)
}
