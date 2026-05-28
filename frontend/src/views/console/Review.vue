<template>
  <div class="review-page">
    <!-- Fixed Top Bar -->
    <div class="review-topbar">
      <button class="topbar-back" @click="$router.back()">
        <el-icon :size="26"><ArrowLeft /></el-icon>
      </button>
      <div class="topbar-spacer" />
    </div>

    <!-- Content -->
    <div class="review-content">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="6" animated />
      </div>

      <template v-else-if="topic">
        <el-card class="topic-section" shadow="never">
          <h2 class="topic-title">{{ topic.title }}</h2>
          <div class="topic-meta">
            <span class="meta-author">{{ topic.author_name }}</span>
            <span class="meta-time">{{ formatTime(topic.created_at) }}</span>
            <el-tag v-if="topic.deadline" type="warning" size="small" effect="plain">
              截止: {{ topic.deadline }}
            </el-tag>
          </div>
          <p class="topic-content">{{ topic.content }}</p>
          <div v-if="topic.tags && topic.tags.length" class="topic-tags">
            <el-tag
              v-for="tag in topic.tags"
              :key="tag.id"
              size="small"
              type="info"
              effect="plain"
              class="topic-tag"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </el-card>

        <!-- Opinions Section -->
        <el-card class="opinions-section" shadow="never">
          <h3 class="section-title">看法 ({{ (topic.opinions || []).length }})</h3>
          <div v-if="!topic.opinions || topic.opinions.length === 0" class="empty-opinions">
            暂无看法
          </div>
          <div v-else class="opinion-list">
            <div
              v-for="opinion in topic.opinions"
              :key="opinion.id"
              class="opinion-item"
            >
              <div class="opinion-content">{{ opinion.content }}</div>
              <div class="opinion-meta">
                <el-tag v-if="opinion.visible" size="small" type="success" effect="plain">可见</el-tag>
                <el-tag v-else size="small" type="info" effect="plain">隐藏</el-tag>
                <el-tag v-if="opinion.selectable" size="small" type="primary" effect="plain">可支持</el-tag>
                <span class="opinion-support">{{ opinion.support_count || 0 }} 人支持</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- Review Actions -->
        <div class="review-actions">
          <el-button
            type="success"
            size="large"
            :loading="reviewing"
            @click="handleReview"
          >
            审核通过
          </el-button>
        </div>
      </template>

      <div v-else class="error-state">
        <el-result icon="error" title="主题加载失败">
          <template #extra>
            <el-button type="primary" @click="$router.back()">返回</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

export default {
  name: 'ConsoleReview',
  components: { ArrowLeft },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const topicId = Number(route.params.id);
    const loading = ref(true);
    const reviewing = ref(false);
    const topic = ref(null);

    async function fetchTopic() {
      loading.value = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/topics/${topicId}`);
        topic.value = response.data;
      } catch (_) {
        topic.value = null;
      } finally {
        loading.value = false;
      }
    }

    async function handleReview() {
      reviewing.value = true;
      try {
        await axios.post(`${API_BASE_URL}/topics/${topicId}/review`);
        ElMessage.success('主题已审核通过');
        router.back();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '审核失败');
      } finally {
        reviewing.value = false;
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

    onMounted(fetchTopic);

    return {
      loading,
      reviewing,
      topic,
      handleReview,
      formatTime
    };
  }
};
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Top Bar */
.review-topbar {
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

/* Content */
.review-content {
  padding: 62px 12px 24px;
}

.loading-state {
  padding: 1rem;
}

.error-state {
  padding: 40px 0;
}

/* Topic Section */
.topic-section {
  margin-bottom: 1rem;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.topic-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px;
  line-height: 1.4;
}

.topic-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-author {
  font-size: 0.8rem;
  font-weight: 600;
  color: #409eff;
}

.meta-time {
  font-size: 0.75rem;
  color: #c0c4cc;
}

.topic-content {
  font-size: 0.9rem;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px;
  white-space: pre-wrap;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.topic-tag {
  margin: 0;
}

/* Opinions Section */
.opinions-section {
  margin-bottom: 1rem;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.opinion-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.opinion-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.opinion-item:last-child {
  border-bottom: none;
}

.opinion-content {
  font-size: 0.9rem;
  color: #303133;
  line-height: 1.5;
  margin-bottom: 6px;
}

.opinion-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.opinion-support {
  font-size: 0.75rem;
  color: #909399;
  margin-left: auto;
}

.empty-opinions {
  text-align: center;
  padding: 16px;
  color: #909399;
  font-size: 0.85rem;
}

/* Review Actions */
.review-actions {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
