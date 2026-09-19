import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { usePreferencesStore } from './stores/preferences'
import { i18n } from './i18n'
import { initializeGA, trackPageView } from './services/analytics'

const app = createApp(App)
const pinia = createPinia()

initializeGA()
router.afterEach((to) => {
  const safePaths: Record<string, string> = {
    portal: '/portal/:token',
    'verify-email': '/verify-email/:token',
    'verify-email-change': '/verify-email-change/:token',
    'reset-password': '/reset-password/:token',
  }
  trackPageView(safePaths[String(to.name)] ?? to.path)
})

app.use(pinia)
app.use(router)
app.use(i18n)

const preferencesStore = usePreferencesStore()
preferencesStore.initPreferences()

app.mount('#app')
