<script setup>
import { computed, ref, watch } from "vue";
import { userByUsername, postsByUser, savedPosts, social, toggleFollow } from "../store/social";
import Icon from "../components/Icon.vue";
import PostModal from "../components/PostModal.vue";
import EditProfileModal from "../components/EditProfileModal.vue";

const props = defineProps({
  username: { type: String, required: true },
});

const tab = ref("posts");
const openPost = ref(null);
const editOpen = ref(false);

const user = computed(() => userByUsername(props.username));
const isMe = computed(() => user.value?.id === "me");
const posts = computed(() => (isMe.value ? [...social.posts.filter((p) => p.userId === "me")].sort((a, b) => b.createdAt - a.createdAt) : postsByUser(user.value?.id)));
const shownPosts = computed(() => (tab.value === "saved" ? savedPosts() : posts.value));

watch(
  () => props.username,
  () => {
    tab.value = "posts";
  },
);
</script>

<template>
  <div v-if="user" class="profile scroll-thin">
    <div class="profile-inner">
      <header class="profile-header">
        <img :src="user.avatar" class="profile-avatar" />
        <div class="profile-info">
          <div class="profile-title-row">
            <h2>{{ user.username }}</h2>
            <button v-if="isMe" type="button" class="profile-edit-btn" @click="editOpen = true">
              Редактировать профиль
            </button>
            <template v-else>
              <button
                type="button"
                class="primary profile-follow-btn"
                :class="{ following: user.followedByMe }"
                @click="toggleFollow(user.id)"
              >
                {{ user.followedByMe ? "Вы подписаны" : "Подписаться" }}
              </button>
            </template>
          </div>

          <div class="profile-stats">
            <span><b>{{ posts.length }}</b> публикаций</span>
            <span><b>{{ user.followers }}</b> подписчиков</span>
            <span><b>{{ user.following }}</b> подписок</span>
          </div>

          <div class="profile-bio">
            <div class="profile-name">{{ user.name }}</div>
            <p v-if="user.bio">{{ user.bio }}</p>
            <a v-if="user.website" :href="user.website" target="_blank" rel="noopener" class="profile-website">
              <Icon name="globe" :size="13" /> {{ user.website }}
            </a>
            <div v-if="user.private" class="profile-private">
              <Icon name="lock" :size="13" /> Закрытый профиль
            </div>
          </div>
        </div>
      </header>

      <div class="profile-tabs">
        <button type="button" class="profile-tab" :class="{ active: tab === 'posts' }" @click="tab = 'posts'">
          <Icon name="grid" :size="15" /> Публикации
        </button>
        <button
          v-if="isMe"
          type="button"
          class="profile-tab"
          :class="{ active: tab === 'saved' }"
          @click="tab = 'saved'"
        >
          <Icon name="bookmark" :size="15" /> Сохранённое
        </button>
      </div>

      <div class="profile-grid">
        <button
          v-for="p in shownPosts"
          :key="p.id"
          type="button"
          class="profile-grid-item"
          @click="openPost = p"
        >
          <img :src="p.image" />
          <div class="profile-grid-overlay">
            <span><Icon name="heart-filled" :size="16" /> {{ p.likes }}</span>
            <span><Icon name="message-circle" :size="16" /> {{ p.comments.length }}</span>
          </div>
        </button>
        <p v-if="shownPosts.length === 0" class="profile-empty">
          {{ tab === "saved" ? "Нет сохранённых публикаций" : "Публикаций пока нет" }}
        </p>
      </div>
    </div>

    <PostModal v-if="openPost" :post="openPost" @close="openPost = null" />
    <EditProfileModal v-if="editOpen" @close="editOpen = false" />
  </div>
  <div v-else class="profile-not-found">Пользователь не найден</div>
</template>

<style scoped>
.profile {
  flex: 1;
  overflow-y: auto;
  padding: 32px 20px 60px;
}

.profile-inner {
  max-width: 780px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  gap: 40px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.profile-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.profile-title-row h2 {
  font-weight: 400;
}

.profile-edit-btn {
  background: var(--bg-soft);
}

.profile-follow-btn.following {
  background: var(--bg-soft);
  color: var(--text-h);
}

.profile-stats {
  display: flex;
  gap: 28px;
  font-size: 14.5px;
}

.profile-bio {
  font-size: 14px;
  line-height: 1.5;
}

.profile-name {
  font-weight: 600;
}

.profile-website {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  text-decoration: none;
}

.profile-private {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 4px;
}

.profile-tabs {
  display: flex;
  justify-content: center;
  gap: 40px;
  border-top: 1px solid var(--border);
  padding-top: 4px;
}

.profile-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  padding: 14px 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary);
  border-top: 1px solid transparent;
  margin-top: -1px;
}

.profile-tab.active {
  color: var(--text-h);
  border-top-color: var(--text-h);
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 8px;
}

.profile-grid-item {
  position: relative;
  aspect-ratio: 1 / 1;
  border: none;
  padding: 0;
  overflow: hidden;
  background: var(--bg-soft);
}

.profile-grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-grid-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-weight: 600;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s;
}

.profile-grid-overlay span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.profile-grid-item:hover .profile-grid-overlay {
  opacity: 1;
}

.profile-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.profile-not-found {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .profile-header {
    gap: 20px;
  }

  .profile-avatar {
    width: 84px;
    height: 84px;
  }

  .profile-info {
    gap: 12px;
  }

  .profile-stats {
    gap: 16px;
    font-size: 13px;
  }
}
</style>
