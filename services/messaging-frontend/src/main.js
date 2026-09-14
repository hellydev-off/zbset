import { createApp } from "vue";
import "./style.css";
import "./store/theme"; // применяет сохранённую тему до первого рендера
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");

// transition на смену темы включаем только ПОСЛЕ первого paint —
// иначе цвета плавно "наезжали" бы друг на друга при самой первой загрузке
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add("theme-transition");
  });
});
