import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import IndexView from '../views/IndexView.vue'

const router = createRouter({
  // history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'index',
      component: IndexView,
      meta: {
        keepAlive: true
      }
    }
  ]
})

export default router
