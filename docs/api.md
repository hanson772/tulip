# API 文档

**基础 URL：** `http://localhost:5000/api`

**认证方式：** `Authorization: Bearer <token>`

---

## 用户模块 `/api/users`

### 注册
```
POST /api/users/register
Content-Type: application/json

{
  "name": "用户名",
  "email": "user@example.com",
  "password": "password123"
}
```
**响应 201：**
```json
{
  "_id": 1,
  "name": "用户名",
  "nickname": "用户名",
  "email": "user@example.com",
  "avatar": "data:image/svg+xml;base64,...",
  "level": 1,
  "roles": ["user"],
  "token": "eyJhbG..."
}
```

### 登录
```
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
**响应 200：**
```json
{
  "_id": 1,
  "name": "用户名",
  "nickname": "用户名",
  "email": "user@example.com",
  "avatar": "data:image/svg+xml;base64,...",
  "level": 1,
  "roles": ["user"],
  "token": "eyJhbG..."
}
```

### 更新头像
```
PUT /api/users/avatar
Authorization: Bearer <token>
Content-Type: application/json

{ "avatar": "data:image/png;base64,..." }
```
**响应 200：** `{ "avatar": "data:image/png;base64,..." }`

### 更新个人资料
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{ "nickname": "新昵称" }
```
**响应 200：** 用户对象

---

## 主题模块 `/api/topics`

### 获取公开主题列表
```
GET /api/topics
```
支持过滤：`GET /api/topics?tag=标签名`

**响应 200：** 主题数组（仅 `published` 状态）

### 获取我的主题
```
GET /api/topics/mine
Authorization: Bearer <token>
```
**响应 200：** 当前用户的所有主题

### 获取我的草稿
```
GET /api/topics/mine/drafts
Authorization: Bearer <token>
```
**响应 200：** 状态为 `draft` 或 `reviewing` 的主题

### 获取我的已发布
```
GET /api/topics/mine/published
Authorization: Bearer <token>
```
**响应 200：** 状态为 `published` 或 `expired` 的主题

### 获取我的收藏
```
GET /api/topics/mine/favorites
Authorization: Bearer <token>
```
**响应 200：** 用户收藏的主题数组

### 获取我的参与
```
GET /api/topics/mine/participated
Authorization: Bearer <token>
```
**响应 200：** 用户支持过的主题数组

### 获取待审核主题（管理员）
```
GET /api/topics/review
Authorization: Bearer <token>
```
**响应 200：** 状态为 `reviewing` 的主题数组

### 获取单个主题详情
```
GET /api/topics/:id
Authorization: Bearer <token>  （可选：optionalAuth）
```
**权限说明：**
- 已发布/已过期主题：任何用户可查看
- 草稿/审核中：仅作者或 admin 角色可查看

**响应 200：** 包含 opinions、tags、comments 的完整主题对象

### 创建主题
```
POST /api/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "主题标题",
  "content": "主题内容",
  "deadline": "2024-12-31T23:59:59",   // 可选
  "tags": ["标签1", "标签2"]             // 可选
}
```
**响应 201：** 创建后的主题对象（状态为 `draft`）

### 更新主题
```
PUT /api/topics/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新标题",
  "content": "新内容",
  "deadline": null,        // 可选
  "tags": ["标签1", "标签2"] // 可选
}
```
**限制：** 仅作者可编辑，仅 `draft` 状态可编辑

### 删除主题
```
DELETE /api/topics/:id
Authorization: Bearer <token>
```
**限制：** 仅作者可删除

### 发布主题（提交审核）
```
POST /api/topics/:id/publish
Authorization: Bearer <token>
```
**前置条件：** 至少有一条看法（Opinion），状态为 `draft`
**结果：** 状态变为 `reviewing`

### 审核通过（管理员）
```
POST /api/topics/:id/review
Authorization: Bearer <token>
```
**权限：** 仅 `admin` 角色
**前置条件：** 状态为 `reviewing`
**结果：** 状态变为 `published`

---

## 看法模块（嵌套在主题下）

### 创建看法
```
POST /api/topics/:id/opinions
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "看法内容",
  "visible": true,       // 可选，默认 true
  "selectable": true     // 可选，默认 true
}
```

### 更新看法
```
PUT /api/topics/:id/opinions/:opinionId
Authorization: Bearer <token>
```

### 删除看法
```
DELETE /api/topics/:id/opinions/:opinionId
Authorization: Bearer <token>
```

### 支持/切换看法
```
POST /api/topics/:id/opinions/:opinionId/support
Authorization: Bearer <token>
```
**行为：** 切换支持 — 若已支持此看法则取消，若支持其他看法则切换，若未支持则新增支持

**响应 200：**
```json
{
  "opinion": { ... },
  "user_supported_opinion_id": 3
}
```

---

## 评论模块（嵌套在主题下）

### 获取评论
```
GET /api/topics/:id/comments
```

### 创建评论
```
POST /api/topics/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "评论内容",
  "parentId": 1        // 可选，回复特定评论
}
```
**限制：** 仅支持一层嵌套（不能回复回复）

---

## 收藏模块 `/api/favorites`

### 获取收藏列表
```
GET /api/favorites
Authorization: Bearer <token>
```

### 检查是否收藏
```
GET /api/favorites/:topicId
Authorization: Bearer <token>
```
**响应 200：** `{ "favorited": true/false }`

### 切换收藏
```
POST /api/favorites/:topicId
Authorization: Bearer <token>
```
**响应 200：** `{ "favorited": true/false }`

---

## 标签模块 `/api/tags`

### 获取所有标签
```
GET /api/tags
```

### 创建标签
```
POST /api/tags
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "新标签" }
```

### 更新标签
```
PUT /api/tags/:id
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "新名称" }
```

### 删除标签
```
DELETE /api/tags/:id
Authorization: Bearer <token>
```

---

## 角色模块 `/api/roles`

### 获取所有角色
```
GET /api/roles
```

### 创建角色
```
POST /api/roles
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "moderator", "description": "版主" }
```

### 删除角色
```
DELETE /api/roles/:id
Authorization: Bearer <token>
```

### 获取我的角色
```
GET /api/roles/mine
Authorization: Bearer <token>
```
**响应 200：** `[{ "id": 1, "name": "user", "description": "普通用户" }, ...]`

### 为用户分配角色
```
PUT /api/roles/user/:userId
Authorization: Bearer <token>
Content-Type: application/json

{ "roleIds": [1, 2] }
```
**响应 200：** `{ "userId": 1, "roles": ["user", "admin"] }`

---

## 数据模型

### 主题对象（完整）
```json
{
  "id": 1,
  "user_id": 1,
  "title": "主题标题",
  "content": "主题内容",
  "status": "published",
  "deadline": "2024-12-31T23:59:59",
  "author_name": "作者名",
  "author_avatar": "data:image/...",
  "opinion_count": 3,
  "user_supported_opinion_id": 2,
  "tags": [{ "id": 1, "name": "标签1" }],
  "opinions": [{ "id": 1, "content": "...", "support_count": 5 }],
  "comments": [{ "id": 1, "content": "...", "author_name": "评论者" }],
  "created_at": "2024-01-01 12:00:00",
  "updated_at": "2024-01-01 12:00:00"
}
```
