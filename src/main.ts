import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import shadowRoot from 'vue-shadow-dom'
import App from './App.vue'

import './styles/main.css'
import 'uno.css'

const app = createApp(App)
app.use(shadowRoot)
const router = createRouter({
  routes,
  history: createWebHistory(import.meta.env.BASE_URL),
})
app.use(router)
app.mount('#app')
