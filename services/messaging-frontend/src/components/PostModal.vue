<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { userById, toggleLike, toggleSave, addComment, timeAgo } from "../store/social";
import Icon from "./Icon.vue";

const props = defineProps({
  post: { type: Object, required: true },
});
const emit = defineEmits(["close"]);

const author = userById(props.post.userId);
const commentText = ref("");

function submitComment() {
  addComment(props.post.id, commentText.value);
  commentText.value = "";
}

function onKeydown(e) {
  if (e.key === "Escape") emit("close");
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="post-modal-backdrop" @click.self="emit('close')">
    <button type="button" class="post-modal-close" @click="emit('close')">
      <Icon name="x" :size="22" />
    </button>

    <div class="post-modal">
      <div class="post-modal-media">
        <img :src="post.image" />
      </div>

      <div class="post-modal-side">
        <header class="pm-header">
          <router-link
            :to="{ name: 'profile', params: { username: author?.username } }"
            class="pm-header-link"
            @click="emit('close')"
          >
            <img :src="author?.avatar" class="pm-avatar" />
            <span class="pm-username">{{ author?.name || author?.username }}</span>
          </router-link>
        </header>

        <div class="pm-comments scroll-thin">
          <div v-if="post.caption" class="pm-comment">
            <img :src="author?.avatar" class="pm-c-avatar" />
            <div class="pm-c-body">
              <span class="pm-c-username">{{ author?.username }}</span>
              {{ post.caption }}
            </div>
          </div>

          <div v-for="c in post.comments" :key="c.id" class="pm-comment">
            <img :src="userById(c.userId)?.avatar" class="pm-c-avatar" />
            <div class="pm-c-body">
              <span class="pm-c-username">{{ userById(c.userId)?.username }}</span>
              {{ c.text }}
            </div>
          </div>

          <p v-if="!post.caption && post.comments.length === 0" class="pm-empty">Пока нет комментариев</p>
        </div>

        <div class="pm-actions">
          <button type="button" class="icon-btn-plain" :class="{ liked: post.likedByMe }" @click="toggleLike(post.id)">
            <Icon :name="post.likedByMe ? 'heart-filled' : 'heart'" :size="24" />
          </button>
          <button type="button" class="icon-btn-plain">
            <Icon name="message-circle" :size="23" />
          </button>
          <button type="button" class="icon-btn-plain">
            <Icon name="send" :size="20" />
          </button>
          <div class="post-actions-spacer"></div>
          <button type="button" class="icon-btn-plain" @click="toggleSave(post.id)">
            <Icon :name="post.savedByMe ? 'bookmark-filled' : 'bookmark'" :size="21" />
          </button>
        </div>
        <div class="pm-likes">Нравится: {{ post.likes }}</div>
        <div class="pm-time">{{ timeAgo(post.createdAt) }}</div>

        <form class="pm-comment-form" @submit.prevent="submitComment">
          <input v-model="commentText" placeholder="Добавить комментарий..." />
          <button v-if="commentText.trim()" type="submit">Опубл.</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.post-modal-close {
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

.post-modal {
  display: flex;
  width: 100%;
  max-width: 980px;
  height: min(90vh, 680px);
  background: var(--bg-elevated);
  border-radius: 12px;
  overflow: hidden;
}

.post-modal-media {
  flex: 1.3;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.post-modal-media img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.post-modal-side {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
}

.pm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  flex: 0 0 auto;
}

.pm-avatar,
.pm-c-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.pm-header-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.pm-username {
  font-weight: 600;
  font-size: 13.5px;
}

.pm-comments {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pm-comment {
  display: flex;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.4;
}

.pm-c-username {
  font-weight: 600;
  margin-right: 4px;
}

.pm-empty {
  color: var(--text-secondary);
  font-size: 13px;
}

.pm-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 0;
  flex: 0 0 auto;
}

.post-actions-spacer {
  flex: 1;
}

.icon-btn-plain {
  border: none;
  background: none;
  color: var(--text-h);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn-plain.liked {
  color: #ed4956;
}

.pm-likes {
  font-weight: 600;
  font-size: 13.5px;
  padding: 6px 14px 0;
}

.pm-time {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  padding: 4px 14px 12px;
}

.pm-comment-form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  flex: 0 0 auto;
}

.pm-comment-form input {
  flex: 1;
  border: none;
  padding: 4px 0;
  font-size: 13.5px;
  background: transparent;
}

.pm-comment-form button {
  border: none;
  background: none;
  color: var(--accent);
  font-weight: 600;
  font-size: 13.5px;
  padding: 0;
}

@media (max-width: 768px) {
  .post-modal-backdrop {
    padding: 0;
  }

  .post-modal {
    flex-direction: column;
    height: 100%;
    max-width: 100%;
    border-radius: 0;
  }

  .post-modal-media {
    flex: 0 0 auto;
    max-height: 45vh;
  }

  .post-modal-side {
    min-width: 0;
    border-left: none;
    border-top: 1px solid var(--border);
  }
}
</style>
