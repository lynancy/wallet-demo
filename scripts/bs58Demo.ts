import bs58 from 'bs58'
import { PublicKey } from '@solana/web3.js'

/**
 * bs58 库使用示例和说明
 * @author Cursor AI
 */
export class BS58Example {
  
  /**
   * 演示 bs58 的基本用法
   */
  static demonstrateBasicUsage() {
    console.log('🔍 bs58 库基本用法演示')
    console.log('=' .repeat(50))
    
    // 1. 基本编码/解码
    const originalData = Buffer.from('Hello, Solana!', 'utf8')
    console.log('原始数据:', Buffer.from(originalData).toString('hex'))
    
    const encoded = bs58.encode(originalData)
    console.log('Base58 编码:', encoded)
    
    const decoded = bs58.decode(encoded)
    console.log('Base58 解码:', Buffer.from(decoded).toString('hex'))
    console.log('解码后文本:', Buffer.from(decoded).toString('utf8'))
    
    console.log('\n✅ 编码/解码验证:', Buffer.compare(originalData, decoded) === 0)
  }
  
  /**
   * Solana 地址编码示例
   */
  static demonstrateSolanaAddress() {
    console.log('\n🟣 Solana 地址编码示例')
    console.log('=' .repeat(50))
    
    // 创建一个 Solana 公钥
    const publicKey = new PublicKey('9DDx85W462zPiqqKhQ3X3v7E65DqurwcusfG3QY5f2Xi')
    console.log('Solana 公钥:', publicKey.toString())
    console.log('公钥字节长度:', publicKey.toBytes().length)
    console.log('公钥字节 (hex):', Buffer.from(publicKey.toBytes()).toString('hex'))
    
    // 手动使用 bs58 编码
    const manualEncoded = bs58.encode(publicKey.toBytes())
    console.log('手动 bs58 编码:', manualEncoded)
    console.log('与 PublicKey.toString() 相同:', manualEncoded === publicKey.toString())
    
    // 手动解码
    const manualDecoded = bs58.decode(publicKey.toString())
    console.log('手动 bs58 解码:', Buffer.from(manualDecoded).toString('hex'))
    console.log('解码验证:', Buffer.compare(publicKey.toBytes(), manualDecoded) === 0)
  }
  
  /**
   * 交易签名编码示例
   */
  static demonstrateSignature() {
    console.log('\n✍️ 交易签名编码示例')
    console.log('=' .repeat(50))
    
    // 模拟一个 64 字节的签名
    const signatureBytes = Buffer.alloc(64)
    signatureBytes.write('This is a mock signature for demonstration purposes only', 0)
    
    console.log('签名字节长度:', signatureBytes.length)
    console.log('签名字节 (hex):', Buffer.from(signatureBytes).toString('hex'))
    
    // 编码签名
    const encodedSignature = bs58.encode(signatureBytes)
    console.log('Base58 编码签名:', encodedSignature)
    console.log('编码后长度:', encodedSignature.length)
    
    // 解码签名
    const decodedSignature = bs58.decode(encodedSignature)
    console.log('解码验证:', Buffer.compare(signatureBytes, decodedSignature) === 0)
  }
  
  /**
   * 数据压缩对比
   */
  static demonstrateCompression() {
    console.log('\n📊 数据压缩对比')
    console.log('=' .repeat(50))
    
    const data = Buffer.from('This is some test data for compression comparison', 'utf8')
    
    // Base64 编码
    const base64Encoded = data.toString('base64')
    
    // Base58 编码
    const base58Encoded = bs58.encode(data)
    
    // Hex 编码
    const hexEncoded = Buffer.from(data).toString('hex')
    
    console.log('原始数据长度:', data.length, '字节')
    console.log('Base64 编码长度:', base64Encoded.length, '字符')
    console.log('Base58 编码长度:', base58Encoded.length, '字符')
    console.log('Hex 编码长度:', hexEncoded.length, '字符')
    
    console.log('\n编码结果:')
    console.log('Base64:', base64Encoded)
    console.log('Base58:', base58Encoded)
    console.log('Hex   :', hexEncoded)
    
    // 计算压缩率
    const base64Ratio = (base64Encoded.length / data.length).toFixed(2)
    const base58Ratio = (base58Encoded.length / data.length).toFixed(2)
    const hexRatio = (hexEncoded.length / data.length).toFixed(2)
    
    console.log('\n压缩率 (字符/字节):')
    console.log(`Base64: ${base64Ratio}x`)
    console.log(`Base58: ${base58Ratio}x`)
    console.log(`Hex   : ${hexRatio}x`)
  }
  
  /**
   * 错误处理示例
   */
  static demonstrateErrorHandling() {
    console.log('\n⚠️ 错误处理示例')
    console.log('=' .repeat(50))
    
    try {
      // 尝试解码无效的 Base58 字符串
      const invalidBase58 = 'This is not valid base58!'
      bs58.decode(invalidBase58)
    } catch (error) {
      console.log('捕获到解码错误:', error.message)
    }
    
    try {
      // 尝试解码包含无效字符的字符串
      const invalidChars = '0OIl' // 这些字符不在 Base58 字符集中
      bs58.decode(invalidChars)
    } catch (error) {
      console.log('捕获到字符错误:', error.message)
    }
  }
  
  /**
   * 实际应用场景
   */
  static demonstrateRealWorldUsage() {
    console.log('\n🌍 实际应用场景')
    console.log('=' .repeat(50))
    
    console.log('1. 区块链地址编码:')
    console.log('   - Bitcoin 地址: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
    console.log('   - Solana 地址: 9DDx85W462zPiqqKhQ3X3v7E65DqurwcusfG3QY5f2Xi')
    
    console.log('\n2. 交易签名:')
    console.log('   - 每个交易都有 64 字节的签名')
    console.log('   - 使用 Base58 编码便于传输和存储')
    
    console.log('\n3. IPFS 内容哈希:')
    console.log('   - QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')
    
    console.log('\n4. 为什么选择 Base58:')
    console.log('   ✅ 避免视觉混淆 (0OIl)')
    console.log('   ✅ 比十六进制更紧凑')
    console.log('   ✅ 人类友好的格式')
    console.log('   ✅ 区块链标准')
  }
}

// 运行所有示例
console.log('🚀 开始 bs58 库演示...')

try {
  BS58Example.demonstrateBasicUsage()
  BS58Example.demonstrateSolanaAddress()
  BS58Example.demonstrateSignature()
  BS58Example.demonstrateCompression()
  BS58Example.demonstrateErrorHandling()
  BS58Example.demonstrateRealWorldUsage()
  
  console.log('\n✅ bs58 库演示完成!')
  
} catch (error) {
  console.error('❌ 演示失败:', error)
}
