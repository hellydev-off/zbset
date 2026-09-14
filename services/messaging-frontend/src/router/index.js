import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../store/auth";
import TokenLogin from "../views/TokenLogin.vue";
import ChatList from "../views/ChatList.vue";
import ChatView from "../views/ChatView.vue";
import SocketTester from "../views/SocketTester.vue";

const routes = [
  { path: "/", name: "login", component: TokenLogin },
  { path: "/chats", name: "chats", component: ChatList, meta: { requiresAuth: true } },
  { path: "/chats/:chatId", name: "chat", component: ChatView, meta: { requiresAuth: true }, props: true },
  { path: "/sockets", name: "sockets", component: SocketTester, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.token) {
    return { name: "login" };
  }
  if (to.name === "login" && auth.token) {
    return { name: "chats" };
  }
});

export default router;
