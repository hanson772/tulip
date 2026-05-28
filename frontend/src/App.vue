<template>
  <div id="app">
    <NavBar v-if="!$route.meta.hideNav" @open-login="showLoginDialog = true" />
    <div class="app-content">
      <router-view />
    </div>
    <BottomNav />
    <LoginDialog v-model="showLoginDialog" />
  </div>
</template>

<script>
import { provide, ref } from 'vue';
import NavBar from './components/NavBar.vue';
import BottomNav from './components/BottomNav.vue';
import LoginDialog from './components/LoginDialog.vue';

export default {
  name: 'App',
  components: { NavBar, BottomNav, LoginDialog },
  setup() {
    const showLoginDialog = ref(false);
    provide('openLogin', () => { showLoginDialog.value = true; });
    return { showLoginDialog };
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f7fa;
  color: #2c3e50;
}

#app {
  min-height: 100vh;
}

.app-content {
  padding-bottom: 64px;
}

a {
  color: #409eff;
  text-decoration: none;
}
</style>
