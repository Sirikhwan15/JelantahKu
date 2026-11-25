import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fontsource-variable/plus-jakarta-sans';
import './assets/styles/main.css';
import App from './App.vue';
import { createAppRouter } from './router';
import { configureApi } from './services/api';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const router = createAppRouter();
const auth = useAuthStore(pinia);

// 401 pada permintaan bertoken = sesi habis: bersihkan sesi dan arahkan ke halaman masuk.
configureApi({
  getToken: () => auth.token,
  onUnauthorized: () => {
    if (!auth.token) return;
    auth.clearSession();
    router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath, reason: 'expired' } });
  },
});

app.use(router);
app.mount('#app');
