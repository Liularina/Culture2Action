#!/bin/bash
# Culture2Action 启动脚本
# 前端（5173）为对外暴露端口，通过 Vite 反向代理将 /api 转发到后端（3001）

set -e

cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# 首次运行自动安装依赖并初始化数据库
if [ ! -d "node_modules" ]; then
  echo "[start] installing dependencies..."
  npm install
fi

if [ ! -f "server/data/culture2action.db" ]; then
  echo "[start] seeding database..."
  npm run seed
fi

# 启动后端
echo "[start] starting backend on :3001"
npm --workspace server run start &
BACKEND_PID=$!

# 启动前端（暴露端口）
echo "[start] starting frontend on :5173"
npm --workspace web run dev
