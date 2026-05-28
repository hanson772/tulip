<template>
  <div class="tag-manage-page">
    <!-- Fixed Top Bar -->
    <div v-if="!embedded" class="tag-topbar">
      <button class="topbar-back" @click="$router.back()">
        <el-icon :size="26"><ArrowLeft /></el-icon>
      </button>
      <div class="topbar-spacer" />
    </div>

    <!-- Content -->
    <div class="tag-content" :class="{ 'no-topbar': embedded }">
      <!-- Add Tag -->
      <div class="add-tag-section">
        <el-input
          v-model="newTagName"
          :maxlength="20"
          placeholder="输入新标签名称"
          size="large"
          clearable
          class="add-tag-input"
          @keyup.enter="handleAdd"
        />
        <el-button
          type="primary"
          :disabled="!newTagName.trim()"
          :loading="adding"
          @click="handleAdd"
          class="add-tag-btn"
        >
          添加
        </el-button>
      </div>

      <!-- Tag List -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="tags.length === 0" class="empty-state">
        <el-empty description="暂无标签" />
      </div>
      <div v-else class="tag-list">
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="tag-bubble"
          :class="{ 'editing': editingId === tag.id }"
        >
          <!-- Edit mode -->
          <template v-if="editingId === tag.id">
            <el-input
              v-model="editingName"
              :maxlength="20"
              size="small"
              class="edit-input"
              ref="editInputRef"
              @keyup.enter="handleSaveEdit(tag)"
            />
            <div class="tag-bubble-actions">
              <el-button text size="small" @click="cancelEdit">取消</el-button>
              <el-button
                text
                type="primary"
                size="small"
                :disabled="!editingName.trim()"
                :loading="savingEdit"
                @click="handleSaveEdit(tag)"
              >
                保存
              </el-button>
            </div>
          </template>
          <!-- View mode -->
          <template v-else>
            <span class="tag-bubble-name">{{ tag.name }}</span>
            <div class="tag-bubble-opts">
              <el-button
                text
                size="small"
                @click.stop="startEdit(tag)"
                class="tag-btn-icon"
              >
                <el-icon :size="14"><Edit /></el-icon>
              </el-button>
              <el-button
                text
                size="small"
                type="danger"
                @click.stop="handleDelete(tag)"
                class="tag-btn-icon"
              >
                <el-icon :size="14"><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit, Delete } from '@element-plus/icons-vue';

export default {
  name: 'TagManage',
  components: { ArrowLeft, Edit, Delete },
  props: {
    embedded: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const store = useStore();

    const newTagName = ref('');
    const adding = ref(false);
    const loading = ref(false);
    const editingId = ref(null);
    const editingName = ref('');
    const savingEdit = ref(false);
    const editInputRef = ref(null);

    const tags = computed(() => store.getters.tags);

    onMounted(async () => {
      loading.value = true;
      await store.dispatch('fetchTags');
      loading.value = false;
    });

    async function handleAdd() {
      const name = newTagName.value.trim();
      if (!name) return;
      adding.value = true;
      const result = await store.dispatch('createTag', { name });
      adding.value = false;
      if (result.success) {
        ElMessage.success('标签已创建');
        newTagName.value = '';
      } else {
        ElMessage.error(result.message);
      }
    }

    function startEdit(tag) {
      editingId.value = tag.id;
      editingName.value = tag.name;
      nextTick(() => {
        const input = document.querySelector('.edit-input input');
        if (input) input.focus();
      });
    }

    function cancelEdit() {
      editingId.value = null;
      editingName.value = '';
    }

    async function handleSaveEdit(tag) {
      const name = editingName.value.trim();
      if (!name) return;
      savingEdit.value = true;
      const result = await store.dispatch('updateTag', { id: tag.id, name });
      savingEdit.value = false;
      if (result.success) {
        ElMessage.success('标签已更新');
        editingId.value = null;
        editingName.value = '';
      } else {
        ElMessage.error(result.message);
      }
    }

    async function handleDelete(tag) {
      try {
        await ElMessageBox.confirm(
          `确定要删除标签「${tag.name}」吗？`,
          '删除标签',
          {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消'
          }
        );
      } catch {
        return;
      }
      const result = await store.dispatch('deleteTag', tag.id);
      if (result.success) {
        ElMessage.success('标签已删除');
      } else {
        ElMessage.error(result.message);
      }
    }

    return {
      newTagName,
      adding,
      loading,
      editingId,
      editingName,
      savingEdit,
      editInputRef,
      tags,
      handleAdd,
      startEdit,
      cancelEdit,
      handleSaveEdit,
      handleDelete
    };
  }
};
</script>

<style scoped>
.tag-manage-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ---------- Top Bar ---------- */
.tag-topbar {
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
.tag-content {
  padding: 60px 12px 0;
}

.tag-content.no-topbar {
  padding-top: 0;
}

.loading-state {
  padding: 1rem;
}

.empty-state {
  padding: 60px 0;
}

/* ---------- Add Tag Section ---------- */
.add-tag-section {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.add-tag-input {
  flex: 1;
}

.add-tag-btn {
  flex-shrink: 0;
}

/* ---------- Tag List (Bubbles) ---------- */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 14px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #303133;
  transition: box-shadow 0.15s;
}

.tag-bubble:active {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.tag-bubble-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-bubble-opts {
  display: flex;
  gap: 2px;
}

.tag-btn-icon {
  padding: 2px;
  min-height: unset;
  height: auto;
}

.tag-bubble.editing {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #409eff;
  border-radius: 20px;
}

.edit-input {
  width: 100px;
}

.tag-bubble-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
</style>
