@echo off
echo ========================================
echo    本地开发环境启动脚本
echo ========================================
echo.

echo [1/2] 启动信令服务器 (localhost:3000)...
start "Screen Sharing Server" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] 启动客户端 (localhost:5173)...
start "Screen Sharing Client" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo    启动完成！
echo ========================================
echo.
echo 服务器地址: http://localhost:3000
echo 客户端地址: http://localhost:5173
echo.
echo 提示：
echo - 服务器日志在 "Screen Sharing Server" 窗口
echo - 客户端日志在 "Screen Sharing Client" 窗口
echo - 按 Ctrl+C 可以停止服务
echo.
echo 开始测试...
echo.
pause
