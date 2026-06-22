import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

export const socket: Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: (cb) => {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("auth-token")
        : null;
      cb({ token });
    },
  }
);
