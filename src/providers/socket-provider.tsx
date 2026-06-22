"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import { useAppSelector } from "@/store";

interface SocketContextValue {
  socket: typeof socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((state) => !!state.auth.accessToken);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket.connected) socket.disconnect();
      return;
    }
    socket.connect();
    socket.on(SOCKET_EVENTS.CONNECT, () => setIsConnected(true));
    socket.on(SOCKET_EVENTS.DISCONNECT, () => setIsConnected(false));
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, () => setIsConnected(false));

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT);
      socket.off(SOCKET_EVENTS.DISCONNECT);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used inside <SocketProvider>");
  return ctx;
}
