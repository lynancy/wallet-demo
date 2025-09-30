import { Transaction, VersionedTransaction, PublicKey, SystemProgram } from '@solana/web3.js'

/**
 * Solana 交易详细分析工具
 * @author Cursor AI
 */
export class SolanaTransactionAnalyzer {
  
  /**
   * 分析交易指令类型
   * @param instruction 指令数据
   * @param programId 程序ID
   * @returns 指令分析结果
   */
  static analyzeInstruction(instruction: any, programId: PublicKey) {
    const programIdString = programId.toString()
    
    // System Program (11111111111111111111111111111111)
    if (programIdString === '11111111111111111111111111111111') {
      return this.analyzeSystemProgramInstruction(instruction)
    }
    
    // Compute Budget Program (ComputeBudget111111111111111111111111111111)
    if (programIdString === 'ComputeBudget111111111111111111111111111111') {
      return this.analyzeComputeBudgetInstruction(instruction)
    }
    
    // Token Program
    if (programIdString === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
      return this.analyzeTokenProgramInstruction(instruction)
    }
    
    return {
      type: 'Unknown',
      description: '未知指令类型',
      details: {
        programId: programIdString,
        data: instruction.data.toString('hex')
      }
    }
  }
  
  /**
   * 分析 System Program 指令
   */
  private static analyzeSystemProgramInstruction(instruction: any) {
    const data = instruction.data
    
    if (data.length === 12) {
      // 可能是 Transfer 指令
      const amount = data.readBigUInt64LE(4)
      return {
        type: 'SystemProgram::Transfer',
        description: 'SOL 转账指令',
        details: {
          amount: amount.toString(),
          amountSOL: Number(amount) / 1e9,
          accounts: instruction.accountKeyIndexes
        }
      }
    }
    
    return {
      type: 'SystemProgram::Unknown',
      description: '未知的 System Program 指令',
      details: {
        dataLength: data.length,
        data: data.toString('hex')
      }
    }
  }
  
  /**
   * 分析 Compute Budget Program 指令
   */
  private static analyzeComputeBudgetInstruction(instruction: any) {
    const data = instruction.data
    
    if (data.length === 9) {
      const instructionType = data[0]
      
      if (instructionType === 3) {
        // SetComputeUnitPrice
        const price = data.readBigUInt64LE(1)
        return {
          type: 'ComputeBudget::SetComputeUnitPrice',
          description: '设置计算单元价格',
          details: {
            price: price.toString(),
            priceMicroLamports: Number(price)
          }
        }
      }
    }
    
    if (data.length === 5) {
      const instructionType = data[0]
      
      if (instructionType === 2) {
        // SetComputeUnitLimit
        const limit = data.readUInt32LE(1)
        return {
          type: 'ComputeBudget::SetComputeUnitLimit',
          description: '设置计算单元限制',
          details: {
            limit: limit.toString(),
            limitUnits: limit
          }
        }
      }
    }
    
    return {
      type: 'ComputeBudget::Unknown',
      description: '未知的 Compute Budget 指令',
      details: {
        dataLength: data.length,
        data: data.toString('hex')
      }
    }
  }
  
  /**
   * 分析 Token Program 指令
   */
  private static analyzeTokenProgramInstruction(instruction: any) {
    const data = instruction.data
    
    if (data.length >= 1) {
      const instructionType = data[0]
      
      switch (instructionType) {
        case 3:
          return {
            type: 'TokenProgram::Transfer',
            description: 'SPL Token 转账指令',
            details: {
              accounts: instruction.accountKeyIndexes
            }
          }
        case 7:
          return {
            type: 'TokenProgram::MintTo',
            description: '铸造代币指令',
            details: {
              accounts: instruction.accountKeyIndexes
            }
          }
        case 8:
          return {
            type: 'TokenProgram::Burn',
            description: '销毁代币指令',
            details: {
              accounts: instruction.accountKeyIndexes
            }
          }
        default:
          return {
            type: 'TokenProgram::Unknown',
            description: `未知的 Token Program 指令 (类型: ${instructionType})`,
            details: {
              instructionType,
              accounts: instruction.accountKeyIndexes
            }
          }
      }
    }
    
    return {
      type: 'TokenProgram::Unknown',
      description: '未知的 Token Program 指令',
      details: {
        dataLength: data.length,
        data: data.toString('hex')
      }
    }
  }
  
  /**
   * 分析完整的交易
   */
  static analyzeTransaction(transaction: VersionedTransaction | Transaction) {
    const result = {
      type: transaction instanceof VersionedTransaction ? 'VersionedTransaction' : 'LegacyTransaction',
      instructions: [] as any[],
      accounts: [] as string[],
      summary: {
        totalInstructions: 0,
        systemProgramInstructions: 0,
        computeBudgetInstructions: 0,
        tokenProgramInstructions: 0,
        otherInstructions: 0
      }
    }
    
    if (transaction instanceof VersionedTransaction) {
      const message = transaction.message
      
      // 获取账户
      if (message.staticAccountKeys) {
        result.accounts = message.staticAccountKeys.map(account => account.toString())
      }
      
      // 分析指令
      if (message.compiledInstructions) {
        result.summary.totalInstructions = message.compiledInstructions.length
        
        message.compiledInstructions.forEach((instruction, index) => {
          const programId = message.staticAccountKeys![instruction.programIdIndex]
          const analysis = this.analyzeInstruction(instruction, programId)
          
          result.instructions.push({
            index,
            programId: programId.toString(),
            analysis,
            rawData: instruction.data.toString('hex')
          })
          
          // 统计指令类型
          if (analysis.type.includes('SystemProgram')) {
            result.summary.systemProgramInstructions++
          } else if (analysis.type.includes('ComputeBudget')) {
            result.summary.computeBudgetInstructions++
          } else if (analysis.type.includes('TokenProgram')) {
            result.summary.tokenProgramInstructions++
          } else {
            result.summary.otherInstructions++
          }
        })
      }
    } else {
      // Legacy Transaction
      result.accounts = transaction.instructions.map(inst => inst.programId.toString())
      
      transaction.instructions.forEach((instruction, index) => {
        const analysis = this.analyzeInstruction(instruction, instruction.programId)
        
        result.instructions.push({
          index,
          programId: instruction.programId.toString(),
          analysis,
          rawData: instruction.data.toString('hex')
        })
        
        result.summary.totalInstructions++
        
        if (analysis.type.includes('SystemProgram')) {
          result.summary.systemProgramInstructions++
        } else if (analysis.type.includes('ComputeBudget')) {
          result.summary.computeBudgetInstructions++
        } else if (analysis.type.includes('TokenProgram')) {
          result.summary.tokenProgramInstructions++
        } else {
          result.summary.otherInstructions++
        }
      })
    }
    
    return result
  }
}

// 你提供的交易数据
const transactionData = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEef8bsG2Oerd3idSR7gWJg/Lvu2gTN5caLUG2gxsJEGlGbPJTvMRwld1UJI317U53rDCBd1jsy3CZDKkpRjdycQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAx+btTHk1miczZQviXncjLaxu9sn7xw3JMR45wxTErVwMDAAkDgNHwCAAAAAADAAUC9AEAAAICAAEMAgAAAACUNXcAAAAA"

console.log('🔍 开始详细分析 Solana 交易...')
console.log('=' .repeat(60))

try {
  // 解码并解析交易
  const transactionBuffer = Buffer.from(transactionData, 'base64')
  const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer)
  
  console.log('✅ 成功解析交易')
  console.log('交易类型: VersionedTransaction (Legacy)')
  console.log('版本:', versionedTransaction.version)
  
  // 详细分析
  const analysis = SolanaTransactionAnalyzer.analyzeTransaction(versionedTransaction)
  
  console.log('\n📊 交易摘要:')
  console.log(`总指令数: ${analysis.summary.totalInstructions}`)
  console.log(`System Program 指令: ${analysis.summary.systemProgramInstructions}`)
  console.log(`Compute Budget 指令: ${analysis.summary.computeBudgetInstructions}`)
  console.log(`Token Program 指令: ${analysis.summary.tokenProgramInstructions}`)
  console.log(`其他指令: ${analysis.summary.otherInstructions}`)
  
  console.log('\n🏦 涉及的账户:')
  analysis.accounts.forEach((account, index) => {
    console.log(`  ${index}: ${account}`)
  })
  
  console.log('\n📝 指令详细分析:')
  analysis.instructions.forEach((instruction) => {
    console.log(`\n  指令 ${instruction.index}:`)
    console.log(`    程序ID: ${instruction.programId}`)
    console.log(`    类型: ${instruction.analysis.type}`)
    console.log(`    描述: ${instruction.analysis.description}`)
    console.log(`    详情:`, JSON.stringify(instruction.analysis.details, null, 6))
    console.log(`    原始数据: ${instruction.rawData}`)
  })
  
  // 交易类型判断
  console.log('\n🎯 交易类型判断:')
  if (analysis.summary.systemProgramInstructions > 0) {
    console.log('  💰 这是一个 SOL 转账交易')
  }
  if (analysis.summary.computeBudgetInstructions > 0) {
    console.log('  ⚡ 包含计算预算设置 (优先费用设置)')
  }
  if (analysis.summary.tokenProgramInstructions > 0) {
    console.log('  🪙 包含 SPL Token 操作')
  }
  
  console.log('\n✅ 分析完成!')

} catch (error) {
  console.error('❌ 分析失败:', error)
}
