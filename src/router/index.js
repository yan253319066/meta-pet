import { createRouter, createWebHistory } from 'vue-router'
import { appKit } from '@/config/appKit'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: () => import('../views/Marketplace.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/record/:id',
    name: 'Record',
    component: () => import('@/views/Record.vue'),
    meta: {
      title: '拍摄日常'
    }
  },
  {
    path: '/breed-select',
    name: 'BreedSelect',
    component: () => import('@/views/BreedSelect.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('meta-token')
    if (!token) {
      appKit.open()
      return
    }
  }
  next()
})

export default router
