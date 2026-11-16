import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let rgb;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/boards/rgb.js");
  rgb = window.Boards.rgb;
});

describe("rgb", () => {
  it("PINS і clamp", () => {
    expect(rgb.PINS).toEqual({ r: 6, g: 3, b: 5 });
    expect(rgb.clamp(300)).toBe(255);
    expect(rgb.clamp(-5)).toBe(0);
    expect(rgb.clamp("7")).toBe(7);
    expect(rgb.clamp("abc")).toBe(0);
    expect(rgb.clamp(12.6)).toBe(13);
  });
  it("toCss", () => {
    expect(rgb.toCss({ r: 300, g: -1, b: "7" })).toBe("rgb(255, 0, 7)");
  });
  it("toSketch", () => {
    expect(rgb.toSketch({ r: 255, g: 128, b: 0 })).toBe("analogWrite(6, 255);\nanalogWrite(3, 128);\nanalogWrite(5, 0);");
    expect(rgb.toSketch({ r: 300, g: -1, b: "7" })).toBe("analogWrite(6, 255);\nanalogWrite(3, 0);\nanalogWrite(5, 7);");
  });
  it("TARGETS", () => {
    expect(rgb.TARGETS.length).toBe(5);
    expect(rgb.TARGETS[0].value).toEqual({ r: 255, g: 128, b: 0 });
    expect(rgb.TOLERANCE).toBe(40);
  });
  it("matches", () => {
    const orange = rgb.TARGETS[0];
    expect(rgb.matches(orange, { r: 230, g: 150, b: 30 })).toBe(true);
    expect(rgb.matches(orange, { r: 200, g: 150, b: 30 })).toBe(false);
  });
  it("hint", () => {
    const orange = rgb.TARGETS[0];
    expect(rgb.hint(orange, { r: 100, g: 128, b: 0 })).toContain("червон");
    expect(rgb.hint(orange, { r: 255, g: 128, b: 0 })).toBe("");
    expect(rgb.hint(orange, { r: 100, g: 128, b: 100 })).toBe("Більше червоного, менше синього");
  });
  it("dutyCycle", () => {
    expect(rgb.dutyCycle(64).percent).toBe("25 %");
    expect(rgb.dutyCycle(255).ratio).toBe(1);
    expect(rgb.dutyCycle(0).percent).toBe("0 %");
  });
});
