import { createRouter, createWebHistory } from 'vue-router'
import TwoColumnsLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: TwoColumnsLayout,
      children: [{ path: '', component: () => import('@/views/HomeView.vue') }],
    },
  ],
})

export default router
