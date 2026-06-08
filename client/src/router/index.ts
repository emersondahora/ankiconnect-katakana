import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import BulkImport from '../views/BulkImport.vue'
import ManualImport from '../views/ManualImport.vue'
import NotesBrowser from '../views/NotesBrowser.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView
    },
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/import/bulk',
      name: 'BulkImport',
      component: BulkImport,
      meta: { requiresAuth: true }
    },
    {
      path: '/import/manual',
      name: 'ManualImport',
      component: ManualImport,
      meta: { requiresAuth: true }
    },
    {
      path: '/browser',
      name: 'NotesBrowser',
      component: NotesBrowser,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('auth_token')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
