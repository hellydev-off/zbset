import { reactive } from "vue";

const STORAGE_KEY = "msg_frontend_theme"; // "light" | "dark" | "system"

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export const theme = reactive({
  mode: readStored(),
});

function apply() {
  const root = document.documentElement;
  if (theme.mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme.mode);
  }
}

apply();

export function setThemeMode(mode) {
  theme.mode = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто не сохраняем
  }
  apply();
}
