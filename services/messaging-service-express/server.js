import { createServer } from "http";
import { createApp } from "./app.js";
import { initSocket } from "./sockets/index.js";

const app = createApp();
const httpServer = createServer(app);
initSocket(httpServer);
const io = initSocket(httpServer);
app.set("io", io);

httpServer.listen(3000, () => console.log("running on 3000"));
