// Нативные Notification API уведомления о новых сообщениях. Работают только
// пока вкладка/приложение открыты (это не push-уведомления с сервера —
// для тех нужен отдельный backend-стек с VAPID-ключами и Service Worker).

const SOUND_KEY = "msg_frontend_notify_sound";

export function isSoundEnabled() {
  return localStorage.getItem(SOUND_KEY) !== "0";
}

export function setSoundEnabled(enabled) {
  localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
}

// AudioContext создаём лениво и один раз — браузеры блокируют автозапуск
// звука до первого пользовательского жеста, а к моменту первого сообщения
// пользователь уже наверняка успел кликнуть по странице.
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

// Короткий двухтональный "дзынь" — синтезируем сами через Web Audio API,
// без внешнего аудиофайла (та же техника, что и в AudioPlayer.vue).
export function playNotifySound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.09;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  });
}

export function requestNotifyPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function contentPreview(content) {
  if (!content?.isContent) return null;
  const labels = { photo: "📷 Фото", video: "🎥 Видео", audio: "🎤 Голосовое сообщение", file: "📄 Файл" };
  return labels[content.type] || "Вложение";
}

export function notifyNewMessage(message, onClick) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  // не уведомляем о собственных сообщениях (эмит приходит всем участникам,
  // включая отправителя)
  const body = message.text || contentPreview(message.content) || "Новое сообщение";
  const n = new Notification(`Сообщение в чате #${message.chat_id}`, {
    body,
    tag: `chat-${message.chat_id}`, // схлопывает несколько подряд уведомлений одного чата в одно
  });
  n.onclick = () => {
    window.focus();
    onClick?.();
    n.close();
  };
}
