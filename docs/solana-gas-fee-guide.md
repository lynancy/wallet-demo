# Solana Gas Fee 获取方法使用指南

## 概述

本项目已成功集成了 Solana Gas Fee 获取功能，可以实时查询 Solana 网络的 gas 费用信息，并估算 SOL 转账的费用。

## 功能特性

### 1. 实时 Gas Fee 查询
- 获取当前网络的基础交易费用
- 显示网络健康状态
- 支持多个 Solana 网络（主网、测试网、开发网）
- 30秒缓存机制，避免频繁请求

### 2. SOL 转账费用估算
- 输入发送和接收地址
- 输入转账金额
- 自动计算总费用（转账金额 + 手续费）

### 3. 支持的网络
- **Solana Mainnet**: 主网
- **Solana Testnet**: 测试网
- **Solana Devnet**: 开发网
- **Helius RPC**: 公共 RPC 端点
- **Alchemy RPC**: 公共 RPC 端点

## 使用方法

### 1. 基础用法

```typescript
import { getSolanaGasFee, estimateSOLTransferFee } from '../utils/solana/gasFee'

// 获取当前网络的 Gas Fee 信息
const gasFeeInfo = await getSolanaGasFee('mainnet')
console.log('基础费用:', gasFeeInfo.baseFeeSOL, 'SOL')
console.log('网络状态:', gasFeeInfo.networkStatus)

// 估算 SOL 转账费用
const feeInfo = await estimateSOLTransferFee(
  '发送地址',
  '接收地址', 
  1.0, // 转账 1 SOL
  'mainnet'
)
console.log('总费用:', feeInfo.totalCost, 'SOL')
console.log('手续费:', feeInfo.fee, 'SOL')
```

### 2. 高级用法

```typescript
import { createSolanaGasFeeManager, SOLANA_NETWORKS } from '../utils/solana/gasFee'

// 创建管理器实例
const manager = createSolanaGasFeeManager('mainnet')

// 获取 Gas Fee 信息
const gasFeeInfo = await manager.getGasFeeInfo()

// 估算交易费用
const transaction = new Transaction()
// ... 添加指令
const estimatedFee = await manager.estimateTransactionFee(transaction)

// 获取网络状态
const networkStatus = await manager.getNetworkStatus()

// 清除缓存
manager.clearCache()
```

## API 参考

### SolanaGasFeeInfo 接口

```typescript
interface SolanaGasFeeInfo {
  baseFee: number              // 基础交易费用 (lamports)
  baseFeeSOL: number           // 基础交易费用 (SOL)
  perInstructionFee: number    // 每笔指令费用 (lamports)
  perInstructionFeeSOL: number // 每笔指令费用 (SOL)
  estimatedTotalFee: number    // 预估总费用 (lamports)
  estimatedTotalFeeSOL: number // 预估总费用 (SOL)
  networkStatus: 'healthy' | 'degraded' | 'unhealthy' // 网络状态
  lastUpdated: Date            // 最后更新时间
}
```

### 主要函数

#### getSolanaGasFee(network?: string)
获取指定网络的 Gas Fee 信息

**参数:**
- `network` (可选): 网络名称，默认为 'mainnet'

**返回:** `Promise<SolanaGasFeeInfo>`

#### estimateSOLTransferFee(fromAddress, toAddress, amount, network?)
估算 SOL 转账费用

**参数:**
- `fromAddress`: 发送地址
- `toAddress`: 接收地址  
- `amount`: 转账金额 (SOL)
- `network` (可选): 网络名称，默认为 'mainnet'

**返回:** `Promise<{ totalCost: number; fee: number }>`

#### createSolanaGasFeeManager(network?)
创建 Solana Gas Fee 管理器实例

**参数:**
- `network` (可选): 网络名称或自定义网络配置

**返回:** `SolanaGasFeeManager`

## 在页面中的使用

页面中已经集成了完整的 Solana Gas Fee 功能：

1. **网络选择**: 可以选择不同的 Solana 网络
2. **实时查询**: 显示当前网络的 Gas Fee 信息和网络状态
3. **费用估算**: 输入地址和金额，自动计算转账费用
4. **自动刷新**: 组件加载时自动获取 Gas Fee 信息

## 注意事项

1. **网络状态**: 如果网络状态为 'unhealthy'，建议使用其他网络
2. **缓存机制**: Gas Fee 信息有 30 秒缓存，避免频繁请求
3. **错误处理**: 所有函数都包含错误处理，失败时会返回默认值
4. **地址格式**: Solana 地址通常是 32-44 个字符的 Base58 编码字符串

## 示例输出

```
基础费用: 0.00000500 SOL
网络状态: 健康
更新时间: 14:30:25

费用估算结果:
转账金额: 1.0000 SOL
手续费: 0.00000500 SOL
总费用: 1.00000500 SOL
```

## 技术实现

- 使用 `@solana/web3.js` 库连接 Solana 网络
- 实现了缓存机制提高性能
- 包含完整的 TypeScript 类型定义
- 遵循项目的错误处理和日志记录规范
