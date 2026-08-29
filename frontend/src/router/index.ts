import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/home',
    redirect: '/dashboard',
  },
  {
    path: '/',
    component: () => import('../layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('../views/projects/ProjectsView.vue'),
      },
      {
        path: 'projects/:id',
        name: 'project-detail',
        component: () => import('../views/projects/ProjectDetailView.vue'),
      },
      {
        path: 'batches/:id',
        name: 'batch-detail',
        component: () => import('../views/batches/BatchDetailView.vue'),
      },
    ],
  },
  {
    path: '/portal/:token',
    name: 'portal',
    component: () => import('../views/portal/PortalView.vue'),
    meta: { public: true, requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/error/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Allow public routes to bypass auth checks entirely
  if (to.meta.public) {
    return next();
  }

  // If unauthenticated user hits any unknown route, redirect to login
  if (to.name === 'not-found' && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  next();
});

export default router;
