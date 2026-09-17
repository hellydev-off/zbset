<script setup>
import { ref } from "vue";

const props = defineProps({
  src: { type: String, required: true },
});

const videoEl = ref(null);
const playing = ref(false);
const duration = ref(0);

function play() {
  videoEl.value?.play();
}

function onLoadedMetadata() {
  duration.value = videoEl.value.duration;
}

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
</script>

<template>
  <div class="video-preview">
    <video
      ref="videoEl"
      :src="src"
      controls
      class="vp-video"
      @play="playing = true"
      @pause="playing = false"
      @loadedmetadata="onLoadedMetadata"
    ></video>
    <!-- overlay кликабелен только пока видео на паузе — после старта
         клики уходят напрямую в нативные controls, без двойного тоггла -->
    <button v-if="!playing" class="vp-overlay" @click.stop="play">
      <span class="vp-play-circle">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M6 4.5v15l13-7.5z" /></svg>
      </span>
      <span v-if="duration" class="vp-duration">{{ formatTime(duration) }}</span>
    </button>
  </div>
</template>

<style scoped>
.video-preview {
  position: relative;
  display: inline-block;
}

.vp-video {
  display: block;
  max-width: 100%;
  max-height: 320px;
  border-radius: 10px;
  background: #000;
}

.vp-overlay {
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  background: rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.vp-play-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vp-duration {
  position: absolute;
  bottom: 8px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 6px;
}
</style>
