# 数据库设计

## 概述

使用 SQLite 作为数据库，通过 `node:sqlite` 的 `DatabaseSync` API 操作。数据库文件存储在 `backend/data/tulip.db`，由 `backend/src/config/database.js` 自动初始化。

## 完整建表脚本

```sql
-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT,                                 -- base64 SVG 初始头像
  nickname TEXT,                               -- 昵称
  level INTEGER DEFAULT 1,                     -- 等级
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- 主题表
-- ============================================
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',                  -- draft | reviewing | published | expired
  deadline TEXT,                                -- 可选截止时间
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);

-- ============================================
-- 看法表（主题下的选项/立场）
-- ============================================
CREATE TABLE IF NOT EXISTS opinions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  visible INTEGER DEFAULT 1,                    -- 是否可见
  selectable INTEGER DEFAULT 1,                 -- 是否可被支持
  support_count INTEGER DEFAULT 0,              -- 支持人数
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_opinions_topic_id ON opinions(topic_id);

-- ============================================
-- 支持表（用户-主题-看法的支持关系，每人每主题仅支持一个看法）
-- ============================================
CREATE TABLE IF NOT EXISTS supports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  opinion_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, topic_id),                   -- 每人每主题仅一个支持
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  FOREIGN KEY (opinion_id) REFERENCES opinions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_supports_topic_id ON supports(topic_id);
CREATE INDEX IF NOT EXISTS idx_supports_user_id ON supports(user_id);

-- ============================================
-- 评论表（支持一级回复嵌套）
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,              -- 父评论 ID（一级嵌套）
  reply_to_user_id INTEGER DEFAULT NULL,       -- 被回复用户 ID
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_comments_topic_id ON comments(topic_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- ============================================
-- 收藏表
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, topic_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_topic_id ON favorites(topic_id);

-- ============================================
-- 标签表
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- ============================================
-- 主题-标签关联表
-- ============================================
CREATE TABLE IF NOT EXISTS topic_tags (
  topic_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (topic_id, tag_id),
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_topic_tags_topic_id ON topic_tags(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_tags_tag_id ON topic_tags(tag_id);

-- ============================================
-- 角色表
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- 用户-角色关联表
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

## 种子数据

```sql
-- 默认角色
INSERT OR IGNORE INTO roles (name, description) VALUES ('user', '普通用户');
INSERT OR IGNORE INTO roles (name, description) VALUES ('admin', '管理员');
```

## 迁移策略

数据库使用增量迁移方式，通过 try/catch 包裹 `ALTER TABLE` 语句实现：

```js
// 示例：新增字段
try { db.exec('ALTER TABLE topics ADD COLUMN status TEXT DEFAULT "draft"'); } catch (_) {}
try { db.exec('ALTER TABLE opinions ADD COLUMN visible INTEGER DEFAULT 1'); } catch (_) {}
```

- 首次运行时直接创建完整表结构
- 后续更新时尝试添加新列，列已存在则静默忽略
- 旧数据通过 `UPDATE ... WHERE ... IS NULL` 填充默认值

## 表关系图

```
users 1──N topics         (user_id)
users 1──N opinions       (user_id)
users 1──N comments       (user_id)
users 1──N supports       (user_id)
users 1──N favorites      (user_id)
users M──N roles          (user_roles 关联表)

topics 1──N opinions      (topic_id)
topics 1──N comments      (topic_id)
topics 1──N supports      (topic_id)
topics 1──N favorites     (topic_id)
topics M──N tags          (topic_tags 关联表)

opinions 1──N supports    (opinion_id)
```

## 主题状态流转

```
draft ──[发布]──> reviewing ──[管理员审核通过]──> published
                                            │
                                            └──> expired (手动/自动)
```
