import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom type scale, otherwise `text-body` is mistaken
// for a colour and silently removes `text-primary-ink` etc.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["caption", "small", "body", "lead", "h3", "h2", "h1", "display", "display-lg", "value"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
