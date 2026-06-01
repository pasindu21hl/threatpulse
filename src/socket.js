import { io } from "socket.io-client";

const SOCKET_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
  ? window.location.origin
  : "http://localhost:8000";

// Export a single, configured Socket.IO client instance
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Allows us to control connection Lifecycle in React context
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 2000,
  transports: ["websocket", "polling"], // support both transport modes
});
