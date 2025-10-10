// frontend/src/hooks/useSocketLogger.ts
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000/api/alerts/stream";

export const useSocketLogger = () => {
  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 20000, // 20 seconds
  });

  socket.on("connect", () => {
    console.log("[SocketLogger] ✅ Connected to backend socket:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("[SocketLogger] ⚠️ Disconnected:", reason);
  });

  socket.onAny((event, ...args) => {
    console.log("[SocketLogger] 📡 Event received:", event, args);
  });
  socket.io.on("ping", () => console.log("[SocketLogger] 🔁 Ping received"));
  socket.on("pong", (latency) => console.log("[SocketLogger] 🔁 Pong latency:", latency, "ms"));


  return socket;
};
