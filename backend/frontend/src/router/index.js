import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth' // Ensure this path is correct relative to src/router/

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchants',
      name: 'merchants',
      component: () => import('../views/MerchantListView.vue')
    },
    {
      path: '/merchants/:id',
      name: 'merchant-detail',
      component: () => import('../views/MerchantDetailView.vue'),
      props: true // Pass route params as props to component
    },
    {
      path: '/book/:merchantId/:serviceId',
      name: 'book',
      component: () => import('../views/BookingView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/my-bookings',
      name: 'my-bookings',
      component: () => import('../views/MyBookingsView.vue'),
      meta: { requiresAuth: true, requiredUserType: 'customer' }
    },
    {
      path: '/merchant-admin',
      name: 'merchant-admin',
      component: () => import('../views/MerchantAdminDashboard.vue'),
      meta: { requiresAuth: true, requiredUserType: 'merchant_admin' }
    },
    {
      path: '/:catchAll(.*)', // Catch-all route for 404
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const currentUserType = authStore.user?.user_type;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.requiredUserType && (!isAuthenticated || currentUserType !== to.meta.requiredUserType)) {
    // Optionally redirect to a forbidden page or home
    alert('Access Denied: You do not have the necessary permissions to view this page.');
    next({ name: 'home' });
  } else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    // If user is already logged in, redirect away from login/register pages
    next({ name: 'home' }); // Or a dashboard page
  } else {
    next();
  }
})

export default router
