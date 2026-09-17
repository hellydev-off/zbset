import { reactive } from "vue";

// Глобальное состояние мессенджера, живущее на уровне AppShell (то есть
// пока пользователь залогинен, а не только пока открыт конкретный чат) —
// нужно, чтобы считать непрочитанные и показывать уведомления, даже когда
// человек сейчас на Ленте или в Профиле, а не в /chats.
const UNREAD_KEY = "msg_frontend_unread_v1";
const DRAFTS_KEY = "msg_frontend_drafts_v1";

function restoreJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const messengerState = reactive({
  unreadCounts: restoreJson(UNREAD_KEY), // chatId -> count. Считается только за время
  // текущей сессии (сервер не отдаёт готовый счётчик непрочитанных), сбрасывается
  // при открытии чата.
  activeChatId: null, // какой чат сейчас реально открыт в ChatView
  drafts: restoreJson(DRAFTS_KEY), // chatId -> недописанный текст
});

function persistUnread() {
  localStorage.setItem(UNREAD_KEY, JSON.stringify(messengerState.unreadCounts));
}

function persistDrafts() {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(messengerState.drafts));
}

export function incrementUnread(chatId) {
  messengerState.unreadCounts[chatId] = (messengerState.unreadCounts[chatId] || 0) + 1;
  persistUnread();
}

export function clearUnread(chatId) {
  if (!messengerState.unreadCounts[chatId]) return;
  delete messengerState.unreadCounts[chatId];
  persistUnread();
}

export function setActiveChat(chatId) {
  messengerState.activeChatId = chatId;
}

export function getDraft(chatId) {
  return messengerState.drafts[chatId] || "";
}

export function setDraft(chatId, text) {
  if (text && text.trim()) messengerState.drafts[chatId] = text;
  else delete messengerState.drafts[chatId];
  persistDrafts();
}
