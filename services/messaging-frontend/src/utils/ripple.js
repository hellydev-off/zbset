// Приглушённый ripple-эффект для кликабельных строк/кнопок.
// Элемент, на который вешается @mousedown="ripple", должен иметь
// position:relative и overflow:hidden в CSS.
export function ripple(event) {
  const el = event.currentTarget;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement("span");
  span.className = "ripple-span";
  span.style.width = span.style.height = `${size}px`;
  span.style.left = `${event.clientX - rect.left - size / 2}px`;
  span.style.top = `${event.clientY - rect.top - size / 2}px`;
  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove(), { once: true });
}
