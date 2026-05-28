# 前端架构

## 技术栈

- **框架：** Vue 3 (Composition API + Options API)
- **路由：** Vue Router 4（createWebHistory）
- **状态管理：** Vuex 4
- **UI 库：** Element Plus
- **HTTP：** Axios

## 路由定义

| 路径 | 名称 | 组件 | 权限 |
|------|------|------|------|
| `/` | Home | Home.vue | 公开 |
| `/about` | About | About.vue | 公开 |
| `/topic/:id` | TopicDetail | Detail.vue | 公开 |
| `/my/topic/add` | TopicAdd | Add.vue | 需登录 |
| `/my/topic/edit/:id` | MyTopicEdit | Edit.vue | 需登录 |
| `/my/topic/:id` | MyTopicView | Detail.vue | 需登录 |
| `/my/:tab?` | MyProfile | MyProfile.vue | 需登录 |
| `/my/tags` | TagManage | TagManage.vue | 需登录 |
| `/console` | Console | Console.vue | 需登录 |
| `/console/review/:id` | ConsoleReview | Review.vue | 需登录 |

路由守卫在 `router.beforeEach` 中检查 `localStorage.getItem('token')` 是否存在。

## 组件树

```
App.vue
├── NavBar.vue              # 顶部导航（桌面端）
├── BottomNav.vue            # 底部导航（移动端）
├── LoginDialog.vue          # 登录/注册弹窗
├── ProfileDialog.vue        # 个人资料编辑弹窗
└── <router-view>            # 页面视图

页面组件：
├── Home.vue                 # 首页
│   └── 使用 store.dispatch('fetchTopics') 加载
├── About.vue                # 关于页
├── MyProfile.vue            # 个人中心
│   ├── Tab: 草稿（draft + reviewing）
│   ├── Tab: 已发布（published + expired）
│   ├── Tab: 收藏
│   └── Tab: 参与
├── Console.vue              # 管理控制台
│   ├── Tab: 审核列表
│   └── Tab: 标签管理 → TagManage.vue (embedded)
├── topics/Add.vue           # 创建主题
├── topics/Edit.vue          # 编辑/发布主题
├── topics/Detail.vue        # 主题详情
├── tags/TagManage.vue       # 标签管理
└── console/Review.vue       # 审核详情页
```

## Vuex Store 结构

### State
| 字段 | 类型 | 说明 |
|------|------|------|
| user | Object/null | 当前登录用户 |
| token | String/null | JWT 令牌 |
| topics | Array | 首页主题列表 |
| topicsLoading | Boolean | 首页加载状态 |
| currentTopic | Object/null | 当前查看的主题详情 |
| currentTopicLoading | Boolean | 详情加载状态 |
| myDrafts | Array | 我的草稿 |
| myPublished | Array | 我的已发布 |
| myFavorites | Array | 我的收藏 |
| myParticipated | Array | 我的参与 |
| tags | Array | 所有标签 |
| tagsLoading | Boolean | 标签加载状态 |

### Getters
| 名称 | 返回 | 说明 |
|------|------|------|
| isLoggedIn | Boolean | 是否已登录 |
| currentUser | Object/null | 当前用户 |
| topics / topicsLoading | 对应 state | — |
| currentTopic / currentTopicLoading | 对应 state | — |
| myDrafts / myPublished | 对应 state | — |
| myFavorites / myParticipated | 对应 state | — |
| tags / tagsLoading | 对应 state | — |
| currentUserRoles | Array | 用户角色列表 |
| hasRole(roleName) | Function | 检查是否拥有指定角色 |

### Actions（关键）
| 名称 | 说明 |
|------|------|
| login / register | 认证，保存用户+token |
| logout | 清除认证状态 |
| fetchTopics / fetchTopic | 主题列表/详情 |
| createTopic / updateTopic / deleteTopic | 主题 CRUD |
| publishTopic | 提交审核 |
| createOpinion / updateOpinion / deleteOpinion | 看法管理 |
| supportOpinion | 支持/切换看法 |
| createComment | 创建评论 |
| toggleFavorite / checkFavorite | 收藏操作 |
| fetchTags / createTag / updateTag / deleteTag | 标签管理 |
| fetchMyDrafts / fetchMyPublished | 个人主题 |
| fetchMyFavorites / fetchMyParticipated | 收藏/参与 |
| uploadAvatar / updateProfile | 个人资料 |

### 持久化策略
- token 和 user 对象存入 `localStorage`
- 页面刷新时从 localStorage 恢复并重新设置 Axios 默认请求头
- 退出登录时清除所有持久化数据

## 角色权限控制

前端通过 `store.getters.hasRole('admin')` 控制：

- **NavBar.vue**：控制台入口仅管理员可见
- **Home.vue**：左侧抽屉的控制台入口仅管理员可见
- **Console.vue**：整个页面需要登录（路由守卫），但审核接口在后端校验 admin 角色

## 页面交互流程

### 主题创建→发布→审核→公开

1. 用户在 `/my/topic/add` 创建主题（状态：draft）
2. 用户在 `/my/topic/edit/:id` 添加看法（至少 2 条）
3. 用户点击"发布" → 状态变为 `reviewing`，提示"已提交审核"
4. 管理员在 `/console` 看到待审核列表
5. 管理员点击卡片进入 `/console/review/:id` 查看详情
6. 管理员点击"审核通过" → 状态变为 `published`
7. 主题出现在首页 `/` 的公开列表中

### 评论交互

- 用户可在已发布/审核中的主题详情页发表评论
- 支持回复（仅一层嵌套），通过 `parentId` 和 `replyToUserId` 实现
- 评论按时间正序排列

### 支持功能

- 用户每主题仅能支持一个看法
- 点击已支持的看法 → 取消支持
- 点击其他看法 → 切换支持
- 已过期主题不可操作支持
