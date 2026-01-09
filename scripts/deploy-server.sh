#!/bin/bash

# ============================================
# Screen Sharing Server 部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 显示帮助信息
show_help() {
    echo "
Screen Sharing Server 部署脚本

用法: ./scripts/deploy-server.sh [选项] <平台>

平台:
  railway     部署到 Railway
  fly         部署到 Fly.io
  render      部署到 Render (需手动配置)
  docker      构建 Docker 镜像

选项:
  -h, --help  显示帮助信息
  -p, --prod  使用生产环境配置

示例:
  ./scripts/deploy-server.sh railway
  ./scripts/deploy-server.sh fly
  ./scripts/deploy-server.sh docker
"
}

# 检查依赖
check_dependencies() {
    info "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm 未安装"
    fi
    
    success "依赖检查通过"
}

# 构建 shared 包
build_shared() {
    info "构建 shared 包..."
    cd shared
    npm install
    npm run build
    cd ..
    success "shared 包构建完成"
}

# 构建 server
build_server() {
    info "构建 server..."
    cd server
    npm install
    npm run build
    cd ..
    success "server 构建完成"
}

# 部署到 Railway
deploy_railway() {
    info "部署到 Railway..."
    
    # 检查 Railway CLI
    if ! command -v railway &> /dev/null; then
        warning "Railway CLI 未安装，正在安装..."
        npm install -g @railway/cli
    fi
    
    cd server
    
    # 检查是否已登录
    if ! railway whoami &> /dev/null; then
        info "请登录 Railway..."
        railway login
    fi
    
    # 检查是否已初始化项目
    if [ ! -f ".railway/config.json" ]; then
        info "初始化 Railway 项目..."
        railway init
    fi
    
    # 部署
    info "正在部署..."
    railway up
    
    cd ..
    success "Railway 部署完成！"
    
    # 获取部署 URL
    info "获取部署 URL..."
    railway domain
}

# 部署到 Fly.io
deploy_fly() {
    info "部署到 Fly.io..."
    
    # 检查 flyctl
    if ! command -v flyctl &> /dev/null; then
        warning "flyctl 未安装，正在安装..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install flyctl
        else
            curl -L https://fly.io/install.sh | sh
        fi
    fi
    
    cd server
    
    # 检查是否已登录
    if ! flyctl auth whoami &> /dev/null; then
        info "请登录 Fly.io..."
        flyctl auth login
    fi
    
    # 检查是否已初始化
    if ! flyctl status &> /dev/null; then
        info "初始化 Fly.io 应用..."
        flyctl launch --no-deploy
    fi
    
    # 部署
    info "正在部署..."
    flyctl deploy
    
    cd ..
    success "Fly.io 部署完成！"
    
    # 显示应用信息
    cd server && flyctl info && cd ..
}

# 构建 Docker 镜像
build_docker() {
    info "构建 Docker 镜像..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装"
    fi
    
    # 构建镜像
    docker build -t screen-sharing-server:latest -f server/Dockerfile .
    
    success "Docker 镜像构建完成！"
    info "运行命令: docker run -p 3000:3000 screen-sharing-server:latest"
}

# Render 部署说明
deploy_render() {
    info "Render 部署说明"
    echo "
Render 需要手动在网页端配置：

1. 访问 https://render.com 并登录
2. 点击 'New +' -> 'Web Service'
3. 连接你的 GitHub 仓库
4. 配置以下选项：

   Name: screen-sharing-server
   Root Directory: server
   Environment: Node
   Build Command: cd ../shared && npm install && npm run build && cd ../server && npm install && npm run build
   Start Command: npm start

5. 添加环境变量：
   NODE_ENV=production
   PORT=10000

6. 点击 'Create Web Service'

完成后，Render 会自动部署并提供 HTTPS URL。
"
}

# 主函数
main() {
    # 解析参数
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        railway)
            check_dependencies
            build_shared
            deploy_railway
            ;;
        fly)
            check_dependencies
            build_docker
            deploy_fly
            ;;
        render)
            deploy_render
            ;;
        docker)
            build_docker
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
