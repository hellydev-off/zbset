<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  src: { type: String, required: true },
  mine: { type: Boolean, default: false },
});

const audioEl = ref(null);
const playing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const speed = ref(1);
const peaks = ref([]); // нормализованные 0..1
const loadingWave = ref(true);
const decodeFailed = ref(false);
const BAR_COUNT = 42;

const progress = computed(() => (duration.value ? currentTime.value / duration.value : 0));

const timeLabel = computed(() => {
  const t = playing.value || currentTime.value > 0 ? currentTime.value : duration.value;
  return formatTime(t);
});

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function decodeWaveform() {
  loadingWave.value = true;
  decodeFailed.value = false;
  try {
    const res = await fetch(props.src);
    const arrayBuffer = await res.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const raw = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(raw.length / BAR_COUNT) || 1;
    const bars = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(raw[start + j] || 0);
      }
      bars.push(sum / blockSize);
    }
    const max = Math.max(...bars, 0.0001);
    peaks.value = bars.map((v) => Math.max(0.12, v / max));
    ctx.close();
  } catch {
    // декод не удался (CORS/неподдерживаемый формат) — просто без waveform
    decodeFailed.value = true;
    peaks.value = Array.from({ length: BAR_COUNT }, () => 0.35);
  } finally {
    loadingWave.value = false;
  }
}

function togglePlay() {
  if (!audioEl.value) return;
  if (playing.value) audioEl.value.pause();
  else audioEl.value.play();
}

function onTimeUpdate() {
  currentTime.value = audioEl.value.currentTime;
}

function onLoadedMetadata() {
  duration.value = audioEl.value.duration;
}

function onEnded() {
  playing.value = false;
  currentTime.value = 0;
}

function cycleSpeed() {
  const order = [1, 1.5, 2];
  speed.value = order[(order.indexOf(speed.value) + 1) % order.length];
  if (audioEl.value) audioEl.value.playbackRate = speed.value;
}

function seekTo(e, wrapEl) {
  if (!audioEl.value || !duration.value) return;
  const rect = wrapEl.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  audioEl.value.currentTime = ratio * duration.value;
  currentTime.value = audioEl.value.currentTime;
}

onMounted(decodeWaveform);
watch(() => props.src, decodeWaveform);
onUnmounted(() => {
  audioEl.value?.pause();
});
</script>

<template>
  <div class="audio-player" :class="{ mine }">
    <audio
      ref="audioEl"
      :src="src"
      preload="metadata"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    ></audio>

    <button class="ap-play" @click="togglePlay">
      <svg v-if="!playing" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4.5v15l13-7.5z" />
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect x="5" y="4" width="5" height="16" rx="1" />
        <rect x="14" y="4" width="5" height="16" rx="1" />
      </svg>
    </button>

    <div class="ap-wave" @click="(e) => seekTo(e, e.currentTarget)">
      <span
        v-for="(p, i) in peaks"
        :key="i"
        class="ap-bar"
        :class="{ filled: i / BAR_COUNT <= progress }"
        :style="{ height: Math.round(p * 100) + '%' }"
      ></span>
    </div>

    <button class="ap-speed" @click="cycleSpeed">{{ speed }}x</button>
    <span class="ap-time">{{ timeLabel }}</span>
  </div>
</template>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 240px;
  padding: 4px 0;
}

.ap-play {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.audio-player.mine .ap-play {
  background: rgba(255, 255, 255, 0.25);
}

.ap-wave {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 28px;
  cursor: pointer;
}

.ap-bar {
  flex: 1;
  min-width: 2px;
  border-radius: 2px;
  background: var(--border);
  transition: background-color 120ms ease;
}

.audio-player.mine .ap-bar {
  background: rgba(255, 255, 255, 0.35);
}

.ap-bar.filled {
  background: var(--accent);
}

.audio-player.mine .ap-bar.filled {
  background: #fff;
}

.ap-speed {
  flex: 0 0 auto;
  border: none;
  background: var(--bg-soft);
  color: var(--text);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 8px;
}

.audio-player.mine .ap-speed {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.ap-time {
  flex: 0 0 auto;
  font-size: 11px;
  opacity: 0.75;
  min-width: 32px;
  text-align: right;
}
</style>
