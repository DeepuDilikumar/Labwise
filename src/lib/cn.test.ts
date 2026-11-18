import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("keeps colour and custom size classes together", () => {
    expect(cn("text-primary-ink", "text-body")).toBe("text-primary-ink text-body");
    expect(cn("text-small", "text-lead")).toBe("text-lead");
    expect(cn("text-ink", "text-ok")).toBe("text-ok");
  });
});
