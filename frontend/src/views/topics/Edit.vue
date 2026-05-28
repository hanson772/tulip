<template>
  <div class="edit-page">
    <!-- Fixed Top Bar -->
    <div class="edit-topbar">
      <button class="topbar-back" @click="goBack">
        <el-icon :size="22"><ArrowLeft /></el-icon>
      </button>
      <span class="topbar-title">编辑主题</span>
      <div class="topbar-spacer" />
    </div>

    <!-- Content -->
    <div class="edit-content">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="6" animated />
      </div>

      <template v-else-if="topic">
        <el-card class="topic-editor" shadow="never">
          <el-input
            v-model="editTitle"
            :maxlength="200"
            placeholder="主题标题"
            show-word-limit
            class="title-input"
            :disabled="isReviewing"
          />
          <el-input
            v-model="editContent"
            type="textarea"
            :rows="4"
            :maxlength="5000"
            placeholder="主题内容..."
            show-word-limit
            :disabled="isReviewing"
          />
          <el-date-picker
            v-model="editDeadline"
            type="datetime"
            placeholder="截止时间（可选）"
            value-format="YYYY-MM-DDTHH:mm:ss"
            :disabled="isReviewing"
            class="deadline-picker"
          />
          <div v-if="!isReviewing" class="editor-actions">
            <el-button
              v-if="topicOpinions.length >= 2"
              type="success"
              :disabled="!editTitle.trim() || !editContent.trim()"
              :loading="publishing"
              @click="handlePublish"
            >
              发布
            </el-button>
            <el-button
              type="primary"
              :disabled="!hasChanges || !editTitle.trim() || !editContent.trim()"
              :loading="saving"
              class="save-btn"
              @click="saveDraft"
            >
              保存
            </el-button>
          </div>
        </el-card>

        <!-- Tags Section -->
        <el-card class="tag-section" shadow="never">
          <div class="tag-section-header">
            <h3>标签</h3>
          </div>
          <el-select
            v-model="editTags"
            multiple
            filterable
            allow-create
            :disabled="isReviewing"
            placeholder="选择或创建标签"
            class="tag-select"
          >
            <el-option
              v-for="tag in allTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.name"
            />
          </el-select>
          <div v-if="!isReviewing" class="tag-actions">
            <el-button
              type="warning"
              size="small"
              :disabled="!hasTagChanges"
              :loading="tagSaving"
              @click="saveTags"
            >
              保存标签
            </el-button>
          </div>
        </el-card>

        <!-- Opinion Management -->
        <el-card class="opinion-section" shadow="never">
          <div class="opinion-section-header">
            <h3>看法 ({{ (topicOpinions || []).length }})</h3>
          </div>

          <!-- Add Opinion Form -->
          <div v-if="!isReviewing" class="opinion-add-form">
            <el-input
              v-model="newOpinionContent"
              :maxlength="200"
              placeholder="看法内容（最多200字）"
              show-word-limit
              size="small"
            />
            <div class="opinion-add-options">
              <el-switch
                v-model="newOpinionVisible"
                active-text="可见"
                size="small"
              />
              <el-switch
                v-model="newOpinionSelectable"
                active-text="可支持"
                size="small"
              />
            </div>
            <el-button
              type="primary"
              size="small"
              :disabled="!newOpinionContent.trim()"
              :loading="addingOpinion"
              @click="addOpinion"
            >
              添加
            </el-button>
          </div>

          <!-- Opinions List -->
          <div v-if="!topicOpinions || topicOpinions.length === 0" class="empty-opinions">
            <p>暂无看法，发布前至少添加一条看法</p>
          </div>
          <div v-else class="opinion-list">
            <div
              v-for="opinion in topicOpinions"
              :key="opinion.id"
              class="opinion-manage-item"
            >
              <!-- Edit mode -->
              <template v-if="editingId === opinion.id">
                <el-input
                  v-model="editingContent"
                  :maxlength="200"
                  size="small"
                  class="opinion-content-input"
                  placeholder="看法内容"
                  show-word-limit
                />
                <div class="opinion-manage-controls">
                  <el-switch v-model="editingVisible" active-text="可见" size="small" />
                  <el-switch v-model="editingSelectable" active-text="可支持" size="small" />
                </div>
                <div class="opinion-manage-btns">
                  <el-button size="small" @click="cancelEdit">取消</el-button>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="savingOpinion"
                    @click="saveOpinion(opinion)"
                  >
                    保存
                  </el-button>
                </div>
              </template>

              <!-- View mode -->
              <template v-else>
                <div class="opinion-view-text">{{ opinion.content }}</div>
                <div class="opinion-view-meta">
                  <span>
                    <el-tag v-if="!opinion.visible" size="small" type="info" effect="plain">隐藏</el-tag>
                    <el-tag v-else size="small" type="success" effect="plain">可见</el-tag>
                    <el-tag v-if="opinion.selectable" size="small" type="primary" effect="plain">可支持</el-tag>
                  </span>
                  <span class="opinion-view-btns">
                    <el-button v-if="!isReviewing" text type="primary" size="small" @click="startEdit(opinion)">
                      <el-icon :size="14"><Edit /></el-icon> 编辑
                    </el-button>
                  </span>
                </div>
              </template>
            </div>
          </div>
        </el-card>
      </template>

      <div v-else class="error-state">
        <el-result icon="error" title="主题加载失败">
          <template #extra>
            <el-button type="primary" @click="goBack">返回</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit } from '@element-plus/icons-vue';

export default {
  name: 'TopicEdit',
  components: { ArrowLeft, Edit },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const topicId = Number(route.params.id);
    const loading = ref(true);
    const saving = ref(false);
    const publishing = ref(false);
    const tagSaving = ref(false);

    const editTitle = ref('');
    const editContent = ref('');
    const editDeadline = ref(null);
    const editTags = ref([]);
    const originalTitle = ref('');
    const originalContent = ref('');
    const originalDeadline = ref(null);
    const originalTags = ref([]);

    // Opinion add form
    const newOpinionContent = ref('');
    const newOpinionVisible = ref(true);
    const newOpinionSelectable = ref(true);
    const addingOpinion = ref(false);

    // Opinion inline edit
    const editingId = ref(null);
    const editingContent = ref('');
    const editingVisible = ref(true);
    const editingSelectable = ref(true);
    const savingOpinion = ref(false);

    const currentTopic = computed(() => store.getters.currentTopic);
    const topic = computed(() => currentTopic.value);
    const topicOpinions = computed(() => currentTopic.value?.opinions || []);
    const isReviewing = computed(() => topic.value?.status === 'reviewing');
    const allTags = computed(() => store.getters.tags);

    const hasChanges = computed(() =>
      editTitle.value !== originalTitle.value ||
      editContent.value !== originalContent.value ||
      editDeadline.value !== originalDeadline.value
    );

    const hasTagChanges = computed(() =>
      JSON.stringify([...editTags.value].sort()) !== JSON.stringify([...originalTags.value].sort())
    );

    function initForm(t) {
      editTitle.value = t.title || '';
      editContent.value = t.content || '';
      editDeadline.value = t.deadline || null;
      editTags.value = (t.tags || []).map(tag => tag.name);
      originalTitle.value = t.title || '';
      originalContent.value = t.content || '';
      originalDeadline.value = t.deadline || null;
      originalTags.value = (t.tags || []).map(tag => tag.name);
    }

    onMounted(async () => {
      store.dispatch('fetchTags');
      const result = await store.dispatch('fetchTopic', topicId);
      loading.value = false;
      if (result.success && result.data) {
        initForm(result.data);
      }
    });

    function goBack() {
      router.back();
    }

    async function saveDraft() {
      const title = editTitle.value.trim();
      const content = editContent.value.trim();
      if (!title || !content) return;
      saving.value = true;
      const result = await store.dispatch('updateTopic', {
        id: topicId,
        title,
        content,
        deadline: editDeadline.value || null
      });
      saving.value = false;
      if (result.success) {
        originalTitle.value = title;
        originalContent.value = content;
        originalDeadline.value = editDeadline.value || null;
        ElMessage.success('草稿已保存');
      } else {
        ElMessage.error(result.message);
      }
    }

    async function handlePublish() {
      const title = editTitle.value.trim();
      const content = editContent.value.trim();
      if (!title || !content) return;

      if (hasChanges.value) {
        const saveResult = await store.dispatch('updateTopic', {
          id: topicId,
          title,
          content,
          deadline: editDeadline.value || null
        });
        if (!saveResult.success) {
          ElMessage.error(saveResult.message);
          return;
        }
      }

      try {
        await ElMessageBox.confirm('发布后将无法再编辑，确定发布吗？', '确认发布', {
          type: 'info',
          confirmButtonText: '发布',
          cancelButtonText: '取消'
        });
      } catch {
        return;
      }

      publishing.value = true;
      const result = await store.dispatch('publishTopic', topicId);
      publishing.value = false;
      if (result.success) {
        ElMessage.success('主题已发布');
        router.back();
      } else {
        ElMessage.error(result.message);
      }
    }

    // --- Tags ---

    async function saveTags() {
      tagSaving.value = true;
      const result = await store.dispatch('updateTopic', {
        id: topicId,
        title: editTitle.value,
        content: editContent.value,
        deadline: editDeadline.value || null,
        tags: editTags.value
      });
      tagSaving.value = false;
      if (result.success) {
        originalTags.value = [...editTags.value];
        ElMessage.success('标签已保存');
      } else {
        ElMessage.error(result.message);
      }
    }

    // --- Opinion CRUD ---

    async function addOpinion() {
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

    function startEdit(opinion) {
      editingId.value = opinion.id;
      editingContent.value = opinion.content;
      editingVisible.value = !!opinion.visible;
      editingSelectable.value = !!opinion.selectable;
    }

    function cancelEdit() {
      editingId.value = null;
    }

    async function saveOpinion(opinion) {
      const content = editingContent.value.trim();
      if (!content) {
        ElMessage.warning('看法内容不能为空');
        return;
      }
      savingOpinion.value = true;
      const result = await store.dispatch('updateOpinion', {
        topicId,
        opinionId: opinion.id,
        content,
        visible: editingVisible.value,
        selectable: editingSelectable.value
      });
      savingOpinion.value = false;
      if (result.success) {
        ElMessage.success('保存成功');
        editingId.value = null;
        store.dispatch('fetchTopic', topicId);
      } else {
        ElMessage.error(result.message);
      }
    }

    return {
      loading,
      saving,
      publishing,
      tagSaving,
      editTitle,
      editContent,
      editDeadline,
      editTags,
      hasChanges,
      hasTagChanges,
      newOpinionContent,
      newOpinionVisible,
      newOpinionSelectable,
      addingOpinion,
      editingId,
      editingContent,
      editingVisible,
      editingSelectable,
      savingOpinion,
      topic,
      topicOpinions,
      isReviewing,
      allTags,
      goBack,
      saveDraft,
      handlePublish,
      saveTags,
      addOpinion,
      startEdit,
      cancelEdit,
      saveOpinion,
    };
  }
};
</script>

<style scoped>
.edit-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.edit-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.topbar-back {
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #303133;
  padding: 4px;
}

.topbar-title {
  margin-left: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
}

.topbar-spacer {
  flex: 1;
}

.edit-content {
  padding: 60px 12px 0;
}

.loading-state {
  padding: 1rem;
}

.error-state {
  padding: 40px 0;
}

.topic-editor {
  margin-bottom: 1rem;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.title-input {
  margin-bottom: 0.5rem;
}

.deadline-picker {
  width: 100%;
  margin-bottom: 0.5rem;
}

.editor-actions {
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.save-btn {
  margin-left: auto;
}

.tag-section {
  margin-bottom: 1rem;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.tag-section-header h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #303133;
}

.tag-select {
  width: 100%;
}

.tag-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.opinion-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.opinion-section-header h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #303133;
}

.opinion-add-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.opinion-add-options {
  display: flex;
  gap: 16px;
}

.opinion-list {
  display: flex;
  flex-direction: column;
}

.opinion-manage-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.opinion-manage-item:last-child {
  border-bottom: none;
}

/* View mode */
.opinion-view-text {
  font-size: 0.9rem;
  color: #303133;
  line-height: 1.5;
  margin-bottom: 6px;
}

.opinion-view-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.opinion-view-meta .el-tag {
  margin-right: 4px;
}

.opinion-view-btns {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Edit mode */
.opinion-content-input {
  width: 100%;
}

.opinion-manage-controls {
  display: flex;
  gap: 16px;
  margin: 8px 0;
}

.opinion-manage-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-opinions {
  text-align: center;
  padding: 16px;
  color: #909399;
  font-size: 0.85rem;
}
</style>
