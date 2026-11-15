import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let blink;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/boards/blink.js");
  blink = window.Boards.blink;
});

describe("blink.simulate", () => {
  it("будує події вмикання/вимикання", () => {
    expect(blink.simulate({ onMs: 1000, offMs: 1000, durationMs: 3000 }).events).toEqual([
      { t: 0, state: 1 }, { t: 1000, state: 0 }, { t: 2000, state: 1 }, { t: 3000, state: 0 }
    ]);
  });
  it("відхиляє некоректні затримки", () => {
    for (const arg of [{ onMs: 0, offMs: 1000 }, { onMs: 1000, offMs: -5 }, { onMs: "abc", offMs: 1000 }]) {
      const r = blink.simulate(arg);
      expect(r.error).toBe("Затримка має бути додатним числом у мілісекундах.");
      expect(r.events).toEqual([]);
    }
  });
  it("обмежує кількість подій до 2000", () => {
    expect(blink.simulate({ onMs: 1, offMs: 1, durationMs: 60000 }).events.length).toBeLessThanOrEqual(2000);
  });
  it("тривалість за замовчуванням 5000 мс", () => {
    const ev = blink.simulate({ onMs: 1000, offMs: 1000 }).events;
    expect(ev[ev.length - 1].t).toBe(5000);
  });
});

describe("blink.isFlickerVisible", () => {
  it("межа 40 мс", () => {
    expect(blink.isFlickerVisible(39)).toBe(false);
    expect(blink.isFlickerVisible(40)).toBe(true);
    expect(blink.isFlickerVisible(41)).toBe(true);
  });
});

describe("blink.lintSketch / SKETCHES", () => {
  it("є 6 скетчів: 1 коректний і 5 з однією помилкою", () => {
    expect(blink.SKETCHES).toHaveLength(6);
    expect(blink.SKETCHES[0].expected).toEqual([]);
    blink.SKETCHES.slice(1).forEach(s => expect(s.expected).toHaveLength(1));
    const codes = blink.SKETCHES.slice(1).map(s => s.expected[0].code).sort();
    expect(codes).toEqual(["missing-semicolon", "no-pinmode", "same-state-twice", "serial-before-begin", "wrong-pinmode"]);
  });
  it("lintSketch відповідає expected для кожного скетчу", () => {
    blink.SKETCHES.forEach(s => expect(blink.lintSketch(s.code)).toEqual(s.expected));
  });
  it("коректний скетч дає []", () => {
    expect(blink.lintSketch(blink.SKETCHES[0].code)).toEqual([]);
  });
  it("MESSAGES містить усі коди", () => {
    expect(Object.keys(blink.MESSAGES)).toEqual(
      expect.arrayContaining(["no-pinmode", "wrong-pinmode", "same-state-twice", "missing-semicolon", "serial-before-begin"]));
  });
});
