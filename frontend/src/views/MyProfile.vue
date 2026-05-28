<template>
  <div class="my-page">
    <!-- Fixed Top Bar -->
    <div class="my-topbar">
      <button class="topbar-back" @click="$router.back()">
        <el-icon :size="22"><ArrowLeft /></el-icon>
      </button>
      <span class="topbar-title">我的</span>
      <div class="topbar-spacer" />
    </div>

    <!-- Tabs -->
    <div class="my-content">
      <el-tabs :model-value="activeTab" class="my-tabs" @tab-click="onTabChange">
        <el-tab-pane label="草稿箱" name="drafts" />
        <el-tab-pane label="我的主题" name="published" />
        <el-tab-pane label="我的参与" name="participated" />
        <el-tab-pane label="我的关注" name="followed" />
      </el-tabs>

      <!-- Drafts Tab -->
      <template v-if="activeTab === 'drafts'">
        <div v-if="draftsLoading" class="loading-state">
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else-if="drafts.length === 0" class="empty-state">
          <el-empty description="暂无草稿" />
        </div>
        <div v-else class="card-list">
          <div
            v-for="item in drafts"
            :key="item.id"
            class="topic-card"
            @click="goToEdit(item.id)"
          >
            <div class="card-header">
              <span class="card-author">{{ item.author_name }}</span>
              <span class="card-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-desc">{{ item.content }}</p>
            <div class="card-footer">
              <span class="card-stat">
                <el-icon :size="14"><ChatDotSquare /></el-icon>
                {{ item.opinion_count || 0 }} 条看法
              </span>
              <el-tag :type="statusType(item.status)" size="small" effect="plain">
                {{ statusLabel(item.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </template>

      <!-- Published Tab -->
      <template v-if="activeTab === 'published'">
        <div v-if="publishedLoading" class="loading-state">
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else-if="published.length === 0" class="empty-state">
          <el-empty description="暂无已发布的主题" />
        </div>
        <div v-else class="card-list">
          <div
            v-for="item in published"
            :key="item.id"
            class="topic-card"
            @click="goToDetail(item.id)"
          >
            <div class="card-header">
              <span class="card-author">{{ item.author_name }}</span>
              <span class="card-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-desc">{{ item.content }}</p>
            <div class="card-footer">
              <span class="card-stat">
                <el-icon :size="14"><ChatDotSquare /></el-icon>
                {{ item.opinion_count || 0 }} 条看法
              </span>
              <el-tag :type="statusType(item.status)" size="small" effect="plain">
                {{ statusLabel(item.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </template>

      <!-- Participated Tab -->
      <template v-if="activeTab === 'participated'">
        <div class="empty-state">
          <el-empty description="暂无参与记录" />
        </div>
      </template>

      <!-- Followed Tab -->
      <template v-if="activeTab === 'followed'">
        <div class="empty-state">
          <el-empty description="暂无关注" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ChatDotSquare } from '@element-plus/icons-vue';

export default {
  name: 'MyProfileView',
  components: { ArrowLeft, ChatDotSquare },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const activeTab = computed(() => route.params.tab || 'drafts');

    const drafts = computed(() => store.getters.myDrafts);
    const draftsLoading = computed(() => store.getters.myDraftsLoading);
    const published = computed(() => store.getters.myPublished);
    const publishedLoading = computed(() => store.getters.myPublishedLoading);

    function statusType(status) {
      const map = { draft: 'info', reviewing: 'warning', published: 'success', expired: 'danger' };
      return map[status] || 'info';
    }

    function statusLabel(status) {
      const map = { draft: '草稿', reviewing: '审核中', published: '已发布', expired: '已过期' };
      return map[status] || status;
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

    function onTabChange(tab) {
      router.push(`/my/${tab.props.name}`);
    }

    function goToDetail(id) {
      router.push(`/my/topic/${id}`);
    }

    function goToEdit(id) {
      router.push(`/my/topic/edit/${id}`);
    }

    watch(() => route.params.tab, (tab) => {
      const t = tab || 'drafts';
      if (t === 'drafts') {
        store.dispatch('fetchMyDrafts');
      } else if (t === 'published') {
        store.dispatch('fetchMyPublished');
      }
    }, { immediate: true });

    return {
      activeTab,
      drafts,
      draftsLoading,
      published,
      publishedLoading,
      statusType,
      statusLabel,
      formatTime,
      onTabChange,
      goToDetail,
      goToEdit,
    };
  }
};
</script>

<style scoped>
.my-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ---------- Top Bar ---------- */
.my-topbar {
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

.topbar-back {
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

.topbar-back:active {
  background: #f0f0f0;
  border-radius: 8px;
}

.topbar-title {
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
}

.topbar-spacer {
  flex: 1;
}

/* ---------- Content ---------- */
.my-content {
  padding-top: 50px;
}

.loading-state {
  padding: 1rem;
}

.empty-state {
  padding: 60px 0;
}

/* Tabs */
.my-tabs {
  background: #fff;
  padding: 0 12px;
}

.my-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.my-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.my-tabs :deep(.el-tabs__item) {
  font-size: 0.85rem;
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  color: #909399;
}

.my-tabs :deep(.el-tabs__item.is-active) {
  color: #303133;
  font-weight: 600;
}

.my-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 1px;
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
</style>
