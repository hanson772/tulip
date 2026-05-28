# Tulip

全栈讨论平台，支持主题发布、观点投票、评论、收藏、角色权限和审核流程。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Vue 3 + Vuex 4 + Element Plus |
| 后端 | Express.js + SQLite (node:sqlite) |
| 数据库 | SQLite（文件存储在 `backend/data/tulip.db`） |

## 前提条件

- Node.js >= 18（推荐 24）
- npm >= 9
- Docker（可选，方式二需要）

## 快速开始

### 方式一：本地运行

```bash
# 一键启动（构建前端 → 复制 → 启动后端）
chmod +x start.sh
./start.sh

# 或者手动执行
cd frontend && npm install && npm run build && cd ..
rm -rf backend/public && cp -r frontend/dist backend/public
cd backend && npm install && npm run dev
```

访问 http://localhost:5000

### 方式二：Docker 运行

```bash
# 一行命令：构建镜像并启动
docker compose up -d --build

# 带超管初始化启动
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=123456 docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止
docker compose down

# 停止并删除数据卷（重置数据库）
docker compose down -v
```

访问 http://localhost:5000

## 日志

使用 `process.stdout.write` 直接输出，Docker 中无缓冲问题，格式：

```
[2026-05-28 12:00:00] [INFO] SQLite database initialized
[2026-05-28 12:00:00] [INFO] Server is running on port 5000
[2026-05-28 12:00:05] [ERROR] xxx
```

查看方式：

```bash
# Docker
docker compose logs -f

# 本地直接看终端输出
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `5000` | 后端监听端口 |
| `JWT_SECRET` | `tulip_jwt_secret_key_change_in_production` | JWT 签名密钥 |
| `ADMIN_EMAIL` | — | 启动时自动创建超管用户（不设置则跳过） |
| `ADMIN_PASSWORD` | — | 超管密码 |
| `ADMIN_NAME` | `Admin` | 超管用户名 |

## 项目结构

```
tulip/
├── start.sh               一键本地启动脚本
├── Dockerfile             多阶段 Docker 构建
├── docker-compose.yml     容器编排
├── docs/                  技术文档
├── backend/
│   ├── server.js          服务入口
│   ├── src/
│   │   ├── config/        数据库初始化、日志、超管初始化
│   │   │   ├── database.js
│   │   │   ├── logger.js
│   │   │   └── seedAdmin.js
│   │   ├── controllers/   路由处理器
│   │   ├── middleware/     JWT 中间件
│   │   ├── models/        数据模型
│   │   └── routes/        API 路由
│   └── package.json
└── frontend/
    ├── src/
    │   ├── router/         Vue Router
    │   ├── store/          Vuex 状态管理
    │   └── views/          页面组件
    └── package.json
```
