<script setup>
import { ref, computed } from "vue";
import { resolveMediaUrl } from "../api/attachments";
import Icon from "./Icon.vue";
import AudioPlayer from "./AudioPlayer.vue";
import VideoPreview from "./VideoPreview.vue";

const props = defineProps({
  chatId: { type: [String, Number], required: true },
  messages: { type: Array, required: true },
  wallpaper: { type: String, default: null },
});
const emit = defineEmits(["close", "open-photo", "update:wallpaper"]);

const tab = ref("photo");

const byType = (type) => props.messages.filter((m) => m.content?.isContent && m.content.type === type);
const photos = computed(() => byType("photo"));
const videos = computed(() => byType("video"));
const files = computed(() => byType("file"));
const audios = computed(() => byType("audio"));

const tabs = [
  { id: "photo", label: "Фото", icon: "image" },
  { id: "video", label: "Видео", icon: "camera" },
  { id: "file", label: "Файлы", icon: "file-text" },
  { id: "audio", label: "Аудио", icon: "music" },
  { id: "wallpaper", label: "Оформление", icon: "palette" },
];

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const WALLPAPER_PRESETS = [
  { id: "default", label: "По умолчанию", value: null },
  { id: "p1", label: "Голубой", value: "linear-gradient(160deg, #dceefb, #f3f1f6)" },
  { id: "p2", label: "Персиковый", value: "linear-gradient(160deg, #ffe8d6, #fdf1e6)" },
  { id: "p3", label: "Мятный", value: "linear-gradient(160deg, #d8f3e6, #eefaf3)" },
  { id: "p4", label: "Лавандовый", value: "linear-gradient(160deg, #e6def7, #f5f1fc)" },
  { id: "p5", label: "Тёмный", value: "linear-gradient(160deg, #1b1c24, #0f1014)" },
];

const fileEl = ref(null);
function pickWallpaperImage() {
  fileEl.value?.click();
}
function onWallpaperFile(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => emit("update:wallpaper", `url(${reader.result}) center/cover`);
  reader.readAsDataURL(file);
}
</script>

<template>
  <div class="cip-backdrop" @click.self="emit('close')">
    <aside class="cip-panel">
      <header class="cip-header">
        <span>Информация о чате</span>
        <button type="button" class="cip-close" @click="emit('close')"><Icon name="x" :size="20" /></button>
      </header>

      <div class="cip-tabs scroll-thin">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="cip-tab"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          <Icon :name="t.icon" :size="14" /> {{ t.label }}
        </button>
      </div>

      <div class="cip-body scroll-thin">
        <template v-if="tab === 'photo'">
          <div v-if="photos.length" class="cip-photo-grid">
            <button
              v-for="p in photos"
              :key="p.id"
              type="button"
              class="cip-photo-tile"
              @click="emit('open-photo', p.id)"
            >
              <img :src="resolveMediaUrl(p.content.url)" />
            </button>
          </div>
          <p v-else class="cip-empty">Фото в этом чате ещё нет</p>
        </template>

        <template v-else-if="tab === 'video'">
          <div v-if="videos.length" class="cip-list">
            <VideoPreview v-for="v in videos" :key="v.id" :src="resolveMediaUrl(v.content.url)" />
          </div>
          <p v-else class="cip-empty">Видео в этом чате ещё нет</p>
        </template>

        <template v-else-if="tab === 'file'">
          <div v-if="files.length" class="cip-list">
            <a
              v-for="f in files"
              :key="f.id"
              :href="resolveMediaUrl(f.content.url)"
              target="_blank"
              rel="noopener"
              class="cip-file-card"
            >
              <span class="cip-file-icon"><Icon name="file-text" :size="20" /></span>
              <span class="cip-file-info">
                <span class="cip-file-name">{{ f.content.name || "Файл" }}</span>
                <span class="cip-file-size">{{ formatFileSize(f.content.size) }}</span>
              </span>
              <Icon name="download" :size="16" />
            </a>
          </div>
          <p v-else class="cip-empty">Файлов в этом чате ещё нет</p>
        </template>

        <template v-else-if="tab === 'audio'">
          <div v-if="audios.length" class="cip-list">
            <AudioPlayer v-for="a in audios" :key="a.id" :src="resolveMediaUrl(a.content.url)" />
          </div>
          <p v-else class="cip-empty">Голосовых сообщений ещё нет</p>
        </template>

        <template v-else-if="tab === 'wallpaper'">
          <p class="cip-section-title">Фон переписки</p>
          <div class="cip-wallpaper-grid">
            <button
              v-for="p in WALLPAPER_PRESETS"
              :key="p.id"
              type="button"
              class="cip-wallpaper-swatch"
              :class="{ active: wallpaper === p.value || (!wallpaper && !p.value) }"
              :style="{ background: p.value || 'var(--bg-chat)' }"
              :title="p.label"
              @click="emit('update:wallpaper', p.value)"
            >
              <Icon v-if="wallpaper === p.value || (!wallpaper && !p.value)" name="check" :size="16" />
            </button>
          </div>
          <input ref="fileEl" type="file" accept="image/*" class="hidden-file-input" @change="onWallpaperFile" />
          <button type="button" class="cip-upload-btn" @click="pickWallpaperImage">
            <Icon name="image" :size="16" /> Загрузить своё фото
          </button>
        </template>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.cip-backdrop {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: var(--overlay);
  display: flex;
  justify-content: flex-end;
}

.cip-panel {
  width: min(360px, 100vw);
  height: 100%;
  background: var(--bg-elevated);
  display: flex;
  flex-direction: column;
  animation: cip-slide-in 180ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes cip-slide-in {
  from {
    transform: translateX(100%);
  }
}

.cip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  flex: 0 0 auto;
}

.cip-close {
  border: none;
  background: none;
  color: var(--text-h);
  display: flex;
}

.cip-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  flex: 0 0 auto;
}

.cip-tab {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: var(--bg-soft);
  color: var(--text-secondary);
  padding: 7px 12px;
  border-radius: 16px;
  font-size: 12.5px;
  white-space: nowrap;
}

.cip-tab.active {
  background: var(--accent-bg);
  color: var(--accent);
}

.cip-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.cip-empty {
  text-align: center;
  padding: 30px 10px;
  color: var(--text-secondary);
  font-size: 13.5px;
}

.cip-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.cip-photo-tile {
  border: none;
  padding: 0;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 6px;
}

.cip-photo-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cip-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cip-file-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  background: var(--bg-soft);
  color: inherit;
  text-decoration: none;
}

.cip-file-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cip-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.cip-file-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cip-file-size {
  font-size: 11px;
  color: var(--text-secondary);
}

.cip-section-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px;
}

.cip-wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.cip-wallpaper-swatch {
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.cip-wallpaper-swatch.active {
  border-color: var(--accent);
}

.hidden-file-input {
  display: none;
}

.cip-upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  background: var(--bg-soft);
}

@media (max-width: 640px) {
  .cip-panel {
    width: 100%;
  }
}
</style>
