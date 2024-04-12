<template>
    <a @click="toggleTheme" aria-label="Toggle dark mode">
        🌚 {{userTheme}}
    </a>
</template>
      
<script>
export default {
    mounted() {
        const initUserTheme = this.getTheme() || this.getMediaPreference();
        this.setTheme(initUserTheme);
    },
    data() {
        return {
            userTheme: "light",
        };
    },
    methods: {
        toggleTheme() {
            const activeTheme = localStorage.getItem("user-theme");
            if (activeTheme === "light") {
                this.setTheme("dark");
            } else {
                this.setTheme("light");
            }
        },

        getTheme() {
            return localStorage.getItem("user-theme");
        },
        setTheme(theme) {
            localStorage.setItem("user-theme", theme);
            this.userTheme = theme;
            if (theme === "dark") {
                document.body.classList.add("dark");
            } else {
                document.body.classList.remove("dark");
            }
        },
        getMediaPreference() {
            const hasDarkPreference = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;
            if (hasDarkPreference) {
                return "dark";
            } else {
                return "light";
            }
        },
    },
};
</script>
  
<style scoped>
</style>
  