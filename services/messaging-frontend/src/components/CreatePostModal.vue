<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createPost, social } from "../store/social";
import Icon from "./Icon.vue";

const emit = defineEmits(["close"]);
const router = useRouter();

const fileEl = ref(null);
const preview = ref(null);
const caption = ref("");
const posting = ref(false);

function pickFile() {
  fileEl.value?.click();
}

function onFileSelected(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    preview.value = reader.result;
  };
  reader.readAsDataURL(file);
}

function share() {
  if (!preview.value) return;
  posting.value = true;
  createPost({ image: preview.value, caption: caption.value });
  posting.value = false;
  emit("close");
  router.push({ name: "profile", params: { username: social.me.username } });
}
</script>

<template>
  <div class="cp-backdrop" @click.self="emit('close')">
    <div class="cp-modal">
      <header class="cp-header">
        <span v-if="preview" class="cp-header-title">Новая публикация</span>
        <span v-else class="cp-header-title">Создать публикацию</span>
        <button v-if="preview" type="button" class="cp-share" :disabled="posting" @click="share">
          Поделиться
        </button>
        <button type="button" class="cp-close" @click="emit('close')">
          <Icon name="x" :size="20" />
        </button>
      </header>

      <div v-if="!preview" class="cp-empty">
        <Icon name="image" :size="56" />
        <p>Перетащите фото сюда</p>
        <input ref="fileEl" type="file" accept="image/*" class="hidden-file-input" @change="onFileSelected" />
        <button type="button" class="primary" @click="pickFile">Выбрать на компьютере</button>
      </div>

      <div v-else class="cp-body">
        <div class="cp-preview">
          <img :src="preview" />
        </div>
        <div class="cp-form">
          <textarea v-model="caption" rows="6" placeholder="Добавьте подпись..." maxlength="2200"></textarea>
          <div class="cp-counter">{{ caption.length }}/2200</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.cp-modal {
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  background: var(--bg-elevated);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cp-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex: 0 0 auto;
  gap: 10px;
}

.cp-header-title {
  flex: 1;
  font-weight: 600;
  text-align: center;
}

.cp-share {
  border: none;
  background: none;
  color: var(--accent);
  font-weight: 600;
  font-size: 14px;
  padding: 0;
}

.cp-close {
  position: absolute;
  left: 16px;
  border: none;
  background: none;
  color: var(--text-h);
  display: flex;
}

.cp-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.hidden-file-input {
  display: none;
}

.cp-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.cp-preview {
  flex: 1.2;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.cp-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.cp-form {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.cp-form textarea {
  border: none;
  resize: none;
  font-size: 14px;
  flex: 1;
}

.cp-counter {
  text-align: right;
  font-size: 11.5px;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .cp-body {
    flex-direction: column;
  }

  .cp-preview {
    max-height: 40vh;
  }
}
</style>
