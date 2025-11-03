// frontend/src/hooks/useSocketLogger.ts
import { io } from "socket.io-client";

const SOCKET_URL = `${import.meta.env.VITE_API_URL}/api/alerts/stream`;

export const useSocketLogger = () => {
  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 20000,
  });

  return socket;
};
