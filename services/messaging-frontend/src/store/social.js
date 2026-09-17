import { reactive, watch, computed } from "vue";
import { auth } from "./auth";

// Всё в этом файле — фейковые данные чисто для фронтенд-демонстрации
// "как выглядела бы соц. сеть". Никакого бэкенда за этим нет, всё живёт
// в localStorage. Реальный мессенджер (chats/messages) эту стору не трогает.
const STORAGE_KEY = "msg_frontend_social_v1";

const FIRST_NAMES = ["Аня", "Игорь", "Мария", "Дмитрий", "Олеся", "Никита", "Катя", "Саша", "Полина", "Влад"];
const LAST_NAMES = ["Смирнова", "Волков", "Кузнецова", "Соколов", "Попова", "Лебедев", "Новикова", "Морозов", "Егорова", "Титов"];
const BIOS = [
  "Живу и радуюсь ✨",
  "Люблю путешествия ✈️ и кофе ☕",
  "Фотограф-любитель 📷",
  "Кофе и код целыми днями",
  "Просто хороший человек",
  "Горы > море",
  "Собираю пластинки 🎵",
  "Учусь готовить рамен",
  "UX/UI, кошки, чай",
  "На связи почти всегда",
];
const CAPTIONS = [
  "Такой вот вечер 🌇",
  "Немного солнца в холодный день ☀️",
  "Новый день — новые возможности",
  "Это было незабываемо",
  "Просто хотелось поделиться",
  "Лучшая компания на свете",
  "Планы на выходные ✔️",
  "Как вам?",
  "Давно не выкладывал(а) ничего",
  "Мелочи, которые радуют",
];
const COMMENTS_POOL = [
  "Огонь! 🔥",
  "Красота!",
  "Вот это кадр 👏",
  "Где это?",
  "Соскучилась по тебе",
  "Обожаю это место",
  "Топ 💯",
  "Заберу себе идею",
  "Класс!",
  "❤️❤️❤️",
];

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// юзернеймы в стиле популярных соц. сетей — латиница, без кириллицы в URL
function toUsername(str) {
  return str
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9_.]/g, "");
}

function seedRng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildSeed() {
  const rand = seedRng(42);
  const users = FIRST_NAMES.map((first, i) => {
    const last = LAST_NAMES[i];
    const id = "u" + (i + 1);
    return {
      id,
      username: toUsername(first + "." + last),
      name: `${first} ${last}`,
      avatar: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
      bio: BIOS[i % BIOS.length],
      followers: 80 + Math.floor(rand() * 900),
      following: 40 + Math.floor(rand() * 300),
      followedByMe: rand() > 0.4,
    };
  });

  const posts = [];
  let postId = 1;
  const now = Date.now();
  users.forEach((u, ui) => {
    const count = 3 + Math.floor(rand() * 6);
    for (let i = 0; i < count; i++) {
      const commentCount = Math.floor(rand() * 4);
      const comments = [];
      for (let c = 0; c < commentCount; c++) {
        const commenter = users[Math.floor(rand() * users.length)];
        comments.push({
          id: `c${postId}-${c}`,
          userId: commenter.id,
          text: COMMENTS_POOL[Math.floor(rand() * COMMENTS_POOL.length)],
        });
      }
      posts.push({
        id: "p" + postId,
        userId: u.id,
        image: `https://picsum.photos/seed/social${ui}-${i}/700/700`,
        caption: CAPTIONS[Math.floor(rand() * CAPTIONS.length)],
        likes: 5 + Math.floor(rand() * 400),
        likedByMe: rand() > 0.6,
        savedByMe: rand() > 0.85,
        comments,
        createdAt: now - Math.floor(rand() * 20) * 86400000 - postId * 3600000,
      });
      postId++;
    }
  });

  return { users, posts };
}

function defaultMe() {
  const email = auth.payload?.email || "you@example.com";
  const local = email.split("@")[0] || "you";
  return {
    id: "me",
    username: local.replace(/[^a-z0-9_.]/gi, "").toLowerCase() || "me",
    name: "Вы",
    avatar: `https://ui-avatars.com/api/?background=3390ec&color=fff&name=${encodeURIComponent(local)}`,
    bio: "",
    website: "",
    private: false,
    followers: 12,
    following: 34,
  };
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.users || !parsed?.posts || !parsed?.me) return null;
    return parsed;
  } catch {
    return null;
  }
}

const saved = restore();
const seed = saved ? { users: saved.users, posts: saved.posts } : buildSeed();

export const social = reactive({
  me: saved?.me || defaultMe(),
  users: seed.users,
  posts: seed.posts,
  createPostOpen: false,
});

watch(
  social,
  () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ me: social.me, users: social.users, posts: social.posts }),
    );
  },
  { deep: true },
);

export function userById(id) {
  if (id === "me") return social.me;
  return social.users.find((u) => u.id === id) || null;
}

export function userByUsername(username) {
  if (social.me.username === username) return social.me;
  return social.users.find((u) => u.username === username) || null;
}

export const feedPosts = computed(() =>
  [...social.posts].sort((a, b) => b.createdAt - a.createdAt),
);

export function postsByUser(userId) {
  return social.posts
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function savedPosts() {
  return social.posts
    .filter((p) => p.savedByMe)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function toggleLike(postId) {
  const post = social.posts.find((p) => p.id === postId);
  if (!post) return;
  post.likedByMe = !post.likedByMe;
  post.likes += post.likedByMe ? 1 : -1;
}

export function toggleSave(postId) {
  const post = social.posts.find((p) => p.id === postId);
  if (!post) return;
  post.savedByMe = !post.savedByMe;
}

export function addComment(postId, text) {
  const value = text.trim();
  if (!value) return;
  const post = social.posts.find((p) => p.id === postId);
  if (!post) return;
  post.comments.push({ id: "c" + Date.now(), userId: "me", text: value });
}

export function toggleFollow(userId) {
  const u = social.users.find((x) => x.id === userId);
  if (!u) return;
  u.followedByMe = !u.followedByMe;
  u.followers += u.followedByMe ? 1 : -1;
}

export function createPost({ image, caption }) {
  social.posts.unshift({
    id: "p" + Date.now(),
    userId: "me",
    image,
    caption: caption || "",
    likes: 0,
    likedByMe: false,
    savedByMe: false,
    comments: [],
    createdAt: Date.now(),
  });
}

export function updateMe(patch) {
  Object.assign(social.me, patch);
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} д`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед`;
  const months = Math.floor(days / 30);
  return `${months} мес`;
}
