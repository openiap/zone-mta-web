<template>
    <!--   -->
    <a href="#" @click.prevent="installPWA" v-if="$oidc.isAuthenticated && shown" title="Install as application">📥</a>
    <!-- <a href="#" @click.prevent="EnableNotification">📥Notify</a> -->
</template>
  
<script>
export default {
    name: 'pwaprompt',
    data: () => ({
        shown: false,
    }),

    beforeMount() {
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        }
        // Detects if device is in standalone mode
        const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

        if (isIos() && !isInStandaloneMode()) {
        } else {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault()
                this.installEvent = e
                this.shown = true
            })
        }
    },

    methods: {
        dismissPrompt() {
            this.shown = false
        },

        installPWA() {
            if (this.installEvent != null) {
                this.installEvent.prompt()
                this.installEvent.userChoice.then((choice) => {
                    this.dismissPrompt() // Hide the prompt once the user's clicked
                    if (choice.outcome === 'accepted') {
                        // Do something additional if the user chose to install
                    } else {
                        // Do something additional if the user declined
                    }
                })
            } else {

            }
        },
        EnableNotification() {
            Notification.requestPermission().then((result) => {
                if (result === 'granted') {
                    this.randomNotification();
                }
            });
        },
        randomNotification() {
            const notifTitle = "Hi from vue3-web-template";
            const notifBody = `Created by OpenIAP ApS`;
            const options = {
                body: notifBody,
                icon: '/img/icons/apple-touch-icon-60x60.png',
            };
            new Notification(notifTitle, options);
        },
    }
}
</script>