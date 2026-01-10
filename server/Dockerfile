# 多阶段构建 - 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 shared 包
COPY shared/package.json shared/package-lock.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src

# 构建 shared 包
WORKDIR /app/shared
RUN npm ci && npm run build

# 复制 server 包
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
COPY server/tsconfig.json ./server/
COPY server/src ./server/src

# 安装依赖并构建
WORKDIR /app/server
RUN npm ci && npm run build

# 生产阶段
FROM node:20-alpine AS runner

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 server

# 设置工作目录
WORKDIR /app

# 复制 shared 构建产物
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist

# 复制 server 构建产物和依赖
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules

# 切换到 server 目录
WORKDIR /app/server

# 创建 logs 目录并设置权限（虽然生产环境不写文件，但确保目录存在）
RUN mkdir -p logs && chown -R server:nodejs logs

# 切换用户
USER server

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/index.js"]
