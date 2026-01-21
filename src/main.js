import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import '@arco-design/web-vue/es/message/style/css.js' // 引入 Message 样式
import '@arco-design/web-vue/es/modal/style/css.js' // 引入 Modal 样式
import './style.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 使用插件
app.use(createPinia())

// 挂载应用
app.mount('#app')
