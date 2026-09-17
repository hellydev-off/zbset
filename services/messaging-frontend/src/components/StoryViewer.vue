<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import Icon from "./Icon.vue";

const props = defineProps({
  users: { type: Array, required: true },
  startIndex: { type: Number, default: 0 },
});
const emit = defineEmits(["close"]);

const index = ref(props.startIndex);
const progress = ref(0);
let timer = null;
const DURATION = 4000;

function start() {
  clearInterval(timer);
  progress.value = 0;
  const startedAt = Date.now();
  timer = setInterval(() => {
    progress.value = Math.min(100, ((Date.now() - startedAt) / DURATION) * 100);
    if (progress.value >= 100) next();
  }, 40);
}

function next() {
  if (index.value < props.users.length - 1) index.value++;
  else emit("close");
}

function prev() {
  if (index.value > 0) index.value--;
}

function onKeydown(e) {
  if (e.key === "Escape") emit("close");
  else if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
}

watch(index, start, { immediate: true });
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  clearInterval(timer);
});
</script>

<template>
  <div class="story-viewer">
    <div class="story-bars">
      <div v-for="(u, i) in users" :key="u.id" class="story-bar-track">
        <div
          class="story-bar-fill"
          :style="{ width: i < index ? '100%' : i === index ? progress + '%' : '0%' }"
        ></div>
      </div>
    </div>

    <button type="button" class="story-close" @click="emit('close')"><Icon name="x" :size="22" /></button>

    <header class="story-header">
      <img :src="users[index].avatar" class="story-avatar" />
      <span>{{ users[index].name || users[index].username }}</span>
    </header>

    <div class="story-stage">
      <button type="button" class="story-zone story-zone-left" @click="prev"></button>
      <img :src="users[index].avatar" class="story-image" />
      <button type="button" class="story-zone story-zone-right" @click="next"></button>
    </div>
  </div>
</template>

<style scoped>
.story-viewer {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.story-bars {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  z-index: 2;
}

.story-bar-track {
  flex: 1;
  height: 2.5px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  overflow: hidden;
}

.story-bar-fill {
  height: 100%;
  background: #fff;
}

.story-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-header {
  position: absolute;
  top: 24px;
  left: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.story-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.story-stage {
  position: relative;
  width: min(420px, 100vw);
  height: min(90vh, 760px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.story-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 33%;
  border: none;
  background: none;
}

.story-zone-left {
  left: 0;
}

.story-zone-right {
  right: 0;
}
</style>
