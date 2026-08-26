import { createApp } from 'vue'
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import './assets/global.css'
import './assets/theme.css'
import App from './App.vue'
import router from './router'
import { fitText } from './directives/fitText'

createApp(App).use(router).directive('fit-text', fitText).mount('#app')
