<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
});
</script>

<template>
  <svg
    v-if="name === 'search'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="20" y1="20" x2="15.5" y2="15.5" />
  </svg>

  <svg
    v-else-if="name === 'sun'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="4.5" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="4.2" y1="4.2" x2="5.9" y2="5.9" />
    <line x1="18.1" y1="18.1" x2="19.8" y2="19.8" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="4.2" y1="19.8" x2="5.9" y2="18.1" />
    <line x1="18.1" y1="5.9" x2="19.8" y2="4.2" />
  </svg>

  <svg
    v-else-if="name === 'moon'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
  </svg>

  <svg
    v-else-if="name === 'monitor'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>

  <svg
    v-else-if="name === 'mic'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="9" y="2.5" width="6" height="12" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
    <line x1="12" y1="17.5" x2="12" y2="21.5" />
    <line x1="8" y1="21.5" x2="16" y2="21.5" />
  </svg>

  <svg
    v-else-if="name === 'reply'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 19v-3a4 4 0 0 0-4-4H4" />
  </svg>

  <svg
    v-else-if="name === 'pencil'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 20h8" />
    <path
      d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
    />
  </svg>

  <svg
    v-else-if="name === 'pin'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6Z" />
    <line x1="12" y1="15" x2="12" y2="21" />
  </svg>

  <svg
    v-else-if="name === 'x'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>

  <svg
    v-else-if="name === 'trash'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
  </svg>

  <svg
    v-else-if="name === 'copy'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>

  <svg
    v-else-if="name === 'check'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="4 12.5 9.5 18 20 6" />
  </svg>

  <svg
    v-else-if="name === 'check-double'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="1 12.5 6.5 18 15 8" />
    <polyline points="9 12.5 14.5 18 23 6" />
  </svg>

  <svg
    v-else-if="name === 'chevron-down'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>

  <svg
    v-else-if="name === 'send'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M3 11.5 20.5 3 12 20.5l-2.2-6.8L3 11.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none" />
  </svg>

  <svg
    v-else-if="name === 'phone'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M6.5 3h3l1.5 4-2 1.8a12 12 0 0 0 6.2 6.2l1.8-2 4 1.5v3a2 2 0 0 1-2.2 2 18 18 0 0 1-14.3-14.3A2 2 0 0 1 6.5 3Z"
    />
  </svg>

  <svg
    v-else-if="name === 'more-horizontal'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>

  <svg
    v-else-if="name === 'arrow-left'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="11 6 5 12 11 18" />
  </svg>

  <svg
    v-else-if="name === 'paperclip'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M20 12.5 11.3 21a4.5 4.5 0 0 1-6.4-6.4l9-9a3 3 0 0 1 4.2 4.2l-8.6 8.6a1.5 1.5 0 0 1-2.1-2.1l7.2-7.2"
    />
  </svg>

  <svg
    v-else-if="name === 'smile'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" />
    <line x1="9" y1="9.5" x2="9" y2="9.51" />
    <line x1="15" y1="9.5" x2="15" y2="9.51" />
  </svg>

  <svg
    v-else-if="name === 'logout'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>

  <svg
    v-else-if="name === 'image'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="M21 15.5 15.5 10 6 19.5" />
  </svg>

  <svg
    v-else-if="name === 'camera'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <circle cx="12" cy="13" r="3.6" />
  </svg>

  <svg
    v-else-if="name === 'file-text'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6.5 2.5h8l4 4v13a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5.5 19.5v-15A1.5 1.5 0 0 1 6.5 2.5Z" />
    <path d="M14 2.5V7h4.5" />
    <line x1="8.5" y1="12" x2="15.5" y2="12" />
    <line x1="8.5" y1="15.5" x2="15.5" y2="15.5" />
  </svg>

  <svg
    v-else-if="name === 'music'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M9 18V5.5l10-2V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>

  <svg
    v-else-if="name === 'download'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 3v12" />
    <polyline points="7 10.5 12 15.5 17 10.5" />
    <path d="M4.5 18.5h15" />
  </svg>

  <svg
    v-else-if="name === 'home'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-6h3v6H17a1 1 0 0 0 1-1V10" />
  </svg>

  <svg
    v-else-if="name === 'user'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
  </svg>

  <svg
    v-else-if="name === 'heart'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 20.3S3.5 15.2 3.5 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.4c0 5.8-8.5 10.9-8.5 10.9Z" />
  </svg>

  <svg
    v-else-if="name === 'heart-filled'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M12 20.3S3.5 15.2 3.5 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.4c0 5.8-8.5 10.9-8.5 10.9Z" />
  </svg>

  <svg
    v-else-if="name === 'message-circle'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3.5 12a8.5 8.5 0 1 1 3.4 6.8L3.5 20.5l1.3-3.8A8.4 8.4 0 0 1 3.5 12Z" />
  </svg>

  <svg
    v-else-if="name === 'bookmark'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6 3.5h12v17l-6-4-6 4Z" />
  </svg>

  <svg
    v-else-if="name === 'bookmark-filled'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M6 3.5h12v17l-6-4-6 4Z" />
  </svg>

  <svg
    v-else-if="name === 'plus-square'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>

  <svg
    v-else-if="name === 'grid'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1.3" />
    <rect x="14" y="3" width="7" height="7" rx="1.3" />
    <rect x="3" y="14" width="7" height="7" rx="1.3" />
    <rect x="14" y="14" width="7" height="7" rx="1.3" />
  </svg>

  <svg
    v-else-if="name === 'settings'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="3.2" />
    <path
      d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"
    />
  </svg>

  <svg
    v-else-if="name === 'globe'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <path d="M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9Z" />
  </svg>

  <svg
    v-else-if="name === 'forward'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="15 10 20 15 15 20" />
    <path d="M4 5v3a4 4 0 0 0 4 4h12" />
  </svg>

  <svg
    v-else-if="name === 'bell'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>

  <svg
    v-else-if="name === 'palette'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 3a9 8.5 0 1 0 0 17c1.1 0 1.7-.9 1.2-1.8-.3-.5-.1-1.2.5-1.4.6-.2 1.3 0 1.8.4.6.4 1.4.2 1.7-.4A8.7 8.7 0 0 0 12 3Z" />
    <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none" />
  </svg>

  <svg
    v-else-if="name === 'lock'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </svg>

  <svg
    v-else-if="name === 'plug'"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M9 7 4 12l3 3" />
    <path d="M15 7l5 5-3 3" />
    <line x1="9" y1="17" x2="5" y2="21" />
    <line x1="17" y1="7" x2="21" y2="3" />
    <line x1="7" y1="9" x2="15" y2="17" />
  </svg>
</template>

<style scoped>
svg {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
