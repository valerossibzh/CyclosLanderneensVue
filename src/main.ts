import '@mdi/font/css/materialdesignicons.css'
import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { fr } from 'vuetify/locale'

const vuetify = createVuetify({
  locale: {
    locale: 'fr',
    fallback: 'fr',
    messages: { fr }
  },
  theme: {
    defaultTheme: 'cyclosTheme',
    themes: {
      cyclosTheme: {
        dark: false,
        colors: {
          primary: '#E63946', // Rouge crimson
          secondary: '#1D3557', // Gris ardoise
          background: '#E4E9F2', // Gris légèrement bleuté plus prononcé
          surface: '#FFFFFF',
          error: '#d90429',
          info: '#457b9d',
          success: '#2a9d8f',
          warning: '#e9c46a'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      rounded: 'xl',
      style: 'text-transform: none; letter-spacing: 0.3px; font-weight: 500;'
    },
    VCard: {
      rounded: 'xl',
      elevation: 2
    },
    VAppBar: {
      elevation: 0
    }
  }
})

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
