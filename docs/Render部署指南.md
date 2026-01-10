# Render 部署指南

本文档详细说明如何在 Render 上部署 screen-sharing 服务器。

## 前置要求

⚠️ **需要绑定支付方式（信用卡/借记卡）才能使用 Render，即使是免费套餐。**

## 部署方式选择

### 方式一：Docker 部署（推荐）✅

使用 Docker 可以确保环境一致性，构建过程更可控。

#### 步骤 1：在 Render Dashboard 创建服务

1. 访问 [render.com](https://render.com) 并登录
2. 点击 **"New +" → "Blueprint"**
3. 连接你的 GitHub 仓库
4. **Blueprint Name**: 输入任意名称（如 `screen-sharing`）
5. **Branch**: 选择 `main`
6. **Blueprint file**: 选择 `render-docker.yaml`
7. 点击 **"Apply"**

#### 步骤 2：配置说明

[`render-docker.yaml`](../render-docker.yaml) 已配置好所有必要设置：

```yaml
runtime: docker              # 使用 Docker 运行时
dockerfilePath: ./server/Dockerfile  # Dockerfile 路径
dockerContext: ./            # Docker 构建上下文为根目录（重要！）
region: singapore            # 新加坡区域
plan: free                   # 免费套餐
```

**为什么 dockerContext 必须是 `./`（根目录）？**

因为 [`server/Dockerfile`](../server/Dockerfile:8) 需要同时访问：
- `shared/` 目录（共享代码包）
- `server/` 目录（服务端代码）

如果 context 设为 `server/`，Docker 无法访问上级目录的 `shared` 包，构建会失败。

#### 步骤 3：环境变量

默认已配置，如需修改可在 Render Dashboard 的 Environment 标签页调整：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `10000` | Render 默认端口 |
| `CORS_ORIGIN` | `*` | 跨域配置，生产环境建议改为具体域名 |

#### 步骤 4：部署

点击 **"Apply"** 后，Render 会自动：
1. 从 GitHub 拉取代码
2. 使用 [`server/Dockerfile`](../server/Dockerfile) 构建镜像
3. 部署并启动服务

构建时间约 3-5 分钟。

---

### 方式二：Node 部署（替代方案）

如果不想用 Docker，可以使用 Node 环境直接部署。

#### 使用 Blueprint

1. 在 Render Dashboard 选择 **"New +" → "Blueprint"**
2. 选择 `server/render.yaml`
3. 配置已包含构建命令

#### 手动配置

或者手动创建 Web Service：

| 配置项 | 值 |
|--------|-----|
| **Name** | `screen-sharing-server` |
| **Root Directory** | `.`（留空，使用根目录） |
| **Environment** | `Node` |
| **Build Command** | `cd shared && npm install && npm run build && cd ../server && npm install && npm run build` |
| **Start Command** | `cd server && npm start` |
| **Region** | `Singapore` |
| **Plan** | `Free` |

---

## 部署后操作

### 1. 获取服务 URL

部署成功后，Render 会提供一个 URL，格式如：
```
https://screen-sharing-server.onrender.com
```

### 2. 更新客户端配置

需要在客户端代码中配置此服务器地址。

### 3. 健康检查

访问 `https://your-app.onrender.com/health` 确认服务正常运行。

---

## 常见问题

### Q1: 部署失败 "package-lock.json not found"

**原因**: Dockerfile 无法找到 `package-lock.json` 文件。

**解决**: 确保：
1. `dockerContext: ./` 设置为根目录
2. [`server/Dockerfile`](../server/Dockerfile:8) 使用显式文件名（不是通配符）：
   ```dockerfile
   COPY server/package.json server/package-lock.json ./server/
   ```

### Q2: 服务启动后自动休眠

**原因**: Render 免费套餐在 15 分钟无活动后会休眠。

**解决**: 
- 升级到付费套餐
- 使用定时任务定期访问服务保持活跃（不推荐）

### Q3: WebSocket 连接失败

**原因**: 
1. CORS 配置问题
2. 客户端使用 HTTP 连接 HTTPS 服务

**解决**:
1. 设置正确的 `CORS_ORIGIN` 环境变量
2. 确保客户端使用 `wss://`（WebSocket Secure）协议

### Q4: 端口配置问题

**注意**: Render 会动态分配端口并通过 `PORT` 环境变量传递。

服务器代码必须使用：
```javascript
const PORT = process.env.PORT || 3000;
```

不要硬编码端口号。

---

## 自定义域名

1. 在 Render Dashboard 进入服务设置
2. 点击 **"Custom Domain"**
3. 添加你的域名
4. 在域名 DNS 设置中添加 CNAME 记录
5. Render 会自动配置 SSL 证书

---

## 成本说明

| 套餐 | 价格 | 说明 |
|------|------|------|
| Free | $0 | 750小时/月，15分钟无活动后休眠 |
| Starter | $7/月 | 持久运行，无休眠 |
| Standard | $25/月 | 更多资源和功能 |

⚠️ **所有套餐都需要绑定支付方式。**

---

## 相关文件

- [`render-docker.yaml`](../render-docker.yaml) - Docker 部署配置
- [`server/render.yaml`](../server/render.yaml) - Node 部署配置
- [`server/Dockerfile`](../server/Dockerfile) - Docker 构建文件
- [`部署方案.md`](./部署方案.md) - 多平台部署对比
