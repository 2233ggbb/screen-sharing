# Railway 部署完整指南

## 部署前准备

### 1. 注册 Railway 账号

1. 访问 [railway.app](https://railway.app)
2. 点击 "Login" -> "GitHub" 使用 GitHub 账号登录
3. 授权 Railway 访问您的 GitHub

### 2. 代码准备

确保您的代码已推送到 GitHub 仓库：

```bash
# 检查 git 状态
git status

# 添加所有更改
git add .

# 提交更改
git commit -m "feat: add Railway deployment config"

# 推送到 GitHub
git push origin main
```

### 3. 环境变量准备

创建生产环境的 `.env.production` 文件（可选，Railway 也支持在控制台设置）：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务器端口 | `3000`（Railway 自动分配） |
| `CORS_ORIGIN` | 允许的跨域来源 | `*` 或您的客户端域名 |

---

## 方法一：通过 Railway 控制台部署（推荐新手）

### 步骤 1：创建项目

1. 登录 Railway 控制台：https://railway.app/dashboard
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 选择您的 `screen-sharing` 仓库
5. Railway 会自动检测到这是一个 Node.js 项目

### 步骤 2：配置服务

1. 点击新创建的服务
2. 进入 **"Settings"** 标签

**Root Directory（根目录）：**
```
server
```

**Build Command（构建命令）：**
```bash
cd ../shared && npm install && npm run build && cd ../server && npm install && npm run build
```

**Start Command（启动命令）：**
```bash
npm start
```

### 步骤 3：设置环境变量

1. 进入 **"Variables"** 标签
2. 点击 **"New Variable"**
3. 添加以下变量：

```
NODE_ENV=production
CORS_ORIGIN=*
```

### 步骤 4：生成域名

1. 进入 **"Settings"** 标签
2. 滚动到 **"Networking"** 部分
3. 点击 **"Generate Domain"**
4. 您将获得类似 `your-app.up.railway.app` 的域名

### 步骤 5：部署

- Railway 会自动开始部署
- 可以在 **"Deployments"** 标签查看部署日志
- 部署成功后，访问生成的域名验证

---

## 方法二：通过 CLI 部署（推荐开发者）

### 步骤 1：安装 Railway CLI

**macOS：**
```bash
brew install railway
```

**npm 安装：**
```bash
npm install -g @railway/cli
```

### 步骤 2：登录

```bash
railway login
```
浏览器会自动打开，完成授权。

### 步骤 3：初始化项目

```bash
cd server
railway init
```

选择创建新项目或连接到现有项目。

### 步骤 4：设置环境变量

```bash
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=*
```

### 步骤 5：部署

```bash
railway up
```

### 步骤 6：生成域名

```bash
railway domain
```

---

## 方法三：使用部署脚本（最简单）

```bash
# 在项目根目录执行
./scripts/deploy-server.sh railway
```

脚本会自动：
1. 检查 Railway CLI 是否安装
2. 登录（如果需要）
3. 初始化项目（如果需要）
4. 执行部署

---

## 部署验证

### 1. 健康检查

访问您的 Railway 域名 + `/health`：
```
https://your-app.up.railway.app/health
```

应返回：
```json
{
  "status": "ok",
  "timestamp": "2024-01-09T10:00:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0"
}
```

### 2. API 信息

访问 `/api`：
```
https://your-app.up.railway.app/api
```

### 3. WebSocket 连接测试

在浏览器控制台测试：
```javascript
const socket = io('https://your-app.up.railway.app');
socket.on('connect', () => console.log('Connected!'));
```

---

## 部署后配置客户端

更新客户端的服务器地址：

**文件：** `client/src/renderer/utils/constants.ts`

```typescript
// 将本地地址改为 Railway 地址
export const DEFAULT_SERVER_URL = 'https://your-app.up.railway.app';
```

---

## 费用说明

### 免费套餐

- **每月 $5 免费额度**
- 500 小时执行时间
- 100GB 出站流量
- 足够开发和小规模测试使用

### 付费升级

- **Hobby Plan**: $5/月
- **Pro Plan**: $20/月起
- 按使用量计费，无固定费用

---

## 常见问题

### Q1: 部署失败，提示找不到 shared 包

**原因：** Railway 默认只会部署指定的根目录

**解决：** 确保 Build Command 中包含构建 shared 包的步骤

### Q2: WebSocket 连接失败

**原因：** CORS 配置问题

**解决：** 
1. 确保 `CORS_ORIGIN` 环境变量设置正确
2. 或者设置为 `*` 允许所有来源

### Q3: 如何查看日志？

**控制台：** Deployments -> 选择部署 -> View Logs

**CLI：**
```bash
railway logs
```

### Q4: 如何重新部署？

**控制台：** 推送新代码到 GitHub，Railway 自动部署

**CLI：**
```bash
railway up
```

---

## 自定义域名（可选）

1. 进入 Settings -> Networking
2. 点击 "Custom Domain"
3. 输入您的域名（如 `api.yourdomain.com`）
4. 添加 DNS 记录：
   - 类型：CNAME
   - 名称：api
   - 值：your-app.up.railway.app
5. 等待 DNS 生效（通常几分钟到几小时）
