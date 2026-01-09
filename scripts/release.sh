#!/bin/bash

# ============================================
# Screen Sharing 版本发布脚本
# 用于创建 Git Tag 并推送，触发 GitHub Actions 自动构建
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 打印函数
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 显示帮助
show_help() {
    echo "
${CYAN}Screen Sharing 版本发布脚本${NC}

用法: ./scripts/release.sh [选项] <版本号>

版本号格式:
  1.0.0       正式版本 (创建 tag: v1.0.0)
  1.0.0-beta  预发布版本 (创建 tag: v1.0.0-beta)
  1.0.0-alpha 内测版本 (创建 tag: v1.0.0-alpha)

选项:
  -h, --help     显示帮助信息
  -d, --dry-run  只显示将要执行的操作，不实际执行
  -m, --message  自定义 Tag 消息
  --no-push      只创建本地 Tag，不推送到远程

示例:
  ./scripts/release.sh 1.0.0
  ./scripts/release.sh 1.1.0-beta
  ./scripts/release.sh -m \"修复重要 bug\" 1.0.1
  ./scripts/release.sh --dry-run 2.0.0
"
}

# 获取当前版本
get_current_version() {
    local version=$(node -p "require('./client/package.json').version" 2>/dev/null)
    echo "$version"
}

# 验证版本号格式
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
        error "无效的版本号格式: $version\n  正确格式: X.Y.Z 或 X.Y.Z-suffix (如 1.0.0, 1.0.0-beta)"
    fi
}

# 检查工作目录是否干净
check_git_status() {
    if [[ -n $(git status --porcelain) ]]; then
        warning "工作目录有未提交的更改"
        echo ""
        git status --short
        echo ""
        read -p "是否继续? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "已取消发布"
        fi
    fi
}

# 检查 Tag 是否已存在
check_tag_exists() {
    local tag=$1
    if git rev-parse "$tag" >/dev/null 2>&1; then
        error "Tag $tag 已存在！请使用新的版本号"
    fi
}

# 更新 package.json 版本
update_version() {
    local version=$1
    
    info "更新 client/package.json 版本..."
    cd client
    npm version "$version" --no-git-tag-version
    cd ..
    
    info "更新 shared/package.json 版本..."
    cd shared
    npm version "$version" --no-git-tag-version
    cd ..
    
    info "更新 server/package.json 版本..."
    cd server
    npm version "$version" --no-git-tag-version
    cd ..
    
    success "版本号已更新为 $version"
}

# 创建 Tag
create_tag() {
    local tag=$1
    local message=$2
    
    info "创建 Git Tag: $tag"
    git add .
    git commit -m "chore: bump version to $tag" || true
    git tag -a "$tag" -m "$message"
    success "Tag $tag 已创建"
}

# 推送 Tag
push_tag() {
    local tag=$1
    
    info "推送 Tag 到远程仓库..."
    git push origin main
    git push origin "$tag"
    success "Tag $tag 已推送到远程仓库"
}

# 主函数
main() {
    local version=""
    local message=""
    local dry_run=false
    local no_push=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            -m|--message)
                message="$2"
                shift 2
                ;;
            --no-push)
                no_push=true
                shift
                ;;
            *)
                version="$1"
                shift
                ;;
        esac
    done
    
    # 检查版本号
    if [[ -z "$version" ]]; then
        local current=$(get_current_version)
        echo ""
        info "当前版本: ${CYAN}$current${NC}"
        echo ""
        read -p "请输入新版本号: " version
    fi
    
    # 验证版本号
    validate_version "$version"
    
    local tag="v$version"
    
    # 设置默认消息
    if [[ -z "$message" ]]; then
        message="Release $tag"
    fi
    
    # 显示发布信息
    echo ""
    echo "┌─────────────────────────────────────────┐"
    echo "│           ${CYAN}发布信息确认${NC}                 │"
    echo "├─────────────────────────────────────────┤"
    echo "│  版本号: ${GREEN}$version${NC}"
    echo "│  Tag:    ${GREEN}$tag${NC}"
    echo "│  消息:   ${GREEN}$message${NC}"
    if [[ "$dry_run" == true ]]; then
        echo "│  模式:   ${YELLOW}Dry Run (模拟)${NC}"
    fi
    if [[ "$no_push" == true ]]; then
        echo "│  推送:   ${YELLOW}否${NC}"
    fi
    echo "└─────────────────────────────────────────┘"
    echo ""
    
    if [[ "$dry_run" == true ]]; then
        info "Dry Run 模式，以下是将要执行的操作:"
        echo "  1. 检查 Git 状态"
        echo "  2. 检查 Tag $tag 是否存在"
        echo "  3. 更新 package.json 版本为 $version"
        echo "  4. 创建 Git commit"
        echo "  5. 创建 Tag: $tag"
        if [[ "$no_push" != true ]]; then
            echo "  6. 推送到远程仓库"
            echo "  7. GitHub Actions 自动构建"
        fi
        exit 0
    fi
    
    # 确认发布
    read -p "确认发布? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "已取消发布"
    fi
    
    # 执行发布流程
    echo ""
    check_git_status
    check_tag_exists "$tag"
    update_version "$version"
    create_tag "$tag" "$message"
    
    if [[ "$no_push" != true ]]; then
        push_tag "$tag"
        echo ""
        success "🎉 发布完成！"
        echo ""
        info "GitHub Actions 正在构建中..."
        info "查看构建进度: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
        info "发布页面: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/tag/$tag"
    else
        echo ""
        success "Tag $tag 已创建（本地）"
        info "使用以下命令推送:"
        echo "  git push origin main"
        echo "  git push origin $tag"
    fi
}

# 运行
main "$@"
