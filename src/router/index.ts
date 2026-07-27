import { createRouter, createWebHistory } from 'vue-router'
import RoutesView from '../views/RoutesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'routes',
      component: RoutesView,
    },
    {
      path: '/planning',
      name: 'planning',
      component: () => import('../views/PlanningView.vue'),
    },
  ],
})

export default router
