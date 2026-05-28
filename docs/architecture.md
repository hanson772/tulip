# Tulip 项目技术架构

## 项目概述

Tulip 是一个全栈主题讨论平台，支持用户创建主题、发表看法（Opinions）、支持表态、评论互动，具备完整的审核发布流程和角色权限管理。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 (Options + Composition API) | ^3.3.4 |
| 路由 | Vue Router 4 | ^4.2.4 |
| 状态管理 | Vuex 4 | ^4.1.0 |
| UI 组件库 | Element Plus | ^2.3.14 |
| 图标库 | @element-plus/icons-vue | ^2.3.2 |
| HTTP 客户端 | Axios | ^1.5.0 |
| 构建工具 | Vue CLI 5 | ^5.0.8 |
| CSS 预处理器 | Sass | ^1.66.1 |

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行环境 | Node.js (SQLite 实验性支持) | ≥22 |
| 框架 | Express.js | ^4.18.2 |
| 数据库 | SQLite (node:sqlite DatabaseSync) | 内置 |
| ORM | 无（手写 SQL） | — |
| 认证 | JWT (jsonwebtoken) | ^9.0.2 |
| 密码加密 | bcryptjs | ^2.4.3 |
| CORS | cors | ^2.8.5 |
| 环境变量 | dotenv | ^16.3.1 |

## 项目结构

```
tulip/
├── backend/
│   ├── server.js                    # Express 入口，注册路由与中间件
│   ├── data/                        # SQLite 数据库文件（自动创建）
│   │   └── tulip.db
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # 数据库初始化、建表、迁移、种子数据
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT 认证中间件（auth / optionalAuth）
│   │   ├── models/
│   │   │   ├── User.js              # 用户模型
│   │   │   ├── Topic.js             # 主题模型
│   │   │   ├── Opinion.js           # 看法模型
│   │   │   ├── Comment.js           # 评论模型
│   │   │   ├── Favorite.js          # 收藏模型
│   │   │   ├── Tag.js               # 标签模型
│   │   │   └── Role.js              # 角色模型
│   │   ├── controllers/
│   │   │   ├── userController.js    # 注册、登录、头像、个人资料
│   │   │   ├── topicController.js   # 主题 CRUD、发布、审核、看法、评论
│   │   │   ├── tagController.js     # 标签 CRUD
│   │   │   ├── favoriteController.js# 收藏操作
│   │   │   └── roleController.js    # 角色管理
│   │   └── routes/
│   │       ├── userRoutes.js        # /api/users
│   │       ├── topicRoutes.js       # /api/topics
│   │       ├── tagRoutes.js         # /api/tags
│   │       ├── favoriteRoutes.js    # /api/favorites
│   │       └── roleRoutes.js        # /api/roles
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.js                  # Vue 入口
│   │   ├── App.vue                  # 根组件
│   │   ├── router/
│   │   │   └── index.js             # 前端路由定义
│   │   ├── store/
│   │   │   └── index.js             # Vuex Store（状态管理）
│   │   ├── components/
│   │   │   ├── NavBar.vue           # 顶部导航栏
│   │   │   ├── BottomNav.vue        # 底部导航（移动端）
│   │   │   ├── LoginDialog.vue      # 登录/注册弹窗
│   │   │   └── ProfileDialog.vue    # 个人资料编辑弹窗
│   │   └── views/
│   │       ├── Home.vue             # 首页（推荐列表）
│   │       ├── About.vue            # 关于页
│   │       ├── MyProfile.vue        # 个人中心（草稿/已发布/收藏/参与）
│   │       ├── Console.vue          # 管理控制台（审核列表/标签管理）
│   │       ├── topics/
│   │       │   ├── Add.vue          # 创建主题
│   │       │   ├── Edit.vue         # 编辑主题（草稿/审核中）
│   │       │   └── Detail.vue       # 主题详情页
│   │       ├── tags/
│   │       │   └── TagManage.vue    # 标签管理页
│   │       └── console/
│   │           └── Review.vue       # 审核详情页
│   └── package.json
└── docs/
    └── ...                          # 本文档
```

## 认证机制

### JWT 令牌
- 签发：注册/登录时生成，包含 `{ userId }` 负载
- 有效期：7 天
- 密钥：`process.env.JWT_SECRET`，回退到 `'fallback_secret'`
- 传递方式：`Authorization: Bearer <token>`

### 中间件
- **`auth`**：强制认证，无有效令牌返回 401
- **`optionalAuth`**：可选认证，有令牌则解析 userId，无令牌也放行

### 角色权限
- 默认角色：`user`（普通用户）、`admin`（管理员）
- 注册时自动分配 `user` 角色
- 管理员在控制台审核主题时校验 `admin` 角色
- 前端通过 `hasRole` getter 控制导航可见性

## 关键设计决策

1. **SQLite 文件数据库**：使用 Node.js 内置 `node:sqlite` 模块，无需额外安装数据库服务
2. **手写 SQL 而非 ORM**：保持轻量，直接使用 prepared statements 防止 SQL 注入
3. **渐进式迁移**：通过 `ALTER TABLE ... ADD COLUMN` + try/catch 实现零停机迁移
4. **Vue Options + Composition API 混用**：Home.vue 等新页面使用 Composition API，NavBar 等旧组件使用 Options API
5. **Vuex 持久化**：token 和 user 对象存储在 localStorage，页面刷新后自动恢复
