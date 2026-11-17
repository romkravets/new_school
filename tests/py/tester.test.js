import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import { loadScript } from "../helpers/load-script.js";

let T;
beforeAll(() => {
  const { window } = new JSDOM("<!doctype html><html></html>", { runScripts: "outside-only" });
  loadScript(window, "assets/py/tester.js");
  T = window.Py.tester;
});

describe("Py.tester", () => {
  it("breaks за брифом", () => {
    expect(T.breaks("leap", { year: 2000 })).toBe(true);
    expect(T.breaks("leap", { year: 2024 })).toBe(false);
    expect(T.breaks("max3", { a: 5, b: 5, c: 1 })).toBe(true);
    expect(T.breaks("max3", { a: 1, b: 2, c: 3 })).toBe(false);
    expect(T.breaks("fizzbuzz", { n: 15 })).toBe(true);
    expect(T.breaks("fizzbuzz", { n: 9 })).toBe(false);
    expect(T.breaks("discount", { age: 70, student: false })).toBe(true);
    expect(T.breaks("discount", { age: 30, student: false })).toBe(false);
    expect(T.breaks("nope", {})).toBe(false);
  });
  it("є щонайменше 4 програми з повною схемою", () => {
    expect(T.PROGRAMS.length).toBeGreaterThanOrEqual(4);
    ["leap", "max3", "fizzbuzz", "discount"].forEach((id) => expect(T.PROGRAMS.some((p) => p.id === id)).toBe(true));
    T.PROGRAMS.forEach((p) => {
      const lines = p.code.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(4);
      expect(lines.length).toBeLessThanOrEqual(10);
      expect(p.bugLine).toBeGreaterThanOrEqual(1);
      expect(p.bugLine).toBeLessThanOrEqual(lines.length);
      expect(p.why.length).toBeGreaterThan(10);
      expect(p.title).toBeTruthy();
      expect(p.vars.length).toBeGreaterThan(0);
      p.vars.forEach((v) => { expect(["int", "bool", "str"]).toContain(v.kind); expect(v.hint).toBeTruthy(); });
      expect(p.fixes).toHaveLength(3);
      expect(p.fixes.filter((f) => f.ok)).toHaveLength(1);
      p.fixes.forEach((f) => { expect(f.line).toBeTruthy(); expect(f.why).toBeTruthy(); });
    });
  });
  it("є вхід, на якому програма ламається, і вхід, на якому ні", () => {
    const samples = {
      leap: [{ year: 2000 }, { year: 2023 }],
      max3: [{ a: 3, b: 3, c: 1 }, { a: 1, b: 2, c: 3 }],
      fizzbuzz: [{ n: 30 }, { n: 7 }],
      discount: [{ age: 70, student: false }, { age: 20, student: false }],
    };
    T.PROGRAMS.forEach((p) => {
      const [bad, good] = samples[p.id];
      expect(p.buggy(bad)).not.toBe(p.correct(bad));
      expect(p.buggy(good)).toBe(p.correct(good));
      expect(typeof p.buggy(good)).toBe("string");
    });
  });
});
