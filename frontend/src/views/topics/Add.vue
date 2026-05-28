<template>
  <div class="add-page">
    <!-- Fixed Top Bar -->
    <div class="add-topbar">
      <button class="topbar-back" @click="$router.back()">
        <el-icon :size="26"><ArrowLeft /></el-icon>
      </button>
      <div class="topbar-spacer" />
    </div>

    <!-- Content -->
    <div class="add-content">
      <el-input
        v-model="topicTitle"
        :maxlength="200"
        placeholder="主题标题"
        show-word-limit
        class="title-input"
      />
      <el-input
        v-model="topicContent"
        type="textarea"
        :rows="6"
        :maxlength="5000"
        placeholder="主题内容..."
        show-word-limit
      />
      <el-date-picker
        v-model="topicDeadline"
        type="datetime"
        placeholder="截止时间（可选）"
        value-format="YYYY-MM-DDTHH:mm:ss"
        class="deadline-picker"
      />
      <div class="add-actions">
        <el-button
          type="primary"
          :disabled="!topicTitle.trim() || !topicContent.trim()"
          :loading="saving"
          @click="handleSave"
        >
          保存
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';

export default {
  name: 'TopicAdd',
  components: { ArrowLeft },
  setup() {
    const store = useStore();
    const router = useRouter();
    const topicTitle = ref('');
    const topicContent = ref('');
    const topicDeadline = ref(null);
    const saving = ref(false);

    async function handleSave() {
      const title = topicTitle.value.trim();
      const content = topicContent.value.trim();
      if (!title || !content) return;

      saving.value = true;
      const result = await store.dispatch('createTopic', {
        title,
        content,
        deadline: topicDeadline.value || null
      });
      saving.value = false;

      if (result.success) {
        ElMessage.success('草稿已创建');
        router.replace(`/my/topic/edit/${result.data.id}`);
      } else {
        ElMessage.error(result.message);
      }
    }

    return { topicTitle, topicContent, topicDeadline, saving, handleSave };
  }
};
</script>

<style scoped>
.add-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.add-topbar {
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

.add-content {
  padding: 60px 12px 0;
}

.title-input {
  margin-bottom: 12px;
}

.deadline-picker {
  width: 100%;
  margin-bottom: 12px;
}

.add-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
