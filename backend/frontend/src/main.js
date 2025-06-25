import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'


import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth' // Add this line for auth store initialization

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
// Initialize auth store to check for existing token on app load
useAuthStore().initializeAuth();

app.use(router)

app.mount('#app')
