<template>
  <div class="home-page">
    <!-- Fixed Top Bar -->
    <div class="home-topbar">
      <button class="hamburger-btn" @click="drawerVisible = true">
        <el-icon :size="22"><Menu /></el-icon>
      </button>
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索..."
          clearable
          size="small"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- Hamburger Drawer -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="260px"
      :with-header="false"
    >
      <div class="drawer-body">
        <!-- User Section -->
        <div class="drawer-user">
          <div class="drawer-avatar">
            <template v-if="isLoggedIn">
              <el-avatar :size="48" :src="avatarSrc" :fit="'cover'" />
            </template>
            <el-avatar v-else :size="48" icon="UserFilled" />
          </div>
          <span class="drawer-name">
            {{ isLoggedIn ? (currentUser?.nickname || currentUser?.name || '用户') : '未登录' }}
          </span>
        </div>

        <div class="drawer-divider" />

        <!-- Menu Items -->
        <div class="drawer-menu">
          <div v-if="!isLoggedIn" class="drawer-menuitem" @click="drawerVisible = false; openLogin()">
            <el-icon :size="18"><User /></el-icon>
            <span>登录</span>
          </div>
          <template v-else>
            <div class="drawer-menuitem" @click="drawerVisible = false; profileDialogVisible = true">
              <el-icon :size="18"><User /></el-icon>
              <span>{{ currentUser?.name || '用户' }}</span>
            </div>
            <div class="drawer-menuitem" @click="drawerVisible = false; $router.push('/my/topic/add')">
              <el-icon :size="18"><Setting /></el-icon>
              <span>控制台</span>
            </div>
            <div class="drawer-menuitem" @click="drawerVisible = false; $router.push('/my/tags')">
              <el-icon :size="18"><CollectionTag /></el-icon>
              <span>标签管理</span>
            </div>
            <div class="drawer-menuitem" @click="handleLogout">
              <el-icon :size="18"><SwitchButton /></el-icon>
              <span>退出</span>
            </div>
          </template>
        </div>
      </div>
    </el-drawer>

    <!-- Content -->
    <div class="home-content">
      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="home-tabs" @tab-click="onTabChange">
        <el-tab-pane label="推荐" name="recommend" />
        <el-tab-pane label="关注" name="follow" />
        <el-tab-pane label="热门" name="hot" />
      </el-tabs>

      <!-- Tag Filter -->
      <div class="tag-filter-bar">
        <el-select
          v-model="tagFilter"
          placeholder="标签筛选"
          clearable
          size="small"
          class="tag-filter-select"
          @change="onTagFilterChange"
        >
          <el-option
            v-for="tag in allTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.name"
          />
        </el-select>
      </div>

      <!-- Loading -->
      <div v-if="topicsLoading && topics.length === 0" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- Empty State -->
      <div v-else-if="topics.length === 0" class="empty-state">
        <el-empty description="暂无主题，快去创建第一个吧！" />
      </div>

      <!-- Topic Cards -->
      <div v-else class="card-list">
        <div
          v-for="(item, index) in displayList"
          :key="item.id"
          class="topic-card"
          :class="{ 'card-enter': index >= prevCount }"
          @click="goToDetail(item.id)"
        >
          <div class="card-header">
            <span class="card-author">{{ item.author_name }}</span>
            <span class="card-time">{{ formatTime(item.created_at) }}</span>
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-desc">{{ item.content }}</p>
          <div v-if="item.tags && item.tags.length" class="card-tags">
            <el-tag
              v-for="tag in item.tags"
              :key="tag.id"
              size="small"
              effect="plain"
              class="card-tag"
            >{{ tag.name }}</el-tag>
          </div>
          <div class="card-footer">
            <span class="card-stat">
              <el-icon :size="14"><ChatDotSquare /></el-icon>
              {{ item.opinion_count || 0 }} 条看法
            </span>
            <el-tag
              v-if="item.status === 'expired'"
              type="danger"
              size="small"
              effect="plain"
            >已过期</el-tag>
          </div>
        </div>

        <!-- Loading / End sentinel -->
        <div ref="sentinel" class="sentinel">
          <span v-if="loading" class="sentinel-text">加载中...</span>
          <span v-else-if="!hasMore" class="sentinel-text">— 已经到底了 —</span>
        </div>
      </div>
    </div>

    <!-- Profile Dialog -->
    <ProfileDialog v-model="profileDialogVisible" />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, inject } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { Menu, Search, HomeFilled, User, UserFilled, Setting, CollectionTag, SwitchButton, ChatDotSquare } from '@element-plus/icons-vue';
import ProfileDialog from '@/components/ProfileDialog.vue';

const AVATAR_COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C', '#E67E22', '#2ECC71', '#3498DB'];

function generateInitialAvatar(name) {
  const initial = (name || '?')[0].toUpperCase();
  const colorIndex = (name || '').length % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${bgColor}"/>
    <text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="white" font-size="40" font-family="Arial,Helvetica,sans-serif" font-weight="bold">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default {
  name: 'HomeView',
  components: { Menu, Search, HomeFilled, User, UserFilled, Setting, CollectionTag, SwitchButton, ChatDotSquare, ProfileDialog },
  setup() {
    const drawerVisible = ref(false);
    const searchQuery = ref('');
    const activeTab = ref('recommend');
    const loading = ref(false);
    const hasMore = ref(true);
    const sentinel = ref(null);
    const profileDialogVisible = ref(false);
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const openLogin = inject('openLogin');

    const tagFilter = ref(route.query.tag || '');
    const allTags = computed(() => store.getters.tags);

    const isLoggedIn = computed(() => store.getters.isLoggedIn);
    const currentUser = computed(() => store.getters.currentUser);
    const topics = computed(() => store.getters.topics);
    const topicsLoading = computed(() => store.getters.topicsLoading);

    const avatarSrc = computed(() => {
      const user = currentUser.value;
      if (!user) return '';
      return user.avatar || generateInitialAvatar(user.name);
    });

    function handleLogout() {
      drawerVisible.value = false;
      store.dispatch('logout');
    }

    let observer = null;

    const prevCount = computed(() => topics.value.length);

    const displayList = computed(() => {
      let list = topics.value;
      const q = searchQuery.value.trim().toLowerCase();
      if (q) {
        list = list.filter(
          item =>
            item.title.toLowerCase().includes(q) ||
            (item.content || '').toLowerCase().includes(q)
        );
      }
      if (tagFilter.value) {
        list = list.filter(
          item =>
            item.tags && item.tags.some(t => t.name === tagFilter.value)
        );
      }
      return list;
    });

    function loadMore() {
      if (loading.value || !hasMore.value) return;
      loading.value = true;
      setTimeout(() => {
        hasMore.value = false;
        loading.value = false;
      }, 300);
    }

    function onTabChange() {
      store.dispatch('fetchTopics');
      hasMore.value = true;
    }

    function onTagFilterChange(val) {
      if (!val) {
        router.replace({ query: {} });
      } else {
        router.replace({ query: { tag: val } });
      }
    }

    function goToDetail(id) {
      router.push(`/topic/${id}`);
    }

    function formatTime(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr.replace(' ', 'T') + 'Z');
      const now = new Date();
      const diff = (now - d) / 1000;
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
      if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
      return d.toLocaleDateString('zh-CN');
    }

    onMounted(() => {
      store.dispatch('fetchTopics');
      store.dispatch('fetchTags');
      nextTick(() => {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              loadMore();
            }
          },
          { rootMargin: '100px' }
        );
        if (sentinel.value) observer.observe(sentinel.value);
      });
    });

    onUnmounted(() => {
      if (observer) observer.disconnect();
    });

    return {
      drawerVisible,
      searchQuery,
      activeTab,
      loading,
      hasMore,
      displayList,
      prevCount,
      sentinel,
      profileDialogVisible,
      avatarSrc,
      isLoggedIn,
      currentUser,
      topics,
      topicsLoading,
      openLogin,
      tagFilter,
      allTags,
      onTabChange,
      onTagFilterChange,
      goToDetail,
      handleLogout,
      formatTime,
    };
  }
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ---------- Top Bar ---------- */
.home-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #303133;
  flex-shrink: 0;
}

.hamburger-btn:active {
  background: #f0f0f0;
  border-radius: 8px;
}

.search-box {
  flex: 1;
  margin-left: 8px;
}

.search-icon {
  color: #909399;
}

/* ---------- Content ---------- */
.home-content {
  padding: 50px 0 0;
}

.loading-state {
  padding: 1rem;
}

.empty-state {
  padding: 60px 0;
}

/* Tabs */
.home-tabs {
  background: #fff;
  padding: 0 12px;
}

.home-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.home-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.home-tabs :deep(.el-tabs__item) {
  font-size: 0.85rem;
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  color: #909399;
}

.home-tabs :deep(.el-tabs__item.is-active) {
  color: #303133;
  font-weight: 600;
}

.home-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 1px;
}

/* Tag Filter Bar */
.tag-filter-bar {
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.tag-filter-select {
  width: 100%;
}

/* Card List */
.card-list {
  padding: 8px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topic-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s;
  cursor: pointer;
}

.topic-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-author {
  font-size: 0.8rem;
  font-weight: 600;
  color: #409eff;
}

.card-time {
  font-size: 0.75rem;
  color: #c0c4cc;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px;
  line-height: 1.4;
}

.card-desc {
  font-size: 0.85rem;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.card-tag {
  cursor: pointer;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #909399;
}

/* Sentinel */
.sentinel {
  text-align: center;
  padding: 16px 0;
}

.sentinel-text {
  font-size: 0.8rem;
  color: #c0c4cc;
}

/* Card enter animation */
.card-enter {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- Drawer ---------- */
.drawer-body {
  padding: 24px 16px;
}

.drawer-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 20px;
}

.drawer-avatar {
  cursor: pointer;
}

.drawer-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #303133;
}

.drawer-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 -16px 12px;
}

.drawer-menu {
  display: flex;
  flex-direction: column;
}

.drawer-menuitem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 8px;
  color: #303133;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
}

.drawer-menuitem:active {
  background: #f5f7fa;
}
</style>