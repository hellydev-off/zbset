<script setup>
import { ref } from "vue";
import { userById, toggleLike, toggleSave, addComment, timeAgo } from "../store/social";
import Icon from "./Icon.vue";

const props = defineProps({
  post: { type: Object, required: true },
});
const emit = defineEmits(["open"]);

const author = userById(props.post.userId);
const commentText = ref("");
const heartPop = ref(false);

function onLike() {
  toggleLike(props.post.id);
  if (props.post.likedByMe) {
    heartPop.value = false;
    requestAnimationFrame(() => (heartPop.value = true));
  }
}

function onDoubleClick() {
  if (!props.post.likedByMe) onLike();
}

function submitComment() {
  addComment(props.post.id, commentText.value);
  commentText.value = "";
}
</script>

<template>
  <article class="post-card">
    <header class="post-header">
      <router-link :to="{ name: 'profile', params: { username: author?.username } }">
        <img :src="author?.avatar" class="post-avatar" />
      </router-link>
      <router-link :to="{ name: 'profile', params: { username: author?.username } }" class="post-header-info">
        <span class="post-username">{{ author?.name || author?.username }}</span>
        <span class="post-time">{{ timeAgo(post.createdAt) }}</span>
      </router-link>
      <button type="button" class="icon-btn-plain">
        <Icon name="more-horizontal" :size="18" />
      </button>
    </header>

    <div class="post-media" @dblclick="onDoubleClick">
      <img :src="post.image" class="post-image" @click="emit('open', post)" />
      <Transition name="pop">
        <Icon v-if="heartPop" name="heart-filled" :size="80" class="post-like-burst" @animationend="heartPop = false" />
      </Transition>
    </div>

    <div class="post-actions">
      <button type="button" class="icon-btn-plain" :class="{ liked: post.likedByMe }" @click="onLike">
        <Icon :name="post.likedByMe ? 'heart-filled' : 'heart'" :size="24" />
      </button>
      <button type="button" class="icon-btn-plain" @click="emit('open', post)">
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

    <div class="post-likes">Нравится: {{ post.likes }}</div>

    <div class="post-caption">
      <span class="post-username">{{ author?.username }}</span>
      {{ post.caption }}
    </div>

    <button v-if="post.comments.length" type="button" class="post-comments-link" @click="emit('open', post)">
      Посмотреть все комментарии ({{ post.comments.length }})
    </button>

    <form class="post-comment-form" @submit.prevent="submitComment">
      <input v-model="commentText" placeholder="Добавить комментарий..." />
      <button v-if="commentText.trim()" type="submit" class="post-comment-submit">Опубл.</button>
    </form>
  </article>
</template>

<style scoped>
.post-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-elevated);
  margin-bottom: 20px;
  overflow: hidden;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.post-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.post-header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  text-decoration: none;
  color: inherit;
}

.post-username {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--text-h);
}

.post-time {
  font-size: 11.5px;
  color: var(--text-secondary);
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

.post-media {
  position: relative;
  background: var(--bg-soft);
}

.post-image {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  cursor: pointer;
}

.post-like-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 2px;
}

.post-actions-spacer {
  flex: 1;
}

.post-likes {
  font-weight: 600;
  font-size: 13.5px;
  padding: 2px 14px 0;
  color: var(--text-h);
}

.post-caption {
  padding: 6px 14px 0;
  font-size: 13.5px;
  line-height: 1.4;
}

.post-comments-link {
  display: block;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 6px 14px 0;
  text-align: left;
}

.post-comment-form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 12px;
  border-top: 1px solid var(--border);
  margin-top: 10px;
}

.post-comment-form input {
  flex: 1;
  border: none;
  padding: 4px 0;
  font-size: 13.5px;
  background: transparent;
}

.post-comment-submit {
  border: none;
  background: none;
  color: var(--accent);
  font-weight: 600;
  font-size: 13.5px;
  padding: 0;
}
</style>
