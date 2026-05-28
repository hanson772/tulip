import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import About from '@/views/About.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { hideNav: true }
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/topic/:id',
    name: 'TopicDetail',
    component: () => import('@/views/topics/Detail.vue'),
    meta: { hideNav: true }
  },
  {
    path: '/my/topic/add',
    name: 'TopicAdd',
    component: () => import('@/views/topics/Add.vue'),
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: '/my/tags',
    name: 'TagManage',
    component: () => import('@/views/tags/TagManage.vue'),
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: '/my/:tab?',
    name: 'MyProfile',
    component: () => import('@/views/MyProfile.vue'),
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: '/my/topic/edit/:id',
    name: 'MyTopicEdit',
    component: () => import('@/views/topics/Edit.vue'),
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: '/my/topic/:id',
    name: 'MyTopicView',
    component: () => import('@/views/topics/Detail.vue'),
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: '/console',
    name: 'Console',
    component: () => import('@/views/Console.vue'),
    meta: { requiresAuth: true, hideNav: true }
  },
  {
    path: '/console/review/:id',
    name: 'ConsoleReview',
    component: () => import('@/views/console/Review.vue'),
    meta: { requiresAuth: true, hideNav: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
  if (to.matched.some(route => route.meta.requiresAuth)) {
    const token = localStorage.getItem('token');
    if (!token) {
      next({ name: 'Home' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
