"use client";

import { useSyncExternalStore } from "react";

// Canonical hydration-safe "is mounted" hook via useSyncExternalStore.
// - Server snapshot: false
// - Client snapshot: true
// No setState-in-effect, no hydration mismatch.
const emptySubscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
