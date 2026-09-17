<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import Icon from "./Icon.vue";

const props = defineProps({
  photos: { type: Array, required: true }, // [{ id, url }]
  startIndex: { type: Number, default: 0 },
});

const emit = defineEmits(["close"]);

const index = ref(props.startIndex);
const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const dragging = ref(false);
let dragStart = { x: 0, y: 0, panX: 0, panY: 0 };
let touchStartX = 0;
let touchDeltaX = 0;

const current = computed(() => props.photos[index.value]);

function resetView() {
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
}

function close() {
  emit("close");
}

function next() {
  if (index.value < props.photos.length - 1) {
    index.value++;
    resetView();
  }
}

function prev() {
  if (index.value > 0) {
    index.value--;
    resetView();
  }
}

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.2 : 0.2;
  zoom.value = Math.min(4, Math.max(1, zoom.value + delta));
  if (zoom.value === 1) pan.value = { x: 0, y: 0 };
}

function onMouseDown(e) {
  if (zoom.value <= 1) return;
  dragging.value = true;
  dragStart = { x: e.clientX, y: e.clientY, panX: pan.value.x, panY: pan.value.y };
}

function onMouseMove(e) {
  if (!dragging.value) return;
  pan.value = {
    x: dragStart.panX + (e.clientX - dragStart.x),
    y: dragStart.panY + (e.clientY - dragStart.y),
  };
}

function onMouseUp() {
  dragging.value = false;
}

function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchDeltaX = 0;
}

function onTouchMove(e) {
  if (zoom.value > 1 || e.touches.length !== 1) return;
  touchDeltaX = e.touches[0].clientX - touchStartX;
}

function onTouchEnd() {
  if (zoom.value > 1) return;
  if (touchDeltaX > 60) prev();
  else if (touchDeltaX < -60) next();
  touchDeltaX = 0;
}

function onKeydown(e) {
  if (e.key === "Escape") close();
  else if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
}

watch(
  () => props.startIndex,
  (v) => {
    index.value = v;
    resetView();
  },
);

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="lightbox" @click.self="close" @wheel="onWheel">
    <button class="lb-close" @click="close"><Icon name="x" :size="22" /></button>

    <div class="lb-counter" v-if="photos.length > 1">{{ index + 1 }} / {{ photos.length }}</div>

    <button v-if="index > 0" class="lb-nav lb-prev" @click.stop="prev">
      <Icon name="arrow-left" :size="24" />
    </button>
    <button v-if="index < photos.length - 1" class="lb-nav lb-next" @click.stop="next">
      <Icon name="arrow-left" :size="24" class="flip" />
    </button>

    <div
      class="lb-stage"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <img
        :src="current.url"
        class="lb-img"
        :class="{ dragging }"
        :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
        draggable="false"
        @click.stop
      />
    </div>
  </div>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: lb-fade-in 150ms ease;
}

@keyframes lb-fade-in {
  from {
    opacity: 0;
  }
}

.lb-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lb-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  cursor: grab;
  transition: transform 80ms ease-out;
  user-select: none;
}

.lb-img.dragging {
  cursor: grabbing;
  transition: none;
}

.lb-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lb-counter {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 13px;
  opacity: 0.8;
}

.lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lb-prev {
  left: 16px;
}

.lb-next {
  right: 16px;
}

.flip {
  transform: rotate(180deg);
}
</style>
