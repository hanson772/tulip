<template>
  <div class="detail-page">
    <!-- Fixed Top Bar -->
    <div class="detail-topbar">
      <button class="topbar-back" @click="$router.back()">
        <el-icon :size="26"><ArrowLeft /></el-icon>
      </button>
      <div class="topbar-spacer" />
      <el-button v-if="isOwner && isMyTopicRoute" text type="primary" size="small" @click="goEdit">
        <el-icon :size="16"><Edit /></el-icon>
        编辑
      </el-button>
    </div>

    <!-- Content -->
    <div class="detail-content">
      <div v-if="currentTopicLoading" class="loading-state">
        <el-skeleton :rows="6" animated />
      </div>

      <template v-else-if="topic">
        <!-- Title -->
        <div class="detail-title-row">
          <h1 class="detail-title">{{ topic.title }}</h1>
        </div>

        <!-- Expired alert -->
        <el-alert
          v-if="topic.status === 'expired'"
          title="该主题已过期，无法进行支持操作"
          type="warning"
          :closable="false"
          show-icon
          class="expired-alert"
        />

        <!-- Author info -->
        <div class="detail-meta">
          <span class="detail-author">{{ topic.author_name }}</span>
          <span class="detail-time">{{ formatTime(topic.created_at) }}</span>
          <span v-if="topic.deadline" class="detail-deadline">
            <el-icon :size="14"><Clock /></el-icon>
            <span>{{ formatDeadline(topic.deadline) }}</span>
          </span>
        </div>

        <!-- Content -->
        <p class="detail-body">{{ topic.content }}</p>

        <hr class="detail-divider">

        <!-- Tags & Favorite -->
        <div class="detail-tags-row">
          <button v-if="topic.status === 'published'" class="favorite-btn" @click="toggleFavorite">
            <el-icon :size="18" :style="{ color: isFavorited ? '#f56c6c' : '#c0c4cc' }"><Star /></el-icon>
          </button>
          <div v-if="topic.tags && topic.tags.length" class="detail-tags">
            <el-tag
              v-for="tag in topic.tags"
              :key="tag.id"
              size="small"
              type="primary"
              effect="plain"
              class="tag-item"
              @click="filterByTag(tag.name)"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>

        <!-- Opinions Section -->
        <div class="opinions-section">
          <div class="opinions-header">
            <h3>看法</h3>
          </div>

          <!-- Add Opinion Form (owner + draft) -->
          <div v-if="showOpinionForm" class="opinion-add-form">
            <el-input
              v-model="newOpinionContent"
              :maxlength="200"
              placeholder="添加看法（最多200字）"
              show-word-limit
              size="small"
            />
            <div class="opinion-add-controls">
              <el-switch v-model="newOpinionVisible" active-text="可见" size="small" />
              <el-switch v-model="newOpinionSelectable" active-text="可支持" size="small" />
              <el-button
                type="primary"
                size="small"
                :disabled="!newOpinionContent.trim()"
                :loading="addingOpinion"
                @click="handleAddOpinion"
              >
                添加
              </el-button>
            </div>
          </div>

          <div v-if="allOpinions.length === 0" class="empty-opinions">
            <p>暂无看法</p>
          </div>

          <div v-else class="opinions-list">
            <div
              v-for="opinion in allOpinions"
              :key="opinion.id"
              class="opinion-item"
            >
              <!-- Inline edit mode (owner + draft) -->
              <template v-if="editingOpinionId === opinion.id">
                <el-input
                  v-model="editingOpinionContent"
                  :maxlength="200"
                  size="small"
                  show-word-limit
                />
                <div class="opinion-edit-controls">
                  <el-switch v-model="editingOpinionVisible" active-text="可见" size="small" />
                  <el-switch v-model="editingOpinionSelectable" active-text="可支持" size="small" />
                </div>
                <div class="opinion-edit-btns">
                  <el-button size="small" @click="cancelEditOpinion">取消</el-button>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="savingOpinion"
                    @click="handleSaveOpinion(opinion)"
                  >
                    保存
                  </el-button>
                </div>
              </template>

              <!-- View mode -->
              <template v-else>
                <div class="opinion-row">
                  <span class="opinion-body">{{ opinion.content }}</span>
                  <div class="opinion-actions">
                    <!-- Owner actions -->
                    <template v-if="isOwner && topic.status === 'draft'">
                      <el-button text type="primary" size="small" @click="startEditOpinion(opinion)">
                        <el-icon :size="14"><Edit /></el-icon>
                      </el-button>
                      <el-button text type="danger" size="small" @click="handleDeleteOpinion(opinion.id)">
                        <el-icon :size="14"><Delete /></el-icon>
                      </el-button>
                    </template>
                    <!-- Support area -->
                    <template v-if="isLoggedIn && topic.status === 'published' && opinion.selectable">
                      <!-- Green support button when no support yet -->
                      <button
                        v-if="!userSupportedOpinionId"
                        class="support-btn"
                        @click="handleSupport(opinion)"
                      >
                        <span>{{ opinion.support_count || 0 }}</span>
                        <el-icon :size="16">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M14.6 2.4c-.4-.3-.9-.4-1.4-.4C12 2 11 2.7 11 4v3H7.5C5.6 7 4 8.6 4 10.5v6c0 1.9 1.6 3.5 3.5 3.5H17c1.8 0 3.3-1.3 3.6-3.1l1.3-6.5C22.1 9 21.1 7.5 19.5 7.5H15V5c0-1.1-.5-2.1-1.4-2.6z"/></svg>
                        </el-icon>
                      </button>
                      <!-- Gray unsupport button when this opinion is being supported -->
                      <button
                        v-else-if="userSupportedOpinionId === opinion.id"
                        class="support-btn is-unsupport"
                        @click="handleSupport(opinion)"
                      >
                        <span>{{ opinion.support_count || 0 }}</span>
                        <el-icon :size="16" class="support-icon-unsupport">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M14.6 2.4c-.4-.3-.9-.4-1.4-.4C12 2 11 2.7 11 4v3H7.5C5.6 7 4 8.6 4 10.5v6c0 1.9 1.6 3.5 3.5 3.5H17c1.8 0 3.3-1.3 3.6-3.1l1.3-6.5C22.1 9 21.1 7.5 19.5 7.5H15V5c0-1.1-.5-2.1-1.4-2.6z"/></svg>
                        </el-icon>
                      </button>
                      <!-- Other opinions when user has supported one: show count only -->
                      <span v-else class="support-count">
                        <span>{{ opinion.support_count || 0 }}</span>
                        <el-icon :size="12"><svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M14.6 2.4c-.4-.3-.9-.4-1.4-.4C12 2 11 2.7 11 4v3H7.5C5.6 7 4 8.6 4 10.5v6c0 1.9 1.6 3.5 3.5 3.5H17c1.8 0 3.3-1.3 3.6-3.1l1.3-6.5C22.1 9 21.1 7.5 19.5 7.5H15V5c0-1.1-.5-2.1-1.4-2.6z"/></svg></el-icon>
                      </span>
                    </template>
                    <!-- Fallback: non-interactive count -->
                    <span v-else class="support-count">
                      <span>{{ opinion.support_count || 0 }}</span>
                      <el-icon :size="12"><svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M14.6 2.4c-.4-.3-.9-.4-1.4-.4C12 2 11 2.7 11 4v3H7.5C5.6 7 4 8.6 4 10.5v6c0 1.9 1.6 3.5 3.5 3.5H17c1.8 0 3.3-1.3 3.6-3.1l1.3-6.5C22.1 9 21.1 7.5 19.5 7.5H15V5c0-1.1-.5-2.1-1.4-2.6z"/></svg></el-icon>
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <div class="comments-header">
            <h3>评论 ({{ allComments.length }})</h3>
          </div>

          <div v-if="allComments.length === 0" class="empty-comments">
            <p>暂无评论</p>
          </div>

          <div v-else class="comments-list">
            <div
              v-for="comment in commentTree"
              :key="comment.id"
              class="comment-item"
            >
              <!-- Top-level comment -->
              <div class="comment-meta">
                <span class="comment-author">{{ comment.author_name }}</span>
                <span v-if="comment.user_id === topic.user_id" class="author-star">
                  <el-icon :size="12"><svg viewBox="0 0 24 24" fill="#f56c6c" width="1em" height="1em"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></el-icon>
                </span>
                <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
              </div>
              <div class="comment-body">{{ comment.content }}</div>

              <!-- Reply button -->
              <div v-if="isLoggedIn && topic.status === 'published'" class="comment-actions">
                <button
                  class="reply-btn"
                  @click="toggleReplyForm(comment.id)"
                >
                  {{ replyingToCommentId === comment.id ? '取消回复' : '回复' }}
                </button>
              </div>

              <!-- Inline reply form -->
              <div v-if="isLoggedIn && topic.status === 'published' && replyingToCommentId === comment.id" class="reply-add-form">
                <el-input
                  v-model="replyContent"
                  :maxlength="500"
                  :placeholder="'回复 @' + comment.author_name"
                  show-word-limit
                  size="small"
                  type="textarea"
                  :rows="2"
                />
                <div class="reply-add-controls">
                  <el-button size="small" @click="cancelReply">取消</el-button>
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="!replyContent.trim()"
                    :loading="addingReply"
                    @click="handleAddReply(comment)"
                  >
                    回复
                  </el-button>
                </div>
              </div>

              <!-- Replies -->
              <div v-if="comment.replies && comment.replies.length" class="replies-list">
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="reply-item"
                >
                  <div class="reply-meta">
                    <span class="reply-author">{{ reply.author_name }}</span>
                    <span v-if="reply.user_id === topic.user_id" class="author-star">
                      <el-icon :size="11"><svg viewBox="0 0 24 24" fill="#f56c6c" width="1em" height="1em"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></el-icon>
                    </span>
                    <span class="reply-time">{{ formatTime(reply.created_at) }}</span>
                  </div>
                  <div class="reply-body">
                    <span v-if="reply.reply_to_name" class="reply-at">@{{ reply.reply_to_name }}</span>
                    {{ reply.content }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Comment (top-level) -->
          <div v-if="isLoggedIn && topic.status === 'published'" class="comment-add-form">
            <el-input
              v-model="newCommentContent"
              :maxlength="500"
              placeholder="写下你的评论..."
              show-word-limit
              size="small"
              type="textarea"
              :rows="2"
            />
            <div class="comment-add-controls">
              <el-button
                type="primary"
                size="small"
                :disabled="!newCommentContent.trim()"
                :loading="addingComment"
                @click="handleAddComment"
              >
                发表评论
              </el-button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="login-prompt">
        <el-icon :size="48" color="#c0c4cc"><Lock /></el-icon>
        <p>主题加载失败</p>
        <el-button type="primary" round @click="$router.back()">返回</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Lock, Edit, Delete, Clock, Star } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'TopicDetail',
  components: { ArrowLeft, Lock, Edit, Delete, Clock, Star },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const topicId = Number(route.params.id);
    const supporting = ref(false);

    // Favorite state
    const isFavorited = ref(false);
    const favoriting = ref(false);
    async function toggleFavorite() {
      if (favoriting.value) return;
      favoriting.value = true;
      const result = await store.dispatch('toggleFavorite', topicId);
      favoriting.value = false;
      if (result.success) {
        isFavorited.value = result.favorited;
      }
    }

    // Opinion add form
    const newOpinionContent = ref('');
    const newOpinionVisible = ref(true);
    const newOpinionSelectable = ref(true);
    const addingOpinion = ref(false);

    // Opinion inline edit
    const editingOpinionId = ref(null);
    const editingOpinionContent = ref('');
    const editingOpinionVisible = ref(true);
    const editingOpinionSelectable = ref(true);
    const savingOpinion = ref(false);

    // Comment
    const newCommentContent = ref('');
    const addingComment = ref(false);

    // Reply
    const replyingToCommentId = ref(null);
    const replyContent = ref('');
    const addingReply = ref(false);

    const topic = computed(() => store.getters.currentTopic);
    const currentTopicLoading = computed(() => store.getters.currentTopicLoading);
    const isLoggedIn = computed(() => store.getters.isLoggedIn);
    const currentUser = computed(() => store.getters.currentUser);

    const isOwner = computed(() => {
      if (!topic.value || !currentUser.value) return false;
      return topic.value.user_id === currentUser.value._id;
    });

    const isMyTopicRoute = computed(() => {
      return route.path.startsWith('/my/topic');
    });

    const showOpinionForm = computed(() => {
      return isOwner.value && topic.value && topic.value.status === 'draft';
    });

    const allOpinions = computed(() => {
      return topic.value?.opinions || [];
    });

    const allComments = computed(() => {
      return topic.value?.comments || [];
    });

    const commentTree = computed(() => {
      const comments = allComments.value;
      const topLevel = [];
      const replyMap = {};
      for (const c of comments) {
        if (c.parent_id) {
          if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
          replyMap[c.parent_id].push(c);
        } else {
          topLevel.push(c);
        }
      }
      return topLevel.map(c => ({
        ...c,
        replies: replyMap[c.id] || []
      }));
    });

    const userSupportedOpinionId = computed(() => topic.value?.user_supported_opinion_id || null);

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

    function statusType(status) {
      const map = { draft: 'info', reviewing: 'warning', published: 'success', expired: 'danger' };
      return map[status] || 'info';
    }
    function statusLabel(status) {
      const map = { draft: '草稿', reviewing: '审核中', published: '已发布', expired: '已过期' };
      return map[status] || status;
    }

    function goEdit() {
      router.push(`/my/topic/edit/${topicId}`);
    }

    function formatDeadline(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr.replace('T', ' '));
      return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    function filterByTag(tagName) {
      router.push({ path: '/', query: { tag: tagName } });
    }

    async function handleSupport(opinion) {
      if (supporting.value) return;
      supporting.value = true;
      const result = await store.dispatch('supportOpinion', {
        topicId,
        opinionId: opinion.id
      });
      supporting.value = false;
      if (!result.success) {
        ElMessage.error(result.message);
      }
    }

    // --- Opinion CRUD ---

    async function handleAddOpinion() {
      const content = newOpinionContent.value.trim();
      if (!content) return;
      addingOpinion.value = true;
      const result = await store.dispatch('createOpinion', {
        topicId,
        content,
        visible: newOpinionVisible.value,
        selectable: newOpinionSelectable.value
      });
      addingOpinion.value = false;
      if (result.success) {
        ElMessage.success('看法已添加');
        newOpinionContent.value = '';
        store.dispatch('fetchTopic', topicId);
      } else {
        ElMessage.error(result.message);
      }
    }

    function startEditOpinion(opinion) {
      editingOpinionId.value = opinion.id;
      editingOpinionContent.value = opinion.content;
      editingOpinionVisible.value = !!opinion.visible;
      editingOpinionSelectable.value = !!opinion.selectable;
    }

    function cancelEditOpinion() {
      editingOpinionId.value = null;
      editingOpinionContent.value = '';
    }

    async function handleSaveOpinion(opinion) {
      const content = editingOpinionContent.value.trim();
      if (!content) {
        ElMessage.warning('看法内容不能为空');
        return;
      }
      savingOpinion.value = true;
      const result = await store.dispatch('updateOpinion', {
        topicId,
        opinionId: opinion.id,
        content,
        visible: editingOpinionVisible.value,
        selectable: editingOpinionSelectable.value
      });
      savingOpinion.value = false;
      if (result.success) {
        ElMessage.success('保存成功');
        editingOpinionId.value = null;
        store.dispatch('fetchTopic', topicId);
      } else {
        ElMessage.error(result.message);
      }
    }

    async function handleDeleteOpinion(opinionId) {
      try {
        await ElMessageBox.confirm('确定删除这条看法吗？', '确认', {
          type: 'warning',
          confirmButtonText: '删除',
          cancelButtonText: '取消'
        });
        const result = await store.dispatch('deleteOpinion', { topicId, opinionId });
        if (result.success) {
          ElMessage.success('已删除');
          store.dispatch('fetchTopic', topicId);
        } else {
          ElMessage.error(result.message);
        }
      } catch {
        // cancelled
      }
    }

    async function handleAddComment() {
      const content = newCommentContent.value.trim();
      if (!content) return;
      addingComment.value = true;
      const result = await store.dispatch('createComment', { topicId, content });
      addingComment.value = false;
      if (result.success) {
        newCommentContent.value = '';
        ElMessage.success('评论已发表');
      } else {
        ElMessage.error(result.message);
      }
    }

    function toggleReplyForm(commentId) {
      if (replyingToCommentId.value === commentId) {
        cancelReply();
      } else {
        replyingToCommentId.value = commentId;
        replyContent.value = '';
      }
    }

    function cancelReply() {
      replyingToCommentId.value = null;
      replyContent.value = '';
    }

    async function handleAddReply(parentComment) {
      const content = replyContent.value.trim();
      if (!content) return;
      addingReply.value = true;
      const result = await store.dispatch('createComment', {
        topicId,
        content,
        parentId: parentComment.id
      });
      addingReply.value = false;
      if (result.success) {
        replyContent.value = '';
        replyingToCommentId.value = null;
        ElMessage.success('回复已发表');
      } else {
        ElMessage.error(result.message);
      }
    }

    onMounted(async () => {
      store.dispatch('fetchTopic', topicId);
      const result = await store.dispatch('checkFavorite', topicId);
      if (result.success) {
        isFavorited.value = result.favorited;
      }
    });

    return {
      topic,
      currentTopicLoading,
      allOpinions,
      allComments,
      commentTree,
      userSupportedOpinionId,
      isFavorited,
      toggleFavorite,
      isLoggedIn,
      isOwner,
      isMyTopicRoute,
      showOpinionForm,
      supporting,
      newOpinionContent,
      newOpinionVisible,
      newOpinionSelectable,
      addingOpinion,
      newCommentContent,
      addingComment,
      replyingToCommentId,
      replyContent,
      addingReply,
      editingOpinionId,
      editingOpinionContent,
      editingOpinionVisible,
      editingOpinionSelectable,
      savingOpinion,
      formatTime,
      statusType,
      statusLabel,
      goEdit,
      formatDeadline,
      filterByTag,
      handleSupport,
      handleAddOpinion,
      startEditOpinion,
      cancelEditOpinion,
      handleSaveOpinion,
      handleDeleteOpinion,
      handleAddComment,
      toggleReplyForm,
      cancelReply,
      handleAddReply,
    };
  },
};
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.loading-state {
  padding: 1rem;
}

/* ---------- Top Bar ---------- */
.detail-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 8px;
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

.topbar-spacer {
  flex: 1;
}

/* ---------- Content ---------- */
.detail-content {
  padding: 60px 16px 0;
}

.detail-title-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-title-row h1 {
  margin: 0;
}

.detail-title-row .el-tag {
  flex-shrink: 0;
  margin-top: 3px;
}

.detail-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-author {
  font-size: 0.85rem;
  font-weight: 600;
  color: #409eff;
}

.detail-time {
  font-size: 0.75rem;
  color: #c0c4cc;
}

.detail-tags-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.favorite-btn {
  display: flex;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.detail-tags .tag-item {
  cursor: pointer;
}

.detail-deadline {
  margin-left: auto;
  font-size: 0.8rem;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.expired-alert {
  margin-bottom: 16px;
}

.detail-body {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #303133;
  white-space: pre-wrap;
  margin: 0 0 20px;
}

.detail-divider {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #e4e7ed, transparent);
  margin: 0 0 20px;
}

/* ---------- Opinions ---------- */
.opinions-section {
  margin-top: 8px;
}

.opinions-header h3 {
  font-size: 1rem;
  color: #303133;
  margin: 0 0 12px;
}

/* Add opinion form */
.opinion-add-form {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.opinion-add-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.empty-opinions {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 0.9rem;
}

.opinions-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.opinion-item {
  padding: 10px 14px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
}

.opinion-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opinion-body {
  flex: 1;
  font-size: 0.9rem;
  color: #303133;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opinion-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.support-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.78rem;
  color: #909399;
}

.support-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid #67c23a;
  border-radius: 16px;
  background: #fff;
  color: #67c23a;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}

.support-btn:hover {
  border-color: #85ce61;
  color: #85ce61;
}

.support-btn.is-unsupport {
  border-color: #dcdfe6;
  color: #c0c4cc;
  background: #fff;
}

.support-btn.is-unsupport:hover {
  border-color: #c0c4cc;
  color: #909399;
}

.support-icon-unsupport {
  transform: rotate(180deg);
}

/* Inline edit */
.opinion-edit-controls {
  display: flex;
  gap: 12px;
  margin: 8px 0;
}

.opinion-edit-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ---------- Comments ---------- */
.comments-section {
  margin-top: 24px;
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.comments-header h3 {
  font-size: 1rem;
  color: #303133;
  margin: 0 0 12px;
}

.empty-comments {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 0.85rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.comment-item {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px 14px;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 0.8rem;
  font-weight: 600;
  color: #409eff;
}

.comment-time {
  font-size: 0.72rem;
  color: #c0c4cc;
}

.author-star {
  display: inline-flex;
  align-items: center;
}

.comment-body {
  font-size: 0.88rem;
  color: #303133;
  line-height: 1.5;
  white-space: pre-wrap;
}

.comment-add-form {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
}

.comment-add-controls {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

/* ---------- Reply ---------- */
.comment-actions {
  margin-top: 6px;
}

.reply-btn {
  font-size: 0.75rem;
  color: #909399;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 0;
}

.reply-btn:hover {
  color: #409eff;
}

.reply-add-form {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.reply-add-controls {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}

.replies-list {
  margin-top: 8px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 2px solid #e4e7ed;
}

.reply-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 0.78rem;
  font-weight: 600;
  color: #409eff;
}

.reply-time {
  font-size: 0.7rem;
  color: #c0c4cc;
}

.reply-body {
  font-size: 0.85rem;
  color: #303133;
  line-height: 1.5;
  white-space: pre-wrap;
}

.reply-at {
  color: #409eff;
  font-weight: 500;
}

/* ---------- Login Prompt ---------- */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.login-prompt p {
  margin: 16px 0;
  font-size: 1rem;
  color: #909399;
}
</style>
