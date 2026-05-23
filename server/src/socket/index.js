import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/tokens.js";

export function setupSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.cookie
          ?.split(";")
          .find(c => c.trim().startsWith("accessToken="))
          ?.split("=")[1];

      if (token) {
        const payload = verifyAccessToken(token);
        socket.userId = payload.sub;
        socket.userRole = payload.role;
      }
    } catch {
      // unauthenticated socket — still allowed, just no userId
    }
    next();
  });

  io.on("connection", (socket) => {
    // Join user's private room for notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Issue rooms
    socket.on("issue:join",  (issueId) => socket.join(`issue:${issueId}`));
    socket.on("issue:leave", (issueId) => socket.leave(`issue:${issueId}`));

    socket.on("disconnect", () => {});
  });

  return io;
}

export function initSocket(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
    transports: ["websocket", "polling"],
  });

  return setupSocket(io);
}
