import { createApp } from 'vue'
import App from './App.vue'
import configureRouter from './router'
import store from './store'
import Vue3EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';
import { vue3Debounce } from 'vue-debounce'
import { createOidcAuth, SignInType, LogLevel } from 'vue-oidc-client/vue3'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUserSecret, faGlobe, faRobot, faQuestionCircle, faMobileAlt } from '@fortawesome/free-solid-svg-icons'
import { faNodeJs, faGoogle, faWindows } from '@fortawesome/free-brands-svg-icons'

library.add(faUserSecret, faGlobe, faRobot, faQuestionCircle, faMobileAlt, faNodeJs, faGoogle, faWindows)


const loco = window.location;
const appRootUrl = loco.protocol + '//' + loco.host + "/";
async function configureOidc() {
    var res = await fetch("/config.json");
    const data = await res.json();
    return createOidcAuth(
        'main',
        SignInType.Window,
        appRootUrl,
        {
            authority: data.VUE_APP_AUTHORITY,
            client_id: data.VUE_APP_CLIENT_ID,
            client_secret: data.VUE_APP_CLIENT_SECRET,
            response_type: data.VUE_APP_RESPONSE_TYPE,
            scope: 'openid profile email',
            prompt: data.VUE_APP_PROMPT
        },
        console,
        LogLevel.Warn
    );
}
void (async function () {
    const idsrvAuth = await configureOidc()
    const router = await configureRouter(idsrvAuth)
    idsrvAuth.useRouter(router)

    var ok = await idsrvAuth.startup();
    if (!ok) {
        console.error('idsrvAuth startup was not ok')
    }
    const app = createApp(App).use(store).use(router)
    // a little something extra
    store.dispatch('loadStoredState')
    app.config.globalProperties.$oidc = idsrvAuth
    app.component('EasyDataTable', Vue3EasyDataTable)
    app.component('font-awesome-icon', FontAwesomeIcon)
    app.directive('debounce', vue3Debounce({ lock: true }));
    app.use(require('@skadefro/vue-shortkey'))
    app.mount('#app')

    app.config.globalProperties.$filters = {
        str_limit(value, size) {
            if (!value) return '';
            value = value.toString();

            if (value.length <= size) {
                return value;
        }
            return value.substr(0, size) + '...';
        }
    }


})()
