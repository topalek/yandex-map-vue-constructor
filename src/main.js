import { createApp } from "vue";
import { createYmaps } from "vue-yandex-maps";
import "./style.css";
import App from "./App.vue";

const app = createApp(App);

app.use(
  createYmaps({
    apikey: import.meta.env.VITE_YANDEX_MAP_API,
    lang: "ru_RU",
  })
);

app.mount("#app");
