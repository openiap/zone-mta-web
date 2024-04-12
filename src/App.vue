<template>
  <div class="app">
    <nav class="nav">
      <div class="nav-left">
        <div class="tabs">
          <router-link to="/">Quarantine</router-link>
          <router-link to="/Events">Events</router-link>
          <router-link to="/Domains">Domains</router-link>
          <router-link to="/Configs">Configs</router-link>
          <a href="#" @click.prevent="$oidc.signOut" v-if="$oidc.isAuthenticated">Signout</a>
          <theme-button />
        </div>
      </div>
    </nav>
    <router-view></router-view>
  </div>
</template>
<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import ThemeButton from "@/components/ThemeButton.vue";
import pwaprompter from "@/components/pwaprompter.vue";
import { openiap } from '@openiap/jsapi';
import { config } from "@openiap/jsapi";

import { Util } from './Util'
const  { err, info } = config

var excq = "";
function onMessage(client, message) {
  info("Received message from server: " + message);
}

export default {
  name: 'App',
  methods: {
    ...mapActions(['Signin', 'AddWebpushNotification']),
    ...mapMutations(['setAccessToken', 'setWebPushSubscription']),
    updateAvailable(event) {
      // console.debug('swUpdated', event)
    },
    WebPushSubscribed(event) {
      // console.debug('webpushsubscribed', event.detail);
      // this.setWebPushSubscription(event.detail);
      // this.RegisterWebPush();
    },
    WebpushNotification(notification) {
      // console.debug('webpushnotification', notification);
      // this.AddWebpushNotification(notification);
    },
    RegisterWebPush: async function (val, oldVal) {
      // if (this.WebPushSubscriped == true && this.WebPushSubscription != null) {
      //   // console.debug('RegisterWebPush');
      //   const loco = window.location;
      //   var url = `http:///${this.Config.domain}/webpushsubscribe`
      //   if (this.Config.wsurl.startsWith("wss://")) url = `https:///${this.Config.domain}/webpushsubscribe`
      //   var payload = JSON.parse(JSON.stringify(this.WebPushSubscription));
      //   payload.jwt = this.jwt
      //   payload.host = loco.host
      //   payload.domain = this.Config.domain
      //   payload._type = 'customwebapp'
      //   fetch(url, {
      //     method: "POST",
      //     body: JSON.stringify(payload),
      //     headers: {
      //       "content-type": "application/json"
      //     }
      //   });
      // } else {
      //   // console.debug('RegisterWebPush skipped', this.WebPushSubscriped, this.WebPushSubscription);
      // }
    },
  },
  computed: {
    ...mapGetters(['User', 'AccessToken', 'Signedin', 'Client', 'jwt', 'Config', 'WebPushSubscriped', 'WebPushSubscription']),
    token() {
      return this.$oidc.accessToken
    },
    username() {
      if (!this.User.name) return "";
      return this.User.name;
    },
  },
  watch: {
    Signedin: function (val, oldVal) {
      if (val == true && oldVal != val) {
      }
    },
    token: async function (val, oldVal) {
      if (!Util.IsNullEmpty(val) && oldVal != val) {
        this.setAccessToken(this.token);
        await this.Signin()
      }
    },
    User: async function (val, oldVal) {
      if (!Util.IsNullEmpty(val) && oldVal != val) {
        this.RegisterWebPush();
      }
    },
  },
  async created() {
    document.addEventListener('swUpdated', this.updateAvailable, { once: true })
    document.addEventListener('webpushsubscribed', this.WebPushSubscribed, { once: true })
    if(navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
      navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'webpush') {
        this.WebpushNotification(event.data.data)
      } else {
        console.debug('unknown message', event.data)
      }
    });
    } else {
      console.log("navigator.serviceWorker missing");
    }
    if (!Util.IsNullEmpty(this.token)) {
      this.setAccessToken(this.token);
      await this.Signin()
    }
  },
  components: {
    ThemeButton,
    pwaprompter
  },
}
</script>

<style src='chota/dist/chota.min.css'>

</style>
<style>
.hidden {
  display: none;
}

body {
  margin-left: 10px;
  margin-right: 10px;
}

.nav {
  margin-bottom: 10px;
}
body.dark {
  --bg-color: #000;
  --bg-secondary-color: #131316;
  --bg-hoover-color: #777;
  --font-color: #f5f5f5d7;
  --color-grey: #ccc;
  --color-darkGrey: #777;
  --easy-table-border: 1px solid #445269;
  --easy-table-row-border: 1px solid #445269;
  --easy-table-scrollbar-track-color: #4c5d7a;
  --easy-table-scrollbar-color: #4c5d7a;
  --easy-table-scrollbar-corner-color: #4c5d7a;
  --easy-table-scrollbar-thumb-color: #2d3a4f;
  --easy-table-header-font-color: var(--font--color);
    --easy-table-body-even-row-font-color: var(--font-color);
    --easy-table-body-row-font-color: var(--color-grey);
    --easy-table-body-row-hover-font-color: var(--font-color);
    --easy-table-footer-font-color: var(--font-color);
    --easy-table-body-even-row-background-color: var(--bg-secondary-color);
    --easy-table-body-row-hover-background-color: var(--bg-hoover-color);
    --easy-table-footer-background-color: var(--bg-color-color);
    --easy-table-loading-mask-background-color: var(--bg-color);
    --easy-table-header-background-color: var(--bg-color);
    --easy-table-body-row-background-color: var(--bg-color);
  }
  
  .arrow {
    border-top-color: var(--color-grey) !important;
    border-left-color: var(--color-grey) !important;
  }
body.dark input {
  background-color: var(--bg-secondary-color);
    color: var(--font-color);
  }
  
  body.dark textarea {
    background-color: var(--bg-secondary-color);
  color: var(--font-color);
}

body.dark select {
  background-color: var(--bg-secondary-color);
  color: var(--font-color);
}
</style>
 
/*
--easy-table-header-font-color: #c1cad4;
--easy-table-body-even-row-font-color: #fff;
--easy-table-body-row-font-color: #c0c7d2;
--easy-table-body-row-hover-font-color: #2d3a4f;
--easy-table-footer-font-color: #c0c7d2;

--easy-table-body-even-row-background-color: #4c5d7a;
--easy-table-body-row-hover-background-color: #738bb4;
--easy-table-footer-background-color: #2d3a4f;
--easy-table-loading-mask-background-color: #2d3a4f;
--easy-table-header-background-color: #2d3a4f;
--easy-table-body-row-background-color: #2d3a4f;
*/