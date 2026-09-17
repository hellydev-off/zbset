<script setup>
import { ref } from "vue";
import { social, feedPosts, userById } from "../store/social";
import PostCard from "../components/PostCard.vue";
import PostModal from "../components/PostModal.vue";
import StoryViewer from "../components/StoryViewer.vue";

const openPost = ref(null);
const storyIndex = ref(null);

const storyUsers = [social.me, ...social.users];
</script>

<template>
  <div class="feed scroll-thin">
    <div class="feed-inner">
      <div class="stories scroll-thin">
        <button
          v-for="(u, i) in storyUsers"
          :key="u.id"
          type="button"
          class="story-chip"
          @click="storyIndex = i"
        >
          <span class="story-ring"><img :src="u.avatar" /></span>
          <span class="story-name">{{ u.id === "me" ? "Ваша история" : u.username }}</span>
        </button>
      </div>

      <PostCard v-for="post in feedPosts" :key="post.id" :post="post" @open="openPost = $event" />
    </div>

    <PostModal v-if="openPost" :post="openPost" @close="openPost = null" />
    <StoryViewer v-if="storyIndex !== null" :users="storyUsers" :start-index="storyIndex" @close="storyIndex = null" />
  </div>
</template>

<style scoped>
.feed {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px 60px;
}

.feed-inner {
  max-width: 470px;
  margin: 0 auto;
}

.stories {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 20px;
}

.story-chip {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  width: 66px;
}

.story-ring {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  padding: 2.5px;
  background: linear-gradient(45deg, #feda75, #d62976, #4f5bd5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--bg);
}

.story-name {
  font-size: 11px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 66px;
}
</style>
