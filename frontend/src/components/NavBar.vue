<template>
  <nav class="navbar">
    <div class="nav-left">
      <router-link to="/" class="nav-brand">Tulip</router-link>
      <div class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </div>
    </div>

    <div class="nav-right">
      <!-- Logged out -->
      <template v-if="!isLoggedIn">
        <el-button size="small" type="primary" round @click="$emit('open-login')">Login</el-button>
      </template>

      <!-- Logged in -->
      <template v-else>
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-trigger">
            <el-avatar :size="28">{{ currentUser?.name?.charAt(0) }}</el-avatar>
            <span class="username">{{ currentUser?.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="isAdmin" command="console">
                <el-icon><Monitor /></el-icon>控制台
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>

      <!-- Mobile hamburger -->
      <el-button class="hamburger-btn" text size="large" @click="mobileMenuOpen = !mobileMenuOpen">
        <el-icon><Operation /></el-icon>
      </el-button>
    </div>

    <!-- Mobile menu -->
    <transition name="fade">
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <router-link to="/" @click="mobileMenuOpen = false">Home</router-link>
        <router-link to="/about" @click="mobileMenuOpen = false">About</router-link>
        <template v-if="!isLoggedIn">
          <a href="#" @click.prevent="$emit('open-login'); mobileMenuOpen = false">Login</a>
        </template>
        <template v-else>
          <router-link v-if="isAdmin" to="/console" @click="mobileMenuOpen = false">控制台</router-link>
          <a href="#" @click.prevent="handleLogout; mobileMenuOpen = false">退出登录</a>
        </template>
      </div>
    </transition>
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { ArrowDown, Monitor, SwitchButton, Operation } from '@element-plus/icons-vue';

export default {
  name: 'NavBar',
  components: { ArrowDown, Monitor, SwitchButton, Operation },
  emits: ['open-login'],
  data() {
    return {
      mobileMenuOpen: false
    };
  },
  computed: {
    ...mapGetters(['isLoggedIn', 'currentUser']),
    isAdmin() {
      return this.$store.getters.hasRole('admin');
    }
  },
  methods: {
    ...mapActions(['logout']),
    handleCommand(command) {
      if (command === 'console') {
        this.$router.push('/console');
      } else if (command === 'logout') {
        this.handleLogout();
      }
    },
    handleLogout() {
      this.logout();
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: #409eff;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.25rem;
}

.nav-links a {
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-exact-active {
  color: #409eff;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f5f7fa;
}

.username {
  font-size: 0.85rem;
  color: #333;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hamburger-btn {
  display: none !important;
}

.mobile-menu {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  z-index: 99;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.mobile-menu a {
  padding: 0.75rem 1.25rem;
  color: #333;
  text-decoration: none;
  font-size: 0.95rem;
}

.mobile-menu a:hover,
.mobile-menu a.router-link-exact-active {
  color: #409eff;
  background: #f5f7fa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .hamburger-btn {
    display: inline-flex !important;
  }

  .username {
    display: none;
  }
}

@media (min-width: 769px) {
  .hamburger-btn {
    display: none !important;
  }

  .mobile-menu {
    display: none !important;
  }
}
</style>
