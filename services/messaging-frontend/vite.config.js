import http from "node:http";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

// Backend-эндпоинт GET /api/message/getChatMessages валидирует chat_id
// через req.body, но реальные браузеры (проверено в Chrome через XHR)
// молча вырезают тело у GET-запроса — до сервера долетает пустой body.
// curl и Node такое тело шлют нормально, поэтому оборачиваем запрос
// в dev-мидлварь: браузер бьёт по /dev-proxy/get-chat-messages?chat_id=..
// (обычный GET без тела), а сюда, уже из Node, летит GET с телом.
// Работает только в `vite dev`; не трогает и не заменяет сам сервер.
function getChatMessagesDevProxy(apiBaseUrl) {
  return {
    name: "get-chat-messages-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/dev-proxy/get-chat-messages", (req, res) => {
        const url = new URL(req.url, "http://internal");
        const chatId = Number(url.searchParams.get("chat_id"));
        const target = new URL(`${apiBaseUrl}/message/getChatMessages`);
        const body = JSON.stringify({ chat_id: chatId });

        const proxyReq = http.request(
          {
            hostname: target.hostname,
            port: target.port,
            path: target.pathname,
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
              // authenticateToken теперь требует Bearer-токен на всех REST-роутах
              ...(req.headers.authorization
                ? { Authorization: req.headers.authorization }
                : {}),
            },
          },
          (proxyRes) => {
            res.statusCode = proxyRes.statusCode;
            proxyRes.pipe(res);
          },
        );
        proxyReq.on("error", (err) => {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: err.message }));
        });
        proxyReq.write(body);
        proxyReq.end();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://localhost:3000/api";

  return {
    plugins: [vue(), getChatMessagesDevProxy(apiBaseUrl)],
  };
});
