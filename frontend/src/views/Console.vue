<template>
  <div class="console-page">
    <!-- Fixed Top Bar -->
    <div class="console-topbar">
      <button class="topbar-back" @click="$router.back()">
        <el-icon :size="26"><ArrowLeft /></el-icon>
      </button>
      <div class="topbar-spacer" />
    </div>

    <!-- Tabs -->
    <div class="console-content">
      <el-tabs v-model="activeTab" class="console-tabs">
        <el-tab-pane label="审核" name="review">
          <div v-if="loading" class="loading-state">
            <el-skeleton :rows="4" animated />
          </div>
          <div v-else-if="reviewTopics.length === 0" class="empty-state">
            <el-empty description="暂无待审核主题" />
          </div>
          <div v-else class="card-list">
            <div
              v-for="item in reviewTopics"
              :key="item.id"
              class="topic-card"
              @click="goToTopic(item.id)"
            >
              <div class="card-header">
                <span class="card-author">{{ item.author_name }}</span>
                <span class="card-time">{{ formatTime(item.created_at) }}</span>
              </div>
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-desc">{{ item.content }}</p>
              <div class="card-footer">
                <span class="card-stat">
                  {{ item.opinion_count || 0 }} 条看法
                </span>
                <div class="card-actions">
                  <el-tag type="warning" size="small" effect="plain">审核中</el-tag>
                  <el-button
                    type="success"
                    size="small"
                    :loading="reviewingId === item.id"
                    @click.stop="handleReview(item.id)"
                  >
                    审核通过
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="标签管理" name="tags">
          <TagManage embedded />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import TagManage from '@/views/tags/TagManage.vue';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

export default {
  name: 'ConsoleView',
  components: { ArrowLeft, TagManage },
  setup() {
    const router = useRouter();
    const activeTab = ref('review');
    const reviewTopics = ref([]);
    const loading = ref(false);
    const reviewingId = ref(null);

    async function fetchReviewTopics() {
      loading.value = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/review`);
        reviewTopics.value = response.data;
      } catch (_) {
        reviewTopics.value = [];
      } finally {
        loading.value = false;
      }
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

    function goToTopic(id) {
      router.push(`/console/review/${id}`);
    }

    async function handleReview(id) {
      reviewingId.value = id;
      try {
        await axios.post(`${API_BASE_URL}/topics/${id}/review`);
        ElMessage.success('主题已审核通过');
        reviewTopics.value = reviewTopics.value.filter(t => t.id !== id);
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '审核失败');
      } finally {
        reviewingId.value = null;
      }
    }

    onMounted(fetchReviewTopics);

    return {
      activeTab,
      reviewTopics,
      loading,
      reviewingId,
      formatTime,
      goToTopic,
      handleReview
    };
  }
};
</script>

<style scoped>
.console-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ---------- Top Bar ---------- */
.console-topbar {
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
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #303133;
  font-weight: 700;
  flex-shrink: 0;
}

.topbar-back:active {
  background: #f0f0f0;
  border-radius: 8px;
}

.topbar-spacer {
  flex: 1;
}

/* ---------- Content ---------- */
.console-content {
  padding-top: 50px;
}

.loading-state {
  padding: 1rem;
}

.empty-state {
  padding: 60px 0;
}

/* Tabs */
.console-tabs {
  background: #fff;
  padding: 0 12px;
}

.console-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.console-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.console-tabs :deep(.el-tabs__item) {
  font-size: 0.85rem;
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  color: #909399;
}

.console-tabs :deep(.el-tabs__item.is-active) {
  color: #303133;
  font-weight: 600;
}

.console-tabs :deep(.el-tabs__active-bar) {
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

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #909399;
}
</style>
