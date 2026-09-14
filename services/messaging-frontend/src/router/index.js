import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../store/auth";
import TokenLogin from "../views/TokenLogin.vue";
import AppShell from "../views/AppShell.vue";
import Feed from "../views/Feed.vue";
import Profile from "../views/Profile.vue";
import ChatsLayout from "../views/ChatsLayout.vue";
import ChatEmptyState from "../views/ChatEmptyState.vue";
import ChatView from "../views/ChatView.vue";
import SocketTester from "../views/SocketTester.vue";

const routes = [
  { path: "/", name: "login", component: TokenLogin },
  {
    path: "/",
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: "feed", name: "feed", component: Feed },
      { path: "profile/:username", name: "profile", component: Profile, props: true },
      {
        path: "chats",
        component: ChatsLayout,
        children: [
          { path: "", name: "chats", component: ChatEmptyState },
          { path: ":chatId", name: "chat", component: ChatView, props: true },
        ],
      },
    ],
  },
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
    return { name: "feed" };
  }
});

export default router;
