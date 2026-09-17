<script setup>
import Icon from "./Icon.vue";

// Пункты — только то, что реально умеет middlewares/upload.js на бэке:
// image/jpeg,png,webp + video/mp4 (фото/видео), audio/webm (аудио),
// application/pdf (файл). Остальные телеграмовские пункты (Кошелёк,
// Список, Местоположение, Статья) нарочно не включены — под них нет
// ни бэкенд-поддержки, ни смысла рисовать мёртвые кнопки.
const items = [
  {
    kind: "photo-video",
    icon: "image",
    label: "Фото или видео",
    accept: "image/jpeg,image/png,image/webp,video/mp4",
  },
  {
    kind: "camera",
    icon: "camera",
    label: "Камера",
    accept: "image/jpeg,image/png,image/webp,video/mp4",
    capture: "environment",
  },
  {
    kind: "file",
    icon: "file-text",
    label: "Файл",
    accept: "application/pdf",
  },
  {
    kind: "audio",
    icon: "music",
    label: "Аудио",
    accept: "audio/webm,audio/ogg",
  },
];

const emit = defineEmits(["pick"]);
</script>

<template>
  <div class="attach-menu">
    <button
      v-for="item in items"
      :key="item.kind"
      type="button"
      class="attach-menu-item"
      @click="emit('pick', item)"
    >
      <span class="attach-menu-icon" :class="'ic-' + item.kind">
        <Icon :name="item.icon" :size="18" />
      </span>
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.attach-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: var(--bg-elevated);
  border-radius: 12px;
  box-shadow: var(--shadow-elevated);
  padding: 6px;
  min-width: 210px;
  display: flex;
  flex-direction: column;
  z-index: 30;
  transform-origin: bottom left;
}

.attach-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  padding: 9px 10px;
  border-radius: 8px;
  font-size: 14.5px;
  color: var(--text-h);
  text-align: left;
}

.attach-menu-item:hover {
  background: var(--bg-soft);
}

.attach-menu-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.ic-photo-video {
  background: #3390ec;
}

.ic-camera {
  background: #4fae4e;
}

.ic-file {
  background: #9b6fd6;
}

.ic-audio {
  background: #eb7b3d;
}
</style>
