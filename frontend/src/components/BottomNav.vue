<template>
  <div class="bottom-nav">
    <button class="nav-tab" @click="$router.push('/')">
      <el-icon :size="20"><HomeFilled /></el-icon>
      <span class="nav-label">首页</span>
    </button>
    <button class="nav-add" @click="onAddClick">
      <el-icon :size="28"><Plus /></el-icon>
    </button>
    <button class="nav-tab" @click="onProfileClick">
      <el-icon :size="20"><User /></el-icon>
      <span class="nav-label">我</span>
    </button>
  </div>
</template>

<script>
import { inject } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { HomeFilled, Plus, User } from '@element-plus/icons-vue';

export default {
  name: 'BottomNav',
  components: { HomeFilled, Plus, User },
  setup() {
    const store = useStore();
    const router = useRouter();
    const openLogin = inject('openLogin');

    function onAddClick() {
      if (store.getters.isLoggedIn) {
        router.push('/my/topic/add');
      } else {
        openLogin();
      }
    }

    function onProfileClick() {
      if (store.getters.isLoggedIn) {
        router.push('/my');
      } else {
        openLogin();
      }
    }

    return { onAddClick, onProfileClick };
  }
};
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  padding: 0 16px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #909399;
  padding: 4px 12px;
}

.nav-tab:active {
  color: #409eff;
}

.nav-label {
  font-size: 0.7rem;
  line-height: 1;
}

.nav-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: transform 0.15s;
  margin-top: -12px;
}

.nav-add:active {
  transform: scale(0.92);
}
</style>
