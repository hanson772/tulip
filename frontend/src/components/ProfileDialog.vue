<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="个人信息"
    width="380px"
    top="8vh"
    destroy-on-close
  >
    <div class="profile-body">
      <!-- Avatar -->
      <div class="profile-avatar-section">
        <div class="avatar-wrapper" @click="showAvatarMenu = !showAvatarMenu">
          <el-avatar :size="72" :src="avatarDisplay" :fit="'cover'" />
          <div class="avatar-overlay">
            <el-icon :size="20"><EditPen /></el-icon>
          </div>
        </div>
        <div v-if="showAvatarMenu" class="avatar-menu-popup">
          <div class="avatar-menu-item" @click="triggerFileInput">上传头像</div>
          <div class="avatar-menu-item" @click="generateAvatar">生成头像</div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display:none"
          @change="onFileChange"
        />
      </div>

      <!-- Form -->
      <el-form label-position="top" class="profile-form">
        <el-form-item label="昵称">
          <el-input v-model="formNickname" placeholder="请输入昵称" maxlength="20" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :model-value="userEmail" disabled placeholder="邮箱不可编辑" />
        </el-form-item>
        <el-form-item label="等级">
          <el-tag type="info" size="large">Lv.{{ userLevel }}</el-tag>
        </el-form-item>
      </el-form>

      <!-- Save -->
      <el-button type="primary" style="width:100%" :loading="saving" @click="handleSave">
        保存
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus';
import { EditPen } from '@element-plus/icons-vue';

const AVATAR_COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C', '#E67E22', '#2ECC71', '#3498DB'];

function makeInitialAvatar(name) {
  const initial = (name || '?')[0].toUpperCase();
  const bgColor = AVATAR_COLORS[(name || '').length % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${bgColor}"/>
    <text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="white" font-size="40" font-family="Arial,Helvetica,sans-serif" font-weight="bold">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function dataSize(data) {
  const comma = data.indexOf(',');
  return Math.round(((data.length - comma - 1) * 3) / 4);
}

export default {
  name: 'ProfileDialog',
  components: { EditPen },
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue'],
  data() {
    return {
      formNickname: '',
      showAvatarMenu: false,
      saving: false,
      localAvatar: null
    };
  },
  computed: {
    user() {
      return this.$store.getters.currentUser || {};
    },
    avatarDisplay() {
      return this.localAvatar || this.user.avatar || makeInitialAvatar(this.user.name);
    },
    userEmail() {
      return this.user.email || '';
    },
    userLevel() {
      return this.user.level || 1;
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.formNickname = this.user.nickname || this.user.name || '';
        this.localAvatar = null;
        this.showAvatarMenu = false;
        document.addEventListener('click', this.closeAvatarMenu);
      } else {
        document.removeEventListener('click', this.closeAvatarMenu);
      }
    }
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeAvatarMenu);
  },
  methods: {
    closeAvatarMenu() {
      this.showAvatarMenu = false;
    },
    triggerFileInput() {
      this.showAvatarMenu = false;
      this.$refs.fileInput?.click();
    },
    generateAvatar() {
      this.showAvatarMenu = false;
      const name = this.user.name;
      if (!name) return;
      const avatar = makeInitialAvatar(this.user.nickname || name);
      this.uploadAvatar(avatar);
    },
    onFileChange(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxSize = 500 * 1024;

      if (file.size <= maxSize) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.uploadAvatar(evt.target.result);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        this.compressAndUpload(img, maxSize);
      };
      img.src = url;
      e.target.value = '';
    },
    compressAndUpload(img, maxSize) {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      function tryQuality(q) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', q);
      }

      let quality = 0.7, low = 0.1, high = 1.0;
      let result = null;

      function step() {
        const data = tryQuality(quality);
        const size = dataSize(data);
        if (Math.abs(size - maxSize) < 10000 || high - low < 0.05) {
          result = data;
        } else if (size > maxSize) {
          high = quality;
          quality = +((low + high) / 2).toFixed(2);
          step();
        } else {
          low = quality;
          quality = +((low + high) / 2).toFixed(2);
          step();
        }
      }
      step();

      if (!result || dataSize(result) > maxSize) {
        function scaleDown() {
          w = Math.round(w * 0.8);
          h = Math.round(h * 0.8);
          quality = 0.8;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const data = canvas.toDataURL('image/jpeg', quality);
          if (dataSize(data) > maxSize && w > 50 && h > 50) {
            scaleDown();
          } else {
            result = data;
          }
        }
        scaleDown();
      }

      this.uploadAvatar(result || tryQuality(0.5));
    },
    async uploadAvatar(base64) {
      const result = await this.$store.dispatch('uploadAvatar', base64);
      if (result.success) {
        this.localAvatar = base64;
        ElMessage.success('头像已更新');
      } else {
        ElMessage.error(result.message || '头像上传失败');
      }
    },
    async handleSave() {
      if (!this.formNickname || !this.formNickname.trim()) {
        ElMessage.warning('昵称不能为空');
        return;
      }
      this.saving = true;
      const result = await this.$store.dispatch('updateProfile', {
        nickname: this.formNickname.trim()
      });
      this.saving = false;
      if (result.success) {
        ElMessage.success('保存成功');
        this.$emit('update:modelValue', false);
      } else {
        ElMessage.error(result.message || '保存失败');
      }
    }
  }
};
</script>

<style scoped>
.profile-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.profile-avatar-section {
  position: relative;
  margin-top: 8px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 50%;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-menu-popup {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 200;
  min-width: 130px;
  overflow: hidden;
}

.avatar-menu-item {
  padding: 10px 18px;
  font-size: 0.85rem;
  color: #303133;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s;
}

.avatar-menu-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.avatar-menu-item:active {
  background: #f5f7fa;
}

.profile-form {
  width: 100%;
}
</style>
