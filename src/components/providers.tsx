"use client";
import { MotionConfig } from "motion/react";

/** reducedMotion="user": transform/opacity animations are skipped when the OS asks for less motion. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
