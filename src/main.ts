import './assets/scss/main.scss'

import { createApp,reactive  } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'


import 'virtual:svg-icons-register'
import SvgIcon from './components/svgIcon.vue'





const app = createApp(App)
app.component('SvgIcon', SvgIcon)
app.use(router)

app.use(ElementPlus)



// 创建响应式全局变量
const globalState = reactive({
    globalShowKeyPopover:false
  })
  
  // 将全局变量提供给应用
  app.provide('globalState', globalState)
  

app.mount('#app')
