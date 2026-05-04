import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import BulkImport from '../views/BulkImport.vue'
import NotesBrowser from '../views/NotesBrowser.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard
    },
    {
      path: '/import/bulk',
      name: 'BulkImport',
      component: BulkImport
    },
    {
      path: '/browser',
      name: 'NotesBrowser',
      component: NotesBrowser
    }
  ]
})

export default router
