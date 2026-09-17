import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { usePreferencesStore } from './stores/preferences'
import { i18n } from './i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

const preferencesStore = usePreferencesStore()
preferencesStore.initPreferences()

app.mount('#app')