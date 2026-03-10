import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn()", () => {
  it("merges class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind classes — last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("returns empty string when no args", () => {
    expect(cn()).toBe("");
  });

  it("handles conditional objects", () => {
    expect(cn({ "bg-red-500": true, "bg-blue-500": false })).toBe("bg-red-500");
  });

  it("merges conditional and static classes", () => {
    const isActive = true;
    expect(cn("base", { active: isActive })).toBe("base active");
  });
});
