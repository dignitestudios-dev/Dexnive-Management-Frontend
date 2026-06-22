"use client";

import { useSocketContext } from "@/providers/socket-provider";

export function useSocket() {
  return useSocketContext();
}
