<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { currentUserId } from "../store/auth";
import { getChatMessages, sendMessage as sendMessageRest } from "../api/messages";
import { listChats, deleteChatHistory } from "../api/chats";
import { setActiveChat, clearUnread, getDraft, setDraft } from "../store/messenger";
import { uploadAttachment, mediaTypeFromMime, resolveMediaUrl } from "../api/attachments";
import { ensureConnected, getSocket } from "../socket";
import { ripple } from "../utils/ripple";
import Icon from "../components/Icon.vue";
import Lightbox from "../components/Lightbox.vue";
import AudioPlayer from "../components/AudioPlayer.vue";
import VideoPreview from "../components/VideoPreview.vue";
import AttachMenu from "../components/AttachMenu.vue";
import EmojiPicker from "../components/EmojiPicker.vue";
import ForwardModal from "../components/ForwardModal.vue";
import ChatInfoPanel from "../components/ChatInfoPanel.vue";

const props = defineProps({
  chatId: { type: String, required: true },
});

const myId = currentUserId();

const messages = ref([]);
const text = ref("");
const error = ref("");
const listEl = ref(null);
const inputEl = ref(null);
const fileInputEl = ref(null);
const socketStatus = ref("disconnected"); // disconnected | connecting | connected | error

const pendingFile = ref(null);
const uploading = ref(false);
const attachMenuOpen = ref(false);
const emojiPickerOpen = ref(false);
const headerMenuOpen = ref(false);
const clearingHistory = ref(false);
const infoPanelOpen = ref(false);
const forwardMessage = ref(null);

// фон переписки — чисто фронтовая косметика, per-chat, в localStorage
const wallpaper = ref(null);
function loadWallpaper() {
  wallpaper.value = localStorage.getItem("msg_frontend_wallpaper_" + props.chatId) || null;
}
function onWallpaperChange(value) {
  wallpaper.value = value;
  const key = "msg_frontend_wallpaper_" + props.chatId;
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}
function onOpenPhotoFromPanel(messageId) {
  infoPanelOpen.value = false;
  openLightbox(messageId);
}

const recording = ref(false);
const recordingSeconds = ref(0);
const recordingTime = computed(() => {
  const m = Math.floor(recordingSeconds.value / 60);
  const s = recordingSeconds.value % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
});
let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let recordingTimer = null;

const participantIds = ref([]);
const pinnedMessage = ref(null);

const editingMessage = ref(null);
const replyingTo = ref(null);
let pendingReplyTarget = null; // сообщение, на которое отвечаем — ждёт id только что отправленного

const otherParticipantsLabel = computed(() => {
  const other = participantIds.value.filter((id) => id !== myId)[0];
  return other !== undefined ? String(other) : "??";
});

const typingUserIds = ref([]);
const isOtherTyping = computed(() => typingUserIds.value.length > 0);

// контекстное меню сообщения (правый клик или кнопка-шеврон при хавере)
const menu = ref({ visible: false, x: 0, y: 0, message: null });
const quickReactions = ["👍", "❤️", "🔥", "😂", "😮", "😢"];

// --- поиск по уже загруженной истории чата ---
const searchOpen = ref(false);
const searchQuery = ref("");
const searchIndex = ref(0);
const searchInputEl = ref(null);

const searchMatches = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return messages.value.filter((m) => m.text?.toLowerCase().includes(q));
});

watch(searchMatches, (matches) => {
  searchIndex.value = 0;
  if (matches.length) scrollToMessage(matches[0].id);
});

function openSearch() {
  searchOpen.value = true;
  headerMenuOpen.value = false;
  nextTick(() => searchInputEl.value?.focus());
}

function closeSearch() {
  searchOpen.value = false;
  searchQuery.value = "";
}

function goToMatch(delta) {
  if (!searchMatches.value.length) return;
  searchIndex.value = (searchIndex.value + delta + searchMatches.value.length) % searchMatches.value.length;
  scrollToMessage(searchMatches.value[searchIndex.value].id);
}

// instant — при открытии чата/начальной загрузке; smooth — когда уже
// смотришь в чат и прилетает новое сообщение (как в Telegram).
function scrollToBottom(smooth = false) {
  nextTick(() => {
    if (!listEl.value) return;
    if (smooth) {
      listEl.value.scrollTo({ top: listEl.value.scrollHeight, behavior: "smooth" });
    } else {
      listEl.value.scrollTop = listEl.value.scrollHeight;
    }
  });
}

async function loadHistory() {
  try {
    const data = await getChatMessages(Number(props.chatId));
    messages.value = [...data].sort(
      (a, b) => new Date(a.sent_at) - new Date(b.sent_at),
    );
    scrollToBottom();
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  }
}

async function loadChatMeta() {
  try {
    const chats = await listChats(myId);
    const chat = chats.find((c) => c.id === Number(props.chatId));
    if (chat) {
      participantIds.value = chat.participant_ids;
      pinnedMessage.value = chat.pin_message?.text ? chat.pin_message : null;
    }
  } catch {
    // список чатов не критичен для отправки — просто останутся дефолты
  }
}

function onMessageNew(message, chat, viewedResult) {
  if (message.chat_id !== Number(props.chatId)) return;
  if (messages.value.some((m) => m.id === message.id)) return;
  messages.value.push(message);
  scrollToBottom(true);

  // отправка сообщения помечает прочитанными все предыдущие сообщения
  // собеседника (см. changeManyViewed в operations/messages.js) — сервер
  // отдаёт только { count }, без списка id, поэтому просто помечаем
  // на клиенте все сообщения "не от отправителя нового" как прочитанные.
  if (viewedResult?.count > 0) {
    messages.value.forEach((m) => {
      if (m.sender_id !== message.sender_id) m.is_viewed = true;
    });
  }

  // message:send не умеет сам прикреплять answer_to — после того как своё
  // сообщение реально создалось (и у него появился id), дозаявляем ответ
  // отдельным эмитом message:add_answer.
  if (pendingReplyTarget && isMine(message)) {
    const original = pendingReplyTarget;
    pendingReplyTarget = null;
    socket.emit("message:add_answer", {
      chatId: Number(props.chatId),
      messageId: message.id,
      messageAnswerId: original.id,
      sender_id: original.sender_id,
      text: original.text,
      content: original.content,
    });
  }
}

// message:update / message:add_reaction / message:is_viewed все приходят
// как "полное обновлённое сообщение" — просто мержим его в список по id.
function mergeMessage(message) {
  const idx = messages.value.findIndex((m) => m.id === message.id);
  if (idx === -1) return;
  messages.value[idx] = { ...messages.value[idx], ...message };
}

function onMessagePin(chat, message) {
  if (message) mergeMessage(message);
  if (!chat || chat.id !== Number(props.chatId)) return;
  pinnedMessage.value = chat.pin_message;
}

function onMessageUnpin(chat, message) {
  if (message) mergeMessage(message);
  if (!chat || chat.id !== Number(props.chatId)) return;
  pinnedMessage.value = null;
}

function onMessageDelete(deletedMessage, chat) {
  if (!deletedMessage) return;
  const idx = messages.value.findIndex((m) => m.id === deletedMessage.id);
  if (idx !== -1) messages.value.splice(idx, 1);
  if (editingMessage.value?.id === deletedMessage.id) cancelEdit();
  if (chat && chat.id === Number(props.chatId)) {
    pinnedMessage.value = chat.pin_message?.text ? chat.pin_message : null;
  }
}

// Сервер шлёт этот эмит с payload (null, null) — реальный баг в
// deleteChatHistory (chats.service.js возвращает { result: { deleteChatInfo } },
// а контроллер потом читает result.deleteChatInfo с ОДНИМ уровнем вложенности,
// поэтому в emit улетает undefined -> null). Слушатель оставлен рабочим на
// будущее (когда бэк починят, синхронизация у других участников заработает
// сама), но для действия текущего пользователя мы не полагаемся на этот
// эмит — чистим локально сразу после успешного ответа REST (см. clearHistory).
function onChatHistoryDeleted(chat) {
  if (!chat || chat.id !== Number(props.chatId)) return;
  messages.value = [];
  pinnedMessage.value = null;
}

async function clearHistory() {
  headerMenuOpen.value = false;
  if (!confirm("Очистить всю историю этого чата? Действие необратимо.")) return;
  clearingHistory.value = true;
  error.value = "";
  try {
    await deleteChatHistory(Number(props.chatId));
    messages.value = [];
    pinnedMessage.value = null;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    clearingHistory.value = false;
  }
}

function onSocketError(err) {
  error.value = err.message || "socket error";
}

function onTypingStart({ userId }) {
  if (userId === myId) return;
  if (!typingUserIds.value.includes(userId)) typingUserIds.value.push(userId);
}

function onTypingStop({ userId }) {
  typingUserIds.value = typingUserIds.value.filter((id) => id !== userId);
}

let socket = null;

function joinChat() {
  socketStatus.value = "connecting";
  socket = ensureConnected();

  socket.on("connect", () => {
    socketStatus.value = "connected";
    socket.emit("chat:open", { chatId: Number(props.chatId) });
  });
  socket.on("disconnect", () => {
    socketStatus.value = "disconnected";
  });
  socket.on("connect_error", (err) => {
    socketStatus.value = "error";
    error.value = "Сокет: " + err.message;
  });
  socket.on("message:new", onMessageNew);
  socket.on("message:update", mergeMessage);
  socket.on("message:pin", onMessagePin);
  socket.on("message:unpin", onMessageUnpin);
  socket.on("message:delete", onMessageDelete);
  socket.on("message:add_reaction", mergeMessage);
  socket.on("message:is_viewed", mergeMessage);
  socket.on("message:add_answer", mergeMessage);
  socket.on("chat:delete_chat", onChatHistoryDeleted);
  socket.on("typing:start", onTypingStart);
  socket.on("typing:stop", onTypingStop);
  socket.on("error", onSocketError);

  if (socket.connected) {
    socketStatus.value = "connected";
    socket.emit("chat:open", { chatId: Number(props.chatId) });
  }
}

function leaveChat() {
  if (!socket) return;
  socket.emit("chat:close", { chatId: Number(props.chatId) });
  socket.off("message:new", onMessageNew);
  socket.off("message:update", mergeMessage);
  socket.off("message:pin", onMessagePin);
  socket.off("message:unpin", onMessageUnpin);
  socket.off("message:delete", onMessageDelete);
  socket.off("message:add_reaction", mergeMessage);
  socket.off("message:is_viewed", mergeMessage);
  socket.off("message:add_answer", mergeMessage);
  socket.off("chat:delete_chat", onChatHistoryDeleted);
  socket.off("typing:start", onTypingStart);
  socket.off("typing:stop", onTypingStop);
  socket.off("error", onSocketError);
  socket.off("connect");
  socket.off("disconnect");
  socket.off("connect_error");
  stopTyping();
  typingUserIds.value = [];
}

function isMine(m) {
  return m.sender_id === myId;
}

// отмечаем "прочитано" только сообщения собеседника, и только когда бабл
// реально появился в вьюпорте (а не просто загрузился в DOM)
let viewedObserver = null;
const viewedRequested = new Set();

function ensureViewedObserver() {
  if (!viewedObserver) {
    viewedObserver = new IntersectionObserver(onBubbleIntersect, { threshold: 0.6 });
  }
  return viewedObserver;
}

function onBubbleIntersect(entries) {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const id = Number(entry.target.dataset.messageId);
    markViewedIfNeeded(id);
    viewedObserver.unobserve(entry.target);
  }
}

function markViewedIfNeeded(id) {
  const m = messages.value.find((x) => x.id === id);
  if (!m || isMine(m) || m.is_viewed || viewedRequested.has(id)) return;
  viewedRequested.add(id);
  socket?.emit("message:is_viewed", { chatId: Number(props.chatId), messageId: id });
}

function observeBubble(el) {
  if (el) ensureViewedObserver().observe(el);
}

function resetViewedTracking() {
  viewedObserver?.disconnect();
  viewedObserver = null;
  viewedRequested.clear();
}

// Группируем подряд идущие "чистые" фото (без подписи/ответа) одного
// отправителя в альбом — рендерится единой сеткой вместо кучи отдельных
// баблов, как Telegram-альбомы.
function isPhotoOnly(m) {
  return m.content?.isContent && m.content.type === "photo" && !m.text && !m.answer_to;
}

// фото/видео без подписи — пузырь почти без отступов, чтобы картинка не
// "плавала" в толстой рамке, а занимала весь бабл (как в Telegram)
function isMediaOnly(m) {
  return m.content?.isContent && (m.content.type === "photo" || m.content.type === "video") && !m.text;
}

const renderItems = computed(() => {
  const items = [];
  const list = messages.value;
  let i = 0;
  while (i < list.length) {
    const m = list[i];
    if (isPhotoOnly(m)) {
      const group = [m];
      let j = i + 1;
      while (j < list.length && list[j].sender_id === m.sender_id && isPhotoOnly(list[j])) {
        group.push(list[j]);
        j++;
      }
      if (group.length > 1) {
        items.push({ kind: "album", id: "album-" + group[0].id, senderId: m.sender_id, messages: group });
        i = j;
        continue;
      }
    }
    items.push({ kind: "single", id: m.id, senderId: m.sender_id, message: m });
    i++;
  }
  return items;
});

function isGrouped(index) {
  if (index === 0) return false;
  return renderItems.value[index - 1].senderId === renderItems.value[index].senderId;
}

// Все фото чата подряд — по ним листает лайтбокс (в том числе между
// альбомами и одиночными фото).
const photoMessages = computed(() => messages.value.filter((m) => m.content?.isContent && m.content.type === "photo"));

const lightboxIndex = ref(null);
const lightboxPhotos = computed(() =>
  photoMessages.value.map((m) => ({ id: m.id, url: resolveMediaUrl(m.content.url) })),
);

function openLightbox(messageId) {
  const idx = photoMessages.value.findIndex((m) => m.id === messageId);
  if (idx !== -1) lightboxIndex.value = idx;
}

function closeLightbox() {
  lightboxIndex.value = null;
}

// --- контекстное меню ---
function openMenu(evt, message) {
  evt.preventDefault();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuWidth = 220;
  const menuHeight = 260;
  menu.value = {
    visible: true,
    x: Math.min(evt.clientX, vw - menuWidth - 8),
    y: Math.min(evt.clientY, vh - menuHeight - 8),
    message,
  };
}

function openMenuFromButton(evt, message) {
  const rect = evt.currentTarget.getBoundingClientRect();
  const fakeEvt = { preventDefault() {}, clientX: rect.right, clientY: rect.bottom };
  openMenu(fakeEvt, message);
}

function closeMenu() {
  menu.value = { ...menu.value, visible: false };
}

async function copyText() {
  try {
    await navigator.clipboard.writeText(menu.value.message.text || "");
  } catch {
    // буфер обмена недоступен (например, без HTTPS) — просто молча пропускаем
  }
  closeMenu();
}

function startEdit() {
  const m = menu.value.message;
  editingMessage.value = m;
  text.value = m.text;
  closeMenu();
  nextTick(() => inputEl.value?.focus());
}

function cancelEdit() {
  editingMessage.value = null;
  text.value = "";
  resetComposerHeight();
}

function startReply() {
  const m = menu.value.message;
  replyingTo.value = m;
  editingMessage.value = null;
  closeMenu();
  nextTick(() => inputEl.value?.focus());
}

function startForward() {
  forwardMessage.value = menu.value.message;
  closeMenu();
}

function cancelReply() {
  replyingTo.value = null;
}

function scrollToMessage(id) {
  const el = listEl.value?.querySelector(`[data-message-id="${id}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("highlight");
  setTimeout(() => el.classList.remove("highlight"), 1200);
}

function togglePin() {
  const m = menu.value.message;
  if (!socket || socketStatus.value !== "connected") return;
  if (m.is_pin) {
    socket.emit("message:unpin", { chatId: Number(props.chatId), messageId: m.id });
  } else {
    socket.emit("message:pin", { chatId: Number(props.chatId), messageId: m.id });
  }
  closeMenu();
}

function sendReaction(emoji) {
  const m = menu.value.message;
  if (!socket || socketStatus.value !== "connected") return;
  const next = m.reaction === emoji ? null : emoji;
  socket.emit("message:add_reaction", {
    chatId: Number(props.chatId),
    messageId: m.id,
    reaction: next,
  });
  closeMenu();
}

function deleteMessage() {
  const m = menu.value.message;
  if (!socket || socketStatus.value !== "connected") return;
  socket.emit("message:delete", { chatId: Number(props.chatId), messageId: m.id });
  closeMenu();
}

function unpinBanner() {
  if (!socket || socketStatus.value !== "connected" || !pinnedMessage.value) return;
  socket.emit("message:unpin", {
    chatId: Number(props.chatId),
    messageId: pinnedMessage.value.id,
  });
}

// typing:start шлём не на каждую букву, а раз в 1.5с пока печатают;
// typing:stop — через 3с молчания или сразу при отправке/очистке.
let typingActive = false;
let typingStopTimer = null;

function onComposerInput() {
  autoGrowComposer();
  if (!socket || socketStatus.value !== "connected") return;
  if (!typingActive) {
    typingActive = true;
    socket.emit("typing:start", { chatId: Number(props.chatId) });
  }
  clearTimeout(typingStopTimer);
  typingStopTimer = setTimeout(stopTyping, 3000);
}

// textarea растёт вместе с текстом до 40% высоты окна, дальше — скролл внутри
function autoGrowComposer() {
  const el = inputEl.value;
  if (!el) return;
  el.style.height = "auto";
  const max = window.innerHeight * 0.4;
  el.style.height = Math.min(el.scrollHeight, max) + "px";
}

function resetComposerHeight() {
  nextTick(() => {
    if (inputEl.value) inputEl.value.style.height = "";
  });
}

function onComposerKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
}

function stopTyping() {
  clearTimeout(typingStopTimer);
  typingStopTimer = null;
  if (typingActive) {
    typingActive = false;
    if (socket && socketStatus.value === "connected") {
      socket.emit("typing:stop", { chatId: Number(props.chatId) });
    }
  }
}

function toggleAttachMenu() {
  attachMenuOpen.value = !attachMenuOpen.value;
  emojiPickerOpen.value = false;
}

function toggleEmojiPicker() {
  emojiPickerOpen.value = !emojiPickerOpen.value;
  attachMenuOpen.value = false;
}

function onAttachPick(item) {
  attachMenuOpen.value = false;
  const input = fileInputEl.value;
  if (!input) return;
  input.accept = item.accept;
  if (item.capture) input.setAttribute("capture", item.capture);
  else input.removeAttribute("capture");
  input.click();
}

function onFileSelected(e) {
  const file = e.target.files?.[0];
  e.target.value = ""; // сбрасываем, чтобы можно было выбрать тот же файл повторно
  if (!file) return;
  pendingFile.value = file;
}

function cancelPendingFile() {
  pendingFile.value = null;
}

function insertEmoji(emoji) {
  const el = inputEl.value;
  if (!el) {
    text.value += emoji;
    return;
  }
  const start = el.selectionStart ?? text.value.length;
  const end = el.selectionEnd ?? text.value.length;
  text.value = text.value.slice(0, start) + emoji + text.value.slice(end);
  onComposerInput();
  nextTick(() => {
    el.focus();
    const pos = start + emoji.length;
    el.setSelectionRange(pos, pos);
  });
}

async function sendSticker(emoji) {
  emojiPickerOpen.value = false;
  if (!socket || socketStatus.value !== "connected") return;
  error.value = "";
  try {
    await sendMessageRest({
      chatId: Number(props.chatId),
      text: emoji,
      content: { isContent: false },
    });
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  }
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function pickAudioMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
}

function stopMediaStream() {
  mediaStream?.getTracks().forEach((t) => t.stop());
  mediaStream = null;
}

async function startRecording() {
  error.value = "";
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    error.value = "Нет доступа к микрофону: " + e.message;
    return;
  }
  recordedChunks = [];
  const mimeType = pickAudioMimeType();
  mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.start();
  recording.value = true;
  recordingSeconds.value = 0;
  recordingTimer = setInterval(() => {
    recordingSeconds.value++;
  }, 1000);
}

function cancelRecording() {
  clearInterval(recordingTimer);
  recording.value = false;
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
  }
  stopMediaStream();
  recordedChunks = [];
}

async function stopRecordingAndSend() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  clearInterval(recordingTimer);
  recording.value = false;

  const blob = await new Promise((resolve) => {
    mediaRecorder.onstop = () =>
      resolve(new Blob(recordedChunks, { type: mediaRecorder.mimeType }));
    mediaRecorder.stop();
  });
  stopMediaStream();

  if (!socket || socketStatus.value !== "connected") return;
  try {
    uploading.value = true;
    const ext = blob.type.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
    const attachment = await uploadAttachment(Number(props.chatId), file);
    await sendMessageRest({
      chatId: Number(props.chatId),
      text: "",
      content: { isContent: true, type: "audio", url: attachment.url },
    });
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    uploading.value = false;
  }
}

async function onSend() {
  const value = text.value.trim();
  // текст обязателен, только если нет вложения — фото/видео можно слать без подписи
  if ((!value && !pendingFile.value) || !socket || socketStatus.value !== "connected") return;
  error.value = "";
  stopTyping();

  if (editingMessage.value) {
    socket.emit("message:update", {
      id: editingMessage.value.id,
      newMessage: value,
      chatId: Number(props.chatId),
    });
    cancelEdit();
    return;
  }

  if (replyingTo.value) {
    pendingReplyTarget = replyingTo.value;
    replyingTo.value = null;
  }

  const file = pendingFile.value;
  pendingFile.value = null;
  text.value = "";
  resetComposerHeight();

  // Само сообщение теперь создаётся через REST (нужно для вложений),
  // а не эмитом message:send — сервер после создания всё равно рассылает
  // message:new по сокету, так что onMessageNew отработает как раньше.
  try {
    let content = { isContent: false };
    if (file) {
      uploading.value = true;
      const attachment = await uploadAttachment(Number(props.chatId), file);
      const type = mediaTypeFromMime(attachment.mime_type);
      content = {
        isContent: true,
        type,
        url: attachment.url,
        ...(type === "file" ? { name: attachment.original_name, size: attachment.size } : {}),
      };
    }
    await sendMessageRest({ chatId: Number(props.chatId), text: value, content });
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
    pendingReplyTarget = null;
  } finally {
    uploading.value = false;
  }
}

function onGlobalClick(e) {
  if (menu.value.visible && !e.target.closest(".msg-menu")) closeMenu();
  if (attachMenuOpen.value && !e.target.closest(".attach-anchor")) attachMenuOpen.value = false;
  if (emojiPickerOpen.value && !e.target.closest(".emoji-anchor")) emojiPickerOpen.value = false;
  if (headerMenuOpen.value && !e.target.closest(".header-menu-anchor")) headerMenuOpen.value = false;
}

function onKeydown(e) {
  if (e.key === "Escape") {
    if (menu.value.visible) closeMenu();
    else if (attachMenuOpen.value) attachMenuOpen.value = false;
    else if (emojiPickerOpen.value) emojiPickerOpen.value = false;
    else if (headerMenuOpen.value) headerMenuOpen.value = false;
    else if (searchOpen.value) closeSearch();
    else if (editingMessage.value) cancelEdit();
    else if (replyingTo.value) cancelReply();
  }
}

async function openChat() {
  messages.value = [];
  cancelEdit();
  cancelReply();
  cancelPendingFile();
  cancelRecording();
  attachMenuOpen.value = false;
  emojiPickerOpen.value = false;
  headerMenuOpen.value = false;
  infoPanelOpen.value = false;
  forwardMessage.value = null;
  closeSearch();
  pendingReplyTarget = null;
  resetViewedTracking();
  setActiveChat(Number(props.chatId));
  clearUnread(Number(props.chatId));
  text.value = getDraft(Number(props.chatId));
  loadWallpaper();
  resetComposerHeight();
  await loadChatMeta();
  await loadHistory();
  joinChat();
}

// Черновик — сохраняем недописанный текст в реактивную стору (переживает
// переключение между чатами и перезагрузку страницы), чистим при отправке
// (onSend обнуляет text.value, вотчер сам уберёт пустой черновик).
watch(text, (value) => {
  setDraft(Number(props.chatId), value);
});

onMounted(() => {
  openChat();
  window.addEventListener("click", onGlobalClick);
  window.addEventListener("keydown", onKeydown);
});
onUnmounted(() => {
  leaveChat();
  resetViewedTracking();
  cancelRecording();
  setActiveChat(null);
  window.removeEventListener("click", onGlobalClick);
  window.removeEventListener("keydown", onKeydown);
});

watch(
  () => props.chatId,
  () => {
    leaveChat();
    openChat();
  },
);
</script>

<template>
  <div class="chat">
    <div class="header">
      <template v-if="searchOpen">
        <button type="button" class="icon-btn" @click="closeSearch">
          <Icon name="arrow-left" :size="20" />
        </button>
        <input
          ref="searchInputEl"
          v-model="searchQuery"
          class="header-search-input"
          placeholder="Поиск по сообщениям"
          @keydown.enter="goToMatch(1)"
          @keydown.esc="closeSearch"
        />
        <div class="header-search-nav">
          <span v-if="searchQuery.trim()" class="header-search-count">
            {{ searchMatches.length ? searchIndex + 1 + "/" + searchMatches.length : "0" }}
          </span>
          <button type="button" class="icon-btn" :disabled="!searchMatches.length" @click="goToMatch(-1)">
            <Icon name="chevron-down" :size="16" class="flip" />
          </button>
          <button type="button" class="icon-btn" :disabled="!searchMatches.length" @click="goToMatch(1)">
            <Icon name="chevron-down" :size="16" />
          </button>
          <button type="button" class="icon-btn" @click="closeSearch"><Icon name="x" :size="18" /></button>
        </div>
      </template>
      <template v-else>
        <router-link :to="{ name: 'chats' }" class="icon-btn back-btn">
          <Icon name="arrow-left" :size="20" />
        </router-link>
        <button type="button" class="header-info-btn" @click="infoPanelOpen = true">
          <span class="avatar">{{ otherParticipantsLabel.slice(0, 2) }}</span>
          <div class="header-info">
            <span class="chat-title">Чат #{{ chatId }}</span>
            <span v-if="isOtherTyping" class="chat-sub typing">
              печатает
              <span class="typing-dots"><span></span><span></span><span></span></span>
            </span>
            <span v-else class="chat-sub" :class="socketStatus">{{
              socketStatus === "connected" ? "в сети" : socketStatus
            }}</span>
          </div>
        </button>
        <div class="header-actions">
          <button class="icon-btn" tabindex="-1"><Icon name="phone" :size="18" /></button>
          <button class="icon-btn" type="button" @click="openSearch"><Icon name="search" :size="18" /></button>
          <div class="header-menu-anchor">
            <button class="icon-btn" type="button" @click.stop="headerMenuOpen = !headerMenuOpen">
              <Icon name="more-horizontal" :size="18" />
            </button>
            <Transition name="menu-pop">
              <div v-if="headerMenuOpen" class="header-menu">
                <button type="button" class="header-menu-item" @click="infoPanelOpen = true; headerMenuOpen = false">
                  <Icon name="image" :size="16" /> Медиа и файлы
                </button>
                <button type="button" class="header-menu-item danger" :disabled="clearingHistory" @click="clearHistory">
                  <Icon name="trash" :size="16" /> Очистить историю
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </template>
    </div>

    <div v-if="pinnedMessage?.text" class="pinned-banner">
      <Icon name="pin" :size="16" class="pin-banner-icon" />
      <div class="pinned-info">
        <span class="pinned-label">Закреплённое сообщение</span>
        <span class="pinned-text">{{ pinnedMessage.text }}</span>
      </div>
      <button class="icon-btn" title="Открепить" @click="unpinBanner">
        <Icon name="x" :size="16" />
      </button>
    </div>

    <Transition name="chat-fade">
      <div :key="chatId" ref="listEl" class="messages scroll-thin" :style="{ background: wallpaper || undefined }">
        <TransitionGroup name="msg" tag="div" class="messages-inner">
          <template v-for="(item, i) in renderItems" :key="item.id">
            <!-- альбом: несколько "чистых" фото подряд от одного автора -->
            <div
              v-if="item.kind === 'album'"
              class="bubble-row"
              :class="{ mine: item.senderId === myId, grouped: isGrouped(i) }"
            >
              <div class="bubble album-bubble" :class="'album-count-' + item.messages.length">
                <div
                  v-for="am in item.messages"
                  :key="am.id"
                  class="album-tile"
                  :data-message-id="am.id"
                  :ref="observeBubble"
                  @click="openLightbox(am.id)"
                  @contextmenu="openMenu($event, am)"
                >
                  <img :src="resolveMediaUrl(am.content.url)" class="album-img" />
                </div>
              </div>
            </div>

            <!-- одиночное сообщение -->
            <div
              v-else
              class="bubble-row"
              :class="{ mine: isMine(item.message), grouped: isGrouped(i) }"
            >
              <div
                class="bubble"
                :class="{ 'media-only': isMediaOnly(item.message) }"
                :data-message-id="item.message.id"
                :ref="observeBubble"
                @contextmenu="openMenu($event, item.message)"
              >
                <button class="msg-more-btn" @click.stop="openMenuFromButton($event, item.message)">
                  <Icon name="chevron-down" :size="14" />
                </button>
                <div
                  v-if="!isGrouped(i)"
                  class="meta"
                  :class="{ 'meta-overlay': isMediaOnly(item.message) }"
                >
                  {{ item.message.sender_type }} #{{ item.message.sender_id }}
                </div>
                <div
                  v-if="item.message.answer_to"
                  class="quote-block"
                  @click.stop="scrollToMessage(item.message.answer_to.id)"
                >
                  <span class="quote-sender">#{{ item.message.answer_to.sender_id }}</span>
                  <span class="quote-text">{{ item.message.answer_to.text }}</span>
                </div>
                <div v-if="item.message.content?.isContent" class="media-block">
                  <img
                    v-if="item.message.content.type === 'photo'"
                    :src="resolveMediaUrl(item.message.content.url)"
                    class="media-img"
                    @click="openLightbox(item.message.id)"
                  />
                  <VideoPreview
                    v-else-if="item.message.content.type === 'video'"
                    :src="resolveMediaUrl(item.message.content.url)"
                  />
                  <AudioPlayer
                    v-else-if="item.message.content.type === 'audio'"
                    :src="resolveMediaUrl(item.message.content.url)"
                    :mine="isMine(item.message)"
                  />
                  <a
                    v-else-if="item.message.content.type === 'file'"
                    :href="resolveMediaUrl(item.message.content.url)"
                    target="_blank"
                    rel="noopener"
                    class="file-card"
                  >
                    <span class="file-card-icon"><Icon name="file-text" :size="22" /></span>
                    <span class="file-card-info">
                      <span class="file-card-name">{{ item.message.content.name || "Файл" }}</span>
                      <span class="file-card-size">{{ formatFileSize(item.message.content.size) }}</span>
                    </span>
                    <Icon name="download" :size="18" class="file-card-download" />
                  </a>
                </div>
                <div v-if="item.message.text" class="text">{{ item.message.text }}</div>
                <div class="tail-row" :class="{ 'tail-overlay': isMediaOnly(item.message) }">
                  <Icon v-if="item.message.is_pin" name="pin" :size="12" class="pin-mark" />
                  <span v-if="item.message.updated_at" class="edited-mark">ред.</span>
                  <span class="time">{{ new Date(item.message.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }}</span>
                  <span v-if="isMine(item.message)" class="tick-wrap">
                    <Transition name="tick-morph">
                      <Icon
                        :key="item.message.is_viewed ? 'double' : 'single'"
                        :name="item.message.is_viewed ? 'check-double' : 'check'"
                        :size="14"
                        class="tick"
                      />
                    </Transition>
                  </span>
                </div>
                <Transition name="pop">
                  <span v-if="item.message.reaction" :key="item.message.reaction" class="reaction-badge">{{ item.message.reaction }}</span>
                </Transition>
              </div>
            </div>
          </template>
        </TransitionGroup>
        <p v-if="messages.length === 0" class="hint">Сообщений пока нет</p>
      </div>
    </Transition>

    <Lightbox
      v-if="lightboxIndex !== null"
      :photos="lightboxPhotos"
      :start-index="lightboxIndex"
      @close="closeLightbox"
    />

    <ForwardModal v-if="forwardMessage" :message="forwardMessage" @close="forwardMessage = null" />

    <ChatInfoPanel
      v-if="infoPanelOpen"
      :chat-id="chatId"
      :messages="messages"
      :wallpaper="wallpaper"
      @close="infoPanelOpen = false"
      @open-photo="onOpenPhotoFromPanel"
      @update:wallpaper="onWallpaperChange"
    />

    <p v-if="error" class="error error-bar">{{ error }}</p>

    <div v-if="editingMessage" class="editing-bar">
      <Icon name="pencil" :size="14" />
      <span>Редактирование сообщения</span>
      <button class="icon-btn" @click="cancelEdit"><Icon name="x" :size="14" /></button>
    </div>

    <div v-if="replyingTo" class="editing-bar reply-bar">
      <div class="reply-bar-quote">
        <span class="reply-bar-sender">Ответ #{{ replyingTo.sender_id }}</span>
        <span class="reply-bar-text">{{ replyingTo.text }}</span>
      </div>
      <button class="icon-btn" @click="cancelReply"><Icon name="x" :size="14" /></button>
    </div>

    <div v-if="pendingFile" class="editing-bar attach-bar">
      <Icon name="paperclip" :size="14" />
      <span>{{ pendingFile.name }}</span>
      <button class="icon-btn" @click="cancelPendingFile"><Icon name="x" :size="14" /></button>
    </div>

    <form class="composer" @submit.prevent="onSend">
      <input
        ref="fileInputEl"
        type="file"
        class="hidden-file-input"
        @change="onFileSelected"
      />
      <div class="attach-anchor">
        <button class="icon-btn" type="button" :disabled="recording" @click.stop="toggleAttachMenu">
          <Icon name="paperclip" :size="20" />
        </button>
        <Transition name="menu-pop">
          <AttachMenu v-if="attachMenuOpen" @pick="onAttachPick" />
        </Transition>
      </div>

      <template v-if="recording">
        <span class="recording-indicator">
          <span class="recording-dot"></span>
          {{ recordingTime }}
        </span>
        <div class="composer-spacer"></div>
        <button class="icon-btn" type="button" @click="cancelRecording">
          <Icon name="trash" :size="18" />
        </button>
      </template>
      <textarea
        v-else
        ref="inputEl"
        v-model="text"
        rows="1"
        placeholder="Сообщение..."
        class="composer-textarea"
        :disabled="socketStatus !== 'connected'"
        @input="onComposerInput"
        @keydown="onComposerKeydown"
      ></textarea>

      <div v-if="!recording" class="emoji-anchor">
        <button class="icon-btn" type="button" @click.stop="toggleEmojiPicker">
          <Icon name="smile" :size="20" />
        </button>
        <Transition name="menu-pop">
          <EmojiPicker v-if="emojiPickerOpen" @pick="insertEmoji" @sticker="sendSticker" />
        </Transition>
      </div>

      <button
        v-if="recording"
        class="send-btn"
        type="button"
        @mousedown="ripple"
        @click="stopRecordingAndSend"
      >
        <Icon name="check" :size="18" />
      </button>
      <button
        v-else-if="!text.trim() && !pendingFile"
        class="send-btn"
        type="button"
        :disabled="socketStatus !== 'connected'"
        @mousedown="ripple"
        @click="startRecording"
      >
        <Icon name="mic" :size="18" />
      </button>
      <button
        v-else
        class="send-btn"
        type="submit"
        :disabled="socketStatus !== 'connected' || uploading"
        @mousedown="ripple"
      >
        <Icon name="send" :size="18" />
      </button>
    </form>

    <!-- контекстное меню сообщения -->
    <Transition name="menu-pop">
      <div
        v-if="menu.visible"
        class="msg-menu"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
      >
        <div class="reaction-row">
          <button
            v-for="emoji in quickReactions"
            :key="emoji"
            class="reaction-btn"
            :class="{ active: menu.message.reaction === emoji }"
            @click="sendReaction(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
        <div class="menu-divider"></div>
        <button class="menu-item" @mousedown="ripple" @click="startReply">
          <Icon name="reply" :size="16" /> Ответить
        </button>
        <button class="menu-item" @mousedown="ripple" @click="startForward">
          <Icon name="forward" :size="16" /> Переслать
        </button>
        <button class="menu-item" @mousedown="ripple" @click="copyText">
          <Icon name="copy" :size="16" /> Копировать текст
        </button>
        <button v-if="isMine(menu.message)" class="menu-item" @mousedown="ripple" @click="startEdit">
          <Icon name="pencil" :size="16" /> Изменить
        </button>
        <button class="menu-item" @mousedown="ripple" @click="togglePin">
          <Icon name="pin" :size="16" />
          {{ menu.message.is_pin ? "Открепить" : "Закрепить" }}
        </button>
        <div class="menu-divider"></div>
        <div class="menu-timestamp">
          {{ new Date(menu.message.sent_at).toLocaleString() }}
        </div>
        <button
          v-if="isMine(menu.message)"
          class="menu-item danger"
          @mousedown="ripple"
          @click="deleteMessage"
        >
          <Icon name="trash" :size="16" /> Удалить
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  min-height: 58px;
  border-bottom: 1px solid var(--border);
  flex: 0 0 auto;
}

.header .avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-bg);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}

.header-info-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: none;
  padding: 4px 6px;
  border-radius: 10px;
  text-align: left;
}

.header-info-btn:hover {
  background: var(--bg-soft);
}

.header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.chat-title {
  font-weight: 600;
  color: var(--text-h);
  font-size: 15px;
}

.chat-sub {
  font-size: 12px;
  opacity: 0.65;
}

.header-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: var(--bg-soft);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 14px;
}

.header-search-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}

.header-search-count {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 4px;
  white-space: nowrap;
}

.header-search-nav .flip {
  transform: rotate(180deg);
}

.chat-sub.connected {
  color: var(--accent);
  opacity: 1;
}

.chat-sub.typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  opacity: 1;
  font-style: italic;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  position: relative;
  overflow: hidden;
  border: none;
  background: none;
  color: var(--text);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  opacity: 0.75;
  transition: background-color 120ms ease;
}

.icon-btn:hover {
  background: var(--bg-soft);
}

.header-actions .icon-btn {
  cursor: default;
}

.header-actions .icon-btn:hover {
  background: none;
}

.header-menu-anchor {
  position: relative;
}

.header-menu-anchor .icon-btn {
  cursor: pointer;
}

.header-menu-anchor .icon-btn:hover {
  background: var(--bg-soft);
}

.header-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--bg-elevated);
  border-radius: 12px;
  box-shadow: var(--shadow-elevated);
  padding: 6px;
  min-width: 200px;
  z-index: 30;
}

.header-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 9px 10px;
  border-radius: 8px;
  font-size: 14px;
  text-align: left;
  color: var(--text-h);
}

.header-menu-item:hover {
  background: var(--bg-soft);
}

.header-menu-item.danger {
  color: var(--danger);
}

.pinned-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex: 0 0 auto;
}

.pin-banner-icon {
  color: var(--accent);
  flex: 0 0 auto;
}

.pinned-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pinned-label {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

.pinned-text {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--bg-chat);
  min-height: 0;
  position: relative;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bubble-row {
  display: flex;
}

.bubble-row.grouped {
  margin-top: -2px;
}

.bubble-row.mine {
  justify-content: flex-end;
}

.bubble {
  position: relative;
  max-width: 75%;
  padding: 8px 34px 8px 12px;
  border-radius: 18px;
  background: var(--bubble-other);
  color: var(--bubble-other-text);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}

.bubble.highlight {
  box-shadow: 0 0 0 2px var(--accent);
}

.bubble-row:not(.mine) .bubble {
  border-bottom-left-radius: 4px;
}

.bubble-row.mine .bubble {
  background: var(--bubble-mine);
  color: var(--bubble-mine-text);
  border-bottom-right-radius: 4px;
}

/* фото/видео без подписи — почти без рамки, картинка занимает весь бабл */
.bubble.media-only {
  padding: 3px;
}

.bubble.media-only .media-block {
  margin-bottom: 0;
}

.bubble.media-only .media-img {
  border-radius: 15px;
}

.bubble.media-only :deep(.vp-video),
.bubble.media-only :deep(.vp-overlay) {
  border-radius: 15px;
}

.bubble.media-only .msg-more-btn {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

/* имя отправителя и время/галочки лежат прямо на фото, как в Telegram,
   а не отдельными строками над/под ним */
.meta-overlay {
  position: absolute;
  top: 9px;
  left: 12px;
  z-index: 2;
  margin: 0;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  opacity: 1;
}

.tail-overlay {
  position: absolute;
  bottom: 9px;
  right: 12px;
  z-index: 2;
  margin: 0;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

.tail-overlay .time,
.tail-overlay .edited-mark {
  opacity: 0.9;
}

.tail-overlay .tick,
.tail-overlay .pin-mark {
  opacity: 1;
  color: #fff;
}

.reaction-badge {
  position: absolute;
  bottom: -8px;
  right: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1px 5px;
  font-size: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.msg-more-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.15);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.bubble:hover .msg-more-btn {
  opacity: 1;
}

.meta {
  font-size: 11.5px;
  font-weight: 600;
  opacity: 0.75;
  margin-bottom: 2px;
}

.text {
  font-size: 14.5px;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
}

.tail-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.time {
  font-size: 10.5px;
  opacity: 0.65;
}

.tick-wrap {
  position: relative;
  display: inline-flex;
  width: 14px;
  height: 14px;
}

.tick {
  opacity: 0.75;
}

.pin-mark {
  opacity: 0.75;
  margin-right: 2px;
}

.edited-mark {
  font-size: 10.5px;
  opacity: 0.65;
  font-style: italic;
}

.hint {
  text-align: center;
  font-size: 14px;
}

.error-bar {
  padding: 6px 16px;
}

.editing-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid var(--border);
  background: var(--accent-bg);
  color: var(--accent);
  font-size: 13px;
  flex: 0 0 auto;
}

.editing-bar span {
  flex: 1;
}

.reply-bar-quote {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.reply-bar-sender {
  font-size: 11px;
  font-weight: 600;
}

.reply-bar-text {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.85;
}

.attach-bar span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.hidden-file-input {
  display: none;
}

.media-block {
  margin-bottom: 4px;
  border-radius: 10px;
  overflow: hidden;
}

.media-img {
  display: block;
  max-width: 100%;
  max-height: 320px;
  border-radius: 10px;
  cursor: pointer;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
  color: inherit;
  text-decoration: none;
  min-width: 200px;
}

.bubble-row.mine .file-card {
  background: rgba(255, 255, 255, 0.14);
}

.file-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.file-card-name {
  font-size: 13.5px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card-size {
  font-size: 11.5px;
  opacity: 0.75;
}

.file-card-download {
  flex-shrink: 0;
  opacity: 0.8;
}

/* альбом — сетка "чистых" фото без подписи, склеенных в одно сообщение */
.album-bubble {
  padding: 2px !important;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  max-width: 320px;
}

.album-count-1 {
  grid-template-columns: 1fr;
}

.album-tile {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}

.album-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.album-bubble .album-tile:first-child {
  border-top-left-radius: 16px;
}

.album-bubble .album-tile:nth-child(2) {
  border-top-right-radius: 16px;
}

.album-bubble .album-tile:nth-last-child(2) {
  border-bottom-left-radius: 16px;
}

.album-bubble .album-tile:last-child {
  border-bottom-right-radius: 16px;
}

.quote-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 8px;
  margin-bottom: 4px;
  border-left: 3px solid var(--accent);
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  cursor: pointer;
}

.quote-sender {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}

.quote-text {
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.85;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 8px 12px;
  min-height: 52px;
  border-top: 1px solid var(--border);
  flex: 0 0 auto;
}

.composer .icon-btn,
.composer .send-btn {
  margin-bottom: 2px;
}

.attach-anchor,
.emoji-anchor {
  position: relative;
}

.composer-textarea {
  flex: 1;
  border-radius: 20px;
  padding: 9px 14px;
  resize: none;
  line-height: 1.35;
  max-height: 40vh;
  overflow-y: auto;
}

.composer-spacer {
  flex: 1;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-h);
  padding: 0 8px;
}

.recording-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--danger);
  animation: recording-pulse 1.2s ease-in-out infinite;
}

@keyframes recording-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.send-btn {
  position: relative;
  overflow: hidden;
  border: none;
  background: var(--accent);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition:
    background-color 150ms ease,
    transform 100ms ease;
}

.send-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.send-btn:disabled {
  opacity: 0.4;
}

/* контекстное меню */
.msg-menu {
  position: fixed;
  z-index: 100;
  min-width: 210px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.25);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.reaction-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 2px;
}

.reaction-btn {
  border: none;
  background: none;
  font-size: 19px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  padding: 0;
  line-height: 1;
}

.reaction-btn:hover,
.reaction-btn.active {
  background: var(--bg-soft);
}

.menu-item {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: none;
  background: none;
  color: var(--text-h);
  font-size: 14px;
  border-radius: 6px;
  text-align: left;
  width: 100%;
  transition: background-color 120ms ease;
}

.menu-item:hover {
  background: var(--bg-soft);
}

.menu-item.danger {
  color: var(--danger);
}

.menu-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 2px;
}

.menu-timestamp {
  padding: 4px 10px 6px;
  font-size: 12px;
  opacity: 0.6;
}

.back-btn {
  display: none;
  text-decoration: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .back-btn {
    display: flex;
  }
}
</style>
