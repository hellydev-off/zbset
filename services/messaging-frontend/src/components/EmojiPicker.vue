<script setup>
import { ref } from "vue";

const emit = defineEmits(["pick", "sticker"]);

const tab = ref("emoji"); // emoji | stickers

const categories = [
  {
    name: "Смайлы",
    items: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍",
      "🤩","😘","😗","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐",
      "🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😴",
    ],
  },
  {
    name: "Жесты",
    items: [
      "👍","👎","👊","✊","🤛","🤜","🤞","✌️","🤟","🤘","👌","🤏","👈","👉","👆",
      "👇","☝️","✋","🤚","🖐️","👋","🤙","💪","🙏","👏","🤝","🫶",
    ],
  },
  {
    name: "Сердца",
    items: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗",
      "💖","💘","💝","💟",
    ],
  },
  {
    name: "Животные",
    items: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
      "🐔","🐧","🐦","🦆","🦉","🐴","🦄","🐝","🦋","🐢",
    ],
  },
  {
    name: "Еда",
    items: [
      "🍏","🍎","🍌","🍉","🍇","🍓","🍒","🍑","🍍","🥝","🍅","🥑","🌽","🥕","🍕",
      "🍔","🍟","🌭","🍿","🥓","🍳","🥞","🍞","🧀","🍗",
    ],
  },
  {
    name: "Разное",
    items: [
      "⚽","🏀","🎾","🎮","🎲","🎸","🎧","🚗","✈️","🚀","🌍","🌙","⭐","🌈","☀️",
      "🔥","✨","🎉","🎁","🏆","💯","✅","❌","❗","💬",
    ],
  },
];

function pickEmoji(e) {
  emit("pick", e);
}

// У сервера нет отдельного типа/хранилища для стикер-паков (content
// умеет только photo/video/audio + наш клиентский file) — поэтому
// "стикер" тут честно реализован как крупный эмодзи, отправляемый сразу
// по клику обычным текстовым сообщением, как в Telegram (клик = отправка).
const stickers = [
  "😂","❤️","🔥","👍","🎉","😍","🙏","😢","😱","🤝",
  "💯","🥳","😴","🤔","👏","🙄","😎","💩","👻","🎂",
];

function pickSticker(s) {
  emit("sticker", s);
}
</script>

<template>
  <div class="emoji-picker">
    <div class="ep-tabs">
      <button type="button" :class="{ active: tab === 'emoji' }" @click="tab = 'emoji'">
        Эмодзи
      </button>
      <button type="button" :class="{ active: tab === 'stickers' }" @click="tab = 'stickers'">
        Стикеры
      </button>
    </div>

    <div v-if="tab === 'emoji'" class="ep-body scroll-thin">
      <div v-for="cat in categories" :key="cat.name" class="ep-category">
        <div class="ep-category-title">{{ cat.name }}</div>
        <div class="ep-grid">
          <button
            v-for="e in cat.items"
            :key="e"
            type="button"
            class="ep-emoji"
            @click="pickEmoji(e)"
          >
            {{ e }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="ep-body ep-stickers scroll-thin">
      <button
        v-for="s in stickers"
        :key="s"
        type="button"
        class="ep-sticker"
        @click="pickSticker(s)"
      >
        {{ s }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  width: 320px;
  height: 360px;
  background: var(--bg-elevated);
  border-radius: 14px;
  box-shadow: var(--shadow-elevated);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 30;
}

.ep-tabs {
  display: flex;
  flex: 0 0 auto;
  border-bottom: 1px solid var(--border);
}

.ep-tabs button {
  flex: 1;
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
}

.ep-tabs button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.ep-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
}

.ep-category-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 6px 2px 4px;
}

.ep-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.ep-emoji {
  border: none;
  background: transparent;
  padding: 4px;
  font-size: 20px;
  line-height: 1;
  border-radius: 8px;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ep-emoji:hover {
  background: var(--bg-soft);
}

.ep-stickers {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  align-content: start;
}

.ep-sticker {
  border: none;
  background: transparent;
  font-size: 40px;
  line-height: 1;
  border-radius: 10px;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ep-sticker:hover {
  background: var(--bg-soft);
}
</style>
