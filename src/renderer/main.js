import Vue from 'vue'
import axios from 'axios'
import Buefy from 'buefy'
import App from './App'
import router from './router'
import store from './store'
import 'buefy/dist/buefy.css'
import 'vue-awesome/icons'
import Icon from 'vue-awesome/components/Icon'
import "@mdi/font/css/materialdesignicons.css"


if(!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
Vue.use(Buefy)
Vue.component('v-icon', Icon)
new Vue({
  components: {App},
  router,
  store,
  template: '<App/>'
}).$mount('#app')

