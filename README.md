# Gnosis Pay UI

User interface for Gnosis Pay.

## 快速开始

### 本地开发（localhost）

```bash
# 安装依赖
pnpm install

# 启动前端
pnpm dev

# 新终端启动后端
cd pse-backend-demo && npm run dev
```

访问: `http://localhost:5174`

### 网络访问（通过 IP）

如需通过局域网 IP 访问（如：`http://192.168.2.208:5174`）：

```bash
# 启动前端并暴露网络接口
pnpm dev -- --host

# 后端保持正常启动（已自动监听所有接口）
cd pse-backend-demo && npm run dev
```

**重要配置**：
- 前端环境变量中已配置后端 IP：`.env` 文件中 `VITE_GNOSIS_PAY_API_BASE_URL=http://192.168.2.208:8082/`
- 后端 CORS 已配置允许 `192.168.2.208` 的请求

访问: `http://192.168.2.208:5174`

## 业务流程

### 完整用户流程

应用采用多阶段身份验证和账户配置：

```
1. 钱包连接 (Wallet Connection)
   └─> 用户连接 Web3 钱包 (MetaMask, Safe, 等)

2. 身份认证 (Authentication)
   └─> 签名消息以获取 JWT 令牌

3. 注册 (Sign Up)
   └─> 用户完成注册流程

4. KYC 验证 (Know Your Customer)
   └─> 身份验证
   └─> 用户资料填充

5. Safe 配置 (Safe Deployment)
   ├─> 资金来源申报 (Source of Funds)
   ├─> 手机验证 (Phone Verification)
   └─> Safe 钱包部署 (Deploy Safe)

6. 首页 (Home)
   └─> 显示余额、交易、卡片等信息
```

### 主要页面

| 页面 | 路由 | 描述 |
|------|------|------|
| Home | `/` | 主页，显示余额、交易、卡片、奖励 |
| 注册 | `/register` | 用户注册 |
| KYC | `/kyc` | 身份验证流程 |
| Safe 部署 | `/safe-deployment` | Safe 钱包部署流程 |
| 卡片 | `/cards` | 卡片管理 |
| 账户 | `/account` | 用户账户设置 |
| 提现 | `/withdraw` | 资金提现 |

## 开发模式

### 开发导航栏

在开发模式下（`import.meta.env.DEV`），底部会显示紫色开发导航栏，提供以下功能：

1. **页面导航**：左右箭头快速导航或点击页面按钮直接跳转
2. **快速完成按钮**：
   - `Home ⚡` - 一键完成所有步骤并进入 Home 页面
   - `Cards ⚡` - 一键完成所有步骤并进入 Cards 页面
   - `Acct ⚡` - 一键完成所有步骤并进入 Account 页面
3. **绕过导航锁定**：Lock/Unlock 按钮可切换 `bypassNavigation` 模式

### 快速测试流程

**方式一：使用快速完成按钮（推荐）**

1. 访问 `http://192.168.2.208:5174`
2. 连接钱包 → 签名登录
3. 在底部开发栏点击 `Home ⚡` 按钮
4. 系统会自动：
   - 标记所有 KYC、Safe 部署步骤为完成
   - 刷新用户数据
   - 跳转到 Home 页面
5. ✅ 查看完整的 Home 页面内容

**方式二：完整流程体验**

1. 访问 `http://192.168.2.208:5174`
2. **连接钱包** → 选择 MetaMask 或其他 Web3 钱包
3. **签名登录** → 签名消息
4. **Sign Up** → 完成用户注册
5. **KYC** → 填写身份信息（开发模式自动通过）
6. **Safe Deployment** →
   - 资金来源申报
   - 手机验证
   - Safe 部署
7. **Home 页面** → 显示余额、交易、卡片等

## 环境变量

在 `.env` 文件中设置：

- `VITE_PSE_RELAY_SERVER_URL` - PSE 中继服务器 URL，用于请求临时令牌
- `VITE_GNOSIS_PAY_API_BASE_URL` - Gnosis Pay API 基础 URL（本地开发设为 `http://192.168.2.208:8082/`）
- `VITE_PSE_APP_ID` - 注册为 Gnosis Pay 合作伙伴后获得的应用 ID
- `VITE_IFRAME_HOST` - (可选) Gnosis Pay 公开 PSE 端点
- `VITE_ZENDESK_KEY` - (可选) Zendesk 聊天密钥

## 命令

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 网络访问开发
pnpm dev -- --host

# 代码检查和修复
pnpm lint --fix

# 生产构建
pnpm build

# 生成 API 客户端和类型
pnpm generate-api-types
```

## 多分支开发

两个分支同时运行时的访问地址：

| 分支 | 前端 | 后端 |
|------|------|------|
| main | http://localhost:5173 | http://localhost:8080 |
| 错误 | http://localhost:5174 | http://localhost:8082 |

通过 IP 访问：

| 分支 | 前端 | 后端 |
|------|------|------|
| main | http://192.168.2.208:5173 | http://192.168.2.208:8080 |
| 错误 | http://192.168.2.208:5174 | http://192.168.2.208:8082 |

## 关键修复说明

### 网络访问配置（IP + 端口）

1. **前端配置**：`.env` 文件中配置后端 IP
   ```
   VITE_GNOSIS_PAY_API_BASE_URL="http://192.168.2.208:8082/"
   ```

2. **后端 CORS 配置**：`pse-backend-demo/src/server.ts`
   - 添加了 IP 地址到白名单
   - 支持局域网 IP 模式匹配

3. **前端 Vite 代理**：`vite.config.ts`
   - 配置了 CORS 许可
   - 支持代理和跨域请求

### 流程完成后显示 Home 页面

通过 `DevModeContext` 的 `bypassNavigation` 机制，在开发模式下可以：
- 跳过某些身份验证检查
- 快速导航到各个页面
- 测试完整的用户界面

## 技术栈

- **前端框架**：React 18 + TypeScript
- **路由**：React Router v6
- **Web3**：Wagmi + Viem
- **样式**：Tailwind CSS
- **钱包连接**：AppKit
- **UI 组件**：自定义组件库
- **后端**：Node.js + Express（开发 Mock API）