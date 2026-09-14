<script setup>
import { reactive, ref } from "vue";
import { social, updateMe } from "../store/social";
import Icon from "./Icon.vue";

const emit = defineEmits(["close"]);

const form = reactive({
  name: social.me.name,
  username: social.me.username,
  bio: social.me.bio,
  website: social.me.website,
  private: social.me.private,
});
const avatarPreview = ref(social.me.avatar);
const fileEl = ref(null);

function pickAvatar() {
  fileEl.value?.click();
}

function onAvatarSelected(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => (avatarPreview.value = reader.result);
  reader.readAsDataURL(file);
}

function save() {
  updateMe({
    name: form.name.trim() || "Вы",
    username: form.username.trim().toLowerCase() || social.me.username,
    bio: form.bio,
    website: form.website,
    private: form.private,
    avatar: avatarPreview.value,
  });
  emit("close");
}
</script>

<template>
  <div class="ep-backdrop" @click.self="emit('close')">
    <div class="ep-modal">
      <header class="ep-header">
        <span class="ep-title">Редактировать профиль</span>
        <button type="button" class="ep-close" @click="emit('close')"><Icon name="x" :size="20" /></button>
      </header>

      <div class="ep-body scroll-thin">
        <div class="ep-avatar-row">
          <img :src="avatarPreview" class="ep-avatar" />
          <div>
            <div class="ep-username-preview">{{ form.username }}</div>
            <input ref="fileEl" type="file" accept="image/*" class="hidden-file-input" @change="onAvatarSelected" />
            <button type="button" class="ep-avatar-btn" @click="pickAvatar">Изменить фото</button>
          </div>
        </div>

        <label class="ep-field">
          <span>Имя</span>
          <input v-model="form.name" />
        </label>

        <label class="ep-field">
          <span>Никнейм</span>
          <input v-model="form.username" />
        </label>

        <label class="ep-field">
          <span>О себе</span>
          <textarea v-model="form.bio" rows="3" maxlength="150"></textarea>
        </label>

        <label class="ep-field">
          <span>Сайт</span>
          <input v-model="form.website" placeholder="https://" />
        </label>

        <label class="ep-toggle-row">
          <span>
            <span class="ep-toggle-title"><Icon name="lock" :size="15" /> Закрытый профиль</span>
            <span class="ep-toggle-hint">Публикации будут видны только подписчикам</span>
          </span>
          <input type="checkbox" v-model="form.private" class="ep-switch" />
        </label>
      </div>

      <footer class="ep-footer">
        <button type="button" class="ep-cancel" @click="emit('close')">Отмена</button>
        <button type="button" class="primary" @click="save">Сохранить</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.ep-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ep-modal {
  width: 100%;
  max-width: 460px;
  max-height: 88vh;
  background: var(--bg-elevated);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ep-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex: 0 0 auto;
}

.ep-title {
  font-weight: 600;
}

.ep-close {
  position: absolute;
  right: 14px;
  border: none;
  background: none;
  color: var(--text-h);
  display: flex;
}

.ep-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ep-avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ep-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.ep-username-preview {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.hidden-file-input {
  display: none;
}

.ep-avatar-btn {
  border: none;
  background: none;
  color: var(--accent);
  font-weight: 600;
  font-size: 13px;
  padding: 0;
}

.ep-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.ep-field input,
.ep-field textarea {
  font-size: 14px;
  color: var(--text-h);
  resize: none;
}

.ep-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ep-toggle-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-h);
  font-weight: 500;
}

.ep-toggle-hint {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.ep-switch {
  flex-shrink: 0;
  width: 38px;
  height: 22px;
  accent-color: var(--accent);
}

.ep-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--border);
  flex: 0 0 auto;
}

.ep-cancel {
  background: var(--bg-soft);
}
</style>
