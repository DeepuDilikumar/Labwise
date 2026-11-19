"use client";
import { MotionConfig } from "motion/react";
import * as React from "react";

/** reducedMotion="user": transform/opacity animations are skipped when the OS asks for less motion. */
export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
