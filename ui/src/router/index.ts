import { createRouter, createWebHistory } from 'vue-router'
import TwoColumnsLayout from '@/layouts/two-columns/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: TwoColumnsLayout,
      children: [{ path: '', component: () => import('@/views/home/index.vue') }],
    },
  ],
})

export default router
