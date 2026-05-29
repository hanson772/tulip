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
        <el-tab-pane label="用户管理" name="users">
          <div class="users-section">
            <div class="users-search">
              <el-input
                v-model="userSearch"
                placeholder="搜索用户名、邮箱或昵称"
                clearable
                @input="handleUserSearch"
                @clear="fetchUsers"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <div v-if="usersLoading" class="loading-state">
              <el-skeleton :rows="6" animated />
            </div>
            <div v-else-if="users.length === 0" class="empty-state">
              <el-empty description="暂无用户" />
            </div>
            <div v-else class="user-table-wrap">
              <el-table :data="users" style="width: 100%" size="small" stripe>
                <el-table-column label="ID" prop="id" width="50" />
                <el-table-column label="用户名" prop="name" width="90" />
                <el-table-column label="昵称" prop="nickname" width="90" />
                <el-table-column label="邮箱" prop="email" min-width="150" />
                <el-table-column label="等级" prop="level" width="50" align="center" />
                <el-table-column label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.disabled" type="danger" size="small" effect="dark">已禁用</el-tag>
                    <el-tag v-else-if="row.muted" type="warning" size="small" effect="plain">禁言中</el-tag>
                    <el-tag v-else type="success" size="small" effect="plain">正常</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="角色" width="100">
                  <template #default="{ row }">
                    <el-tag
                      v-for="role in (row.roles || [])"
                      :key="role"
                      :type="role === 'admin' ? 'danger' : 'info'"
                      size="small"
                      style="margin-right: 4px"
                    >
                      {{ role === 'admin' ? '管理员' : '用户' }}
                    </el-tag>
                    <span v-if="!row.roles || row.roles.length === 0" class="no-role">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="210" fixed="right">
                  <template #default="{ row }">
                    <div class="action-btns">
                      <el-button
                        v-if="row.disabled"
                        size="small"
                        type="primary"
                        plain
                        :loading="actionLoading === 'enable-' + row.id"
                        @click="handleEnable(row.id)"
                      >启用</el-button>
                      <el-button
                        v-else
                        size="small"
                        type="danger"
                        plain
                        :disabled="row.id === currentUserId"
                        :loading="actionLoading === 'disable-' + row.id"
                        @click="handleDisable(row.id)"
                      >禁用</el-button>
                      <el-button
                        v-if="row.muted"
                        size="small"
                        type="warning"
                        plain
                        :loading="actionLoading === 'unmute-' + row.id"
                        @click="handleUnmute(row.id)"
                      >解禁</el-button>
                      <el-button
                        v-else
                        size="small"
                        type="warning"
                        plain
                        :disabled="row.disabled || row.id === currentUserId"
                        :loading="actionLoading === 'mute-' + row.id"
                        @click="handleMute(row.id)"
                      >禁言</el-button>
                      <el-button
                        size="small"
                        :disabled="row.id === currentUserId"
                        @click="openResetPassword(row)"
                      >改密</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="标签管理" name="tags">
          <TagManage embedded />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Reset Password Dialog -->
    <el-dialog v-model="resetDialogVisible" title="重置密码" width="320px" :close-on-click-modal="false">
      <el-form @submit.prevent="handleResetPassword">
        <el-form-item label="用户" label-width="60px">
          <span>{{ resetTargetUser?.name }} ({{ resetTargetUser?.email }})</span>
        </el-form-item>
        <el-form-item label="新密码" label-width="60px">
          <el-input
            v-model="newPassword"
            type="password"
            placeholder="至少6位字符"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <div class="dialog-footer">
          <el-button @click="resetDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="resettingPassword" @click="handleResetPassword">确定</el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Search } from '@element-plus/icons-vue';
import TagManage from '@/views/tags/TagManage.vue';

const API_BASE_URL = process.env.VUE_APP_API_URL || '/api';

export default {
  name: 'ConsoleView',
  components: { ArrowLeft, Search, TagManage },
  setup() {
    const router = useRouter();
    const store = useStore();
    const activeTab = ref('review');

    // Review
    const reviewTopics = ref([]);
    const loading = ref(false);
    const reviewingId = ref(null);

    // Users
    const users = ref([]);
    const usersLoading = ref(false);
    const userSearch = ref('');
    const actionLoading = ref('');
    let searchTimer = null;

    // Reset password dialog
    const resetDialogVisible = ref(false);
    const resetTargetUser = ref(null);
    const newPassword = ref('');
    const resettingPassword = ref(false);

    const currentUserId = computed(() => store.state.user?._id);

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

    async function fetchUsers() {
      usersLoading.value = true;
      try {
        const params = {};
        if (userSearch.value.trim()) {
          params.search = userSearch.value.trim();
        }
        const response = await axios.get(`${API_BASE_URL}/users/all`, { params });
        users.value = response.data;
      } catch (_) {
        users.value = [];
      } finally {
        usersLoading.value = false;
      }
    }

    function handleUserSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(fetchUsers, 300);
    }

    async function postAction(action, userId) {
      const key = action + '-' + userId;
      actionLoading.value = key;
      try {
        await axios.post(`${API_BASE_URL}/users/${userId}/${action}`);
        ElMessage.success('操作成功');
        await fetchUsers();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败');
      } finally {
        actionLoading.value = '';
      }
    }

    async function handleDisable(id) {
      try {
        await ElMessageBox.confirm('确定要禁用该用户吗？禁用后用户将无法登录。', '确认禁用', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        await postAction('disable', id);
      } catch (_) {}
    }

    async function handleEnable(id) {
      await postAction('enable', id);
    }

    async function handleMute(id) {
      try {
        await ElMessageBox.confirm('确定要禁言该用户吗？禁言后用户将无法发表看法和评论。', '确认禁言', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        await postAction('mute', id);
      } catch (_) {}
    }

    async function handleUnmute(id) {
      await postAction('unmute', id);
    }

    function openResetPassword(user) {
      resetTargetUser.value = user;
      newPassword.value = '';
      resetDialogVisible.value = true;
    }

    async function handleResetPassword() {
      if (!newPassword.value || newPassword.value.length < 6) {
        ElMessage.warning('密码至少6位字符');
        return;
      }
      resettingPassword.value = true;
      try {
        await axios.post(`${API_BASE_URL}/users/${resetTargetUser.value.id}/reset-password`, {
          password: newPassword.value
        });
        ElMessage.success('密码已重置');
        resetDialogVisible.value = false;
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '重置失败');
      } finally {
        resettingPassword.value = false;
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

    function formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr.replace(' ', 'T') + 'Z');
      return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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
      users,
      usersLoading,
      userSearch,
      actionLoading,
      currentUserId,
      resetDialogVisible,
      resetTargetUser,
      newPassword,
      resettingPassword,
      formatTime,
      formatDate,
      goToTopic,
      handleReview,
      fetchUsers,
      handleUserSearch,
      handleDisable,
      handleEnable,
      handleMute,
      handleUnmute,
      openResetPassword,
      handleResetPassword
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

/* ---------- Users ---------- */
.users-section {
  padding: 12px;
}

.users-search {
  margin-bottom: 12px;
}

.user-table-wrap {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.no-role {
  color: #c0c4cc;
}

.action-btns {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
